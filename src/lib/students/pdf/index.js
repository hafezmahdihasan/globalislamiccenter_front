import { toPdfRecord } from "@/lib/students/pdf/record";
import { buildListHtml } from "@/lib/students/pdf/list-template";
import { buildProfileHtml } from "@/lib/students/pdf/profile-template";
import { getFontCss } from "@/lib/students/pdf/fonts";
import { renderPdf } from "@/lib/students/pdf/browser";
import { LIST_PAGE, PROFILE_PAGE, MAX_PDF_BYTES } from "@/lib/students/pdf/constants";

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
