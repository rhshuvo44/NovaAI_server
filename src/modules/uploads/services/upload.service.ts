import { Types } from 'mongoose';
import { cloudinary } from '@config/cloudinary';
import { uploadRepository } from '@modules/uploads/repositories/upload.repository';
import { IUpload } from '@modules/uploads/models/upload.model';
import { inferUploadType } from '@middlewares/upload.middleware';
import { UploadError, AuthorizationError, NotFoundError } from '@shared/errors';
import { UploadType } from '@constants/index';
import { logger } from '@utils/logger';

interface CloudinaryUploadResult {
  public_id: string;
  url: string;
  secure_url: string;
}

export class UploadService {
  private streamUpload(
    buffer: Buffer,
    folder: string,
    resourceType: 'image' | 'video' | 'raw'
  ): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: resourceType },
        (error, result) => {
          if (error || !result) {
            reject(new UploadError(error?.message ?? 'Cloudinary upload failed'));
            return;
          }
          resolve({ public_id: result.public_id, url: result.url, secure_url: result.secure_url });
        }
      );
      uploadStream.end(buffer);
    });
  }

  private resolveResourceType(uploadType: UploadType): 'image' | 'video' | 'raw' {
    if (uploadType === UploadType.IMAGE) return 'image';
    if (uploadType === UploadType.VIDEO) return 'video';
    return 'raw'; // pdf, document
  }

  async upload(ownerId: string, file: Express.Multer.File): Promise<IUpload> {
    const uploadType = inferUploadType(file.mimetype);
    if (!uploadType) {
      throw new UploadError(`Unsupported file type: ${file.mimetype}`);
    }

    const resourceType = this.resolveResourceType(uploadType);
    const folder = `ai-workspace/${uploadType}`;

    try {
      const result = await this.streamUpload(file.buffer, folder, resourceType);

      return uploadRepository.create({
        ownerId: new Types.ObjectId(ownerId),
        type: uploadType,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        storageProvider: 'cloudinary',
        publicId: result.public_id,
        url: result.url,
        secureUrl: result.secure_url,
        folder,
      });
    } catch (error) {
      logger.error('File upload failed', { error: (error as Error).message });
      throw error instanceof UploadError ? error : new UploadError('File upload failed');
    }
  }

  async getById(id: string): Promise<IUpload> {
    return uploadRepository.findByIdOrThrow(id);
  }

  async delete(id: string, ownerId: string): Promise<void> {
    const upload = await uploadRepository.findById(id);
    if (!upload) throw new NotFoundError('Upload');
    if (upload.ownerId.toString() !== ownerId) {
      throw new AuthorizationError('You do not have permission to delete this file');
    }

    const resourceType = this.resolveResourceType(upload.type);
    try {
      await cloudinary.uploader.destroy(upload.publicId, { resource_type: resourceType });
    } catch (error) {
      logger.error('Cloudinary file deletion failed', {
        error: (error as Error).message,
        publicId: upload.publicId,
      });
      // proceed to remove the DB record regardless, to avoid orphaned references
    }

    await uploadRepository.deleteById(id);
  }

  /**
   * Generates a signed, time-limited URL for private/sensitive files.
   */
  generateSignedUrl(publicId: string, expiresInSeconds = 3600): string {
    const timestamp = Math.floor(Date.now() / 1000) + expiresInSeconds;
    return cloudinary.utils.private_download_url(publicId, '', {
      expires_at: timestamp,
    } as never);
  }
}

export const uploadService = new UploadService();
