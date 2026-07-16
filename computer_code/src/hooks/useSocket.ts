// AeroMocap ROS — useSocket Hook
import { useEffect, useRef } from 'react';
import { getSocket } from '@/services/socket';
import type { Socket } from 'socket.io-client';

export function useSocket(): Socket {
  return getSocket();
}

type EventHandler = (...args: unknown[]) => void;

/**
 * Subscribe to a Socket.IO event, automatically cleaning up on unmount.
 */
export function useSocketEvent(event: string, handler: EventHandler): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const socket = getSocket();
    const cb: EventHandler = (...args) => handlerRef.current(...args);
    socket.on(event, cb);
    return () => { socket.off(event, cb); };
  }, [event]);
}
