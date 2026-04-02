// ── Participant types ────────────────────────────────

export interface ChatParticipantUser {
  id: string;
  username: string;
  name: string;
  avatarUrl: string | null;
  isOnline: boolean;
  lastSeen: string;
}

export interface ChatParticipant {
  id: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  userId: string;
  user: ChatParticipantUser;
}

export interface ChatDetailParticipant extends ChatParticipant {
  isPinned: boolean;
  isMuted: boolean;
  joinedAt: string;
}

// ── Chat list types (GET /chats) ────────────────────

export interface ChatLastMessage {
  id: string;
  content: string | null;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  createdAt: string;
  sender: {
    id: string;
    username: string;
    name: string;
  };
}

export interface Chat {
  id: string;
  type: 'DIRECT' | 'GROUP';
  name: string | null;
  avatarUrl: string | null;
  description: string | null;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
  participants: ChatParticipant[];
  messages: ChatLastMessage[];
  unreadCount: number;
}

// ── Chat detail types (GET /chats/:id) ──────────────

export interface ChatDetail {
  id: string;
  type: 'DIRECT' | 'GROUP';
  name: string | null;
  avatarUrl: string | null;
  description: string | null;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
  participants: ChatDetailParticipant[];
}

// ── Creation DTOs ───────────────────────────────────

export interface CreateDirectChatInput {
  targetUserId: string;
}

export interface CreateGroupChatInput {
  name: string;
  description?: string;
  avatarUrl?: string;
  participantIds: string[];
}

// ── Message types (kept for conversation panel) ─────

export interface MessageSender {
  id: string;
  username: string;
  name: string;
  avatarUrl: string | null;
}

export interface MessageAttachment {
  id: string;
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  width: number | null;
  height: number | null;
}

export interface Message {
  id: string;
  chatId: string;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  content: string | null;
  isEdited: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  replyToId: string | null;
  sender: MessageSender;
  replyTo: {
    id: string;
    content: string | null;
    sender: { id: string; username: string; name: string };
  } | null;
  attachments: MessageAttachment[];
}
