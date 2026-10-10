import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * NOTE: the "is new" flag is stored as `isNewInquiry`, not `isNew`.
 * `isNew` is a reserved Mongoose document property; using it as a schema
 * path can interfere with save/insert logic. Behaviour is identical to the
 * plan: tracked per student, flipped to false after 3 successful exports.
 */
const studentInquirySchema = new Schema(
  {
    submissionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    studentName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    age: {
      type: Number,
      required: true,
      min: 3,
      max: 100,
    },
    classLevel: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    country: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    city: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    studyTopic: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    whatsapp: {
      type: String,
      required() {
        return this.age >= 18;
      },
      trim: true,
      maxlength: 30,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },

    contactName: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    guardianWhatsapp: {
      type: String,
      trim: true,
      maxlength: 30,
    },
    guardianEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },

    message: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    // Personal data: captured server-side only, excluded from queries by
    // default and from the admin CSV export.
    ipAddress: {
      type: String,
      trim: true,
      maxlength: 64,
      select: false,
    },

    consent: {
      type: Boolean,
      default: false,
    },
    guardianConsent: {
      type: Boolean,
      default: false,
    },
    source: {
      type: String,
      default: "website",
      maxlength: 50,
    },

    isNewInquiry: {
      type: Boolean,
      default: true,
    },
    newExportCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    telegramNotificationStatus: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending",
    },
    telegramNotificationAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastTelegramNotificationAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

// Indexes match real query patterns: /newstudents and /allstudents.
studentInquirySchema.index({ isNewInquiry: 1, createdAt: -1 });
studentInquirySchema.index({ createdAt: -1 });

export default mongoose.models.StudentInquiry ||
  mongoose.model("StudentInquiry", studentInquirySchema);
