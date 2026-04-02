'use client';

import { cn } from '@/lib/utils';
import { useChatUiStore } from '@/stores/chat-ui.store';
import { ChatSidebar } from './chat-sidebar';
import { ChatDetailsPanel } from '@/components/chat/chat-details-panel';
import type { Chat, ChatDetail } from '@/types/chat';

interface DashboardShellProps {
  chats: Chat[];
  currentUserId: string;
  activeChat: ChatDetail | null;
  isLoading?: boolean;
  isError?: boolean;
  children: React.ReactNode;
}

export function DashboardShell({
  chats,
  currentUserId,
  activeChat,
  isLoading,
  isError,
  children,
}: DashboardShellProps) {
  const { activeChatId, showDetailsPanel, mobileView } = useChatUiStore();

  return (
    <div className="flex h-screen bg-chat-bg">
      {/* Left sidebar */}
      <div
        className={cn(
          'h-full w-full shrink-0 border-r md:w-80 lg:w-[340px]',
          mobileView === 'conversation' ? 'hidden md:flex' : 'flex',
        )}
      >
        <div className="flex h-full w-full flex-col">
          <ChatSidebar
            chats={chats}
            currentUserId={currentUserId}
            activeChatId={activeChatId}
            isLoading={isLoading}
            isError={isError}
          />
        </div>
      </div>

      {/* Center conversation panel */}
      <div
        className={cn(
          'h-full min-w-0 flex-1',
          mobileView === 'list' ? 'hidden md:flex' : 'flex',
        )}
      >
        <div className="flex h-full w-full flex-col">{children}</div>
      </div>

      {/* Right details panel */}
      {showDetailsPanel && activeChat && (
        <div className="hidden lg:flex">
          <ChatDetailsPanel
            chat={activeChat}
            currentUserId={currentUserId}
          />
        </div>
      )}
    </div>
  );
}
