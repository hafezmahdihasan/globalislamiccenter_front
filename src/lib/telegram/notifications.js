import { getBot } from "@/lib/telegram/bot";
import { getTelegramEnv } from "@/lib/config/env";
import StudentInquiry from "@/models/StudentInquiry";
import { formatDateTime } from "@/lib/utils/format";
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
 * Notify every configured admin chat. Never throws: a Telegram outage must
 * not affect the already-saved inquiry. The outcome is stored on the record.
 */
export async function notifyNewInquiry(inquiry) {
  let sent = 0;

  try {
    const { TELEGRAM_ADMIN_CHAT_IDS } = getTelegramEnv();
    const text = formatInquiryMessage(inquiry);
    const bot = getBot();

    for (const chatId of TELEGRAM_ADMIN_CHAT_IDS) {
      try {
        await bot.telegram.sendMessage(chatId, text, {
          link_preview_options: { is_disabled: true },
        });
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
