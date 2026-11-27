<?php
/**
 * Kalambaz Admin Control Panel & Game Config Library for cPanel PHP (MySQL & SQLite)
 * Zero external Composer dependencies required.
 */

if (PHP_SAPI !== 'cli' && basename(__FILE__) === basename((string)($_SERVER['SCRIPT_FILENAME'] ?? ''))) {
    http_response_code(403);
    exit;
}

require_once __DIR__ . '/web-push-lib.php';
require_once __DIR__ . '/social-posts-lib.php';

function loadMergedAdminConfigPhp(): array {
    $dbConfigPath = __DIR__ . '/db-config.php';
    $dbConfig = file_exists($dbConfigPath) ? require $dbConfigPath : [];
    if (!is_array($dbConfig)) {
        $dbConfig = [];
    }
    $socialConfigPath = __DIR__ . '/social-config.php';
    $socialConfig = file_exists($socialConfigPath) ? require $socialConfigPath : [];
    if (!is_array($socialConfig)) {
        $socialConfig = [];
    }
    return array_merge($dbConfig, $socialConfig);
}

function ensureAdminTablesPhp(PDO $pdo, string $engine): void {
    ensurePushTables($pdo, $engine);
    if ($engine === 'mysql') {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS admin_sessions (
                token_hash CHAR(64) PRIMARY KEY,
                created_at VARCHAR(40) NOT NULL,
                expires_at VARCHAR(40) NOT NULL,
                INDEX idx_admin_sessions_expires (expires_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS social_posts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(160) NOT NULL DEFAULT '',
                body_text TEXT NOT NULL,
                include_link TINYINT(1) NOT NULL DEFAULT 1,
                mode VARCHAR(24) NOT NULL DEFAULT 'draft',
                targets_json TEXT NOT NULL,
                scheduled_for VARCHAR(32) DEFAULT NULL,
                status VARCHAR(24) NOT NULL DEFAULT 'draft',
                deliveries_json LONGTEXT NOT NULL,
                created_at VARCHAR(40) NOT NULL,
                updated_at VARCHAR(40) NOT NULL,
                INDEX idx_social_posts_status_sched (status, scheduled_for)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS daily_word_overrides (
                date_key VARCHAR(16) NOT NULL,
                word_length INT NOT NULL,
                word VARCHAR(32) NOT NULL,
                note VARCHAR(160) NOT NULL DEFAULT '',
                updated_at VARCHAR(40) NOT NULL,
                PRIMARY KEY (date_key, word_length)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");
    } else {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS admin_sessions (
                token_hash TEXT PRIMARY KEY,
                created_at TEXT NOT NULL,
                expires_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);

            CREATE TABLE IF NOT EXISTS social_posts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL DEFAULT '',
                body_text TEXT NOT NULL,
                include_link INTEGER NOT NULL DEFAULT 1,
                mode TEXT NOT NULL DEFAULT 'draft',
                targets_json TEXT NOT NULL,
                scheduled_for TEXT DEFAULT NULL,
                status TEXT NOT NULL DEFAULT 'draft',
                deliveries_json TEXT NOT NULL DEFAULT '[]',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_social_posts_status_sched ON social_posts(status, scheduled_for);

            CREATE TABLE IF NOT EXISTS daily_word_overrides (
                date_key TEXT NOT NULL,
                word_length INTEGER NOT NULL,
                word TEXT NOT NULL,
                note TEXT NOT NULL DEFAULT '',
                updated_at TEXT NOT NULL,
                PRIMARY KEY (date_key, word_length)
            );
        ");
    }
}

function getTehranNowPhp(): array {
    $tz = new DateTimeZone('Asia/Tehran');
    $now = new DateTimeImmutable('now', $tz);
    return [
        'date' => $now->format('Y-m-d'),
        'dateTime' => $now->format('Y-m-d\TH:i'),
    ];
}

function normalizePersianPhp(string $text): string {
    $t = trim($text);
    $t = preg_replace('/[يیى]/u', 'ی', $t);
    $t = preg_replace('/[كک]/u', 'ک', $t);
    $t = preg_replace('/ة/u', 'ه', $t);
    $t = preg_replace('/[\x{064B}-\x{065F}\x{0670}]/u', '', $t);
    $t = preg_replace('/[\x{200B}-\x{200D}\x{FEFF}]/u', '', $t);
    $t = preg_replace('/\s+/u', '', $t);
    return (string)$t;
}

function getAppSettingPhp(PDO $pdo, string $key): ?string {
    $stmt = $pdo->prepare('SELECT setting_value FROM app_settings WHERE setting_key = ?');
    $stmt->execute([$key]);
    $row = $stmt->fetch();
    return $row ? (string)$row['setting_value'] : null;
}

function setAppSettingPhp(PDO $pdo, string $engine, string $key, string $value): void {
    $now = gmdate('Y-m-d\TH:i:s\Z');
    if ($engine === 'mysql') {
        $stmt = $pdo->prepare(
            'INSERT INTO app_settings (setting_key, setting_value, updated_at) VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = VALUES(updated_at)'
        );
        $stmt->execute([$key, $value, $now]);
    } else {
        $stmt = $pdo->prepare(
            'INSERT OR REPLACE INTO app_settings (setting_key, setting_value, updated_at) VALUES (?, ?, ?)'
        );
        $stmt->execute([$key, $value, $now]);
    }
}

function getAdminEnvPasswordPhp(array $mergedConfig): string {
    return getSocialConfigValue($mergedConfig, 'ADMIN_PASSWORD', '');
}

function getSocialChannelEnvPhp(array $mergedConfig): array {
    $postUrlRaw = getSocialConfigValue($mergedConfig, 'SOCIAL_POSTS_URL', 'https://kalambaz.ir');
    $parsed = parse_url($postUrlRaw);
    $postUrl = (is_array($parsed) && strtolower((string)($parsed['scheme'] ?? '')) === 'https' && !empty($parsed['host']))
        ? rtrim($postUrlRaw, '/')
        : 'https://kalambaz.ir';

    return [
        'telegramBotToken' => getSocialConfigValue($mergedConfig, 'TELEGRAM_BOT_TOKEN', ''),
        'telegramChatId1' => getSocialConfigValue($mergedConfig, 'TELEGRAM_CHAT_ID_1', ''),
        'telegramChatId2' => getSocialConfigValue($mergedConfig, 'TELEGRAM_CHAT_ID_2', ''),
        'xApiKey' => getSocialConfigValue($mergedConfig, 'X_API_KEY', ''),
        'xApiSecret' => getSocialConfigValue($mergedConfig, 'X_API_SECRET', ''),
        'xAccessToken' => getSocialConfigValue($mergedConfig, 'X_ACCESS_TOKEN', ''),
        'xAccessTokenSecret' => getSocialConfigValue($mergedConfig, 'X_ACCESS_TOKEN_SECRET', ''),
        'postUrl' => $postUrl,
    ];
}

function maskChatLabelPhp(string $chatId): ?string {
    if ($chatId === '') return null;
    if (substr($chatId, 0, 1) === '@') return $chatId;
    if (strlen($chatId) <= 6) return $chatId;
    return substr($chatId, 0, 4) . '…' . substr($chatId, -3);
}

function getSocialChannelReadinessPhp(array $mergedConfig): array {
    $cfg = getSocialChannelEnvPhp($mergedConfig);
    $tg1 = ($cfg['telegramBotToken'] !== '' && $cfg['telegramChatId1'] !== '');
    $tg2 = ($cfg['telegramBotToken'] !== '' && $cfg['telegramChatId2'] !== '' && $cfg['telegramChatId2'] !== $cfg['telegramChatId1']);
    $x = ($cfg['xApiKey'] !== '' && $cfg['xApiSecret'] !== '' && $cfg['xAccessToken'] !== '' && $cfg['xAccessTokenSecret'] !== '');

    $out = [
        'telegram1' => $tg1,
        'telegram2' => $tg2,
        'x' => $x,
        'postUrl' => $cfg['postUrl'],
    ];
    if ($tg1) $out['telegramChat1Label'] = maskChatLabelPhp($cfg['telegramChatId1']);
    if ($tg2) $out['telegramChat2Label'] = maskChatLabelPhp($cfg['telegramChatId2']);
    return $out;
}

function validateAnnouncementPhp(array $input): array {
    $enabled = !empty($input['enabled']);
    $message = isset($input['message']) && is_string($input['message']) ? trim($input['message']) : '';
    $linkUrl = isset($input['linkUrl']) && is_string($input['linkUrl']) ? trim($input['linkUrl']) : '';
    $toneRaw = isset($input['tone']) && is_string($input['tone']) ? trim($input['tone']) : 'emerald';
    $validTones = ['emerald', 'purple', 'amber', 'sky'];
    $tone = in_array($toneRaw, $validTones, true) ? $toneRaw : 'emerald';

    if (mb_strlen($message, 'UTF-8') > 280) {
        return ['valid' => false, 'error' => 'Announcement message must be 280 characters or less.'];
    }
    if ($enabled && $message === '') {
        return ['valid' => false, 'error' => 'Please enter a banner message before enabling it.'];
    }
    if ($linkUrl !== '') {
        if (strlen($linkUrl) > 500) {
            return ['valid' => false, 'error' => 'Link URL is too long.'];
        }
        $parsed = parse_url($linkUrl);
        if (!is_array($parsed) || strtolower((string)($parsed['scheme'] ?? '')) !== 'https' || empty($parsed['host'])) {
            return ['valid' => false, 'error' => 'Banner link must be a valid https:// URL.'];
        }
    }

    return [
        'valid' => true,
        'value' => [
            'enabled' => $enabled,
            'message' => $message,
            'linkUrl' => $linkUrl,
            'tone' => $tone,
            'updatedAt' => gmdate('Y-m-d\TH:i:s\Z'),
        ],
    ];
}

function getAnnouncementPhp(PDO $pdo): array {
    $raw = getAppSettingPhp($pdo, 'site_announcement');
    if ($raw === null) {
        return ['enabled' => false, 'message' => '', 'linkUrl' => '', 'tone' => 'emerald'];
    }
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        return ['enabled' => false, 'message' => '', 'linkUrl' => '', 'tone' => 'emerald'];
    }
    $check = validateAnnouncementPhp([
        'enabled' => !empty($decoded['enabled']) && !empty($decoded['message']),
        'message' => is_string($decoded['message'] ?? null) ? $decoded['message'] : '',
        'linkUrl' => is_string($decoded['linkUrl'] ?? null) ? $decoded['linkUrl'] : '',
        'tone' => is_string($decoded['tone'] ?? null) ? $decoded['tone'] : 'emerald',
    ]);
    if ($check['valid']) {
        $val = $check['value'];
        if (!empty($decoded['updatedAt']) && is_string($decoded['updatedAt'])) {
            $val['updatedAt'] = $decoded['updatedAt'];
        }
        return $val;
    }
    return ['enabled' => false, 'message' => '', 'linkUrl' => '', 'tone' => 'emerald'];
}

function validateWordOverridePhp($rawDateKey, $rawWordLength, $rawWord, $rawNote = ''): array {
    $dateKey = is_string($rawDateKey) ? trim($rawDateKey) : '';
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateKey)) {
        return ['valid' => false, 'error' => 'Invalid dateKey format (expected YYYY-MM-DD).'];
    }
    $wordLength = (int)$rawWordLength;
    if (!in_array($wordLength, [4, 5, 6], true)) {
        return ['valid' => false, 'error' => 'wordLength must be 4, 5, or 6.'];
    }
    if (!is_string($rawWord)) {
        return ['valid' => false, 'error' => 'Word is required.'];
    }
    $normalized = normalizePersianPhp($rawWord);
    if (!preg_match('/^[\x{0621}-\x{06CC}]+$/u', $normalized)) {
        return ['valid' => false, 'error' => 'Word must contain only Persian letters.'];
    }
    if (mb_strlen($normalized, 'UTF-8') !== $wordLength) {
        return ['valid' => false, 'error' => "Word must be exactly {$wordLength} Persian letters after normalization."];
    }
    $note = is_string($rawNote) ? mb_substr(trim($rawNote), 0, 140, 'UTF-8') : '';
    return [
        'valid' => true,
        'dateKey' => $dateKey,
        'wordLength' => $wordLength,
        'word' => $normalized,
        'note' => $note,
    ];
}

