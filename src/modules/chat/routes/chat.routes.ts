import { Router } from 'express';
import { param } from 'express-validator';
import * as chatController from '@modules/chat/controllers/chat.controller';
import { sendChatMessageValidator, createChatValidator } from '@modules/ai/validators/ai.validator';
import { paginationValidator } from '@validators/pagination.validator';
import { handleValidationErrors } from '@middlewares/validation.middleware';
import { requireAuth } from '@middlewares/auth.middleware';
import { aiRateLimiter } from '@middlewares/rate-limit.middleware';

const router = Router();
const chatIdValidator = [param('id').isMongoId().withMessage('Invalid chat id')];

router.use(requireAuth);

router.post('/', createChatValidator, handleValidationErrors, chatController.createChat);
router.get('/', paginationValidator, handleValidationErrors, chatController.listChats);
router.get('/:id', chatIdValidator, handleValidationErrors, chatController.getChat);
router.get(
  '/:id/messages',
  chatIdValidator,
  handleValidationErrors,
  chatController.getChatMessages
);
router.post(
  '/:id/messages',
  aiRateLimiter,
  chatIdValidator,
  sendChatMessageValidator,
  handleValidationErrors,
  chatController.sendMessage
);
router.patch('/:id/archive', chatIdValidator, handleValidationErrors, chatController.archiveChat);
router.delete('/:id', chatIdValidator, handleValidationErrors, chatController.deleteChat);

export default router;
