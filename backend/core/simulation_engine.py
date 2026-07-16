"""
AeroMocap ROS — Simulation Tracking Engine
============================================
Generates a synthetic 3D trajectory and emits pose data via Socket.IO.

Trajectory (per Phase 3 spec):
    x(t) = cos(t * speed)
    y(t) = sin(t * speed)
    z(t) = 1.5 + 0.3 * sin(0.5 * t * speed)

This module is entirely hardware-independent and runs in SIMULATION MODE.
No upstream code is derived here — original to AeroMocap ROS.
"""

from __future__ import annotations

import math
import time
import threading
import logging
from dataclasses import dataclass, field
from typing import Optional, List

import numpy as np

from config import AppConfig

logger = logging.getLogger("aeromocap.simulation")


@dataclass
class TrackedObject:
    """Represents one tracked object's state."""
    object_id: int
    position: np.ndarray          # [x, y, z] in metres
    velocity: np.ndarray          # [vx, vy, vz] in m/s
    confidence: float             # 0.0 – 1.0
    heading: float                # radians
    filter_type: str              # "none" | "lowpass" | "kalman"
    reprojection_error: float     # pixels


@dataclass
class SimulationState:
    """Snapshot of the full simulation state for Socket.IO emission."""
    t: float
    tracked_objects: List[TrackedObject] = field(default_factory=list)
    fps: float = 0.0
    latency_ms: float = 0.0
    mode: str = "simulation"
    cameras_connected: int = 0
    tracking_active: bool = False
    ros2_connected: bool = False
    px4_connected: bool = False
    dropped_frames: int = 0


