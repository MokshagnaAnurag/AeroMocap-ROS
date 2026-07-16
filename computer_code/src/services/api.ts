// AeroMocap ROS — API Service
import type { HealthResponse, CameraInfo } from '@/types';

const BASE = 'http://localhost:3001';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body?: object): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API POST ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

async function patch<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API PATCH ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

async function del<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`API DELETE ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  health: () => get<HealthResponse>('/api/health'),
  cameras: {
    list:   () => get<{ cameras: CameraInfo[] }>('/api/cameras'),
    add:    (data: Partial<CameraInfo>) => post<{ camera: CameraInfo }>('/api/cameras', data),
    update: (id: string, data: Partial<CameraInfo>) => patch<{ camera: CameraInfo }>(`/api/cameras/${id}`, data),
    remove: (id: string) => del<{ removed: string }>(`/api/cameras/${id}`),
  },
};
