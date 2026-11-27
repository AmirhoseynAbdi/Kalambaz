import { GoogleGenAI } from '@google/genai';
import crypto from 'node:crypto';
import type Database from 'better-sqlite3';

const X_POSTS_URL = 'https://api.x.com/2/tweets';

export interface SocialPostConfig {
  geminiApiKey: string;
  telegramBotToken: string;
  telegramChatIds: string[];
  xApiKey: string;
  xApiSecret: string;
  xAccessToken: string;
  xAccessTokenSecret: string;
  postUrl: string;
}

export interface SocialPostDependencies {
  generatePost: (date: string) => Promise<string>;
  publishTelegram: (chatId: string, text: string) => Promise<void>;
  publishX: (text: string) => Promise<void>;
}

export interface SocialPostResult {
  date: string;
  deliveries: Array<{ target: string; status: 'sent' | 'failed' | 'skipped'; error?: string }>;
}

const REQUIRED_ENV_VARS = [
  'GEMINI_API_KEY',
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_CHAT_ID_1',
  'X_API_KEY',
  'X_API_SECRET',
  'X_ACCESS_TOKEN',
  'X_ACCESS_TOKEN_SECRET',
] as const;

type SocialPostEnvironment = Partial<
  Record<(typeof REQUIRED_ENV_VARS)[number], string | undefined>
> & {
  TELEGRAM_CHAT_ID_2?: string | undefined;
  APP_URL?: string | undefined;
  SOCIAL_POSTS_URL?: string | undefined;
};

export function getSocialPostConfig(env: SocialPostEnvironment = process.env): {
  config?: SocialPostConfig;
  missing: string[];
} {
  const missing = REQUIRED_ENV_VARS.filter((name) => !(env[name] || '').trim());
  if (missing.length) return { missing: [...missing] };

  const value = (name: (typeof REQUIRED_ENV_VARS)[number]) => env[name]!.trim();
  const secondChatId = (env.TELEGRAM_CHAT_ID_2 || '').trim();
  const telegramChatIds = secondChatId
    ? [value('TELEGRAM_CHAT_ID_1'), secondChatId]
    : [value('TELEGRAM_CHAT_ID_1')];

  const postUrl = (env.SOCIAL_POSTS_URL || env.APP_URL || 'https://kalambaz.ir').trim();
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(postUrl);
  } catch {
    throw new Error('SOCIAL_POSTS_URL must be a valid HTTPS URL.');
  }
  if (parsedUrl.protocol !== 'https:') {
    throw new Error('SOCIAL_POSTS_URL must be a valid HTTPS URL.');
  }

  return {
    config: {
      geminiApiKey: value('GEMINI_API_KEY'),
      telegramBotToken: value('TELEGRAM_BOT_TOKEN'),
      telegramChatIds,
      xApiKey: value('X_API_KEY'),
      xApiSecret: value('X_API_SECRET'),
      xAccessToken: value('X_ACCESS_TOKEN'),
      xAccessTokenSecret: value('X_ACCESS_TOKEN_SECRET'),
      postUrl: parsedUrl.toString().replace(/\/$/, ''),
    },
    missing: [],
  };
}

export function getTehranDateTime(date: Date): { date: string; hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tehran',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value || '';

  return {
    date: `${part('year')}-${part('month')}-${part('day')}`,
    hour: Number(part('hour')),
    minute: Number(part('minute')),
  };
}

export function ensureSocialPostSchema(db: Database.Database): void {
  db.exec(`
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
  `);
}

export function createGeminiPostGenerator(
  apiKey: string,
  postUrl: string
): SocialPostDependencies['generatePost'] {
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  return async (date) => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        'Write one funny, catchy promotional post in Persian (Farsi) for Kalambaz, a daily Persian word-guessing game.',
        'Use a playful challenge or exaggerated ragebait hook, varying the wording from day to day (for example: "۹۹٪ بازیکن‌ها نمی‌تونن کلمه‌ی امروز رو حدس بزنن!").',
        'Invite people to guess today\'s word, but do not reveal or invent the answer. Keep the post under 150 characters, use at most two emojis, and return only the post text.',
        `Today's Tehran date is ${date}.`,
      ].join('\n'),
    });

    const text = response.text?.trim();
    if (!text) throw new Error('Gemini returned an empty social post.');
    if (Array.from(text).length > 180) {
      throw new Error('Gemini returned a social post that is too long.');
    }
    if (Array.from(text).filter((character) => /\p{Extended_Pictographic}/u.test(character)).length > 2) {
      throw new Error('Gemini returned a social post with too many emojis.');
    }

    return `${text}${text.includes(postUrl) ? '' : `\n${postUrl}`}`;
  };
}

