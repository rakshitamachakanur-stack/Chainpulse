/**
 * useSocket — connects to the backend Socket.io server and invalidates
 * React Query caches in real-time whenever a peer mutates data.
 *
 * Mount once at app level (in Layout or App). Each event maps to the
 * exact query keys already used across all role pages, so every open
 * tab refreshes automatically with no polling delay.
 *
 * Events emitted by the backend:
 *   order:created       → invalidate orders, analytics, admin
 *   order:updated       → invalidate orders, analytics, admin
 *   requisition:updated → invalidate requisitions, analytics, admin
 *   shipment:created    → invalidate shipments, analytics, admin
 *   shipment:updated    → invalidate shipments, analytics, admin
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

    // ── Order events ──────────────────────────────────────────────────────────
    const onOrderMutation = () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['proc-orders'] });
      qc.invalidateQueries({ queryKey: ['mgr-orders'] });
      qc.invalidateQueries({ queryKey: ['orders-dispatch'] });
      qc.invalidateQueries({ queryKey: ['analytics-dashboard'] });
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      qc.invalidateQueries({ queryKey: ['admin-activity'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    };
    socket.on('order:created', onOrderMutation);
    socket.on('order:updated', onOrderMutation);

    // ── Requisition events ────────────────────────────────────────────────────
    const onReqMutation = () => {
      qc.invalidateQueries({ queryKey: ['requisitions'] });
      qc.invalidateQueries({ queryKey: ['pending-reqs'] });
      qc.invalidateQueries({ queryKey: ['analytics-dashboard'] });
      qc.invalidateQueries({ queryKey: ['admin-activity'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    };
    socket.on('requisition:updated', onReqMutation);

    // ── Shipment events ───────────────────────────────────────────────────────
    const onShipmentMutation = () => {
      qc.invalidateQueries({ queryKey: ['shipments'] });
      qc.invalidateQueries({ queryKey: ['analytics-dashboard'] });
      qc.invalidateQueries({ queryKey: ['admin-activity'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    };
    socket.on('shipment:created', onShipmentMutation);
    socket.on('shipment:updated', onShipmentMutation);

    // ── Inventory events ──────────────────────────────────────────────────────
    const onInventoryMutation = () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: ['low-stock'] });
      qc.invalidateQueries({ queryKey: ['analytics-dashboard'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      // GRN verify also marks the linked order delivered
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['mgr-orders'] });
      qc.invalidateQueries({ queryKey: ['orders-dispatch'] });
      qc.invalidateQueries({ queryKey: ['receipts'] });
    };
    socket.on('inventory:updated', onInventoryMutation);

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [qc]);

  return socketRef;
}
