import crypto from 'node:crypto';

export interface VapidKeyPair {
  publicKey: string; // base64url 65-byte uncompressed EC P-256 point
  privateKeyPem: string; // PKCS#8 / SEC1 PEM private key
  subject: string;
}

export interface PushSubscriptionRecord {
  endpoint: string;
  p256dh: string;
  auth: string;
  username?: string | null;
}

const ALLOWED_PUSH_EXACT_HOSTS = new Set([
  'fcm.googleapis.com',
  'android.googleapis.com',
  'updates.push.services.mozilla.com',
  'push.services.mozilla.com',
  'web.push.apple.com',
]);

const ALLOWED_PUSH_HOST_SUFFIXES = [
  '.push.services.mozilla.com',
  '.notify.windows.com',
  '.push.apple.com',
];

export function toBase64Url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function fromBase64Url(str: string): Buffer {
  const normalized = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + pad, 'base64');
}

export function sha256Hex(value: string): string {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

/**
 * Strict SSRF allowlist validation for Web Push subscription endpoints.
 */
export function validatePushEndpoint(rawEndpoint: unknown): {
  valid: boolean;
  endpoint?: string;
  origin?: string;
  error?: string;
} {
  if (typeof rawEndpoint !== 'string') {
    return { valid: false, error: 'آدرس اشتراک اعلان نامعتبر است.' };
  }
  const endpoint = rawEndpoint.trim();
  if (!endpoint || endpoint.length > 2048) {
    return { valid: false, error: 'طول آدرس اشتراک اعلان نامعتبر است.' };
  }

  let parsed: URL;
  try {
    parsed = new URL(endpoint);
  } catch {
    return { valid: false, error: 'فرمت آدرس اشتراک اعلان نامعتبر است.' };
  }

  if (parsed.protocol !== 'https:') {
    return { valid: false, error: 'آدرس اعلان باید از نوع HTTPS باشد.' };
  }
  if (parsed.username || parsed.password) {
    return { valid: false, error: 'آدرس اعلان نباید شامل اطلاعات ورود باشد.' };
  }
  if (parsed.port && parsed.port !== '443') {
    return { valid: false, error: 'پورت آدرس اعلان مجاز نیست.' };
  }

  const host = parsed.hostname.toLowerCase();
  // Block localhost and raw IPv4/IPv6 literals
  if (
    !host ||
    host === 'localhost' ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(host) ||
    host.includes(':')
  ) {
    return { valid: false, error: 'میزبان آدرس اعلان مجاز نیست.' };
  }

  const isAllowed =
    ALLOWED_PUSH_EXACT_HOSTS.has(host) ||
    ALLOWED_PUSH_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix) && host.length > suffix.length);

  if (!isAllowed) {
    return { valid: false, error: 'سرویس‌دهنده اعلان پشتیبانی نمی‌شود.' };
  }

  return { valid: true, endpoint, origin: parsed.origin };
}

/**
 * Validate Web Push subscription encryption keys (p256dh = 65-byte uncompressed P-256 point, auth = 16 bytes).
 */
export function validateSubscriptionKeys(
  rawP256dh: unknown,
  rawAuth: unknown
): { valid: boolean; p256dh?: string; auth?: string; error?: string } {
  if (typeof rawP256dh !== 'string' || typeof rawAuth !== 'string') {
    return { valid: false, error: 'کلیدهای رمزنگاری اعلان ناقص است.' };
  }

  const p256dh = rawP256dh.trim();
  const auth = rawAuth.trim();
  if (!/^[A-Za-z0-9_-]{40,200}$/.test(p256dh) || !/^[A-Za-z0-9_-]{16,64}$/.test(auth)) {
    return { valid: false, error: 'فرمت کلیدهای اشتراک اعلان نامعتبر است.' };
  }

  const p256Buf = fromBase64Url(p256dh);
  const authBuf = fromBase64Url(auth);

  if (p256Buf.length !== 65 || p256Buf[0] !== 0x04) {
    return { valid: false, error: 'کلید عمومی دستگاه برای اعلان نامعتبر است.' };
  }
  if (authBuf.length !== 16) {
    return { valid: false, error: 'کلید احراز دستگاه برای اعلان نامعتبر است.' };
  }

  return { valid: true, p256dh, auth };
}

