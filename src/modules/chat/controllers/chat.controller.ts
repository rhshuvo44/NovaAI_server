import { Request, Response } from 'express';
import { chatService } from '@modules/chat/services/chat.service';
import { ApiResponse } from '@shared/responses/api-response';
import { asyncHandler } from '@utils/async-handler';
import { AuthenticationError } from '@shared/errors';
import { parsePaginationQuery } from '@validators/pagination.validator';
import { getParam } from '@utils/get-param';

export const createChat = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  const chat = await chatService.createChat(req.user.userId, req.body.title);
  ApiResponse.created(res, chat, 'Chat created successfully');
});

export const listChats = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  const { items, meta } = await chatService.listChats(req.user.userId, parsePaginationQuery(req));
  ApiResponse.paginated(res, items, meta, 'Chats fetched successfully');
});

export const getChat = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  const chat = await chatService.getChat(getParam(req, 'id'), req.user.userId);
  ApiResponse.success(res, chat, 'Chat fetched successfully');
});

export const getChatMessages = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  const messages = await chatService.getMessages(getParam(req, 'id'), req.user.userId);
  ApiResponse.success(res, messages, 'Messages fetched successfully');
});

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  const result = await chatService.sendMessage(
    getParam(req, 'id'),
    req.user.userId,
    req.body.content
  );
  ApiResponse.created(res, result, 'Message sent successfully');
});

export const archiveChat = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  const chat = await chatService.archiveChat(getParam(req, 'id'), req.user.userId);
  ApiResponse.success(res, chat, 'Chat archived successfully');
});

export const deleteChat = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  await chatService.deleteChat(getParam(req, 'id'), req.user.userId);
  ApiResponse.noContent(res, 'Chat deleted successfully');
});