function normalizeSocialTargetsPhp($raw): array {
    $arr = is_array($raw) ? $raw : [];
    return [
        'telegram1' => !empty($arr['telegram1']),
        'telegram2' => !empty($arr['telegram2']),
        'x' => !empty($arr['x']),
    ];
}

function normalizeScheduledForPhp($raw): ?string {
    if (!is_string($raw)) return null;
    $trimmed = str_replace(' ', 'T', trim($raw));
    if (preg_match('/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/', $trimmed, $m)) {
        return $m[1] . 'T' . $m[2];
    }
    return null;
}

function mapSocialPostRowPhp(array $row): array {
    $targets = normalizeSocialTargetsPhp(json_decode((string)($row['targets_json'] ?? '{}'), true));
    $deliveries = json_decode((string)($row['deliveries_json'] ?? '[]'), true);
    if (!is_array($deliveries)) $deliveries = [];

    $mode = in_array($row['mode'] ?? '', ['draft', 'template', 'scheduled', 'published'], true)
        ? $row['mode']
        : 'draft';
    $status = in_array($row['status'] ?? '', ['draft', 'scheduled', 'sent', 'partial', 'failed'], true)
        ? $row['status']
        : 'draft';

    return [
        'id' => (int)$row['id'],
        'title' => (string)($row['title'] ?? ''),
        'bodyText' => (string)$row['body_text'],
        'includeLink' => !empty($row['include_link']),
        'mode' => $mode,
        'targets' => $targets,
        'scheduledFor' => !empty($row['scheduled_for']) ? (string)$row['scheduled_for'] : null,
        'status' => $status,
        'deliveries' => $deliveries,
        'createdAt' => (string)$row['created_at'],
        'updatedAt' => (string)$row['updated_at'],
    ];
}

