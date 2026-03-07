import User from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { verifyToken } from '../utils/jwt.js';

export const authenticate = async (req, _res, next) => {
  try {
    const accessToken = req.cookies?.accessToken;

    if (!accessToken) {
      throw new ApiError(401, 'Access token required. Please login.');
    }

    const decoded = verifyToken(accessToken);

    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      next(new ApiError(401, 'Access token expired. Please refresh your token.'));
    } else {
      next(new ApiError(401, error.message || 'Invalid access token'));
    }
  }
};

export const authorize = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new ApiError(403, 'Forbidden'));
  }

  next();
};
