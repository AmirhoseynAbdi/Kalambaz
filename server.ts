import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import Database from 'better-sqlite3';

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), '.sqlite-db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'kalabaz.db');
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
`);

const DEFAULT_STATS = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  maxStreak: 0,
  lastPlayedDate: '',
  guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
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

function formatUserAccount(row: DbUserRow) {
  let stats = DEFAULT_STATS;
  let gameStates = {};
  try {
    stats = { ...DEFAULT_STATS, ...JSON.parse(row.stats_json) };
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

      const now = new Date().toISOString();
      const passwordHash = hashPassword(password);
      const sessionToken = generateSessionToken();
      const initialStats = req.body?.stats ? { ...DEFAULT_STATS, ...req.body.stats } : DEFAULT_STATS;
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

      const createdRow = db
        .prepare('SELECT * FROM users WHERE username = ?')
        .get(rawUsername) as DbUserRow;

      res.status(201).json({
        account: formatUserAccount(createdRow),
        token: sessionToken,
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

      const updatedStats = req.body?.stats
        ? { ...DEFAULT_STATS, ...req.body.stats }
        : JSON.parse(userRow.stats_json);
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
}

startServer();
