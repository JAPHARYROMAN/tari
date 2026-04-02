export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    username: string;
    name: string;
    avatarUrl: string | null;
  };
  tokens: AuthTokens;
}
