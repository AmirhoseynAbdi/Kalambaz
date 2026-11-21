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
 * Request notification permission, enable daily reminders, and send a confirmation notification.
 */
export async function requestAndEnableNotifications(): Promise<{
  ok: boolean;
  permission: NotificationPermissionState;
}> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { ok: false, permission: 'unsupported' };
  }

  let permission = window.Notification.permission;
  if (permission === 'default') {
    try {
      permission = await window.Notification.requestPermission();
    } catch {
      return { ok: false, permission: getBrowserNotificationPermission() };
    }
  }

  if (permission === 'granted') {
    setDailyNotificationEnabled(true);
    await showKalabazNotification(
      '🥦 اعلان روزانه کلمباز فعال شد!',
      'هر روز با انتشار کلمات جدید ۴، ۵ و ۶ حرفی به شما یادآوری می‌کنیم تا استریک خود را حفظ کنید.',
      'kalambaz-welcome'
    );
    return { ok: true, permission: 'granted' };
  }

  setDailyNotificationEnabled(false);
  return { ok: false, permission };
}
