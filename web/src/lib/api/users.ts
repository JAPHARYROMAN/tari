import { apiClient } from './client';
import type {
  CurrentUser,
  PublicProfile,
  UpdateProfileInput,
  ProfileDetail,
} from '@/types/user';

export const usersApi = {
  getMe(): Promise<CurrentUser> {
    return apiClient<CurrentUser>('/users/me', { method: 'GET' });
  },
};

export const profilesApi = {
  getByUsername(username: string): Promise<PublicProfile> {
    return apiClient<PublicProfile>(`/profiles/${username}`, {
      method: 'GET',
    });
  },

  updateMy(input: UpdateProfileInput): Promise<ProfileDetail> {
    return apiClient<ProfileDetail>('/profiles/me', {
      method: 'PATCH',
      body: input,
    });
  },
};