function formatSocialTextWithLinkPhp(string $bodyText, bool $includeLink, string $postUrl): string {
    $clean = trim($bodyText);
    if (!$includeLink || $postUrl === '') return $clean;
    if (strpos($clean, $postUrl) !== false) return $clean;
    return $clean . "\n" . $postUrl;
}

function dispatchSocialPostByIdPhp(PDO $pdo, array $mergedConfig, int $postId, bool $retryFailedOnly = false): ?array {
    $stmt = $pdo->prepare('SELECT * FROM social_posts WHERE id = ?');
    $stmt->execute([$postId]);
    $row = $stmt->fetch();
    if (!$row) return null;

    $post = mapSocialPostRowPhp($row);
    $cfg = getSocialChannelEnvPhp($mergedConfig);
    $finalText = formatSocialTextWithLinkPhp($post['bodyText'], $post['includeLink'], $cfg['postUrl']);

    $channels = [];
    if (!empty($post['targets']['telegram1'])) $channels[] = 'telegram-1';
    if (!empty($post['targets']['telegram2'])) $channels[] = 'telegram-2';
    if (!empty($post['targets']['x'])) $channels[] = 'x';

    if (count($channels) === 0) {
        throw new RuntimeException('Select at least one target channel (Telegram or X) before publishing.');
    }

    $prevByChannel = [];
    foreach ($post['deliveries'] as $d) {
        if (is_array($d) && !empty($d['channel'])) {
            $prevByChannel[$d['channel']] = $d;
        }
    }

    $nextDeliveries = [];
    foreach ($channels as $channel) {
        $prev = $prevByChannel[$channel] ?? null;
        if ($retryFailedOnly && is_array($prev) && ($prev['status'] ?? '') === 'sent') {
            $nextDeliveries[] = $prev;
            continue;
        }

        $at = gmdate('Y-m-d\TH:i:s\Z');
        try {
            if ($channel === 'telegram-1') {
                if ($cfg['telegramBotToken'] === '' || $cfg['telegramChatId1'] === '') {
                    throw new RuntimeException('Telegram Chat 1 credentials are not configured in api/social-config.php.');
                }
                publishTelegramPostPhp($cfg['telegramBotToken'], $cfg['telegramChatId1'], $finalText);
            } elseif ($channel === 'telegram-2') {
                if ($cfg['telegramBotToken'] === '' || $cfg['telegramChatId2'] === '') {
                    throw new RuntimeException('Telegram Chat 2 credentials are not configured in api/social-config.php.');
                }
                publishTelegramPostPhp($cfg['telegramBotToken'], $cfg['telegramChatId2'], $finalText);
            } elseif ($channel === 'x') {
                if ($cfg['xApiKey'] === '' || $cfg['xApiSecret'] === '' || $cfg['xAccessToken'] === '' || $cfg['xAccessTokenSecret'] === '') {
                    throw new RuntimeException('X (Twitter) API credentials are not configured in api/social-config.php.');
                }
                if (mb_strlen($finalText, 'UTF-8') > 280) {
                    throw new RuntimeException('Post text exceeds X 280-character limit.');
                }
                publishXPostPhp($cfg, $finalText);
            }
            $nextDeliveries[] = ['channel' => $channel, 'status' => 'sent', 'at' => $at];
        } catch (Throwable $e) {
            $nextDeliveries[] = [
                'channel' => $channel,
                'status' => 'failed',
                'error' => mb_substr($e->getMessage(), 0, 220, 'UTF-8'),
                'at' => $at,
            ];
        }
    }

    $sentCount = 0;
    $failedCount = 0;
    foreach ($nextDeliveries as $d) {
        if ($d['status'] === 'sent') $sentCount++;
        else $failedCount++;
    }
    $nextStatus = ($sentCount > 0 && $failedCount === 0)
        ? 'sent'
        : (($sentCount > 0 && $failedCount > 0) ? 'partial' : 'failed');

    $nowIso = gmdate('Y-m-d\TH:i:s\Z');
    $upd = $pdo->prepare(
        "UPDATE social_posts SET mode = 'published', status = ?, deliveries_json = ?, updated_at = ? WHERE id = ?"
    );
    $upd->execute([
        $nextStatus,
        json_encode($nextDeliveries, JSON_UNESCAPED_UNICODE),
        $nowIso,
        $postId,
    ]);

    $stmt->execute([$postId]);
    $fresh = $stmt->fetch();
    return $fresh ? mapSocialPostRowPhp($fresh) : null;
}

function dispatchDueScheduledSocialPostsPhp(PDO $pdo, string $engine, array $mergedConfig): array {
    ensureAdminTablesPhp($pdo, $engine);
    $tehran = getTehranNowPhp();
    $stmt = $pdo->prepare(
        "SELECT id FROM social_posts WHERE status = 'scheduled' AND scheduled_for IS NOT NULL AND scheduled_for <= ? ORDER BY scheduled_for ASC"
    );
    $stmt->execute([$tehran['dateTime']]);
    $rows = $stmt->fetchAll();

    $dispatched = [];
    foreach ($rows as $r) {
        $id = (int)$r['id'];
        $claim = $pdo->prepare("UPDATE social_posts SET status = 'draft', updated_at = ? WHERE id = ? AND status = 'scheduled'");
        $claim->execute([gmdate('Y-m-d\TH:i:s\Z'), $id]);
        if ($claim->rowCount() === 0) continue;

        try {
            $res = dispatchSocialPostByIdPhp($pdo, $mergedConfig, $id, false);
            if ($res !== null) {
                $dispatched[] = $res;
            }
        } catch (Throwable $e) {
            $fail = $pdo->prepare("UPDATE social_posts SET status = 'failed', deliveries_json = ?, updated_at = ? WHERE id = ?");
            $fail->execute([
                json_encode([[
                    'channel' => 'telegram-1',
                    'status' => 'failed',
                    'error' => mb_substr($e->getMessage(), 0, 220, 'UTF-8'),
                    'at' => gmdate('Y-m-d\TH:i:s\Z'),
                ]], JSON_UNESCAPED_UNICODE),
                gmdate('Y-m-d\TH:i:s\Z'),
                $id,
            ]);
        }
    }

    return $dispatched;
}

