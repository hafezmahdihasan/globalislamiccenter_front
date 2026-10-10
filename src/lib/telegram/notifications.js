import { connectDB } from "@/lib/db/mongoose";
import StudentInquiry from "@/models/StudentInquiry";
import {
  getAdminChatIds,
  sendTelegramPdf,
  sendTelegramText,
} from "@/lib/telegram/pdf-api";
import {
  createStudentProfilePdf,
  studentProfilePdfFilename,
  MAX_PDF_BYTES,
} from "@/lib/students/export";
import { runWithMinuteProgress } from "@/lib/students/pdf/progress";
import { logger } from "@/lib/utils/logger";

function progressMessage(minute) {
  const duration = minute === 1 ? "1 minute" : `${minute} minutes`;
  return `😅 দুঃখিত! নতুন শিক্ষার্থীর PDF তৈরি করতে একটু বেশি সময় লাগছে। কাজ চলছে—অনুগ্রহ করে অপেক্ষা করুন। (${duration})`;
}

/**
 * Keep the notification status fields written by the original text notifier.
 * Tracking failures must not hide the actual Telegram delivery result.
 */
async function recordNotificationOutcome(inquiry, sent) {
  if (!inquiry?._id) return;

  try {
    await connectDB();
    await StudentInquiry.updateOne(
      { _id: inquiry._id },
      {
        $set: {
          telegramNotificationStatus: sent ? "sent" : "failed",
          lastTelegramNotificationAt: new Date(),
        },
        $inc: { telegramNotificationAttempts: 1 },
      },
    );
  } catch (error) {
    logger.error("could not record student PDF notification status", {
      action: "telegram_pdf_notification_status",
      submissionId: inquiry?.submissionId,
      error,
    });
  }
}

/**
 * Sends a designed one-page A4 profile PDF to each configured admin chat.
 * Called from the existing Next.js after() callback so slow PDF work does not
 * delay the public form response. The hosting function's maxDuration still
 * applies; this is background-after-response work, not a durable job queue.
 */
export async function notifyNewInquiry(inquiry) {
  const chatIds = getAdminChatIds();

  if (!chatIds.length) {
    logger.warn("student PDF notification skipped: no admin chat IDs configured", {
      action: "telegram_pdf_notification",
      submissionId: inquiry?.submissionId,
    });
    await recordNotificationOutcome(inquiry, false);
    return { sent: 0, skipped: true };
  }

  try {
    const result = await runWithMinuteProgress({
      sendProgress: async (minute) => {
        // Use allSettled so a temporarily unavailable admin chat never kills the job.
        await Promise.allSettled(
          chatIds.map((chatId) =>
            sendTelegramText(chatId, progressMessage(minute)),
          ),
        );
      },
      work: async ({ signal }) => {
        const pdf = await createStudentProfilePdf(inquiry, { signal });
        if (pdf.length > MAX_PDF_BYTES) {
          throw new Error("Student profile PDF exceeds Telegram's safe upload limit.");
        }

        const filename = studentProfilePdfFilename(inquiry);
        const deliveries = await Promise.allSettled(
          chatIds.map((chatId) =>
            sendTelegramPdf(chatId, pdf, filename, {
              caption: `New GIC student inquiry · ${inquiry.submissionId || "Inquiry"}`,
              signal,
            }),
          ),
        );

        const sent = deliveries.filter((item) => item.status === "fulfilled").length;
        const failed = deliveries.length - sent;

        for (const item of deliveries) {
          if (item.status === "rejected") {
            logger.error("student profile PDF delivery failed for an admin chat", {
              action: "telegram_pdf_notification",
              submissionId: inquiry?.submissionId,
              error: item.reason,
            });
          }
        }

        if (!sent) {
          throw new Error("Telegram could not deliver the student profile PDF to any configured admin chat.");
        }

        logger.info("student profile PDF delivered", {
          action: "telegram_pdf_notification",
          submissionId: inquiry?.submissionId,
          deliveredTo: sent,
          failedRecipients: failed,
        });

        return { sent, failed };
      },
    });

    await recordNotificationOutcome(inquiry, result.sent > 0);
    return result;
  } catch (error) {
    await recordNotificationOutcome(inquiry, false);
    logger.error("student profile PDF notification failed", {
      action: "telegram_pdf_notification",
      submissionId: inquiry?.submissionId,
      error,
    });
    throw error;
  }
}
