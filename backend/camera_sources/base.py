"""
AeroMocap ROS — Camera Source Base Class
==========================================
Defines the CameraSource abstract interface that all camera backends implement.

No upstream code is derived here — original to AeroMocap ROS.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional
import numpy as np


@dataclass
class CameraMetadata:
    """Runtime metadata for a camera source."""
    camera_id: str
    source_type: str            # "ps3eye" | "usb" | "video_file" | "synthetic"
    fps: float
    width: int
    height: int
    exposure: float
    gain: float
    is_open: bool
    dropped_frames: int
    latency_ms: float


class CameraSource(ABC):
    """
    Abstract base class for all camera sources in AeroMocap ROS.

    Subclasses must implement:
        open()         — Acquire hardware/file/simulation resource
        read()         — Return one BGR frame as numpy ndarray, or None on failure
        get_metadata() — Return current CameraMetadata snapshot
        close()        — Release all resources

    Threading note: read() may be called from a background thread.
    All subclasses must be thread-safe for read() calls.
    """

    def __init__(self, camera_id: str, fps: int = 60,
                 width: int = 640, height: int = 480):
        self.camera_id = camera_id
        self.fps = fps
        self.width = width
        self.height = height
        self._is_open = False
        self._dropped_frames = 0

    @abstractmethod
    def open(self) -> None:
        """Open / initialize the camera source. Raises RuntimeError on failure."""
        ...

    @abstractmethod
    def read(self) -> Optional[np.ndarray]:
        """
        Read one frame.
        Returns BGR numpy array (H, W, 3) or None if frame unavailable.
        Must not block for more than 2 * (1/fps) seconds.
        """
        ...

    @abstractmethod
    def get_metadata(self) -> CameraMetadata:
        """Return a snapshot of current camera state."""
        ...

    @abstractmethod
    def close(self) -> None:
        """Release all resources."""
        ...

    @property
    def is_open(self) -> bool:
        return self._is_open

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(id={self.camera_id}, open={self._is_open})"
