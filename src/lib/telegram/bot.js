import { Telegraf } from "telegraf";
import { getTelegramEnv } from "@/lib/config/env";
import { registerHandlers } from "@/lib/telegram/commands";
import { logger } from "@/lib/utils/logger";

/**
 * Lazily creates one Telegraf instance per server process. We never call
 * bot.launch(): updates arrive through the webhook route and are passed to
 * bot.handleUpdate(). Authentication state lives in MongoDB, not in memory.
 */
export function getBot() {
  if (!globalThis.__gicBot) {
    const bot = new Telegraf(getTelegramEnv().TELEGRAM_BOT_TOKEN);

    registerHandlers(bot);

    bot.catch(async (error, ctx) => {
      logger.error("telegram handler error", {
        action: "telegram_handler",
        updateId: ctx?.update?.update_id,
        error,
      });
      try {
        await ctx.reply("⚠️ Something went wrong. Please try again.");
      } catch {
        // nothing more we can do
      }
    });

    globalThis.__gicBot = bot;
  }
  return globalThis.__gicBot;
}
