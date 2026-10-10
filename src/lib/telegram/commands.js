import { getTelegramEnv } from "@/lib/config/env";
import { isAllowedUser, checkAdminEmail, checkAdminPassword } from "@/lib/telegram/auth";
import {
  getSession,
  isAuthenticated,
  isAuthInProgress,
  isLocked,
  beginAuth,
  recordEmail,
  completeAuth,
  registerFailure,
  endSession,
  touchSession,
  LOCK_MINUTES,
} from "@/lib/telegram/session";
import {
  listNewInquiries,
  listAllInquiries,
  recordNewInquiryExport,
} from "@/lib/students/service";
import {
  createStudentListPdf,
  studentListPdfFilename,
  MAX_PDF_BYTES,
} from "@/lib/students/export";
import { runWithMinuteProgress } from "@/lib/students/pdf/progress";
import { formatDateTime } from "@/lib/utils/format";
import { logger } from "@/lib/utils/logger";

const COMMANDS_SIGNED_OUT = [
  "/auth — sign in",
  "/status — session status",
];
const COMMANDS_SIGNED_IN = [
  "/newstudents — PDF of new inquiries",
  "/allstudents — PDF of every inquiry",
  "/status — session status",
  "/logout — end session",
];

const deleteQuietly = (ctx) => ctx.deleteMessage().catch(() => {});

function progressMessage(minute) {
  const duration = minute === 1 ? "1 minute" : `${minute} minutes`;
  return `😅 দুঃখিত! PDF তৈরি করতে একটু বেশি সময় লাগছে। কাজ চলছে—অনুগ্রহ করে অপেক্ষা করুন। (${duration})`;
}

/**
 * Runs on every update before any handler. Only allowlisted users in a private
 * chat are allowed to operate this bot or initiate password authentication.
 */
async function guard(ctx, next) {
  const userId = ctx.from?.id;
  if (!userId || ctx.chat?.type !== "private") return undefined;

  if (!isAllowedUser(userId)) {
    logger.warn("telegram user not allowed", {
      action: "telegram_guard",
      telegramUserId: userId,
    });
    if (ctx.message) await ctx.reply("⛔ You are not authorized to use this bot.");
    return undefined;
  }

  return next();
}

async function requireAuth(ctx) {
  const session = await getSession(ctx.from.id);
  if (!isAuthenticated(session) || String(session.chatId) !== String(ctx.chat.id)) {
    await ctx.reply("🔒 Please sign in first with /auth.");
    return null;
  }

  await touchSession(ctx.from.id);
  return session;
}

async function handleStart(ctx) {
  const session = await getSession(ctx.from.id);
  const commands = isAuthenticated(session) ? COMMANDS_SIGNED_IN : COMMANDS_SIGNED_OUT;
  await ctx.reply([
    "👋 GIC Admin Bot",
    "This bot is for authorized GIC administrators only.",
    "",
    ...commands,
  ].join("\n"));
}

async function handleAuth(ctx) {
  const session = await getSession(ctx.from.id);

  if (isAuthenticated(session)) {
    await ctx.reply(`✅ You are already signed in. Session expires: ${formatDateTime(session.expiresAt)}`);
    return;
  }
  if (isLocked(session)) {
    await ctx.reply(`🔒 Too many failed attempts. Please try again in about ${LOCK_MINUTES} minutes.`);
    return;
  }

  await beginAuth({ userId: ctx.from.id, chatId: ctx.chat.id });
  await ctx.reply("🔐 Admin sign-in\nSend the admin email address. Do not send credentials in a group chat.");
}

async function handleLogout(ctx) {
  await endSession(ctx.from.id);
  await ctx.reply("👋 Signed out. Use /auth when you need to sign in again.");
}

async function handleStatus(ctx) {
  const session = await getSession(ctx.from.id);
  if (isAuthenticated(session) && String(session.chatId) === String(ctx.chat.id)) {
    await ctx.reply(`✅ Signed in. Session expires: ${formatDateTime(session.expiresAt)}`);
    return;
  }
  if (isLocked(session)) {
    await ctx.reply(`🔒 Authentication is temporarily locked. Try again in about ${LOCK_MINUTES} minutes.`);
    return;
  }
  await ctx.reply(isAuthInProgress(session)
    ? "🔐 Authentication is in progress. Continue in this private chat, or send /logout to cancel."
    : "🔒 Not signed in. Send /auth to sign in.");
}

