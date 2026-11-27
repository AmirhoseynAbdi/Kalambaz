-- Kalambaz (کلمه‌باز) MySQL Schema for cPanel / phpMyAdmin
-- Note: api/index.php automatically creates these tables on first run,
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

CREATE TABLE IF NOT EXISTS `app_settings` (
  `setting_key` VARCHAR(64) NOT NULL,
  `setting_value` LONGTEXT NOT NULL,
  `updated_at` VARCHAR(40) NOT NULL,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `push_subscriptions` (
  `endpoint_hash` CHAR(64) NOT NULL,
  `endpoint` TEXT NOT NULL,
  `p256dh` VARCHAR(255) NOT NULL,
  `auth` VARCHAR(128) NOT NULL,
  `username` VARCHAR(64) DEFAULT NULL,
  `created_at` VARCHAR(40) NOT NULL,
  `updated_at` VARCHAR(40) NOT NULL,
  `last_pushed_date` VARCHAR(20) DEFAULT NULL,
  PRIMARY KEY (`endpoint_hash`),
  KEY `idx_push_username` (`username`),
  KEY `idx_push_last_date` (`last_pushed_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `social_post_runs` (
  `date` VARCHAR(20) NOT NULL,
  `post_text` TEXT NOT NULL,
  `created_at` VARCHAR(40) NOT NULL,
  PRIMARY KEY (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `social_post_deliveries` (
  `date` VARCHAR(20) NOT NULL,
  `target` VARCHAR(32) NOT NULL,
  `status` VARCHAR(16) NOT NULL,
  `error` TEXT DEFAULT NULL,
  `updated_at` VARCHAR(40) NOT NULL,
  PRIMARY KEY (`date`, `target`),
  CONSTRAINT `fk_social_deliveries_run`
    FOREIGN KEY (`date`) REFERENCES `social_post_runs` (`date`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `referrals` (
  `invitee_username` VARCHAR(64) NOT NULL,
  `referrer_username` VARCHAR(64) NOT NULL,
  `reward_points` INT NOT NULL DEFAULT 100,
  `created_at` VARCHAR(40) NOT NULL,
  PRIMARY KEY (`invitee_username`),
  KEY `idx_referrals_referrer` (`referrer_username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
