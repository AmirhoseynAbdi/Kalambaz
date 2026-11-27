import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import crypto from 'node:crypto';
import type http from 'node:http';
import Database from 'better-sqlite3';
import {
  dispatchDueScheduledSocialPosts,
  ensureAdminSchema,
  formatPostTextWithLink,
  registerAdminRoutes,
  validateAnnouncementInput,
  validateWordOverrideInput,
} from './adminRoutes.ts';
import { generateVapidKeyPair } from './webPush.ts';

function hashPw(password: string): string {
  const salt = crypto.randomBytes(8).toString('hex');
  const key = crypto.scryptSync(password, salt, 32).toString('hex');
  return `${salt}:${key}`;
}

function verifyPw(password: string, stored: string): boolean {
  const [salt, keyHex] = stored.split(':');
  if (!salt || !keyHex) return false;
  const derived = crypto.scryptSync(password, salt, 32);
  const storedBuf = Buffer.from(keyHex, 'hex');
  return derived.length === storedBuf.length && crypto.timingSafeEqual(derived, storedBuf);
}

function createTestDb() {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE users (
      username TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL,
      session_token TEXT,
      stats_json TEXT NOT NULL,
      game_states_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE app_settings (
      setting_key TEXT PRIMARY KEY,
      setting_value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE push_subscriptions (
      endpoint_hash TEXT PRIMARY KEY,
      endpoint TEXT NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      username TEXT DEFAULT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      last_pushed_date TEXT DEFAULT NULL
    );
    CREATE TABLE referrals (
      invitee_username TEXT PRIMARY KEY,
      referrer_username TEXT NOT NULL,
      reward_points INTEGER NOT NULL DEFAULT 100,
      created_at TEXT NOT NULL
    );
  `);
  ensureAdminSchema(db);
  return db;
}

async function startTestApp(
  db: Database.Database,
  options: {
    env?: NodeJS.ProcessEnv;
    publishTelegram?: (botToken: string, chatId: string, text: string) => Promise<void>;
    publishX?: (cfg: any, text: string) => Promise<void>;
  } = {}
): Promise<{ baseUrl: string; close: () => Promise<void> }> {
  const app = express();
  app.use(express.json());
  const vapid = generateVapidKeyPair();
  registerAdminRoutes(app, db, {
    hashPassword: hashPw,
    verifyPassword: verifyPw,
    getOrCreateVapidKeys: () => vapid,
    env: options.env || {},
    transport: {
      publishTelegram: options.publishTelegram || (async () => {}),
      publishX: options.publishX || (async () => {}),
    },
  });

  const server = await new Promise<http.Server>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : 0;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve()))),
  };
}

test('validateAnnouncementInput enforces https:// links and rejects dangerous schemes', () => {
  const valid = validateAnnouncementInput({
    enabled: true,
    message: 'چالش ویژه امروز کلمباز!',
    linkUrl: 'https://t.me/kalambaz_ir',
    tone: 'purple',
  });
  assert.equal(valid.valid, true);
  assert.equal(valid.value?.tone, 'purple');

  const jsUrl = validateAnnouncementInput({
    enabled: true,
    message: 'Test',
    linkUrl: 'javascript:alert(1)',
    tone: 'emerald',
  });
  assert.equal(jsUrl.valid, false);

  const httpUrl = validateAnnouncementInput({
    enabled: true,
    message: 'Test',
    linkUrl: 'http://example.com',
    tone: 'emerald',
  });
  assert.equal(httpUrl.valid, false);

  const emptyEnabled = validateAnnouncementInput({
    enabled: true,
    message: '   ',
    linkUrl: '',
    tone: 'sky',
  });
  assert.equal(emptyEnabled.valid, false);
});

test('validateWordOverrideInput normalizes Arabic variants and enforces exact Persian length', () => {
  const ok = validateWordOverrideInput('2026-11-27', 4, 'كتاب');
  assert.equal(ok.valid, true);
  assert.equal(ok.word, 'کتاب');

  const wrongLen = validateWordOverrideInput('2026-11-27', 5, 'سلام');
  assert.equal(wrongLen.valid, false);

  const latin = validateWordOverrideInput('2026-11-27', 4, 'test');
  assert.equal(latin.valid, false);
});

test('formatPostTextWithLink appends URL cleanly without duplicating', () => {
  assert.equal(
    formatPostTextWithLink('کلمه امروز چیه؟', true, 'https://kalambaz.ir'),
    'کلمه امروز چیه؟\nhttps://kalambaz.ir'
  );
  assert.equal(
    formatPostTextWithLink('بازی کن: https://kalambaz.ir', true, 'https://kalambaz.ir'),
    'بازی کن: https://kalambaz.ir'
  );
  assert.equal(formatPostTextWithLink('فقط متن', false, 'https://kalambaz.ir'), 'فقط متن');
});

test('first-run setup claims admin password once, locks out repeat setup, and guards protected endpoints', async () => {
  const db = createTestDb();
  const { baseUrl, close } = await startTestApp(db);

  try {
    // 1. Unauthenticated overview must fail with 401
    const unauthRes = await fetch(`${baseUrl}/api/admin/overview`);
    assert.equal(unauthRes.status, 401);

    // 2. Initial status reports canClaimSetup = true
    const st1 = await (await fetch(`${baseUrl}/api/admin/status`)).json();
    assert.equal(st1.canClaimSetup, true);
    assert.equal(st1.configured, false);

    // 3. First-run setup succeeds and issues token
    const setupRes = await fetch(`${baseUrl}/api/admin/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'StrongAdminPassword123' }),
    });
    assert.equal(setupRes.status, 201);
    const setupData = await setupRes.json();
    assert.ok(typeof setupData.token === 'string' && setupData.token.length === 64);

    // 4. Second setup attempt must be rejected with 409
    const repeatSetup = await fetch(`${baseUrl}/api/admin/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'AnotherPassword456' }),
    });
    assert.equal(repeatSetup.status, 409);

    // 5. Authenticated overview works with Bearer token
    const ovRes = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: { Authorization: `Bearer ${setupData.token}` },
    });
    assert.equal(ovRes.status, 200);
    const ov = await ovRes.json();
    assert.equal(ov.todayWords.length, 3);
  } finally {
    await close();
    db.close();
  }
});

test('ADMIN_PASSWORD env overrides setup and protects user edits, daily word overrides, and game config', async () => {
  const db = createTestDb();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO users (username, password_hash, session_token, stats_json, game_states_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    'ali',
    hashPw('1234'),
    'tok1',
    JSON.stringify({ points: 50, currentStreak: 2, maxStreak: 5, gamesPlayed: 10, gamesWon: 8 }),
    JSON.stringify({ 5: { dateKey: '2026-11-27', status: 'won' } }),
    now,
    now
  );

  const { baseUrl, close } = await startTestApp(db, {
    env: { ADMIN_PASSWORD: 'EnvMasterPassword99' },
  });

  try {
    // Setup blocked when env password exists
    const setupBlocked = await fetch(`${baseUrl}/api/admin/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'AttemptPassword1' }),
    });
    assert.equal(setupBlocked.status, 409);

    // Login with env password succeeds
    const loginRes = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'EnvMasterPassword99' }),
    });
    assert.equal(loginRes.status, 200);
    const { token } = await loginRes.json();

    // Update user seeds and reset today
    const updRes = await fetch(`${baseUrl}/api/admin/users/ali`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ stats: { points: 350, currentStreak: 9 }, resetToday: true }),
    });
    assert.equal(updRes.status, 200);
    const updData = await updRes.json();
    assert.equal(updData.user.stats.points, 350);
    assert.equal(updData.user.stats.currentStreak, 9);

    // Set daily word override & banner, then verify public /api/game/config
    const ovPut = await fetch(`${baseUrl}/api/admin/daily-words`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ dateKey: '2026-11-27', wordLength: 5, word: 'باران' }),
    });
    assert.equal(ovPut.status, 200);

    const annPut = await fetch(`${baseUrl}/api/admin/announcement`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        enabled: true,
        message: 'چالش پنج‌شنبه شروع شد!',
        linkUrl: 'https://kalambaz.ir',
        tone: 'emerald',
      }),
    });
    assert.equal(annPut.status, 200);

    const publicCfg = await (await fetch(`${baseUrl}/api/game/config?date=2026-11-27`)).json();
    assert.equal(publicCfg.wordOverrides['5'], 'باران');
    assert.equal(publicCfg.announcement.enabled, true);
    assert.equal(publicCfg.announcement.message, 'چالش پنج‌شنبه شروع شد!');

    // Delete user
    const delRes = await fetch(`${baseUrl}/api/admin/users/ali`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(delRes.status, 200);
  } finally {
    await close();
    db.close();
  }
});

