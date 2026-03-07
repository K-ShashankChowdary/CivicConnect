import express from 'express';

import { login, register, getProfile, logout, refreshAccessToken } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { loginValidator, registerValidator } from '../validators/auth.validators.js';

const router = express.Router();

router.post('/register', registerValidator, register);
router.post('/login', loginValidator, login);
router.post('/refresh', refreshAccessToken);
router.get('/profile', authenticate, getProfile);
router.post('/logout', authenticate, logout);

export default router;
