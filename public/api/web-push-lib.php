<?php
/**
 * Kalambaz Web Push (VAPID RFC 8292) Library for cPanel PHP (OpenSSL + cURL)
 * Zero external Composer packages required.
 */

function pushBase64UrlEncode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function pushBase64UrlDecode(string $data): string {
    $norm = strtr($data, '-_', '+/');
    $pad = strlen($norm) % 4;
    if ($pad > 0) {
        $norm .= str_repeat('=', 4 - $pad);
    }
    $decoded = base64_decode($norm, true);
    return $decoded === false ? '' : $decoded;
}

function ensurePushTables(PDO $pdo, string $engine): void {
    if ($engine === 'mysql') {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS app_settings (
                setting_key VARCHAR(64) PRIMARY KEY,
                setting_value LONGTEXT NOT NULL,
                updated_at VARCHAR(40) NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS push_subscriptions (
                endpoint_hash CHAR(64) PRIMARY KEY,
                endpoint TEXT NOT NULL,
                p256dh VARCHAR(255) NOT NULL,
                auth VARCHAR(128) NOT NULL,
                username VARCHAR(64) DEFAULT NULL,
                created_at VARCHAR(40) NOT NULL,
                updated_at VARCHAR(40) NOT NULL,
                last_pushed_date VARCHAR(20) DEFAULT NULL,
                INDEX idx_push_username (username),
                INDEX idx_push_last_date (last_pushed_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");
    } else {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS app_settings (
                setting_key TEXT PRIMARY KEY,
                setting_value TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS push_subscriptions (
                endpoint_hash TEXT PRIMARY KEY,
                endpoint TEXT NOT NULL,
                p256dh TEXT NOT NULL,
                auth TEXT NOT NULL,
                username TEXT DEFAULT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                last_pushed_date TEXT DEFAULT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_push_username ON push_subscriptions(username);
            CREATE INDEX IF NOT EXISTS idx_push_last_date ON push_subscriptions(last_pushed_date);
        ");
    }
}

/**
 * Validate Web Push subscription endpoint against a strict HTTPS allowlist of real push services.
 */
function validatePushEndpointUrl($rawEndpoint): array {
    if (!is_string($rawEndpoint)) {
        return ['valid' => false, 'error' => 'آدرس اشتراک اعلان نامعتبر است.'];
    }
    $endpoint = trim($rawEndpoint);
    if ($endpoint === '' || strlen($endpoint) > 2048) {
        return ['valid' => false, 'error' => 'طول آدرس اشتراک اعلان نامعتبر است.'];
    }

    $parts = parse_url($endpoint);
    if (!is_array($parts)) {
        return ['valid' => false, 'error' => 'فرمت آدرس اشتراک اعلان نامعتبر است.'];
    }

    $scheme = strtolower((string)($parts['scheme'] ?? ''));
    $host = strtolower((string)($parts['host'] ?? ''));
    $port = $parts['port'] ?? null;

    if ($scheme !== 'https') {
        return ['valid' => false, 'error' => 'آدرس اعلان باید از نوع HTTPS باشد.'];
    }
    if (!empty($parts['user']) || !empty($parts['pass'])) {
        return ['valid' => false, 'error' => 'آدرس اعلان نباید شامل اطلاعات ورود باشد.'];
    }
    if ($port !== null && (int)$port !== 443) {
        return ['valid' => false, 'error' => 'پورت آدرس اعلان مجاز نیست.'];
    }
    if (
        $host === '' ||
        $host === 'localhost' ||
        !preg_match('/^[a-z0-9.-]+$/', $host) ||
        filter_var($host, FILTER_VALIDATE_IP) !== false
    ) {
        return ['valid' => false, 'error' => 'میزبان آدرس اعلان مجاز نیست.'];
    }

    $exactHosts = [
        'fcm.googleapis.com',
        'android.googleapis.com',
        'updates.push.services.mozilla.com',
        'push.services.mozilla.com',
        'web.push.apple.com',
    ];
    $suffixes = [
        '.push.services.mozilla.com',
        '.notify.windows.com',
        '.push.apple.com',
    ];

    $allowed = in_array($host, $exactHosts, true);
    if (!$allowed) {
        foreach ($suffixes as $suffix) {
            $suffixLen = strlen($suffix);
            if (strlen($host) > $suffixLen && substr($host, -$suffixLen) === $suffix) {
                $allowed = true;
                break;
            }
        }
    }

    if (!$allowed) {
        return ['valid' => false, 'error' => 'سرویس‌دهنده اعلان پشتیبانی نمی‌شود.'];
    }

    return [
        'valid' => true,
        'endpoint' => $endpoint,
        'origin' => 'https://' . $host,
    ];
}

function validatePushKeys($rawP256dh, $rawAuth): array {
    if (!is_string($rawP256dh) || !is_string($rawAuth)) {
        return ['valid' => false, 'error' => 'کلیدهای رمزنگاری اعلان ناقص است.'];
    }
    $p256dh = trim($rawP256dh);
    $auth = trim($rawAuth);

    if (!preg_match('/^[A-Za-z0-9_-]{40,200}$/', $p256dh) || !preg_match('/^[A-Za-z0-9_-]{16,64}$/', $auth)) {
        return ['valid' => false, 'error' => 'فرمت کلیدهای اشتراک اعلان نامعتبر است.'];
    }

    $p256Raw = pushBase64UrlDecode($p256dh);
    $authRaw = pushBase64UrlDecode($auth);

    if (strlen($p256Raw) !== 65 || ord($p256Raw[0]) !== 0x04) {
        return ['valid' => false, 'error' => 'کلید عمومی دستگاه برای اعلان نامعتبر است.'];
    }
    if (strlen($authRaw) !== 16) {
        return ['valid' => false, 'error' => 'کلید احراز دستگاه برای اعلان نامعتبر است.'];
    }

    return [
        'valid' => true,
        'p256dh' => $p256dh,
        'auth' => $auth,
    ];
}

/**
 * Load or auto-generate persistent ECDSA P-256 VAPID keys stored securely in app_settings.
 */
function getOrCreateVapidKeys(PDO $pdo, array $config = []): array {
    $envPub = trim((string)($config['VAPID_PUBLIC_KEY'] ?? getenv('VAPID_PUBLIC_KEY') ?: ''));
    $envPriv = trim((string)($config['VAPID_PRIVATE_PEM'] ?? getenv('VAPID_PRIVATE_PEM') ?: ''));
    $subject = trim((string)($config['VAPID_SUBJECT'] ?? getenv('VAPID_SUBJECT') ?: 'mailto:justhawkstuff@gmail.com'));

    if ($envPub !== '' && $envPriv !== '') {
        return [
            'publicKey' => $envPub,
            'privateKeyPem' => $envPriv,
            'subject' => $subject,
        ];
    }

    $stmt = $pdo->prepare('SELECT setting_key, setting_value FROM app_settings WHERE setting_key IN (?, ?)');
    $stmt->execute(['vapid_public_key', 'vapid_private_pem']);
    $rows = $stmt->fetchAll();

    $storedPub = '';
    $storedPriv = '';
    foreach ($rows as $row) {
        if ($row['setting_key'] === 'vapid_public_key') {
            $storedPub = (string)$row['setting_value'];
        } elseif ($row['setting_key'] === 'vapid_private_pem') {
            $storedPriv = (string)$row['setting_value'];
        }
    }

    if ($storedPub !== '' && $storedPriv !== '') {
        return [
            'publicKey' => $storedPub,
            'privateKeyPem' => $storedPriv,
            'subject' => $subject,
        ];
    }

    // Generate new P-256 keypair with PHP OpenSSL
    $keyRes = openssl_pkey_new([
        'curve_name' => 'prime256v1',
        'private_key_type' => OPENSSL_KEYTYPE_EC,
    ]);
    if ($keyRes === false) {
        throw new RuntimeException('OpenSSL failed to generate prime256v1 VAPID keypair.');
    }

    $privatePem = '';
    if (!openssl_pkey_export($keyRes, $privatePem)) {
        throw new RuntimeException('OpenSSL failed to export VAPID private key.');
    }

    $details = openssl_pkey_get_details($keyRes);
    if (!is_array($details) || empty($details['ec']['x']) || empty($details['ec']['y'])) {
        throw new RuntimeException('OpenSSL failed to read EC public key coordinates.');
    }

    $x = str_pad($details['ec']['x'], 32, "\x00", STR_PAD_LEFT);
    $y = str_pad($details['ec']['y'], 32, "\x00", STR_PAD_LEFT);
    $publicKey = pushBase64UrlEncode("\x04" . $x . $y);

    $now = gmdate('Y-m-d\TH:i:s\Z');
    $upsert = $pdo->prepare('DELETE FROM app_settings WHERE setting_key IN (?, ?)');
    $upsert->execute(['vapid_public_key', 'vapid_private_pem']);

    $ins = $pdo->prepare('INSERT INTO app_settings (setting_key, setting_value, updated_at) VALUES (?, ?, ?)');
    $ins->execute(['vapid_public_key', $publicKey, $now]);
    $ins->execute(['vapid_private_pem', $privatePem, $now]);

    return [
        'publicKey' => $publicKey,
        'privateKeyPem' => $privatePem,
        'subject' => $subject,
    ];
}

/**
 * Convert ASN.1 DER ECDSA signature to 64-byte raw IEEE P1363 (r || s) for ES256 JWT.
 */
function derSignatureToRawRS(string $der): string {
    $offset = 0;
    if (ord($der[$offset++]) !== 0x30) {
        throw new RuntimeException('Invalid DER signature header');
    }
    $seqLen = ord($der[$offset++]);
    if (($seqLen & 0x80) !== 0) {
        $offset += ($seqLen & 0x7f);
    }

    if (ord($der[$offset++]) !== 0x02) {
        throw new RuntimeException('Invalid DER integer tag for r');
    }
    $rLen = ord($der[$offset++]);
    $r = substr($der, $offset, $rLen);
    $offset += $rLen;

    if (ord($der[$offset++]) !== 0x02) {
        throw new RuntimeException('Invalid DER integer tag for s');
    }
    $sLen = ord($der[$offset++]);
    $s = substr($der, $offset, $sLen);

    if (strlen($r) > 32) {
        $r = substr($r, -32);
    }
    if (strlen($s) > 32) {
        $s = substr($s, -32);
    }

    return str_pad($r, 32, "\x00", STR_PAD_LEFT) . str_pad($s, 32, "\x00", STR_PAD_LEFT);
}

/**
 * Create RFC 8292 VAPID Authorization header.
 */
function buildVapidAuthHeader(string $audienceOrigin, array $vapid): string {
    $headerB64 = pushBase64UrlEncode(json_encode(['typ' => 'JWT', 'alg' => 'ES256']));
    $payloadB64 = pushBase64UrlEncode(json_encode([
        'aud' => $audienceOrigin,
        'exp' => time() + (12 * 3600),
        'sub' => $vapid['subject'],
    ]));

    $signingInput = $headerB64 . '.' . $payloadB64;
    $derSig = '';
    if (!openssl_sign($signingInput, $derSig, $vapid['privateKeyPem'], OPENSSL_ALGO_SHA256)) {
        throw new RuntimeException('OpenSSL failed to sign VAPID JWT.');
    }

    $rawSigB64 = pushBase64UrlEncode(derSignatureToRawRS($derSig));
    return 'vapid t=' . $signingInput . '.' . $rawSigB64 . ', k=' . $vapid['publicKey'];
}

/**
 * Send a standards-compliant VAPID-signed Web Push wake notification via cURL.
 */
function dispatchWebPushWakeup(string $endpoint, array $vapid, int $ttlSeconds = 86400): array {
    $check = validatePushEndpointUrl($endpoint);
    if (!$check['valid']) {
        return ['ok' => false, 'status' => 400, 'expired' => true];
    }

    $authHeader = buildVapidAuthHeader($check['origin'], $vapid);
    $ch = curl_init($check['endpoint']);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HEADER => false,
        CURLOPT_TIMEOUT => 12,
        CURLOPT_CONNECTTIMEOUT => 6,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_POSTFIELDS => '',
        CURLOPT_HTTPHEADER => [
            'TTL: ' . $ttlSeconds,
            'Urgency: normal',
            'Authorization: ' . $authHeader,
            'Content-Length: 0',
        ],
    ]);

    curl_exec($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $expired = ($status === 404 || $status === 410);
    return [
        'ok' => ($status >= 200 && $status < 300),
        'status' => $status,
        'expired' => $expired,
    ];
}
