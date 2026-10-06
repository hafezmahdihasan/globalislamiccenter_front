/**
 * Predictable application errors.
 *
 * `message` is ALWAYS safe to show to the public. Internal detail (database
 * errors, upstream responses, stack traces) goes in `cause` and is only ever
 * written to server logs.
 */

export const ErrorCodes = Object.freeze({
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  RATE_LIMITED: "RATE_LIMITED",
  RECAPTCHA_FAILED: "RECAPTCHA_FAILED",
  REQUEST_REJECTED: "REQUEST_REJECTED",
  DATABASE_ERROR: "DATABASE_ERROR",
  TELEGRAM_ERROR: "TELEGRAM_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
});

const STATUS_BY_CODE = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  RECAPTCHA_FAILED: 403,
  REQUEST_REJECTED: 400,
  DATABASE_ERROR: 503,
  TELEGRAM_ERROR: 502,
  INTERNAL_ERROR: 500,
};

const DEFAULT_MESSAGES = {
  VALIDATION_ERROR: "Please check the form and try again.",
  UNAUTHORIZED: "Authentication required.",
  FORBIDDEN: "You do not have access to this resource.",
  NOT_FOUND: "Not found.",
  RATE_LIMITED: "Too many attempts. Please try again later.",
  RECAPTCHA_FAILED: "Security verification failed. Please try again.",
  REQUEST_REJECTED: "Unable to submit your inquiry.",
  DATABASE_ERROR: "Service temporarily unavailable. Please try again shortly.",
  TELEGRAM_ERROR: "Notification service error.",
  INTERNAL_ERROR: "Something went wrong. Please try again later.",
};

export class AppError extends Error {
  /**
   * @param {string} code One of ErrorCodes.
   * @param {object} [options]
   * @param {string} [options.publicMessage] Override the default safe message.
   * @param {number} [options.status] Override the default HTTP status.
   * @param {Record<string,string>} [options.fields] Per-field validation messages.
   * @param {unknown} [options.cause] Internal cause (logged, never returned).
   * @param {number} [options.retryAfterSeconds] Sent as Retry-After.
   */
  constructor(code, options = {}) {
    const { publicMessage, status, fields, cause, retryAfterSeconds } = options;
    super(publicMessage ?? DEFAULT_MESSAGES[code] ?? DEFAULT_MESSAGES.INTERNAL_ERROR, { cause });
    this.name = "AppError";
    this.code = code in STATUS_BY_CODE ? code : ErrorCodes.INTERNAL_ERROR;
    this.status = status ?? STATUS_BY_CODE[this.code];
    this.fields = fields;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}
