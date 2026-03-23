import mongoose from "mongoose";

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("Missing MONGO_URI in environment variables");
  }

  await mongoose.connect(uri);
  console.log("MongoDB connected");
};

export default connectDB;