async function handleText(ctx) {
  const text = ctx.message?.text ?? "";
  if (text.startsWith("/")) {
    await ctx.reply("Unknown command. Send /start to see the available commands.");
    return;
  }

  const userId = ctx.from.id;
  const session = await getSession(userId);

  if (!isAuthInProgress(session)) {
    await ctx.reply("Send /start to see the available commands.");
    return;
  }

  if (isLocked(session)) {
    await deleteQuietly(ctx);
    await ctx.reply(`🔒 Too many failed attempts. Try again in about ${LOCK_MINUTES} minutes.`);
    return;
  }

  if (session.authState === "awaiting_email") {
    await recordEmail({ userId, matched: checkAdminEmail(text) });
    await deleteQuietly(ctx);
    await ctx.reply("🔑 Now send the admin password. I will try to delete your message for privacy.");
    return;
  }

  // Always compare the password, even if email did not match, to reduce timing leaks.
  const passwordMatched = await checkAdminPassword(text);
  const emailMatched = Boolean(session.emailMatched);
  await deleteQuietly(ctx);

  if (!emailMatched || !passwordMatched) {
    // Keep the existing session API contract: registerFailure takes an object.
    await registerFailure({ userId });
    const refreshed = await getSession(userId);
    if (isLocked(refreshed)) {
      await ctx.reply(`⛔ Sign-in failed too many times. Try again in about ${LOCK_MINUTES} minutes.`);
    } else {
      await ctx.reply("⛔ The credentials were not accepted. Send /auth to start again.");
    }
    return;
  }

  // Keep the existing session API contract and honor its configured lifetime.
  const { TELEGRAM_SESSION_HOURS } = getTelegramEnv();
  await completeAuth({
    userId,
    chatId: ctx.chat.id,
    hours: TELEGRAM_SESSION_HOURS,
  });
  const authenticated = await getSession(userId);
  await ctx.reply(`✅ Authentication successful. Session expires: ${formatDateTime(authenticated?.expiresAt)}\n\nUse /newstudents or /allstudents to export PDF reports.`);
}

async function sendStudentListPdf(ctx, kind) {
  if (!(await requireAuth(ctx))) return;

  const label = kind === "new" ? "new student inquiries" : "all student inquiries";
  try {
    const records = kind === "new" ? await listNewInquiries() : await listAllInquiries();

    if (!records.length) {
      await ctx.reply(kind === "new"
        ? "✅ No new student inquiries were found."
        : "ℹ️ There are no student inquiries to export yet.");
      return;
    }

    await runWithMinuteProgress({
      sendProgress: async (minute) => {
        await ctx.telegram.sendMessage(ctx.chat.id, progressMessage(minute));
      },
      work: async ({ signal }) => {
        const pdf = await createStudentListPdf(records, { kind, signal });
        if (pdf.length > MAX_PDF_BYTES) throw new Error("The PDF is too large to send through Telegram.");

        const filename = studentListPdfFilename(kind);
        await ctx.replyWithDocument(
          { source: pdf, filename },
          {
            caption: `GIC ${kind === "new" ? "new student" : "all student"} report · ${records.length} records · 20 records per page`,
          },
        );

        // A new inquiry is counted only after Telegram confirms document delivery.
        if (kind === "new") {
          try {
            await recordNewInquiryExport(records.map((record) => record._id));
          } catch (error) {
            logger.error("PDF was sent but new-export tracking failed", {
              action: "telegram_pdf_export_tracking",
              count: records.length,
              error,
            });
            await ctx.reply("⚠ The PDF was delivered, but I could not update the export counter. Please notify the system administrator.");
          }
        }
        return { count: records.length, filename };
      },
    });
  } catch (error) {
    logger.error("student PDF export failed", {
      action: "telegram_pdf_export",
      kind,
      telegramUserId: ctx.from?.id,
      error,
    });

    if (error?.code === "PDF_JOB_TIMEOUT") {
      await ctx.reply("😅 Sorry, the PDF job took too long and was stopped safely. Please try again; no export counter was advanced unless the PDF was delivered.");
      return;
    }

    await ctx.reply(`⚠ I couldn't create or send the PDF for ${label}. Please try again. If this repeats, contact the system administrator.`);
  }
}

export function registerHandlers(bot) {
  bot.use(guard);

  bot.start(handleStart);
  bot.command("auth", handleAuth);
  bot.command("logout", handleLogout);
  bot.command("status", handleStatus);
  bot.command("newstudents", (ctx) => sendStudentListPdf(ctx, "new"));
  bot.command("allstudents", (ctx) => sendStudentListPdf(ctx, "all"));
  bot.command("cancel", handleLogout);
  bot.on("text", handleText);

  // Keep bot commands private even if the configured allowlist is accidentally empty.
  const allowedUserIds = getTelegramEnv().TELEGRAM_ALLOWED_USER_IDS;
  const hasAllowedUsers = Array.isArray(allowedUserIds)
    ? allowedUserIds.length > 0
    : Boolean(String(allowedUserIds || "").trim());

  if (!hasAllowedUsers) {
    logger.warn("TELEGRAM_ALLOWED_USER_IDS is empty; all Telegram bot users will be denied", {
      action: "telegram_configuration",
    });
  }
}
