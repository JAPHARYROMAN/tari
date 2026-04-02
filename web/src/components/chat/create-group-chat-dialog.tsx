'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateGroupChat } from '@/hooks/use-chats';
import { apiClient, ApiClientError } from '@/lib/api/client';
import {
  createGroupChatSchema,
  type CreateGroupChatFormData,
} from '@/lib/validations/chat';

interface PublicProfile {
  id: string;
  username: string;
  name: string;
}

interface CreateGroupChatDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CreateGroupChatDialog({
  open,
  onClose,
}: CreateGroupChatDialogProps) {
  const createGroup = useCreateGroupChat();
  const [error, setError] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateGroupChatFormData>({
    resolver: zodResolver(createGroupChatSchema),
    defaultValues: { name: '', description: '', participantUsernames: '' },
  });

  const handleClose = () => {
    reset();
    setError(null);
    createGroup.reset();
    onClose();
  };

  const onSubmit = async (data: CreateGroupChatFormData) => {
    setError(null);
    setIsResolving(true);

    // Resolve usernames to user IDs
    const usernames =
      typeof data.participantUsernames === 'string'
        ? data.participantUsernames
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : data.participantUsernames;

    if (usernames.length === 0) {
      setError('Add at least one participant');
      setIsResolving(false);
      return;
    }

    const participantIds: string[] = [];

    for (const username of usernames) {
      try {
        const profile = await apiClient<PublicProfile>(
          `/profiles/${username.toLowerCase()}`,
          { method: 'GET' },
        );
        participantIds.push(profile.id);
      } catch {
        setError(`User "${username}" not found`);
        setIsResolving(false);
        return;
      }
    }

    setIsResolving(false);

    createGroup.mutate(
      {
        name: data.name,
        description: data.description || undefined,
        participantIds,
      },
      { onSuccess: handleClose },
    );
  };

  const isPending = isResolving || createGroup.isPending;

  const serverError =
    error ??
    (createGroup.error instanceof ApiClientError
      ? createGroup.error.message
      : createGroup.error
        ? 'Failed to create group'
        : null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-md rounded-xl border bg-background p-6 shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <h2 className="text-lg font-semibold">New group</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">Group name</Label>
            <Input
              id="group-name"
              placeholder="e.g. Project Team"
              autoComplete="off"
              autoFocus
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="group-description">
              Description{' '}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Input
              id="group-description"
              placeholder="What is this group about?"
              autoComplete="off"
              {...register('description')}
            />
            {errors.description && (
              <p className="text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="group-participants">Members</Label>
            <Input
              id="group-participants"
              placeholder="Usernames, separated by commas"
              autoComplete="off"
              {...register('participantUsernames')}
            />
            <p className="text-xs text-muted-foreground">
              Enter usernames separated by commas (e.g. alice, bob)
            </p>
            {errors.participantUsernames && (
              <p className="text-xs text-destructive">
                {errors.participantUsernames.message}
              </p>
            )}
          </div>

          {serverError && (
            <p className="text-sm text-destructive">{serverError}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create group
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
