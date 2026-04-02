'use client';

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/common/user-avatar';
import type { Chat } from '@/types/chat';

interface ChatListItemProps {
  chat: Chat;
  currentUserId: string;
  isActive: boolean;
}

function getChatDisplayInfo(
  chat: Chat,
  currentUserId: string,
): { name: string; avatarUrl: string | null; isOnline: boolean | undefined } {
  if (chat.type === 'DIRECT') {
    const other = chat.participants.find((p) => p.userId !== currentUserId);
    if (other) {
      return {
        name: other.user.name,
        avatarUrl: other.user.avatarUrl,
        isOnline: other.user.isOnline,
      };
    }
  }
  return {
    name: chat.name ?? 'Group Chat',
    avatarUrl: chat.avatarUrl,
    isOnline: undefined,
  };
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getPreviewText(chat: Chat, currentUserId: string): string {
  const lastMsg = chat.messages[0];
  if (!lastMsg) return 'No messages yet';

  const prefix =
    lastMsg.sender.id === currentUserId
      ? 'You: '
      : chat.type === 'GROUP'
        ? `${lastMsg.sender.name.split(' ')[0]}: `
        : '';

  const content =
    lastMsg.type === 'IMAGE'
      ? 'Sent a photo'
      : lastMsg.type === 'FILE'
        ? 'Sent a file'
        : lastMsg.content ?? '';

  return `${prefix}${content}`;
}

export function ChatListItem({
  chat,
  currentUserId,
  isActive,
}: ChatListItemProps) {
  const router = useRouter();
  const display = getChatDisplayInfo(chat, currentUserId);
  const lastMsg = chat.messages[0];

  return (
    <button
      onClick={() => router.push(`/chat/${chat.id}`)}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors',
        isActive
          ? 'bg-accent'
          : 'hover:bg-muted/60',
      )}
    >
      <UserAvatar
        name={display.name}
        avatarUrl={display.avatarUrl}
        isOnline={display.isOnline}
        size="md"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-medium">{display.name}</span>
          {lastMsg && (
            <span className="shrink-0 text-[11px] text-muted-foreground">
              {formatTime(lastMsg.createdAt)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs text-muted-foreground">
            {getPreviewText(chat, currentUserId)}
          </span>
          {chat.unreadCount > 0 && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
              {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
