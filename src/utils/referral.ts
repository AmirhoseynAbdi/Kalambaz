export const REFERRAL_REWARD_POINTS = 100;
export const PENDING_REF_STORAGE_KEY = 'kalabaz_pending_ref';
const DEFAULT_PUBLIC_ORIGIN = 'https://kalambaz.ir';

/**
 * Safely validates and trims a referral username extracted from a URL or storage.
 * Matches server-side username rules (2..30 characters, no control chars).
 */
export function sanitizeReferrerUsername(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (trimmed.length < 2 || trimmed.length > 30) return null;
  // Reject control characters or URL-unsafe delimiters
  if (/[\x00-\x1F\x7F<>'"`\\]/.test(trimmed)) return null;
  return trimmed;
}

/**
 * Extracts and validates the `?ref=<username>` parameter from a URL search string.
 */
export function extractReferralFromUrl(search: string): string | null {
  try {
    const params = new URLSearchParams(search);
    const raw = params.get('ref');
    return sanitizeReferrerUsername(raw);
  } catch {
    return null;
  }
}

/**
 * Builds the personal shareable referral link for a logged-in user.
 */
export function buildReferralUrl(username: string, origin?: string): string {
  const cleanUser = sanitizeReferrerUsername(username);
  const resolvedOrigin =
    origin ||
    (typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : DEFAULT_PUBLIC_ORIGIN);
  const base = resolvedOrigin.replace(/\/+$/, '');
  if (!cleanUser) return `${base}/`;
  return `${base}/?ref=${encodeURIComponent(cleanUser)}`;
}

/**
 * Reads any pending referrer stored in localStorage from a previous ?ref= visit.
 */
export function getPendingReferrer(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sanitizeReferrerUsername(localStorage.getItem(PENDING_REF_STORAGE_KEY));
  } catch {
    return null;
  }
}

/**
 * Stores a valid pending referrer in localStorage so it survives navigation until signup.
 */
export function setPendingReferrer(username: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    const clean = sanitizeReferrerUsername(username);
    if (clean) {
      localStorage.setItem(PENDING_REF_STORAGE_KEY, clean);
    } else {
      localStorage.removeItem(PENDING_REF_STORAGE_KEY);
    }
  } catch {}
}

/**
 * Clears any pending referrer after signup is completed.
 */
export function clearPendingReferrer(): void {
  setPendingReferrer(null);
}
