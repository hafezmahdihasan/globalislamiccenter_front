import { SLOW_NOTICE_INTERVAL_MS, getPdfTimeoutMs } from "./constants.js";

export class PdfJobTimeoutError extends Error {
  constructor() {
    super("PDF generation or delivery exceeded the configured time limit.");
    this.name = "PdfJobTimeoutError";
    this.code = "PDF_JOB_TIMEOUT";
  }
}

/**
 * Sends one friendly update each minute while rendering or uploading is active.
 * The AbortSignal is passed to the work so Chromium/fetch can be cancelled at timeout.
 */
export async function runWithMinuteProgress({
  work,
  sendProgress,
  intervalMs = SLOW_NOTICE_INTERVAL_MS,
  timeoutMs = getPdfTimeoutMs(),
}) {
  const controller = new AbortController();
  let minute = 0;
  let noticeBusy = false;
  let timeoutHandle;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutHandle = setTimeout(() => {
      const error = new PdfJobTimeoutError();
      controller.abort(error);
      reject(error);
    }, timeoutMs);
  });

  const intervalHandle = setInterval(async () => {
    if (noticeBusy || controller.signal.aborted) return;
    noticeBusy = true;
    minute += 1;
    try {
      await sendProgress?.(minute);
    } catch {
      // Progress messages are best-effort; they must not fail the PDF job.
    } finally {
      noticeBusy = false;
    }
  }, intervalMs);

  try {
    return await Promise.race([
      Promise.resolve().then(() => work({ signal: controller.signal })),
      timeoutPromise,
    ]);
  } finally {
    clearInterval(intervalHandle);
    clearTimeout(timeoutHandle);
    if (!controller.signal.aborted) controller.abort(new Error("PDF job completed."));
  }
}
