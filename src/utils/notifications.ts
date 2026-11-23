import { getSessionToken } from './api';

export type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

const NOTIF_ENABLED_KEY = 'kalabaz_notifications_enabled_v1';
const LAST_NOTIFIED_DATE_KEY = 'kalabaz_last_notified_date_v1';

/**
 * Pure helper: determine whether today's daily puzzle reminder notification should fire.
 */
export function shouldTriggerDailyNotification(params: {
  enabled: boolean;
  permission: NotificationPermissionState;
  todayDateKey: string;
  lastNotifiedDateKey: string | null;
  hasUnsolvedPuzzleToday: boolean;
}): boolean {
  if (!params.enabled) return false;
  if (params.permission !== 'granted') return false;
  if (!params.hasUnsolvedPuzzleToday) return false;
  if (!params.todayDateKey) return false;
  return params.lastNotifiedDateKey !== params.todayDateKey;
}

/**
 * Pure helper: Persian status summary for UI badges.
 */
export function getNotificationStatusLabel(
  permission: NotificationPermissionState,
  enabled: boolean
): string {
  if (permission === 'unsupported') return 'مرورگر شما از اعلان پشتیبانی نمی‌کند';
  if (permission === 'denied') return 'اعلان‌ها در مرورگر مسدود شده‌اند';
  if (permission === 'granted' && enabled) return 'اعلان روزانه فعال است';
  return 'اعلان روزانه غیرفعال است';
}

/**
 * Pure helper: convert a base64url VAPID public key string into a Uint8Array for PushManager.subscribe.
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function getBrowserNotificationPermission(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return window.Notification.permission;
}

export function isDailyNotificationEnabled(): boolean {
  try {
    return localStorage.getItem(NOTIF_ENABLED_KEY) === '1';
  } catch {
    return false;
  }
}

export function setDailyNotificationEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(NOTIF_ENABLED_KEY, enabled ? '1' : '0');
  } catch {}
}

export function getLastNotifiedDate(): string | null {
  try {
    return localStorage.getItem(LAST_NOTIFIED_DATE_KEY);
  } catch {
    return null;
  }
}

export function markDateNotified(dateKey: string): void {
  try {
    localStorage.setItem(LAST_NOTIFIED_DATE_KEY, dateKey);
  } catch {}
}

async function sendSubscriptionToServer(subscription: PushSubscription): Promise<boolean> {
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    return false;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = getSessionToken();
  if (token && !token.startsWith('local:')) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: {
          p256dh: json.keys.p256dh,
          auth: json.keys.auth,
        },
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Subscribe the browser's Service Worker to real background Web Push using the server's VAPID key.
 */
export async function subscribeToWebPush(): Promise<boolean> {
  if (
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window)
  ) {
    return false;
  }

  try {
    const keyRes = await fetch('/api/push/public-key');
    if (!keyRes.ok) return false;
    const keyData = await keyRes.json();
    const publicKey = typeof keyData?.publicKey === 'string' ? keyData.publicKey.trim() : '';
    if (!publicKey) return false;

    const reg = await navigator.serviceWorker.ready;
    if (!reg || !reg.pushManager) return false;

    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    return await sendSubscriptionToServer(subscription);
  } catch {
    return false;
  }
}

/**
 * Re-sync an existing PushSubscription with the server (e.g., right after the user logs in).
 */
export async function syncExistingPushSubscription(): Promise<void> {
  if (
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window) ||
    getBrowserNotificationPermission() !== 'granted' ||
    !isDailyNotificationEnabled()
  ) {
    return;
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    if (existing) {
      await sendSubscriptionToServer(existing);
    } else {
      await subscribeToWebPush();
    }
  } catch {}
}

/**
 * Unsubscribe the device from background Web Push and delete the endpoint from the backend.
 */
export async function unsubscribeFromWebPush(): Promise<void> {
  setDailyNotificationEnabled(false);
  if (
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window)
  ) {
    return;
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    if (!existing) return;

    const endpoint = existing.endpoint;
    await existing.unsubscribe().catch(() => {});

    await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint }),
    }).catch(() => {});
  } catch {}
}

/**
 * Display a browser/PWA notification using ServiceWorkerRegistration when available
 * (required on Android Chrome), falling back to window.Notification on desktop.
 */
export async function showKalabazNotification(
  title: string,
  body: string,
  tag = 'kalambaz-daily'
): Promise<boolean> {
  if (getBrowserNotificationPermission() !== 'granted') {
    return false;
  }

  const options: NotificationOptions = {
    body,
    icon: '/icon-192.png',
    badge: '/favicon-96x96.png',
    dir: 'rtl',
    lang: 'fa-IR',
    tag,
  };

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(title, options);
        return true;
      }
    }
  } catch {
    // Fall through to window.Notification
  }

  try {
    new window.Notification(title, options);
    return true;
  } catch {
    return false;
  }
}

/**
 * Request notification permission, subscribe to real Web Push on the backend, and send a confirmation notification.
 */
export async function requestAndEnableNotifications(): Promise<{
  ok: boolean;
  permission: NotificationPermissionState;
  pushSubscribed: boolean;
}> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { ok: false, permission: 'unsupported', pushSubscribed: false };
  }

  let permission = window.Notification.permission;
  if (permission === 'default') {
    try {
      permission = await window.Notification.requestPermission();
    } catch {
      return { ok: false, permission: getBrowserNotificationPermission(), pushSubscribed: false };
    }
  }

  if (permission === 'granted') {
    setDailyNotificationEnabled(true);
    const pushSubscribed = await subscribeToWebPush();
    await showKalabazNotification(
      '🥦 اعلان روزانه کلمباز فعال شد!',
      'هر روز با انتشار کلمات جدید ۴، ۵ و ۶ حرفی حتی هنگام بسته بودن مرورگر به شما یادآوری می‌کنیم.',
      'kalambaz-welcome'
    );
    return { ok: true, permission: 'granted', pushSubscribed };
  }

  setDailyNotificationEnabled(false);
  return { ok: false, permission, pushSubscribed: false };
}
