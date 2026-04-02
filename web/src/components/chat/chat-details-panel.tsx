'use client';

import { X, Users, Image, FileText, Bell, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/common/user-avatar';
import { useChatUiStore } from '@/stores/chat-ui.store';
import type { Chat, ChatDetail } from '@/types/chat';

interface ChatDetailsPanelProps {
  chat: Chat | ChatDetail;
  currentUserId: string;
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {title}
    </h3>
  );
}

export function ChatDetailsPanel({
  chat,
  currentUserId,
}: ChatDetailsPanelProps) {
  const { setDetailsPanel } = useChatUiStore();

  const isGroup = chat.type === 'GROUP';
  const otherParticipant =
    !isGroup
      ? chat.participants.find((p) => p.userId !== currentUserId)
      : null;

  const displayName = isGroup
    ? chat.name ?? 'Group Chat'
    : otherParticipant?.user.name ?? 'Unknown';

  return (
    <div className="flex h-full w-80 flex-col border-l bg-sidebar-bg">
      {/* Header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b px-4">
        <h2 className="text-sm font-semibold">Details</h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setDetailsPanel(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Profile / group info */}
        <div className="flex flex-col items-center gap-2 border-b px-4 py-6">
          <UserAvatar
            name={displayName}
            avatarUrl={isGroup ? chat.avatarUrl : otherParticipant?.user.avatarUrl}
            isOnline={!isGroup ? otherParticipant?.user.isOnline : undefined}
            size="lg"
          />
          <div className="text-center">
            <p className="text-sm font-semibold">{displayName}</p>
            {isGroup && chat.description && (
              <p className="mt-1 text-xs text-muted-foreground">
                {chat.description}
              </p>
            )}
            {!isGroup && otherParticipant && (
              <p className="text-xs text-muted-foreground">
                @{otherParticipant.user.username}
              </p>
            )}
          </div>
        </div>

        {/* Members */}
        {isGroup && (
          <div className="space-y-2 border-b py-4">
            <SectionHeader title={`Members (${chat.participants.length})`} />
            <div className="space-y-1 px-2">
              {chat.participants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-lg px-2 py-2"
                >
                  <UserAvatar
                    name={p.user.name}
                    avatarUrl={p.user.avatarUrl}
                    isOnline={p.user.isOnline}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">
                      {p.user.name}
                      {p.userId === currentUserId && (
                        <span className="ml-1 text-muted-foreground">
                          (you)
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] capitalize text-muted-foreground">
                      {p.role.toLowerCase()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className="space-y-1 py-4 px-2">
          <SectionHeader title="Shared" />
          <div className="mt-2 space-y-0.5">
            <button className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted/60">
              <Image className="h-4 w-4" />
              Photos &amp; Videos
            </button>
            <button className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted/60">
              <FileText className="h-4 w-4" />
              Files &amp; Documents
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-1 border-t py-4 px-2">
          <button className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted/60">
            <Bell className="h-4 w-4" />
            Mute notifications
          </button>
          <button className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10">
            <Trash2 className="h-4 w-4" />
            {isGroup ? 'Leave group' : 'Delete chat'}
          </button>
        </div>
      </div>
    </div>
  );
}
