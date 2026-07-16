"""
AeroMocap ROS — Health API Blueprint
======================================
GET /api/health — Returns current system status as JSON.

No upstream code is derived here — original to AeroMocap ROS.
"""

from __future__ import annotations

import time
from typing import TYPE_CHECKING

from flask import Blueprint, jsonify

if TYPE_CHECKING:
    from core.simulation_engine import SimulationEngine

health_bp = Blueprint("health", __name__)

# Injected by app.py at startup
_engine: "SimulationEngine | None" = None
_start_time: float = time.time()


def init_health(engine: "SimulationEngine") -> None:
    """Register the simulation engine so health can query it."""
    global _engine, _start_time
    _engine = engine
    _start_time = time.time()


@health_bp.route("/api/health", methods=["GET"])
def get_health():
    """
    Returns a JSON health snapshot of the AeroMocap ROS system.

    Example response:
    {
        "status": "running",
        "mode": "simulation",
        "cameras_connected": 0,
        "tracking_active": true,
        "tracked_objects": 1,
        "fps": 60.0,
        "latency_ms": 8.4,
        "ros2_connected": false,
        "px4_connected": false,
        "uptime_s": 42.1,
        "dropped_frames": 0,
        "version": "1.0.0"
    }
    """
    from config import get_config
    cfg = get_config()

    fps = _engine.current_fps if _engine else 0.0
    latency = _engine.latency_ms if _engine else 0.0
    tracking_active = _engine.is_running if _engine else False
    dropped = _engine.dropped_frames if _engine else 0
    uptime = round(time.time() - _start_time, 1)

    return jsonify({
        "status": "running" if tracking_active else "idle",
        "mode": cfg.mode,
        "cameras_connected": 0 if cfg.mode == "simulation" else -1,
        "tracking_active": tracking_active,
        "tracked_objects": 1 if tracking_active else 0,
        "fps": round(fps, 1),
        "latency_ms": round(latency, 2),
        "ros2_connected": cfg.ros2.enabled,
        "px4_connected": cfg.px4.enabled,
        "uptime_s": uptime,
        "dropped_frames": dropped,
        "filter": cfg.tracking.filter,
        "version": "1.0.0",
        "project": "AeroMocap ROS",
    })
