'use client';

import { useEffect } from 'react';
import { useChatUiStore } from '@/stores/chat-ui.store';
import { EmptyConversationState } from '@/components/chat/empty-conversation-state';

export default function ChatPage() {
  const setActiveChatId = useChatUiStore((s) => s.setActiveChatId);

  useEffect(() => {
    setActiveChatId(null);
  }, [setActiveChatId]);

  return <EmptyConversationState />;
}
