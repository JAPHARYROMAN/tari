'use client';

import { useQuery } from '@tanstack/react-query';
import { searchApi } from '@/lib/api/search';

export const searchKeys = {
  users: (q: string) => ['search', 'users', q] as const,
  chats: (q: string) => ['search', 'chats', q] as const,
};

export function useSearchUsers(query: string) {
  return useQuery({
    queryKey: searchKeys.users(query),
    queryFn: () => searchApi.users(query),
    enabled: query.length >= 2,
    staleTime: 10_000,
  });
}

export function useSearchChats(query: string) {
  return useQuery({
    queryKey: searchKeys.chats(query),
    queryFn: () => searchApi.chats(query),
    enabled: query.length >= 2,
    staleTime: 10_000,
  });
}
