import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * Idempotency ledger keyed by Telegram's update_id. Telegram retries webhook
 * deliveries; a unique index lets us claim each update exactly once.
 */
const telegramUpdateSchema = new Schema(
  {
    updateId: {
      type: Number,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["processing", "done", "failed"],
      default: "processing",
    },
    processedAt: {
      type: Date,
      default: null,
    },
    // TTL: MongoDB removes the document once this date passes.
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

telegramUpdateSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.TelegramUpdate ||
  mongoose.model("TelegramUpdate", telegramUpdateSchema);
