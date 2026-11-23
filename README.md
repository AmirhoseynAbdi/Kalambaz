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

The server can generate one short, funny Persian promotion for the daily word puzzle with Gemini and publish it to two Telegram chats and one X account. When configured, it runs automatically at **09:00 Asia/Tehran** (and catches up on startup if the server comes back later that day).

Set these server-side environment variables (see [.env.example](.env.example)):

- `GEMINI_API_KEY`
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID_1`, and `TELEGRAM_CHAT_ID_2` (add the bot to both chats and allow it to send messages)
- `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, and `X_ACCESS_TOKEN_SECRET` (the X app needs Read and Write permissions)
- Optionally, `SOCIAL_POSTS_URL` for the public game link

Keep all API credentials in the hosting provider's secret/environment-variable settings; never put real credentials in the repository or client-side code. The Node server must stay running and use a persistent `DATA_DIR`/`DB_PATH`. It stores one generated post and per-destination delivery states in SQLite, so restarts and repeated scheduler checks do not resend posts already sent or whose delivery result is uncertain. A failed or uncertain destination is not automatically retried, to avoid duplicate posts; check the server log and destination before taking manual recovery action. If any required credential is missing, the feature stays disabled.
