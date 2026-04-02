'use client';

import { useState, memo } from 'react';
import { Pencil, Trash2, X, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/common/user-avatar';
import { MessageAttachments } from './message-attachments';
import type { Message } from '@/types/chat';

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  isGroupChat: boolean;
  showSender: boolean;
  onEdit: (messageId: string, content: string) => void;
  onDelete: (messageId: string) => void;
  isEditing?: boolean;
  isDeleting?: boolean;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const MessageItem = memo(function MessageItem({
  message,
  isOwn,
  isGroupChat,
  showSender,
  onEdit,
  onDelete,
  isEditing,
  isDeleting,
}: MessageItemProps) {
  const [showActions, setShowActions] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState(message.content ?? '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isDeleted = message.deletedAt != null;
  const hasAttachments = message.attachments.length > 0;
  const hasContent = !!message.content;

  const handleEditSubmit = () => {
    const trimmed = editText.trim();
    if (!trimmed || trimmed === message.content) {
      setEditMode(false);
      return;
    }
    onEdit(message.id, trimmed);
    setEditMode(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEditSubmit();
    }
    if (e.key === 'Escape') {
      setEditMode(false);
      setEditText(message.content ?? '');
    }
  };

  const handleDelete = () => {
    onDelete(message.id);
    setShowDeleteConfirm(false);
  };

  return (
    <div
      className={cn('group flex gap-3 px-4', isOwn && 'flex-row-reverse')}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        if (!editMode) setShowDeleteConfirm(false);
      }}
    >
      {/* Avatar */}
      {!isOwn ? (
        showSender ? (
          <UserAvatar
            name={message.sender.name}
            avatarUrl={message.sender.avatarUrl}
            size="sm"
            className="mt-0.5 shrink-0"
          />
        ) : (
          <div className="w-8 shrink-0" />
        )
      ) : null}

      {/* Content */}
      <div
        className={cn(
          'relative max-w-[70%] space-y-1',
          isOwn ? 'items-end' : 'items-start',
        )}
      >
        {/* Sender name for group non-self messages */}
        {!isOwn && isGroupChat && showSender && (
          <p className="ml-1 text-xs font-medium text-muted-foreground">
            {message.sender.name}
          </p>
        )}

        {/* Reply preview */}
        {message.replyTo && !isDeleted && (
          <div className="rounded-lg border-l-2 border-muted-foreground/30 bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
            <span className="font-medium">{message.replyTo.sender.name}</span>
            <p className="truncate">{message.replyTo.content}</p>
          </div>
        )}

        {/* Edit mode */}
        {editMode ? (
          <div className="flex items-end gap-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleEditKeyDown}
              className="min-h-[40px] w-full resize-none rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              autoFocus
              rows={1}
            />
            <div className="flex shrink-0 gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setEditMode(false);
                  setEditText(message.content ?? '');
                }}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                className="h-8 w-8"
                onClick={handleEditSubmit}
                disabled={isEditing}
              >
                {isEditing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Attachments */}
            {hasAttachments && !isDeleted && (
              <MessageAttachments
                attachments={message.attachments}
                isOwn={isOwn}
              />
            )}

            {/* Message bubble — show for text, deleted, or empty non-attachment */}
            {(hasContent || isDeleted || !hasAttachments) && (
              <div
                className={cn(
                  'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                  isOwn
                    ? 'bg-own-bubble text-own-bubble-foreground'
                    : 'bg-other-bubble text-other-bubble-foreground',
                  isDeleted && 'italic opacity-50',
                )}
              >
                {isDeleted ? 'This message was deleted' : message.content}
              </div>
            )}

            {/* Timestamp + edited */}
            <div
              className={cn(
                'flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground',
                isOwn && 'justify-end',
              )}
            >
              <span>{formatTime(message.createdAt)}</span>
              {message.isEdited && !isDeleted && (
                <span className="italic">edited</span>
              )}
            </div>
          </>
        )}

        {/* Actions menu */}
        {isOwn && !isDeleted && !editMode && showActions && (
          <div
            className={cn(
              'absolute -top-2 flex items-center gap-0.5 rounded-lg border bg-background p-0.5 shadow-sm',
              isOwn ? 'right-0' : 'left-0',
            )}
          >
            {showDeleteConfirm ? (
              <>
                <span className="px-2 text-xs text-destructive">Delete?</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:bg-destructive/10"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </>
            ) : (
              <>
                {message.type === 'TEXT' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      setEditMode(true);
                      setEditText(message.content ?? '');
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:bg-destructive/10"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
