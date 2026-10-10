import { after } from "next/server";
import { submitStudentInquiry } from "@/lib/students/service";
import { getClientIp } from "@/lib/security/ip";
import { getRequestId } from "@/lib/security/request-id";
import { AppError } from "@/lib/utils/errors";
import { ok, handleRouteError } from "@/lib/utils/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 20 * 1024;

// Thin handler: parse -> call service -> format response.
export async function POST(request) {
  const requestId = getRequestId(request);

  try {
    const declaredLength = Number(request.headers.get("content-length") ?? 0);
    if (declaredLength > MAX_BODY_BYTES) {
      throw new AppError("VALIDATION_ERROR", { status: 413, publicMessage: "Request is too large." });
    }

    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) {
      throw new AppError("VALIDATION_ERROR", { status: 413, publicMessage: "Request is too large." });
    }

    let body;
    try {
      body = JSON.parse(text);
    } catch {
      throw new AppError("VALIDATION_ERROR", { publicMessage: "Invalid request." });
    }

    const { submissionId, runNotification } = await submitStudentInquiry(body, {
      ip: getClientIp(request),
      requestId,
    });
    after(runNotification);
    return ok({ submissionId }, "Submission received successfully.", 201);
  } catch (error) {
    return handleRouteError(error, { requestId, action: "student_inquiry" });
  }
}
