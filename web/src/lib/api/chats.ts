import { apiClient } from './client';
import type {
  Chat,
  ChatDetail,
  CreateDirectChatInput,
  CreateGroupChatInput,
} from '@/types/chat';

export const chatsApi = {
  list(): Promise<Chat[]> {
    return apiClient<Chat[]>('/chats', { method: 'GET' });
  },

  getById(chatId: string): Promise<ChatDetail> {
    return apiClient<ChatDetail>(`/chats/${chatId}`, { method: 'GET' });
  },

  createDirect(input: CreateDirectChatInput): Promise<ChatDetail> {
    return apiClient<ChatDetail>('/chats/direct', {
      method: 'POST',
      body: input,
    });
  },

  createGroup(input: CreateGroupChatInput): Promise<ChatDetail> {
    return apiClient<ChatDetail>('/chats/group', {
      method: 'POST',
      body: input,
    });
  },
};
