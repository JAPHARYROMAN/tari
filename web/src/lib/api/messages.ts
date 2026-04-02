import { apiClient } from './client';
import type { Message } from '@/types/chat';

export interface MessagesResponse {
  messages: Message[];
  nextCursor: string | null;
}

export interface SendMessageInput {
  type?: 'TEXT' | 'IMAGE' | 'FILE';
  content?: string;
  replyToId?: string;
  attachments?: {
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    width?: number;
    height?: number;
  }[];
}

export interface EditMessageInput {
  content: string;
}

export interface ReadReceipt {
  chatId: string;
  userId: string;
  lastReadMessageId: string;
  readAt: string;
}

export const messagesApi = {
  list(
    chatId: string,
    params?: { cursor?: string; limit?: number },
  ): Promise<MessagesResponse> {
    const search = new URLSearchParams();
    if (params?.cursor) search.set('cursor', params.cursor);
    if (params?.limit) search.set('limit', String(params.limit));
    const qs = search.toString();
    return apiClient<MessagesResponse>(
      `/chats/${chatId}/messages${qs ? `?${qs}` : ''}`,
      { method: 'GET' },
    );
  },

  send(chatId: string, input: SendMessageInput): Promise<Message> {
    return apiClient<Message>(`/chats/${chatId}/messages`, {
      method: 'POST',
      body: input,
    });
  },

  edit(messageId: string, input: EditMessageInput): Promise<Message> {
    return apiClient<Message>(`/messages/${messageId}`, {
      method: 'PATCH',
      body: input,
    });
  },

  delete(messageId: string): Promise<Message> {
    return apiClient<Message>(`/messages/${messageId}`, {
      method: 'DELETE',
    });
  },

  markRead(messageId: string): Promise<ReadReceipt> {
    return apiClient<ReadReceipt>(`/messages/${messageId}/read`, {
      method: 'POST',
    });
  },
};
