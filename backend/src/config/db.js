import mongoose from 'mongoose';

export async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fitai');
    console.log(`[MongoDB] Database Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[MongoDB Warning] Connection error: ${error.message}. Backend will operate in fallback mode.`);
  }
}
