// AeroMocap ROS — Socket.IO Service
import { io, Socket } from 'socket.io-client';

const BACKEND_URL = 'http://localhost:3001';

let _socket: Socket | null = null;

export function getSocket(): Socket {
  if (!_socket) {
    _socket = io(BACKEND_URL, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling'],
    });
  }
  return _socket;
}

export function disconnectSocket(): void {
  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }
}

// ── Convenience emitters ──────────────────────────────────────────────────────

export const socketEmit = {
  startTracking: () => getSocket().emit('start-tracking', {}),
  stopTracking:  () => getSocket().emit('stop-tracking', {}),
  setFilter:     (filter: string) => getSocket().emit('set-filter', { filter }),
  setMode:       (mode: string) => getSocket().emit('set-mode', { mode }),
  armDrone:      (data: object) => getSocket().emit('arm-drone', data),
  capturePts:    (startOrStop: string) => getSocket().emit('capture-points', { startOrStop }),
  calcPose:      (cameraPoints: number[][][]) => getSocket().emit('calculate-camera-pose', { cameraPoints }),
  locateObjects: (startOrStop: string) => getSocket().emit('locate-objects', { startOrStop }),
  triangulate:   (startOrStop: string, cameraPoses: object[], toWorldCoordsMatrix: number[][]) =>
                   getSocket().emit('triangulate-points', { startOrStop, cameraPoses, toWorldCoordsMatrix }),
};
