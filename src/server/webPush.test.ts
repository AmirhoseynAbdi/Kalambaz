import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  generateVapidKeyPair,
  createVapidAuthHeader,
  validatePushEndpoint,
  validateSubscriptionKeys,
  fromBase64Url,
  toBase64Url,
} from './webPush';

test('generateVapidKeyPair produces a valid 65-byte uncompressed P-256 public key and verifiable ES256 VAPID JWT', () => {
  const vapid = generateVapidKeyPair('mailto:test@kalambaz.ir');
  const pubRaw = fromBase64Url(vapid.publicKey);
  assert.equal(pubRaw.length, 65);
  assert.equal(pubRaw[0], 0x04);

  const authHeader = createVapidAuthHeader('https://fcm.googleapis.com', vapid, 1700000000);
  assert.match(authHeader, /^vapid t=[^,]+, k=/);

  const tokenPart = authHeader.slice('vapid t='.length, authHeader.indexOf(', k='));
  const [hB64, pB64, sB64] = tokenPart.split('.');
  const payload = JSON.parse(fromBase64Url(pB64).toString('utf8'));
  assert.equal(payload.aud, 'https://fcm.googleapis.com');
  assert.equal(payload.exp, 1700000000 + 12 * 3600);
  assert.equal(payload.sub, 'mailto:test@kalambaz.ir');

  const rawSig = fromBase64Url(sB64);
  assert.equal(rawSig.length, 64);

  // Verify the ES256 signature using the public key derived from privateKeyPem
  const pubKeyObj = crypto.createPublicKey(vapid.privateKeyPem);
  const verified = crypto.verify(
    'sha256',
    Buffer.from(`${hB64}.${pB64}`),
    { key: pubKeyObj, dsaEncoding: 'ieee-p1363' },
    rawSig
  );
  assert.equal(verified, true);
});

test('validatePushEndpoint allows real browser push hosts and blocks SSRF/local/non-HTTPS URLs', () => {
  assert.equal(
    validatePushEndpoint('https://fcm.googleapis.com/fcm/send/abc123').valid,
    true
  );
  assert.equal(
    validatePushEndpoint('https://updates.push.services.mozilla.com/wpush/v2/xyz').valid,
    true
  );
  assert.equal(
    validatePushEndpoint('https://web.push.apple.com/QBS123').valid,
    true
  );
  assert.equal(
    validatePushEndpoint('https://wns2-bl2p.notify.windows.com/w/?token=abc').valid,
    true
  );

  // Blocked SSRF attempts
  assert.equal(validatePushEndpoint('http://fcm.googleapis.com/fcm/send/abc').valid, false);
  assert.equal(validatePushEndpoint('https://127.0.0.1/admin').valid, false);
  assert.equal(validatePushEndpoint('https://169.254.169.254/latest/meta-data/').valid, false);
  assert.equal(validatePushEndpoint('https://localhost/api').valid, false);
  assert.equal(validatePushEndpoint('https://evil.example.com/hook').valid, false);
  assert.equal(validatePushEndpoint('https://fcm.googleapis.com:8443/fcm/send/abc').valid, false);
  assert.equal(validatePushEndpoint('https://user:pass@fcm.googleapis.com/fcm/send/abc').valid, false);
});

test('validateSubscriptionKeys accepts valid P-256 + 16-byte auth and rejects malformed keys', () => {
  const validPub = Buffer.alloc(65, 0x11);
  validPub[0] = 0x04;
  const validAuth = Buffer.alloc(16, 0x22);

  assert.equal(
    validateSubscriptionKeys(toBase64Url(validPub), toBase64Url(validAuth)).valid,
    true
  );

  // Wrong prefix byte
  const badPub = Buffer.alloc(65, 0x11);
  badPub[0] = 0x02;
  assert.equal(
    validateSubscriptionKeys(toBase64Url(badPub), toBase64Url(validAuth)).valid,
    false
  );

  // Wrong auth length
  assert.equal(
    validateSubscriptionKeys(toBase64Url(validPub), toBase64Url(Buffer.alloc(8))).valid,
    false
  );
});
