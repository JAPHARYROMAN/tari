'use client';

import { useRouter } from 'next/navigation';
import { Loader2, SearchX } from 'lucide-react';
import { useSearchUsers, useSearchChats } from '@/hooks/use-search';
import { useCreateDirectChat } from '@/hooks/use-chats';
import { UserResultItem, ChatResultItem } from './search-result-item';

interface SearchResultsPanelProps {
  query: string;
  currentUserId: string;
  onClose: () => void;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  );
}

export function SearchResultsPanel({
  query,
  currentUserId,
  onClose,
}: SearchResultsPanelProps) {
  const router = useRouter();
  const usersQuery = useSearchUsers(query);
  const chatsQuery = useSearchChats(query);
  const createDirect = useCreateDirectChat();

  const isLoading = usersQuery.isLoading || chatsQuery.isLoading;
  const users = usersQuery.data ?? [];
  const chats = chatsQuery.data ?? [];
  const hasResults = users.length > 0 || chats.length > 0;

  const handleUserClick = (userId: string) => {
    createDirect.mutate({ targetUserId: userId });
    onClose();
  };

  const handleChatClick = (chatId: string) => {
    router.push(`/chat/${chatId}`);
    onClose();
  };

  if (query.length < 2) return null;

  return (
    <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-80 overflow-y-auto rounded-xl border bg-background shadow-lg">
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && !hasResults && (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <SearchX className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No results for &quot;{query}&quot;
          </p>
        </div>
      )}

      {!isLoading && hasResults && (
        <div className="py-1">
          {users.length > 0 && (
            <div>
              <SectionLabel>People</SectionLabel>
              {users.map((user) => (
                <UserResultItem
                  key={user.id}
                  user={user}
                  onClick={() => handleUserClick(user.id)}
                />
              ))}
            </div>
          )}

          {chats.length > 0 && (
            <div>
              {users.length > 0 && <div className="my-1 h-px bg-border" />}
              <SectionLabel>Conversations</SectionLabel>
              {chats.map((chat) => (
                <ChatResultItem
                  key={chat.id}
                  chat={chat}
                  currentUserId={currentUserId}
                  onClick={() => handleChatClick(chat.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
