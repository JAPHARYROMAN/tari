'use client';

import { AlertCircle } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-users';
import { ProfileForm } from '@/components/profile/profile-form';
import { AccountInfo } from '@/components/profile/account-info';
import { EmptyState } from '@/components/common/empty-state';

function SettingsSkeleton() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-xl px-6 py-8">
        <div className="mb-8 space-y-2">
          <div className="h-7 w-32 animate-pulse rounded bg-muted" />
          <div className="h-4 w-52 animate-pulse rounded bg-muted/60" />
        </div>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-20 animate-pulse rounded bg-muted/60" />
              <div className="h-9 w-full animate-pulse rounded-md bg-muted" />
            </div>
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-muted/60" />
              <div className="h-9 w-full animate-pulse rounded-md bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { data: user, isLoading, isError } = useCurrentUser();

  if (isLoading) {
    return <SettingsSkeleton />;
  }

  if (isError || !user) {
    return (
      <div className="flex h-full items-center justify-center px-4">
        <EmptyState
          icon={AlertCircle}
          title="Failed to load settings"
          description="Check your connection and try again"
        />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your profile and account
          </p>
        </div>

        <div className="space-y-10">
          <ProfileForm user={user} />

          <div className="h-px bg-border" />

          <AccountInfo user={user} />

          <div className="h-px bg-border" />

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">Notifications</h3>
              <p className="text-xs text-muted-foreground">
                Notification preferences coming soon
              </p>
            </div>
            <div className="rounded-lg border border-dashed bg-muted/20 p-4 text-center text-sm text-muted-foreground">
              Notification settings will be available in a future update
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
