import { API_URL } from '@/lib/constants';
import { useAuthStore } from '@/stores/auth.store';

interface ApiError {
  statusCode: number;
  message: string | string[];
  timestamp: string;
  path: string;
}

export class ApiClientError extends Error {
  constructor(
    public statusCode: number,
    public data: ApiError,
  ) {
    const msg = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message;
    super(msg);
    this.name = 'ApiClientError';
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  skipAuth?: boolean;
};

let refreshPromise: Promise<void> | null = null;

async function refreshTokens(): Promise<void> {
  const { refreshToken, setTokens, clearAuth } = useAuthStore.getState();

  if (!refreshToken) {
    clearAuth();
    throw new Error('No refresh token');
  }

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    clearAuth();
    throw new Error('Token refresh failed');
  }

  const json = (await res.json()) as { data: { accessToken: string; refreshToken: string } };
  setTokens(json.data.accessToken, json.data.refreshToken);
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, skipAuth = false, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((customHeaders as Record<string, string>) ?? {}),
  };

  if (!skipAuth) {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  let res = await fetch(`${API_URL}${endpoint}`, {
    ...rest,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // If 401 and we have a refresh token, try to refresh once
  if (res.status === 401 && !skipAuth) {
    if (!refreshPromise) {
      refreshPromise = refreshTokens().finally(() => {
        refreshPromise = null;
      });
    }

    try {
      await refreshPromise;
    } catch {
      throw new ApiClientError(401, {
        statusCode: 401,
        message: 'Session expired',
        timestamp: new Date().toISOString(),
        path: endpoint,
      });
    }

    // Retry with new token
    const newToken = useAuthStore.getState().accessToken;
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
    }

    res = await fetch(`${API_URL}${endpoint}`, {
      ...rest,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  if (!res.ok) {
    const errorData = (await res.json().catch(() => ({
      statusCode: res.status,
      message: res.statusText,
      timestamp: new Date().toISOString(),
      path: endpoint,
    }))) as ApiError;

    throw new ApiClientError(res.status, errorData);
  }

  const json = (await res.json()) as { data: T };
  return json.data;
}
