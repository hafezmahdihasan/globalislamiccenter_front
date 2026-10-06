import mongoose from "mongoose";
import { getDbEnv } from "@/lib/config/env";

// Cache the connection on globalThis so hot reloads (dev) and warm serverless
// invocations reuse one pool instead of opening a new one per request.
const cache =
  globalThis.__gicMongoose ??
  (globalThis.__gicMongoose = { conn: null, promise: null });

export async function connectDB() {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    const { MONGODB_URI } = getDbEnv();
    mongoose.set("strictQuery", true);
    cache.promise = mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
      maxPoolSize: 10,
    });
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null; // allow a retry on the next request
    throw error;
  }
  return cache.conn;
}
