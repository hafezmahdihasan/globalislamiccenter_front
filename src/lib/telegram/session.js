import TelegramAdminSession from "@/models/TelegramAdminSession";

export const AUTH_STEP_MINUTES = 10;
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCK_MINUTES = 15;

const minutesFromNow = (minutes) => new Date(Date.now() + minutes * 60 * 1000);
const hoursFromNow = (hours) => new Date(Date.now() + hours * 60 * 60 * 1000);

export function getSession(userId) {
  return TelegramAdminSession.findOne({ telegramUserId: userId }).lean();
}

export function isAuthenticated(session) {
  return Boolean(
    session &&
      session.authenticated === true &&
      session.authState === "authenticated" &&
      session.expiresAt &&
      new Date(session.expiresAt) > new Date(),
  );
}

export function isAuthInProgress(session) {
  return Boolean(
    session &&
      (session.authState === "awaiting_email" || session.authState === "awaiting_password") &&
      session.expiresAt &&
      new Date(session.expiresAt) > new Date(),
  );
}

export function isLocked(session) {
  return Boolean(session?.lockedUntil && new Date(session.lockedUntil) > new Date());
}

export function beginAuth({ userId, chatId }) {
  return TelegramAdminSession.findOneAndUpdate(
    { telegramUserId: userId },
    {
      $set: {
        chatId,
        authState: "awaiting_email",
        authenticated: false,
        emailMatched: false,
        expiresAt: minutesFromNow(AUTH_STEP_MINUTES),
        lastActivityAt: new Date(),
      },
      $setOnInsert: { failedAttempts: 0 },
    },
    { upsert: true, new: true },
  ).lean();
}

export function recordEmail({ userId, matched }) {
  return TelegramAdminSession.updateOne(
    { telegramUserId: userId, authState: "awaiting_email" },
    {
      $set: {
        emailMatched: Boolean(matched),
        authState: "awaiting_password",
        expiresAt: minutesFromNow(AUTH_STEP_MINUTES),
        lastActivityAt: new Date(),
      },
    },
  );
}

export function completeAuth({ userId, chatId, hours }) {
  const now = new Date();
  return TelegramAdminSession.updateOne(
    { telegramUserId: userId },
    {
      $set: {
        chatId,
        authState: "authenticated",
        authenticated: true,
        emailMatched: false,
        failedAttempts: 0,
        lockedUntil: null,
        authenticatedAt: now,
        expiresAt: hoursFromNow(hours),
        lastActivityAt: now,
      },
    },
    { upsert: true },
  );
}

/** Returns { locked, lockedUntil } or { locked: false, attemptsLeft }. */
export async function registerFailure({ userId }) {
  const updated = await TelegramAdminSession.findOneAndUpdate(
    { telegramUserId: userId },
    {
      $inc: { failedAttempts: 1 },
      $set: {
        authState: "idle",
        authenticated: false,
        emailMatched: false,
        lastActivityAt: new Date(),
      },
    },
    { upsert: true, new: true },
  ).lean();

  if (updated.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    const lockedUntil = minutesFromNow(LOCK_MINUTES);
    await TelegramAdminSession.updateOne(
      { telegramUserId: userId },
      { $set: { lockedUntil, failedAttempts: 0 } },
    );
    return { locked: true, lockedUntil };
  }

  return { locked: false, attemptsLeft: MAX_FAILED_ATTEMPTS - updated.failedAttempts };
}

export function endSession(userId) {
  return TelegramAdminSession.updateOne(
    { telegramUserId: userId },
    {
      $set: {
        authState: "idle",
        authenticated: false,
        emailMatched: false,
        authenticatedAt: null,
        expiresAt: new Date(),
      },
    },
  );
}

export function touchSession(userId) {
  return TelegramAdminSession.updateOne(
    { telegramUserId: userId },
    { $set: { lastActivityAt: new Date() } },
  );
}
