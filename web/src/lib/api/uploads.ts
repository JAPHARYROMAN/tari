import { API_URL } from '@/lib/constants';
import { useAuthStore } from '@/stores/auth.store';
import { ApiClientError } from './client';

export interface UploadResponse {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
}

export const uploadsApi = {
  async uploadChatMedia(file: File): Promise<UploadResponse> {
    const token = useAuthStore.getState().accessToken;

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_URL}/uploads/chat-media`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({
        statusCode: res.status,
        message: res.statusText,
        timestamp: new Date().toISOString(),
        path: '/uploads/chat-media',
      }));

      throw new ApiClientError(res.status, errorData);
    }

    const json = (await res.json()) as { data: UploadResponse };
    return json.data;
  },
};
