'use client';

import { ArrowLeft, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/common/user-avatar';
import { useChatUiStore } from '@/stores/chat-ui.store';
import { usePresence } from '@/hooks/use-presence';
import type { Chat, ChatDetail } from '@/types/chat';

interface ConversationHeaderProps {
  chat: Chat | ChatDetail;
  currentUserId: string;
}

function formatLastSeen(dateStr: string): string {
  return `Last seen ${new Date(dateStr).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
}

export function ConversationHeader({
  chat,
  currentUserId,
}: ConversationHeaderProps) {
  const { toggleDetailsPanel, setMobileView } = useChatUiStore();

  // Get the other participant for direct chats
  const otherParticipant =
    chat.type === 'DIRECT'
      ? chat.participants.find((p) => p.userId !== currentUserId)
      : null;

  // Realtime presence override (may be undefined if no event received yet)
  const realtimePresence = usePresence(otherParticipant?.userId ?? '');

  let name: string;
  let avatarUrl: string | null;
  let isOnline: boolean | undefined;
  let subtitle: string;

  if (chat.type === 'DIRECT' && otherParticipant) {
    name = otherParticipant.user.name;
    avatarUrl = otherParticipant.user.avatarUrl;

    // Prefer realtime presence, fall back to API data
    if (realtimePresence) {
      isOnline = realtimePresence.status === 'online';
      subtitle = isOnline
        ? 'Online'
        : formatLastSeen(realtimePresence.lastSeenAt);
    } else {
      isOnline = otherParticipant.user.isOnline;
      subtitle = isOnline
        ? 'Online'
        : formatLastSeen(otherParticipant.user.lastSeen);
    }
  } else {
    const onlineCount = chat.participants.filter(
      (p) => p.user.isOnline,
    ).length;
    name = chat.name ?? 'Group Chat';
    avatarUrl = chat.avatarUrl;
    isOnline = undefined;
    subtitle = `${chat.participants.length} members, ${onlineCount} online`;
  }

  return (
    <div className="flex h-16 shrink-0 items-center gap-3 border-b bg-background px-4">
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 md:hidden"
        onClick={() => setMobileView('list')}
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>

      <UserAvatar
        name={name}
        avatarUrl={avatarUrl}
        isOnline={isOnline ?? false}
        size="sm"
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{name}</p>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground"
          onClick={() => toggleDetailsPanel()}
        >
          <Info className="h-[18px] w-[18px]" />
        </Button>
      </div>
    </div>
  );
}
