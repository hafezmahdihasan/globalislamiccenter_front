import { getTelegramEnv } from "@/lib/config/env";

function getToken() {
  const env = getTelegramEnv();
  const token = env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured.");
  return token;
}

export function getAdminChatIds() {
  const value = getTelegramEnv().TELEGRAM_ADMIN_CHAT_IDS;
  const values = Array.isArray(value) ? value : String(value || "").split(",");
  return [...new Set(values.map((item) => String(item).trim()).filter(Boolean))];
}

function combinedSignal(signal, timeoutMs) {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  return signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;
}

async function parseTelegramResponse(response, method) {
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error(`Telegram ${method} returned a non-JSON response (HTTP ${response.status}).`);
  }
  if (!response.ok || !result?.ok) {
    const description = typeof result?.description === "string" ? result.description : `HTTP ${response.status}`;
    throw new Error(`Telegram ${method} failed: ${description}`);
  }
  return result.result;
}

export async function sendTelegramText(chatId, text, { signal, timeoutMs = 15_000 } = {}) {
  const token = getToken();
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: String(chatId),
      text: String(text).slice(0, 4096),
      disable_web_page_preview: true,
    }),
    signal: combinedSignal(signal, timeoutMs),
  });
  return parseTelegramResponse(response, "sendMessage");
}

export async function sendTelegramPdf(chatId, buffer, filename, { caption, signal, timeoutMs = 90_000 } = {}) {
  const token = getToken();
  const form = new FormData();
  form.set("chat_id", String(chatId));
  if (caption) form.set("caption", String(caption).slice(0, 1024));
  form.set("document", new Blob([buffer], { type: "application/pdf" }), filename);

  const response = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
    method: "POST",
    body: form,
    signal: combinedSignal(signal, timeoutMs),
  });
  return parseTelegramResponse(response, "sendDocument");
}
