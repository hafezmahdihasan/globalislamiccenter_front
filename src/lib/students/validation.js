/**
 * Shared student-inquiry validation.
 *
 * Used by the browser form (UX) AND the API route (authoritative). Keep this
 * file free of server-only imports so it stays safe in the client bundle.
 */

import { z } from "zod";
export const STUDY_TOPICS = ["কায়দা", "তাজবিদ", "আমপারা", "কোরআন শরিফ"];

export const MINOR_AGE_LIMIT = 18;
export const MIN_AGE = 3;
export const MAX_AGE = 100;

export const LIMITS = {
  name: 100,
  phone: 30,
  email: 254,
  country: 100,
  city: 200,
  classLevel: 100,
  message: 2000,
};

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/** Single-line text: strip control chars and angle brackets, collapse spaces. */
function cleanLine(value) {
  if (typeof value !== "string") return value;
  return value
    .replace(CONTROL_CHARS, "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Multi-line text: same, but keep (at most one blank line of) line breaks. */
function cleanMultiline(value) {
  if (typeof value !== "string") return value;
  return value
    .replace(/\r\n?/g, "\n")
    .replace(CONTROL_CHARS, "")
    .replace(/[<>]/g, "")
    .replace(/[^\S\n]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizePhone(value) {
  if (typeof value !== "string") return value;
  const trimmed = value.replace(CONTROL_CHARS, "").trim();
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";
  return trimmed.startsWith("+") ? `+${digits}` : digits;
}

const blankToUndefined = (normalize) => (value) => {
  const result = normalize(value);
  return result === "" || result === null ? undefined : result;
};

const requiredMsg = (label) => `${label} লিখুন`;
const maxMsg = (label, max) => `${label} সর্বোচ্চ ${max} অক্ষরের হতে পারবে`;

const requiredLine = (label, min, max) =>
  z.preprocess(
    cleanLine,
    z
      .string({
        required_error: requiredMsg(label),
        invalid_type_error: requiredMsg(label),
      })
      .min(min, requiredMsg(label))
      .max(max, maxMsg(label, max)),
  );

const optionalLine = (label, max) =>
  z.preprocess(
    blankToUndefined(cleanLine),
    z
      .string({ invalid_type_error: `${label} সঠিক নয়` })
      .max(max, maxMsg(label, max))
      .optional(),
  );

const PHONE_MESSAGE =
  "সঠিক WhatsApp নম্বর লিখুন (দেশের কোড সহ, যেমন +8801XXXXXXXXX)";

const phoneShape = z
  .string({ required_error: PHONE_MESSAGE, invalid_type_error: PHONE_MESSAGE })
  .regex(/^\+?[0-9]{7,15}$/, PHONE_MESSAGE)
  .max(LIMITS.phone, PHONE_MESSAGE);

const optionalPhone = z.preprocess(
  blankToUndefined(normalizePhone),
  phoneShape.optional(),
);

const EMAIL_MESSAGE = "সঠিক ইমেইল ঠিকানা লিখুন";
const optionalEmail = z.preprocess(
  blankToUndefined((value) =>
    typeof value === "string" ? cleanLine(value).toLowerCase() : value,
  ),
  z
    .string({ invalid_type_error: EMAIL_MESSAGE })
    .email(EMAIL_MESSAGE)
    .max(LIMITS.email, EMAIL_MESSAGE)
    .optional(),
);

const AGE_MESSAGE = `সঠিক বয়স লিখুন (${MIN_AGE}–${MAX_AGE})`;
export const ageSchema = z.preprocess(
  (value) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed === "" ? undefined : Number(trimmed);
    }
    return value;
  },
  z
    .number({ required_error: "বয়স লিখুন", invalid_type_error: AGE_MESSAGE })
    .int(AGE_MESSAGE)
    .min(MIN_AGE, AGE_MESSAGE)
    .max(MAX_AGE, AGE_MESSAGE),
);

/** Fields accepted from the client. Unknown keys are dropped by Zod. */
export const studentInquirySchema = z.object({
  studentName: requiredLine("শিক্ষার্থীর নাম", 2, LIMITS.name),
  age: ageSchema,
  classLevel: optionalLine("শ্রেণি/শিক্ষাগত স্তর", LIMITS.classLevel),
  country: requiredLine("দেশ", 2, LIMITS.country),
  city: optionalLine("শহর/অবস্থান", LIMITS.city),

  studyTopic: z.enum(STUDY_TOPICS, {
    errorMap: () => ({ message: "পড়ার বিষয় নির্বাচন করুন" }),
  }),

  // Student's own contact: required for 18+, ignored (never stored) under 18.
  // The age-dependent rules live in validateStudentInquiry().
  whatsapp: optionalPhone,
  email: optionalEmail,

  contactName: optionalLine("অভিভাবক/যোগাযোগকারীর নাম", LIMITS.name),
  guardianWhatsapp: optionalPhone,
  guardianEmail: optionalEmail,

  message: z.preprocess(
    blankToUndefined(cleanMultiline),
    z
      .string({ invalid_type_error: "বার্তা সঠিক নয়" })
      .max(LIMITS.message, maxMsg("বার্তা", LIMITS.message))
      .optional(),
  ),

  consent: z.boolean().optional().default(false),
  guardianConsent: z.boolean().optional().default(false),

  // Honeypot: real users never see or fill this.
  website: z.string().max(500).optional().default(""),
  // Verified server-side only; not part of the stored record.
  recaptchaToken: z.string().min(1).max(4000).optional(),
});

function zodFieldErrors(error) {
  const fields = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!(key in fields)) fields[key] = issue.message;
  }
  return fields;
}

