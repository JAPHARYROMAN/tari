'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { UserAvatar } from '@/components/common/user-avatar';
import { useUpdateProfile } from '@/hooks/use-users';
import { ApiClientError } from '@/lib/api/client';
import {
  updateProfileSchema,
  type UpdateProfileFormData,
} from '@/lib/validations/profile';
import type { CurrentUser } from '@/types/user';

interface ProfileFormProps {
  user: CurrentUser;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const updateProfile = useUpdateProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      displayName: user.profile?.displayName ?? user.name ?? '',
      bio: user.profile?.bio ?? user.bio ?? '',
      statusText: user.profile?.statusText ?? '',
      avatarUrl: user.profile?.avatarUrl ?? user.avatarUrl ?? '',
    },
  });

  // Reset form when user data changes (after successful update)
  useEffect(() => {
    reset({
      displayName: user.profile?.displayName ?? user.name ?? '',
      bio: user.profile?.bio ?? user.bio ?? '',
      statusText: user.profile?.statusText ?? '',
      avatarUrl: user.profile?.avatarUrl ?? user.avatarUrl ?? '',
    });
  }, [user, reset]);

  const onSubmit = (data: UpdateProfileFormData) => {
    updateProfile.mutate({
      displayName: data.displayName || undefined,
      bio: data.bio || undefined,
      statusText: data.statusText || undefined,
      avatarUrl: data.avatarUrl || undefined,
    });
  };

  const serverError =
    updateProfile.error instanceof ApiClientError
      ? updateProfile.error.message
      : updateProfile.error
        ? 'Failed to update profile'
        : null;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Profile</h3>
        <p className="text-xs text-muted-foreground">
          How others see you on Tari
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Avatar preview */}
        <div className="flex items-center gap-4">
          <UserAvatar
            name={user.profile?.displayName ?? user.name}
            avatarUrl={user.profile?.avatarUrl ?? user.avatarUrl}
            size="lg"
          />
          <div className="min-w-0 flex-1 space-y-2">
            <Label htmlFor="avatarUrl">Avatar URL</Label>
            <Input
              id="avatarUrl"
              placeholder="https://example.com/avatar.jpg"
              {...register('avatarUrl')}
            />
            {errors.avatarUrl && (
              <p className="text-xs text-destructive">
                {errors.avatarUrl.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="displayName">Display name</Label>
          <Input
            id="displayName"
            placeholder="Your display name"
            {...register('displayName')}
          />
          {errors.displayName && (
            <p className="text-xs text-destructive">
              {errors.displayName.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            placeholder="Tell others about yourself"
            rows={3}
            {...register('bio')}
          />
          {errors.bio && (
            <p className="text-xs text-destructive">{errors.bio.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="statusText">Status</Label>
          <Input
            id="statusText"
            placeholder="What are you up to?"
            {...register('statusText')}
          />
          {errors.statusText && (
            <p className="text-xs text-destructive">
              {errors.statusText.message}
            </p>
          )}
        </div>

        {serverError && (
          <p className="text-sm text-destructive">{serverError}</p>
        )}

        {updateProfile.isSuccess && !isDirty && (
          <p className="flex items-center gap-1.5 text-sm text-emerald-600">
            <Check className="h-4 w-4" />
            Profile updated
          </p>
        )}

        <Button
          type="submit"
          disabled={updateProfile.isPending || !isDirty}
        >
          {updateProfile.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Save changes
        </Button>
      </form>
    </div>
  );
}
