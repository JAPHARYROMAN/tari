'use client';

import { Settings, LogOut } from 'lucide-react';
import Link from 'next/link';
import { UserAvatar } from '@/components/common/user-avatar';
import { Button } from '@/components/ui/button';
import { NotificationsButton } from '@/components/notifications/notifications-button';
import { useAuthStore } from '@/stores/auth.store';
import { useLogout } from '@/hooks/use-auth';

export function ChatSidebarFooter() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  if (!user) return null;

  return (
    <div className="shrink-0 border-t px-3 py-3">
      <div className="flex items-center gap-3">
        <Link href={`/profile/${user.username}`}>
          <UserAvatar
            name={user.name}
            avatarUrl={user.avatarUrl}
            size="sm"
            isOnline
            className="cursor-pointer transition-opacity hover:opacity-80"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={`/profile/${user.username}`}
            className="block truncate text-sm font-medium hover:underline"
          >
            {user.name}
          </Link>
          <p className="truncate text-xs text-muted-foreground">
            @{user.username}
          </p>
        </div>
        <div className="flex items-center">
          <NotificationsButton />
          <Link href="/settings">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={() => logout.mutate()}
            aria-label="Log out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
