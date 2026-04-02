'use client';

import { Download, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isImageMime, formatFileSize } from '@/lib/file-validation';
import type { MessageAttachment } from '@/types/chat';

interface MessageAttachmentsProps {
  attachments: MessageAttachment[];
  isOwn: boolean;
}

function ImageAttachment({ attachment }: { attachment: MessageAttachment }) {
  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block overflow-hidden rounded-xl"
    >
      <img
        src={attachment.url}
        alt={attachment.fileName}
        className="max-h-64 max-w-full rounded-xl object-cover"
        style={{
          width: attachment.width
            ? Math.min(attachment.width, 320)
            : undefined,
        }}
      />
    </a>
  );
}

function FileAttachment({
  attachment,
  isOwn,
}: {
  attachment: MessageAttachment;
  isOwn: boolean;
}) {
  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'flex items-center gap-3 rounded-xl px-4 py-3 transition-colors',
        isOwn
          ? 'bg-own-bubble-foreground/15 hover:bg-own-bubble-foreground/25'
          : 'bg-background hover:bg-muted',
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
          isOwn ? 'bg-own-bubble-foreground/15' : 'bg-muted',
        )}
      >
        <FileText className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{attachment.fileName}</p>
        <p className="text-xs opacity-70">{formatFileSize(attachment.fileSize)}</p>
      </div>
      <Download className="h-4 w-4 shrink-0 opacity-60" />
    </a>
  );
}

export function MessageAttachments({
  attachments,
  isOwn,
}: MessageAttachmentsProps) {
  if (attachments.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {attachments.map((att) =>
        isImageMime(att.mimeType) ? (
          <ImageAttachment key={att.id} attachment={att} />
        ) : (
          <FileAttachment key={att.id} attachment={att} isOwn={isOwn} />
        ),
      )}
    </div>
  );
}