function encodeOAuthValue(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

export function createXOAuth1Header(
  config: Pick<SocialPostConfig, 'xApiKey' | 'xApiSecret' | 'xAccessToken' | 'xAccessTokenSecret'>,
  nonce = crypto.randomBytes(16).toString('hex'),
  timestamp = Math.floor(Date.now() / 1000).toString()
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: config.xApiKey,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_token: config.xAccessToken,
    oauth_version: '1.0',
  };
  const normalizedParams = Object.entries(oauthParams)
    .map(([key, value]) => [encodeOAuthValue(key), encodeOAuthValue(value)] as const)
    .sort(([keyA, valueA], [keyB, valueB]) =>
      keyA === keyB
        ? valueA < valueB
          ? -1
          : valueA > valueB
            ? 1
            : 0
        : keyA < keyB
          ? -1
          : keyA > keyB
            ? 1
            : 0
    )
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  const signatureBase = [
    'POST',
    encodeOAuthValue(X_POSTS_URL),
    encodeOAuthValue(normalizedParams),
  ].join('&');
  const signingKey = `${encodeOAuthValue(config.xApiSecret)}&${encodeOAuthValue(config.xAccessTokenSecret)}`;
  oauthParams.oauth_signature = crypto
    .createHmac('sha1', signingKey)
    .update(signatureBase)
    .digest('base64');

  return `OAuth ${Object.entries(oauthParams)
    .sort(([keyA], [keyB]) => (keyA < keyB ? -1 : keyA > keyB ? 1 : 0))
    .map(([key, value]) => `${encodeOAuthValue(key)}="${encodeOAuthValue(value)}"`)
    .join(', ')}`;
}

export async function publishTelegramPost(
  botToken: string,
  chatId: string,
  text: string
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new Error('Telegram request did not return a confirmed response.');
  }

  let result: { ok?: boolean } = {};
  try {
    result = (await response.json()) as { ok?: boolean };
  } catch {
    throw new Error(`Telegram returned an invalid response (HTTP ${response.status}).`);
  }
  if (!response.ok || result.ok !== true) {
    throw new Error(`Telegram rejected the post (HTTP ${response.status}).`);
  }
}

export async function publishXPost(
  config: Pick<SocialPostConfig, 'xApiKey' | 'xApiSecret' | 'xAccessToken' | 'xAccessTokenSecret'>,
  text: string
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(X_POSTS_URL, {
      method: 'POST',
      headers: {
        Authorization: createXOAuth1Header(config),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new Error('X request did not return a confirmed response.');
  }
  if (!response.ok) throw new Error(`X rejected the post (HTTP ${response.status}).`);
}

export async function publishDailySocialPost(
  db: Database.Database,
  config: SocialPostConfig,
  date: string,
  dependencies: SocialPostDependencies
): Promise<SocialPostResult> {
  ensureSocialPostSchema(db);
  let run = db
    .prepare('SELECT post_text FROM social_post_runs WHERE date = ?')
    .get(date) as { post_text: string } | undefined;

  if (!run) {
    const generated = (await dependencies.generatePost(date)).trim();
    if (!generated) throw new Error('The generated social post is empty.');
    db.prepare('INSERT OR IGNORE INTO social_post_runs (date, post_text, created_at) VALUES (?, ?, ?)')
      .run(date, generated, new Date().toISOString());
    run = db
      .prepare('SELECT post_text FROM social_post_runs WHERE date = ?')
      .get(date) as { post_text: string } | undefined;
  }
  if (!run) throw new Error(`Could not persist the social post for ${date}.`);

  const targets = [
    ...config.telegramChatIds.map((chatId, idx) => ({
      name: `telegram-${idx + 1}`,
      publish: () => dependencies.publishTelegram(chatId, run!.post_text),
    })),
    { name: 'x', publish: () => dependencies.publishX(run!.post_text) },
  ];
  const insertDelivery = db.prepare(
    'INSERT OR IGNORE INTO social_post_deliveries (date, target, status, error, updated_at) VALUES (?, ?, ?, NULL, ?)'
  );
  const claimDelivery = db.prepare(
    "UPDATE social_post_deliveries SET status = 'sending', error = NULL, updated_at = ? WHERE date = ? AND target = ? AND status = 'pending'"
  );
  const finishDelivery = db.prepare(
    'UPDATE social_post_deliveries SET status = ?, error = ?, updated_at = ? WHERE date = ? AND target = ? AND status = ?'
  );

  for (const target of targets) {
    const now = new Date().toISOString();
    insertDelivery.run(date, target.name, 'pending', now);
    if (claimDelivery.run(now, date, target.name).changes === 0) continue;

    try {
      await target.publish();
      finishDelivery.run('sent', null, new Date().toISOString(), date, target.name, 'sending');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The destination rejected the post.';
      finishDelivery.run('failed', message, new Date().toISOString(), date, target.name, 'sending');
    }
  }

  const rows = db
    .prepare('SELECT target, status, error FROM social_post_deliveries WHERE date = ? ORDER BY target')
    .all(date) as Array<{ target: string; status: string; error: string | null }>;
  return {
    date,
    deliveries: rows.map((row) => ({
      target: row.target,
      status: row.status === 'sent' ? 'sent' : row.status === 'failed' ? 'failed' : 'skipped',
      ...(row.error ? { error: row.error } : {}),
    })),
  };
}
