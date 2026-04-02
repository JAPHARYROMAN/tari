'use client';

import { useParams } from 'next/navigation';
import { Loader2, UserX, AlertCircle } from 'lucide-react';
import { usePublicProfile } from '@/hooks/use-users';
import { useAuthStore } from '@/stores/auth.store';
import { PublicProfileCard } from '@/components/profile/public-profile-card';
import { EmptyState } from '@/components/common/empty-state';
import { ApiClientError } from '@/lib/api/client';

export default function PublicProfilePage() {
  const params = useParams<{ username: string }>();
  const username = params.username;
  const currentUser = useAuthStore((s) => s.user);

  const { data: profile, isLoading, isError, error } =
    usePublicProfile(username);

  const isNotFound =
    isError && error instanceof ApiClientError && error.statusCode === 404;
  const isOwnProfile = currentUser?.username === username;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={UserX}
          title="User not found"
          description={`No user with username "${username}" exists`}
        />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={AlertCircle}
          title="Failed to load profile"
          description="Check your connection and try again"
        />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-xl px-6 py-8">
        <PublicProfileCard profile={profile} isOwnProfile={isOwnProfile} />
      </div>
    </div>
  );
}
