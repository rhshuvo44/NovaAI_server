import { Request, Response } from 'express';
import { uploadService } from '@modules/uploads/services/upload.service';
import { ApiResponse } from '@shared/responses/api-response';
import { asyncHandler } from '@utils/async-handler';
import { AuthenticationError, UploadError } from '@shared/errors';
import { getParam } from '@utils/get-param';

export const uploadFile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  if (!req.file) throw new UploadError('No file was provided');

  const upload = await uploadService.upload(req.user.userId, req.file);
  ApiResponse.created(res, upload, 'File uploaded successfully');
});

export const getUpload = asyncHandler(async (req: Request, res: Response) => {
  const upload = await uploadService.getById(getParam(req, 'id'));
  ApiResponse.success(res, upload, 'Upload fetched successfully');
});

export const deleteUpload = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  await uploadService.delete(getParam(req, 'id'), req.user.userId);
  ApiResponse.noContent(res, 'File deleted successfully');
});

export const getSignedUrl = asyncHandler(async (req: Request, res: Response) => {
  const upload = await uploadService.getById(getParam(req, 'id'));
  const url = uploadService.generateSignedUrl(upload.publicId);
  ApiResponse.success(res, { url }, 'Signed URL generated successfully');
});
