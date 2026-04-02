import { apiClient } from './client';

export interface SearchUserResult {
  id: string;
  username: string;
  name: string;
  avatarUrl: string | null;
  isOnline: boolean;
  lastSeen: string;
  profile: {
    displayName: string | null;
    avatarUrl: string | null;
    bio: string | null;
    statusText: string | null;
  } | null;
}

export interface SearchChatParticipant {
  userId: string;
  role: string;
  user: {
    id: string;
    username: string;
    name: string;
    avatarUrl: string | null;
    isOnline: boolean;
  };
}

export interface SearchChatResult {
  id: string;
  type: 'DIRECT' | 'GROUP';
  name: string | null;
  avatarUrl: string | null;
  description: string | null;
  lastMessageAt: string;
  updatedAt: string;
  participants: SearchChatParticipant[];
}

export const searchApi = {
  users(query: string): Promise<SearchUserResult[]> {
    return apiClient<SearchUserResult[]>(
      `/search/users?q=${encodeURIComponent(query)}`,
      { method: 'GET' },
    );
  },

  chats(query: string): Promise<SearchChatResult[]> {
    return apiClient<SearchChatResult[]>(
      `/search/chats?q=${encodeURIComponent(query)}`,
      { method: 'GET' },
    );
  },
};
