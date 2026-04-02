'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { chatsApi } from '@/lib/api/chats';
import type { CreateDirectChatInput, CreateGroupChatInput } from '@/types/chat';

export const chatKeys = {
  all: ['chats'] as const,
  list: () => [...chatKeys.all, 'list'] as const,
  detail: (id: string) => [...chatKeys.all, 'detail', id] as const,
};

export function useChats() {
  return useQuery({
    queryKey: chatKeys.list(),
    queryFn: () => chatsApi.list(),
  });
}

export function useChatDetail(chatId: string | null) {
  return useQuery({
    queryKey: chatKeys.detail(chatId!),
    queryFn: () => chatsApi.getById(chatId!),
    enabled: !!chatId,
  });
}

export function useCreateDirectChat() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (input: CreateDirectChatInput) => chatsApi.createDirect(input),
    onSuccess: (chat) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.list() });
      router.push(`/chat/${chat.id}`);
    },
  });
}

export function useCreateGroupChat() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (input: CreateGroupChatInput) => chatsApi.createGroup(input),
    onSuccess: (chat) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.list() });
      router.push(`/chat/${chat.id}`);
    },
  });
}
