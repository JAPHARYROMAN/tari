'use client';

import { useRouter } from 'next/navigation';
import { Loader2, Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/empty-state';
import { NotificationItem } from './notification-item';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/hooks/use-notifications';
import type { Notification } from '@/lib/api/notifications';

interface NotificationsPanelProps {
  onClose: () => void;
}

function getNavigationTarget(notification: Notification): string | null {
  const data = notification.data as Record<string, unknown> | null;
  if (!data) return null;

  const chatId = data['chatId'] as string | undefined;
  if (chatId) return `/chat/${chatId}`;

  return null;
}

export function NotificationsPanel({ onClose }: NotificationsPanelProps) {
  const router = useRouter();
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const handleClick = (notification: Notification) => {
    if (!notification.isRead) {
      markRead.mutate(notification.id);
    }

    const target = getNavigationTarget(notification);
    if (target) {
      router.push(target);
    }

    onClose();
  };

  const hasUnread = notifications?.some((n) => !n.isRead) ?? false;

  return (
    <div className="absolute bottom-full left-0 z-50 mb-2 w-80 max-h-[min(24rem,70vh)] overflow-hidden rounded-xl border bg-background shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Notifications</h3>
        {hasUnread && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            <CheckCheck className="mr-1 h-3.5 w-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="max-h-72 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && (!notifications || notifications.length === 0) && (
          <EmptyState
            icon={Bell}
            title="No notifications"
            description="You're all caught up"
            className="py-8"
          />
        )}

        {!isLoading && notifications && notifications.length > 0 && (
          <div className="p-1">
            {notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onClick={() => handleClick(n)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
