import { Injectable, BadRequestException } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';

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
const MAX_DOC_SIZE = 10 * 1024 * 1024;     // 10 MB

export interface UploadResponse {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
}

@Injectable()
export class UploadsService {
  constructor(private readonly cloudinary: CloudinaryService) {}

  async uploadChatMedia(file: Express.Multer.File): Promise<UploadResponse> {
    this.validateFile(file);

    const isImage = IMAGE_MIMES.has(file.mimetype);
    const result = await this.cloudinary.upload(file.buffer, {
      folder: 'tari/chat-media',
      resourceType: isImage ? 'image' : 'raw',
    });

    return {
      fileName: file.originalname,
      fileUrl: result.secureUrl,
      fileType: file.mimetype,
      fileSize: file.size,
      width: result.width,
      height: result.height,
      thumbnailUrl: isImage
        ? result.secureUrl.replace('/upload/', '/upload/w_200,h_200,c_thumb/')
        : undefined,
    };
  }

  private validateFile(file: Express.Multer.File): void {
    if (!ALL_ALLOWED.has(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed. Allowed: ${[...ALL_ALLOWED].join(', ')}`,
      );
    }

    const isImage = IMAGE_MIMES.has(file.mimetype);
    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_DOC_SIZE;

    if (file.size > maxSize) {
      const maxMb = maxSize / (1024 * 1024);
      throw new BadRequestException(
        `File too large. Maximum size for ${isImage ? 'images' : 'documents'} is ${maxMb} MB`,
      );
    }
  }
}
