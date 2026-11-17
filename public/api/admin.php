<?php
/**
 * Kalambaz (کلمباز) — Admin Panel for Managing User Points & Streaks
 * URL: https://yourdomain.com/api/admin.php
 *
 * Authentication:
 * Uses `ADMIN_PASSWORD` from `api/db-config.php` (or `DB_PASS` if `ADMIN_PASSWORD` is empty).
 */

session_start();

$configPath = __DIR__ . '/db-config.php';
$config = file_exists($configPath) ? require $configPath : [];

$dbHost = trim((string)($config['DB_HOST'] ?? 'localhost'));
$dbPort = trim((string)($config['DB_PORT'] ?? '3306'));
$dbName = trim((string)($config['DB_NAME'] ?? ''));
$dbUser = trim((string)($config['DB_USER'] ?? ''));
$dbPass = (string)($config['DB_PASS'] ?? '');
$adminPass = trim((string)($config['ADMIN_PASSWORD'] ?? ''));
if ($adminPass === '') {
    $adminPass = $dbPass !== '' ? $dbPass : 'kalambaz_admin';
}

function getAdminPdo(string $dbHost, string $dbPort, string $dbName, string $dbUser, string $dbPass): PDO {
    if ($dbName !== '' && $dbUser !== '') {
        $dsn = "mysql:host={$dbHost};port={$dbPort};dbname={$dbName};charset=utf8mb4";
        return new PDO($dsn, $dbUser, $dbPass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }
    $sqlitePath = __DIR__ . '/storage/kalambaz.sqlite';
    return new PDO('sqlite:' . $sqlitePath, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
}

if (isset($_GET['logout'])) {
    unset($_SESSION['kalambaz_admin_auth']);
    header('Location: admin.php');
    exit;
}

$loginError = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['admin_password'])) {
    if (hash_equals($adminPass, (string)$_POST['admin_password'])) {
        $_SESSION['kalambaz_admin_auth'] = true;
        header('Location: admin.php');
        exit;
    } else {
        $loginError = 'رمز عبور مدیریت نادرست است.';
    }
}

$isAuthed = !empty($_SESSION['kalambaz_admin_auth']);
$flashMessage = '';
$flashError = '';

