import { body, param } from 'express-validator';

export const settingKeyParamValidator = [
  param('key').isString().notEmpty().withMessage('key is required'),
];

export const setSettingValidator = [
  param('key').isString().notEmpty(),
  body('value').exists().withMessage('value is required'),
];
