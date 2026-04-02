'use client';

import { MessageSquarePlus, Inbox, AlertCircle } from 'lucide-react';
import { ChatListItem } from './chat-list-item';
import { ChatListSkeleton } from './chat-list-skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { Button } from '@/components/ui/button';
import type { Chat } from '@/types/chat';

interface ChatListProps {
  chats: Chat[];
  currentUserId: string;
  activeChatId: string | null;
  isLoading?: boolean;
  isError?: boolean;
  onNewChat?: () => void;
}

export function ChatList({
  chats,
  currentUserId,
  activeChatId,
  isLoading,
  isError,
  onNewChat,
}: ChatListProps) {
  if (isLoading) {
    return <ChatListSkeleton />;
  }

  if (isError) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Failed to load chats"
        description="Check your connection and try again"
        className="flex-1"
      />
    );
  }

  if (chats.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="No conversations yet"
        description="Start chatting with someone"
        action={
          <Button
            size="sm"
            variant="outline"
            className="mt-2"
            onClick={onNewChat}
          >
            <MessageSquarePlus className="mr-2 h-4 w-4" />
            New chat
          </Button>
        }
        className="flex-1"
      />
    );
  }

  return (
    <div className="flex-1 space-y-0.5 overflow-y-auto p-2">
      {chats.map((chat) => (
        <ChatListItem
          key={chat.id}
          chat={chat}
          currentUserId={currentUserId}
          isActive={chat.id === activeChatId}
        />
      ))}
    </div>
  );
}
