/** Shared PDF settings. PDFs are vector documents, so typography and lines remain sharp at any zoom. */
export const LIST_PAGE = Object.freeze({
  widthIn: 26,
  heightIn: 30,
  widthPx: 2496, // CSS pixels at 96 CSS px per inch
  heightPx: 2880,
});

export const PROFILE_PAGE = Object.freeze({
  widthMm: 210,
  heightMm: 297,
});

export const ROWS_PER_PAGE = 20;
export const MAX_PDF_BYTES = 45 * 1024 * 1024;
export const SLOW_NOTICE_INTERVAL_MS = 60_000;

/** Keep below the route/function maximum so a failure message can still be sent. */
export function getPdfTimeoutMs() {
  const raw = Number.parseInt(process.env.PDF_TIMEOUT_MS || "270000", 10);
  if (!Number.isFinite(raw) || raw < 10_000) return 270_000;
  return Math.min(raw, 270_000);
}
