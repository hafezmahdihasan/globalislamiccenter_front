import { startSlowNotices } from "@/lib/telegram/slow-notice";
import { getPdfTimeoutMs, SLOW_NOTICE_INTERVAL_MS } from "@/lib/students/pdf/constants";

/**
 * Runs `generate({ signal })` with a hard deadline and automatic
 * "sorry, 1 more minute" messages (via `notify(text)`) every minute while it
 * is still running. Always stops the timers, success or failure.
 */
export async function generateWithSlowNotices(
  generate,
  { notify, intervalMs = SLOW_NOTICE_INTERVAL_MS, timeoutMs = getPdfTimeoutMs() },
) {
  const controller = new AbortController();
  const deadline = setTimeout(
    () => controller.abort(new Error(`PDF generation exceeded ${timeoutMs}ms`)),
    timeoutMs,
  );
  const notices = startSlowNotices(notify, { intervalMs });

  try {
    return await generate({ signal: controller.signal });
  } finally {
    clearTimeout(deadline);
    notices.stop();
  }
}
