/**
 * useSocket — Admin panel real-time WebSocket hook.
 * Invalidates admin React Query caches when the backend broadcasts mutations.
 */
import { useEffect, useRef } from 'react';
import { useQueryClient }    from '@tanstack/react-query';
import { io }                from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export default function useSocket() {
  const qc      = useQueryClient();
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });
    socketRef.current = socket;

    const refresh = () => {
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      qc.invalidateQueries({ queryKey: ['admin-activity'] });
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
    };

    socket.on('order:created',       refresh);
    socket.on('order:updated',       refresh);
    socket.on('requisition:updated', refresh);
    socket.on('shipment:created',    refresh);
    socket.on('shipment:updated',    refresh);
    socket.on('inventory:updated',   refresh);

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [qc]);

  return socketRef;
}
