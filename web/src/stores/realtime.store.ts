import { create } from 'zustand';

// ── Typing state ────────────────────────────────────

interface TypingUser {
  userId: string;
  username: string;
}

interface PresenceEntry {
  status: 'online' | 'offline';
  lastSeenAt: string;
}

interface RealtimeState {
  /** Map of chatId → array of currently typing users */
  typingByChat: Record<string, TypingUser[]>;
  /** Map of userId → presence info */
  presence: Record<string, PresenceEntry>;
}

interface RealtimeActions {
  addTypingUser: (chatId: string, user: TypingUser) => void;
  removeTypingUser: (chatId: string, userId: string) => void;
  clearTypingForChat: (chatId: string) => void;
  updatePresence: (userId: string, entry: PresenceEntry) => void;
}

export const useRealtimeStore = create<RealtimeState & RealtimeActions>()(
  (set) => ({
    typingByChat: {},
    presence: {},

    addTypingUser: (chatId, user) =>
      set((s) => {
        const current = s.typingByChat[chatId] ?? [];
        if (current.some((t) => t.userId === user.userId)) return s;
        return {
          typingByChat: {
            ...s.typingByChat,
            [chatId]: [...current, user],
          },
        };
      }),

    removeTypingUser: (chatId, userId) =>
      set((s) => {
        const current = s.typingByChat[chatId];
        if (!current) return s;
        return {
          typingByChat: {
            ...s.typingByChat,
            [chatId]: current.filter((t) => t.userId !== userId),
          },
        };
      }),

    clearTypingForChat: (chatId) =>
      set((s) => {
        const { [chatId]: _, ...rest } = s.typingByChat;
        return { typingByChat: rest };
      }),

    updatePresence: (userId, entry) =>
      set((s) => ({
        presence: { ...s.presence, [userId]: entry },
      })),
  }),
);
