<?php
/**
 * Kalambaz Daily Social Post Dispatcher — cPanel Cron Job Script
 *
 * Generates one funny Persian daily promotion with Gemini and publishes it to
 * your configured Telegram channel(s) and X account (idempotent per Tehran day).
 *
 * Recommended cPanel Cron Job (daily at 09:00 Tehran time, adjust for server timezone):
 *   php /home/YOUR_CPANEL_USER/public_html/api/send-daily-social.php
 *
 * Safe preview without posting publicly or writing to DB:
 *   php /home/YOUR_CPANEL_USER/public_html/api/send-daily-social.php --dry-run
 *
 * Put your private keys in /public_html/api/social-config.php (outside GitHub)
 * using /public_html/api/social-config.example.php as a template.
 */

require_once __DIR__ . '/social-posts-lib.php';

$isCli = (PHP_SAPI === 'cli');

$dbConfigPath = __DIR__ . '/db-config.php';
$dbConfig = file_exists($dbConfigPath) ? require $dbConfigPath : [];
if (!is_array($dbConfig)) {
    $dbConfig = [];
}

$socialConfigPath = __DIR__ . '/social-config.php';
$socialConfigFile = file_exists($socialConfigPath) ? require $socialConfigPath : [];
if (!is_array($socialConfigFile)) {
    $socialConfigFile = [];
}

$mergedConfig = array_merge($dbConfig, $socialConfigFile);

if (!$isCli) {
    header('Content-Type: application/json; charset=utf-8');
    $expectedSecret = trim((string)($mergedConfig['SOCIAL_CRON_SECRET'] ?? $mergedConfig['PUSH_CRON_SECRET'] ?? getenv('SOCIAL_CRON_SECRET') ?: ''));
    $providedSecret = trim((string)($_SERVER['HTTP_X_SOCIAL_CRON_SECRET'] ?? ''));

    if ($expectedSecret === '') {
        http_response_code(403);
        echo json_encode([
            'ok' => false,
            'error' => 'HTTP trigger is disabled until SOCIAL_CRON_SECRET is set in api/social-config.php. Use cPanel CLI Cron instead.',
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($providedSecret === '' || !hash_equals($expectedSecret, $providedSecret)) {
        http_response_code(401);
        echo json_encode(['ok' => false, 'error' => 'Unauthorized cron trigger.'], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

$args = $isCli && isset($argv) ? $argv : [];
$dryRun = $isCli && in_array('--dry-run', $args, true);

try {
    $loaded = loadSocialPostConfig($mergedConfig);
    if (!$loaded['ready']) {
        $out = [
            'ok' => false,
            'disabled' => true,
            'message' => 'Daily social posts are disabled; missing required credentials in api/social-config.php.',
            'missing' => $loaded['missing'],
        ];
        if (!$isCli) {
            http_response_code(503);
        }
        echo json_encode($out, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . PHP_EOL;
        exit(0);
    }

    $dbHost = trim((string)($dbConfig['DB_HOST'] ?? 'localhost'));
    $dbPort = trim((string)($dbConfig['DB_PORT'] ?? '3306'));
    $dbName = trim((string)($dbConfig['DB_NAME'] ?? ''));
    $dbUser = trim((string)($dbConfig['DB_USER'] ?? ''));
    $dbPass = (string)($dbConfig['DB_PASS'] ?? '');

    if ($dbName !== '' && $dbUser !== '') {
        $dsn = "mysql:host={$dbHost};port={$dbPort};dbname={$dbName};charset=utf8mb4";
        $pdo = new PDO($dsn, $dbUser, $dbPass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        $engine = 'mysql';
    } else {
        $storageDir = __DIR__ . '/storage';
        if (!is_dir($storageDir)) {
            @mkdir($storageDir, 0755, true);
        }
        $sqlitePath = $storageDir . '/kalambaz.sqlite';
        $pdo = new PDO('sqlite:' . $sqlitePath, null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        $engine = 'sqlite';
    }

    $tehranTz = new DateTimeZone('Asia/Tehran');
    $todayTehran = (new DateTimeImmutable('now', $tehranTz))->format('Y-m-d');

    $result = dispatchDailySocialPostPhp($pdo, $engine, $loaded['config'], $todayTehran, $dryRun);
    $summary = array_merge(['ok' => true, 'engine' => $engine], $result);
    if (!empty($loaded['missing'])) {
        $summary['unconfiguredOptionalOrSecondary'] = $loaded['missing'];
    }

    echo json_encode($summary, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . PHP_EOL;
} catch (Throwable $e) {
    if (!$isCli) {
        http_response_code(500);
    }
    echo json_encode([
        'ok' => false,
        'error' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . PHP_EOL;
    exit(1);
}