class SimulationEngine:
    """
    Runs the simulation loop in a background daemon thread.

    Emits via Socket.IO:
        "object-points"  — position, velocity, confidence per frame
        "fps"            — current loop FPS every 10 frames
        "system-status"  — full system health snapshot every second
    """

    def __init__(self, config: AppConfig, socketio):
        self._config = config
        self._socketio = socketio
        self._running = False
        self._thread: Optional[threading.Thread] = None
        self._lock = threading.Lock()

        # Simulation time origin
        self._start_time = 0.0

        # Diagnostics
        self._frame_count = 0
        self._dropped_frames = 0
        self._last_fps_time = 0.0
        self._current_fps = 0.0
        self._latency_ms = 0.0

        # Filter state (simple exponential smoothing for simulation mode)
        self._prev_pos: Optional[np.ndarray] = None
        self._prev_vel: Optional[np.ndarray] = None
        self._alpha = 0.15   # Low-pass smoothing factor

    # ──────────────────────────────────────────────────────────────────────────
    # Public API
    # ──────────────────────────────────────────────────────────────────────────

    def start(self) -> None:
        with self._lock:
            if self._running:
                return
            self._running = True
            self._start_time = time.time()
            self._frame_count = 0
            self._dropped_frames = 0
            self._last_fps_time = time.time()
            self._prev_pos = None
            self._prev_vel = None
            self._thread = threading.Thread(
                target=self._loop,
                name="aeromocap-sim-engine",
                daemon=True
            )
            self._thread.start()
            logger.info("Simulation engine started.")

    def stop(self) -> None:
        with self._lock:
            self._running = False
        if self._thread:
            self._thread.join(timeout=2.0)
            self._thread = None
        logger.info("Simulation engine stopped.")

    @property
    def is_running(self) -> bool:
        return self._running

    @property
    def current_fps(self) -> float:
        return self._current_fps

    @property
    def latency_ms(self) -> float:
        return self._latency_ms

    @property
    def dropped_frames(self) -> int:
        return self._dropped_frames

    # ──────────────────────────────────────────────────────────────────────────
    # Trajectory Generator
    # ──────────────────────────────────────────────────────────────────────────

    def _compute_position(self, t: float) -> np.ndarray:
        """
        Compute synthetic object position at time t.

        Primary trajectory (circular_helix):
            x = cos(t * speed)
            y = sin(t * speed)
            z = 1.5 + 0.3 * sin(0.5 * t * speed)
        """
        speed = self._config.simulation.speed
        noise_sigma = self._config.simulation.noise

        trajectory = self._config.simulation.trajectory
        if trajectory == "circular_helix":
            x = math.cos(t * speed)
            y = math.sin(t * speed)
            z = 1.5 + 0.3 * math.sin(0.5 * t * speed)
        elif trajectory == "lissajous":
            x = 0.8 * math.cos(t * speed)
            y = 0.8 * math.sin(2 * t * speed + math.pi / 4)
            z = 1.5 + 0.4 * math.cos(3 * t * speed)
        elif trajectory == "random_walk":
            # Bounded random walk — not truly random each call,
            # uses a seeded perturbation from t
            rng = np.random.default_rng(int(t * 100) % (2**31))
            x = np.clip(math.cos(t * 0.3 * speed) + rng.normal(0, 0.05), -1.5, 1.5)
            y = np.clip(math.sin(t * 0.3 * speed) + rng.normal(0, 0.05), -1.5, 1.5)
            z = np.clip(1.5 + rng.normal(0, 0.05), 0.2, 3.0)
        else:
            x = math.cos(t * speed)
            y = math.sin(t * speed)
            z = 1.5 + 0.3 * math.sin(0.5 * t * speed)

        # Add configurable noise
        if noise_sigma > 0:
            noise = np.random.normal(0, noise_sigma, 3)
        else:
            noise = np.zeros(3)

        return np.array([x, y, z]) + noise

    def _compute_velocity(self, pos: np.ndarray, dt: float) -> np.ndarray:
        """Finite-difference velocity from successive positions."""
        if self._prev_pos is None or dt <= 0:
            return np.zeros(3)
        raw_vel = (pos - self._prev_pos) / dt
        # Apply exponential smoothing
        if self._prev_vel is None:
            return raw_vel
        return self._alpha * raw_vel + (1 - self._alpha) * self._prev_vel

    # ──────────────────────────────────────────────────────────────────────────
    # Main Loop
    # ──────────────────────────────────────────────────────────────────────────

    def _loop(self) -> None:
        target_fps = self._config.cameras.fps
        frame_interval = 1.0 / target_fps
        last_frame_time = time.perf_counter()
        last_status_emit = time.time()

        while self._running:
            t_loop_start = time.perf_counter()

            # ── Timing control ───────────────────────────────────────────────
            elapsed_since_last = t_loop_start - last_frame_time
            if elapsed_since_last < frame_interval:
                time.sleep(frame_interval - elapsed_since_last)

            t_now = time.perf_counter()
            dt = t_now - last_frame_time
            last_frame_time = t_now

            # ── Simulation time ──────────────────────────────────────────────
            sim_t = time.time() - self._start_time

            # ── Compute pose ─────────────────────────────────────────────────
            t_compute = time.perf_counter()
            pos = self._compute_position(sim_t)
            vel = self._compute_velocity(pos, dt)
            self._prev_pos = pos.copy()
            self._prev_vel = vel.copy()

            # Synthetic heading from velocity XY direction
            heading = math.atan2(float(vel[1]), float(vel[0])) if np.linalg.norm(vel[:2]) > 0.001 else 0.0

            # Synthetic confidence: 1.0 minus small noise
            confidence = max(0.0, min(1.0, 0.975 + np.random.normal(0, 0.005)))

            # Synthetic reprojection error (simulated)
            reprojection_error = max(0.0, 0.8 + np.random.normal(0, 0.1))

            self._latency_ms = (time.perf_counter() - t_compute) * 1000

            # ── FPS tracking ─────────────────────────────────────────────────
            self._frame_count += 1
            if dt > 0:
                instant_fps = 1.0 / dt
                self._current_fps = 0.9 * self._current_fps + 0.1 * instant_fps

            # ── Emit object-points (every frame) ────────────────────────────
            try:
                self._socketio.emit("object-points", {
                    "object_points": [pos.tolist()],
                    "errors": [reprojection_error],
                    "objects": [{
                        "pos": pos.tolist(),
                        "vel": vel.tolist(),
                        "heading": heading,
                        "droneIndex": 0,
                        "confidence": confidence,
                        "object_id": 0,
                        "filter": self._config.tracking.filter,
                        "reprojection_error": reprojection_error,
                    }],
                    "filtered_objects": [{
                        "pos": pos.tolist(),
                        "vel": vel.tolist(),
                        "heading": heading,
                        "droneIndex": 0,
                        "confidence": confidence,
                        "object_id": 0,
                        "filter": self._config.tracking.filter,
                    }],
                    "timestamp": sim_t,
                    "mode": "simulation",
                })
            except Exception as exc:
                logger.warning(f"Socket.IO emit error (object-points): {exc}")
                self._dropped_frames += 1

            # ── Emit FPS every 10 frames ─────────────────────────────────────
            if self._frame_count % 10 == 0:
                try:
                    self._socketio.emit("fps", {
                        "fps": round(self._current_fps, 1),
                        "latency_ms": round(self._latency_ms, 2),
                        "dropped_frames": self._dropped_frames,
                    })
                except Exception as exc:
                    logger.warning(f"Socket.IO emit error (fps): {exc}")

            # ── Emit system-status every second ──────────────────────────────
            now = time.time()
            if now - last_status_emit >= 1.0:
                last_status_emit = now
                try:
                    self._socketio.emit("system-status", {
                        "status": "running",
                        "mode": self._config.mode,
                        "cameras_connected": 0,
                        "tracking_active": True,
                        "tracked_objects": 1,
                        "fps": round(self._current_fps, 1),
                        "latency_ms": round(self._latency_ms, 2),
                        "dropped_frames": self._dropped_frames,
                        "ros2_connected": self._config.ros2.enabled,
                        "px4_connected": self._config.px4.enabled,
                        "filter": self._config.tracking.filter,
                        "uptime_s": round(now - self._start_time, 1),
                    })
                except Exception as exc:
                    logger.warning(f"Socket.IO emit error (system-status): {exc}")
