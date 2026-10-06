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
  buildStudentsCsv,
  csvByteLength,
  exportFilename,
  MAX_EXPORT_BYTES,
} from "@/lib/students/export";
import { formatDateTime } from "@/lib/utils/format";
import { logger } from "@/lib/utils/logger";

const COMMANDS_SIGNED_OUT = [
  "/auth — sign in",
  "/status — session status",
];
const COMMANDS_SIGNED_IN = [
  "/newstudents — CSV of new inquiries",
  "/allstudents — CSV of every inquiry",
  "/status — session status",
  "/logout — end session",
];

const deleteQuietly = (ctx) => ctx.deleteMessage().catch(() => {});

/**
 * Runs on EVERY update before any handler. Ignores non-private chats and
 * refuses anyone not on the TELEGRAM_ALLOWED_USER_IDS allowlist.
 */
async function guard(ctx, next) {
  const userId = ctx.from?.id;
  if (!userId || ctx.chat?.type !== "private") return undefined;

  if (!isAllowedUser(userId)) {
    logger.warn("telegram user not allowed", { action: "telegram_guard", telegramUserId: userId });
    if (ctx.message) await ctx.reply("⛔ You are not authorized to use this bot.");
    return undefined;
  }
  return next();
}

/** Re-checks the stored session for every protected command. */
async function requireAuth(ctx) {
  const session = await getSession(ctx.from.id);
  if (!isAuthenticated(session) || session.chatId !== ctx.chat.id) {
    await ctx.reply("🔒 Please sign in first with /auth.");
    return null;
  }
  await touchSession(ctx.from.id);
  return session;
}

async function handleStart(ctx) {
  const session = await getSession(ctx.from.id);
  const signedIn = isAuthenticated(session);
  const commands = signedIn ? COMMANDS_SIGNED_IN : COMMANDS_SIGNED_OUT;
  await ctx.reply(
    ["👋 GIC Admin Bot", "This bot is for GIC administrators only.", "", ...commands].join("\n"),
  );
}

async function handleAuth(ctx) {
  const session = await getSession(ctx.from.id);

  if (isAuthenticated(session)) {
    await ctx.reply(`✅ You are already signed in. Session expires: ${formatDateTime(session.expiresAt)}`);
    return;
  }
  if (isLocked(session)) {
    await ctx.reply("🔒 Too many failed attempts. Please try again later.");
    return;
  }

  await beginAuth({ userId: ctx.from.id, chatId: ctx.chat.id });
  await ctx.reply("🔐 Admin sign-in\nSend the admin email address.");
}

async function handleLogout(ctx) {
  await endSession(ctx.from.id);
  await ctx.reply("👋 Signed out.");
}

async function handleStatus(ctx) {
  const session = await getSession(ctx.from.id);
  if (isAuthenticated(session)) {
    await ctx.reply(`✅ Signed in. Session expires: ${formatDateTime(session.expiresAt)}`);
  } else {
    await ctx.reply("🔒 Not signed in. Send /auth to sign in.");
  }
}

async function handleText(ctx) {
  const text = ctx.message?.text ?? "";

  // Unregistered slash commands must never be consumed as an email/password.
  if (text.startsWith("/")) {
    await ctx.reply("Unknown command. Send /start to see what is available.");
    return;
  }

  const userId = ctx.from.id;
  const session = await getSession(userId);

  if (!isAuthInProgress(session)) {
    await ctx.reply("Send /start to see available commands.");
    return;
  }

  if (isLocked(session)) {
    await deleteQuietly(ctx);
    await ctx.reply("🔒 Too many failed attempts. Please try again later.");
    return;
  }

  if (session.authState === "awaiting_email") {
    await recordEmail({ userId, matched: checkAdminEmail(text) });
    await deleteQuietly(ctx);
    await ctx.reply("🔑 Now send the admin password. I will try to delete your message.");
    return;
  }

  // awaiting_password. Always run the hash comparison so timing does not
  // reveal whether the email step matched.
  await deleteQuietly(ctx);
  const passwordOk = await checkAdminPassword(text);

  if (session.emailMatched && passwordOk) {
    const { TELEGRAM_SESSION_HOURS } = getTelegramEnv();
    await completeAuth({ userId, chatId: ctx.chat.id, hours: TELEGRAM_SESSION_HOURS });
    logger.info("telegram admin signed in", { action: "telegram_auth", telegramUserId: userId });
    await ctx.reply(`✅ Signed in. Session valid for ${TELEGRAM_SESSION_HOURS} hours.\n\n${COMMANDS_SIGNED_IN.join("\n")}`);
    return;
  }

  const failure = await registerFailure({ userId });
  logger.warn("telegram admin sign-in failed", {
    action: "telegram_auth",
    telegramUserId: userId,
    locked: failure.locked,
  });
  if (failure.locked) {
    await ctx.reply(`🔒 Too many failed attempts. Sign-in is locked for ${LOCK_MINUTES} minutes.`);
  } else {
    await ctx.reply("❌ Authentication failed. Send /auth to try again.");
  }
}