/**
 * Generate a fresh ECDSA P-256 VAPID keypair (public key as 65-byte raw base64url + private key PEM).
 */
export function generateVapidKeyPair(subject = 'mailto:justhawkstuff@gmail.com'): VapidKeyPair {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
  });

  const spkiDer = publicKey.export({ type: 'spki', format: 'der' }) as Buffer;
  // Standard P-256 SPKI DER ends with the 65-byte uncompressed EC point (0x04 || X || Y)
  const rawPub = spkiDer.subarray(spkiDer.length - 65);
  if (rawPub.length !== 65 || rawPub[0] !== 0x04) {
    throw new Error('Failed to extract 65-byte uncompressed P-256 VAPID public key');
  }

  const privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
  return {
    publicKey: toBase64Url(rawPub),
    privateKeyPem,
    subject,
  };
}

/**
 * Convert an ASN.1 DER ECDSA signature into a 64-byte raw IEEE P1363 (r || s) signature for ES256 JWT.
 */
export function derToRawSignature(derSig: Buffer): Buffer {
  let offset = 0;
  if (derSig[offset++] !== 0x30) {
    throw new Error('Invalid DER signature sequence');
  }
  let seqLen = derSig[offset++];
  if (seqLen & 0x80) {
    const lenBytes = seqLen & 0x7f;
    offset += lenBytes;
  }

  if (derSig[offset++] !== 0x02) {
    throw new Error('Invalid DER integer for r');
  }
  const rLen = derSig[offset++];
  let r = derSig.subarray(offset, offset + rLen);
  offset += rLen;

  if (derSig[offset++] !== 0x02) {
    throw new Error('Invalid DER integer for s');
  }
  const sLen = derSig[offset++];
  let s = derSig.subarray(offset, offset + sLen);

  // Strip leading 0x00 sign padding if present and left-pad to exactly 32 bytes each
  if (r.length > 32) r = r.subarray(r.length - 32);
  if (s.length > 32) s = s.subarray(s.length - 32);

  const raw = Buffer.alloc(64);
  r.copy(raw, 32 - r.length);
  s.copy(raw, 64 - s.length);
  return raw;
}

/**
 * Build RFC 8292 VAPID Authorization header (`vapid t=<JWT>, k=<publicKey>`).
 */
export function createVapidAuthHeader(
  audienceOrigin: string,
  vapid: VapidKeyPair,
  nowSeconds = Math.floor(Date.now() / 1000)
): string {
  const headerB64 = toBase64Url(Buffer.from(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const payloadB64 = toBase64Url(
    Buffer.from(
      JSON.stringify({
        aud: audienceOrigin,
        exp: nowSeconds + 12 * 3600,
        sub: vapid.subject,
      })
    )
  );

  const signingInput = `${headerB64}.${payloadB64}`;
  const signer = crypto.createSign('SHA256');
  signer.update(signingInput);
  signer.end();
  const derSig = signer.sign(vapid.privateKeyPem);
  const rawSigB64 = toBase64Url(derToRawSignature(derSig));

  return `vapid t=${signingInput}.${rawSigB64}, k=${vapid.publicKey}`;
}

/**
 * Send a standards-compliant VAPID-signed Web Push wake notification.
 * The Service Worker (`sw.js`) displays the Persian daily Kalambaz notification on push receipt.
 */
export async function sendWebPushWakeup(
  sub: PushSubscriptionRecord,
  vapid: VapidKeyPair,
  ttlSeconds = 86400
): Promise<{ ok: boolean; status: number; expired: boolean }> {
  const check = validatePushEndpoint(sub.endpoint);
  if (!check.valid || !check.endpoint || !check.origin) {
    return { ok: false, status: 400, expired: true };
  }

  const authHeader = createVapidAuthHeader(check.origin, vapid);
  const res = await fetch(check.endpoint, {
    method: 'POST',
    redirect: 'error',
    signal: AbortSignal.timeout(12000),
    headers: {
      TTL: String(ttlSeconds),
      Urgency: 'normal',
      Authorization: authHeader,
      'Content-Length': '0',
    },
  });

  const expired = res.status === 404 || res.status === 410;
  return {
    ok: res.status >= 200 && res.status < 300,
    status: res.status,
    expired,
  };
}