test('manual social posts support partial failure retry and scheduled cron dispatch without GEMINI_API_KEY', async () => {
  const db = createTestDb();
  let xFailFirst = true;
  const tgCalls: string[] = [];
  const xCalls: string[] = [];

  const env: NodeJS.ProcessEnv = {
    ADMIN_PASSWORD: 'SocialAdminPassword1',
    TELEGRAM_BOT_TOKEN: '123456:ABCDEF_valid_token_sample',
    TELEGRAM_CHAT_ID_1: '@kalambaz_ir',
    X_API_KEY: 'xk',
    X_API_SECRET: 'xs',
    X_ACCESS_TOKEN: 'xt',
    X_ACCESS_TOKEN_SECRET: 'xts',
    SOCIAL_POSTS_URL: 'https://kalambaz.ir',
    // Explicitly NO GEMINI_API_KEY
  };

  const transport = {
    publishTelegram: async (_token: string, chatId: string, text: string) => {
      tgCalls.push(`${chatId}:${text}`);
    },
    publishX: async (_cfg: any, text: string) => {
      xCalls.push(text);
      if (xFailFirst) {
        xFailFirst = false;
        throw new Error('X rejected the post (HTTP 429).');
      }
    },
  };

  const { baseUrl, close } = await startTestApp(db, {
    env,
    publishTelegram: transport.publishTelegram,
    publishX: transport.publishX,
  });

  try {
    const { token } = await (
      await fetch(`${baseUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'SocialAdminPassword1' }),
      })
    ).json();

    // 1. Instant publish: Telegram succeeds, X fails -> partial
    const createRes = await fetch(`${baseUrl}/api/admin/social/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title: 'Test Post',
        bodyText: 'کلمه امروز رو حدس بزن!',
        includeLink: true,
        mode: 'published',
        targets: { telegram1: true, telegram2: false, x: true },
        publishNow: true,
      }),
    });
    assert.equal(createRes.status, 201);
    const { post } = await createRes.json();
    assert.equal(post.status, 'partial');
    assert.equal(tgCalls.length, 1);
    assert.equal(xCalls.length, 1);

    // 2. Retry failed only -> does NOT re-send Telegram, succeeds on X -> sent
    const retryRes = await fetch(`${baseUrl}/api/admin/social/posts/${post.id}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ retryFailedOnly: true }),
    });
    assert.equal(retryRes.status, 200);
    const retried = await retryRes.json();
    assert.equal(retried.post.status, 'sent');
    assert.equal(tgCalls.length, 1); // Telegram NOT resent
    assert.equal(xCalls.length, 2); // X retried and succeeded

    // 3. Schedule a post for the past Tehran time and dispatch via cron helper
    const schedRes = await fetch(`${baseUrl}/api/admin/social/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title: 'Scheduled Post',
        bodyText: 'پست زمان‌بندی‌شده بدون جیمینای!',
        includeLink: false,
        mode: 'scheduled',
        scheduledFor: '2026-11-20T09:00',
        targets: { telegram1: true, telegram2: false, x: false },
      }),
    });
    assert.equal(schedRes.status, 201);

    const dispatched = await dispatchDueScheduledSocialPosts(db, {
      now: new Date('2026-11-27T08:00:00Z'),
      env,
      transport,
    });
    assert.equal(dispatched.length, 1);
    assert.equal(dispatched[0].status, 'sent');
    assert.equal(tgCalls.length, 2);
  } finally {
    await close();
    db.close();
  }
});
