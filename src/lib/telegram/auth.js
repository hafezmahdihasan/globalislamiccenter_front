import bcrypt from "bcryptjs";
import { getTelegramEnv } from "@/lib/config/env";
import { safeEqual } from "@/lib/security/compare";

const MAX_INPUT_LENGTH = 200;

/** Allowlist check. Evaluated on every incoming update, server-side. */
export function isAllowedUser(userId) {
  return getTelegramEnv().TELEGRAM_ALLOWED_USER_IDS.includes(String(userId));
}

export function checkAdminEmail(input) {
  const expected = getTelegramEnv().TELEGRAM_ADMIN_EMAIL.trim().toLowerCase();
  const given = String(input ?? "").slice(0, MAX_INPUT_LENGTH).trim().toLowerCase();
  return safeEqual(given, expected);
}

/** The password is only ever compared against a bcrypt hash from the environment. */
export async function checkAdminPassword(input) {
  const given = String(input ?? "").slice(0, MAX_INPUT_LENGTH);
  return bcrypt.compare(given, getTelegramEnv().TELEGRAM_ADMIN_PASSWORD_HASH);
}
