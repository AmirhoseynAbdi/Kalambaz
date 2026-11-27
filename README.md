<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/df8bf072-b0b3-4726-9049-95706be57b49

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Daily social posts

The server can generate one short, funny Persian promotion for the daily word puzzle with Gemini and publish it to Telegram (1 required chat + 1 optional second chat) and one X account.

### Option A: cPanel PHP Cron Job (Recommended for cPanel hosts)
1. In cPanel File Manager, copy `public_html/api/social-config.example.php` to `public_html/api/social-config.php` (kept outside GitHub) and fill in your credentials (`GEMINI_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID_1`, optional `TELEGRAM_CHAT_ID_2`, `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_TOKEN_SECRET`).
2. Add a daily Cron Job in cPanel (e.g. **09:00 Asia/Tehran**):
   `php /home/YOUR_CPANEL_USER/public_html/api/send-daily-social.php`
3. You can preview a generated post safely without publishing via `--dry-run`:
   `php /home/YOUR_CPANEL_USER/public_html/api/send-daily-social.php --dry-run`

### Option B: Node.js server (`server.ts`)
When running the Node server continuously, it runs automatically at **09:00 Asia/Tehran** (and catches up on startup if the server comes back later that day). Set these server-side environment variables (see [.env.example](.env.example)):

- `GEMINI_API_KEY`
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID_1`, and optionally `TELEGRAM_CHAT_ID_2` (add the bot to the chat(s) as Admin with permission to send messages)
- `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, and `X_ACCESS_TOKEN_SECRET` (the X app needs Read and Write permissions)
- Optionally, `SOCIAL_POSTS_URL` for the public game link

Keep all API credentials in your hosting provider's secret/environment-variable settings or private `api/social-config.php` on cPanel; never put real credentials in the repository or client-side code. Both implementations store one generated post and per-destination delivery states in the database (`social_post_runs` and `social_post_deliveries`), so repeated runs never resend posts already sent or whose delivery result is uncertain.
