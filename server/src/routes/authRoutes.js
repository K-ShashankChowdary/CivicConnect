import express from 'express';

import { login, register, getProfile, logout, refreshAccessToken } from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { loginValidator, registerValidator } from '../validators/authValidators.js';

const router = express.Router();

router.post('/register', registerValidator, register);
router.post('/login', loginValidator, login);
router.post('/refresh', refreshAccessToken);
router.get('/profile', authenticate, getProfile);
router.post('/logout', authenticate, logout);

export default router;