async function sendCsv(ctx, { kind, rows, caption }) {
  const csv = buildStudentsCsv(rows);
  const bytes = csvByteLength(csv);

  if (bytes > MAX_EXPORT_BYTES) {
    await ctx.reply(
      `⚠️ This export is too large to send through Telegram (${(bytes / 1048576).toFixed(1)} MB). Nothing was changed.`,
    );
    return false;
  }

  await ctx.replyWithDocument(
    { source: Buffer.from(csv, "utf8"), filename: exportFilename(kind) },
    { caption },
  );
  return true;
}

async function handleNewStudents(ctx) {
  const session = await requireAuth(ctx);
  if (!session) return;

  let rows;
  try {
    rows = await listNewInquiries();
  } catch (error) {
    logger.error("could not load new students", { action: "export_new", error });
    await ctx.reply("⚠️ Could not load students right now. Please try again.");
    return;
  }

  if (rows.length === 0) {
    await ctx.reply("✅ No new student submissions found.");
    return;
  }

  let delivered = false;
  try {
    delivered = await sendCsv(ctx, {
      kind: "new-students",
      rows,
      caption: `📄 New student inquiries: ${rows.length} (newest first)`,
    });
  } catch (error) {
    logger.error("new students export failed", { action: "export_new", count: rows.length, error });
    await ctx.reply("⚠️ Export failed. Nothing was marked as exported.");
    return;
  }
  if (!delivered) return;

  // Counters move only AFTER Telegram accepted the file.
  try {
    await recordNewInquiryExport(rows.map((row) => row._id));
  } catch (error) {
    logger.error("could not update export counters", { action: "export_new", error });
    await ctx.reply("⚠️ The file was sent, but export counters could not be updated, so these students may appear as new again.");
    return;
  }
  logger.info("new students exported", { action: "export_new", count: rows.length, telegramUserId: ctx.from.id });
}

async function handleAllStudents(ctx) {
  const session = await requireAuth(ctx);
  if (!session) return;

  let rows;
  try {
    rows = await listAllInquiries();
  } catch (error) {
    logger.error("could not load all students", { action: "export_all", error });
    await ctx.reply("⚠️ Could not load students right now. Please try again.");
    return;
  }

  if (rows.length === 0) {
    await ctx.reply("No student submissions yet.");
    return;
  }

  try {
    await sendCsv(ctx, {
      kind: "all-students",
      rows,
      caption: `📄 All student inquiries: ${rows.length} (newest first)`,
    });
    logger.info("all students exported", { action: "export_all", count: rows.length, telegramUserId: ctx.from.id });
  } catch (error) {
    logger.error("all students export failed", { action: "export_all", count: rows.length, error });
    await ctx.reply("⚠️ Export failed. Please try again.");
  }
}

export function registerHandlers(bot) {
  bot.use(guard);
  bot.start(handleStart);
  bot.command("auth", handleAuth);
  bot.command("logout", handleLogout);
  bot.command("status", handleStatus);
  bot.command("newstudents", handleNewStudents);
  bot.command("allstudents", handleAllStudents);
  bot.on("text", handleText);
}
