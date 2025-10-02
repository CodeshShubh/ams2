import mongoose from 'mongoose';

let isConnected = false;

export async function connectToMongoDB(): Promise<void> {
  if (isConnected) {
    return;
  }

  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.warn('⚠️ MONGODB_URI not found. Using in-memory storage instead.');
      throw new Error('MongoDB URI not configured');
    }

    await mongoose.connect(mongoUri);
    isConnected = true;
    console.log('✅ Connected to MongoDB successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

export async function disconnectFromMongoDB(): Promise<void> {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ MongoDB disconnection failed:', error);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  await disconnectFromMongoDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectFromMongoDB();
  process.exit(0);
});