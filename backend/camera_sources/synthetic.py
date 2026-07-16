"""
AeroMocap ROS — Synthetic Camera Source
=========================================
Generates synthetic camera frames and 2D projections from a virtual 3D scene.
Enables full system testing without any physical hardware.

No upstream code is derived here — original to AeroMocap ROS.
"""

from __future__ import annotations

import time
import math
import threading
from typing import Optional

import numpy as np
import cv2 as cv

from .base import CameraSource, CameraMetadata


class SyntheticCameraSource(CameraSource):
    """
    A virtual camera source that renders a synthetic 3D scene onto a 2D frame.

    - Renders a dark frame with a bright dot at the projected position of the
      tracked synthetic object.
    - Used in SIMULATION MODE for full pipeline testing with zero hardware.
    - Each synthetic camera has a unique pose (position + orientation) so
      multi-view triangulation produces a plausible 3D estimate.
    """

    def __init__(self, camera_id: str, camera_pose: dict,
                 intrinsic_matrix: np.ndarray,
                 fps: int = 60, width: int = 640, height: int = 480,
                 noise_px: float = 0.5):
        """
        Args:
            camera_id:        Unique identifier, e.g. "CAM-SYN-01"
            camera_pose:      {"R": 3x3 ndarray, "t": (3,1) ndarray} — world-to-camera
            intrinsic_matrix: 3x3 camera intrinsic matrix K
            fps:              Target frame rate
            width, height:    Frame dimensions
            noise_px:         Gaussian noise (pixels) added to projected point
        """
        super().__init__(camera_id=camera_id, fps=fps, width=width, height=height)
        self.camera_pose = camera_pose
        self.K = intrinsic_matrix
        self.noise_px = noise_px
        self._lock = threading.Lock()
        self._current_object_world_pos: Optional[np.ndarray] = None
        self._last_frame_time = 0.0
        self._latency_ms = 0.0
        self._dropped = 0

    def open(self) -> None:
        self._is_open = True

    def set_object_position(self, pos: np.ndarray) -> None:
        """Update the tracked object's world-space position (called by tracking engine)."""
        with self._lock:
            self._current_object_world_pos = pos

    def read(self) -> Optional[np.ndarray]:
        t0 = time.perf_counter()

        frame = np.zeros((self.height, self.width, 3), dtype=np.uint8)
        # Subtle grid overlay for visual context
        for x in range(0, self.width, 40):
            cv.line(frame, (x, 0), (x, self.height), (15, 20, 25), 1)
        for y in range(0, self.height, 40):
            cv.line(frame, (0, y), (self.width, y), (15, 20, 25), 1)

        # Camera label
        cv.putText(frame, self.camera_id, (8, 20),
                   cv.FONT_HERSHEY_SIMPLEX, 0.45, (50, 80, 60), 1)

        with self._lock:
            pos = self._current_object_world_pos

        if pos is not None:
            px = self._project_point(pos)
            if px is not None:
                cx, cy = int(round(px[0])), int(round(px[1]))
                # Draw bright marker dot (simulating LED)
                cv.circle(frame, (cx, cy), 6, (139, 255, 77), -1)
                cv.circle(frame, (cx, cy), 9, (100, 200, 60), 1)

        self._latency_ms = (time.perf_counter() - t0) * 1000
        self._last_frame_time = time.time()
        return frame

    def _project_point(self, world_pos: np.ndarray) -> Optional[np.ndarray]:
        """Project a 3D world point through the synthetic camera."""
        R = np.array(self.camera_pose["R"], dtype=np.float64)
        t = np.array(self.camera_pose["t"], dtype=np.float64).reshape(3, 1)
        p_world = world_pos.reshape(3, 1)
        p_cam = R @ p_world + t

        if p_cam[2, 0] <= 0:
            return None  # Behind camera

        p_img, _ = cv.projectPoints(
            p_cam.T, np.zeros(3), np.zeros(3),
            self.K, np.zeros(4)
        )
        px = p_img[0, 0, :]

        # Add pixel noise
        if self.noise_px > 0:
            px = px + np.random.normal(0, self.noise_px, 2)

        # Bounds check
        if 0 <= px[0] < self.width and 0 <= px[1] < self.height:
            return px
        return None

    def get_image_point(self, world_pos: np.ndarray) -> Optional[list]:
        """
        Return the projected 2D image coordinate for a given world position.
        Used by the tracking engine for synthetic triangulation ground truth.
        Returns [x, y] or None if out of frame / behind camera.
        """
        px = self._project_point(world_pos)
        if px is None:
            return None
        return [float(px[0]), float(px[1])]

    def get_metadata(self) -> CameraMetadata:
        return CameraMetadata(
            camera_id=self.camera_id,
            source_type="synthetic",
            fps=float(self.fps),
            width=self.width,
            height=self.height,
            exposure=0.0,
            gain=0.0,
            is_open=self._is_open,
            dropped_frames=self._dropped,
            latency_ms=self._latency_ms,
        )

    def close(self) -> None:
        self._is_open = False
