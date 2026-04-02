'use client';

import { MessageSquare, Users, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Notification } from '@/lib/api/notifications';

interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
}

const iconMap = {
  MESSAGE: MessageSquare,
  CHAT_INVITE: Users,
  SYSTEM: Info,
} as const;

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function NotificationItem({
  notification,
  onClick,
}: NotificationItemProps) {
  const Icon = iconMap[notification.type] ?? Info;

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted/60',
        !notification.isRead && 'bg-accent/50',
      )}
    >
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
          notification.isRead ? 'bg-muted' : 'bg-foreground/10',
        )}
      >
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p
            className={cn(
              'truncate text-sm',
              !notification.isRead && 'font-medium',
            )}
          >
            {notification.title}
          </p>
          {!notification.isRead && (
            <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
          )}
        </div>
        {notification.body && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {notification.body}
          </p>
        )}
        <p className="mt-1 text-[11px] text-muted-foreground">
          {formatTime(notification.createdAt)}
        </p>
      </div>
    </button>
  );
}
