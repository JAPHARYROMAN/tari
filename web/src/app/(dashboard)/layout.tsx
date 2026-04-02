'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { useChatUiStore } from '@/stores/chat-ui.store';
import { useChats, useChatDetail } from '@/hooks/use-chats';
import { useSocket } from '@/hooks/use-socket';
import { useNotificationEvents } from '@/hooks/use-notification-events';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const activeChatId = useChatUiStore((s) => s.activeChatId);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace('/login');
    }
  }, [hydrated, isAuthenticated, router]);

  // Initialize socket connection when authenticated
  useSocket();

  // Listen for realtime notification events
  useNotificationEvents();

  const chatsQuery = useChats();
  const chatDetailQuery = useChatDetail(activeChatId);

  if (!hydrated || !isAuthenticated || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
          <p className="text-xs text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardShell
      chats={chatsQuery.data ?? []}
      currentUserId={user.id}
      activeChat={chatDetailQuery.data ?? null}
      isLoading={chatsQuery.isLoading}
      isError={chatsQuery.isError}
    >
      {children}
    </DashboardShell>
  );
}
