/**
 * Centralized, lazily validated SERVER environment variables.
 *
 * IMPORTANT: import this module only from server code (route handlers,
 * services, scripts). Never import it from a Client Component. Public values
 * (NEXT_PUBLIC_*) live in src/config/site.js instead.
 *
 * Validation errors list variable NAMES and rules only, never values.
 */

import { z } from "zod";

const idList = (name) =>
  z
    .string({ required_error: `${name} is required` })
    .transform((value) =>
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    )
    .pipe(
      z
        .array(z.string().regex(/^-?\d+$/, `${name} must contain numeric IDs`))
        .min(1, `${name} must contain at least one ID`),
    );

const dbSchema = z.object({
  MONGODB_URI: z.string({ required_error: "MONGODB_URI is required" }).min(1),
});

const telegramSchema = z.object({
  TELEGRAM_BOT_TOKEN: z
    .string({ required_error: "TELEGRAM_BOT_TOKEN is required" })
    .min(10),
  TELEGRAM_WEBHOOK_SECRET: z
    .string({ required_error: "TELEGRAM_WEBHOOK_SECRET is required" })
    .regex(
      /^[A-Za-z0-9_-]{16,256}$/,
      "TELEGRAM_WEBHOOK_SECRET must be 16-256 chars of A-Z a-z 0-9 _ -",
    ),
  TELEGRAM_ALLOWED_USER_IDS: idList("TELEGRAM_ALLOWED_USER_IDS"),
  TELEGRAM_ADMIN_CHAT_IDS: idList("TELEGRAM_ADMIN_CHAT_IDS"),
  TELEGRAM_ADMIN_EMAIL: z
    .string({ required_error: "TELEGRAM_ADMIN_EMAIL is required" })
    .email("TELEGRAM_ADMIN_EMAIL must be an email address"),
  TELEGRAM_ADMIN_PASSWORD_HASH: z
    .string({ required_error: "TELEGRAM_ADMIN_PASSWORD_HASH is required" })
    .regex(
      /^\$2[aby]\$\d{2}\$.{53}$/,
      "TELEGRAM_ADMIN_PASSWORD_HASH must be a bcrypt hash (escape each $ as \\$ in .env files)",
    ),
  TELEGRAM_SESSION_HOURS: z.coerce.number().positive().max(72).default(8),
});

const recaptchaSchema = z.object({
  RECAPTCHA_SECRET_KEY: z
    .string({ required_error: "RECAPTCHA_SECRET_KEY is required" })
    .min(1),
  RECAPTCHA_MIN_SCORE: z.coerce.number().min(0).max(1).default(0.5),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
});

const cache = new Map();

function load(name, schema) {
  if (cache.has(name)) return cache.get(name);

  // Treat blank variables (e.g. "KEY=") as unset so defaults apply.
  const source = Object.fromEntries(
    Object.entries(process.env).filter(
      ([, value]) => typeof value === "string" && value !== "",
    ),
  );

  const result = schema.safeParse(source);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid ${name} environment configuration. ${problems}`);
  }

  cache.set(name, result.data);
  return result.data;
}

export const getDbEnv = () => load("database", dbSchema);
export const getTelegramEnv = () => load("telegram", telegramSchema);
export const getRecaptchaEnv = () => load("recaptcha", recaptchaSchema);
