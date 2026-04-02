'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, profilesApi } from '@/lib/api/users';
import { useAuthStore } from '@/stores/auth.store';
import type { UpdateProfileInput } from '@/types/user';

export const userKeys = {
  me: ['users', 'me'] as const,
  profile: (username: string) => ['profiles', username] as const,
};

export function useCurrentUser() {
  return useQuery({
    queryKey: userKeys.me,
    queryFn: () => usersApi.getMe(),
  });
}

export function usePublicProfile(username: string) {
  return useQuery({
    queryKey: userKeys.profile(username),
    queryFn: () => profilesApi.getByUsername(username),
    enabled: !!username,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (input: UpdateProfileInput) => profilesApi.updateMy(input),
    onSuccess: (profileData) => {
      // Invalidate the /users/me query so it refetches
      queryClient.invalidateQueries({ queryKey: userKeys.me });

      // Update the Zustand auth store user so sidebar/header reflects changes
      if (user) {
        setUser({
          ...user,
          name: profileData.displayName ?? user.name,
          avatarUrl: profileData.avatarUrl ?? user.avatarUrl,
        });
      }
    },
  });
}
