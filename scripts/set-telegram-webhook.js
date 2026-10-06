/**
 * Registers the Telegram webhook (with the secret token) and the bot's
 * command menu.
 *
 *   npm run telegram:webhook
 *
 * Reads TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_URL and TELEGRAM_WEBHOOK_SECRET
 * from the environment, falling back to .env.local / .env in the project root.
 * The bot token is never printed.
 */

const fs = require("node:fs");
const path = require("node:path");

function loadEnvFile(fileName) {
  const filePath = path.join(process.cwd(), fileName);
  if (!fs.existsSync(filePath)) return;

  for (const rawLine of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    value = value.replace(/\\\$/g, "$");

    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const WEBHOOK_PATH = "/api/telegram/webhook";

async function callTelegram(token, method, payload) {
  const response = await fetch(
    `https://api.telegram.org/bot${token}/${method}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  return response.json();
}

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const baseUrl = process.env.TELEGRAM_WEBHOOK_URL;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

  const missing = [
    ["TELEGRAM_BOT_TOKEN", token],
    ["TELEGRAM_WEBHOOK_URL", baseUrl],
    ["TELEGRAM_WEBHOOK_SECRET", secret],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    console.error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
    process.exit(1);
  }

  const target = baseUrl.replace(/\/+$/, "").endsWith(WEBHOOK_PATH)
    ? baseUrl.replace(/\/+$/, "")
    : `${baseUrl.replace(/\/+$/, "")}${WEBHOOK_PATH}`;

  if (!target.startsWith("https://")) {
    console.error("Telegram requires an https:// webhook URL.");
    process.exit(1);
  }

  const webhook = await callTelegram(token, "setWebhook", {
    url: target,
    secret_token: secret,
    allowed_updates: ["message"],
    drop_pending_updates: false,
  });
  if (!webhook.ok) {
    console.error("setWebhook failed:", webhook.description ?? "unknown error");
    process.exit(1);
  }
  console.log(`Webhook set: ${target}`);

  const commands = await callTelegram(token, "setMyCommands", {
    commands: [
      { command: "start", description: "Show available commands" },
      { command: "auth", description: "Sign in as admin" },
      { command: "status", description: "Show session status" },
      { command: "newstudents", description: "Export new inquiries (CSV)" },
      { command: "allstudents", description: "Export all inquiries (CSV)" },
      { command: "logout", description: "End admin session" },
    ],
  });
  console.log(
    commands.ok
      ? "Bot commands updated."
      : `setMyCommands failed: ${commands.description}`,
  );
}

main().catch((error) => {
  console.error("Request failed:", error.message);
  process.exit(1);
});
