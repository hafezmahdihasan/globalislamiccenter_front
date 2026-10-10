# Compatibility with the current GIC Telegram integration

This overlay was adapted to the session and notification APIs in the supplied existing code. Keep these existing files unless you independently need to change them:

- `src/lib/telegram/auth.js`
- `src/lib/telegram/session.js`
- `src/lib/telegram/bot.js`
- `src/lib/telegram/updates.js`
- `src/app/api/telegram/webhook/route.js` (only add the route segment config; preserve webhook-secret verification and idempotency)

The PDF-aware `commands.js` intentionally calls the existing session APIs with the expected signatures:

```js
await registerFailure({ userId });

const { TELEGRAM_SESSION_HOURS } = getTelegramEnv();
await completeAuth({ userId, chatId: ctx.chat.id, hours: TELEGRAM_SESSION_HOURS });
```

The PDF notification module continues to persist the same tracking fields as the old text notification implementation:

- `telegramNotificationStatus` (`sent` or `failed`)
- `lastTelegramNotificationAt`
- `telegramNotificationAttempts`

The existing `getBot()`/Telegraf webhook architecture is retained for bot updates. The PDF notification sender uses the Telegram Bot API `sendDocument` endpoint with Node's built-in `fetch`/`FormData`, so it can send binary PDF buffers without turning the public route into a Telegraf long-polling bot.

## Route configuration

Add to both existing route files without replacing their handlers:

```js
export const runtime = "nodejs";
export const maxDuration = 300;
```

- `src/app/api/student-inquiries/route.js`
- `src/app/api/telegram/webhook/route.js`

`after()` work runs after the response but is still bounded by the host's maximum function duration; it is not a durable background queue.
