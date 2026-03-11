import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import authRoutes from './src/routes/auth.routes.js';
import complaintRoutes from './src/routes/complaint.routes.js';
import adminRoutes from './src/routes/admin.routes.js';
import errorHandler from './src/middleware/error.middleware.js';

const app = express();

app.use(helmet());

// Allow configuring allowed frontend origins via APP_BASE_URL (comma-separated)
const allowedOrigins = (process.env.APP_BASE_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true, // Allow cookies
}));

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'CivicConnect API is running...' });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

export default app;
