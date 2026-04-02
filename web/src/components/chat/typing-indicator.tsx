'use client';

import { useTypingUsers } from '@/hooks/use-typing';

interface TypingIndicatorProps {
  chatId: string;
}

export function TypingIndicator({ chatId }: TypingIndicatorProps) {
  const typingUsers = useTypingUsers(chatId);

  if (typingUsers.length === 0) return null;

  const text =
    typingUsers.length === 1
      ? `${typingUsers[0]!.username} is typing`
      : typingUsers.length === 2
        ? `${typingUsers[0]!.username} and ${typingUsers[1]!.username} are typing`
        : `${typingUsers[0]!.username} and ${typingUsers.length - 1} others are typing`;

  return (
    <div className="flex items-center gap-2 bg-muted/30 px-5 py-2">
      <div className="flex items-center gap-[3px]">
        <span className="h-[5px] w-[5px] animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:0ms]" />
        <span className="h-[5px] w-[5px] animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:150ms]" />
        <span className="h-[5px] w-[5px] animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:300ms]" />
      </div>
      <span className="text-xs text-muted-foreground">{text}</span>
    </div>
  );
}
