import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
import Database from 'better-sqlite3';
import {
  type VapidKeyPair,
  generateVapidKeyPair,
  validatePushEndpoint,
  validateSubscriptionKeys,
  sha256Hex,
  sendWebPushWakeup,
} from './src/server/webPush.ts';
import {
  createGeminiPostGenerator,
  ensureSocialPostSchema,
  getSocialPostConfig,
  getTehranDateTime,
  publishDailySocialPost,
  publishTelegramPost,
  publishXPost,
} from './src/server/socialPosts.ts';

dotenv.config({ path: '.env.local' });
dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
let dataDir = process.env.DATA_DIR || path.join(process.cwd(), '.sqlite-db');

try {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
} catch {
  dataDir = path.join(os.tmpdir(), 'kalabaz-sqlite-db');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

const DB_PATH = process.env.DB_PATH || path.join(dataDir, 'kalabaz.db');
const db = new Database(DB_PATH);

// Enable WAL mode for high concurrency and performance
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

db.exec(`
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

  CREATE TABLE IF NOT EXISTS referrals (
    invitee_username TEXT PRIMARY KEY,
    referrer_username TEXT NOT NULL,
    reward_points INTEGER NOT NULL DEFAULT 100,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_username);
`);
ensureSocialPostSchema(db);

function getOrCreateServerVapidKeys(): VapidKeyPair {
  const subject = (process.env.VAPID_SUBJECT || 'mailto:justhawkstuff@gmail.com').trim();
  const envPub = (process.env.VAPID_PUBLIC_KEY || '').trim();
  const envPriv = (process.env.VAPID_PRIVATE_KEY || '').trim();
  if (envPub && envPriv) {
    return { publicKey: envPub, privateKeyPem: envPriv, subject };
  }

  const rows = db
    .prepare('SELECT setting_key, setting_value FROM app_settings WHERE setting_key IN (?, ?)')
    .all('vapid_public_key', 'vapid_private_pem') as {
    setting_key: string;
    setting_value: string;
  }[];

  const pubRow = rows.find((r) => r.setting_key === 'vapid_public_key');
  const privRow = rows.find((r) => r.setting_key === 'vapid_private_pem');
  if (pubRow?.setting_value && privRow?.setting_value) {
    return {
      publicKey: pubRow.setting_value,
      privateKeyPem: privRow.setting_value,
      subject,
    };
  }

  const generated = generateVapidKeyPair(subject);
  const now = new Date().toISOString();
  const upsert = db.prepare(
    'INSERT OR REPLACE INTO app_settings (setting_key, setting_value, updated_at) VALUES (?, ?, ?)'
  );
  upsert.run('vapid_public_key', generated.publicKey, now);
  upsert.run('vapid_private_pem', generated.privateKeyPem, now);
  return generated;
}

const REFERRAL_REWARD_POINTS = 100;

const DEFAULT_STATS = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  maxStreak: 0,
  lastPlayedDate: '',
  guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
  points: 50,
  starterBonusGranted: true,
  referralsCount: 0,
  referralPointsEarned: 0,
};

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(keyHex, 'hex');
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

interface DbUserRow {
  username: string;
  password_hash: string;
  session_token: string | null;
  stats_json: string;
  game_states_json: string;
  created_at: string;
  updated_at: string;
}

function getUserReferralTotals(username: string): { count: number; totalPoints: number } {
  const row = db
    .prepare(
      'SELECT COUNT(*) AS cnt, COALESCE(SUM(reward_points), 0) AS total FROM referrals WHERE referrer_username = ?'
    )
    .get(username) as { cnt: number; total: number } | undefined;
  return {
    count: Math.max(0, Number(row?.cnt) || 0),
    totalPoints: Math.max(0, Number(row?.total) || 0),
  };
}

