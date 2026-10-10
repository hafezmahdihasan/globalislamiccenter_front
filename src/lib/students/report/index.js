import { toReportRecord } from "@/lib/students/report/record";
import { buildListHtml } from "@/lib/students/report/list-template";
import { buildProfileHtml } from "@/lib/students/report/profile-template";
import { getFontCss } from "@/lib/students/report/fonts";
import { MAX_FILE_BYTES } from "@/lib/students/report/constants";

export { MAX_FILE_BYTES };

/** Embeds the Bengali/Latin fonts so the file looks right on any computer. */
async function withFonts(html) {
  const fontCss = await getFontCss();
  return fontCss ? html.replace("<style>", `<style>${fontCss}\n`) : html;
}

/** Table report: 20 students per page, message never included. */
export async function buildStudentListFile(rows, { title, subtitle, generatedAt } = {}) {
  const { html, pageCount } = buildListHtml(rows.map(toReportRecord), { title, subtitle, generatedAt });
  return { buffer: Buffer.from(await withFonts(html), "utf8"), pageCount };
}

/** One-page A4 information sheet for a single student (message included). */
export async function buildStudentProfileFile(row, { generatedAt } = {}) {
  const html = buildProfileHtml(toReportRecord(row), { generatedAt });
  return { buffer: Buffer.from(await withFonts(html), "utf8"), pageCount: 1 };
}

export function reportFilename(kind, now = new Date()) {
  const iso = now.toISOString();
  const stamp = `${iso.slice(0, 10).replace(/-/g, "")}-${iso.slice(11, 16).replace(":", "")}`;
  return `gic-${kind}-${stamp}.html`;
}
