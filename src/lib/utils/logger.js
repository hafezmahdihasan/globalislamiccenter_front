/**
 * Small structured logger (server-side only).
 *
 * - One JSON line per entry.
 * - Redacts sensitive keys and Telegram bot tokens embedded in strings
 *   (network errors from the Telegram client include the request URL).
 * - Never pass whole student payloads; log IDs and counts instead.
 */

const LEVEL_ORDER = { debug: 10, info: 20, warn: 30, error: 40 };
const DEFAULT_LEVEL = process.env.NODE_ENV === "production" ? "info" : "debug";
const MIN_LEVEL = LEVEL_ORDER[process.env.LOG_LEVEL] ?? LEVEL_ORDER[DEFAULT_LEVEL];

const SENSITIVE_KEY = /pass(word)?|token|secret|authorization|cookie|hash|api[-_]?key/i;
const BOT_TOKEN_IN_URL = /bot\d+:[A-Za-z0-9_-]+/g;
const MAX_STRING = 500;

function scrubString(value) {
  const cleaned = value.replace(BOT_TOKEN_IN_URL, "bot[redacted]");
  return cleaned.length > MAX_STRING ? `${cleaned.slice(0, MAX_STRING)}…` : cleaned;
}

function sanitize(value, depth = 0) {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: scrubString(value.message ?? ""),
      ...(value.code !== undefined ? { code: String(value.code) } : {}),
      ...(process.env.NODE_ENV !== "production" && value.stack
        ? { stack: scrubString(value.stack) }
        : {}),
    };
  }
  if (typeof value === "string") return scrubString(value);
  if (value === null || typeof value !== "object") return value;
  if (depth >= 3) return "[truncated]";
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => sanitize(item, depth + 1));
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      SENSITIVE_KEY.test(key) ? "[redacted]" : sanitize(item, depth + 1),
    ]),
  );
}

function write(level, message, meta = {}) {
  if (LEVEL_ORDER[level] < MIN_LEVEL) return;
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...sanitize(meta),
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (message, meta) => write("debug", message, meta),
  info: (message, meta) => write("info", message, meta),
  warn: (message, meta) => write("warn", message, meta),
  error: (message, meta) => write("error", message, meta),
};
