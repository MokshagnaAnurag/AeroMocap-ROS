// AeroMocap ROS — useSystemHealth Hook
import { useState, useCallback, useEffect } from 'react';
import { useSocketEvent } from './useSocket';
import { api } from '@/services/api';
import type { SystemStatusPayload, ConnectionState, SystemMode, FilterType } from '@/types';

export interface SystemHealth {
  backendState: ConnectionState;
  trackingState: ConnectionState;
  ros2State: ConnectionState;
  px4State: ConnectionState;
  socketState: ConnectionState;
  mode: SystemMode;
  camerasConnected: number;
  trackingActive: boolean;
  trackedObjects: number;
  fps: number;
  latencyMs: number;
  droppedFrames: number;
  ros2Connected: boolean;
  px4Connected: boolean;
  filter: FilterType;
  uptimeS: number;
}

const DEFAULT_HEALTH: SystemHealth = {
  backendState: 'offline',
  trackingState: 'offline',
  ros2State: 'inactive',
  px4State: 'inactive',
  socketState: 'offline',
  mode: 'simulation',
  camerasConnected: 0,
  trackingActive: false,
  trackedObjects: 0,
  fps: 0,
  latencyMs: 0,
  droppedFrames: 0,
  ros2Connected: false,
  px4Connected: false,
  filter: 'kalman',
  uptimeS: 0,
};

export function useSystemHealth(): SystemHealth {
  const [health, setHealth] = useState<SystemHealth>(DEFAULT_HEALTH);

  // Poll /api/health on mount to seed initial state
  useEffect(() => {
    api.health()
      .then(h => {
        setHealth(prev => ({
          ...prev,
          backendState: 'online',
          socketState: 'online',
          mode: h.mode,
          trackingActive: h.tracking_active,
          trackedObjects: h.tracked_objects,
          fps: h.fps,
          latencyMs: h.latency_ms,
          ros2Connected: h.ros2_connected,
          px4Connected: h.px4_connected,
          droppedFrames: h.dropped_frames,
          filter: h.filter,
          uptimeS: h.uptime_s,
          trackingState: h.tracking_active ? 'online' : 'inactive',
          ros2State: h.ros2_connected ? 'online' : 'inactive',
          px4State: h.px4_connected ? 'online' : 'inactive',
        }));
      })
      .catch(() => {
        setHealth(prev => ({ ...prev, backendState: 'offline' }));
      });
  }, []);

  useSocketEvent('connect', useCallback(() => {
    setHealth(prev => ({ ...prev, backendState: 'online', socketState: 'online' }));
  }, []));

  useSocketEvent('disconnect', useCallback(() => {
    setHealth(prev => ({
      ...prev,
      backendState: 'degraded',
      socketState: 'offline',
      trackingState: 'offline',
    }));
  }, []));

  useSocketEvent('system-status', useCallback((data: unknown) => {
    const p = data as SystemStatusPayload;
    setHealth(prev => ({
      ...prev,
      backendState: 'online',
      socketState: 'online',
      mode: p.mode,
      trackingActive: p.tracking_active,
      trackedObjects: p.tracked_objects,
      fps: p.fps,
      latencyMs: p.latency_ms,
      droppedFrames: p.dropped_frames,
      ros2Connected: p.ros2_connected,
      px4Connected: p.px4_connected,
      filter: p.filter,
      uptimeS: p.uptime_s,
      camerasConnected: p.cameras_connected,
      trackingState: p.tracking_active ? 'online' : 'inactive',
      ros2State: p.ros2_connected ? 'online' : 'inactive',
      px4State: p.px4_connected ? 'online' : 'inactive',
    }));
  }, []));

  return health;
}
