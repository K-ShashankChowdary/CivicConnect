import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './src/config/db.js';
import { initPriorityModel } from './src/services/priorityService.js';

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/municipal-complaints';

const startServer = async () => {
  try {
    // Step 1: Connect to database (CRITICAL - must succeed)
    console.log('Connecting to MongoDB...');
    await connectDB(MONGO_URI);
    console.log('✅ MongoDB connected successfully');

    // Step 2: Start server immediately after database connection
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`✅ Server listening on port ${PORT}`);
    });

    // Step 3: Train AI model in background (non-blocking)
    console.log('Training AI model in background...');
    initPriorityModel()
      .then(() => {
        console.log('✅ AI model ready');
      })
      .catch((error) => {
        console.error('⚠️  AI model training failed:', error.message);
        console.error('Server will continue running without AI predictions');
      });

  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
