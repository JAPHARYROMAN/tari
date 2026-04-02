'use client';

import { useState, useRef } from 'react';
import { Paperclip, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTypingEmitter } from '@/hooks/use-typing';
import { useUploadChatMedia } from '@/hooks/use-uploads';
import { validateFile, isImageMime } from '@/lib/file-validation';
import { AttachmentPreview } from './attachment-preview';
import { ApiClientError } from '@/lib/api/client';
import type { UploadResponse } from '@/lib/api/uploads';
import type { SendMessageInput } from '@/lib/api/messages';

interface MessageComposerProps {
  chatId: string;
  onSend: (input: SendMessageInput) => void;
  isSending: boolean;
  sendError: string | null;
}

export function MessageComposer({
  chatId,
  onSend,
  isSending,
  sendError,
}: MessageComposerProps) {
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { onKeystroke, stopTyping } = useTypingEmitter(chatId);
  const upload = useUploadChatMedia();

  const isUploading = upload.isPending;
  const hasAttachment = selectedFile != null;
  const canSend = (text.trim() || uploadResult) && !isSending && !isUploading;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset input so the same file can be reselected
    e.target.value = '';

    if (!file) return;

    const error = validateFile(file);
    if (error) {
      setFileError(error);
      return;
    }

    setFileError(null);
    setSelectedFile(file);
    setUploadResult(null);
    upload.reset();

    // Start upload immediately
    upload.mutate(file, {
      onSuccess: (result) => {
        setUploadResult(result);
      },
      onError: (err) => {
        setFileError(
          err instanceof ApiClientError
            ? err.message
            : 'Upload failed. Try again.',
        );
      },
    });
  };

  const handleRemoveAttachment = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setFileError(null);
    upload.reset();
  };

  const handleSubmit = () => {
    if (!canSend) return;
    stopTyping();

    if (uploadResult && selectedFile) {
      // Send as IMAGE or FILE message
      const isImage = isImageMime(selectedFile.type);
      const input: SendMessageInput = {
        type: isImage ? 'IMAGE' : 'FILE',
        content: text.trim() || undefined,
        attachments: [
          {
            url: uploadResult.fileUrl,
            fileName: uploadResult.fileName,
            fileSize: uploadResult.fileSize,
            mimeType: uploadResult.fileType,
            width: uploadResult.width,
            height: uploadResult.height,
          },
        ],
      };
      onSend(input);
      handleRemoveAttachment();
    } else if (text.trim()) {
      onSend({ type: 'TEXT', content: text.trim() });
    }

    setText('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (e.target.value.trim()) {
      onKeystroke();
    }
  };

  const uploadErrorMsg =
    fileError ??
    (upload.error instanceof ApiClientError
      ? upload.error.message
      : upload.error
        ? 'Upload failed'
        : null);

  return (
    <div className="shrink-0 border-t">
      {/* Attachment preview */}
      {selectedFile && (
        <AttachmentPreview
          file={selectedFile}
          uploadResult={uploadResult}
          isUploading={isUploading}
          uploadError={uploadErrorMsg}
          onRemove={handleRemoveAttachment}
        />
      )}

      {/* Errors */}
      {(sendError || (fileError && !selectedFile)) && (
        <p className="mx-4 mb-2 text-xs text-destructive">
          {sendError ?? fileError}
        </p>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2 px-4 py-3">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/png,image/jpeg,image/webp,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleFileSelect}
        />

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 text-muted-foreground"
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || isSending}
        >
          <Paperclip className="h-[18px] w-[18px]" />
        </Button>

        <div className="flex min-h-[40px] flex-1 items-end rounded-xl border bg-background px-4 py-2">
          <textarea
            ref={inputRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={stopTyping}
            placeholder={
              hasAttachment ? 'Add a caption...' : 'Type a message...'
            }
            rows={1}
            className="max-h-32 flex-1 resize-none bg-transparent text-sm placeholder:text-muted-foreground/60 focus:outline-none"
            style={{ height: 'auto', minHeight: '20px' }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
            }}
          />
        </div>

        <Button
          size="icon"
          className="h-9 w-9 shrink-0 rounded-xl"
          onClick={handleSubmit}
          disabled={!canSend}
        >
          {isSending ? (
            <Loader2 className="h-[18px] w-[18px] animate-spin" />
          ) : (
            <Send className="h-[18px] w-[18px]" />
          )}
        </Button>
      </div>
    </div>
  );
}
