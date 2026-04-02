'use client';

import { useRealtimeStore } from '@/stores/realtime.store';

/**
 * Returns the realtime presence status for a given user.
 * Falls back to undefined if no realtime update has been received yet.
 */
export function usePresence(userId: string) {
  return useRealtimeStore((s) => s.presence[userId]);
}
