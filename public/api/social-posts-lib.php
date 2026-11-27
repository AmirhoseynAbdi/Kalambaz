<?php
/**
 * Kalambaz Daily Social Posts Library for cPanel PHP (MySQL & SQLite)
 * Zero external Composer dependencies required (uses standard PDO + cURL + hash_hmac).
 *
 * Generates one funny Persian daily promotion with Gemini and publishes it to:
 *   - Telegram chat 1 (required for Telegram) + optional Telegram chat 2
 *   - X / Twitter via OAuth 1.0a (POST https://api.x.com/2/tweets)
 */

if (PHP_SAPI !== 'cli' && basename(__FILE__) === basename((string)($_SERVER['SCRIPT_FILENAME'] ?? ''))) {
    http_response_code(403);
    exit;
}

const KALAMBAZ_X_POSTS_URL = 'https://api.x.com/2/tweets';

function ensureSocialPostTables(PDO $pdo, string $engine): void {
    if ($engine === 'mysql') {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS social_post_runs (
                date VARCHAR(20) PRIMARY KEY,
                post_text TEXT NOT NULL,
                created_at VARCHAR(40) NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS social_post_deliveries (
                date VARCHAR(20) NOT NULL,
                target VARCHAR(32) NOT NULL,
                status VARCHAR(16) NOT NULL,
                error TEXT DEFAULT NULL,
                updated_at VARCHAR(40) NOT NULL,
                PRIMARY KEY (date, target),
                CONSTRAINT fk_social_deliveries_run
                    FOREIGN KEY (date) REFERENCES social_post_runs(date)
                    ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");
    } else {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS social_post_runs (
                date TEXT PRIMARY KEY,
                post_text TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS social_post_deliveries (
                date TEXT NOT NULL,
                target TEXT NOT NULL,
                status TEXT NOT NULL CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
                error TEXT,
                updated_at TEXT NOT NULL,
                PRIMARY KEY (date, target),
                FOREIGN KEY (date) REFERENCES social_post_runs(date)
            );
        ");
    }
}

function getSocialConfigValue(array $config, string $key, string $default = ''): string {
    if (isset($config[$key]) && is_string($config[$key])) {
        $val = trim($config[$key]);
        if ($val !== '') {
            return $val;
        }
    }
    $env = getenv($key);
    if (is_string($env)) {
        $val = trim($env);
        if ($val !== '') {
            return $val;
        }
    }
    return $default;
}

/**
 * Load and validate cPanel social posting configuration.
 * - GEMINI_API_KEY is required.
 * - TELEGRAM_CHAT_ID_2 is optional (1 Telegram chat works cleanly on its own).
 * - At least one destination platform (Telegram or X) must be configured.
 */
function loadSocialPostConfig(array $config): array {
    $geminiApiKey = getSocialConfigValue($config, 'GEMINI_API_KEY');
    $geminiModel = getSocialConfigValue($config, 'GEMINI_MODEL', 'gemini-2.5-flash');
    if (!preg_match('/^[a-zA-Z0-9._-]{3,80}$/', $geminiModel)) {
        throw new RuntimeException('GEMINI_MODEL contains invalid characters.');
    }

    $postUrl = getSocialConfigValue($config, 'SOCIAL_POSTS_URL', 'https://kalambaz.ir');
    $parsedUrl = parse_url($postUrl);
    if (!is_array($parsedUrl) || strtolower((string)($parsedUrl['scheme'] ?? '')) !== 'https' || empty($parsedUrl['host'])) {
        throw new RuntimeException('SOCIAL_POSTS_URL must be a valid HTTPS URL.');
    }
    $postUrl = rtrim($postUrl, '/');

    $telegramBotToken = getSocialConfigValue($config, 'TELEGRAM_BOT_TOKEN');
    $telegramChatId1 = getSocialConfigValue($config, 'TELEGRAM_CHAT_ID_1');
    $telegramChatId2 = getSocialConfigValue($config, 'TELEGRAM_CHAT_ID_2');
    $telegramChatIds = [];
    if ($telegramChatId1 !== '') {
        $telegramChatIds[] = $telegramChatId1;
    }
    if ($telegramChatId2 !== '' && $telegramChatId2 !== $telegramChatId1) {
        $telegramChatIds[] = $telegramChatId2;
    }

    $telegramEnabled = ($telegramBotToken !== '' && count($telegramChatIds) > 0);
    if ($telegramEnabled && !preg_match('/^[0-9]+:[A-Za-z0-9_-]{20,}$/', $telegramBotToken)) {
        throw new RuntimeException('TELEGRAM_BOT_TOKEN format is invalid.');
    }

    $xApiKey = getSocialConfigValue($config, 'X_API_KEY');
    $xApiSecret = getSocialConfigValue($config, 'X_API_SECRET');
    $xAccessToken = getSocialConfigValue($config, 'X_ACCESS_TOKEN');
    $xAccessTokenSecret = getSocialConfigValue($config, 'X_ACCESS_TOKEN_SECRET');
    $xEnabled = ($xApiKey !== '' && $xApiSecret !== '' && $xAccessToken !== '' && $xAccessTokenSecret !== '');

    $missing = [];
    if ($geminiApiKey === '') {
        $missing[] = 'GEMINI_API_KEY';
    }
    if (!$telegramEnabled) {
        if ($telegramBotToken === '') {
            $missing[] = 'TELEGRAM_BOT_TOKEN';
        }
        if ($telegramChatId1 === '') {
            $missing[] = 'TELEGRAM_CHAT_ID_1';
        }
    }
    if (!$xEnabled) {
        foreach (['X_API_KEY' => $xApiKey, 'X_API_SECRET' => $xApiSecret, 'X_ACCESS_TOKEN' => $xAccessToken, 'X_ACCESS_TOKEN_SECRET' => $xAccessTokenSecret] as $k => $v) {
            if ($v === '') {
                $missing[] = $k;
            }
        }
    }

    if ($geminiApiKey === '' || (!$telegramEnabled && !$xEnabled)) {
        return [
            'ready' => false,
            'missing' => $missing,
            'config' => null,
        ];
    }

    return [
        'ready' => true,
        'missing' => $missing,
        'config' => [
            'geminiApiKey' => $geminiApiKey,
            'geminiModel' => $geminiModel,
            'postUrl' => $postUrl,
            'telegramEnabled' => $telegramEnabled,
            'telegramBotToken' => $telegramBotToken,
            'telegramChatIds' => $telegramChatIds,
            'xEnabled' => $xEnabled,
            'xApiKey' => $xApiKey,
            'xApiSecret' => $xApiSecret,
            'xAccessToken' => $xAccessToken,
            'xAccessTokenSecret' => $xAccessTokenSecret,
        ],
    ];
}

function socialHttpPostJson(string $url, array $headers, array $payload, int $timeoutSeconds = 18): array {
    $ch = curl_init($url);
    $jsonBody = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($jsonBody === false) {
        throw new RuntimeException('Failed to encode JSON payload.');
    }

    $allHeaders = array_merge(['Content-Type: application/json'], $headers);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HEADER => false,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_TIMEOUT => $timeoutSeconds,
        CURLOPT_CONNECTTIMEOUT => 8,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_HTTPHEADER => $allHeaders,
        CURLOPT_POSTFIELDS => $jsonBody,
    ]);

    $body = curl_exec($ch);
    $curlErrNo = curl_errno($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($curlErrNo !== 0 || $body === false) {
        return ['ok' => false, 'status' => 0, 'body' => '', 'networkError' => true];
    }

    return [
        'ok' => ($status >= 200 && $status < 300),
        'status' => $status,
        'body' => (string)$body,
        'networkError' => false,
    ];
}

function generateGeminiSocialPostPhp(string $apiKey, string $postUrl, string $dateTehran, string $model = 'gemini-2.5-flash'): string {
    $prompt = implode("\n", [
        'Write one funny, catchy promotional post in Persian (Farsi) for Kalambaz, a daily Persian word-guessing game.',
        'Use a playful challenge or exaggerated ragebait hook, varying the wording from day to day (for example: "۹۹٪ بازیکن‌ها نمی‌تونن کلمه‌ی امروز رو حدس بزنن!").',
        "Invite people to guess today's word, but do not reveal or invent the answer. Keep the post under 150 characters, use at most two emojis, and return only the post text.",
        "Today's Tehran date is {$dateTehran}.",
    ]);

    $endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/' . rawurlencode($model) . ':generateContent';
    $res = socialHttpPostJson(
        $endpoint,
        [
            'x-goog-api-key: ' . $apiKey,
            'User-Agent: aistudio-build',
        ],
        [
            'contents' => [
                [
                    'role' => 'user',
                    'parts' => [['text' => $prompt]],
                ],
            ],
        ],
        25
    );

    if ($res['networkError']) {
        throw new RuntimeException('Gemini API request failed to connect.');
    }
    if (!$res['ok']) {
        throw new RuntimeException('Gemini API rejected the request (HTTP ' . $res['status'] . ').');
    }

    $decoded = json_decode($res['body'], true);
    $parts = $decoded['candidates'][0]['content']['parts'] ?? [];
    $textChunks = [];
    if (is_array($parts)) {
        foreach ($parts as $part) {
            if (is_array($part) && isset($part['text']) && is_string($part['text'])) {
                $textChunks[] = $part['text'];
            }
        }
    }
    $text = trim(implode('', $textChunks));

    if ($text === '') {
        throw new RuntimeException('Gemini returned an empty social post.');
    }
    if (mb_strlen($text, 'UTF-8') > 180) {
        throw new RuntimeException('Gemini returned a social post that is too long.');
    }
    $emojiCount = preg_match_all('/\p{Extended_Pictographic}/u', $text);
    if ($emojiCount !== false && $emojiCount > 2) {
        throw new RuntimeException('Gemini returned a social post with too many emojis.');
    }

    if (strpos($text, $postUrl) === false) {
        return $text . "\n" . $postUrl;
    }
    return $text;
}

function buildXOAuth1HeaderPhp(array $xConfig, string $url = KALAMBAZ_X_POSTS_URL, ?string $nonce = null, ?string $timestamp = null): string {
    $oauthParams = [
        'oauth_consumer_key' => $xConfig['xApiKey'],
        'oauth_nonce' => $nonce !== null ? $nonce : bin2hex(random_bytes(16)),
        'oauth_signature_method' => 'HMAC-SHA1',
        'oauth_timestamp' => $timestamp !== null ? $timestamp : (string)time(),
        'oauth_token' => $xConfig['xAccessToken'],
        'oauth_version' => '1.0',
    ];

    $encodedPairs = [];
    foreach ($oauthParams as $k => $v) {
        $encodedPairs[] = [rawurlencode((string)$k), rawurlencode((string)$v)];
    }
    usort($encodedPairs, function (array $a, array $b): int {
        return $a[0] === $b[0] ? strcmp($a[1], $b[1]) : strcmp($a[0], $b[0]);
    });

    $normalizedParts = [];
    foreach ($encodedPairs as $pair) {
        $normalizedParts[] = $pair[0] . '=' . $pair[1];
    }
    $normalizedParams = implode('&', $normalizedParts);

    $signatureBase = implode('&', [
        'POST',
        rawurlencode($url),
        rawurlencode($normalizedParams),
    ]);

    $signingKey = rawurlencode($xConfig['xApiSecret']) . '&' . rawurlencode($xConfig['xAccessTokenSecret']);
    $oauthParams['oauth_signature'] = base64_encode(hash_hmac('sha1', $signatureBase, $signingKey, true));

    ksort($oauthParams, SORT_STRING);
    $headerParts = [];
    foreach ($oauthParams as $k => $v) {
        $headerParts[] = rawurlencode((string)$k) . '="' . rawurlencode((string)$v) . '"';
    }

    return 'OAuth ' . implode(', ', $headerParts);
}

function publishTelegramPostPhp(string $botToken, string $chatId, string $text): void {
    $url = 'https://api.telegram.org/bot' . $botToken . '/sendMessage';
    $res = socialHttpPostJson(
        $url,
        [],
        [
            'chat_id' => $chatId,
            'text' => $text,
            'disable_web_page_preview' => true,
        ],
        15
    );

    if ($res['networkError']) {
        throw new RuntimeException('Telegram request did not return a confirmed response.');
    }

    $decoded = json_decode($res['body'], true);
    if (!$res['ok'] || !is_array($decoded) || ($decoded['ok'] ?? false) !== true) {
        throw new RuntimeException('Telegram rejected the post (HTTP ' . $res['status'] . ').');
    }
}

function publishXPostPhp(array $xConfig, string $text): void {
    $authHeader = buildXOAuth1HeaderPhp($xConfig, KALAMBAZ_X_POSTS_URL);
    $res = socialHttpPostJson(
        KALAMBAZ_X_POSTS_URL,
        ['Authorization: ' . $authHeader],
        ['text' => $text],
        15
    );

    if ($res['networkError']) {
        throw new RuntimeException('X request did not return a confirmed response.');
    }
    if (!$res['ok']) {
        throw new RuntimeException('X rejected the post (HTTP ' . $res['status'] . ').');
    }
}

function dispatchDailySocialPostPhp(PDO $pdo, string $engine, array $socialConfig, string $dateTehran, bool $dryRun = false): array {
    ensureSocialPostTables($pdo, $engine);

    $selectRun = $pdo->prepare('SELECT post_text FROM social_post_runs WHERE date = ?');
    $selectRun->execute([$dateTehran]);
    $run = $selectRun->fetch();

    if (!$run) {
        $generated = trim(generateGeminiSocialPostPhp(
            $socialConfig['geminiApiKey'],
            $socialConfig['postUrl'],
            $dateTehran,
            $socialConfig['geminiModel']
        ));
        if ($generated === '') {
            throw new RuntimeException('The generated social post is empty.');
        }

        if ($dryRun) {
            return [
                'date' => $dateTehran,
                'dryRun' => true,
                'previewText' => $generated,
                'deliveries' => [],
            ];
        }

        $insertRunSql = $engine === 'mysql'
            ? 'INSERT IGNORE INTO social_post_runs (date, post_text, created_at) VALUES (?, ?, ?)'
            : 'INSERT OR IGNORE INTO social_post_runs (date, post_text, created_at) VALUES (?, ?, ?)';
        $insRun = $pdo->prepare($insertRunSql);
        $insRun->execute([$dateTehran, $generated, gmdate('Y-m-d\TH:i:s\Z')]);

        $selectRun->execute([$dateTehran]);
        $run = $selectRun->fetch();
    }

    if (!$run || empty($run['post_text'])) {
        throw new RuntimeException("Could not persist the social post for {$dateTehran}.");
    }

    if ($dryRun) {
        return [
            'date' => $dateTehran,
            'dryRun' => true,
            'previewText' => (string)$run['post_text'],
            'deliveries' => [],
        ];
    }

    $postText = (string)$run['post_text'];
    $targets = [];
    if (!empty($socialConfig['telegramEnabled'])) {
        foreach ($socialConfig['telegramChatIds'] as $idx => $chatId) {
            $targets[] = [
                'name' => 'telegram-' . ($idx + 1),
                'publish' => function () use ($socialConfig, $chatId, $postText): void {
                    publishTelegramPostPhp($socialConfig['telegramBotToken'], $chatId, $postText);
                },
            ];
        }
    }
    if (!empty($socialConfig['xEnabled'])) {
        $targets[] = [
            'name' => 'x',
            'publish' => function () use ($socialConfig, $postText): void {
                publishXPostPhp($socialConfig, $postText);
            },
        ];
    }

    $insertDeliverySql = $engine === 'mysql'
        ? 'INSERT IGNORE INTO social_post_deliveries (date, target, status, error, updated_at) VALUES (?, ?, ?, NULL, ?)'
        : 'INSERT OR IGNORE INTO social_post_deliveries (date, target, status, error, updated_at) VALUES (?, ?, ?, NULL, ?)';
    $insertDelivery = $pdo->prepare($insertDeliverySql);
    $claimDelivery = $pdo->prepare(
        "UPDATE social_post_deliveries SET status = 'sending', error = NULL, updated_at = ? WHERE date = ? AND target = ? AND status = 'pending'"
    );
    $finishDelivery = $pdo->prepare(
        'UPDATE social_post_deliveries SET status = ?, error = ?, updated_at = ? WHERE date = ? AND target = ? AND status = ?'
    );

    foreach ($targets as $target) {
        $nowIso = gmdate('Y-m-d\TH:i:s\Z');
        $insertDelivery->execute([$dateTehran, $target['name'], 'pending', $nowIso]);
        $claimDelivery->execute([$nowIso, $dateTehran, $target['name']]);
        if ($claimDelivery->rowCount() === 0) {
            continue;
        }

        try {
            $target['publish']();
            $finishDelivery->execute(['sent', null, gmdate('Y-m-d\TH:i:s\Z'), $dateTehran, $target['name'], 'sending']);
        } catch (Throwable $e) {
            $finishDelivery->execute(['failed', $e->getMessage(), gmdate('Y-m-d\TH:i:s\Z'), $dateTehran, $target['name'], 'sending']);
        }
    }

    $rowsStmt = $pdo->prepare('SELECT target, status, error FROM social_post_deliveries WHERE date = ? ORDER BY target');
    $rowsStmt->execute([$dateTehran]);
    $rows = $rowsStmt->fetchAll();

    $deliveries = [];
    foreach ($rows as $row) {
        $item = [
            'target' => $row['target'],
            'status' => ($row['status'] === 'sent' || $row['status'] === 'failed') ? $row['status'] : 'skipped',
        ];
        if (!empty($row['error'])) {
            $item['error'] = $row['error'];
        }
        $deliveries[] = $item;
    }

    return [
        'date' => $dateTehran,
        'deliveries' => $deliveries,
    ];
}
