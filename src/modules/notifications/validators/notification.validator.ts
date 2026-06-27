import { body, param } from 'express-validator';
import { NotificationType } from '@constants/index';

export const notificationIdParamValidator = [
  param('id').isMongoId().withMessage('Invalid notification id'),
];

export const sendNotificationValidator = [
  body('userId').isMongoId().withMessage('Invalid userId'),
  body('type').optional().isIn(Object.values(NotificationType)),
  body('title').isString().notEmpty().isLength({ max: 200 }),
  body('message').isString().notEmpty().isLength({ max: 1000 }),
  body('link').optional().isString(),
];
