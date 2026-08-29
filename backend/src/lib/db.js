import mongoose from "mongoose";

export const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGODB_URI);
  return conn;
};

export const disconnectDB = () => mongoose.disconnect();
