import { BaseRepository } from '@shared/models/base.repository';
import { UploadModel, IUpload } from '@modules/uploads/models/upload.model';

export class UploadRepository extends BaseRepository<IUpload> {
  constructor() {
    super(UploadModel);
  }

  async findByPublicId(publicId: string): Promise<IUpload | null> {
    return this.findOne({ publicId });
  }
}

export const uploadRepository = new UploadRepository();
