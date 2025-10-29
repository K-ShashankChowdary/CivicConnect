import mongoose from 'mongoose';

const connectDB = async (mongoUri) => {
  try {
    if (!mongoUri) {
      throw new Error('MongoDB connection string is missing');
    }

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10
    });

    // eslint-disable-next-line no-console
    console.log('MongoDB connected');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('MongoDB connection error:', error.message);
    throw error;
  }
};

export default connectDB;
