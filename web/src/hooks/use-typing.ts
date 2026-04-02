'use client';

import { useCallback, useRef } from 'react';
import { getSocket } from '@/lib/socket/socket-client';
import { useRealtimeStore } from '@/stores/realtime.store';

const TYPING_TIMEOUT_MS = 3000;

/**
 * Emits typing:start and typing:stop events with debouncing.
 * Call `onKeystroke()` on every keystroke in the composer.
 * Call `stopTyping()` on send/blur.
 */
export function useTypingEmitter(chatId: string) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const onKeystroke = useCallback(() => {
    const socket = getSocket();
    if (!socket) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typing:start', { chatId });
    }

    // Reset the stop timer
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit('typing:stop', { chatId });
    }, TYPING_TIMEOUT_MS);
  }, [chatId]);

  const stopTyping = useCallback(() => {
    const socket = getSocket();
    if (!socket) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      socket.emit('typing:stop', { chatId });
    }
  }, [chatId]);

  return { onKeystroke, stopTyping };
}

const EMPTY_TYPING: readonly { userId: string; username: string }[] = [];

/**
 * Returns the list of users currently typing in a chat.
 */
export function useTypingUsers(chatId: string) {
  return useRealtimeStore(
    (s) => s.typingByChat[chatId] ?? EMPTY_TYPING,
  );
}
