import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createXOAuth1Header,
  getSocialPostConfig,
  getTehranDateTime,
  publishDailySocialPost,
  type SocialPostConfig,
  type SocialPostDatabase,
} from './socialPosts';

interface TestDatabaseHandle {
  db: SocialPostDatabase;
  close: () => void;
}

/**
 * Creates an in-memory SQLite database when better-sqlite3 or node:sqlite is available,
 * and falls back cleanly to a deterministic in-memory SQL test double so CI environments
 * (e.g., Node 20 without native optionalDependencies) never fail with ERR_MODULE_NOT_FOUND.
 */
async function createTestDatabase(): Promise<TestDatabaseHandle> {
  try {
    const mod = await import('better-sqlite3');
    const BetterSqlite3 = mod.default;
    const db = new BetterSqlite3(':memory:');
    return { db, close: () => db.close() };
  } catch {
    // Fall back to Node's built-in node:sqlite (Node 22+) when available
  }

  try {
    const sqlite = await import('node:sqlite');
    const db = new sqlite.DatabaseSync(':memory:');
    return {
      db: db as unknown as SocialPostDatabase,
      close: () => db.close(),
    };
  } catch {
    // Fall back to a strict in-memory SQL adapter for Node 20 CI runners
  }

  const runs = new Map<string, { date: string; post_text: string; created_at: string }>();
  const deliveries = new Map<
    string,
    { date: string; target: string; status: string; error: string | null; updated_at: string }
  >();

  const db: SocialPostDatabase = {
    exec() {},
    prepare(sql: string) {
      const norm = sql.replace(/\s+/g, ' ').trim();
      return {
        get(...params: unknown[]) {
          if (norm.startsWith('SELECT post_text FROM social_post_runs WHERE date = ?')) {
            const row = runs.get(String(params[0]));
            return row ? { post_text: row.post_text } : undefined;
          }
          if (norm.startsWith('SELECT COUNT(*) AS count FROM social_post_runs')) {
            return { count: runs.size };
          }
          throw new Error(`Unsupported test SQL get: ${norm}`);
        },
        all(...params: unknown[]) {
          if (norm.startsWith('SELECT target, status, error FROM social_post_deliveries WHERE date = ?')) {
            const date = String(params[0]);
            return Array.from(deliveries.values())
              .filter((r) => r.date === date)
              .sort((a, b) => (a.target < b.target ? -1 : a.target > b.target ? 1 : 0))
              .map(({ target, status, error }) => ({ target, status, error }));
          }
          throw new Error(`Unsupported test SQL all: ${norm}`);
        },
        run(...params: unknown[]) {
          if (norm.startsWith('INSERT OR IGNORE INTO social_post_runs')) {
            const [date, post_text, created_at] = params.map(String);
            if (!runs.has(date)) {
              runs.set(date, { date, post_text, created_at });
              return { changes: 1 };
            }
            return { changes: 0 };
          }
          if (norm.startsWith('INSERT OR IGNORE INTO social_post_deliveries')) {
            const [date, target, status, updated_at] = params.map(String);
            const key = `${date}::${target}`;
            if (!deliveries.has(key)) {
              deliveries.set(key, { date, target, status, error: null, updated_at });
              return { changes: 1 };
            }
            return { changes: 0 };
          }
          if (norm.startsWith("UPDATE social_post_deliveries SET status = 'sending'")) {
            const [updated_at, date, target] = params.map(String);
            const key = `${date}::${target}`;
            const row = deliveries.get(key);
            if (row && row.status === 'pending') {
              row.status = 'sending';
              row.error = null;
              row.updated_at = updated_at;
              return { changes: 1 };
            }
            return { changes: 0 };
          }
          if (norm.startsWith('UPDATE social_post_deliveries SET status = ?, error = ?, updated_at = ?')) {
            const [status, error, updated_at, date, target, expectedStatus] = params;
            const key = `${String(date)}::${String(target)}`;
            const row = deliveries.get(key);
            if (row && row.status === String(expectedStatus)) {
              row.status = String(status);
              row.error = error === null || error === undefined ? null : String(error);
              row.updated_at = String(updated_at);
              return { changes: 1 };
            }
            return { changes: 0 };
          }
          throw new Error(`Unsupported test SQL run: ${norm}`);
        },
      };
    },
  };

  return { db, close: () => {} };
}

const config: SocialPostConfig = {
  geminiApiKey: 'gemini-key',
  telegramBotToken: 'telegram-token',
  telegramChatIds: ['chat-one', 'chat-two'],
  xApiKey: 'x-key',
  xApiSecret: 'x-secret',
  xAccessToken: 'x-access-token',
  xAccessTokenSecret: 'x-access-secret',
  postUrl: 'https://kalambaz.ir',
};

