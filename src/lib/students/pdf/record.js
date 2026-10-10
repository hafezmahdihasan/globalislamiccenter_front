import { MINOR_AGE_LIMIT } from "@/lib/students/validation";

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

const clean = (value) =>
  value === null || value === undefined ? "" : String(value).replace(CONTROL_CHARS, "").trim();

/**
 * Turns a database row (lean object or Mongoose document) into the exact
 * fields the PDFs need. All "who do we contact" rules live here:
 *
 *  - age >= 18: the student's own WhatsApp, email and consent.
 *  - age <  18: the guardian's WhatsApp, email and consent ONLY.
 *
 * `message` is carried for the single-student PDF; list templates never read it.
 */
export function toPdfRecord(row) {
  const age = Number(row.age);
  const isMinor = Number.isFinite(age) && age < MINOR_AGE_LIMIT;

  const city = clean(row.city);
  const country = clean(row.country);

  return {
    submissionId: clean(row.submissionId),
    name: clean(row.studentName),
    age: Number.isFinite(age) ? age : null,
    isMinor,
    classLevel: clean(row.classLevel),
    city,
    country,
    address: [city, country].filter(Boolean).join(", "),
    topic: clean(row.studyTopic),
    contactRole: isMinor ? "Guardian" : "Student",
    contactName: isMinor ? clean(row.contactName) : "",
    phone: clean(isMinor ? row.guardianWhatsapp : row.whatsapp),
    email: clean(isMinor ? row.guardianEmail : row.email),
    consent: Boolean(isMinor ? row.guardianConsent : row.consent),
    ip: clean(row.ipAddress),
    message: clean(row.message),
    createdAt: row.createdAt ?? null,
  };
}
