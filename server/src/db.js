import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/smart-parking";

export async function connectDb() {
  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(uri);

    console.log("MongoDB connected:", uri);

    mongoose.connection.on("error", err => {
      console.error("MongoDB error:", err);
    });

    return mongoose.connection;
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
}
