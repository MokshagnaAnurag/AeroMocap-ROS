"""
AeroMocap ROS — Cameras API Blueprint
=======================================
REST endpoints for camera source management.

No upstream code is derived here — original to AeroMocap ROS.
"""

from __future__ import annotations

import uuid
from flask import Blueprint, jsonify, request

cameras_bp = Blueprint("cameras", __name__)

# In-memory camera registry (replaced by CameraManager in Phase 9)
_cameras: dict = {}


def _default_camera(camera_id: str, source_type: str = "synthetic") -> dict:
    return {
        "id": camera_id,
        "name": camera_id,
        "source_type": source_type,    # synthetic | ps3eye | usb | video_file
        "status": "connected" if source_type == "synthetic" else "disconnected",
        "fps": 60,
        "width": 640,
        "height": 480,
        "exposure": 100,
        "gain": 10,
        "dropped_frames": 0,
        "latency_ms": 0.0,
    }


def init_cameras(num_synthetic: int = 2) -> None:
    """Pre-populate with synthetic cameras in simulation mode."""
    global _cameras
    _cameras = {}
    for i in range(num_synthetic):
        cam_id = f"CAM-SYN-{i+1:02d}"
        _cameras[cam_id] = _default_camera(cam_id, "synthetic")


@cameras_bp.route("/api/cameras", methods=["GET"])
def list_cameras():
    return jsonify({"cameras": list(_cameras.values())})


@cameras_bp.route("/api/cameras", methods=["POST"])
def add_camera():
    data = request.get_json(force=True, silent=True) or {}
    source_type = data.get("source_type", "synthetic")
    cam_id = data.get("id", f"CAM-{uuid.uuid4().hex[:6].upper()}")
    if cam_id in _cameras:
        return jsonify({"error": "Camera ID already exists"}), 400
    _cameras[cam_id] = _default_camera(cam_id, source_type)
    return jsonify({"camera": _cameras[cam_id]}), 201


@cameras_bp.route("/api/cameras/<camera_id>", methods=["DELETE"])
def remove_camera(camera_id: str):
    if camera_id not in _cameras:
        return jsonify({"error": "Not found"}), 404
    del _cameras[camera_id]
    return jsonify({"removed": camera_id})


@cameras_bp.route("/api/cameras/<camera_id>", methods=["PATCH"])
def update_camera(camera_id: str):
    if camera_id not in _cameras:
        return jsonify({"error": "Not found"}), 404
    data = request.get_json(force=True, silent=True) or {}
    allowed_fields = {"exposure", "gain", "fps", "width", "height", "name", "status"}
    for k, v in data.items():
        if k in allowed_fields:
            _cameras[camera_id][k] = v
    return jsonify({"camera": _cameras[camera_id]})
