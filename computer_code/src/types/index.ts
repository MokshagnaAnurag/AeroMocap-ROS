// AeroMocap ROS — Shared TypeScript Types

export type SystemMode = 'simulation' | 'video' | 'live';
export type FilterType = 'none' | 'lowpass' | 'kalman';
export type SystemStatus = 'running' | 'idle' | 'error';
export type ConnectionState = 'online' | 'degraded' | 'offline' | 'inactive';
export type CameraSourceType = 'ps3eye' | 'usb' | 'video_file' | 'synthetic';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface TrackedObject {
  object_id: number;
  pos: [number, number, number];
  vel: [number, number, number];
  heading: number;
  confidence: number;
  filter: FilterType;
  reprojection_error: number;
  droneIndex?: number;
}

export interface ObjectPointsPayload {
  object_points: number[][];
  errors: number[];
  objects: TrackedObject[];
  filtered_objects: TrackedObject[];
  timestamp: number;
  mode: SystemMode;
}

export interface FpsPayload {
  fps: number;
  latency_ms: number;
  dropped_frames: number;
}

export interface SystemStatusPayload {
  status: SystemStatus;
  mode: SystemMode;
  cameras_connected: number;
  tracking_active: boolean;
  tracked_objects: number;
  fps: number;
  latency_ms: number;
  dropped_frames: number;
  ros2_connected: boolean;
  px4_connected: boolean;
  filter: FilterType;
  uptime_s: number;
}

export interface HealthResponse {
  status: SystemStatus;
  mode: SystemMode;
  cameras_connected: number;
  tracking_active: boolean;
  tracked_objects: number;
  fps: number;
  latency_ms: number;
  ros2_connected: boolean;
  px4_connected: boolean;
  uptime_s: number;
  dropped_frames: number;
  filter: FilterType;
  version: string;
  project: string;
}

export interface CameraInfo {
  id: string;
  name: string;
  source_type: CameraSourceType;
  status: 'connected' | 'disconnected' | 'error';
  fps: number;
  width: number;
  height: number;
  exposure: number;
  gain: number;
  dropped_frames: number;
  latency_ms: number;
}

export interface CameraPose {
  R: number[][];
  t: number[][];
}

export interface ROSTopic {
  name: string;
  type: string;
  rate_hz: number;
  last_message_ts: number | null;
}

export interface LogEntry {
  id: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  timestamp: number;
  message: string;
  source?: string;
}

export type NavPage =
  | 'mission-control'
  | 'vision-array'
  | 'calibration-lab'
  | 'track-space'
  | 'ros-bridge'
  | 'px4-link'
  | 'diagnostics'
  | 'configuration';
