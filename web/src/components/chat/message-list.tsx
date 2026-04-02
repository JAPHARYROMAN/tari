'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Loader2, MessageSquare, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/empty-state';
import { MessageItem } from './message-item';
import type { Message, Chat, ChatDetail } from '@/types/chat';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  chat: Chat | ChatDetail;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isLoading: boolean;
  isError: boolean;
  onLoadMore: () => void;
  onEdit: (messageId: string, content: string) => void;
  onDelete: (messageId: string) => void;
  editingMessageId: string | null;
  deletingMessageId: string | null;
}

function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / 86_400_000,
  );

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'long' });
  }
  return date.toLocaleDateString([], {
    month: 'long',
    day: 'numeric',
    year: now.getFullYear() !== date.getFullYear() ? 'numeric' : undefined,
  });
}

function shouldShowDateSeparator(
  messages: Message[],
  index: number,
): boolean {
  if (index === 0) return true;
  const prev = messages[index - 1];
  const curr = messages[index];
  if (!prev || !curr) return false;
  return (
    new Date(prev.createdAt).toDateString() !==
    new Date(curr.createdAt).toDateString()
  );
}

export function MessageList({
  messages,
  currentUserId,
  chat,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  isError,
  onLoadMore,
  onEdit,
  onDelete,
  editingMessageId,
  deletingMessageId,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(0);
  const isGroupChat = chat.type === 'GROUP';

  useEffect(() => {
    const prevCount = prevMessageCountRef.current;
    const newCount = messages.length;

    if (newCount > prevCount && prevCount > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (prevCount === 0 && newCount > 0) {
      bottomRef.current?.scrollIntoView();
    }

    prevMessageCountRef.current = newCount;
  }, [messages.length]);

  const shouldShowSender = useCallback(
    (index: number): boolean => {
      if (index === 0) return true;
      const prev = messages[index - 1];
      const curr = messages[index];
      if (!prev || !curr) return true;
      if (prev.sender.id !== curr.sender.id) return true;
      const gap =
        new Date(curr.createdAt).getTime() -
        new Date(prev.createdAt).getTime();
      return gap > 5 * 60_000;
    },
    [messages],
  );

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-1 items-center justify-center px-4">
        <EmptyState
          icon={AlertCircle}
          title="Failed to load messages"
          description="Check your connection and try again"
        />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-4">
        <EmptyState
          icon={MessageSquare}
          title="No messages yet"
          description="Send a message to start the conversation"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {hasNextPage && (
        <div className="flex justify-center py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
            className="text-xs"
          >
            {isFetchingNextPage && (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            )}
            Load older messages
          </Button>
        </div>
      )}

      <div className="space-y-0.5 py-3">
        {messages.map((msg, i) => (
          <div key={msg.id}>
            {shouldShowDateSeparator(messages, i) && (
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="h-px flex-1 bg-border" />
                <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
                  {formatDateSeparator(msg.createdAt)}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
            )}

            {i > 0 &&
              shouldShowSender(i) &&
              !shouldShowDateSeparator(messages, i) && (
                <div className="h-2" />
              )}

            <MessageItem
              message={msg}
              isOwn={msg.sender.id === currentUserId}
              isGroupChat={isGroupChat}
              showSender={shouldShowSender(i)}
              onEdit={onEdit}
              onDelete={onDelete}
              isEditing={editingMessageId === msg.id}
              isDeleting={deletingMessageId === msg.id}
            />
          </div>
        ))}
      </div>

      <div ref={bottomRef} />
    </div>
  );
}
