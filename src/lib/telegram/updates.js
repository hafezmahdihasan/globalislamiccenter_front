import TelegramUpdate from "@/models/TelegramUpdate";

const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Claim a Telegram update exactly once. Returns false if it was already
 * claimed (a retry/duplicate delivery), so the caller can skip processing.
 */
export async function claimUpdate(updateId) {
  try {
    await TelegramUpdate.create({
      updateId,
      status: "processing",
      expiresAt: new Date(Date.now() + RETENTION_MS),
    });
    return true;
  } catch (error) {
    if (error?.code === 11000) return false;
    throw error;
  }
}

export function finishUpdate(updateId, status) {
  return TelegramUpdate.updateOne(
    { updateId },
    { $set: { status, processedAt: new Date() } },
  );
}