/**
 * Validate a raw payload.
 * Returns { success: true, data } or { success: false, fields }.
 *
 * Minor rule (age < 18): ONLY the guardian's name, WhatsApp, (optional) email and
 * consent are collected; the student's own WhatsApp, email and consent are ignored.
 * Adults (18+) give their own WhatsApp, optional email and consent.
 * This is checked independently of the base schema so a user sees all
 * problems at once instead of fixing them in rounds.
 */
export function validateStudentInquiry(input) {
  const source = input && typeof input === "object" ? input : {};

  const age = ageSchema.safeParse(source.age);
  const isMinor = age.success && age.data < MINOR_AGE_LIMIT;

  // Under 18: the student's own phone, email and consent are NOT collected.
  // Drop them before parsing so stale hidden values cannot cause errors or be saved.
  const raw = isMinor
    ? { ...source, whatsapp: undefined, email: undefined, consent: undefined }
    : source;

  const parsed = studentInquirySchema.safeParse(raw);
  const fields = parsed.success ? {} : zodFieldErrors(parsed.error);

  if (isMinor) {
    if (!fields.contactName && !cleanLine(raw.contactName)) {
      fields.contactName = "অভিভাবক/যোগাযোগকারীর নাম লিখুন";
    }
    if (!fields.guardianWhatsapp && !normalizePhone(raw.guardianWhatsapp)) {
      fields.guardianWhatsapp = "অভিভাবকের WhatsApp নম্বর লিখুন";
    }
    if (raw.guardianConsent !== true) {
      fields.guardianConsent = "অভিভাবকের সম্মতি ও অনুমতি নিশ্চিত করুন";
    }
  } else {
    // 18 and over (or age still invalid): same rules as before.
    if (!fields.whatsapp && !normalizePhone(raw.whatsapp)) {
      fields.whatsapp = PHONE_MESSAGE;
    }
    if (raw.consent !== true) {
      fields.consent = "যোগাযোগের জন্য সম্মতি দিতে হবে";
    }
  }

  if (Object.keys(fields).length > 0) return { success: false, fields };

  const data = parsed.data;
  if (isMinor) {
    data.whatsapp = undefined;
    data.email = undefined;
    data.consent = false;
  }
  return { success: true, data };
}
