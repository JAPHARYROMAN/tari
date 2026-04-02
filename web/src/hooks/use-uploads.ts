'use client';

import { useMutation } from '@tanstack/react-query';
import { uploadsApi } from '@/lib/api/uploads';

export function useUploadChatMedia() {
  return useMutation({
    mutationFn: (file: File) => uploadsApi.uploadChatMedia(file),
  });
}
