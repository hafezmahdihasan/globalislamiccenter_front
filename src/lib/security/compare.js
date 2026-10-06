import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Constant-time string comparison. Both inputs are hashed first so length
 * differences do not leak and timingSafeEqual always gets equal-size buffers.
 */
export function safeEqual(a, b) {
  const left = createHash("sha256")
    .update(String(a ?? ""))
    .digest();
  const right = createHash("sha256")
    .update(String(b ?? ""))
    .digest();
  return timingSafeEqual(left, right);
}
