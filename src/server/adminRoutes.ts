import type { Express, Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import type Database from 'better-sqlite3';
import {
  getTehranDateTime,
  publishTelegramPost,
  publishXPost,
} from './socialPosts.ts';
import {
  type VapidKeyPair,
  sendWebPushWakeup,
} from './webPush.ts';

interface DailyWordEntry {
  id?: string;
  word: string;
}

function normalizePersianServer(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .replace(/[يیى]/g, 'ی')
    .replace(/[كک]/g, 'ک')
    .replace(/ة/g, 'ه')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, '');
}

let cachedDailyWords: { 4: DailyWordEntry[]; 5: DailyWordEntry[]; 6: DailyWordEntry[] } | null =
  null;

function getServerDailyWords(): { 4: DailyWordEntry[]; 5: DailyWordEntry[]; 6: DailyWordEntry[] } {
  if (cachedDailyWords) return cachedDailyWords;
  const load = (filename: string, length: 4 | 5 | 6): DailyWordEntry[] => {
    const prefix = length === 4 ? 'four' : length === 5 ? 'five' : 'six';
    try {
      const raw = fs.readFileSync(new URL(`../data/${filename}`, import.meta.url), 'utf8');
      const parsed = JSON.parse(raw) as Array<{ id?: string; word: string } | string>;
      const seen = new Set<string>();
      const cleaned: string[] = [];
      for (const item of parsed || []) {
        const w = normalizePersianServer(typeof item === 'string' ? item : item?.word || '');
        if (w.length === length && !seen.has(w)) {
          seen.add(w);
          cleaned.push(w);
        }
      }
      return cleaned.map((word, idx) => ({ id: `${prefix}${idx + 1}`, word }));
    } catch {
      return [];
    }
  };
  cachedDailyWords = {
    4: load('dailyWords4.json', 4),
    5: load('dailyWords5.json', 5),
    6: load('dailyWords6.json', 6),
  };
  return cachedDailyWords;
}

