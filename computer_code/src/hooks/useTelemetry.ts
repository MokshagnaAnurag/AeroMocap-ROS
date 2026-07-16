// AeroMocap ROS — useTelemetry Hook
// Subscribes to live tracking data from the backend via Socket.IO.

import { useState, useRef, useCallback } from 'react';
import { useSocketEvent } from './useSocket';
import type { TrackedObject, ObjectPointsPayload, FpsPayload } from '@/types';

const TRAIL_MAX = 400;

export interface TelemetryState {
  objects: TrackedObject[];
  filteredObjects: TrackedObject[];
  fps: number;
  latencyMs: number;
  droppedFrames: number;
  lastTimestamp: number;
  trail: [number, number, number][];   // position history for object_id=0
}

const DEFAULT_STATE: TelemetryState = {
  objects: [],
  filteredObjects: [],
  fps: 0,
  latencyMs: 0,
  droppedFrames: 0,
  lastTimestamp: 0,
  trail: [],
};

export function useTelemetry(): TelemetryState {
  const [state, setState] = useState<TelemetryState>(DEFAULT_STATE);
  const trailRef = useRef<[number, number, number][]>([]);

  useSocketEvent('object-points', useCallback((data: unknown) => {
    const payload = data as ObjectPointsPayload;
    const primary = payload.filtered_objects?.[0] ?? payload.objects?.[0];

    if (primary?.pos) {
      const p: [number, number, number] = [primary.pos[0], primary.pos[1], primary.pos[2]];
      trailRef.current = [...trailRef.current.slice(-(TRAIL_MAX - 1)), p];
    }

    setState(prev => ({
      ...prev,
      objects: payload.objects ?? [],
      filteredObjects: payload.filtered_objects ?? [],
      lastTimestamp: payload.timestamp ?? Date.now() / 1000,
      trail: trailRef.current,
    }));
  }, []));

  useSocketEvent('fps', useCallback((data: unknown) => {
    const payload = data as FpsPayload;
    setState(prev => ({
      ...prev,
      fps: payload.fps,
      latencyMs: payload.latency_ms,
      droppedFrames: payload.dropped_frames,
    }));
  }, []));

  return state;
}
