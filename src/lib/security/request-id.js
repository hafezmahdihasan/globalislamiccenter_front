import { randomUUID } from "node:crypto";

/** Reuse a sane incoming X-Request-Id, otherwise generate one. */
export function getRequestId(request) {
  const incoming = request?.headers?.get("x-request-id");
  if (incoming && /^[A-Za-z0-9_-]{8,64}$/.test(incoming)) return incoming;
  return randomUUID();
}
