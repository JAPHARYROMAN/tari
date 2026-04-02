import { create } from 'zustand';

interface ChatUiState {
  /** Currently selected chat ID (from route) */
  activeChatId: string | null;
  /** Whether the right details panel is visible */
  showDetailsPanel: boolean;
  /** Mobile view mode: 'list' shows sidebar, 'conversation' shows chat */
  mobileView: 'list' | 'conversation';
}

interface ChatUiActions {
  setActiveChatId: (id: string | null) => void;
  toggleDetailsPanel: () => void;
  setDetailsPanel: (open: boolean) => void;
  setMobileView: (view: 'list' | 'conversation') => void;
}

export const useChatUiStore = create<ChatUiState & ChatUiActions>()(
  (set) => ({
    activeChatId: null,
    showDetailsPanel: false,
    mobileView: 'list',

    setActiveChatId: (id) =>
      set({ activeChatId: id, mobileView: id ? 'conversation' : 'list' }),
    toggleDetailsPanel: () =>
      set((s) => ({ showDetailsPanel: !s.showDetailsPanel })),
    setDetailsPanel: (open) => set({ showDetailsPanel: open }),
    setMobileView: (view) => set({ mobileView: view }),
  }),
);
