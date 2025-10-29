import { body } from 'express-validator';

export const registerValidator = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('address').optional().isString(),
  body('phone').optional().isString(),
  body('role').optional().isIn(['citizen', 'admin']).withMessage('Role must be citizen or admin'),
  body('adminAccessCode').if(body('role').equals('admin')).notEmpty().withMessage('Admin access code is required for admin registration')
];

export const loginValidator = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];
