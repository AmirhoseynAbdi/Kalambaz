-- Kalambaz (کلمه‌باز) MySQL Schema for cPanel / phpMyAdmin
-- Note: api/index.php automatically creates this table on first run,
-- so importing this file in phpMyAdmin is completely optional.

CREATE TABLE IF NOT EXISTS `users` (
  `username` VARCHAR(64) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `session_token` VARCHAR(128) DEFAULT NULL,
  `stats_json` LONGTEXT NOT NULL,
  `game_states_json` LONGTEXT NOT NULL,
  `created_at` VARCHAR(40) NOT NULL,
  `updated_at` VARCHAR(40) NOT NULL,
  PRIMARY KEY (`username`),
  KEY `idx_users_session_token` (`session_token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
