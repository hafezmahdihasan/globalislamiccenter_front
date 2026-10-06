import { createHash } from "node:crypto";
import RateLimitHit from "@/models/RateLimitHit";

export const SUBMISSION_LIMIT = 5;
export const SUBMISSION_WINDOW_SECONDS = 15 * 60;

/**
 * MongoDB-backed sliding-window limiter (no Redis needed for the MVP).
 * Each allowed attempt is recorded; once `limit` attempts exist inside the
 * window, further attempts are refused until the oldest one ages out.
 *
 * Assumes the database is already connected. Concurrent requests can exceed
 * the limit by a small margin, which is acceptable for an MVP.
 */
export async function checkRateLimit({
  scope,
  identifier,
  limit = SUBMISSION_LIMIT,
  windowSeconds = SUBMISSION_WINDOW_SECONDS,
}) {
  const key = createHash("sha256").update(`${scope}:${identifier}`).digest("hex");
  const now = Date.now();
  const since = new Date(now - windowSeconds * 1000);

  const count = await RateLimitHit.countDocuments({ key, createdAt: { $gt: since } });

  if (count >= limit) {
    const oldest = await RateLimitHit.findOne({ key, createdAt: { $gt: since } })
      .sort({ createdAt: 1 })
      .lean();
    const retryAfterSeconds = oldest
      ? Math.max(1, Math.ceil((oldest.createdAt.getTime() + windowSeconds * 1000 - now) / 1000))
      : windowSeconds;
    return { allowed: false, retryAfterSeconds };
  }

  await RateLimitHit.create({ key });
  return { allowed: true, remaining: limit - count - 1 };
}
