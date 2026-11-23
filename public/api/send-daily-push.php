<?php
/**
 * Kalambaz Daily Web Push Sender — cPanel Cron Job Script
 *
 * Recommended cPanel Cron Job (daily at 00:05 Tehran time, or any hour you prefer):
 *   php /home/YOUR_CPANEL_USER/public_html/api/send-daily-push.php
 *
 * Optional evening reminder (only notifies users who haven't won all 3 puzzles today):
 *   php /home/YOUR_CPANEL_USER/public_html/api/send-daily-push.php --only-unsolved --force
 */

require_once __DIR__ . '/web-push-lib.php';

$isCli = (PHP_SAPI === 'cli');
$configPath = __DIR__ . '/db-config.php';
$config = file_exists($configPath) ? require $configPath : [];

if (!$isCli) {
    header('Content-Type: application/json; charset=utf-8');
    $expectedSecret = trim((string)($config['PUSH_CRON_SECRET'] ?? getenv('PUSH_CRON_SECRET') ?: ''));
    $providedSecret = trim((string)($_SERVER['HTTP_X_PUSH_CRON_SECRET'] ?? ''));

    if ($expectedSecret === '') {
        http_response_code(403);
        echo json_encode([
            'error' => 'HTTP trigger is disabled until PUSH_CRON_SECRET is set in api/db-config.php. Use cPanel CLI Cron instead.',
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($providedSecret === '' || !hash_equals($expectedSecret, $providedSecret)) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized cron trigger.'], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

$args = $isCli && isset($argv) ? $argv : [];
$onlyUnsolved = in_array('--only-unsolved', $args, true) || (!$isCli && isset($_GET['only_unsolved']) && $_GET['only_unsolved'] === '1');
$forceResend = in_array('--force', $args, true) || (!$isCli && isset($_GET['force']) && $_GET['force'] === '1');

try {
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
        $engine = 'mysql';
    } else {
        $sqlitePath = __DIR__ . '/storage/kalambaz.sqlite';
        $pdo = new PDO('sqlite:' . $sqlitePath, null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        $engine = 'sqlite';
    }

    ensurePushTables($pdo, $engine);
    $vapid = getOrCreateVapidKeys($pdo, $config);

    $tehranTz = new DateTimeZone('Asia/Tehran');
    $todayTehran = (new DateTimeImmutable('now', $tehranTz))->format('Y-m-d');

    if ($forceResend) {
        $stmt = $pdo->query('SELECT endpoint_hash, endpoint, username, last_pushed_date FROM push_subscriptions');
    } else {
        $stmt = $pdo->prepare('SELECT endpoint_hash, endpoint, username, last_pushed_date FROM push_subscriptions WHERE last_pushed_date IS NULL OR last_pushed_date != ?');
        $stmt->execute([$todayTehran]);
    }
    $subs = $stmt->fetchAll();

    $userStmt = $pdo->prepare('SELECT game_states_json FROM users WHERE username = ?');
    $markStmt = $pdo->prepare('UPDATE push_subscriptions SET last_pushed_date = ?, updated_at = ? WHERE endpoint_hash = ?');
    $delStmt = $pdo->prepare('DELETE FROM push_subscriptions WHERE endpoint_hash = ?');

    $sent = 0;
    $pruned = 0;
    $skipped = 0;
    $failed = 0;
    $nowIso = gmdate('Y-m-d\TH:i:s\Z');

    foreach ($subs as $sub) {
        if ($onlyUnsolved && !empty($sub['username'])) {
            $userStmt->execute([$sub['username']]);
            $uRow = $userStmt->fetch();
            if ($uRow && !empty($uRow['game_states_json'])) {
                $states = json_decode($uRow['game_states_json'], true);
                if (is_array($states)) {
                    $allWonToday = true;
                    foreach (['4', '5', '6'] as $lenKey) {
                        $st = $states[$lenKey] ?? null;
                        if (!is_array($st) || ($st['dateKey'] ?? '') !== $todayTehran || ($st['status'] ?? '') !== 'won') {
                            $allWonToday = false;
                            break;
                        }
                    }
                    if ($allWonToday) {
                        $skipped++;
                        continue;
                    }
                }
            }
        }

        $res = dispatchWebPushWakeup($sub['endpoint'], $vapid, 86400);
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

    $summary = [
        'ok' => true,
        'dateTehran' => $todayTehran,
        'totalChecked' => count($subs),
        'sent' => $sent,
        'skipped' => $skipped,
        'pruned' => $pruned,
        'failed' => $failed,
    ];

    echo json_encode($summary, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . PHP_EOL;
} catch (Throwable $e) {
    if (!$isCli) {
        http_response_code(500);
    }
    echo json_encode([
        'ok' => false,
        'error' => 'Failed to dispatch daily push notifications.',
    ], JSON_UNESCAPED_UNICODE) . PHP_EOL;
    exit(1);
}