test('social post config stays disabled until required credentials exist, makes chat 2 optional, and requires HTTPS URL', () => {
  assert.deepEqual(getSocialPostConfig({}).missing.length, 7);

  const singleChatEnv = {
    GEMINI_API_KEY: config.geminiApiKey,
    TELEGRAM_BOT_TOKEN: config.telegramBotToken,
    TELEGRAM_CHAT_ID_1: config.telegramChatIds[0],
    X_API_KEY: config.xApiKey,
    X_API_SECRET: config.xApiSecret,
    X_ACCESS_TOKEN: config.xAccessToken,
    X_ACCESS_TOKEN_SECRET: config.xAccessTokenSecret,
    SOCIAL_POSTS_URL: config.postUrl,
  };
  const singleResolved = getSocialPostConfig(singleChatEnv);
  assert.equal(singleResolved.missing.length, 0);
  assert.deepEqual(singleResolved.config?.telegramChatIds, [config.telegramChatIds[0]]);
  assert.equal(singleResolved.config?.postUrl, config.postUrl);

  const twoChatResolved = getSocialPostConfig({
    ...singleChatEnv,
    TELEGRAM_CHAT_ID_2: config.telegramChatIds[1],
  });
  assert.deepEqual(twoChatResolved.config?.telegramChatIds, config.telegramChatIds);

  assert.throws(
    () => getSocialPostConfig({ ...singleChatEnv, SOCIAL_POSTS_URL: 'http://kalambaz.ir' }),
    /HTTPS/
  );
});

test('daily schedule uses the Tehran calendar and time', () => {
  assert.deepEqual(getTehranDateTime(new Date('2026-11-23T05:30:00.000Z')), {
    date: '2026-11-23',
    hour: 9,
    minute: 0,
  });
  assert.equal(getTehranDateTime(new Date('2026-11-23T20:30:00.000Z')).date, '2026-11-24');
});

test('X OAuth 1.0 header is deterministic with a fixed nonce and timestamp', () => {
  const authorization = createXOAuth1Header(config, 'test-nonce', '1700000000');
  assert.match(authorization, /^OAuth /);
  assert.match(authorization, /oauth_consumer_key="x-key"/);
  assert.match(authorization, /oauth_token="x-access-token"/);
  assert.match(authorization, /oauth_signature="[^"]+"/);
  assert.equal(authorization, createXOAuth1Header(config, 'test-nonce', '1700000000'));
});

test('daily dispatch persists one generated post and never repeats destination attempts', async () => {
  const { db, close } = await createTestDatabase();
  let generated = 0;
  const telegramChats: string[] = [];
  let xAttempts = 0;
  const dependencies = {
    generatePost: async () => {
      generated++;
      return 'کلمه امروز را حدس بزن!';
    },
    publishTelegram: async (chatId: string) => {
      telegramChats.push(chatId);
    },
    publishX: async () => {
      xAttempts++;
      throw new Error('X rejected the post (HTTP 403).');
    },
  };

  try {
    const first = await publishDailySocialPost(db, config, '2026-11-23', dependencies);
    const second = await publishDailySocialPost(db, config, '2026-11-23', dependencies);

    assert.equal(generated, 1);
    assert.deepEqual(telegramChats, config.telegramChatIds);
    assert.equal(xAttempts, 1);
    assert.deepEqual(
      first.deliveries.map(({ status }) => status).sort(),
      ['failed', 'sent', 'sent']
    );
    assert.deepEqual(
      second.deliveries.map(({ status }) => status).sort(),
      ['failed', 'sent', 'sent']
    );
    assert.equal(
      (db.prepare('SELECT COUNT(*) AS count FROM social_post_runs').get() as { count: number }).count,
      1
    );
  } finally {
    close();
  }
});

test('daily dispatch works cleanly with only one Telegram chat configured', async () => {
  const { db, close } = await createTestDatabase();
  const singleChatConfig: SocialPostConfig = {
    ...config,
    telegramChatIds: ['@kalambaz_ir'],
  };
  const sentChats: string[] = [];
  let xSent = 0;

  try {
    const res = await publishDailySocialPost(db, singleChatConfig, '2026-11-27', {
      generatePost: async () => 'کلمه امروز رو می‌تونی حدس بزنی؟',
      publishTelegram: async (chatId) => {
        sentChats.push(chatId);
      },
      publishX: async () => {
        xSent++;
      },
    });

    assert.deepEqual(sentChats, ['@kalambaz_ir']);
    assert.equal(xSent, 1);
    assert.deepEqual(res.deliveries, [
      { target: 'telegram-1', status: 'sent' },
      { target: 'x', status: 'sent' },
    ]);
  } finally {
    close();
  }
});
