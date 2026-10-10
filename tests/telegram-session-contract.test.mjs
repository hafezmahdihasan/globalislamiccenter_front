import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const commands = await readFile(new URL("../src/lib/telegram/commands.js", import.meta.url), "utf8");

test("PDF Telegram commands preserve the existing session helper signatures", () => {
  assert.match(commands, /registerFailure\(\{\s*userId\s*\}\)/);
  assert.match(commands, /completeAuth\(\{\s*userId,\s*chatId: ctx\.chat\.id,\s*hours: TELEGRAM_SESSION_HOURS,?\s*\}\)/);
  assert.match(commands, /const \{ TELEGRAM_SESSION_HOURS \} = getTelegramEnv\(\)/);
});

test("PDF exports replace CSV command language", () => {
  assert.match(commands, /PDF of new inquiries/);
  assert.match(commands, /PDF of every inquiry/);
  assert.doesNotMatch(commands, /buildStudentsCsv|csvByteLength|exportFilename\(/);
});
