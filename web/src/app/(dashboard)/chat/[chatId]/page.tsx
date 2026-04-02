'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useChatUiStore } from '@/stores/chat-ui.store';
import { useAuthStore } from '@/stores/auth.store';
import { useChatDetail } from '@/hooks/use-chats';
import { ConversationPanel } from '@/components/chat/conversation-panel';
import { EmptyConversationState } from '@/components/chat/empty-conversation-state';

export default function ChatDetailPage() {
  const params = useParams<{ chatId: string }>();
  const router = useRouter();
  const chatId = params.chatId;
  const setActiveChatId = useChatUiStore((s) => s.setActiveChatId);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    setActiveChatId(chatId);
    return () => setActiveChatId(null);
  }, [chatId, setActiveChatId]);

  const { data: chat, isLoading, isError, error } = useChatDetail(chatId);

  // Redirect to chat list on 403/404 (invalid or inaccessible chat)
  useEffect(() => {
    if (!isError || !error) return;
    const status = (error as { statusCode?: number })?.statusCode;
    if (status === 403 || status === 404) {
      router.replace('/chat');
    }
  }, [isError, error, router]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !chat || !user) {
    return <EmptyConversationState />;
  }

  return <ConversationPanel chat={chat} currentUserId={user.id} />;
}
