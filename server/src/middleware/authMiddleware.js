import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import { verifyToken } from '../utils/jwt.js';

export const authenticate = async (req, _res, next) => {
  try {
    const accessToken = req.cookies?.accessToken;

    if (!accessToken) {
      throw new AppError('Access token required. Please login.', 401);
    }

    const decoded = verifyToken(accessToken);

    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      throw new AppError('User not found', 404);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      next(new AppError('Access token expired. Please refresh your token.', 401));
    } else {
      next(new AppError(error.message || 'Invalid access token', 401));
    }
  }
};

export const authorize = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new AppError('Forbidden', 403));
  }

  next();
};
