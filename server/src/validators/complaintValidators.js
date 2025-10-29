import { body } from 'express-validator';

export const complaintCreateValidator = [
  body('title').notEmpty().withMessage('Title is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('location').notEmpty().withMessage('Location is required')
];

export const complaintUpdateValidator = [
  body('title').optional().isString(),
  body('category').optional().isString(),
  body('description').optional().isString(),
  body('location').optional().isString()
];
