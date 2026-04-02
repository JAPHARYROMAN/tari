'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket/socket-client';
import { chatKeys } from './use-chats';

/**
 * Manages socket connection lifecycle.
 * Call once at the dashboard layout level.
 * Connects when authenticated, disconnects on logout.
 * Handles reconnection by refreshing stale data.
 */
export function useSocket(): void {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const connectedRef = useRef(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isAuthenticated && accessToken && !connectedRef.current) {
      const socket = connectSocket(accessToken);
      connectedRef.current = true;

      // On reconnect, refresh chat data to catch anything missed
      const handleReconnect = () => {
        queryClient.invalidateQueries({ queryKey: chatKeys.all });
      };

      socket.io.on('reconnect', handleReconnect);

      return () => {
        socket.io.off('reconnect', handleReconnect);
      };
    }

    if (!isAuthenticated && connectedRef.current) {
      disconnectSocket();
      connectedRef.current = false;
    }

    return () => {
      if (connectedRef.current) {
        disconnectSocket();
        connectedRef.current = false;
      }
    };
  }, [isAuthenticated, accessToken, queryClient]);
}
