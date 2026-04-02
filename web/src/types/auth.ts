export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  avatarUrl: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  name: string;
}

export interface LoginPayload {
  emailOrUsername: string;
  password: string;
}
