/** Shared PDF settings. Everything here is a plain constant: no I/O. */

// CSS pixels are 96 per inch, so 26in x 30in is 2496 x 2880 px.
export const LIST_PAGE = {
  widthIn: 26,
  heightIn: 30,
  widthPx: 2496,
  // 1px shorter than the page: guarantees Chromium never adds a blank page.
  sheetHeightPx: 2879,
};

// A4 is 210 x 297 mm; the sheet is 1mm short for the same reason.
export const PROFILE_PAGE = { widthMm: 210, heightMm: 297, sheetHeightMm: 296 };

/** Hard rule from the product owner: 20 students per list page. */
export const ROWS_PER_PAGE = 20;

/** First "sorry" message after 1 minute, then 2, 3, ... while still working. */
export const SLOW_NOTICE_INTERVAL_MS = 60_000;

function positiveInt(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Whole-PDF deadline. Must stay below the route's `maxDuration` (300s) so we
 * can still tell the admin that it failed. Override with PDF_TIMEOUT_MS.
 */
export function getPdfTimeoutMs() {
  return positiveInt(process.env.PDF_TIMEOUT_MS, 270_000);
}

// Telegram bots can upload documents up to 50 MB; keep a safety margin.
export const MAX_PDF_BYTES = 45 * 1024 * 1024;

/**
 * EXPORT_FORMAT:
 *   "auto" (default) - try PDF, fall back to a self-contained HTML file if the PDF engine fails
 *   "pdf"            - PDF only (errors if Chromium cannot start)
 *   "html"           - always HTML (no Chromium needed; opens in any browser)
 */
export function getExportFormat() {
  const value = String(process.env.EXPORT_FORMAT || "auto")
    .trim()
    .toLowerCase();
  return ["auto", "pdf", "html"].includes(value) ? value : "auto";
}
