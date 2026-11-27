import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import {
  createXOAuth1Header,
  getSocialPostConfig,
  getTehranDateTime,
  publishDailySocialPost,
  type SocialPostConfig,
} from './socialPosts';

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
  const db = new Database(':memory:');
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
    db.close();
  }
});

test('daily dispatch works cleanly with only one Telegram chat configured', async () => {
  const db = new Database(':memory:');
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
    db.close();
  }
});
