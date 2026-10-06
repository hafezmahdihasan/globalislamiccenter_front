import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * One document per allowed Telegram user. Persisted in MongoDB (not in
 * Telegraf's in-memory session) so authentication survives serverless cold
 * starts. Credentials are never stored here, only the progress of the flow.
 */
const telegramAdminSessionSchema = new Schema(
  {
    telegramUserId: {
      type: Number,
      required: true,
      unique: true,
    },
    chatId: {
      type: Number,
    },

    authState: {
      type: String,
      enum: ["idle", "awaiting_email", "awaiting_password", "authenticated"],
      default: "idle",
    },
    authenticated: {
      type: Boolean,
      default: false,
    },

    // Whether the email step matched. Not revealed to the user until the
    // password step completes, so the reply never discloses which part failed.
    emailMatched: {
      type: Boolean,
      default: false,
    },

    failedAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    lockedUntil: {
      type: Date,
      default: null,
    },

    authenticatedAt: {
      type: Date,
      default: null,
    },
    // Pending-auth steps expire after minutes; authenticated sessions after
    // TELEGRAM_SESSION_HOURS.
    expiresAt: {
      type: Date,
      default: null,
    },
    lastActivityAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

export default mongoose.models.TelegramAdminSession ||
  mongoose.model("TelegramAdminSession", telegramAdminSessionSchema);
