'use client';

import { Mail, AtSign, Calendar } from 'lucide-react';
import type { CurrentUser } from '@/types/user';

interface AccountInfoProps {
  user: CurrentUser;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function AccountInfo({ user }: AccountInfoProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Account</h3>
        <p className="text-xs text-muted-foreground">
          Account details cannot be changed here
        </p>
      </div>

      <div className="space-y-3 rounded-lg border bg-card p-4">
        <div className="flex items-center gap-3">
          <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="truncate text-sm">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <AtSign className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Username</p>
            <p className="truncate text-sm">{user.username}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Joined</p>
            <p className="text-sm">{formatDate(user.createdAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
