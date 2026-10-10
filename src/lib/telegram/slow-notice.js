import { SLOW_NOTICE_INTERVAL_MS } from "@/lib/students/pdf/constants";
import { logger } from "@/lib/utils/logger";

const MESSAGES = [
  "😊 Sorry for the wait! Your PDF is taking a little longer than usual. Please give us about 1 more minute. 🙏",
  "🙏 So sorry, it's still being prepared. Thank you for your patience — about 1 more minute, please. 😊",
  "😅 Apologies again! The PDF is big and needs a bit more time. About 1 more minute, thanks for waiting! 🌟",
];

export function slowNoticeText(count) {
  const minutes = count;
  const base = MESSAGES[(count - 1) % MESSAGES.length];
  return `${base}\n(⏱ ${minutes} minute${minutes === 1 ? "" : "s"} so far)`;
}

/**
 * Starts a chain of timers: after 1 minute send notice #1, after 2 minutes
 * notice #2, ... until stop() is called. Each send failure is logged only.
 * Returns { stop }.
 */
export function startSlowNotices(send, { intervalMs = SLOW_NOTICE_INTERVAL_MS } = {}) {
  let count = 0;
  let stopped = false;
  let timer;

  const schedule = () => {
    timer = setTimeout(async () => {
      if (stopped) return;
      count += 1;
      try {
        await send(slowNoticeText(count), count);
      } catch (error) {
        logger.warn("slow-pdf notice failed", { action: "pdf_slow_notice", error });
      }
      if (!stopped) schedule();
    }, intervalMs);
  };
  schedule();

  return {
    stop() {
      stopped = true;
      clearTimeout(timer);
    },
  };
}
