import { inferUploadType } from '@middlewares/upload.middleware';
import { UploadType } from '@constants/index';

describe('Upload type inference', () => {
  it('infers image type from common image MIME types', () => {
    expect(inferUploadType('image/jpeg')).toBe(UploadType.IMAGE);
    expect(inferUploadType('image/png')).toBe(UploadType.IMAGE);
    expect(inferUploadType('image/webp')).toBe(UploadType.IMAGE);
  });

  it('infers PDF type from application/pdf', () => {
    expect(inferUploadType('application/pdf')).toBe(UploadType.PDF);
  });

  it('infers document type from Word and plain text MIME types', () => {
    expect(inferUploadType('application/msword')).toBe(UploadType.DOCUMENT);
    expect(inferUploadType('text/plain')).toBe(UploadType.DOCUMENT);
  });

  it('infers video type from common video MIME types', () => {
    expect(inferUploadType('video/mp4')).toBe(UploadType.VIDEO);
  });

  it('returns null for unsupported MIME types', () => {
    expect(inferUploadType('application/x-executable')).toBeNull();
    expect(inferUploadType('application/octet-stream')).toBeNull();
  });
});
