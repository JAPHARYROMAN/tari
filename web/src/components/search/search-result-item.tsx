'use client';

import { MessageSquare, Users } from 'lucide-react';
import { UserAvatar } from '@/components/common/user-avatar';
import type { SearchUserResult, SearchChatResult } from '@/lib/api/search';

interface UserResultItemProps {
  user: SearchUserResult;
  onClick: () => void;
}

export function UserResultItem({ user, onClick }: UserResultItemProps) {
  const displayName = user.profile?.displayName ?? user.name;
  const avatarUrl = user.profile?.avatarUrl ?? user.avatarUrl;

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
    >
      <UserAvatar
        name={displayName}
        avatarUrl={avatarUrl}
        isOnline={user.isOnline}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{displayName}</p>
        <p className="truncate text-xs text-muted-foreground">
          @{user.username}
        </p>
      </div>
      <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

interface ChatResultItemProps {
  chat: SearchChatResult;
  currentUserId: string;
  onClick: () => void;
}

export function ChatResultItem({
  chat,
  currentUserId,
  onClick,
}: ChatResultItemProps) {
  let name: string;
  let avatarUrl: string | null;
  let isOnline: boolean | undefined;

  if (chat.type === 'DIRECT') {
    const other = chat.participants.find((p) => p.userId !== currentUserId);
    name = other?.user.name ?? 'Unknown';
    avatarUrl = other?.user.avatarUrl ?? null;
    isOnline = other?.user.isOnline;
  } else {
    name = chat.name ?? 'Group Chat';
    avatarUrl = chat.avatarUrl;
    isOnline = undefined;
  }

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
    >
      <UserAvatar
        name={name}
        avatarUrl={avatarUrl}
        isOnline={isOnline}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {chat.type === 'GROUP' ? (
            <>
              <Users className="mr-1 inline h-3 w-3" />
              {chat.participants.length} members
            </>
          ) : (
            'Direct message'
          )}
        </p>
      </div>
    </button>
  );
}
