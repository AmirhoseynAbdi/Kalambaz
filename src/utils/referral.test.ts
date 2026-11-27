import test from 'node:test';
import assert from 'node:assert/strict';
import {
  REFERRAL_REWARD_POINTS,
  buildReferralUrl,
  extractReferralFromUrl,
  sanitizeReferrerUsername,
} from './referral';

test('REFERRAL_REWARD_POINTS is 100', () => {
  assert.equal(REFERRAL_REWARD_POINTS, 100);
});

test('extractReferralFromUrl parses valid ASCII and Persian usernames', () => {
  assert.equal(extractReferralFromUrl('?ref=sohrab'), 'sohrab');
  assert.equal(extractReferralFromUrl('?autostart=1&ref=%D8%B3%D9%87%D8%B1%D8%A7%D8%A8'), 'سهراب');
  assert.equal(extractReferralFromUrl('?ref=a'), null); // too short (<2)
  assert.equal(extractReferralFromUrl('?ref='), null);
  assert.equal(extractReferralFromUrl('?ref=' + 'x'.repeat(31)), null); // too long (>30)
  assert.equal(extractReferralFromUrl('?ref=<script>'), null); // unsafe characters rejected
});

test('buildReferralUrl safely encodes Persian usernames', () => {
  const url = buildReferralUrl('سهراب', 'https://kalambaz.ir/');
  assert.equal(url, 'https://kalambaz.ir/?ref=%D8%B3%D9%87%D8%B1%D8%A7%D8%A8');
  assert.equal(extractReferralFromUrl(new URL(url).search), 'سهراب');
});

test('sanitizeReferrerUsername trims whitespace and enforces length bounds', () => {
  assert.equal(sanitizeReferrerUsername('  ali_99  '), 'ali_99');
  assert.equal(sanitizeReferrerUsername('   '), null);
  assert.equal(sanitizeReferrerUsername(null), null);
});
