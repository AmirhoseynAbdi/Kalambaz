import test from 'node:test';
import assert from 'node:assert/strict';
import {
  shouldTriggerDailyNotification,
  getNotificationStatusLabel,
} from './notifications';

test('shouldTriggerDailyNotification triggers only when enabled, granted, unsolved, and not yet notified today', () => {
  assert.equal(
    shouldTriggerDailyNotification({
      enabled: true,
      permission: 'granted',
      todayDateKey: '2026-11-21',
      lastNotifiedDateKey: null,
      hasUnsolvedPuzzleToday: true,
    }),
    true
  );

  // Already notified today -> false
  assert.equal(
    shouldTriggerDailyNotification({
      enabled: true,
      permission: 'granted',
      todayDateKey: '2026-11-21',
      lastNotifiedDateKey: '2026-11-21',
      hasUnsolvedPuzzleToday: true,
    }),
    false
  );

  // Previous day notified -> true for new day
  assert.equal(
    shouldTriggerDailyNotification({
      enabled: true,
      permission: 'granted',
      todayDateKey: '2026-11-22',
      lastNotifiedDateKey: '2026-11-21',
      hasUnsolvedPuzzleToday: true,
    }),
    true
  );

  // Disabled or permission not granted -> false
  assert.equal(
    shouldTriggerDailyNotification({
      enabled: false,
      permission: 'granted',
      todayDateKey: '2026-11-21',
      lastNotifiedDateKey: null,
      hasUnsolvedPuzzleToday: true,
    }),
    false
  );

  assert.equal(
    shouldTriggerDailyNotification({
      enabled: true,
      permission: 'denied',
      todayDateKey: '2026-11-21',
      lastNotifiedDateKey: null,
      hasUnsolvedPuzzleToday: true,
    }),
    false
  );

  // All puzzles already solved today -> false
  assert.equal(
    shouldTriggerDailyNotification({
      enabled: true,
      permission: 'granted',
      todayDateKey: '2026-11-21',
      lastNotifiedDateKey: null,
      hasUnsolvedPuzzleToday: false,
    }),
    false
  );
});

test('getNotificationStatusLabel returns accurate Persian status strings', () => {
  assert.equal(getNotificationStatusLabel('granted', true), 'اعلان روزانه فعال است');
  assert.equal(getNotificationStatusLabel('granted', false), 'اعلان روزانه غیرفعال است');
  assert.equal(getNotificationStatusLabel('denied', false), 'اعلان‌ها در مرورگر مسدود شده‌اند');
  assert.equal(
    getNotificationStatusLabel('unsupported', false),
    'مرورگر شما از اعلان پشتیبانی نمی‌کند'
  );
});
