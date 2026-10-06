import { ok } from "@/lib/utils/api-response";

export const dynamic = "force-dynamic";

// Liveness only. Deliberately does not touch the database or reveal config.
export function GET() {
  return ok({ status: "ok", time: new Date().toISOString() }, "OK");
}
