import { body, query } from 'express-validator';

export const trackEventValidator = [
  body('eventName').isString().notEmpty(),
  body('category').isString().notEmpty(),
  body('properties').optional().isObject(),
];

export const summaryQueryValidator = [
  query('daysBack').optional().isInt({ min: 1, max: 365 }).toInt(),
];