function formatUserAccount(row: DbUserRow) {
  let stats = { ...DEFAULT_STATS };
  let gameStates = {};
  const referralTotals = getUserReferralTotals(row.username);
  try {
    const parsed = JSON.parse(row.stats_json) || {};
    const hadStarterBonus = Boolean(parsed.starterBonusGranted);
    const storedReferralPoints = Math.max(0, Number(parsed.referralPointsEarned) || 0);
    const uncreditedReferralDelta = Math.max(0, referralTotals.totalPoints - storedReferralPoints);
    const basePoints = Math.max(0, Number(parsed.points) || 0);
    const nextPoints = (hadStarterBonus ? basePoints : basePoints + 50) + uncreditedReferralDelta;
    const needsPersist =
      !hadStarterBonus ||
      uncreditedReferralDelta > 0 ||
      Number(parsed.referralsCount || 0) !== referralTotals.count ||
      storedReferralPoints !== referralTotals.totalPoints;

    stats = {
      ...DEFAULT_STATS,
      ...parsed,
      points: nextPoints,
      starterBonusGranted: true,
      referralsCount: referralTotals.count,
      referralPointsEarned: referralTotals.totalPoints,
    };
    if (needsPersist) {
      db.prepare('UPDATE users SET stats_json = ?, updated_at = ? WHERE username = ?').run(
        JSON.stringify(stats),
        new Date().toISOString(),
        row.username
      );
    }
  } catch {}
  try {
    gameStates = JSON.parse(row.game_states_json) || {};
  } catch {}

  return {
    username: row.username,
    stats,
    gameStates,
    createdAt: row.created_at,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '512kb' }));

  // Health check
  app.get('/api/health', (_req, res) => {
    const countRow = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    res.json({ status: 'ok', totalUsers: countRow.count });
  });

  // Sign Up
  app.post('/api/auth/signup', (req, res) => {
    try {
      const rawUsername = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
      const password = typeof req.body?.password === 'string' ? req.body.password : '';

      if (!rawUsername || rawUsername.length < 2) {
        res.status(400).json({ error: 'نام کاربری باید حداقل ۲ نویسه باشد.' });
        return;
      }
      if (rawUsername.length > 30) {
        res.status(400).json({ error: 'نام کاربری نمی‌تواند بیشتر از ۳۰ نویسه باشد.' });
        return;
      }
      if (!password || password.length < 4) {
        res.status(400).json({ error: 'رمز عبور باید حداقل ۴ نویسه باشد.' });
        return;
      }

      const existing = db
        .prepare('SELECT username FROM users WHERE username = ?')
        .get(rawUsername) as { username: string } | undefined;

      if (existing) {
        res.status(409).json({ error: 'این نام کاربری قبلاً ثبت شده است. لطفاً وارد شوید.' });
        return;
      }

      const rawReferredBy =
        typeof req.body?.referredBy === 'string' ? req.body.referredBy.trim() : '';
      const validReferrerCandidate =
        rawReferredBy.length >= 2 && rawReferredBy.length <= 30 && rawReferredBy !== rawUsername
          ? rawReferredBy
          : '';

      const now = new Date().toISOString();
      const passwordHash = hashPassword(password);
      const sessionToken = generateSessionToken();
      const incomingStats =
        req.body?.stats && typeof req.body.stats === 'object' ? req.body.stats : null;
      const initialStats = incomingStats
        ? {
            ...DEFAULT_STATS,
            ...incomingStats,
            points: incomingStats.starterBonusGranted
              ? Math.max(0, Number(incomingStats.points) || 0)
              : Math.max(0, Number(incomingStats.points) || 0) + 50,
            starterBonusGranted: true,
            referralsCount: 0,
            referralPointsEarned: 0,
          }
        : DEFAULT_STATS;
      const initialGameStates = req.body?.gameStates && typeof req.body.gameStates === 'object' ? req.body.gameStates : {};

      db.prepare(
        `INSERT INTO users (username, password_hash, session_token, stats_json, game_states_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(
        rawUsername,
        passwordHash,
        sessionToken,
        JSON.stringify(initialStats),
        JSON.stringify(initialGameStates),
        now,
        now
      );

      let referralApplied = false;
      if (validReferrerCandidate) {
        const referrerRow = db
          .prepare('SELECT * FROM users WHERE username = ?')
          .get(validReferrerCandidate) as DbUserRow | undefined;
        if (referrerRow) {
          const refInsert = db
            .prepare(
              `INSERT OR IGNORE INTO referrals (invitee_username, referrer_username, reward_points, created_at)
               VALUES (?, ?, ?, ?)`
            )
            .run(rawUsername, referrerRow.username, REFERRAL_REWARD_POINTS, now);
          if (refInsert.changes > 0) {
            // Reconcile & persist the +100 hint points reward on the referrer's account
            formatUserAccount(referrerRow);
            referralApplied = true;
          }
        }
      }

      const createdRow = db
        .prepare('SELECT * FROM users WHERE username = ?')
        .get(rawUsername) as DbUserRow;

      res.status(201).json({
        account: formatUserAccount(createdRow),
        token: sessionToken,
        referralApplied,
      });
    } catch (err) {
      console.error('Signup error:', err);
      res.status(500).json({ error: 'خطا در ایجاد حساب کاربری در سرور.' });
    }
  });

  // Log In
  app.post('/api/auth/login', (req, res) => {
    try {
      const rawUsername = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
      const password = typeof req.body?.password === 'string' ? req.body.password : '';

      if (!rawUsername) {
        res.status(400).json({ error: 'لطفاً نام کاربری را وارد کنید.' });
        return;
      }
      if (!password) {
        res.status(400).json({ error: 'لطفاً رمز عبور را وارد کنید.' });
        return;
      }

      const userRow = db
        .prepare('SELECT * FROM users WHERE username = ?')
        .get(rawUsername) as DbUserRow | undefined;

      if (!userRow) {
        res.status(404).json({ error: 'حساب کاربری با این نام یافت نشد. می‌توانید ثبت‌نام کنید.' });
        return;
      }

      if (!verifyPassword(password, userRow.password_hash)) {
        res.status(401).json({ error: 'رمز عبور وارد شده نادرست است.' });
        return;
      }

      const sessionToken = userRow.session_token || generateSessionToken();
      const now = new Date().toISOString();
      db.prepare('UPDATE users SET session_token = ?, updated_at = ? WHERE username = ?').run(
        sessionToken,
        now,
        rawUsername
      );

      res.json({
        account: formatUserAccount(userRow),
        token: sessionToken,
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'خطا در ورود به حساب کاربری.' });
    }
  });

  // Get current authenticated user profile
  app.get('/api/auth/me', (req, res) => {
    try {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
      if (!token) {
        res.status(401).json({ error: 'توکن احراز هویت یافت نشد.' });
        return;
      }

      const userRow = db
        .prepare('SELECT * FROM users WHERE session_token = ?')
        .get(token) as DbUserRow | undefined;

      if (!userRow) {
        res.status(401).json({ error: 'نشست کاربری معتبر نیست.' });
        return;
      }

      res.json({
        account: formatUserAccount(userRow),
      });
    } catch (err) {
      console.error('Auth me error:', err);
      res.status(500).json({ error: 'خطا در بازیابی اطلاعات حساب کاربری.' });
    }
  });

  // Sync user stats & daily game states to SQLite
  app.put('/api/user/sync', (req, res) => {
    try {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
      if (!token) {
        res.status(401).json({ error: 'توکن احراز هویت یافت نشد.' });
        return;
      }

      const userRow = db
        .prepare('SELECT * FROM users WHERE session_token = ?')
        .get(token) as DbUserRow | undefined;

      if (!userRow) {
        res.status(401).json({ error: 'نشست کاربری معتبر نیست.' });
        return;
      }

      const referralTotals = getUserReferralTotals(userRow.username);
      const clientStats =
        req.body?.stats && typeof req.body.stats === 'object' ? req.body.stats : null;
      let updatedStats;
      if (clientStats) {
        const clientKnownRefPts = Math.max(0, Number(clientStats.referralPointsEarned) || 0);
        const unseenRefBonus = Math.max(0, referralTotals.totalPoints - clientKnownRefPts);
        updatedStats = {
          ...DEFAULT_STATS,
          ...clientStats,
          points: Math.max(0, Number(clientStats.points) || 0) + unseenRefBonus,
          starterBonusGranted: true,
          referralsCount: referralTotals.count,
          referralPointsEarned: referralTotals.totalPoints,
        };
      } else {
        updatedStats = formatUserAccount(userRow).stats;
      }
      const updatedGameStates =
        req.body?.gameStates && typeof req.body.gameStates === 'object'
          ? req.body.gameStates
          : JSON.parse(userRow.game_states_json);

      const now = new Date().toISOString();
      db.prepare(
        'UPDATE users SET stats_json = ?, game_states_json = ?, updated_at = ? WHERE username = ?'
      ).run(
        JSON.stringify(updatedStats),
        JSON.stringify(updatedGameStates),
        now,
        userRow.username
      );

      const freshRow = db
        .prepare('SELECT * FROM users WHERE username = ?')
        .get(userRow.username) as DbUserRow;

      res.json({
        ok: true,
        account: formatUserAccount(freshRow),
      });
    } catch (err) {
      console.error('Sync error:', err);
      res.status(500).json({ error: 'خطا در ذخیره‌سازی اطلاعات کاربر.' });
    }
  });

  // Web Push: return server public VAPID key
  app.get('/api/push/public-key', (_req, res) => {
    try {
      const vapid = getOrCreateServerVapidKeys();
      res.json({ publicKey: vapid.publicKey });
    } catch (err) {
      console.error('VAPID public key error:', err);
      res.status(500).json({ error: 'خطا در بازیابی کلید اعلان سرور.' });
    }
  });

  // Web Push: subscribe device endpoint
  app.post('/api/push/subscribe', (req, res) => {
    try {
      const epCheck = validatePushEndpoint(req.body?.endpoint);
      if (!epCheck.valid || !epCheck.endpoint) {
        res.status(400).json({ error: epCheck.error });
        return;
      }

      const keyCheck = validateSubscriptionKeys(req.body?.keys?.p256dh, req.body?.keys?.auth);
      if (!keyCheck.valid || !keyCheck.p256dh || !keyCheck.auth) {
        res.status(400).json({ error: keyCheck.error });
        return;
      }

      let linkedUsername: string | null = null;
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
      if (token) {
        const userRow = db
          .prepare('SELECT username FROM users WHERE session_token = ?')
          .get(token) as { username: string } | undefined;
        if (userRow?.username) {
          linkedUsername = userRow.username;
        }
      }

      const endpointHash = sha256Hex(epCheck.endpoint);
      const now = new Date().toISOString();
      const existing = db
        .prepare('SELECT endpoint_hash, username FROM push_subscriptions WHERE endpoint_hash = ?')
        .get(endpointHash) as { endpoint_hash: string; username: string | null } | undefined;

      if (existing) {
        db.prepare(
          `UPDATE push_subscriptions
           SET endpoint = ?, p256dh = ?, auth = ?, username = ?, updated_at = ?
           WHERE endpoint_hash = ?`
        ).run(
          epCheck.endpoint,
          keyCheck.p256dh,
          keyCheck.auth,
          linkedUsername ?? existing.username,
          now,
          endpointHash
        );
      } else {
        db.prepare(
          `INSERT INTO push_subscriptions
           (endpoint_hash, endpoint, p256dh, auth, username, created_at, updated_at, last_pushed_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, NULL)`
        ).run(
          endpointHash,
          epCheck.endpoint,
          keyCheck.p256dh,
          keyCheck.auth,
          linkedUsername,
          now,
          now
        );
      }

      res.json({ ok: true, subscribed: true });
    } catch (err) {
      console.error('Push subscribe error:', err);
      res.status(500).json({ error: 'خطا در ثبت اشتراک اعلان.' });
    }
  });

  // Web Push: unsubscribe device endpoint
  app.post('/api/push/unsubscribe', (req, res) => {
    try {
      const epCheck = validatePushEndpoint(req.body?.endpoint);
      if (!epCheck.valid || !epCheck.endpoint) {
        res.status(400).json({ error: epCheck.error });
        return;
      }
      db.prepare('DELETE FROM push_subscriptions WHERE endpoint_hash = ?').run(
        sha256Hex(epCheck.endpoint)
      );
      res.json({ ok: true, subscribed: false });
    } catch (err) {
      console.error('Push unsubscribe error:', err);
      res.status(500).json({ error: 'خطا در لغو اشتراک اعلان.' });
    }
  });

  // Web Push: cron-triggered daily push dispatch (requires PUSH_CRON_SECRET header)
  app.post('/api/push/send-daily', async (req, res) => {
    try {
      const expectedSecret = (process.env.PUSH_CRON_SECRET || '').trim();
      if (!expectedSecret) {
        res.status(503).json({ error: 'PUSH_CRON_SECRET is not configured on the server.' });
        return;
      }
      const provided = String(req.headers['x-push-cron-secret'] || '').trim();
      const expectedBuf = Buffer.from(expectedSecret, 'utf8');
      const providedBuf = Buffer.from(provided, 'utf8');
      if (
        expectedBuf.length !== providedBuf.length ||
        !crypto.timingSafeEqual(expectedBuf, providedBuf)
      ) {
        res.status(401).json({ error: 'Unauthorized cron trigger.' });
        return;
      }

      const vapid = getOrCreateServerVapidKeys();
      const todayTehran = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Tehran',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());

      const force = Boolean(req.body?.force);
      const subs = (
        force
          ? db.prepare('SELECT endpoint_hash, endpoint, p256dh, auth, username FROM push_subscriptions').all()
          : db
              .prepare(
                'SELECT endpoint_hash, endpoint, p256dh, auth, username FROM push_subscriptions WHERE last_pushed_date IS NULL OR last_pushed_date != ?'
              )
              .all(todayTehran)
      ) as {
        endpoint_hash: string;
        endpoint: string;
        p256dh: string;
        auth: string;
        username: string | null;
      }[];

      const markStmt = db.prepare(
        'UPDATE push_subscriptions SET last_pushed_date = ?, updated_at = ? WHERE endpoint_hash = ?'
      );
      const delStmt = db.prepare('DELETE FROM push_subscriptions WHERE endpoint_hash = ?');

      let sent = 0;
      let pruned = 0;
      let failed = 0;
      const nowIso = new Date().toISOString();

      for (const sub of subs) {
        const result = await sendWebPushWakeup(sub, vapid, 86400);
        if (result.ok) {
          markStmt.run(todayTehran, nowIso, sub.endpoint_hash);
          sent++;
        } else if (result.expired) {
          delStmt.run(sub.endpoint_hash);
          pruned++;
        } else {
          failed++;
        }
      }

      res.json({ ok: true, dateTehran: todayTehran, totalChecked: subs.length, sent, pruned, failed });
    } catch (err) {
      console.error('Send daily push error:', err);
      res.status(500).json({ error: 'Failed to dispatch daily push notifications.' });
    }
  });

  // Vite middleware in development, static dist in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kalabaz server with SQLite database running on http://0.0.0.0:${PORT}`);
  });

  let socialPostConfig;
  let missing: string[] = [];
  try {
    const resolved = getSocialPostConfig();
    socialPostConfig = resolved.config;
    missing = resolved.missing;
  } catch (error) {
    console.error(
      'Daily social posts are disabled due to invalid configuration:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return;
  }
  if (!socialPostConfig) {
    console.info(
      missing.length
        ? `Daily social posts are disabled; missing environment variables: ${missing.join(', ')}`
        : 'Daily social posts are disabled.'
    );
    return;
  }

  const dependencies = {
    generatePost: createGeminiPostGenerator(socialPostConfig.geminiApiKey, socialPostConfig.postUrl),
    publishTelegram: (chatId: string, text: string) =>
      publishTelegramPost(socialPostConfig.telegramBotToken, chatId, text),
    publishX: (text: string) => publishXPost(socialPostConfig, text),
  };
  let running = false;
  let settledDate = '';
  let retryAfter = 0;
  const runIfDue = async () => {
    const now = new Date();
    const tehran = getTehranDateTime(now);
    if (tehran.hour < 9 || settledDate === tehran.date || running || Date.now() < retryAfter) return;

    running = true;
    try {
      const result = await publishDailySocialPost(db, socialPostConfig, tehran.date, dependencies);
      settledDate = tehran.date;
      retryAfter = 0;
      console.info('Daily social post dispatch completed:', {
        date: result.date,
        deliveries: result.deliveries,
      });
    } catch (error) {
      retryAfter = Date.now() + 5 * 60 * 1000;
      console.error(
        `Daily social post generation failed for ${tehran.date}:`,
        error instanceof Error ? error.message : 'Unknown error'
      );
    } finally {
      running = false;
    }
  };

  void runIfDue();
  setInterval(() => void runIfDue(), 60 * 1000);
}

startServer();
