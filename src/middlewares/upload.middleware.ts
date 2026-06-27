import multer from 'multer';
import { Request } from 'express';
import { UploadError } from '@shared/errors';
import { UploadType } from '@constants/index';

const ALLOWED_MIME_TYPES: Record<UploadType, string[]> = {
  [UploadType.IMAGE]: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  [UploadType.PDF]: ['application/pdf'],
  [UploadType.DOCUMENT]: [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ],
  [UploadType.VIDEO]: ['video/mp4', 'video/quicktime', 'video/webm'],
};

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

function allAllowedMimeTypes(): string[] {
  return Object.values(ALLOWED_MIME_TYPES).flat();
}

export function inferUploadType(mimeType: string): UploadType | null {
  const entry = (Object.entries(ALLOWED_MIME_TYPES) as [UploadType, string[]][]).find(([, types]) =>
    types.includes(mimeType)
  );
  return entry ? entry[0] : null;
}

const storage = multer.memoryStorage();

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
): void {
  if (!allAllowedMimeTypes().includes(file.mimetype)) {
    callback(new UploadError(`File type "${file.mimetype}" is not supported`));
    return;
  }
  callback(null, true);
}

export const uploadSingle = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
}).single('file');
