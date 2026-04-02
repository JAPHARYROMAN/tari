const IMAGE_MIMES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
]);

const DOCUMENT_MIMES = new Set([
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const ALL_ALLOWED = new Set([...IMAGE_MIMES, ...DOCUMENT_MIMES]);

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;   // 5 MB
const MAX_DOC_SIZE = 10 * 1024 * 1024;    // 10 MB

export function isImageMime(mime: string): boolean {
  return IMAGE_MIMES.has(mime);
}

export function validateFile(file: File): string | null {
  if (!ALL_ALLOWED.has(file.type)) {
    return `File type "${file.type || 'unknown'}" is not supported. Allowed: PNG, JPG, WebP, PDF, TXT, DOC, DOCX.`;
  }

  const isImage = IMAGE_MIMES.has(file.type);
  const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_DOC_SIZE;

  if (file.size > maxSize) {
    const maxMb = maxSize / (1024 * 1024);
    return `File too large. Maximum size for ${isImage ? 'images' : 'documents'} is ${maxMb} MB.`;
  }

  return null;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
