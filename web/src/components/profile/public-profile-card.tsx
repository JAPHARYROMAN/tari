'use client';

import { Calendar, MessageSquare, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { UserAvatar } from '@/components/common/user-avatar';
import { Button } from '@/components/ui/button';
import type { PublicProfile } from '@/types/user';

interface PublicProfileCardProps {
  profile: PublicProfile;
  isOwnProfile: boolean;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
  });
}

export function PublicProfileCard({
  profile,
  isOwnProfile,
}: PublicProfileCardProps) {
  const router = useRouter();

  const displayName = profile.profile?.displayName ?? profile.name;
  const avatarUrl = profile.profile?.avatarUrl;
  const bio = profile.profile?.bio;
  const statusText = profile.profile?.statusText;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-5">
        <UserAvatar
          name={displayName}
          avatarUrl={avatarUrl}
          isOnline={profile.isOnline}
          size="lg"
        />
        <div className="min-w-0 flex-1 pt-0.5">
          <h1 className="text-xl font-bold">{displayName}</h1>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
          {statusText && (
            <p className="mt-1.5 text-sm italic text-muted-foreground">
              &ldquo;{statusText}&rdquo;
            </p>
          )}
        </div>
      </div>

      {/* Bio */}
      {bio ? (
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm leading-relaxed">{bio}</p>
        </div>
      ) : isOwnProfile ? (
        <div className="rounded-lg border border-dashed bg-muted/20 p-4 text-center text-sm text-muted-foreground">
          No bio yet. Add one in your settings.
        </div>
      ) : null}

      {/* Info */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4" />
          <span>Joined {formatDate(profile.createdAt)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`h-2 w-2 rounded-full ${
              profile.isOnline ? 'bg-emerald-500' : 'bg-muted-foreground/40'
            }`}
          />
          <span>{profile.isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {!isOwnProfile && (
          <Button
            variant="outline"
            onClick={() => router.push('/chat')}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Send message
          </Button>
        )}

        {isOwnProfile && (
          <Button variant="outline" onClick={() => router.push('/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            Edit profile
          </Button>
        )}
      </div>
    </div>
  );
}
