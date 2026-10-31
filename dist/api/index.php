<?php
/**
 * Kalambaz (کلمه‌باز) — Production PHP API Backend for cPanel (MySQL & SQLite)
 * Supports:
 *   GET  /api/health
 *   POST /api/auth/signup
 *   POST /api/auth/login
 *   GET  /api/auth/me
 *   PUT  /api/user/sync
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function sendJson(int $status, array $payload): void {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function getDefaultStats(): array {
    return [
        'gamesPlayed' => 0,
        'gamesWon' => 0,
        'currentStreak' => 0,
        'maxStreak' => 0,
        'lastPlayedDate' => '',
        'guessDistribution' => [
            '1' => 0,
            '2' => 0,
            '3' => 0,
            '4' => 0,
            '5' => 0,
            '6' => 0,
        ],
    ];
}

function getDatabaseConnection(): array {
    $configPath = __DIR__ . '/db-config.php';
    $config = file_exists($configPath) ? require $configPath : [];

    $dbHost = trim((string)($config['DB_HOST'] ?? 'localhost'));
    $dbPort = trim((string)($config['DB_PORT'] ?? '3306'));
    $dbName = trim((string)($config['DB_NAME'] ?? ''));
    $dbUser = trim((string)($config['DB_USER'] ?? ''));
    $dbPass = (string)($config['DB_PASS'] ?? '');

    if ($dbName !== '' && $dbUser !== '') {
        $dsn = "mysql:host={$dbHost};port={$dbPort};dbname={$dbName};charset=utf8mb4";
        $pdo = new PDO($dsn, $dbUser, $dbPass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);

        $pdo->exec("
            CREATE TABLE IF NOT EXISTS users (
                username VARCHAR(64) PRIMARY KEY,
                password_hash VARCHAR(255) NOT NULL,
                session_token VARCHAR(128) DEFAULT NULL,
                stats_json LONGTEXT NOT NULL,
                game_states_json LONGTEXT NOT NULL,
                created_at VARCHAR(40) NOT NULL,
                updated_at VARCHAR(40) NOT NULL,
                INDEX idx_users_session_token (session_token)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        return [$pdo, 'mysql'];
    }

    // Automatic fallback to SQLite in api/storage/ if MySQL is not configured yet
    $storageDir = __DIR__ . '/storage';
    if (!is_dir($storageDir)) {
        @mkdir($storageDir, 0755, true);
    }
    $htaccessPath = $storageDir . '/.htaccess';
    if (!file_exists($htaccessPath)) {
        @file_put_contents($htaccessPath, "Deny from all\n");
    }

    $sqlitePath = $storageDir . '/kalambaz.sqlite';
    $pdo = new PDO('sqlite:' . $sqlitePath, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            password_hash TEXT NOT NULL,
            session_token TEXT,
            stats_json TEXT NOT NULL,
            game_states_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_users_session_token ON users(session_token);
    ");

    return [$pdo, 'sqlite'];
}

function getBearerToken(): string {
    $authHeader = '';
    if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    } elseif (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    } elseif (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        foreach ($headers as $key => $val) {
            if (strtolower($key) === 'authorization') {
                $authHeader = $val;
                break;
            }
        }
    }

    if (stripos($authHeader, 'Bearer ') === 0) {
        return trim(substr($authHeader, 7));
    }
    return '';
}

function formatUserAccount(array $row): array {
    $defaultStats = getDefaultStats();
    $decodedStats = json_decode($row['stats_json'] ?? '{}', true);
    $stats = is_array($decodedStats) ? array_replace_recursive($defaultStats, $decodedStats) : $defaultStats;

    $decodedStates = json_decode($row['game_states_json'] ?? '{}', true);
    $gameStates = is_array($decodedStates) ? $decodedStates : new stdClass();

    return [
        'username' => $row['username'],
        'stats' => $stats,
        'gameStates' => $gameStates,
        'createdAt' => $row['created_at'],
    ];
}

try {
    [$pdo, $engine] = getDatabaseConnection();
} catch (Throwable $e) {
    sendJson(500, [
        'error' => 'خطا در اتصال به دیتابیس هاست. لطفاً تنظیمات فایل api/db-config.php را بررسی کنید.',
    ]);
}

$route = isset($_GET['route']) ? trim((string)$_GET['route'], '/') : '';
if ($route === '') {
    $uriPath = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?: '';
    if (preg_match('#/api/(.*)$#', $uriPath, $matches)) {
        $route = trim($matches[1], '/');
    }
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$rawBody = file_get_contents('php://input');
$body = json_decode($rawBody ?: '{}', true);
if (!is_array($body)) {
    $body = [];
}

// 1. GET /api/health
if ($route === 'health' && $method === 'GET') {
    $stmt = $pdo->query('SELECT COUNT(*) AS cnt FROM users');
    $row = $stmt->fetch();
    sendJson(200, [
        'status' => 'ok',
        'engine' => $engine,
        'totalUsers' => (int)($row['cnt'] ?? 0),
    ]);
}

// 2. POST /api/auth/signup
if ($route === 'auth/signup' && $method === 'POST') {
    $username = isset($body['username']) && is_string($body['username']) ? trim($body['username']) : '';
    $password = isset($body['password']) && is_string($body['password']) ? $body['password'] : '';

    if ($username === '' || mb_strlen($username, 'UTF-8') < 2) {
        sendJson(400, ['error' => 'نام کاربری باید حداقل ۲ نویسه باشد.']);
    }
    if (mb_strlen($username, 'UTF-8') > 30) {
        sendJson(400, ['error' => 'نام کاربری نمی‌تواند بیشتر از ۳۰ نویسه باشد.']);
    }
    if ($password === '' || mb_strlen($password, 'UTF-8') < 4) {
        sendJson(400, ['error' => 'رمز عبور باید حداقل ۴ نویسه باشد.']);
    }

    $checkStmt = $pdo->prepare('SELECT username FROM users WHERE username = ?');
    $checkStmt->execute([$username]);
    if ($checkStmt->fetch()) {
        sendJson(409, ['error' => 'این نام کاربری قبلاً ثبت شده است. لطفاً وارد شوید.']);
    }

    $now = gmdate('Y-m-d\TH:i:s\Z');
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    $sessionToken = bin2hex(random_bytes(32));

    $defaultStats = getDefaultStats();
    $initialStats = isset($body['stats']) && is_array($body['stats'])
        ? array_replace_recursive($defaultStats, $body['stats'])
        : $defaultStats;
    $initialGameStates = isset($body['gameStates']) && is_array($body['gameStates'])
        ? $body['gameStates']
        : new stdClass();

    $insertStmt = $pdo->prepare('
        INSERT INTO users (username, password_hash, session_token, stats_json, game_states_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ');
    $insertStmt->execute([
        $username,
        $passwordHash,
        $sessionToken,
        json_encode($initialStats, JSON_UNESCAPED_UNICODE),
        json_encode($initialGameStates, JSON_UNESCAPED_UNICODE),
        $now,
        $now,
    ]);

    $fetchStmt = $pdo->prepare('SELECT * FROM users WHERE username = ?');
    $fetchStmt->execute([$username]);
    $createdRow = $fetchStmt->fetch();

    sendJson(201, [
        'account' => formatUserAccount($createdRow),
        'token' => $sessionToken,
    ]);
}

// 3. POST /api/auth/login
if ($route === 'auth/login' && $method === 'POST') {
    $username = isset($body['username']) && is_string($body['username']) ? trim($body['username']) : '';
    $password = isset($body['password']) && is_string($body['password']) ? $body['password'] : '';

    if ($username === '') {
        sendJson(400, ['error' => 'لطفاً نام کاربری را وارد کنید.']);
    }
    if ($password === '') {
        sendJson(400, ['error' => 'لطفاً رمز عبور را وارد کنید.']);
    }

    $stmt = $pdo->prepare('SELECT * FROM users WHERE username = ?');
    $stmt->execute([$username]);
    $userRow = $stmt->fetch();

    if (!$userRow) {
        sendJson(404, ['error' => 'حساب کاربری با این نام یافت نشد. می‌توانید ثبت‌نام کنید.']);
    }

    if (!password_verify($password, $userRow['password_hash'])) {
        sendJson(401, ['error' => 'رمز عبور وارد شده نادرست است.']);
    }

    $sessionToken = !empty($userRow['session_token']) ? $userRow['session_token'] : bin2hex(random_bytes(32));
    $now = gmdate('Y-m-d\TH:i:s\Z');

    $updStmt = $pdo->prepare('UPDATE users SET session_token = ?, updated_at = ? WHERE username = ?');
    $updStmt->execute([$sessionToken, $now, $username]);

    sendJson(200, [
        'account' => formatUserAccount($userRow),
        'token' => $sessionToken,
    ]);
}

// 4. GET /api/auth/me
if ($route === 'auth/me' && $method === 'GET') {
    $token = getBearerToken();
    if ($token === '') {
        sendJson(401, ['error' => 'توکن احراز هویت یافت نشد.']);
    }

    $stmt = $pdo->prepare('SELECT * FROM users WHERE session_token = ?');
    $stmt->execute([$token]);
    $userRow = $stmt->fetch();

    if (!$userRow) {
        sendJson(401, ['error' => 'نشست کاربری معتبر نیست.']);
    }

    sendJson(200, [
        'account' => formatUserAccount($userRow),
    ]);
}

// 5. PUT /api/user/sync
if ($route === 'user/sync' && ($method === 'PUT' || $method === 'POST')) {
    $token = getBearerToken();
    if ($token === '') {
        sendJson(401, ['error' => 'توکن احراز هویت یافت نشد.']);
    }

    $stmt = $pdo->prepare('SELECT * FROM users WHERE session_token = ?');
    $stmt->execute([$token]);
    $userRow = $stmt->fetch();

    if (!$userRow) {
        sendJson(401, ['error' => 'نشست کاربری معتبر نیست.']);
    }

    $defaultStats = getDefaultStats();
    $updatedStats = isset($body['stats']) && is_array($body['stats'])
        ? array_replace_recursive($defaultStats, $body['stats'])
        : json_decode($userRow['stats_json'], true);

    $updatedGameStates = isset($body['gameStates']) && is_array($body['gameStates'])
        ? $body['gameStates']
        : json_decode($userRow['game_states_json'], true);

    $now = gmdate('Y-m-d\TH:i:s\Z');
    $updStmt = $pdo->prepare('
        UPDATE users SET stats_json = ?, game_states_json = ?, updated_at = ? WHERE username = ?
    ');
    $updStmt->execute([
        json_encode($updatedStats, JSON_UNESCAPED_UNICODE),
        json_encode($updatedGameStates, JSON_UNESCAPED_UNICODE),
        $now,
        $userRow['username'],
    ]);

    $freshStmt = $pdo->prepare('SELECT * FROM users WHERE username = ?');
    $freshStmt->execute([$userRow['username']]);
    $freshRow = $freshStmt->fetch();

    sendJson(200, [
        'ok' => true,
        'account' => formatUserAccount($freshRow),
    ]);
}

sendJson(404, ['error' => 'مسیر API یافت نشد.']);
