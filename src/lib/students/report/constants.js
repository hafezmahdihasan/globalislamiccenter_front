/** Shared report settings. Everything here is a plain constant: no I/O. */

// The HTML keeps the 26in x 30in sheet size so "Print -> Save as PDF" in a
// browser gives the same pages. 26in x 96 = 2496px, 30in x 96 = 2880px.
export const LIST_PAGE = {
  widthIn: 26,
  heightIn: 30,
  widthPx: 2496,
  // 1px shorter than the page: no blank trailing page when printed.
  sheetHeightPx: 2879,
};

// A4 is 210 x 297 mm; the sheet is 1mm short for the same reason.
export const PROFILE_PAGE = { widthMm: 210, heightMm: 297, sheetHeightMm: 296 };

/** Hard rule from the product owner: 20 students per list page. */
export const ROWS_PER_PAGE = 20;

// Telegram bots can upload documents up to 50 MB; keep a safety margin.
export const MAX_FILE_BYTES = 45 * 1024 * 1024;