function getDailyWordServer(dateStr: string, length: 4 | 5 | 6): { id: string; word: string } {
  const prefix = length === 4 ? 'four' : length === 5 ? 'five' : 'six';
  const cleanList = getServerDailyWords()[length];
  if (cleanList.length === 0) {
    return {
      id: `${prefix}1`,
      word: length === 4 ? 'واژه' : length === 5 ? 'باران' : 'خورشید',
    };
  }
  let hash = 2166136261;
  const seedKey = `kalabaz_daily_${dateStr}_${prefix}`;
  for (let i = 0; i < seedKey.length; i++) {
    hash ^= seedKey.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const positiveHash = Math.abs(hash);
  const counterNum = (positiveHash % cleanList.length) + 1;
  const targetId = `${prefix}${counterNum}`;
  const matched = cleanList.find((w) => w.id === targetId);
  if (matched) return { id: matched.id || targetId, word: matched.word };
  const fallback = cleanList[counterNum - 1] || cleanList[0];
  return { id: fallback.id || targetId, word: fallback.word };
}

export interface SiteAnnouncementRecord {
  enabled: boolean;
  message: string;
  linkUrl: string;
  tone: 'emerald' | 'purple' | 'amber' | 'sky';
  updatedAt?: string;
}

export interface SocialPostTargets {
  telegram1: boolean;
  telegram2: boolean;
  x: boolean;
}

export interface SocialPostDeliveryItem {
  channel: 'telegram-1' | 'telegram-2' | 'x';
  status: 'sent' | 'failed';
  error?: string;
  at: string;
}

export interface AdminSocialPostRecord {
  id: number;
  title: string;
  bodyText: string;
  includeLink: boolean;
  mode: 'draft' | 'template' | 'scheduled' | 'published';
  targets: SocialPostTargets;
  scheduledFor: string | null;
  status: 'draft' | 'scheduled' | 'sent' | 'partial' | 'failed';
  deliveries: SocialPostDeliveryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SocialChannelEnvConfig {
  telegramBotToken: string;
  telegramChatId1: string;
  telegramChatId2: string;
  xApiKey: string;
  xApiSecret: string;
  xAccessToken: string;
  xAccessTokenSecret: string;
  postUrl: string;
}

export interface SocialPublishTransport {
  publishTelegram: (botToken: string, chatId: string, text: string) => Promise<void>;
  publishX: (
    xConfig: {
      xApiKey: string;
      xApiSecret: string;
      xAccessToken: string;
      xAccessTokenSecret: string;
    },
    text: string
  ) => Promise<void>;
}

export interface AdminRouteDeps {
  hashPassword: (password: string) => string;
  verifyPassword: (password: string, storedHash: string) => boolean;
  getOrCreateVapidKeys: () => VapidKeyPair;
  env?: NodeJS.ProcessEnv;
  transport?: SocialPublishTransport;
}

const DEFAULT_ANNOUNCEMENT: SiteAnnouncementRecord = {
  enabled: false,
  message: '',
  linkUrl: '',
  tone: 'emerald',
};

const VALID_TONES = new Set(['emerald', 'purple', 'amber', 'sky']);
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

function sha256Hex(value: string): string {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

function timingSafeTextEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function getTehranNowStrings(now: Date = new Date()): {
  date: string;
  dateTime: string;
} {
  const parts = getTehranDateTime(now);
  const hh = String(parts.hour).padStart(2, '0');
  const mm = String(parts.minute).padStart(2, '0');
  return {
    date: parts.date,
    dateTime: `${parts.date}T${hh}:${mm}`,
  };
}

export function addDaysToIsoDate(dateKey: string, deltaDays: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + deltaDays));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function ensureAdminSchema(db: Database.Database): void {
  db.exec(`
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
  `);
}

function getSetting(db: Database.Database, key: string): string | null {
  const row = db
    .prepare('SELECT setting_value FROM app_settings WHERE setting_key = ?')
    .get(key) as { setting_value: string } | undefined;
  return row ? row.setting_value : null;
}

function setSetting(db: Database.Database, key: string, value: string): void {
  db.prepare(
    'INSERT OR REPLACE INTO app_settings (setting_key, setting_value, updated_at) VALUES (?, ?, ?)'
  ).run(key, value, new Date().toISOString());
}

export function getSocialChannelEnvConfig(env: NodeJS.ProcessEnv = process.env): SocialChannelEnvConfig {
  const postUrlRaw = (env.SOCIAL_POSTS_URL || env.APP_URL || 'https://kalambaz.ir').trim();
  let postUrl = 'https://kalambaz.ir';
  try {
    const parsed = new URL(postUrlRaw);
    if (parsed.protocol === 'https:') {
      postUrl = parsed.toString().replace(/\/$/, '');
    }
  } catch {
    postUrl = 'https://kalambaz.ir';
  }

  return {
    telegramBotToken: (env.TELEGRAM_BOT_TOKEN || '').trim(),
    telegramChatId1: (env.TELEGRAM_CHAT_ID_1 || '').trim(),
    telegramChatId2: (env.TELEGRAM_CHAT_ID_2 || '').trim(),
    xApiKey: (env.X_API_KEY || '').trim(),
    xApiSecret: (env.X_API_SECRET || '').trim(),
    xAccessToken: (env.X_ACCESS_TOKEN || '').trim(),
    xAccessTokenSecret: (env.X_ACCESS_TOKEN_SECRET || '').trim(),
    postUrl,
  };
}

function maskChatLabel(chatId: string): string | undefined {
  if (!chatId) return undefined;
  if (chatId.startsWith('@')) return chatId;
  if (chatId.length <= 6) return chatId;
  return `${chatId.slice(0, 4)}…${chatId.slice(-3)}`;
}

export function getSocialChannelReadiness(env: NodeJS.ProcessEnv = process.env) {
  const cfg = getSocialChannelEnvConfig(env);
  const telegram1 = Boolean(cfg.telegramBotToken && cfg.telegramChatId1);
  const telegram2 = Boolean(
    cfg.telegramBotToken && cfg.telegramChatId2 && cfg.telegramChatId2 !== cfg.telegramChatId1
  );
  const x = Boolean(
    cfg.xApiKey && cfg.xApiSecret && cfg.xAccessToken && cfg.xAccessTokenSecret
  );
  return {
    telegram1,
    telegram2,
    x,
    postUrl: cfg.postUrl,
    telegramChat1Label: telegram1 ? maskChatLabel(cfg.telegramChatId1) : undefined,
    telegramChat2Label: telegram2 ? maskChatLabel(cfg.telegramChatId2) : undefined,
  };
}

export function validateAnnouncementInput(input: unknown): {
  valid: boolean;
  value?: SiteAnnouncementRecord;
  error?: string;
} {
  if (!input || typeof input !== 'object') {
    return { valid: false, error: 'Invalid announcement payload.' };
  }
  const raw = input as Record<string, unknown>;
  const enabled = Boolean(raw.enabled);
  const message = typeof raw.message === 'string' ? raw.message.trim() : '';
  const linkUrl = typeof raw.linkUrl === 'string' ? raw.linkUrl.trim() : '';
  const toneRaw = typeof raw.tone === 'string' ? raw.tone.trim() : 'emerald';
  const tone = VALID_TONES.has(toneRaw)
    ? (toneRaw as SiteAnnouncementRecord['tone'])
    : 'emerald';

  if (message.length > 280) {
    return { valid: false, error: 'Announcement message must be 280 characters or less.' };
  }
  if (enabled && message.length === 0) {
    return { valid: false, error: 'Please enter a banner message before enabling it.' };
  }
  if (linkUrl) {
    if (linkUrl.length > 500) {
      return { valid: false, error: 'Link URL is too long.' };
    }
    try {
      const parsed = new URL(linkUrl);
      if (parsed.protocol !== 'https:' || !parsed.hostname) {
        return { valid: false, error: 'Banner link must be a valid https:// URL.' };
      }
    } catch {
      return { valid: false, error: 'Banner link must be a valid https:// URL.' };
    }
  }

  return {
    valid: true,
    value: {
      enabled,
      message,
      linkUrl,
      tone,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function getAnnouncement(db: Database.Database): SiteAnnouncementRecord {
  const raw = getSetting(db, 'site_announcement');
  if (!raw) return { ...DEFAULT_ANNOUNCEMENT };
  try {
    const parsed = JSON.parse(raw);
    const check = validateAnnouncementInput({
      enabled: Boolean(parsed?.enabled && parsed?.message),
      message: typeof parsed?.message === 'string' ? parsed.message : '',
      linkUrl: typeof parsed?.linkUrl === 'string' ? parsed.linkUrl : '',
      tone: typeof parsed?.tone === 'string' ? parsed.tone : 'emerald',
    });
    if (check.valid && check.value) {
      return {
        ...check.value,
        updatedAt: typeof parsed?.updatedAt === 'string' ? parsed.updatedAt : undefined,
      };
    }
  } catch {}
  return { ...DEFAULT_ANNOUNCEMENT };
}

export function validateWordOverrideInput(
  rawDateKey: unknown,
  rawWordLength: unknown,
  rawWord: unknown,
  rawNote?: unknown
): {
  valid: boolean;
  dateKey?: string;
  wordLength?: 4 | 5 | 6;
  word?: string;
  note?: string;
  error?: string;
} {
  const dateKey = typeof rawDateKey === 'string' ? rawDateKey.trim() : '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return { valid: false, error: 'Invalid dateKey format (expected YYYY-MM-DD).' };
  }
  const wordLength = Number(rawWordLength);
  if (wordLength !== 4 && wordLength !== 5 && wordLength !== 6) {
    return { valid: false, error: 'wordLength must be 4, 5, or 6.' };
  }
  if (typeof rawWord !== 'string') {
    return { valid: false, error: 'Word is required.' };
  }
  const normalized = normalizePersianServer(rawWord);
  if (!/^[\u0621-\u06CC]+$/.test(normalized)) {
    return { valid: false, error: 'Word must contain only Persian letters.' };
  }
  if (Array.from(normalized).length !== wordLength) {
    return {
      valid: false,
      error: `Word must be exactly ${wordLength} Persian letters after normalization.`,
    };
  }
  const note = typeof rawNote === 'string' ? rawNote.trim().slice(0, 140) : '';
  return {
    valid: true,
    dateKey,
    wordLength,
    word: normalized,
    note,
  };
}

function normalizeTargets(raw: unknown): SocialPostTargets {
  const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    telegram1: Boolean(obj.telegram1),
    telegram2: Boolean(obj.telegram2),
    x: Boolean(obj.x),
  };
}

function normalizeScheduledFor(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim().replace(' ', 'T');
  if (!trimmed) return null;
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(trimmed);
  if (!match) return null;
  return `${match[1]}T${match[2]}`;
}

export function formatPostTextWithLink(
  bodyText: string,
  includeLink: boolean,
  postUrl: string
): string {
  const clean = bodyText.trim();
  if (!includeLink || !postUrl) return clean;
  if (clean.includes(postUrl)) return clean;
  return `${clean}\n${postUrl}`;
}

function mapSocialPostRow(row: {
  id: number;
  title: string;
  body_text: string;
  include_link: number;
  mode: string;
  targets_json: string;
  scheduled_for: string | null;
  status: string;
  deliveries_json: string;
  created_at: string;
  updated_at: string;
}): AdminSocialPostRecord {
  let targets: SocialPostTargets = { telegram1: true, telegram2: false, x: true };
  let deliveries: SocialPostDeliveryItem[] = [];
  try {
    targets = normalizeTargets(JSON.parse(row.targets_json));
  } catch {}
  try {
    const parsed = JSON.parse(row.deliveries_json);
    if (Array.isArray(parsed)) deliveries = parsed;
  } catch {}
  const mode = (['draft', 'template', 'scheduled', 'published'].includes(row.mode)
    ? row.mode
    : 'draft') as AdminSocialPostRecord['mode'];
  const status = (['draft', 'scheduled', 'sent', 'partial', 'failed'].includes(row.status)
    ? row.status
    : 'draft') as AdminSocialPostRecord['status'];

  return {
    id: Number(row.id),
    title: row.title || '',
    bodyText: row.body_text,
    includeLink: Boolean(row.include_link),
    mode,
    targets,
    scheduledFor: row.scheduled_for || null,
    status,
    deliveries,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const DEFAULT_TRANSPORT: SocialPublishTransport = {
  publishTelegram: publishTelegramPost,
  publishX: publishXPost,
};

export async function dispatchSocialPostById(
  db: Database.Database,
  postId: number,
  options: {
    retryFailedOnly?: boolean;
    env?: NodeJS.ProcessEnv;
    transport?: SocialPublishTransport;
  } = {}
): Promise<AdminSocialPostRecord | null> {
  const row = db
    .prepare('SELECT * FROM social_posts WHERE id = ?')
    .get(postId) as Parameters<typeof mapSocialPostRow>[0] | undefined;
  if (!row) return null;

  const post = mapSocialPostRow(row);
  const envCfg = getSocialChannelEnvConfig(options.env || process.env);
  const transport = options.transport || DEFAULT_TRANSPORT;
  const finalText = formatPostTextWithLink(post.bodyText, post.includeLink, envCfg.postUrl);

  const selectedChannels: Array<'telegram-1' | 'telegram-2' | 'x'> = [];
  if (post.targets.telegram1) selectedChannels.push('telegram-1');
  if (post.targets.telegram2) selectedChannels.push('telegram-2');
  if (post.targets.x) selectedChannels.push('x');

  if (selectedChannels.length === 0) {
    throw new Error('Select at least one target channel (Telegram or X) before publishing.');
  }

  const prevByChannel = new Map<string, SocialPostDeliveryItem>();
  for (const d of post.deliveries) {
    prevByChannel.set(d.channel, d);
  }

  const nextDeliveries: SocialPostDeliveryItem[] = [];
  for (const channel of selectedChannels) {
    const prev = prevByChannel.get(channel);
    if (options.retryFailedOnly && prev && prev.status === 'sent') {
      nextDeliveries.push(prev);
      continue;
    }

    const at = new Date().toISOString();
    try {
      if (channel === 'telegram-1') {
        if (!envCfg.telegramBotToken || !envCfg.telegramChatId1) {
          throw new Error('Telegram Chat 1 credentials are not configured on the server.');
        }
        await transport.publishTelegram(envCfg.telegramBotToken, envCfg.telegramChatId1, finalText);
      } else if (channel === 'telegram-2') {
        if (!envCfg.telegramBotToken || !envCfg.telegramChatId2) {
          throw new Error('Telegram Chat 2 credentials are not configured on the server.');
        }
        await transport.publishTelegram(envCfg.telegramBotToken, envCfg.telegramChatId2, finalText);
      } else if (channel === 'x') {
        if (
          !envCfg.xApiKey ||
          !envCfg.xApiSecret ||
          !envCfg.xAccessToken ||
          !envCfg.xAccessTokenSecret
        ) {
          throw new Error('X (Twitter) API credentials are not configured on the server.');
        }
        if (Array.from(finalText).length > 280) {
          throw new Error('Post text exceeds X 280-character limit.');
        }
        await transport.publishX(
          {
            xApiKey: envCfg.xApiKey,
            xApiSecret: envCfg.xApiSecret,
            xAccessToken: envCfg.xAccessToken,
            xAccessTokenSecret: envCfg.xAccessTokenSecret,
          },
          finalText
        );
      }
      nextDeliveries.push({ channel, status: 'sent', at });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message.slice(0, 220) : 'Channel delivery failed.';
      nextDeliveries.push({ channel, status: 'failed', error: msg, at });
    }
  }

  const sentCount = nextDeliveries.filter((d) => d.status === 'sent').length;
  const failedCount = nextDeliveries.filter((d) => d.status === 'failed').length;
  const nextStatus: AdminSocialPostRecord['status'] =
    sentCount > 0 && failedCount === 0
      ? 'sent'
      : sentCount > 0 && failedCount > 0
        ? 'partial'
        : 'failed';

  const nowIso = new Date().toISOString();
  db.prepare(
    `UPDATE social_posts
     SET mode = 'published', status = ?, deliveries_json = ?, updated_at = ?
     WHERE id = ?`
  ).run(nextStatus, JSON.stringify(nextDeliveries), nowIso, postId);

  const updated = db
    .prepare('SELECT * FROM social_posts WHERE id = ?')
    .get(postId) as Parameters<typeof mapSocialPostRow>[0];
  return mapSocialPostRow(updated);
}

export async function dispatchDueScheduledSocialPosts(
  db: Database.Database,
  options: {
    now?: Date;
    env?: NodeJS.ProcessEnv;
    transport?: SocialPublishTransport;
  } = {}
): Promise<AdminSocialPostRecord[]> {
  ensureAdminSchema(db);
  const { dateTime } = getTehranNowStrings(options.now || new Date());
  const dueRows = db
    .prepare(
      `SELECT id FROM social_posts
       WHERE status = 'scheduled' AND scheduled_for IS NOT NULL AND scheduled_for <= ?
       ORDER BY scheduled_for ASC`
    )
    .all(dateTime) as Array<{ id: number }>;

  const results: AdminSocialPostRecord[] = [];
  for (const row of dueRows) {
    // Atomically claim before dispatching so overlapping intervals don't double-send
    const claimed = db
      .prepare(
        `UPDATE social_posts SET status = 'draft', updated_at = ? WHERE id = ? AND status = 'scheduled'`
      )
      .run(new Date().toISOString(), row.id);
    if (claimed.changes === 0) continue;

    try {
      const dispatched = await dispatchSocialPostById(db, row.id, {
        env: options.env,
        transport: options.transport,
      });
      if (dispatched) results.push(dispatched);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Scheduled dispatch failed.';
      db.prepare(
        `UPDATE social_posts SET status = 'failed', deliveries_json = ?, updated_at = ? WHERE id = ?`
      ).run(
        JSON.stringify([{ channel: 'telegram-1', status: 'failed', error: msg, at: new Date().toISOString() }]),
        new Date().toISOString(),
        row.id
      );
    }
  }
  return results;
}

function getBearerToken(req: Request): string {
  const authHeader = req.headers.authorization || '';
  return authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
}

function sanitizeHostFromEndpoint(endpoint: string): string {
  try {
    return new URL(endpoint).hostname;
  } catch {
    return 'unknown';
  }
}

export function registerAdminRoutes(
  app: Express,
  db: Database.Database,
  deps: AdminRouteDeps
): void {
  ensureAdminSchema(db);
  const env = deps.env || process.env;
  const transport = deps.transport || DEFAULT_TRANSPORT;

  const getEnvAdminPassword = () => (env.ADMIN_PASSWORD || '').trim();

  const createAdminSession = (): string => {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = sha256Hex(rawToken);
    const now = new Date();
    const expires = new Date(now.getTime() + SESSION_TTL_MS);
    db.prepare('DELETE FROM admin_sessions WHERE expires_at < ?').run(now.toISOString());
    db.prepare(
      'INSERT INTO admin_sessions (token_hash, created_at, expires_at) VALUES (?, ?, ?)'
    ).run(tokenHash, now.toISOString(), expires.toISOString());
    return rawToken;
  };

  const isSessionTokenValid = (rawToken: string): boolean => {
    if (!rawToken || rawToken.length < 32) return false;
    const tokenHash = sha256Hex(rawToken);
    const row = db
      .prepare('SELECT expires_at FROM admin_sessions WHERE token_hash = ?')
      .get(tokenHash) as { expires_at: string } | undefined;
    if (!row) return false;
    if (row.expires_at < new Date().toISOString()) {
      db.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').run(tokenHash);
      return false;
    }
    return true;
  };

  const verifyAdminPassword = (candidate: string): boolean => {
    const envPass = getEnvAdminPassword();
    if (envPass) {
      return timingSafeTextEqual(candidate, envPass);
    }
    const storedHash = getSetting(db, 'admin_password_hash');
    if (!storedHash) return false;
    return deps.verifyPassword(candidate, storedHash);
  };

  const requireAdminAuth = (req: Request, res: Response, next: NextFunction) => {
    const token = getBearerToken(req);
    if (!isSessionTokenValid(token)) {
      res.status(401).json({ error: 'Admin authentication required.' });
      return;
    }
    next();
  };

  // =========================================================
  // PUBLIC: GET /api/game/config (Today's overrides + banner)
  // =========================================================
  app.get('/api/game/config', (req, res) => {
    try {
      const requested = typeof req.query.date === 'string' ? req.query.date.trim() : '';
      const dateKey = /^\d{4}-\d{2}-\d{2}$/.test(requested)
        ? requested
        : getTehranNowStrings().date;

      const overrideRows = db
        .prepare('SELECT word_length, word FROM daily_word_overrides WHERE date_key = ?')
        .all(dateKey) as Array<{ word_length: number; word: string }>;

      const wordOverrides: { [len: number]: string } = {};
      for (const row of overrideRows) {
        if (row.word_length === 4 || row.word_length === 5 || row.word_length === 6) {
          wordOverrides[row.word_length] = row.word;
        }
      }

      res.json({
        dateKey,
        wordOverrides,
        announcement: getAnnouncement(db),
      });
    } catch (err) {
      console.error('Game config error:', err);
      res.status(500).json({ error: 'Failed to load game configuration.' });
    }
  });

  // =========================================================
  // ADMIN AUTH ROUTES
  // =========================================================
  app.get('/api/admin/status', (req, res) => {
    const hasEnvPassword = Boolean(getEnvAdminPassword());
    const hasDbPassword = Boolean(getSetting(db, 'admin_password_hash'));
    const configured = hasEnvPassword || hasDbPassword;
    const authenticated = isSessionTokenValid(getBearerToken(req));
    res.json({
      configured,
      hasEnvPassword,
      canClaimSetup: !configured,
      authenticated,
    });
  });

  app.post('/api/admin/setup', (req, res) => {
    try {
      if (getEnvAdminPassword() || getSetting(db, 'admin_password_hash')) {
        res.status(409).json({ error: 'Admin password is already configured.' });
        return;
      }
      const password = typeof req.body?.password === 'string' ? req.body.password : '';
      if (password.length < 8 || password.length > 128) {
        res.status(400).json({ error: 'Admin password must be between 8 and 128 characters.' });
        return;
      }

      const hash = deps.hashPassword(password);
      const inserted = db
        .prepare(
          'INSERT OR IGNORE INTO app_settings (setting_key, setting_value, updated_at) VALUES (?, ?, ?)'
        )
        .run('admin_password_hash', hash, new Date().toISOString());

      if (inserted.changes === 0) {
        res.status(409).json({ error: 'Admin password is already configured.' });
        return;
      }

      const token = createAdminSession();
      res.status(201).json({ ok: true, token });
    } catch (err) {
      console.error('Admin setup error:', err);
      res.status(500).json({ error: 'Failed to initialize admin password.' });
    }
  });

  app.post('/api/admin/login', (req, res) => {
    try {
      const hasEnvPassword = Boolean(getEnvAdminPassword());
      const hasDbPassword = Boolean(getSetting(db, 'admin_password_hash'));
      if (!hasEnvPassword && !hasDbPassword) {
        res.status(400).json({ error: 'Admin password is not configured yet. Complete setup first.' });
        return;
      }
      const password = typeof req.body?.password === 'string' ? req.body.password : '';
      if (!password || !verifyAdminPassword(password)) {
        res.status(401).json({ error: 'Invalid admin password.' });
        return;
      }
      const token = createAdminSession();
      res.json({ ok: true, token });
    } catch (err) {
      console.error('Admin login error:', err);
      res.status(500).json({ error: 'Admin login failed.' });
    }
  });

  app.post('/api/admin/logout', requireAdminAuth, (req, res) => {
    const token = getBearerToken(req);
    if (token) {
      db.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').run(sha256Hex(token));
    }
    res.json({ ok: true });
  });

  app.put('/api/admin/password', requireAdminAuth, (req, res) => {
    try {
      const currentPassword =
        typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
      const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';

      if (!verifyAdminPassword(currentPassword)) {
        res.status(401).json({ error: 'Current password is incorrect.' });
        return;
      }
      if (newPassword.length < 8 || newPassword.length > 128) {
        res.status(400).json({ error: 'New password must be between 8 and 128 characters.' });
        return;
      }

      setSetting(db, 'admin_password_hash', deps.hashPassword(newPassword));
      const hasEnv = Boolean(getEnvAdminPassword());
      res.json({
        ok: true,
        ...(hasEnv
          ? {
              note: 'Saved to database. Note that ADMIN_PASSWORD environment variable takes precedence while set.',
            }
          : {}),
      });
    } catch (err) {
      console.error('Admin change password error:', err);
      res.status(500).json({ error: 'Failed to update admin password.' });
    }
  });

  // =========================================================
  // OVERVIEW ANALYTICS
  // =========================================================
  app.get('/api/admin/overview', requireAdminAuth, (_req, res) => {
    try {
      const todayTehran = getTehranNowStrings().date;
      const userRows = db
        .prepare('SELECT username, stats_json, created_at FROM users')
        .all() as Array<{ username: string; stats_json: string; created_at: string }>;

      let activeToday = 0;
      let totalGamesPlayed = 0;
      let totalGamesWon = 0;
      let totalSeeds = 0;

      // 14-day rolling series
      const dates14: string[] = [];
      const seriesMap = new Map<string, { date: string; signups: number; activePlayers: number }>();
      for (let i = 13; i >= 0; i--) {
        const d = addDaysToIsoDate(todayTehran, -i);
        dates14.push(d);
        seriesMap.set(d, { date: d, signups: 0, activePlayers: 0 });
      }

      for (const row of userRows) {
        const createdDay = (row.created_at || '').slice(0, 10);
        if (seriesMap.has(createdDay)) {
          seriesMap.get(createdDay)!.signups += 1;
        }
        try {
          const st = JSON.parse(row.stats_json) || {};
          totalGamesPlayed += Math.max(0, Number(st.gamesPlayed) || 0);
          totalGamesWon += Math.max(0, Number(st.gamesWon) || 0);
          totalSeeds += Math.max(0, Number(st.points) || 0);
          const lastPlayed = typeof st.lastPlayedDate === 'string' ? st.lastPlayedDate : '';
          if (lastPlayed === todayTehran) activeToday += 1;
          if (lastPlayed && seriesMap.has(lastPlayed)) {
            seriesMap.get(lastPlayed)!.activePlayers += 1;
          }
          if (st.completedDates && typeof st.completedDates === 'object') {
            for (const dk of Object.keys(st.completedDates)) {
              if (dk !== lastPlayed && seriesMap.has(dk)) {
                seriesMap.get(dk)!.activePlayers += 1;
              }
            }
          }
        } catch {}
      }

      const refRow = db.prepare('SELECT COUNT(*) AS cnt FROM referrals').get() as { cnt: number };
      const pushRow = db.prepare('SELECT COUNT(*) AS cnt FROM push_subscriptions').get() as {
        cnt: number;
      };
      const sentPostsRow = db
        .prepare("SELECT COUNT(*) AS cnt FROM social_posts WHERE status IN ('sent', 'partial')")
        .get() as { cnt: number };
      const schedPostsRow = db
        .prepare("SELECT COUNT(*) AS cnt FROM social_posts WHERE status = 'scheduled'")
        .get() as { cnt: number };

      const overrides = db
        .prepare('SELECT word_length, word, note FROM daily_word_overrides WHERE date_key = ?')
        .all(todayTehran) as Array<{ word_length: number; word: string; note: string }>;
      const overrideMap = new Map(overrides.map((o) => [o.word_length, o]));

      const todayWords = ([4, 5, 6] as const).map((len) => {
        const defaultEntry = getDailyWordServer(todayTehran, len);
        const ov = overrideMap.get(len);
        return {
          length: len,
          word: ov ? ov.word : defaultEntry.word,
          defaultWord: defaultEntry.word,
          isOverridden: Boolean(ov),
          note: ov?.note || '',
        };
      });

      const winRate =
        totalGamesPlayed > 0 ? Math.round((totalGamesWon / totalGamesPlayed) * 1000) / 10 : 0;

      res.json({
        todayTehran,
        kpis: {
          totalUsers: userRows.length,
          activeToday,
          totalGamesPlayed,
          totalGamesWon,
          winRate,
          totalSeeds,
          totalReferrals: Number(refRow?.cnt || 0),
          pushSubscribers: Number(pushRow?.cnt || 0),
          socialPostsSent: Number(sentPostsRow?.cnt || 0),
          scheduledPostsCount: Number(schedPostsRow?.cnt || 0),
        },
        activitySeries: dates14.map((d) => seriesMap.get(d)!),
        todayWords,
        channels: getSocialChannelReadiness(env),
        announcement: getAnnouncement(db),
      });
    } catch (err) {
      console.error('Admin overview error:', err);
      res.status(500).json({ error: 'Failed to load overview analytics.' });
    }
  });

  // =========================================================
  // USERS DATABASE MANAGER
  // =========================================================
  app.get('/api/admin/users', requireAdminAuth, (_req, res) => {
    try {
      const pushCounts = db
        .prepare(
          'SELECT username, COUNT(*) AS cnt FROM push_subscriptions WHERE username IS NOT NULL GROUP BY username'
        )
        .all() as Array<{ username: string; cnt: number }>;
      const pushMap = new Map(pushCounts.map((r) => [r.username, Number(r.cnt)]));

      const rows = db
        .prepare(
          'SELECT username, stats_json, game_states_json, created_at, updated_at FROM users ORDER BY updated_at DESC'
        )
        .all() as Array<{
        username: string;
        stats_json: string;
        game_states_json: string;
        created_at: string;
        updated_at: string;
      }>;

      const users = rows.map((row) => {
        let stats = {};
        let gameStates = {};
        try {
          stats = JSON.parse(row.stats_json) || {};
        } catch {}
        try {
          gameStates = JSON.parse(row.game_states_json) || {};
        } catch {}
        return {
          username: row.username,
          stats,
          gameStates,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          pushSubscriptionsCount: pushMap.get(row.username) || 0,
        };
      });

      res.json({ users });
    } catch (err) {
      console.error('Admin list users error:', err);
      res.status(500).json({ error: 'Failed to load users.' });
    }
  });

  app.put('/api/admin/users/:username', requireAdminAuth, (req, res) => {
    try {
      const username = String(req.params.username || '').trim();
      const row = db
        .prepare(
          'SELECT username, password_hash, stats_json, game_states_json, created_at, updated_at FROM users WHERE username = ?'
        )
        .get(username) as
        | {
            username: string;
            password_hash: string;
            stats_json: string;
            game_states_json: string;
            created_at: string;
            updated_at: string;
          }
        | undefined;

      if (!row) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      let currentStats: Record<string, unknown> = {};
      let currentGameStates: Record<string, unknown> = {};
      try {
        currentStats = JSON.parse(row.stats_json) || {};
      } catch {}
      try {
        currentGameStates = JSON.parse(row.game_states_json) || {};
      } catch {}

      const clampInt = (val: unknown, fallback: number, max = 1_000_000) => {
        const n = Number(val);
        if (!Number.isFinite(n)) return fallback;
        return Math.max(0, Math.min(max, Math.round(n)));
      };

      if (req.body?.stats && typeof req.body.stats === 'object') {
        const s = req.body.stats as Record<string, unknown>;
        if ('points' in s) currentStats.points = clampInt(s.points, Number(currentStats.points) || 0);
        if ('currentStreak' in s)
          currentStats.currentStreak = clampInt(s.currentStreak, Number(currentStats.currentStreak) || 0, 10000);
        if ('maxStreak' in s)
          currentStats.maxStreak = clampInt(s.maxStreak, Number(currentStats.maxStreak) || 0, 10000);
        if ('gamesPlayed' in s)
          currentStats.gamesPlayed = clampInt(s.gamesPlayed, Number(currentStats.gamesPlayed) || 0, 100000);
        if ('gamesWon' in s)
          currentStats.gamesWon = clampInt(s.gamesWon, Number(currentStats.gamesWon) || 0, 100000);
        if ('lastPlayedDate' in s && typeof s.lastPlayedDate === 'string') {
          const trimmed = s.lastPlayedDate.trim();
          if (trimmed === '' || /^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
            currentStats.lastPlayedDate = trimmed;
          }
        }
        if (s.guessDistribution && typeof s.guessDistribution === 'object') {
          const gdRaw = s.guessDistribution as Record<string, unknown>;
          const nextGd: Record<string, number> = {};
          for (const k of ['1', '2', '3', '4', '5', '6']) {
            nextGd[k] = clampInt(gdRaw[k], 0, 100000);
          }
          currentStats.guessDistribution = nextGd;
        }
        if (s.completedDates && typeof s.completedDates === 'object') {
          currentStats.completedDates = s.completedDates;
        }
      }

      if (req.body?.resetToday === true) {
        const todayTehran = getTehranNowStrings().date;
        for (const key of Object.keys(currentGameStates)) {
          const st = currentGameStates[key] as { dateKey?: string } | undefined;
          if (!st?.dateKey || st.dateKey === todayTehran) {
            delete currentGameStates[key];
          }
        }
      } else if (req.body?.gameStates && typeof req.body.gameStates === 'object') {
        currentGameStates = req.body.gameStates;
      }

      let nextPasswordHash = row.password_hash;
      if (typeof req.body?.newPassword === 'string' && req.body.newPassword.length > 0) {
        if (req.body.newPassword.length < 4 || req.body.newPassword.length > 128) {
          res.status(400).json({ error: 'New user password must be between 4 and 128 characters.' });
          return;
        }
        nextPasswordHash = deps.hashPassword(req.body.newPassword);
      }

      const nowIso = new Date().toISOString();
      db.prepare(
        `UPDATE users
         SET password_hash = ?, stats_json = ?, game_states_json = ?, updated_at = ?
         WHERE username = ?`
      ).run(
        nextPasswordHash,
        JSON.stringify(currentStats),
        JSON.stringify(currentGameStates),
        nowIso,
        username
      );

      const pushRow = db
        .prepare('SELECT COUNT(*) AS cnt FROM push_subscriptions WHERE username = ?')
        .get(username) as { cnt: number };

      res.json({
        ok: true,
        user: {
          username,
          stats: currentStats,
          gameStates: currentGameStates,
          createdAt: row.created_at,
          updatedAt: nowIso,
          pushSubscriptionsCount: Number(pushRow?.cnt || 0),
        },
      });
    } catch (err) {
      console.error('Admin update user error:', err);
      res.status(500).json({ error: 'Failed to update user.' });
    }
  });

  app.delete('/api/admin/users/:username', requireAdminAuth, (req, res) => {
    try {
      const username = String(req.params.username || '').trim();
      const del = db.prepare('DELETE FROM users WHERE username = ?').run(username);
      if (del.changes === 0) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }
      db.prepare('UPDATE push_subscriptions SET username = NULL WHERE username = ?').run(username);
      db.prepare('DELETE FROM referrals WHERE invitee_username = ? OR referrer_username = ?').run(
        username,
        username
      );
      res.json({ ok: true });
    } catch (err) {
      console.error('Admin delete user error:', err);
      res.status(500).json({ error: 'Failed to delete user.' });
    }
  });

  // =========================================================
  // SOCIAL POST STUDIO (MANUAL + SCHEDULED + TEMPLATES + LOG)
  // =========================================================
  app.get('/api/admin/social/posts', requireAdminAuth, (_req, res) => {
    try {
      const rows = db
        .prepare('SELECT * FROM social_posts ORDER BY id DESC LIMIT 150')
        .all() as Array<Parameters<typeof mapSocialPostRow>[0]>;
      res.json({
        posts: rows.map(mapSocialPostRow),
        channels: getSocialChannelReadiness(env),
      });
    } catch (err) {
      console.error('Admin get social posts error:', err);
      res.status(500).json({ error: 'Failed to load social posts.' });
    }
  });

  app.post('/api/admin/social/posts', requireAdminAuth, async (req, res) => {
    try {
      const title =
        typeof req.body?.title === 'string' ? req.body.title.trim().slice(0, 120) : '';
      const bodyText =
        typeof req.body?.bodyText === 'string' ? req.body.bodyText.trim() : '';
      if (!bodyText || bodyText.length > 2000) {
        res.status(400).json({ error: 'Post text is required and must be under 2000 characters.' });
        return;
      }
      const includeLink = req.body?.includeLink !== false;
      const targets = normalizeTargets(req.body?.targets);
      const requestedMode = String(req.body?.mode || 'draft');
      const publishNow = Boolean(req.body?.publishNow);
      const scheduledFor = normalizeScheduledFor(req.body?.scheduledFor);

      let mode: AdminSocialPostRecord['mode'] = 'draft';
      let status: AdminSocialPostRecord['status'] = 'draft';

      if (publishNow) {
        mode = 'published';
        status = 'draft';
      } else if (requestedMode === 'template') {
        mode = 'template';
        status = 'draft';
      } else if (requestedMode === 'scheduled') {
        if (!scheduledFor) {
          res.status(400).json({ error: 'Valid scheduled date/time (YYYY-MM-DDTHH:mm) is required.' });
          return;
        }
        if (!targets.telegram1 && !targets.telegram2 && !targets.x) {
          res.status(400).json({ error: 'Select at least one channel to schedule this post.' });
          return;
        }
        mode = 'scheduled';
        status = 'scheduled';
      }

      const nowIso = new Date().toISOString();
      const info = db
        .prepare(
          `INSERT INTO social_posts
           (title, body_text, include_link, mode, targets_json, scheduled_for, status, deliveries_json, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, '[]', ?, ?)`
        )
        .run(
          title,
          bodyText,
          includeLink ? 1 : 0,
          mode,
          JSON.stringify(targets),
          mode === 'scheduled' ? scheduledFor : null,
          status,
          nowIso,
          nowIso
        );

      const postId = Number(info.lastInsertRowid);
      if (publishNow) {
        const published = await dispatchSocialPostById(db, postId, { env, transport });
        res.status(201).json({ ok: true, post: published });
        return;
      }

      const created = db
        .prepare('SELECT * FROM social_posts WHERE id = ?')
        .get(postId) as Parameters<typeof mapSocialPostRow>[0];
      res.status(201).json({ ok: true, post: mapSocialPostRow(created) });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create social post.';
      res.status(400).json({ error: msg });
    }
  });

  app.put('/api/admin/social/posts/:id', requireAdminAuth, (req, res) => {
    try {
      const id = Number(req.params.id);
      const existingRow = db
        .prepare('SELECT * FROM social_posts WHERE id = ?')
        .get(id) as Parameters<typeof mapSocialPostRow>[0] | undefined;
      if (!existingRow) {
        res.status(404).json({ error: 'Post not found.' });
        return;
      }

      const existing = mapSocialPostRow(existingRow);
      const title =
        typeof req.body?.title === 'string'
          ? req.body.title.trim().slice(0, 120)
          : existing.title;
      const bodyText =
        typeof req.body?.bodyText === 'string' ? req.body.bodyText.trim() : existing.bodyText;
      if (!bodyText || bodyText.length > 2000) {
        res.status(400).json({ error: 'Post text must be between 1 and 2000 characters.' });
        return;
      }
      const includeLink =
        typeof req.body?.includeLink === 'boolean' ? req.body.includeLink : existing.includeLink;
      const targets = req.body?.targets ? normalizeTargets(req.body.targets) : existing.targets;
      const modeRaw = typeof req.body?.mode === 'string' ? req.body.mode : existing.mode;
      const mode = (['draft', 'template', 'scheduled', 'published'].includes(modeRaw)
        ? modeRaw
        : existing.mode) as AdminSocialPostRecord['mode'];
      const scheduledFor =
        req.body?.scheduledFor !== undefined
          ? normalizeScheduledFor(req.body.scheduledFor)
          : existing.scheduledFor;

      let status = existing.status;
      if (mode === 'scheduled') {
        if (!scheduledFor) {
          res.status(400).json({ error: 'Valid scheduled date/time is required.' });
          return;
        }
        status = 'scheduled';
      } else if (mode === 'draft' || mode === 'template') {
        status = 'draft';
      }

      const nowIso = new Date().toISOString();
      db.prepare(
        `UPDATE social_posts
         SET title = ?, body_text = ?, include_link = ?, mode = ?, targets_json = ?, scheduled_for = ?, status = ?, updated_at = ?
         WHERE id = ?`
      ).run(
        title,
        bodyText,
        includeLink ? 1 : 0,
        mode,
        JSON.stringify(targets),
        mode === 'scheduled' ? scheduledFor : null,
        status,
        nowIso,
        id
      );

      const updated = db
        .prepare('SELECT * FROM social_posts WHERE id = ?')
        .get(id) as Parameters<typeof mapSocialPostRow>[0];
      res.json({ ok: true, post: mapSocialPostRow(updated) });
    } catch (err) {
      console.error('Admin update social post error:', err);
      res.status(500).json({ error: 'Failed to update social post.' });
    }
  });

  app.delete('/api/admin/social/posts/:id', requireAdminAuth, (req, res) => {
    const id = Number(req.params.id);
    const del = db.prepare('DELETE FROM social_posts WHERE id = ?').run(id);
    if (del.changes === 0) {
      res.status(404).json({ error: 'Post not found.' });
      return;
    }
    res.json({ ok: true });
  });

  app.post('/api/admin/social/posts/:id/publish', requireAdminAuth, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const retryFailedOnly = Boolean(req.body?.retryFailedOnly);
      const updated = await dispatchSocialPostById(db, id, {
        retryFailedOnly,
        env,
        transport,
      });
      if (!updated) {
        res.status(404).json({ error: 'Post not found.' });
        return;
      }
      res.json({ ok: true, post: updated });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to publish post.';
      res.status(400).json({ error: msg });
    }
  });

  // =========================================================
  // DAILY WORDS SCHEDULE & OVERRIDES
  // =========================================================
  app.get('/api/admin/daily-words', requireAdminAuth, (req, res) => {
    try {
      const days = Math.max(7, Math.min(45, Number(req.query.days) || 21));
      const todayTehran = getTehranNowStrings().date;
      const startDate = addDaysToIsoDate(todayTehran, -3);
      const endDate = addDaysToIsoDate(startDate, days - 1);

      const overrideRows = db
        .prepare(
          'SELECT date_key, word_length, word, note FROM daily_word_overrides WHERE date_key >= ? AND date_key <= ?'
        )
        .all(startDate, endDate) as Array<{
        date_key: string;
        word_length: number;
        word: string;
        note: string;
      }>;

      const ovMap = new Map<string, { word: string; note: string }>();
      for (const r of overrideRows) {
        ovMap.set(`${r.date_key}:${r.word_length}`, { word: r.word, note: r.note || '' });
      }

      const rows = [];
      for (let i = 0; i < days; i++) {
        const dk = addDaysToIsoDate(startDate, i);
        const words: Record<
          number,
          { word: string; defaultWord: string; isOverridden: boolean; note: string }
        > = {};
        for (const len of [4, 5, 6] as const) {
          const defWord = getDailyWordServer(dk, len).word;
          const ov = ovMap.get(`${dk}:${len}`);
          words[len] = {
            word: ov ? ov.word : defWord,
            defaultWord: defWord,
            isOverridden: Boolean(ov),
            note: ov?.note || '',
          };
        }
        rows.push({
          dateKey: dk,
          isToday: dk === todayTehran,
          words,
        });
      }

      res.json({ todayTehran, rows });
    } catch (err) {
      console.error('Admin daily words error:', err);
      res.status(500).json({ error: 'Failed to load daily word schedule.' });
    }
  });

  app.put('/api/admin/daily-words', requireAdminAuth, (req, res) => {
    const check = validateWordOverrideInput(
      req.body?.dateKey,
      req.body?.wordLength,
      req.body?.word,
      req.body?.note
    );
    if (!check.valid || !check.dateKey || !check.wordLength || !check.word) {
      res.status(400).json({ error: check.error || 'Invalid word override.' });
      return;
    }

    db.prepare(
      `INSERT OR REPLACE INTO daily_word_overrides (date_key, word_length, word, note, updated_at)
       VALUES (?, ?, ?, ?, ?)`
    ).run(check.dateKey, check.wordLength, check.word, check.note || '', new Date().toISOString());

    res.json({ ok: true, word: check.word });
  });

  app.delete('/api/admin/daily-words/:dateKey/:wordLength', requireAdminAuth, (req, res) => {
    const dateKey = String(req.params.dateKey || '').trim();
    const wordLength = Number(req.params.wordLength);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey) || ![4, 5, 6].includes(wordLength)) {
      res.status(400).json({ error: 'Invalid dateKey or wordLength.' });
      return;
    }
    db.prepare('DELETE FROM daily_word_overrides WHERE date_key = ? AND word_length = ?').run(
      dateKey,
      wordLength
    );
    res.json({ ok: true });
  });

  // =========================================================
  // WEB PUSH STATS & BROADCAST
  // =========================================================
  app.get('/api/admin/push/stats', requireAdminAuth, (_req, res) => {
    try {
      const todayTehran = getTehranNowStrings().date;
      const rows = db
        .prepare(
          'SELECT endpoint_hash, endpoint, username, last_pushed_date, created_at FROM push_subscriptions ORDER BY created_at DESC'
        )
        .all() as Array<{
        endpoint_hash: string;
        endpoint: string;
        username: string | null;
        last_pushed_date: string | null;
        created_at: string;
      }>;

      let linkedUsersCount = 0;
      let guestDevicesCount = 0;
      let pushedTodayCount = 0;

      for (const r of rows) {
        if (r.username) linkedUsersCount++;
        else guestDevicesCount++;
        if (r.last_pushed_date === todayTehran) pushedTodayCount++;
      }

      res.json({
        totalSubscriptions: rows.length,
        linkedUsersCount,
        guestDevicesCount,
        pushedTodayCount,
        todayTehran,
        recentSubscriptions: rows.slice(0, 25).map((r) => ({
          id: r.endpoint_hash.slice(0, 12),
          host: sanitizeHostFromEndpoint(r.endpoint),
          username: r.username,
          lastPushedDate: r.last_pushed_date,
          createdAt: r.created_at,
        })),
      });
    } catch (err) {
      console.error('Admin push stats error:', err);
      res.status(500).json({ error: 'Failed to load push stats.' });
    }
  });

  app.post('/api/admin/push/broadcast', requireAdminAuth, async (req, res) => {
    try {
      const vapid = deps.getOrCreateVapidKeys();
      const todayTehran = getTehranNowStrings().date;
      const force = req.body?.force !== false;

      const subs = (
        force
          ? db
              .prepare('SELECT endpoint_hash, endpoint, p256dh, auth, username FROM push_subscriptions')
              .all()
          : db
              .prepare(
                'SELECT endpoint_hash, endpoint, p256dh, auth, username FROM push_subscriptions WHERE last_pushed_date IS NULL OR last_pushed_date != ?'
              )
              .all(todayTehran)
      ) as Array<{
        endpoint_hash: string;
        endpoint: string;
        p256dh: string;
        auth: string;
        username: string | null;
      }>;

      const markStmt = db.prepare(
        'UPDATE push_subscriptions SET last_pushed_date = ?, updated_at = ? WHERE endpoint_hash = ?'
      );
      const delStmt = db.prepare('DELETE FROM push_subscriptions WHERE endpoint_hash = ?');

      let sent = 0;
      let pruned = 0;
      let failed = 0;
      const nowIso = new Date().toISOString();

      for (const sub of subs) {
        try {
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
        } catch {
          failed++;
        }
      }

      res.json({
        ok: true,
        dateTehran: todayTehran,
        totalChecked: subs.length,
        sent,
        pruned,
        failed,
      });
    } catch (err) {
      console.error('Admin push broadcast error:', err);
      res.status(500).json({ error: 'Failed to send push broadcast.' });
    }
  });

  // =========================================================
  // REFERRALS TRACKING & LEADERBOARD
  // =========================================================
  app.get('/api/admin/referrals', requireAdminAuth, (_req, res) => {
    try {
      const totals = db
        .prepare('SELECT COUNT(*) AS cnt, COALESCE(SUM(reward_points), 0) AS total FROM referrals')
        .get() as { cnt: number; total: number };

      const leaderboard = db
        .prepare(
          `SELECT referrer_username AS username, COUNT(*) AS referralsCount, COALESCE(SUM(reward_points), 0) AS totalRewardSeeds
           FROM referrals
           GROUP BY referrer_username
           ORDER BY referralsCount DESC, totalRewardSeeds DESC
           LIMIT 50`
        )
        .all() as Array<{
        username: string;
        referralsCount: number;
        totalRewardSeeds: number;
      }>;

      const recent = db
        .prepare(
          `SELECT invitee_username AS inviteeUsername, referrer_username AS referrerUsername, reward_points AS rewardPoints, created_at AS createdAt
           FROM referrals
           ORDER BY created_at DESC
           LIMIT 100`
        )
        .all() as Array<{
        inviteeUsername: string;
        referrerUsername: string;
        rewardPoints: number;
        createdAt: string;
      }>;

      res.json({
        totalReferrals: Number(totals?.cnt || 0),
        totalRewardSeeds: Number(totals?.total || 0),
        leaderboard: leaderboard.map((r) => ({
          username: r.username,
          referralsCount: Number(r.referralsCount || 0),
          totalRewardSeeds: Number(r.totalRewardSeeds || 0),
        })),
        recent: recent.map((r) => ({
          inviteeUsername: r.inviteeUsername,
          referrerUsername: r.referrerUsername,
          rewardPoints: Number(r.rewardPoints || 0),
          createdAt: r.createdAt,
        })),
      });
    } catch (err) {
      console.error('Admin referrals error:', err);
      res.status(500).json({ error: 'Failed to load referral analytics.' });
    }
  });

  // =========================================================
  // IN-GAME ANNOUNCEMENT BANNER
  // =========================================================
  app.get('/api/admin/announcement', requireAdminAuth, (_req, res) => {
    res.json({ announcement: getAnnouncement(db) });
  });

  app.put('/api/admin/announcement', requireAdminAuth, (req, res) => {
    const check = validateAnnouncementInput(req.body);
    if (!check.valid || !check.value) {
      res.status(400).json({ error: check.error || 'Invalid announcement.' });
      return;
    }
    setSetting(db, 'site_announcement', JSON.stringify(check.value));
    res.json({ ok: true, announcement: check.value });
  });
}
