# GIC — Global Islamic Center (MVP)

Premium one-page website for an online Quran / Islamic education center, with a student inquiry form, MongoDB storage, and a Telegram admin bot that sends notifications and sends student reports as HTML files.

**100% JavaScript + JSX. No TypeScript.**

> **Status: source written, not yet built.** The environment this was authored in blocked npm, so `npm install`, `npm run build` and `npm run lint` have **not** been run. See [Verification status](#verification-status) before deploying.

## Stack

One Next.js 16 app (App Router + Route Handlers), React 19, Tailwind CSS v4, Framer Motion, Zod, Mongoose/MongoDB, Telegraf, bcryptjs, reCAPTCHA v3.

## Quick start

```bash
npm install
cp .env.example .env.local     # then fill in the values
npm run dev
```

Open http://localhost:3000.

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `MONGODB_URI` | server | MongoDB connection string |
| `TELEGRAM_BOT_TOKEN` | server | From @BotFather |
| `TELEGRAM_WEBHOOK_URL` | script | Public HTTPS base URL of the deployed site |
| `TELEGRAM_WEBHOOK_SECRET` | server | 16–256 chars of `A-Z a-z 0-9 _ -`; Telegram echoes it on every webhook call |
| `TELEGRAM_ALLOWED_USER_IDS` | server | Comma-separated numeric Telegram user IDs allowed to use the bot |
| `TELEGRAM_ADMIN_CHAT_IDS` | server | Comma-separated chat IDs that receive new-inquiry notifications |
| `TELEGRAM_ADMIN_EMAIL` | server | Email asked for by `/auth` |
| `TELEGRAM_ADMIN_PASSWORD_HASH` | server | **bcrypt hash** of the admin password (never the password) |
| `TELEGRAM_SESSION_HOURS` | server | Admin session lifetime, default 8 |
| `RECAPTCHA_SECRET_KEY` | server | reCAPTCHA **v3** secret |
| `RECAPTCHA_MIN_SCORE` | server | Default 0.5 |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | public | reCAPTCHA **v3** site key |
| `NEXT_PUBLIC_SITE_URL` | public | Canonical site URL (SEO, reCAPTCHA hostname check) |
| `NEXT_PUBLIC_WHATSAPP_URL` | public | e.g. `https://wa.me/8801XXXXXXXXX` (hides WhatsApp UI if empty) |
| `NEXT_PUBLIC_FACEBOOK_URL` | public | Footer link (hidden if empty) |
| `NEXT_PUBLIC_GIC_EMAIL` | public | Footer / contact email (hidden if empty) |

Server variables are validated lazily in `src/lib/config/env.js` and never reach the client bundle.

### Generating the admin password hash

```bash
node -e "console.log(require('bcryptjs').hashSync('YOUR_PASSWORD', 12))"
```

The hash contains `$` characters. In `.env.local`, Next.js treats `$` as variable expansion, so **escape every `$` as `\$`**:

```bash
node -e "console.log(require('bcryptjs').hashSync('YOUR_PASSWORD', 12))" | sed 's/\$/\\$/g'
```

In a hosting dashboard (Vercel, etc.) paste the raw hash with no escaping.

### Finding your Telegram IDs

Message @userinfobot to get your numeric user ID (use it for `TELEGRAM_ALLOWED_USER_IDS`). For a private notification chat, your user ID is also your chat ID.

## Telegram webhook setup

1. Deploy the site over HTTPS and set all environment variables there.
2. Set `TELEGRAM_WEBHOOK_URL` to the site's public URL.
3. Register the webhook and command menu (one time, and again if the URL or secret changes):

   ```bash
   npm run telegram:webhook
   ```

The script reads `.env.local` / `.env`, calls `setWebhook` with the secret token, and sets the bot's command menu. It never prints the bot token.

Webhook endpoint: `POST /api/telegram/webhook` (rejects any request without the correct secret header).

## Bot commands

| Command | Access | What it does |
|---|---|---|
| `/start` | allowlisted users | Shows commands for the current auth state |
| `/auth` | allowlisted users | Email, then password; 8-hour session |
| `/status` | allowlisted users | Shows whether the session is valid |
| `/logout` | allowlisted users | Ends the session |
| `/newstudents` | signed in | HTML table of new inquiries (20 per page); each student's export count +1 after a successful send, retired after 3 |
| `/allstudents` | signed in | HTML table of every inquiry (20 per page); never changes "new" state |

Security behaviors: user-ID allowlist checked on every update, password compared against a bcrypt hash, password message deleted from the chat, 5 failed attempts lock sign-in for 15 minutes, sessions stored in MongoDB, duplicate webhook deliveries ignored by `update_id`.

## API

`POST /api/student-inquiries` pipeline: parse → Zod validation → honeypot → rate limit (5 attempts / IP / 15 min, MongoDB-backed) → reCAPTCHA v3 → save → Telegram notification. A Telegram failure never rejects or loses a saved inquiry (status stored as `failed`).

`GET /api/health` returns liveness only.

Responses use `{ success, data, message }` / `{ success: false, message, error, fields? }`.

## MongoDB

Collections: `studentinquiries`, `telegramadminsessions`, `telegramupdates` (TTL, 7 days), `ratelimithits` (TTL, 1 hour). Indexes are created by Mongoose on first connection; the database user needs `readWrite` plus permission to create indexes (or create them once with an admin user). Atlas or any MongoDB 6+ works.

## Project structure

```
src/app/            layout, page, SEO files, API route handlers (thin)
src/components/     layout/, sections/, student/ (form), ui/, seo/
src/models/         StudentInquiry, TelegramAdminSession, TelegramUpdate, RateLimitHit
src/lib/            config/ db/ security/ students/ telegram/ utils/
src/config/site.js  public site configuration
scripts/            set-telegram-webhook.js
```

## Decisions and assumptions to review

- **`isNewInquiry` instead of `isNew`.** `isNew` is a reserved Mongoose property and can interfere with saves, so the "new" flag is stored as `isNewInquiry`. Behavior matches the plan; the flag is not shown in PDFs.
- **No separate `address` field.** The form's "city / location" is stored in `city` (max 200 chars).
- **Vision and Mission copy is a draft** written from the About brief (no text was supplied). Replace it with the client's approved wording in `Vision.jsx` and `Mission.jsx`. The Commitment quote is verbatim from the brief.
- **Plain controlled React state + the shared Zod schema** for the form (no React Hook Form); reCAPTCHA is loaded directly from Google on first form interaction (no wrapper package). The reCAPTCHA badge is hidden by CSS and the required disclosure text is shown in the form.
- **Bangla-first page** with English supporting lines; no `hreflang` alternates.
- **Admin timestamps** are shown in Asia/Dhaka time.
- **IP address** is stored server-side for abuse control, excluded from queries by default (the export queries opt in explicitly) and shown only in the admin PDFs, and disclosed on the form.
- **Rate-limit IP source:** `X-Real-IP`, then the last `X-Forwarded-For` entry. If you self-host, make your reverse proxy set `X-Real-IP`.

## Verification status

Done offline (npm was blocked):

- No `.ts` / `.tsx` files or TypeScript syntax.
- Every non-JSX `.js` file and `next.config.mjs` passes `node --check`.
- PDF generation executed locally with Chromium (page counts, 26×30in size, A4 one page, no message in list PDFs, slow-notice timers); logger redaction checked.
- Shared validation executed against 21 cases with Zod 3.25 (minor/adult guardian rules, normalization, limits, unknown keys dropped).

**Not yet verified (needs `npm install` first):**

- `npm run build` and `npm run lint`
- JSX files (components, `layout.js`, `page.js`, OG image/icon), Tailwind v4 `@apply` rules, `next/font` Bengali font loading
- Mongoose models and indexes against a real database
- Telegraf webhook handling, command flows and PDF delivery against the real Telegram API
- reCAPTCHA end to end

Suggested first run: `npm install && npm run lint && npm run build`, then walk the manual test list below.

## Manual test list

Submission: missing required field, invalid age/email/WhatsApp, minor without guardian, adult with blank guardian, very long message, double-click submit, 6 rapid submissions (rate limit), invalid/low-score reCAPTCHA, honeypot filled, MongoDB down, Telegram down (inquiry must still save).

Telegram: non-allowlisted user, unknown command, wrong email, wrong password, 5 failures (lock), expired session, logout then reuse, duplicate webhook delivery, `/newstudents` with none, `/newstudents` three times on the same student, `/allstudents` leaves new-state untouched, Telegram API failure during export (counters must not move).

## Non-goals (not built)

Admin web dashboard, teacher/student accounts, courses/LMS, payments, attendance, certificates, live classes, chat, email marketing, Redis, microservices.

## Reports (HTML)

- `/newstudents`, `/allstudents`: one self-contained `.html` file (fonts embedded, no scripts, no network). Table, **20 students per page**, sheets sized 26 × 30 in; adults show their own contact, under-18s show guardian phone/email/consent only; the message is never included.
- New submission: a one-page **A4** HTML sheet of that student (includes the message) goes to every admin chat. If the file cannot be built, a plain-text message is sent instead.
- Admins open the file in any browser. For a PDF: **Print → Save as PDF** (margins: none, background graphics: on).
- No Chromium or PDF library is needed, so it runs on any host, including Vercel.