if ($isAuthed) {
    try {
        $pdo = getAdminPdo($dbHost, $dbPort, $dbName, $dbUser, $dbPass);

        if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'update_user') {
            $targetUser = trim((string)($_POST['username'] ?? ''));
            $newPoints = max(0, (int)($_POST['points'] ?? 0));
            $addPoints = (int)($_POST['add_points'] ?? 0);
            $newStreak = max(0, (int)($_POST['current_streak'] ?? 0));
            $newMaxStreak = max($newStreak, (int)($_POST['max_streak'] ?? 0));

            $stmt = $pdo->prepare('SELECT * FROM users WHERE username = ?');
            $stmt->execute([$targetUser]);
            $row = $stmt->fetch();

            if ($row) {
                $stats = json_decode($row['stats_json'] ?? '{}', true);
                if (!is_array($stats)) {
                    $stats = [];
                }
                $finalPoints = max(0, $newPoints + $addPoints);
                $stats['points'] = $finalPoints;
                $stats['currentStreak'] = $newStreak;
                $stats['maxStreak'] = $newMaxStreak;
                $stats['starterBonusGranted'] = true;

                $upd = $pdo->prepare('UPDATE users SET stats_json = ?, updated_at = ? WHERE username = ?');
                $upd->execute([
                    json_encode($stats, JSON_UNESCAPED_UNICODE),
                    gmdate('Y-m-d\TH:i:s\Z'),
                    $targetUser,
                ]);
                $flashMessage = "اطلاعات کاربر «{$targetUser}» با موفقیت بروزرسانی شد (بذر: {$finalPoints} | استریک: {$newStreak}).";
            } else {
                $flashError = 'کاربر مورد نظر یافت نشد.';
            }
        }

        $search = trim((string)($_GET['q'] ?? ''));
        if ($search !== '') {
            $listStmt = $pdo->prepare('SELECT * FROM users WHERE username LIKE ? ORDER BY updated_at DESC LIMIT 200');
            $listStmt->execute(['%' . $search . '%']);
            $users = $listStmt->fetchAll();
        } else {
            $listStmt = $pdo->query('SELECT * FROM users ORDER BY updated_at DESC LIMIT 200');
            $users = $listStmt->fetchAll();
        }
    } catch (Throwable $e) {
        $flashError = 'خطا در اتصال به دیتابیس: ' . htmlspecialchars($e->getMessage());
        $users = [];
    }
}
?>
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex, nofollow" />
  <title>پنل مدیریت کلمباز 🥦 | مدیریت امتیاز و استریک کاربران</title>
  <style>
    * { box-sizing: border-box; font-family: Tahoma, Vazirmatn, sans-serif; }
    body { margin: 0; padding: 24px; background: #161026; color: #f2edfa; }
    .container { max-width: 980px; margin: 0 auto; }
    .card { background: #221938; border: 2px solid #4c3673; border-radius: 16px; padding: 20px; margin-bottom: 20px; }
    h1 { margin: 0 0 8px; font-size: 22px; color: #6ee7b7; }
    p { margin: 0 0 16px; font-size: 13px; color: #d8c7f0; }
    input[type="text"], input[type="password"], input[type="number"] {
      background: #140f24; color: #fff; border: 1px solid #5a4287; border-radius: 8px; padding: 8px 10px; font-size: 13px;
    }
    input[type="number"] { width: 85px; text-align: center; direction: ltr; }
    button, .btn {
      background: linear-gradient(90deg, #237a5b, #4c357d); color: #fff; border: none; border-radius: 8px;
      padding: 8px 14px; font-size: 12px; font-weight: bold; cursor: pointer; text-decoration: none; display: inline-block;
    }
    button:hover, .btn:hover { opacity: 0.92; }
    .alert-ok { background: #143d30; border: 1px solid #34d399; color: #a7f3d0; padding: 12px; border-radius: 10px; margin-bottom: 16px; font-size: 13px; }
    .alert-err { background: #451a2b; border: 1px solid #f43f5e; color: #fecdd3; padding: 12px; border-radius: 10px; margin-bottom: 16px; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { padding: 10px 8px; border-bottom: 1px solid #382a59; text-align: right; vertical-align: middle; }
    th { color: #a7f3d0; font-weight: bold; background: #1b132e; }
    .topbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <?php if (!$isAuthed): ?>
      <div class="card" style="max-width: 420px; margin: 60px auto;">
        <h1>🥦 ورود به پنل مدیریت کلمباز</h1>
        <p>رمز عبور دیتابیس (DB_PASS) یا ADMIN_PASSWORD تعریف‌شده در فایل <code>api/db-config.php</code> را وارد کنید:</p>
        <?php if ($loginError !== ''): ?>
          <div class="alert-err"><?php echo htmlspecialchars($loginError); ?></div>
        <?php endif; ?>
        <form method="post">
          <div style="margin-bottom: 12px;">
            <input type="password" name="admin_password" placeholder="رمز عبور مدیریت..." style="width: 100%;" required autofocus />
          </div>
          <button type="submit" style="width: 100%; padding: 10px;">ورود به پنل</button>
        </form>
      </div>
    <?php else: ?>
      <div class="card">
        <div class="topbar">
          <div>
            <h1>🥦 پنل مدیریت کاربران کلمباز</h1>
            <p style="margin:0;">ویرایش مستقیم امتیاز (Points) و استریک (Streak) کاربران</p>
          </div>
          <div style="display:flex; gap:8px; align-items:center;">
            <form method="get" style="display:flex; gap:6px;">
              <input type="text" name="q" value="<?php echo htmlspecialchars($search ?? ''); ?>" placeholder="جستجوی نام کاربری..." />
              <button type="submit">جستجو</button>
            </form>
            <a class="btn" href="admin.php?logout=1" style="background:#6b2137;">خروج</a>
          </div>
        </div>
      </div>

      <?php if ($flashMessage !== ''): ?>
        <div class="alert-ok"><?php echo htmlspecialchars($flashMessage); ?></div>
      <?php endif; ?>
      <?php if ($flashError !== ''): ?>
        <div class="alert-err"><?php echo htmlspecialchars($flashError); ?></div>
      <?php endif; ?>

      <div class="card" style="overflow-x:auto;">
        <table>
          <thead>
            <tr>
              <th>نام کاربری</th>
              <th>بذر فعلی (Seeds 🌱)</th>
              <th>افزودن/کاهش بذر (+/-)</th>
              <th>استریک فعلی (Streak)</th>
              <th>بیشترین استریک (Max)</th>
              <th>برد / بازی</th>
              <th>ذخیره</th>
            </tr>
          </thead>
          <tbody>
            <?php if (empty($users)): ?>
              <tr><td colspan="7" style="text-align:center; padding:24px;">هیچ کاربری یافت نشد.</td></tr>
            <?php else: ?>
              <?php foreach ($users as $u):
                $st = json_decode($u['stats_json'] ?? '{}', true);
                if (!is_array($st)) $st = [];
                $pts = (int)($st['points'] ?? 50);
                $curStreak = (int)($st['currentStreak'] ?? 0);
                $maxStreak = (int)($st['maxStreak'] ?? 0);
                $played = (int)($st['gamesPlayed'] ?? 0);
                $won = (int)($st['gamesWon'] ?? 0);
              ?>
                <tr>
                  <form method="post">
                    <input type="hidden" name="action" value="update_user" />
                    <input type="hidden" name="username" value="<?php echo htmlspecialchars($u['username']); ?>" />
                    <td style="font-weight:bold; color:#fff;"><?php echo htmlspecialchars($u['username']); ?></td>
                    <td>
                      <input type="number" name="points" value="<?php echo $pts; ?>" min="0" />
                    </td>
                    <td>
                      <input type="number" name="add_points" value="0" placeholder="+0" />
                    </td>
                    <td>
                      <input type="number" name="current_streak" value="<?php echo $curStreak; ?>" min="0" />
                    </td>
                    <td>
                      <input type="number" name="max_streak" value="<?php echo $maxStreak; ?>" min="0" />
                    </td>
                    <td style="direction:ltr; text-align:right; color:#c4b5fd;">
                      <?php echo $won . ' / ' . $played; ?>
                    </td>
                    <td>
                      <button type="submit">ذخیره تغییرات</button>
                    </td>
                  </form>
                </tr>
              <?php endforeach; ?>
            <?php endif; ?>
          </tbody>
        </table>
      </div>
    <?php endif; ?>
  </div>
</body>
</html>
