import { readFile } from "node:fs/promises";
import path from "node:path";
import { MAX_PDF_BYTES, getPdfTimeoutMs } from "./constants.js";
import { renderHtmlToPdf } from "./browser.js";
import { renderStudentListHtml } from "./list-template.js";
import { renderStudentProfileHtml } from "./profile-template.js";

function timestamp(now = new Date()) {
  const iso = now.toISOString();
  return `${iso.slice(0, 10).replace(/-/g, "")}-${iso.slice(11, 16).replace(":", "")}`;
}

export function studentListPdfFilename(kind = "all", now = new Date()) {
  const safeKind = kind === "new" ? "new-students" : "all-students";
  return `gic-${safeKind}-${timestamp(now)}.pdf`;
}

export function studentProfilePdfFilename(record, now = new Date()) {
  const id = String(record?.submissionId || "inquiry").replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 70);
  return `gic-student-${id}-${timestamp(now)}.pdf`;
}

async function readLogoDataUri() {
  const logoPath = path.join(process.cwd(), "public", "GIC.svg");
  try {
    const svg = await readFile(logoPath, "utf8");
    // The asset is repository-owned; inline it to make the PDF completely offline/self-contained.
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  } catch {
    return "";
  }
}

async function validatePdf(buffer, label) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 8 || buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new Error(`${label} did not produce a valid PDF buffer.`);
  }
  if (buffer.length > MAX_PDF_BYTES) {
    throw new Error(`${label} exceeds the safe Telegram document upload size (${MAX_PDF_BYTES} bytes).`);
  }
  return buffer;
}

export async function createStudentListPdf(records, { kind = "all", signal, timeoutMs = getPdfTimeoutMs() } = {}) {
  const html = renderStudentListHtml(records, { kind });
  const buffer = await renderHtmlToPdf(html, { signal, timeoutMs });
  return validatePdf(buffer, "Student list PDF");
}

export async function createStudentProfilePdf(record, { signal, timeoutMs = getPdfTimeoutMs() } = {}) {
  const logoDataUri = await readLogoDataUri();
  const html = renderStudentProfileHtml(record, { logoDataUri });
  const buffer = await renderHtmlToPdf(html, { signal, timeoutMs });
  return validatePdf(buffer, "Student profile PDF");
}

export { MAX_PDF_BYTES };
