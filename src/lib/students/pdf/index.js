import { toPdfRecord } from "@/lib/students/pdf/record";
import { buildListHtml } from "@/lib/students/pdf/list-template";
import { buildProfileHtml } from "@/lib/students/pdf/profile-template";
import { getFontCss } from "@/lib/students/pdf/fonts";
import { logger } from "@/lib/utils/logger";
import { renderPdf } from "@/lib/students/pdf/browser";
import { LIST_PAGE, PROFILE_PAGE, MAX_PDF_BYTES, getExportFormat } from "@/lib/students/pdf/constants";

export { MAX_PDF_BYTES };

async function withFonts(html) {
  const fontCss = await getFontCss();
  return fontCss ? html.replace("<style>", `<style>${fontCss}\n`) : html;
}

/** Table PDF, 26in x 30in, 20 students per page. */
export async function buildStudentListPdf(rows, { title, subtitle, signal, generatedAt } = {}) {
  const records = rows.map(toPdfRecord);
  const { html, pageCount } = buildListHtml(records, { title, subtitle, generatedAt });
  const buffer = await renderPdf(await withFonts(html), {
    signal,
    width: `${LIST_PAGE.widthIn}in`,
    height: `${LIST_PAGE.heightIn}in`,
  });
  return { buffer, pageCount };
}

/** One-page A4 information sheet for a single student. */
export async function buildStudentProfilePdf(row, { signal, generatedAt } = {}) {
  const html = buildProfileHtml(toPdfRecord(row), { generatedAt });
  const buffer = await renderPdf(await withFonts(html), {
    signal,
    width: `${PROFILE_PAGE.widthMm}mm`,
    height: `${PROFILE_PAGE.heightMm}mm`,
  });
  return { buffer, pageCount: 1 };
}

export function pdfFilename(kind, now = new Date()) {
  const iso = now.toISOString();
  const stamp = `${iso.slice(0, 10).replace(/-/g, "")}-${iso.slice(11, 16).replace(":", "")}`;
  return `gic-${kind}-${stamp}.pdf`;
}

export function exportFilename(kind, format, now = new Date()) {
  return pdfFilename(kind, now).replace(/\.pdf$/, `.${format}`);
}

/** Self-contained HTML (fonts embedded, no scripts, no network). */
async function listHtmlFile(rows, options) {
  const records = rows.map(toPdfRecord);
  const { html, pageCount } = buildListHtml(records, options);
  return { buffer: Buffer.from(await withFonts(html), "utf8"), pageCount, format: "html" };
}

async function profileHtmlFile(row, options) {
  const html = buildProfileHtml(toPdfRecord(row), options);
  return { buffer: Buffer.from(await withFonts(html), "utf8"), pageCount: 1, format: "html" };
}

/**
 * Honors EXPORT_FORMAT. In "auto" mode a PDF failure (for example Chromium
 * cannot start on the host) falls back to HTML instead of failing the export.
 * Returns { buffer, pageCount, format: "pdf" | "html", fellBack: boolean }.
 */
export async function buildListFile(rows, options = {}) {
  const mode = getExportFormat();
  if (mode === "html") return { ...(await listHtmlFile(rows, options)), fellBack: false };
  try {
    return { ...(await buildStudentListPdf(rows, options)), format: "pdf", fellBack: false };
  } catch (error) {
    if (mode === "pdf" || options.signal?.aborted) throw error;
    logger.warn("list pdf failed, sending html instead", { action: "pdf_fallback", error });
    return { ...(await listHtmlFile(rows, options)), fellBack: true };
  }
}

export async function buildProfileFile(row, options = {}) {
  const mode = getExportFormat();
  if (mode === "html") return { ...(await profileHtmlFile(row, options)), fellBack: false };
  try {
    return { ...(await buildStudentProfilePdf(row, options)), format: "pdf", fellBack: false };
  } catch (error) {
    if (mode === "pdf" || options.signal?.aborted) throw error;
    logger.warn("profile pdf failed, sending html instead", { action: "pdf_fallback", error });
    return { ...(await profileHtmlFile(row, options)), fellBack: true };
  }
}
