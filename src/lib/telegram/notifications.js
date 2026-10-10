import { getBot } from "@/lib/telegram/bot";
import { getTelegramEnv } from "@/lib/config/env";
import StudentInquiry from "@/models/StudentInquiry";
import { formatDateTime } from "@/lib/utils/format";
import { buildStudentProfileFile, reportFilename } from "@/lib/students/report";
import { logger } from "@/lib/utils/logger";

const line = (label, value) => (value ? `${label}: ${value}` : null);

/**
 * Plain text on purpose: every field is user-controlled, and sending without
 * a parse_mode means there is nothing to escape or inject.
 */
export function formatInquiryMessage(inquiry) {
  const location = [inquiry.city, inquiry.country].filter(Boolean).join(", ");
  const guardian = [inquiry.contactName, inquiry.guardianWhatsapp, inquiry.guardianEmail]
    .filter(Boolean)
    .join(" | ");

  return [
    "🔔 New Student Inquiry",
    "",
    line("Student", `${inquiry.studentName} (age ${inquiry.age})`),
    line("Class", inquiry.classLevel),
    line("Location", location),
    line("Study Topic", inquiry.studyTopic),
    line("WhatsApp", inquiry.whatsapp),
    line("Email", inquiry.email),
    line("Guardian/Contact", guardian),
    line("Message", inquiry.message),
    "",
    line("Submission ID", inquiry.submissionId),
    line("Submitted", formatDateTime(inquiry.createdAt ?? new Date())),
  ]
    .filter((entry) => entry !== null)
    .join("\n");
}

/**
 * Notify every configured admin chat with a one-page A4 HTML sheet of the NEW student
 * (not a table). If the report cannot be built, the plain-text message is sent
 * instead so the admin never misses an inquiry. Never throws: a Telegram
 * outage must not affect the already-saved inquiry. The outcome is stored.
 *
 * Designed to run AFTER the HTTP response (see `after()` in the route), so a
 * slow upload never keeps the visitor waiting.
 */
export async function notifyNewInquiry(inquiry) {
  let sent = 0;

  try {
    const { TELEGRAM_ADMIN_CHAT_IDS } = getTelegramEnv();
    const bot = getBot();
    let report = null;
    try {
      report = await buildStudentProfileFile(inquiry);
    } catch (error) {
      logger.error("student report failed, falling back to text", {
        action: "telegram_notify",
        submissionId: inquiry.submissionId,
        error,
      });
    }

    const summary = `🔔 New student: ${inquiry.studentName} (age ${inquiry.age})\n${inquiry.submissionId}`;
    const fallbackText = formatInquiryMessage(inquiry);

    for (const chatId of TELEGRAM_ADMIN_CHAT_IDS) {
      try {
        if (report) {
          await bot.telegram.sendDocument(
            chatId,
            { source: report.buffer, filename: reportFilename(`student-${inquiry.submissionId}`) },
            { caption: `${summary}\n\nℹ️ Open the file in a browser. Need a PDF? Print → Save as PDF.` },
          );
        } else {
          await bot.telegram.sendMessage(
            chatId,
            `⚠️ The report file could not be created, so here is the plain text instead.\n\n${fallbackText}`,
            { link_preview_options: { is_disabled: true } },
          );
        }
        sent += 1;
      } catch (error) {
        logger.error("telegram notification failed", {
          action: "telegram_notify",
          submissionId: inquiry.submissionId,
          chatId,
          error,
        });
      }
    }
  } catch (error) {
    logger.error("telegram notification setup failed", {
      action: "telegram_notify",
      submissionId: inquiry.submissionId,
      error,
    });
  }

  try {
    await StudentInquiry.updateOne(
      { _id: inquiry._id },
      {
        $set: {
          telegramNotificationStatus: sent > 0 ? "sent" : "failed",
          lastTelegramNotificationAt: new Date(),
        },
        $inc: { telegramNotificationAttempts: 1 },
      },
    );
  } catch (error) {
    logger.error("could not record notification status", {
      action: "telegram_notify",
      submissionId: inquiry.submissionId,
      error,
    });
  }

  return sent > 0;
}