function createAdminSessionPhp(PDO $pdo): string {
    $rawToken = bin2hex(random_bytes(32));
    $hash = hash('sha256', $rawToken);
    $nowTs = time();
    $nowIso = gmdate('Y-m-d\TH:i:s\Z', $nowTs);
    $expIso = gmdate('Y-m-d\TH:i:s\Z', $nowTs + 86400);

    $pdo->prepare('DELETE FROM admin_sessions WHERE expires_at < ?')->execute([$nowIso]);
    $pdo->prepare('INSERT INTO admin_sessions (token_hash, created_at, expires_at) VALUES (?, ?, ?)')
        ->execute([$hash, $nowIso, $expIso]);
    return $rawToken;
}

function isAdminSessionValidPhp(PDO $pdo, string $rawToken): bool {
    if ($rawToken === '' || strlen($rawToken) < 32) return false;
    $hash = hash('sha256', $rawToken);
    $stmt = $pdo->prepare('SELECT expires_at FROM admin_sessions WHERE token_hash = ?');
    $stmt->execute([$hash]);
    $row = $stmt->fetch();
    if (!$row) return false;
    if ((string)$row['expires_at'] < gmdate('Y-m-d\TH:i:s\Z')) {
        $pdo->prepare('DELETE FROM admin_sessions WHERE token_hash = ?')->execute([$hash]);
        return false;
    }
    return true;
}

function verifyAdminPasswordPhp(PDO $pdo, array $mergedConfig, string $candidate): bool {
    $envPass = getAdminEnvPasswordPhp($mergedConfig);
    if ($envPass !== '') {
        return hash_equals($envPass, $candidate);
    }
    $stored = getAppSettingPhp($pdo, 'admin_password_hash');
    if ($stored === null || $stored === '') return false;
    return password_verify($candidate, $stored);
}

function requireAdminAuthPhp(PDO $pdo): string {
    $token = getBearerToken();
    if (!isAdminSessionValidPhp($pdo, $token)) {
        sendJson(401, ['error' => 'Admin authentication required.']);
    }
    return $token;
}

