// ── GET /users/me response ───────────────────────────

export interface CurrentUserProfile {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  statusText: string | null;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CurrentUser {
  id: string;
  email: string;
  username: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  isOnline: boolean;
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
  profile: CurrentUserProfile | null;
}

// ── GET /profiles/:username response ────────────────

export interface PublicProfileData {
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  statusText: string | null;
  lastSeenAt: string;
}

export interface PublicProfile {
  id: string;
  username: string;
  name: string;
  isOnline: boolean;
  lastSeen: string;
  createdAt: string;
  profile: PublicProfileData | null;
}

// ── PATCH /profiles/me input ────────────────────────

export interface UpdateProfileInput {
  displayName?: string;
  bio?: string;
  statusText?: string;
  avatarUrl?: string;
}

// ── PATCH /profiles/me response ─────────────────────

export interface ProfileDetail {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  statusText: string | null;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
}
