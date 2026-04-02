import { apiClient } from './client';

export interface Notification {
  id: string;
  type: 'MESSAGE' | 'CHAT_INVITE' | 'SYSTEM';
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

export interface UnreadCountResponse {
  count: number;
}

export const notificationsApi = {
  list(): Promise<Notification[]> {
    return apiClient<Notification[]>('/notifications', { method: 'GET' });
  },

  unreadCount(): Promise<UnreadCountResponse> {
    return apiClient<UnreadCountResponse>('/notifications/unread-count', {
      method: 'GET',
    });
  },

  markRead(notificationId: string): Promise<Notification> {
    return apiClient<Notification>(
      `/notifications/${notificationId}/read`,
      { method: 'PATCH' },
    );
  },

  markAllRead(): Promise<{ count: number }> {
    return apiClient<{ count: number }>('/notifications/read-all', {
      method: 'PATCH',
    });
  },
};
