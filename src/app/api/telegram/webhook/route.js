import { NextResponse } from "next/server";
import { getBot } from "@/lib/telegram/bot";
import { claimUpdate, finishUpdate } from "@/lib/telegram/updates";
import { getTelegramEnv } from "@/lib/config/env";
import { connectDB } from "@/lib/db/mongoose";
import { safeEqual } from "@/lib/security/compare";
import { getRequestId } from "@/lib/security/request-id";
import { logger } from "@/lib/utils/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Exports can take a few seconds on slower databases.
export const maxDuration = 30;

const json = (body, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request) {
  const requestId = getRequestId(request);

  try {
    // 1. Telegram echoes the secret we registered with setWebhook.
    const { TELEGRAM_WEBHOOK_SECRET } = getTelegramEnv();
    const provided = request.headers.get("x-telegram-bot-api-secret-token");
    if (!safeEqual(provided, TELEGRAM_WEBHOOK_SECRET)) {
      logger.warn("telegram webhook rejected", { requestId, action: "telegram_webhook" });
      return json({ ok: false }, 401);
    }

    let update;
    try {
      update = await request.json();
    } catch {
      return json({ ok: false }, 400);
    }
    if (!update || !Number.isSafeInteger(update.update_id)) {
      return json({ ok: false }, 400);
    }

    await connectDB();

    // 2. Idempotency: acknowledge retries without reprocessing them.
    const claimed = await claimUpdate(update.update_id);
    if (!claimed) {
      logger.info("duplicate telegram update ignored", {
        requestId,
        action: "telegram_webhook",
        updateId: update.update_id,
      });
      return json({ ok: true, duplicate: true });
    }

    // 3. Hand off to Telegraf. Handler errors are caught inside the bot, but
    // be defensive: we always answer 200 once the update is claimed so
    // Telegram does not retry and double-run a command.
    let status = "done";
    try {
      await getBot().handleUpdate(update);
    } catch (error) {
      status = "failed";
      logger.error("telegram update failed", {
        requestId,
        action: "telegram_webhook",
        updateId: update.update_id,
        error,
      });
    }

    await finishUpdate(update.update_id, status).catch((error) =>
      logger.error("could not finalize telegram update", {
        requestId,
        action: "telegram_webhook",
        updateId: update.update_id,
        error,
      }),
    );

    return json({ ok: true });
  } catch (error) {
    logger.error("telegram webhook error", { requestId, action: "telegram_webhook", error });
    return json({ ok: false }, 500);
  }
}
