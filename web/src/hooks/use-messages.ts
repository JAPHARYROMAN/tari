'use client';

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { messagesApi } from '@/lib/api/messages';
import { chatKeys } from './use-chats';
import type { SendMessageInput, EditMessageInput, MessagesResponse } from '@/lib/api/messages';
import type { Message } from '@/types/chat';

export const messageKeys = {
  all: ['messages'] as const,
  list: (chatId: string) => [...messageKeys.all, 'list', chatId] as const,
};

const PAGE_SIZE = 30;

type MessagePages = InfiniteData<MessagesResponse, string | undefined>;

export function useMessages(chatId: string) {
  return useInfiniteQuery<MessagesResponse, Error, MessagePages, readonly unknown[], string | undefined>({
    queryKey: messageKeys.list(chatId),
    queryFn: ({ pageParam }) =>
      messagesApi.list(chatId, {
        cursor: pageParam,
        limit: PAGE_SIZE,
      }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!chatId,
  });
}

/** Flatten all pages into a single messages array (oldest-first). */
export function flattenMessages(
  pages: MessagesResponse[] | undefined,
): Message[] {
  if (!pages) return [];
  const all: Message[] = [];
  for (let i = pages.length - 1; i >= 0; i--) {
    const page = pages[i]!;
    for (let j = page.messages.length - 1; j >= 0; j--) {
      all.push(page.messages[j]!);
    }
  }
  return all;
}

/** Insert a message into the first page of the cache (deduped). */
function insertMessage(old: MessagePages | undefined, message: Message): MessagePages | undefined {
  if (!old) return old;
  const firstPage = old.pages[0];
  if (!firstPage) return old;
  if (firstPage.messages.some((m) => m.id === message.id)) return old;
  return {
    ...old,
    pages: [
      { ...firstPage, messages: [message, ...firstPage.messages] },
      ...old.pages.slice(1),
    ],
  };
}

/** Replace a message in-place across all pages. */
function replaceMessage(old: MessagePages | undefined, message: Message): MessagePages | undefined {
  if (!old) return old;
  return {
    ...old,
    pages: old.pages.map((page) => ({
      ...page,
      messages: page.messages.map((m) => (m.id === message.id ? message : m)),
    })),
  };
}

export function useSendMessage(chatId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SendMessageInput) => messagesApi.send(chatId, input),
    onSuccess: (message) => {
      // Insert directly into cache instead of refetching
      queryClient.setQueryData<MessagePages>(
        messageKeys.list(chatId),
        (old) => insertMessage(old, message),
      );
      queryClient.invalidateQueries({ queryKey: chatKeys.list() });
    },
  });
}

export function useEditMessage(chatId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      messageId,
      input,
    }: {
      messageId: string;
      input: EditMessageInput;
    }) => messagesApi.edit(messageId, input),
    onSuccess: (message) => {
      queryClient.setQueryData<MessagePages>(
        messageKeys.list(chatId),
        (old) => replaceMessage(old, message),
      );
    },
  });
}

export function useDeleteMessage(chatId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => messagesApi.delete(messageId),
    onSuccess: (message) => {
      queryClient.setQueryData<MessagePages>(
        messageKeys.list(chatId),
        (old) => replaceMessage(old, message),
      );
      queryClient.invalidateQueries({ queryKey: chatKeys.list() });
    },
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => messagesApi.markRead(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.list() });
    },
  });
}
