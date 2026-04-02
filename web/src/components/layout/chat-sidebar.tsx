'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquarePlus, Users } from 'lucide-react';
import { AppLogo } from '@/components/common/app-logo';
import { SearchInput } from '@/components/common/search-input';
import { ChatList } from '@/components/chat/chat-list';
import { ChatSidebarFooter } from './chat-sidebar-footer';
import { CreateDirectChatDialog } from '@/components/chat/create-direct-chat-dialog';
import { CreateGroupChatDialog } from '@/components/chat/create-group-chat-dialog';
import { SearchResultsPanel } from '@/components/search/search-results-panel';
import { Button } from '@/components/ui/button';
import type { Chat } from '@/types/chat';

interface ChatSidebarProps {
  chats: Chat[];
  currentUserId: string;
  activeChatId: string | null;
  isLoading?: boolean;
  isError?: boolean;
}

export function ChatSidebar({
  chats,
  currentUserId,
  activeChatId,
  isLoading,
  isError,
}: ChatSidebarProps) {
  const [showDirectDialog, setShowDirectDialog] = useState(false);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Show results when there's a query
  useEffect(() => {
    setShowResults(debouncedQuery.length >= 2);
  }, [debouncedQuery]);

  // Close results on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCloseResults = useCallback(() => {
    setShowResults(false);
    setSearchInput('');
    setDebouncedQuery('');
  }, []);

  return (
    <div className="flex h-full flex-col bg-sidebar-bg">
      {/* Header */}
      <div className="shrink-0 space-y-3 px-4 pb-2 pt-4">
        <div className="flex items-center justify-between">
          <AppLogo />
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground"
              title="New group"
              onClick={() => setShowGroupDialog(true)}
            >
              <Users className="h-[18px] w-[18px]" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground"
              title="New chat"
              onClick={() => setShowDirectDialog(true)}
            >
              <MessageSquarePlus className="h-[18px] w-[18px]" />
            </Button>
          </div>
        </div>

        {/* Search with results dropdown */}
        <div ref={searchContainerRef} className="relative">
          <SearchInput
            placeholder="Search people and chats..."
            value={searchInput}
            onChange={(val) => {
              setSearchInput(val);
              if (!val.trim()) setShowResults(false);
            }}
            onFocus={() => {
              if (debouncedQuery.length >= 2) setShowResults(true);
            }}
          />
          {showResults && (
            <SearchResultsPanel
              query={debouncedQuery}
              currentUserId={currentUserId}
              onClose={handleCloseResults}
            />
          )}
        </div>
      </div>

      {/* Chat list */}
      <ChatList
        chats={chats}
        currentUserId={currentUserId}
        activeChatId={activeChatId}
        isLoading={isLoading}
        isError={isError}
        onNewChat={() => setShowDirectDialog(true)}
      />

      {/* Footer */}
      <ChatSidebarFooter />

      {/* Dialogs */}
      <CreateDirectChatDialog
        open={showDirectDialog}
        onClose={() => setShowDirectDialog(false)}
      />
      <CreateGroupChatDialog
        open={showGroupDialog}
        onClose={() => setShowGroupDialog(false)}
      />
    </div>
  );
}
