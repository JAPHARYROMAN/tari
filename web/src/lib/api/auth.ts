import { apiClient } from './client';
import type {
  AuthResponse,
  AuthTokens,
  LoginPayload,
  RegisterPayload,
} from '@/types/auth';

export const authApi = {
  register(payload: RegisterPayload): Promise<AuthResponse> {
    return apiClient<AuthResponse>('/auth/register', {
      method: 'POST',
      body: payload,
      skipAuth: true,
    });
  },

  login(payload: LoginPayload): Promise<AuthResponse> {
    return apiClient<AuthResponse>('/auth/login', {
      method: 'POST',
      body: payload,
      skipAuth: true,
    });
  },

  refresh(refreshToken: string): Promise<AuthTokens> {
    return apiClient<AuthTokens>('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
      skipAuth: true,
    });
  },

  logout(refreshToken: string): Promise<{ message: string }> {
    return apiClient<{ message: string }>('/auth/logout', {
      method: 'POST',
      body: { refreshToken },
      skipAuth: true,
    });
  },
};
