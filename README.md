# AeroMocap ROS 🎯

> **A Low-Cost, Real-Time, Multi-Agent Motion Capture System for Autonomous Indoor Drone Navigation**

**Developed by [Mokshagna Anurag](https://github.com/MokshagnaAnurag)**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org/)
[![OpenCV](https://img.shields.io/badge/OpenCV-4.x-green.svg)](https://opencv.org/)
[![ESP32](https://img.shields.io/badge/ESP32-Arduino-red.svg)](https://www.espressif.com/)

---

## 📌 Overview

**AeroMocap ROS** is an affordable, fully open-source **outside-in motion capture system** that tracks the 3D positions of multiple drones in real-time using external USB cameras — no GPS, no expensive Vicon/OptiTrack hardware required.

The system uses **OpenCV's Structure from Motion (SfM)** module to:
1. Calibrate the spatial layout of multiple cameras automatically.
2. Triangulate the $(X, Y, Z)$ positions of IR-LED-equipped drones at 150+ Hz.
3. Send position data and flight commands to the drones via an **ESP32 radio link**.
4. Visualize everything live in a **React + Three.js** web dashboard.

This makes professional-grade indoor drone tracking accessible for research, education, and prototyping at a fraction of the usual cost.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────┐
│               AeroMocap ROS Architecture            │
│                                                     │
│  USB Cameras ──► Python Backend (OpenCV/Flask)      │
│       │               │                             │
│       │          Triangulate 3D Position            │
│       │               │                             │
│       └──────► Socket.IO ──────► React Dashboard    │
│                       │                             │
│                  Serial (USB)                        │
│                       │                             │
│               ESP32 Transmitter                     │
│                       │                             │
│              [Radio Link 1000000 baud]               │
│                       │                             │
│           Drone 1, Drone 2, ... Drone N             │
└─────────────────────────────────────────────────────┘
```

![Architecture](https://github.com/MokshagnaAnurag/AeroMocap-ROS/blob/main/images/architecture.png?raw=true)

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🎥 **Multi-Camera SfM Calibration** | Automatically computes camera poses (R, t) from point correspondences using OpenCV SfM |
| 📐 **Real-Time 3D Triangulation** | Reconstructs 3D object positions from 2D image projections at 150 Hz |
| 📡 **ESP32 Drone Radio Link** | Sends armed state, PID gains, setpoints, and trim values over high-speed serial |
| 🗺️ **Trajectory Planning** | Smooth, jerk-free flight paths using **Ruckig** (time-optimal trajectory generation) |
| 🌐 **React Web Dashboard** | Live 3D viewport (Three.js), FPS monitor, camera controls, telemetry strips |
| 🔄 **WebSocket Streaming** | Real-time bidirectional communication via Socket.IO |
| 🏠 **Floor & Origin Calibration** | Automatic floor plane estimation and world coordinate alignment |
| 📊 **Bundle Adjustment** | Refines camera poses using iterative bundle adjustment for maximum accuracy |
| 🔧 **Kalman Filtering** | Smooths noisy object position data with an onboard Kalman filter |

---

## 🛠️ Tech Stack

### Backend (Python)
- **Flask** — REST API and MJPEG camera stream server
- **Flask-SocketIO** — Real-time WebSocket event handling
- **OpenCV + opencv_contrib** — Camera calibration, SfM, triangulation
- **NumPy / SciPy** — Linear algebra, least-squares fitting
- **Ruckig** — Time-optimal trajectory planning
- **pySerial** — Serial communication with the ESP32 transmitter

### Frontend (React + TypeScript)
- **React 18** — Component-based UI
- **Three.js + react-three-fiber** — Real-time 3D visualization
- **Chart.js + react-chartjs-2** — FPS and telemetry charts
- **Bootstrap** — Responsive layout
- **Vite** — Lightning-fast dev server and bundler
- **Socket.IO Client** — WebSocket connection to the Python backend

### Hardware
- **ESP32** — Acts as the wireless radio transmitter to the drones
- **PlayStation Eye Cameras** (or any USB UVC camera) — External motion capture cameras
- **Custom IR LED Markers** — Worn by each tracked drone

---

## 📁 Project Structure

```
AeroMocap-ROS/
│
├── backend/                  # Python Flask backend
│   ├── app.py                # Main entry point
│   ├── config.yaml           # Camera and system config
│   ├── config.py             # Config loader
│   ├── api/
│   │   ├── cameras.py        # Camera stream and SfM logic
│   │   └── health.py         # Health check endpoint
│   ├── camera_sources/
│   │   ├── base.py           # Abstract camera source
│   │   └── synthetic.py      # Synthetic camera for testing
│   └── core/
│       └── simulation_engine.py  # Physics simulation
│
├── computer_code/            # React + TypeScript frontend
│   ├── index.html
│   ├── vite.config.ts
│   ├── package.json
│   ├── api/                  # Legacy Python API scripts
│   │   ├── index.py          # Original Flask/SocketIO server
│   │   ├── helpers.py        # Triangulation, bundle adjustment
│   │   ├── KalmanFilter.py
│   │   └── camera-params.json
│   └── src/
│       ├── App.tsx           # Main app router
│       ├── pages/            # Dashboard pages
│       │   ├── MissionControl.tsx
│       │   ├── TrackSpace.tsx
│       │   ├── CalibrationLab.tsx
│       │   ├── VisionArray.tsx
│       │   ├── Diagnostics.tsx
│       │   └── Configuration.tsx
│       └── components/
│           ├── CameraWireframe.tsx
│           ├── Objects.tsx
│           ├── Points.tsx
│           └── layout/
│
└── images/                   # Documentation images (local only)
```

---

## 🚀 Getting Started

### Prerequisites

#### Hardware
- ≥ 2 USB cameras (PlayStation Eye cameras recommended)
- 1× ESP32 board (connected via USB to your computer)
- Drones with IR LEDs attached

#### Software
- Python 3.10+
- Node.js 18+
- OpenCV with `opencv_contrib` compiled from source (required for SfM module)

> **Important:** The OpenCV SfM module is **not** included in the standard `pip install opencv-python`. You must compile from source.
> - [SFM Dependencies Guide](https://docs.opencv.org/4.x/db/db8/tutorial_sfm_installation.html)
> - [OpenCV Contrib Installation Guide](https://github.com/opencv/opencv_contrib/blob/master/README.md)

---

### 🐧 Ubuntu Setup (Recommended)

#### 1. Clone the Repository
```bash
git clone https://github.com/MokshagnaAnurag/AeroMocap-ROS.git
cd AeroMocap-ROS
```

#### 2. Install Python Backend Dependencies
```bash
cd backend
pip3 install flask flask-socketio flask-cors numpy scipy pyserial ruckig opencv-python
```

#### 3. Install the pseyepy Library (for PS Eye cameras)
```bash
pip3 install pseyepy
```

#### 4. Install Frontend Dependencies
```bash
cd ../computer_code
npm install
```

---

### ▶️ Running the System

#### Step 1: Start the Python Backend
```bash
cd backend
python3 app.py
```
The backend will start on `http://localhost:3001`.

#### Step 2: Start the React Frontend
```bash
cd computer_code
npm run dev
```
The dashboard will open at `http://localhost:5173`.

---

## 🎮 Usage Walkthrough

### 1. Camera Setup
- Mount your cameras around the room with overlapping fields of view.
- Open the **Vision Array** page in the dashboard to verify all camera feeds are live.

### 2. Camera Calibration
1. Navigate to **Calibration Lab**.
2. Click **Capture Points** — move a bright IR point through the shared field of view.
3. Click **Calculate Camera Pose** — the system will compute camera positions using SfM.
4. Use **Determine Scale** with a known physical distance to set the real-world scale.

### 3. Floor & Origin Alignment
1. Place the IR marker on the floor at multiple positions.
2. Click **Acquire Floor** — the system fits a plane and rotates coordinates so Z is "up".
3. Place the marker at your desired origin and click **Set Origin**.

### 4. Live Tracking
1. Navigate to **Track Space**.
2. Click **Locate Objects** — drones with IR markers will appear as 3D points in the viewport.
3. Arm drones via **Mission Control** and send flight setpoints.

---

## 🛠️ ESP32 Serial Protocol

Commands are sent from the Python backend to the ESP32 over serial at **1,000,000 baud**.

Each message is a JSON object prefixed with the drone index:

```json
// Arm/Disarm
0{"armed": true}

// Set PID gains for drone 0
0{"pid": [1.2, 0.05, 0.8]}

// Send target setpoint (x, y, z in meters)
0{"setpoint": [0.0, 0.5, 1.0]}

// Set motor trim
0{"trim": [1500, 1500, 1500, 1500]}
```

---

## 🔮 Roadmap

- [ ] Add support for standard webcams via auto-calibration
- [ ] Integrate ROS2 publisher node for setpoint broadcasting
- [ ] Replace serial link with Wi-Fi UDP for multi-drone scalability
- [ ] Add SLAM-based "inside-out" tracking mode
- [ ] Add recording and playback of capture sessions

---

## 📸 Screenshots

Screenshots and architecture diagrams will be added soon.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

```
MIT License
Copyright (c) 2026 Mokshagna Anurag
```

---

## 🙋 Author

**Mokshagna Anurag**
- GitHub: [@MokshagnaAnurag](https://github.com/MokshagnaAnurag)
- Project: [AeroMocap-ROS](https://github.com/MokshagnaAnurag/AeroMocap-ROS)

---

> *Built with ❤️ for affordable robotics research*
