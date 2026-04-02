'use client';

import { X, FileText, Loader2, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isImageMime, formatFileSize } from '@/lib/file-validation';
import type { UploadResponse } from '@/lib/api/uploads';

interface AttachmentPreviewProps {
  file: File;
  uploadResult: UploadResponse | null;
  isUploading: boolean;
  uploadError: string | null;
  onRemove: () => void;
}

export function AttachmentPreview({
  file,
  uploadResult,
  isUploading,
  uploadError,
  onRemove,
}: AttachmentPreviewProps) {
  const isImage = isImageMime(file.type);

  return (
    <div className="mx-4 mb-2 flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2">
      {/* Thumbnail / icon */}
      {isImage && uploadResult ? (
        <img
          src={uploadResult.thumbnailUrl ?? uploadResult.fileUrl}
          alt={file.name}
          className="h-12 w-12 shrink-0 rounded-md object-cover"
        />
      ) : isImage ? (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted">
          <ImageIcon className="h-5 w-5 text-muted-foreground" />
        </div>
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted">
          <FileText className="h-5 w-5 text-muted-foreground" />
        </div>
      )}

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{file.name}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatFileSize(file.size)}</span>
          {isUploading && (
            <span className="flex items-center gap-1 text-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Uploading...
            </span>
          )}
          {uploadResult && !isUploading && (
            <span className="text-emerald-600">Ready to send</span>
          )}
          {uploadError && (
            <span className="text-destructive">{uploadError}</span>
          )}
        </div>
      </div>

      {/* Remove */}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        onClick={onRemove}
        disabled={isUploading}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
