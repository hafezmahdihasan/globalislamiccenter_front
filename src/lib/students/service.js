import { randomBytes } from "node:crypto";
import { connectDB } from "@/lib/db/mongoose";
import StudentInquiry from "@/models/StudentInquiry";
import { validateStudentInquiry } from "@/lib/students/validation";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { verifyRecaptcha } from "@/lib/security/recaptcha";
import { notifyNewInquiry } from "@/lib/telegram/notifications";
import { AppError } from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";

export const RECAPTCHA_ACTION = "student_form";
/** A student stops being "new" after this many successful /newstudents exports. */
export const NEW_EXPORT_LIMIT = 3;

async function ensureDb() {
  try {
    await connectDB();
  } catch (cause) {
    throw new AppError("DATABASE_ERROR", { cause });
  }
}

function generateSubmissionId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `GIC-${date}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

async function saveInquiry(data, ipAddress) {
  // Explicit field list: never spread client input into the document.
  const base = {
    studentName: data.studentName,
    age: data.age,
    classLevel: data.classLevel,
    country: data.country,
    city: data.city,
    studyTopic: data.studyTopic,
    whatsapp: data.whatsapp,
    email: data.email,
    contactName: data.contactName,
    guardianWhatsapp: data.guardianWhatsapp,
    guardianEmail: data.guardianEmail,
    message: data.message,
    consent: data.consent,
    guardianConsent: data.guardianConsent,
    ipAddress,
    source: "website",
  };

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await StudentInquiry.create({ ...base, submissionId: generateSubmissionId() });
    } catch (cause) {
      if (cause?.code === 11000) continue; // submissionId collision: try a new one
      throw new AppError("DATABASE_ERROR", { cause });
    }
  }
  throw new AppError("DATABASE_ERROR", { cause: new Error("Could not allocate a unique submissionId") });
}

/**
 * Public submission pipeline:
 * validate -> honeypot -> rate limit -> reCAPTCHA -> save -> Telegram notify.
 * Returns only the public-safe submission ID.
 */
export async function submitStudentInquiry(body, { ip, requestId }) {
  const result = validateStudentInquiry(body);
  if (!result.success) throw new AppError("VALIDATION_ERROR", { fields: result.fields });
  const data = result.data;

  if (data.website) {
    logger.warn("honeypot triggered", { requestId, action: "student_inquiry" });
    throw new AppError("REQUEST_REJECTED");
  }

  await ensureDb();

  let limit;
  try {
    limit = await checkRateLimit({ scope: "student-inquiry", identifier: ip });
  } catch (cause) {
    throw new AppError("DATABASE_ERROR", { cause });
  }
  if (!limit.allowed) {
    throw new AppError("RATE_LIMITED", { retryAfterSeconds: limit.retryAfterSeconds });
  }

  if (!data.recaptchaToken) throw new AppError("RECAPTCHA_FAILED");
  await verifyRecaptcha({
    token: data.recaptchaToken,
    expectedAction: RECAPTCHA_ACTION,
    ip,
    requestId,
  });

  const inquiry = await saveInquiry(data, ip);
  logger.info("student inquiry saved", {
    requestId,
    action: "student_inquiry",
    submissionId: inquiry.submissionId,
  });

  // Telegram failure must never lose or reject the saved inquiry.
  try {
    await notifyNewInquiry(inquiry);
  } catch (error) {
    logger.error("telegram notification threw", {
      requestId,
      action: "telegram_notify",
      submissionId: inquiry.submissionId,
      error,
    });
  }

  return { submissionId: inquiry.submissionId };
}

export async function listNewInquiries() {
  await ensureDb();
  return StudentInquiry.find({ isNewInquiry: true }).sort({ createdAt: -1 }).lean();
}

export async function listAllInquiries() {
  await ensureDb();
  return StudentInquiry.find({}).sort({ createdAt: -1 }).lean();
}

/**
 * Call ONLY after the CSV was delivered successfully. Increments each
 * student's export count, then retires anyone who reached the limit.
 */
export async function recordNewInquiryExport(ids) {
  if (!ids.length) return;
  await ensureDb();
  await StudentInquiry.updateMany(
    { _id: { $in: ids }, isNewInquiry: true },
    { $inc: { newExportCount: 1 } },
  );
  await StudentInquiry.updateMany(
    { _id: { $in: ids }, newExportCount: { $gte: NEW_EXPORT_LIMIT } },
    { $set: { isNewInquiry: false } },
  );
}
