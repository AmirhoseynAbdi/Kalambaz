<?php
/**
 * Kalambaz Admin & Social Posts Configuration Template (cPanel)
 *
 * SETUP ON CPANEL (keep out of GitHub):
 *   1. In cPanel File Manager, copy this file to:  public_html/api/social-config.php
 *   2. Fill in your Telegram / X credentials (and optional ADMIN_PASSWORD).
 *   3. Add a daily/hourly Cron Job in cPanel to dispatch scheduled posts:
 *        php /home/YOUR_CPANEL_USER/public_html/api/send-daily-social.php
 */

if (PHP_SAPI !== 'cli' && basename(__FILE__) === basename((string)($_SERVER['SCRIPT_FILENAME'] ?? ''))) {
    http_response_code(403);
    exit;
}

return [
    // Optional dedicated password for https://kalambaz.ir/admin
    // If left blank, you can claim your initial admin password directly from the /admin first-run screen.
    'ADMIN_PASSWORD' => '',

    // Optional: Google AI Studio Gemini API Key (not required when authoring/scheduling posts from /admin)
    'GEMINI_API_KEY' => '',

    // Telegram Bot Token from @BotFather (add bot as Admin with Post Messages permission)
    'TELEGRAM_BOT_TOKEN' => '',
    // Primary Telegram channel/chat ID (e.g. '@kalambaz_ir' or '-100...')
    'TELEGRAM_CHAT_ID_1' => '',
    // Optional second Telegram chat ID (leave blank if you only post to one chat)
    'TELEGRAM_CHAT_ID_2' => '',

    // X / Twitter OAuth 1.0a Keys (Developer Console -> Keys & Tokens -> OAuth 1.0a keys, Read and write)
    'X_API_KEY' => '',
    'X_API_SECRET' => '',
    'X_ACCESS_TOKEN' => '',
    'X_ACCESS_TOKEN_SECRET' => '',

    // Public game URL optionally appended to posts
    'SOCIAL_POSTS_URL' => 'https://kalambaz.ir',

    // Optional: set a strong random secret ONLY if you want to trigger send-daily-social.php via HTTP header X-Social-Cron-Secret
    // Leave blank when using cPanel CLI Cron Jobs (recommended).
    'SOCIAL_CRON_SECRET' => '',
];
