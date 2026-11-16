<?php
/**
 * Kalambaz (کلمه‌باز) — cPanel MySQL Database Configuration
 *
 * HOW TO CONNECT YOUR CPANEL MYSQL DATABASE:
 * 1. In cPanel, open "MySQL® Database Wizard" (ویزارد دیتابیس MySQL).
 * 2. Create a database (e.g. "yourcpaneluser_kalambaz").
 * 3. Create a database user & password, and check "ALL PRIVILEGES" (همه دسترسی‌ها).
 * 4. Paste those 3 values into DB_NAME, DB_USER, and DB_PASS below and save this file.
 *
 * Note: The `users` table is created automatically on the first request.
 * Note: If DB_NAME is left empty (''), the server automatically uses a local SQLite database file.
 */

return [
    'DB_HOST' => getenv('DB_HOST') ?: 'localhost',
    'DB_PORT' => getenv('DB_PORT') ?: '3306',
    'DB_NAME' => getenv('DB_NAME') ?: 'kalambaz_Users',
    'DB_USER' => getenv('DB_USER') ?: 'kalambaz_HAWK',
    'DB_PASS' => getenv('DB_PASS') ?: '8580116101HAwk',

];

