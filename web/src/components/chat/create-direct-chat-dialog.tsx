'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, MessageSquarePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateDirectChat } from '@/hooks/use-chats';
import { apiClient, ApiClientError } from '@/lib/api/client';
import {
  createDirectChatSchema,
  type CreateDirectChatFormData,
} from '@/lib/validations/chat';

interface PublicProfile {
  id: string;
  username: string;
  name: string;
}

interface CreateDirectChatDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CreateDirectChatDialog({
  open,
  onClose,
}: CreateDirectChatDialogProps) {
  const createChat = useCreateDirectChat();
  const [error, setError] = useState<string | null>(null);
  const [isLooking, setIsLooking] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateDirectChatFormData>({
    resolver: zodResolver(createDirectChatSchema),
    defaultValues: { username: '' },
  });

  const handleClose = () => {
    reset();
    setError(null);
    createChat.reset();
    onClose();
  };

  const onSubmit = async (data: CreateDirectChatFormData) => {
    setError(null);
    setIsLooking(true);

    try {
      const profile = await apiClient<PublicProfile>(
        `/profiles/${data.username.toLowerCase()}`,
        { method: 'GET' },
      );

      setIsLooking(false);

      createChat.mutate(
        { targetUserId: profile.id },
        { onSuccess: handleClose },
      );
    } catch (err) {
      setIsLooking(false);
      if (err instanceof ApiClientError && err.statusCode === 404) {
        setError('User not found');
      } else {
        setError('Failed to look up user');
      }
    }
  };

  const isPending = isLooking || createChat.isPending;

  const serverError =
    error ??
    (createChat.error instanceof ApiClientError
      ? createChat.error.message
      : createChat.error
        ? 'Failed to create chat'
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
            <MessageSquarePlus className="h-5 w-5" />
            <h2 className="text-lg font-semibold">New conversation</h2>
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
            <Label htmlFor="direct-username">Username</Label>
            <Input
              id="direct-username"
              placeholder="Enter a username to start chatting"
              autoComplete="off"
              autoFocus
              {...register('username')}
            />
            {errors.username && (
              <p className="text-xs text-destructive">
                {errors.username.message}
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
              Start chat
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
