import { NextResponse } from "next/server";
import { AppError } from "./errors";
import { logger } from "./logger";

const NO_STORE = { "Cache-Control": "no-store" };

/** Success envelope: { success: true, data, message } */
export function ok(data = {}, message = "OK", status = 200) {
  return NextResponse.json({ success: true, data, message }, { status, headers: NO_STORE });
}

/** Error envelope: { success: false, message, error, ...extra } */
export function fail(code, message, status, extra = {}, headers = {}) {
  return NextResponse.json(
    { success: false, message, error: code, ...extra },
    { status, headers: { ...NO_STORE, ...headers } },
  );
}

/**
 * Convert any thrown value into a safe response. Unknown errors become a
 * generic INTERNAL_ERROR; their details are logged, never returned.
 */
export function handleRouteError(err, { requestId, action } = {}) {
  const headers = requestId ? { "X-Request-Id": requestId } : {};

  if (err instanceof AppError) {
    const meta = { requestId, action, code: err.code, status: err.status, error: err.cause ?? undefined };
    if (err.status >= 500) logger.error("request failed", meta);
    else logger.warn("request rejected", meta);

    if (err.retryAfterSeconds) headers["Retry-After"] = String(err.retryAfterSeconds);
    return fail(err.code, err.message, err.status, err.fields ? { fields: err.fields } : {}, headers);
  }

  logger.error("unhandled route error", { requestId, action, error: err });
  return fail("INTERNAL_ERROR", "Something went wrong. Please try again later.", 500, {}, headers);
}
