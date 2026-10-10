import { getBot } from "@/lib/telegram/bot";
import { getTelegramEnv } from "@/lib/config/env";
import StudentInquiry from "@/models/StudentInquiry";
import { formatDateTime } from "@/lib/utils/format";
import { buildProfileFile, exportFilename } from "@/lib/students/pdf";
import { generateWithSlowNotices } from "@/lib/telegram/pdf-delivery";
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
 * Notify every configured admin chat with a one-page A4 PDF of the NEW student
 * (not a table). If the PDF cannot be made, the plain-text message is sent
 * instead so the admin never misses an inquiry. Never throws: a Telegram
 * outage must not affect the already-saved inquiry. The outcome is stored.
 *
 * Designed to run AFTER the HTTP response (see `after()` in the route), so a
 * slow PDF never keeps the visitor waiting.
 */
export async function notifyNewInquiry(inquiry) {
  let sent = 0;

  try {
    const { TELEGRAM_ADMIN_CHAT_IDS } = getTelegramEnv();
    const bot = getBot();
    const notifyAll = async (text) => {
      await Promise.allSettled(TELEGRAM_ADMIN_CHAT_IDS.map((id) => bot.telegram.sendMessage(id, text)));
    };

    let pdf = null;
    try {
      pdf = await generateWithSlowNotices(
        ({ signal }) => buildProfileFile(inquiry, { signal }),
        { notify: notifyAll },
      );
    } catch (error) {
      logger.error("student pdf failed, falling back to text", {
        action: "telegram_notify",
        submissionId: inquiry.submissionId,
        error,
      });
    }

    const summary = `🔔 New student: ${inquiry.studentName} (age ${inquiry.age})\n${inquiry.submissionId}`;
    const fallbackText = formatInquiryMessage(inquiry);

    for (const chatId of TELEGRAM_ADMIN_CHAT_IDS) {
      try {
        if (pdf) {
          await bot.telegram.sendDocument(
            chatId,
            { source: pdf.buffer, filename: exportFilename(`student-${inquiry.submissionId}`, pdf.format) },
            {
              caption:
                pdf.format === "html"
                  ? `${summary}\n\nℹ️ Sent as an HTML file: open it in a browser (Print → Save as PDF if you need a PDF).`
                  : summary,
            },
          );
        } else {
          await bot.telegram.sendMessage(
            chatId,
            `⚠️ The PDF could not be created, so here is the plain text instead.\n\n${fallbackText}`,
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
