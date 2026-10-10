/**
 * CSV export for the admin Telegram bot.
 *
 * - UTF-8 with BOM so Excel opens Bengali text correctly.
 * - RFC 4180 quoting for commas, quotes and line breaks.
 * - Spreadsheet formula injection guard: cells that start with = + - @ are
 *   prefixed with an apostrophe (phone numbers like +8801... are exempt).
 * - IP address is intentionally NOT exported.
 */

// Telegram bots can upload documents up to 50 MB; keep a safety margin.
export const MAX_EXPORT_BYTES = 45 * 1024 * 1024;

const BOM = "﻿";
const FORMULA_START = /^[=+\-@\t\r]/;

const numberPurify = (value) => {
  value = String(value || "").trim();
  return value.startsWith("+") ? value.substring(1) : value.trim();
};

export const CSV_COLUMNS = [
  { header: "Submission ID", value: (r) => r.submissionId },
  { header: "Student Name", value: (r) => r.studentName },
  { header: "Age", value: (r) => r.age },
  { header: "Class", value: (r) => r.classLevel },
  { header: "Country", value: (r) => r.country },
  { header: "City", value: (r) => r.city },
  { header: "Study Topic", value: (r) => r.studyTopic },
  { header: "WhatsApp", value: (r) => numberPurify(r.whatsapp), phone: true },
  { header: "Email", value: (r) => r.email },
  { header: "Guardian/Contact", value: (r) => r.contactName },
  {
    header: "Guardian WhatsApp",
    value: (r) => numberPurify(r.guardianWhatsapp),
    phone: true,
  },
  { header: "Guardian Email", value: (r) => r.guardianEmail },
  { header: "Message", value: (r) => r.message },
  { header: "Is New", value: (r) => r.isNewInquiry },
  { header: "New Export Count", value: (r) => r.newExportCount },
  { header: "Submitted At", value: (r) => r.createdAt },
];

function toCell(value, { phone = false } = {}) {
  if (value === null || value === undefined) return "";

  let text;
  if (value instanceof Date) text = value.toISOString();
  else if (typeof value === "boolean") text = value ? "Yes" : "No";
  else text = String(value);

  if (FORMULA_START.test(text) && !(phone && /^\+\d+$/.test(text))) {
    text = `'${text}`;
  }

  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function buildStudentsCsv(rows) {
  const lines = [CSV_COLUMNS.map((column) => toCell(column.header)).join(",")];
  for (const row of rows) {
    lines.push(
      CSV_COLUMNS.map((column) => toCell(column.value(row), column)).join(","),
    );
  }
  return BOM + lines.join("\r\n") + "\r\n";
}

export function csvByteLength(csv) {
  return Buffer.byteLength(csv, "utf8");
}

export function exportFilename(kind, now = new Date()) {
  const iso = now.toISOString(); // 2026-10-05T21:45:00.000Z
  const stamp = `${iso.slice(0, 10).replace(/-/g, "")}-${iso.slice(11, 16).replace(":", "")}`;
  return `gic-${kind}-${stamp}.csv`;
}
