

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("❌ Please define MONGODB_URI in .env");
}

// Global cache (important for Next.js)
declare global {
  var mongooseConnection: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

const cached = global.mongooseConnection || {
  conn: null,
  promise: null,
};

global.mongooseConnection = cached;

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI);
  }

  cached.conn = await cached.promise;

  console.log("✅ MongoDB Connected");

  return cached.conn;
}
