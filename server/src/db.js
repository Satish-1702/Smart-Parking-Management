import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/smart-parking";
const timeoutMs = Number(process.env.MONGODB_TIMEOUT_MS || 10000);

function sanitizeMongoUri(rawUri) {
  if (!rawUri) return "mongodb://127.0.0.1:27017/smart-parking";
  return rawUri.replace(/\/\/([^:@/]+):([^@/]+)@/, "//***:***@");
}

export async function connectDb() {
  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: timeoutMs,
    });

    console.log("MongoDB connected:", sanitizeMongoUri(uri));

    mongoose.connection.on("error", err => {
      console.error("MongoDB error:", err);
    });

    return mongoose.connection;
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
}
