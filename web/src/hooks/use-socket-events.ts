'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { getSocket } from '@/lib/socket/socket-client';
import { messageKeys } from './use-messages';
import { chatKeys } from './use-chats';
import { useRealtimeStore } from '@/stores/realtime.store';
import type { Message } from '@/types/chat';
import type { MessagesResponse } from '@/lib/api/messages';

type MessagePages = InfiniteData<MessagesResponse, string | undefined>;

interface PresencePayload {
  userId: string;
  status: 'online' | 'offline';
  lastSeenAt: string;
}

interface TypingPayload {
  chatId: string;
  userId: string;
  username: string;
}

interface TypingStopPayload {
  chatId: string;
  userId: string;
}

interface ReadUpdatePayload {
  chatId: string;
  userId: string;
  lastReadMessageId: string;
  readAt: string;
}

/** Insert a message into the first page of the cache (deduped). */
function insertMessage(old: MessagePages | undefined, message: Message): MessagePages | undefined {
  if (!old) return old;
  const firstPage = old.pages[0];
  if (!firstPage) return old;
  if (firstPage.messages.some((m) => m.id === message.id)) return old;
  return {
    ...old,
    pages: [
      { ...firstPage, messages: [message, ...firstPage.messages] },
      ...old.pages.slice(1),
    ],
  };
}

/** Replace a message in-place across all pages. */
function replaceMessage(old: MessagePages | undefined, message: Message): MessagePages | undefined {
  if (!old) return old;
  return {
    ...old,
    pages: old.pages.map((page) => ({
      ...page,
      messages: page.messages.map((m) => (m.id === message.id ? message : m)),
    })),
  };
}

/**
 * Registers socket event listeners for the active chat.
 * Call once per active chat. Cleans up on chat change.
 */
export function useSocketEvents(chatId: string | null, currentUserId: string): void {
  const queryClient = useQueryClient();
  const { addTypingUser, removeTypingUser, clearTypingForChat, updatePresence } =
    useRealtimeStore();
  const prevChatRef = useRef<string | null>(null);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !chatId) return;

    // If switching chats, clear typing for the old room
    if (prevChatRef.current && prevChatRef.current !== chatId) {
      clearTypingForChat(prevChatRef.current);
    }
    prevChatRef.current = chatId;

    // Join the new room (covers newly created chats or reconnections)
    socket.emit('chat:join', { chatId });

    // ── Message events ────────────────────────────────

    const handleNewMessage = (message: Message) => {
      if (message.chatId !== chatId) {
        // Message for another chat — just refresh chat list for preview/unread
        queryClient.invalidateQueries({ queryKey: chatKeys.list() });
        return;
      }

      queryClient.setQueryData<MessagePages>(
        messageKeys.list(chatId),
        (old) => insertMessage(old, message),
      );

      queryClient.invalidateQueries({ queryKey: chatKeys.list() });
    };

    const handleMessageUpdate = (message: Message) => {
      if (message.chatId !== chatId) return;
      queryClient.setQueryData<MessagePages>(
        messageKeys.list(chatId),
        (old) => replaceMessage(old, message),
      );
    };

    const handleMessageDelete = (message: Message) => {
      if (message.chatId !== chatId) return;
      queryClient.setQueryData<MessagePages>(
        messageKeys.list(chatId),
        (old) => replaceMessage(old, message),
      );
      queryClient.invalidateQueries({ queryKey: chatKeys.list() });
    };

    // ── Typing events ─────────────────────────────────

    const handleTypingStart = (data: TypingPayload) => {
      if (data.chatId !== chatId || data.userId === currentUserId) return;
      addTypingUser(chatId, { userId: data.userId, username: data.username });
    };

    const handleTypingStop = (data: TypingStopPayload) => {
      if (data.chatId !== chatId) return;
      removeTypingUser(chatId, data.userId);
    };

    // ── Presence events ───────────────────────────────

    const handlePresence = (data: PresencePayload) => {
      updatePresence(data.userId, {
        status: data.status,
        lastSeenAt: data.lastSeenAt,
      });

      // Refresh chat detail to update header online status
      queryClient.invalidateQueries({ queryKey: chatKeys.detail(chatId) });
    };

    // ── Read receipt events ───────────────────────────

    const handleReadUpdate = (_data: ReadUpdatePayload) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.list() });
    };

    // Register all listeners
    socket.on('message:new', handleNewMessage);
    socket.on('message:update', handleMessageUpdate);
    socket.on('message:delete', handleMessageDelete);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);
    socket.on('presence:update', handlePresence);
    socket.on('message:read:update', handleReadUpdate);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:update', handleMessageUpdate);
      socket.off('message:delete', handleMessageDelete);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
      socket.off('presence:update', handlePresence);
      socket.off('message:read:update', handleReadUpdate);
    };
  }, [
    chatId,
    currentUserId,
    queryClient,
    addTypingUser,
    removeTypingUser,
    clearTypingForChat,
    updatePresence,
  ]);
}
