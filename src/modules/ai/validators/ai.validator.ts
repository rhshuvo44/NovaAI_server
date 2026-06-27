import { body } from 'express-validator';

export const generateContentValidator = [
  body('topic').isString().notEmpty().withMessage('topic is required'),
  body('tone').optional().isIn(['professional', 'casual', 'persuasive', 'technical']),
  body('length').optional().isIn(['short', 'medium', 'long']),
];

export const optimizePromptValidator = [
  body('prompt')
    .isString()
    .notEmpty()
    .isLength({ max: 5000 })
    .withMessage('prompt is required (max 5000 chars)'),
];

export const summarizeValidator = [
  body('text').isString().notEmpty().withMessage('text is required'),
  body('maxSentences').optional().isInt({ min: 1, max: 10 }).toInt(),
];

export const generateTagsValidator = [
  body('content').isString().notEmpty().withMessage('content is required'),
];

export const recommendationsValidator = [
  body('limit').optional().isInt({ min: 1, max: 20 }).toInt(),
];

export const sendChatMessageValidator = [
  body('content')
    .isString()
    .notEmpty()
    .isLength({ max: 8000 })
    .withMessage('content is required (max 8000 chars)'),
];

export const createChatValidator = [body('title').optional().isString().isLength({ max: 200 })];
