import { getRecaptchaEnv } from "@/lib/config/env";
import { AppError } from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";

const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

const stripWww = (host) => host.replace(/^www\./i, "").toLowerCase();

/**
 * Verify a reCAPTCHA v3 token with Google.
 * Checks: success flag, expected action, score threshold, and (in
 * production) that the token was issued for our hostname.
 *
 * Fails closed: if Google cannot be reached, the submission is refused.
 * The browser only ever sees a generic message; details go to the log.
 */
export async function verifyRecaptcha({ token, expectedAction, ip, requestId }) {
  const { RECAPTCHA_SECRET_KEY, RECAPTCHA_MIN_SCORE, NEXT_PUBLIC_SITE_URL } = getRecaptchaEnv();

  const body = new URLSearchParams({ secret: RECAPTCHA_SECRET_KEY, response: token });
  if (ip && ip !== "unknown") body.set("remoteip", ip);

  let result;
  try {
    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`siteverify responded with HTTP ${response.status}`);
    result = await response.json();
  } catch (cause) {
    throw new AppError("RECAPTCHA_FAILED", {
      status: 503,
      publicMessage: "Security verification is unavailable. Please try again shortly.",
      cause,
    });
  }

  const reasons = [];
  if (!result?.success) reasons.push("not-success");
  if (result?.action !== expectedAction) reasons.push("action-mismatch");
  if (typeof result?.score !== "number" || result.score < RECAPTCHA_MIN_SCORE) {
    reasons.push("low-score");
  }

  if (process.env.NODE_ENV === "production" && result?.hostname) {
    const expectedHost = stripWww(new URL(NEXT_PUBLIC_SITE_URL).hostname);
    if (stripWww(result.hostname) !== expectedHost) reasons.push("hostname-mismatch");
  }

  if (reasons.length > 0) {
    logger.warn("recaptcha rejected", {
      requestId,
      action: "recaptcha_verify",
      reasons,
      score: result?.score,
      errorCodes: result?.["error-codes"],
    });
    throw new AppError("RECAPTCHA_FAILED");
  }

  return { score: result.score };
}
