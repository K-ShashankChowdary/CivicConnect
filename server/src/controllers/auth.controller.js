// Auth controller: register, login, profile, refresh, logout
import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';
import User from '../models/user.model.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const register = asyncHandler(async (req, res) => {
  // 1. Initial validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(422, 'Validation failed', errors.array());
  }

  const { name, email, password, address, phone, role, adminAccessCode } = req.body;

  // 2. Verify admin access code if registering as 'admin'
  if (role === 'admin') {
    const correctAccessCode = process.env.ADMIN_ACCESS_CODE;
    if (!correctAccessCode) {
      throw new ApiError(500, 'Admin registration is not configured. Please contact system administrator.');
    }
    if (!adminAccessCode) {
      throw new ApiError(400, 'Admin access code is required for admin registration.');
    }
    // Prevent brute force or guesswork
    if (adminAccessCode !== correctAccessCode) {
      throw new ApiError(403, 'Invalid admin access code. Please check your code and try again.');
    }
  }

  // 3. Ensure email uniqueness
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, `This email (${email}) is already registered. Please login or use a different email.`);
  }

  // 4. Hash the password
  const passwordHash = await bcrypt.hash(password, 10);

  // 5. Create user record
  const user = await User.create({
    name,
    email,
    passwordHash,
    address,
    phone,
    role: role || 'citizen' // default role is citizen if not specified
  });

  // 6. Generate JWTs
  const accessToken = signAccessToken({ id: user._id, role: user.role });
  const refreshToken = signRefreshToken({ id: user._id, role: user.role });

  // 7. Set HTTP-only cookies
  // Secure flag is true only in production to allow local HTTP development
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: false, // Changed for HTTP-only AWS deployment
    sameSite: 'lax', // Changed for HTTP-only AWS deployment
    maxAge: 15 * 60 * 1000 // 15 minutes expiration matches token lifetime
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: false, // Changed for HTTP-only AWS deployment
    sameSite: 'lax', // Changed for HTTP-only AWS deployment
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  // 8. Send response
  return res.status(201).json(new ApiResponse(201, {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  }));
});

// Authenticate user and issue tokens
export const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(422, 'Validation failed', errors.array());
  }

  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(401, 'No account found with this email address. Please check your email or register.');
  }

  // Check password
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new ApiError(401, 'Incorrect password. Please try again or reset your password.');
  }

  // Issue new tokens
  const accessToken = signAccessToken({ id: user._id, role: user.role });
  const refreshToken = signRefreshToken({ id: user._id, role: user.role });

  // Set HTTP-only cookies
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000 // 15 minutes
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  return res.status(200).json(new ApiResponse(200, {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  }));
});

// Fetch the current user's profile
export const getProfile = asyncHandler(async (req, res) => {
  // .lean() returns plain JS object instead of Mongoose document for better performance
  const user = await User.findById(req.user._id).select('-passwordHash').lean();

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return res.status(200).json(new ApiResponse(200, {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      address: user.address,
      phone: user.phone,
      createdAt: user.createdAt
    }
  }));
});

// Refresh expired access token using refresh token
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new ApiError(401, 'Refresh token not found. Please login again.');
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.id);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Generate new access token since the current one is likely expired
    const newAccessToken = signAccessToken({ id: user._id, role: user.role });

    // Set new HTTP-only cookie
    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    return res.status(200).json(new ApiResponse(200, null, 'Access token refreshed successfully'));
  } catch (error) {
    // If token verification fails (expired, tampered)
    throw new ApiError(401, 'Invalid or expired refresh token. Please login again.');
  }
});

// Logout user by clearing cookies
export const logout = asyncHandler(async (req, res) => {
  // Clear access token cookie by expiring it immediately (Date(0))
  res.cookie('accessToken', '', {
    httpOnly: true,
    expires: new Date(0)
  });
  
  // Clear refresh token cookie
  res.cookie('refreshToken', '', {
    httpOnly: true,
    expires: new Date(0)
  });

  return res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
});
