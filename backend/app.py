"""
AeroMocap ROS — Main Application Entry Point
==============================================
Initialises Flask, Flask-SocketIO, registers API blueprints,
and starts the appropriate engine based on config.yaml mode.

No upstream code is derived here — original to AeroMocap ROS.

Run with:
    python3 app.py
"""

from __future__ import annotations

import logging
import sys
import os

# ── Ensure backend/ is on path ───────────────────────────────────────────────
sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO

from config import load_config

# ── Logging setup ─────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="[%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger("aeromocap.app")

# ── Load configuration ────────────────────────────────────────────────────────
config = load_config(os.path.join(os.path.dirname(__file__), "config.yaml"))

# ── Flask application ─────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app, supports_credentials=True, origins="*")
socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode="threading",
    logger=False,
    engineio_logger=False,
)

# ── Register API blueprints ───────────────────────────────────────────────────
from api.health import health_bp, init_health
from api.cameras import cameras_bp, init_cameras

app.register_blueprint(health_bp)
app.register_blueprint(cameras_bp)

# ── Initialise camera registry ────────────────────────────────────────────────
init_cameras(num_synthetic=config.cameras.count)

# ── Engine setup based on mode ────────────────────────────────────────────────
engine = None

if config.mode == "simulation":
    logger.info("Starting in SIMULATION MODE — no physical hardware required.")
    from core.simulation_engine import SimulationEngine
    engine = SimulationEngine(config=config, socketio=socketio)
    init_health(engine)
    engine.start()

elif config.mode == "video":
    logger.warning("VIDEO MODE — not yet implemented. Falling back to simulation.")
    from core.simulation_engine import SimulationEngine
    engine = SimulationEngine(config=config, socketio=socketio)
    init_health(engine)
    engine.start()

elif config.mode == "live":
    logger.warning("LIVE MODE — camera hardware required. Not implemented yet.")
    # Phase 9: will initialise CameraManager + physical cameras here
else:
    logger.error(f"Unknown mode: {config.mode}. Defaulting to simulation.")
    from core.simulation_engine import SimulationEngine
    engine = SimulationEngine(config=config, socketio=socketio)
    init_health(engine)
    engine.start()

# ── Socket.IO event handlers ──────────────────────────────────────────────────

@socketio.on("connect")
def on_connect():
    logger.info(f"Client connected — mode: {config.mode}")
    socketio.emit("system-status", {
        "status": "connected",
        "mode": config.mode,
        "tracking_active": engine.is_running if engine else False,
        "ros2_connected": config.ros2.enabled,
        "px4_connected": config.px4.enabled,
        "version": "1.0.0",
    })


@socketio.on("disconnect")
def on_disconnect():
    logger.info("Client disconnected.")


@socketio.on("start-tracking")
def on_start_tracking(data):
    if engine and not engine.is_running:
        engine.start()
        socketio.emit("tracking-state", {"active": True})


@socketio.on("stop-tracking")
def on_stop_tracking(data):
    if engine and engine.is_running:
        engine.stop()
        socketio.emit("tracking-state", {"active": False})


@socketio.on("set-filter")
def on_set_filter(data):
    filter_type = data.get("filter", "kalman")
    if filter_type in ("none", "lowpass", "kalman"):
        config.tracking.filter = filter_type
        socketio.emit("filter-updated", {"filter": filter_type})
        logger.info(f"Filter changed to: {filter_type}")


@socketio.on("set-mode")
def on_set_mode(data):
    mode = data.get("mode", "simulation")
    logger.info(f"Mode change requested: {mode} (effective on restart)")
    socketio.emit("mode-updated", {"mode": mode, "note": "Restart backend to apply"})


# ── Compatibility shim — preserve upstream Socket.IO event names ─────────────
# These allow the original frontend (if still used) to continue working.

@socketio.on("locate-objects")
def on_locate_objects_compat(data):
    """Legacy event from original frontend — no-op in simulation mode."""
    pass


@socketio.on("triangulate-points")
def on_triangulate_compat(data):
    """Legacy event from original frontend — no-op in simulation mode."""
    start_or_stop = data.get("startOrStop", "stop")
    if start_or_stop == "start" and engine:
        engine.start()
    elif start_or_stop == "stop" and engine:
        engine.stop()


# ── Run ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    logger.info(
        f"AeroMocap ROS backend starting — "
        f"host={config.server.host} port={config.server.port} "
        f"mode={config.mode}"
    )
    socketio.run(
        app,
        host=config.server.host,
        port=config.server.port,
        debug=config.server.debug,
        use_reloader=False,   # Prevent double engine startup
        allow_unsafe_werkzeug=True,
    )
