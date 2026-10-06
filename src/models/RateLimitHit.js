import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * One document per counted attempt. `key` is a SHA-256 of scope + identifier,
 * so raw IP addresses are not duplicated here. Documents expire after an hour
 * (the active window is shorter; see rate-limit.js).
 */
const rateLimitHitSchema = new Schema({
  key: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60,
  },
});

rateLimitHitSchema.index({ key: 1, createdAt: 1 });

export default mongoose.models.RateLimitHit ||
  mongoose.model("RateLimitHit", rateLimitHitSchema);
