import { MessageSquare } from 'lucide-react';

export function EmptyConversationState() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-chat-bg px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <MessageSquare className="h-8 w-8 text-primary/50" />
      </div>
      <h2 className="mt-4 text-base font-semibold">Select a conversation</h2>
      <p className="mt-1 max-w-[240px] text-center text-sm text-muted-foreground">
        Choose a chat from the sidebar to start messaging
      </p>
    </div>
  );
}
