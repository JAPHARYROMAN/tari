'use client';

import { useEffect, useRef, useCallback } from 'react';
import { ConversationHeader } from './conversation-header';
import { MessageList } from './message-list';
import { MessageComposer } from './message-composer';
import { TypingIndicator } from './typing-indicator';
import {
  useMessages,
  useSendMessage,
  useEditMessage,
  useDeleteMessage,
  useMarkRead,
  flattenMessages,
} from '@/hooks/use-messages';
import { useSocketEvents } from '@/hooks/use-socket-events';
import { ApiClientError } from '@/lib/api/client';
import type { Chat, ChatDetail } from '@/types/chat';
import type { SendMessageInput } from '@/lib/api/messages';

interface ConversationPanelProps {
  chat: Chat | ChatDetail;
  currentUserId: string;
}

export function ConversationPanel({
  chat,
  currentUserId,
}: ConversationPanelProps) {
  const messagesQuery = useMessages(chat.id);
  const sendMessage = useSendMessage(chat.id);
  const editMessage = useEditMessage(chat.id);
  const deleteMessage = useDeleteMessage(chat.id);
  const markRead = useMarkRead();
  const markReadRef = useRef(markRead);
  markReadRef.current = markRead;

  const markedRef = useRef<string | null>(null);

  useSocketEvents(chat.id, currentUserId);

  const messages = flattenMessages(messagesQuery.data?.pages);

  // Auto-mark latest message as read
  useEffect(() => {
    if (messages.length === 0) return;
    const latest = messages[messages.length - 1];
    if (!latest || latest.sender.id === currentUserId) return;
    if (markedRef.current === latest.id) return;

    markedRef.current = latest.id;
    markReadRef.current.mutate(latest.id);
  }, [messages, currentUserId]);

  // Reset read marker when switching chats
  useEffect(() => {
    markedRef.current = null;
  }, [chat.id]);

  const handleSend = useCallback((input: SendMessageInput) => {
    sendMessage.mutate(input);
  }, [sendMessage]);

  const handleEdit = useCallback((messageId: string, content: string) => {
    editMessage.mutate({ messageId, input: { content } });
  }, [editMessage]);

  const handleDelete = useCallback((messageId: string) => {
    deleteMessage.mutate(messageId);
  }, [deleteMessage]);

  const sendError =
    sendMessage.error instanceof ApiClientError
      ? sendMessage.error.message
      : sendMessage.error
        ? 'Failed to send message'
        : null;

  return (
    <div className="flex h-full flex-col">
      <ConversationHeader chat={chat} currentUserId={currentUserId} />

      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        chat={chat}
        hasNextPage={messagesQuery.hasNextPage}
        isFetchingNextPage={messagesQuery.isFetchingNextPage}
        isLoading={messagesQuery.isLoading}
        isError={messagesQuery.isError}
        onLoadMore={() => messagesQuery.fetchNextPage()}
        onEdit={handleEdit}
        onDelete={handleDelete}
        editingMessageId={
          editMessage.isPending
            ? (editMessage.variables?.messageId ?? null)
            : null
        }
        deletingMessageId={
          deleteMessage.isPending
            ? (deleteMessage.variables as string | null) ?? null
            : null
        }
      />

      <TypingIndicator chatId={chat.id} />

      <MessageComposer
        chatId={chat.id}
        onSend={handleSend}
        isSending={sendMessage.isPending}
        sendError={sendError}
      />
    </div>
  );
}
