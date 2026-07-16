"""
AeroMocap ROS — Configuration Loader
=====================================
Reads config.yaml and provides typed access to all configuration values.

No upstream code is derived here — original to AeroMocap ROS.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Optional
import yaml


@dataclass
class ResolutionConfig:
    width: int = 640
    height: int = 480


@dataclass
class CameraConfig:
    count: int = 2
    fps: int = 60
    resolution: ResolutionConfig = field(default_factory=ResolutionConfig)


@dataclass
class TrackingConfig:
    marker_type: str = "led"
    filter: str = "kalman"
    publish_rate: int = 30
    num_objects: int = 1
    scale_reference: float = 0.15
    marker_distances: dict = field(default_factory=lambda: {"dist1": 0.095, "dist2": 0.15})


@dataclass
class SimulationConfig:
    trajectory: str = "circular_helix"
    speed: float = 1.0
    noise: float = 0.002


@dataclass
class ServerConfig:
    host: str = "0.0.0.0"
    port: int = 3001
    debug: bool = True


@dataclass
class ROS2Config:
    enabled: bool = False
    topic_prefix: str = "/aeromocap"
    world_frame: str = "map"
    publish_rate: int = 30


@dataclass
class PX4Config:
    enabled: bool = False
    serial_port: str = "/dev/ttyUSB0"
    baud_rate: int = 921600


@dataclass
class AppConfig:
    mode: str = "simulation"
    server: ServerConfig = field(default_factory=ServerConfig)
    cameras: CameraConfig = field(default_factory=CameraConfig)
    tracking: TrackingConfig = field(default_factory=TrackingConfig)
    simulation: SimulationConfig = field(default_factory=SimulationConfig)
    ros2: ROS2Config = field(default_factory=ROS2Config)
    px4: PX4Config = field(default_factory=PX4Config)


def _dict_to_config(data: dict) -> AppConfig:
    """Recursively populate AppConfig from a nested dict."""
    cfg = AppConfig()
    cfg.mode = data.get("mode", cfg.mode)

    if "server" in data:
        s = data["server"]
        cfg.server = ServerConfig(
            host=s.get("host", cfg.server.host),
            port=s.get("port", cfg.server.port),
            debug=s.get("debug", cfg.server.debug),
        )

    if "cameras" in data:
        c = data["cameras"]
        res_raw = c.get("resolution", {})
        cfg.cameras = CameraConfig(
            count=c.get("count", cfg.cameras.count),
            fps=c.get("fps", cfg.cameras.fps),
            resolution=ResolutionConfig(
                width=res_raw.get("width", 640),
                height=res_raw.get("height", 480),
            ),
        )

    if "tracking" in data:
        t = data["tracking"]
        cfg.tracking = TrackingConfig(
            marker_type=t.get("marker_type", cfg.tracking.marker_type),
            filter=t.get("filter", cfg.tracking.filter),
            publish_rate=t.get("publish_rate", cfg.tracking.publish_rate),
            num_objects=t.get("num_objects", cfg.tracking.num_objects),
            scale_reference=t.get("scale_reference", cfg.tracking.scale_reference),
            marker_distances=t.get("marker_distances", cfg.tracking.marker_distances),
        )

    if "simulation" in data:
        s = data["simulation"]
        cfg.simulation = SimulationConfig(
            trajectory=s.get("trajectory", cfg.simulation.trajectory),
            speed=s.get("speed", cfg.simulation.speed),
            noise=s.get("noise", cfg.simulation.noise),
        )

    if "ros2" in data:
        r = data["ros2"]
        cfg.ros2 = ROS2Config(
            enabled=r.get("enabled", cfg.ros2.enabled),
            topic_prefix=r.get("topic_prefix", cfg.ros2.topic_prefix),
            world_frame=r.get("world_frame", cfg.ros2.world_frame),
            publish_rate=r.get("publish_rate", cfg.ros2.publish_rate),
        )

    if "px4" in data:
        p = data["px4"]
        cfg.px4 = PX4Config(
            enabled=p.get("enabled", cfg.px4.enabled),
            serial_port=p.get("serial_port", cfg.px4.serial_port),
            baud_rate=p.get("baud_rate", cfg.px4.baud_rate),
        )

    return cfg


def load_config(config_path: Optional[str] = None) -> AppConfig:
    """
    Load AppConfig from a YAML file.
    Falls back to defaults if file is missing.
    """
    if config_path is None:
        config_path = os.path.join(os.path.dirname(__file__), "config.yaml")

    if not os.path.exists(config_path):
        print(f"[AeroMocap] config.yaml not found at {config_path}, using defaults.")
        return AppConfig()

    with open(config_path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}

    config = _dict_to_config(data)
    print(f"[AeroMocap] Config loaded: mode={config.mode}, port={config.server.port}")
    return config


# Module-level singleton — accessed by all backend modules
_config: Optional[AppConfig] = None


def get_config() -> AppConfig:
    """Return the global AppConfig, loading from disk if not yet initialized."""
    global _config
    if _config is None:
        _config = load_config()
    return _config