function handleAdminAndConfigRoutes(PDO $pdo, string $engine, string $route, string $method, array $body): bool {
    // Public GET /api/game/config
    if ($route === 'game/config' && $method === 'GET') {
        $requested = isset($_GET['date']) && is_string($_GET['date']) ? trim($_GET['date']) : '';
        $dateKey = preg_match('/^\d{4}-\d{2}-\d{2}$/', $requested) ? $requested : getTehranNowPhp()['date'];

        $stmt = $pdo->prepare('SELECT word_length, word FROM daily_word_overrides WHERE date_key = ?');
        $stmt->execute([$dateKey]);
        $rows = $stmt->fetchAll();

        $overrides = [];
        foreach ($rows as $r) {
            $len = (int)$r['word_length'];
            if (in_array($len, [4, 5, 6], true)) {
                $overrides[(string)$len] = (string)$r['word'];
            }
        }

        sendJson(200, [
            'dateKey' => $dateKey,
            'wordOverrides' => count($overrides) > 0 ? $overrides : new stdClass(),
            'announcement' => getAnnouncementPhp($pdo),
        ]);
    }

    if (strpos($route, 'admin/') !== 0 && $route !== 'admin') {
        return false;
    }

    $mergedConfig = loadMergedAdminConfigPhp();

    // GET /api/admin/status
    if ($route === 'admin/status' && $method === 'GET') {
        $hasEnv = (getAdminEnvPasswordPhp($mergedConfig) !== '');
        $hasDb = (getAppSettingPhp($pdo, 'admin_password_hash') !== null);
        $configured = ($hasEnv || $hasDb);
        $authenticated = isAdminSessionValidPhp($pdo, getBearerToken());
        sendJson(200, [
            'configured' => $configured,
            'hasEnvPassword' => $hasEnv,
            'canClaimSetup' => !$configured,
            'authenticated' => $authenticated,
        ]);
    }

    // POST /api/admin/setup
    if ($route === 'admin/setup' && $method === 'POST') {
        if (getAdminEnvPasswordPhp($mergedConfig) !== '' || getAppSettingPhp($pdo, 'admin_password_hash') !== null) {
            sendJson(409, ['error' => 'Admin password is already configured.']);
        }
        $password = isset($body['password']) && is_string($body['password']) ? $body['password'] : '';
        if (strlen($password) < 8 || strlen($password) > 128) {
            sendJson(400, ['error' => 'Admin password must be between 8 and 128 characters.']);
        }
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $now = gmdate('Y-m-d\TH:i:s\Z');
        $sql = $engine === 'mysql'
            ? 'INSERT IGNORE INTO app_settings (setting_key, setting_value, updated_at) VALUES (?, ?, ?)'
            : 'INSERT OR IGNORE INTO app_settings (setting_key, setting_value, updated_at) VALUES (?, ?, ?)';
        $ins = $pdo->prepare($sql);
        $ins->execute(['admin_password_hash', $hash, $now]);
        if ($ins->rowCount() === 0) {
            sendJson(409, ['error' => 'Admin password is already configured.']);
        }
        $token = createAdminSessionPhp($pdo);
        sendJson(201, ['ok' => true, 'token' => $token]);
    }

    // POST /api/admin/login
    if ($route === 'admin/login' && $method === 'POST') {
        $hasEnv = (getAdminEnvPasswordPhp($mergedConfig) !== '');
        $hasDb = (getAppSettingPhp($pdo, 'admin_password_hash') !== null);
        if (!$hasEnv && !$hasDb) {
            sendJson(400, ['error' => 'Admin password is not configured yet. Complete setup first.']);
        }
        $password = isset($body['password']) && is_string($body['password']) ? $body['password'] : '';
        if ($password === '' || !verifyAdminPasswordPhp($pdo, $mergedConfig, $password)) {
            sendJson(401, ['error' => 'Invalid admin password.']);
        }
        $token = createAdminSessionPhp($pdo);
        sendJson(200, ['ok' => true, 'token' => $token]);
    }

    // All remaining /api/admin/* endpoints require valid admin Bearer token
    $activeToken = requireAdminAuthPhp($pdo);

    // POST /api/admin/logout
    if ($route === 'admin/logout' && $method === 'POST') {
        $pdo->prepare('DELETE FROM admin_sessions WHERE token_hash = ?')->execute([hash('sha256', $activeToken)]);
        sendJson(200, ['ok' => true]);
    }

    // PUT /api/admin/password
    if ($route === 'admin/password' && $method === 'PUT') {
        $currentPassword = isset($body['currentPassword']) && is_string($body['currentPassword']) ? $body['currentPassword'] : '';
        $newPassword = isset($body['newPassword']) && is_string($body['newPassword']) ? $body['newPassword'] : '';
        if (!verifyAdminPasswordPhp($pdo, $mergedConfig, $currentPassword)) {
            sendJson(401, ['error' => 'Current password is incorrect.']);
        }
        if (strlen($newPassword) < 8 || strlen($newPassword) > 128) {
            sendJson(400, ['error' => 'New password must be between 8 and 128 characters.']);
        }
        setAppSettingPhp($pdo, $engine, 'admin_password_hash', password_hash($newPassword, PASSWORD_DEFAULT));
        $out = ['ok' => true];
        if (getAdminEnvPasswordPhp($mergedConfig) !== '') {
            $out['note'] = 'Saved to database. Note that ADMIN_PASSWORD in social-config.php takes precedence while set.';
        }
        sendJson(200, $out);
    }

    // GET /api/admin/overview
    if ($route === 'admin/overview' && $method === 'GET') {
        $todayTehran = getTehranNowPhp()['date'];
        $tz = new DateTimeZone('Asia/Tehran');
        $todayObj = new DateTimeImmutable($todayTehran . ' 00:00:00', $tz);

        $seriesMap = [];
        for ($i = 13; $i >= 0; $i--) {
            $d = $todayObj->modify("-{$i} days")->format('Y-m-d');
            $seriesMap[$d] = ['date' => $d, 'signups' => 0, 'activePlayers' => 0];
        }

        $usersStmt = $pdo->query('SELECT username, stats_json, created_at FROM users');
        $userRows = $usersStmt->fetchAll();

        $activeToday = 0;
        $totalGamesPlayed = 0;
        $totalGamesWon = 0;
        $totalSeeds = 0;

        foreach ($userRows as $u) {
            $createdDay = substr((string)($u['created_at'] ?? ''), 0, 10);
            if (isset($seriesMap[$createdDay])) {
                $seriesMap[$createdDay]['signups']++;
            }
            $st = json_decode((string)($u['stats_json'] ?? '{}'), true);
            if (is_array($st)) {
                $totalGamesPlayed += max(0, (int)($st['gamesPlayed'] ?? 0));
                $totalGamesWon += max(0, (int)($st['gamesWon'] ?? 0));
                $totalSeeds += max(0, (int)($st['points'] ?? 0));
                $lastPlayed = is_string($st['lastPlayedDate'] ?? null) ? $st['lastPlayedDate'] : '';
                if ($lastPlayed === $todayTehran) $activeToday++;
                if ($lastPlayed !== '' && isset($seriesMap[$lastPlayed])) {
                    $seriesMap[$lastPlayed]['activePlayers']++;
                }
                if (!empty($st['completedDates']) && is_array($st['completedDates'])) {
                    foreach (array_keys($st['completedDates']) as $dk) {
                        if ($dk !== $lastPlayed && isset($seriesMap[$dk])) {
                            $seriesMap[$dk]['activePlayers']++;
                        }
                    }
                }
            }
        }

        $totalReferrals = (int)($pdo->query('SELECT COUNT(*) AS cnt FROM referrals')->fetch()['cnt'] ?? 0);
        $pushSubscribers = (int)($pdo->query('SELECT COUNT(*) AS cnt FROM push_subscriptions')->fetch()['cnt'] ?? 0);
        $socialPostsSent = (int)($pdo->query("SELECT COUNT(*) AS cnt FROM social_posts WHERE status IN ('sent', 'partial')")->fetch()['cnt'] ?? 0);
        $scheduledPostsCount = (int)($pdo->query("SELECT COUNT(*) AS cnt FROM social_posts WHERE status = 'scheduled'")->fetch()['cnt'] ?? 0);

        $ovStmt = $pdo->prepare('SELECT word_length, word, note FROM daily_word_overrides WHERE date_key = ?');
        $ovStmt->execute([$todayTehran]);
        $ovMap = [];
        foreach ($ovStmt->fetchAll() as $r) {
            $ovMap[(int)$r['word_length']] = $r;
        }

        $todayWords = [];
        foreach ([4, 5, 6] as $len) {
            $ov = $ovMap[$len] ?? null;
            $todayWords[] = [
                'length' => $len,
                'word' => $ov ? (string)$ov['word'] : '',
                'defaultWord' => '',
                'isOverridden' => $ov !== null,
                'note' => $ov ? (string)$ov['note'] : '',
            ];
        }

        $winRate = $totalGamesPlayed > 0 ? round(($totalGamesWon / $totalGamesPlayed) * 100, 1) : 0;

        sendJson(200, [
            'todayTehran' => $todayTehran,
            'kpis' => [
                'totalUsers' => count($userRows),
                'activeToday' => $activeToday,
                'totalGamesPlayed' => $totalGamesPlayed,
                'totalGamesWon' => $totalGamesWon,
                'winRate' => $winRate,
                'totalSeeds' => $totalSeeds,
                'totalReferrals' => $totalReferrals,
                'pushSubscribers' => $pushSubscribers,
                'socialPostsSent' => $socialPostsSent,
                'scheduledPostsCount' => $scheduledPostsCount,
            ],
            'activitySeries' => array_values($seriesMap),
            'todayWords' => $todayWords,
            'channels' => getSocialChannelReadinessPhp($mergedConfig),
            'announcement' => getAnnouncementPhp($pdo),
        ]);
    }

    // GET /api/admin/users
    if ($route === 'admin/users' && $method === 'GET') {
        $pushCounts = [];
        foreach ($pdo->query('SELECT username, COUNT(*) AS cnt FROM push_subscriptions WHERE username IS NOT NULL GROUP BY username')->fetchAll() as $r) {
            $pushCounts[(string)$r['username']] = (int)$r['cnt'];
        }

        $rows = $pdo->query('SELECT username, stats_json, game_states_json, created_at, updated_at FROM users ORDER BY updated_at DESC')->fetchAll();
        $users = [];
        foreach ($rows as $row) {
            $stats = json_decode((string)$row['stats_json'], true);
            $states = json_decode((string)$row['game_states_json'], true);
            $users[] = [
                'username' => (string)$row['username'],
                'stats' => is_array($stats) ? $stats : new stdClass(),
                'gameStates' => is_array($states) ? $states : new stdClass(),
                'createdAt' => (string)$row['created_at'],
                'updatedAt' => (string)$row['updated_at'],
                'pushSubscriptionsCount' => $pushCounts[(string)$row['username']] ?? 0,
            ];
        }
        sendJson(200, ['users' => $users]);
    }

    // PUT / DELETE /api/admin/users/:username
    if (preg_match('#^admin/users/(.+)$#', $route, $m)) {
        $targetUsername = trim(rawurldecode($m[1]));

        if ($method === 'PUT') {
            $stmt = $pdo->prepare('SELECT username, password_hash, stats_json, game_states_json, created_at, updated_at FROM users WHERE username = ?');
            $stmt->execute([$targetUsername]);
            $row = $stmt->fetch();
            if (!$row) {
                sendJson(404, ['error' => 'User not found.']);
            }

            $currentStats = json_decode((string)$row['stats_json'], true);
            if (!is_array($currentStats)) $currentStats = [];
            $currentStates = json_decode((string)$row['game_states_json'], true);
            if (!is_array($currentStates)) $currentStates = [];

            $clampInt = function ($val, int $fallback, int $max = 1000000): int {
                if (!is_numeric($val)) return $fallback;
                return max(0, min($max, (int)round((float)$val)));
            };

            if (isset($body['stats']) && is_array($body['stats'])) {
                $s = $body['stats'];
                if (array_key_exists('points', $s)) $currentStats['points'] = $clampInt($s['points'], (int)($currentStats['points'] ?? 0));
                if (array_key_exists('currentStreak', $s)) $currentStats['currentStreak'] = $clampInt($s['currentStreak'], (int)($currentStats['currentStreak'] ?? 0), 10000);
                if (array_key_exists('maxStreak', $s)) $currentStats['maxStreak'] = $clampInt($s['maxStreak'], (int)($currentStats['maxStreak'] ?? 0), 10000);
                if (array_key_exists('gamesPlayed', $s)) $currentStats['gamesPlayed'] = $clampInt($s['gamesPlayed'], (int)($currentStats['gamesPlayed'] ?? 0), 100000);
                if (array_key_exists('gamesWon', $s)) $currentStats['gamesWon'] = $clampInt($s['gamesWon'], (int)($currentStats['gamesWon'] ?? 0), 100000);
                if (isset($s['lastPlayedDate']) && is_string($s['lastPlayedDate'])) {
                    $trimmed = trim($s['lastPlayedDate']);
                    if ($trimmed === '' || preg_match('/^\d{4}-\d{2}-\d{2}$/', $trimmed)) {
                        $currentStats['lastPlayedDate'] = $trimmed;
                    }
                }
                if (isset($s['guessDistribution']) && is_array($s['guessDistribution'])) {
                    $nextGd = [];
                    foreach (['1', '2', '3', '4', '5', '6'] as $k) {
                        $nextGd[$k] = $clampInt($s['guessDistribution'][$k] ?? 0, 0, 100000);
                    }
                    $currentStats['guessDistribution'] = $nextGd;
                }
                if (isset($s['completedDates']) && is_array($s['completedDates'])) {
                    $currentStats['completedDates'] = $s['completedDates'];
                }
            }

            if (!empty($body['resetToday'])) {
                $todayTehran = getTehranNowPhp()['date'];
                foreach ($currentStates as $k => $st) {
                    $dk = is_array($st) ? ($st['dateKey'] ?? '') : '';
                    if ($dk === '' || $dk === $todayTehran) {
                        unset($currentStates[$k]);
                    }
                }
            } elseif (isset($body['gameStates']) && is_array($body['gameStates'])) {
                $currentStates = $body['gameStates'];
            }

            $nextPassHash = (string)$row['password_hash'];
            if (isset($body['newPassword']) && is_string($body['newPassword']) && $body['newPassword'] !== '') {
                if (strlen($body['newPassword']) < 4 || strlen($body['newPassword']) > 128) {
                    sendJson(400, ['error' => 'New user password must be between 4 and 128 characters.']);
                }
                $nextPassHash = password_hash($body['newPassword'], PASSWORD_DEFAULT);
            }

            $nowIso = gmdate('Y-m-d\TH:i:s\Z');
            $upd = $pdo->prepare('UPDATE users SET password_hash = ?, stats_json = ?, game_states_json = ?, updated_at = ? WHERE username = ?');
            $upd->execute([
                $nextPassHash,
                json_encode($currentStats, JSON_UNESCAPED_UNICODE),
                json_encode(count($currentStates) > 0 ? $currentStates : new stdClass(), JSON_UNESCAPED_UNICODE),
                $nowIso,
                $targetUsername,
            ]);

            $pStmt = $pdo->prepare('SELECT COUNT(*) AS cnt FROM push_subscriptions WHERE username = ?');
            $pStmt->execute([$targetUsername]);
            $pCnt = (int)($pStmt->fetch()['cnt'] ?? 0);

            sendJson(200, [
                'ok' => true,
                'user' => [
                    'username' => $targetUsername,
                    'stats' => $currentStats,
                    'gameStates' => count($currentStates) > 0 ? $currentStates : new stdClass(),
                    'createdAt' => (string)$row['created_at'],
                    'updatedAt' => $nowIso,
                    'pushSubscriptionsCount' => $pCnt,
                ],
            ]);
        }

        if ($method === 'DELETE') {
            $del = $pdo->prepare('DELETE FROM users WHERE username = ?');
            $del->execute([$targetUsername]);
            if ($del->rowCount() === 0) {
                sendJson(404, ['error' => 'User not found.']);
            }
            $pdo->prepare('UPDATE push_subscriptions SET username = NULL WHERE username = ?')->execute([$targetUsername]);
            $pdo->prepare('DELETE FROM referrals WHERE invitee_username = ? OR referrer_username = ?')->execute([$targetUsername, $targetUsername]);
            sendJson(200, ['ok' => true]);
        }
    }

    // SOCIAL POSTS
    if ($route === 'admin/social/posts' && $method === 'GET') {
        $rows = $pdo->query('SELECT * FROM social_posts ORDER BY id DESC LIMIT 150')->fetchAll();
        $posts = array_map('mapSocialPostRowPhp', $rows);
        sendJson(200, [
            'posts' => $posts,
            'channels' => getSocialChannelReadinessPhp($mergedConfig),
        ]);
    }

    if ($route === 'admin/social/posts' && $method === 'POST') {
        $title = isset($body['title']) && is_string($body['title']) ? mb_substr(trim($body['title']), 0, 120, 'UTF-8') : '';
        $bodyText = isset($body['bodyText']) && is_string($body['bodyText']) ? trim($body['bodyText']) : '';
        if ($bodyText === '' || mb_strlen($bodyText, 'UTF-8') > 2000) {
            sendJson(400, ['error' => 'Post text is required and must be under 2000 characters.']);
        }
        $includeLink = !array_key_exists('includeLink', $body) || !empty($body['includeLink']);
        $targets = normalizeSocialTargetsPhp($body['targets'] ?? []);
        $requestedMode = is_string($body['mode'] ?? null) ? $body['mode'] : 'draft';
        $publishNow = !empty($body['publishNow']);
        $scheduledFor = normalizeScheduledForPhp($body['scheduledFor'] ?? null);

        $mode = 'draft';
        $status = 'draft';
        if ($publishNow) {
            $mode = 'published';
            $status = 'draft';
        } elseif ($requestedMode === 'template') {
            $mode = 'template';
            $status = 'draft';
        } elseif ($requestedMode === 'scheduled') {
            if ($scheduledFor === null) {
                sendJson(400, ['error' => 'Valid scheduled date/time (YYYY-MM-DDTHH:mm) is required.']);
            }
            if (!$targets['telegram1'] && !$targets['telegram2'] && !$targets['x']) {
                sendJson(400, ['error' => 'Select at least one channel to schedule this post.']);
            }
            $mode = 'scheduled';
            $status = 'scheduled';
        }

        $nowIso = gmdate('Y-m-d\TH:i:s\Z');
        $ins = $pdo->prepare(
            "INSERT INTO social_posts (title, body_text, include_link, mode, targets_json, scheduled_for, status, deliveries_json, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, '[]', ?, ?)"
        );
        $ins->execute([
            $title,
            $bodyText,
            $includeLink ? 1 : 0,
            $mode,
            json_encode($targets, JSON_UNESCAPED_UNICODE),
            $mode === 'scheduled' ? $scheduledFor : null,
            $status,
            $nowIso,
            $nowIso,
        ]);
        $postId = (int)$pdo->lastInsertId();

        if ($publishNow) {
            try {
                $published = dispatchSocialPostByIdPhp($pdo, $mergedConfig, $postId, false);
                sendJson(201, ['ok' => true, 'post' => $published]);
            } catch (Throwable $e) {
                sendJson(400, ['error' => $e->getMessage()]);
            }
        }

        $stmt = $pdo->prepare('SELECT * FROM social_posts WHERE id = ?');
        $stmt->execute([$postId]);
        sendJson(201, ['ok' => true, 'post' => mapSocialPostRowPhp($stmt->fetch())]);
    }

    if (preg_match('#^admin/social/posts/(\d+)/publish$#', $route, $m) && $method === 'POST') {
        $postId = (int)$m[1];
        $retryFailedOnly = !empty($body['retryFailedOnly']);
        try {
            $updated = dispatchSocialPostByIdPhp($pdo, $mergedConfig, $postId, $retryFailedOnly);
            if ($updated === null) {
                sendJson(404, ['error' => 'Post not found.']);
            }
            sendJson(200, ['ok' => true, 'post' => $updated]);
        } catch (Throwable $e) {
            sendJson(400, ['error' => $e->getMessage()]);
        }
    }

    if (preg_match('#^admin/social/posts/(\d+)$#', $route, $m)) {
        $postId = (int)$m[1];
        if ($method === 'PUT') {
            $stmt = $pdo->prepare('SELECT * FROM social_posts WHERE id = ?');
            $stmt->execute([$postId]);
            $existingRow = $stmt->fetch();
            if (!$existingRow) sendJson(404, ['error' => 'Post not found.']);
            $existing = mapSocialPostRowPhp($existingRow);

            $title = isset($body['title']) && is_string($body['title']) ? mb_substr(trim($body['title']), 0, 120, 'UTF-8') : $existing['title'];
            $bodyText = isset($body['bodyText']) && is_string($body['bodyText']) ? trim($body['bodyText']) : $existing['bodyText'];
            if ($bodyText === '' || mb_strlen($bodyText, 'UTF-8') > 2000) {
                sendJson(400, ['error' => 'Post text must be between 1 and 2000 characters.']);
            }
            $includeLink = array_key_exists('includeLink', $body) ? !empty($body['includeLink']) : $existing['includeLink'];
            $targets = isset($body['targets']) ? normalizeSocialTargetsPhp($body['targets']) : $existing['targets'];
            $modeRaw = is_string($body['mode'] ?? null) ? $body['mode'] : $existing['mode'];
            $mode = in_array($modeRaw, ['draft', 'template', 'scheduled', 'published'], true) ? $modeRaw : $existing['mode'];
            $scheduledFor = array_key_exists('scheduledFor', $body)
                ? normalizeScheduledForPhp($body['scheduledFor'])
                : $existing['scheduledFor'];

            $status = $existing['status'];
            if ($mode === 'scheduled') {
                if ($scheduledFor === null) sendJson(400, ['error' => 'Valid scheduled date/time is required.']);
                $status = 'scheduled';
            } elseif ($mode === 'draft' || $mode === 'template') {
                $status = 'draft';
            }

            $nowIso = gmdate('Y-m-d\TH:i:s\Z');
            $upd = $pdo->prepare(
                'UPDATE social_posts SET title = ?, body_text = ?, include_link = ?, mode = ?, targets_json = ?, scheduled_for = ?, status = ?, updated_at = ? WHERE id = ?'
            );
            $upd->execute([
                $title,
                $bodyText,
                $includeLink ? 1 : 0,
                $mode,
                json_encode($targets, JSON_UNESCAPED_UNICODE),
                $mode === 'scheduled' ? $scheduledFor : null,
                $status,
                $nowIso,
                $postId,
            ]);
            $stmt->execute([$postId]);
            sendJson(200, ['ok' => true, 'post' => mapSocialPostRowPhp($stmt->fetch())]);
        }

        if ($method === 'DELETE') {
            $del = $pdo->prepare('DELETE FROM social_posts WHERE id = ?');
            $del->execute([$postId]);
            if ($del->rowCount() === 0) sendJson(404, ['error' => 'Post not found.']);
            sendJson(200, ['ok' => true]);
        }
    }

    // DAILY WORDS
    if ($route === 'admin/daily-words' && $method === 'GET') {
        $days = isset($_GET['days']) ? max(7, min(45, (int)$_GET['days'])) : 21;
        $todayTehran = getTehranNowPhp()['date'];
        $tz = new DateTimeZone('Asia/Tehran');
        $startObj = (new DateTimeImmutable($todayTehran . ' 00:00:00', $tz))->modify('-3 days');
        $startDate = $startObj->format('Y-m-d');
        $endDate = $startObj->modify('+' . ($days - 1) . ' days')->format('Y-m-d');

        $stmt = $pdo->prepare('SELECT date_key, word_length, word, note FROM daily_word_overrides WHERE date_key >= ? AND date_key <= ?');
        $stmt->execute([$startDate, $endDate]);
        $ovMap = [];
        foreach ($stmt->fetchAll() as $r) {
            $ovMap[$r['date_key'] . ':' . (int)$r['word_length']] = [
                'word' => (string)$r['word'],
                'note' => (string)($r['note'] ?? ''),
            ];
        }

        $rows = [];
        for ($i = 0; $i < $days; $i++) {
            $dk = $startObj->modify("+{$i} days")->format('Y-m-d');
            $words = [];
            foreach ([4, 5, 6] as $len) {
                $ov = $ovMap[$dk . ':' . $len] ?? null;
                $words[(string)$len] = [
                    'word' => $ov ? $ov['word'] : '',
                    'defaultWord' => '',
                    'isOverridden' => $ov !== null,
                    'note' => $ov ? $ov['note'] : '',
                ];
            }
            $rows[] = [
                'dateKey' => $dk,
                'isToday' => ($dk === $todayTehran),
                'words' => $words,
            ];
        }
        sendJson(200, ['todayTehran' => $todayTehran, 'rows' => $rows]);
    }

    if ($route === 'admin/daily-words' && $method === 'PUT') {
        $check = validateWordOverridePhp($body['dateKey'] ?? null, $body['wordLength'] ?? null, $body['word'] ?? null, $body['note'] ?? '');
        if (!$check['valid']) {
            sendJson(400, ['error' => $check['error']]);
        }
        $now = gmdate('Y-m-d\TH:i:s\Z');
        if ($engine === 'mysql') {
            $stmt = $pdo->prepare(
                'INSERT INTO daily_word_overrides (date_key, word_length, word, note, updated_at) VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE word = VALUES(word), note = VALUES(note), updated_at = VALUES(updated_at)'
            );
            $stmt->execute([$check['dateKey'], $check['wordLength'], $check['word'], $check['note'], $now]);
        } else {
            $stmt = $pdo->prepare(
                'INSERT OR REPLACE INTO daily_word_overrides (date_key, word_length, word, note, updated_at) VALUES (?, ?, ?, ?, ?)'
            );
            $stmt->execute([$check['dateKey'], $check['wordLength'], $check['word'], $check['note'], $now]);
        }
        sendJson(200, ['ok' => true, 'word' => $check['word']]);
    }

    if (preg_match('#^admin/daily-words/(\d{4}-\d{2}-\d{2})/([456])$#', $route, $m) && $method === 'DELETE') {
        $pdo->prepare('DELETE FROM daily_word_overrides WHERE date_key = ? AND word_length = ?')
            ->execute([$m[1], (int)$m[2]]);
        sendJson(200, ['ok' => true]);
    }

    // WEB PUSH STATS & BROADCAST
    if ($route === 'admin/push/stats' && $method === 'GET') {
        $todayTehran = getTehranNowPhp()['date'];
        $rows = $pdo->query('SELECT endpoint_hash, endpoint, username, last_pushed_date, created_at FROM push_subscriptions ORDER BY created_at DESC')->fetchAll();
        $linked = 0;
        $guest = 0;
        $pushedToday = 0;
        foreach ($rows as $r) {
            if (!empty($r['username'])) $linked++;
            else $guest++;
            if (($r['last_pushed_date'] ?? null) === $todayTehran) $pushedToday++;
        }
        $recent = [];
        foreach (array_slice($rows, 0, 25) as $r) {
            $host = parse_url((string)$r['endpoint'], PHP_URL_HOST) ?: 'unknown';
            $recent[] = [
                'id' => substr((string)$r['endpoint_hash'], 0, 12),
                'host' => (string)$host,
                'username' => !empty($r['username']) ? (string)$r['username'] : null,
                'lastPushedDate' => !empty($r['last_pushed_date']) ? (string)$r['last_pushed_date'] : null,
                'createdAt' => (string)$r['created_at'],
            ];
        }
        sendJson(200, [
            'totalSubscriptions' => count($rows),
            'linkedUsersCount' => $linked,
            'guestDevicesCount' => $guest,
            'pushedTodayCount' => $pushedToday,
            'todayTehran' => $todayTehran,
            'recentSubscriptions' => $recent,
        ]);
    }

    if ($route === 'admin/push/broadcast' && $method === 'POST') {
        $vapid = getOrCreateVapidKeys($pdo, $mergedConfig);
        $todayTehran = getTehranNowPhp()['date'];
        $force = !array_key_exists('force', $body) || !empty($body['force']);

        if ($force) {
            $subs = $pdo->query('SELECT endpoint_hash, endpoint FROM push_subscriptions')->fetchAll();
        } else {
            $st = $pdo->prepare('SELECT endpoint_hash, endpoint FROM push_subscriptions WHERE last_pushed_date IS NULL OR last_pushed_date != ?');
            $st->execute([$todayTehran]);
            $subs = $st->fetchAll();
        }

        $markStmt = $pdo->prepare('UPDATE push_subscriptions SET last_pushed_date = ?, updated_at = ? WHERE endpoint_hash = ?');
        $delStmt = $pdo->prepare('DELETE FROM push_subscriptions WHERE endpoint_hash = ?');

        $sent = 0;
        $pruned = 0;
        $failed = 0;
        $nowIso = gmdate('Y-m-d\TH:i:s\Z');

        foreach ($subs as $sub) {
            $res = dispatchWebPushWakeup((string)$sub['endpoint'], $vapid, 86400);
            if ($res['ok']) {
                $markStmt->execute([$todayTehran, $nowIso, $sub['endpoint_hash']]);
                $sent++;
            } elseif ($res['expired']) {
                $delStmt->execute([$sub['endpoint_hash']]);
                $pruned++;
            } else {
                $failed++;
            }
        }

        sendJson(200, [
            'ok' => true,
            'dateTehran' => $todayTehran,
            'totalChecked' => count($subs),
            'sent' => $sent,
            'pruned' => $pruned,
            'failed' => $failed,
        ]);
    }

    // REFERRALS
    if ($route === 'admin/referrals' && $method === 'GET') {
        $totals = $pdo->query('SELECT COUNT(*) AS cnt, COALESCE(SUM(reward_points), 0) AS total FROM referrals')->fetch();
        $lbRows = $pdo->query(
            'SELECT referrer_username AS username, COUNT(*) AS referralsCount, COALESCE(SUM(reward_points), 0) AS totalRewardSeeds
             FROM referrals GROUP BY referrer_username ORDER BY referralsCount DESC, totalRewardSeeds DESC LIMIT 50'
        )->fetchAll();
        $recentRows = $pdo->query(
            'SELECT invitee_username AS inviteeUsername, referrer_username AS referrerUsername, reward_points AS rewardPoints, created_at AS createdAt
             FROM referrals ORDER BY created_at DESC LIMIT 100'
        )->fetchAll();

        $leaderboard = [];
        foreach ($lbRows as $r) {
            $leaderboard[] = [
                'username' => (string)$r['username'],
                'referralsCount' => (int)$r['referralsCount'],
                'totalRewardSeeds' => (int)$r['totalRewardSeeds'],
            ];
        }
        $recent = [];
        foreach ($recentRows as $r) {
            $recent[] = [
                'inviteeUsername' => (string)$r['inviteeUsername'],
                'referrerUsername' => (string)$r['referrerUsername'],
                'rewardPoints' => (int)$r['rewardPoints'],
                'createdAt' => (string)$r['createdAt'],
            ];
        }

        sendJson(200, [
            'totalReferrals' => (int)($totals['cnt'] ?? 0),
            'totalRewardSeeds' => (int)($totals['total'] ?? 0),
            'leaderboard' => $leaderboard,
            'recent' => $recent,
        ]);
    }

    // ANNOUNCEMENT BANNER
    if ($route === 'admin/announcement' && $method === 'GET') {
        sendJson(200, ['announcement' => getAnnouncementPhp($pdo)]);
    }

    if ($route === 'admin/announcement' && $method === 'PUT') {
        $check = validateAnnouncementPhp($body);
        if (!$check['valid']) {
            sendJson(400, ['error' => $check['error']]);
        }
        setAppSettingPhp($pdo, $engine, 'site_announcement', json_encode($check['value'], JSON_UNESCAPED_UNICODE));
        sendJson(200, ['ok' => true, 'announcement' => $check['value']]);
    }

    sendJson(404, ['error' => 'Admin API route not found.']);
    return true;
}
