import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addDaysToDateKey,
  gregorianToJalaliParts,
  findGregorianStartOfJalaliMonth,
  getEffectiveCompletedDates,
  computeWinningStreakRuns,
  buildPersianCalendarMonth,
  shiftJalaliMonth,
  getStreakTier,
  STREAK_TIER_LIST,
} from './streakCalendar';
import { updateDailyStreak } from '../game/wordleLogic';
import { PlayerStats } from '../types';

test('addDaysToDateKey handles month/year boundaries accurately', () => {
  assert.equal(addDaysToDateKey('2026-11-30', 1), '2026-12-01');
  assert.equal(addDaysToDateKey('2026-01-01', -1), '2025-12-31');
});

test('gregorianToJalaliParts and findGregorianStartOfJalaliMonth round-trip cleanly', () => {
  const todayParts = gregorianToJalaliParts('2026-11-27');
  assert.equal(todayParts.year, 1405);
  assert.equal(todayParts.month, 9); // Azar

  const startOfMonth = findGregorianStartOfJalaliMonth(todayParts.year, todayParts.month);
  const startParts = gregorianToJalaliParts(startOfMonth);
  assert.equal(startParts.year, todayParts.year);
  assert.equal(startParts.month, todayParts.month);
  assert.equal(startParts.day, 1);
});

test('shiftJalaliMonth wraps across Jalali year boundaries', () => {
  assert.deepEqual(shiftJalaliMonth(1405, 1, -1), { year: 1404, month: 12 });
  assert.deepEqual(shiftJalaliMonth(1405, 12, 1), { year: 1406, month: 1 });
});

test('getStreakTier maps lengths to green, silver, gold, diamond, and plasma', () => {
  assert.deepEqual(
    STREAK_TIER_LIST.map((t) => t.tier),
    ['green', 'silver', 'gold', 'diamond', 'plasma']
  );
  assert.equal(getStreakTier(0), 'none');
  assert.equal(getStreakTier(1), 'green');
  assert.equal(getStreakTier(2), 'green');
  assert.equal(getStreakTier(3), 'silver');
  assert.equal(getStreakTier(6), 'silver');
  assert.equal(getStreakTier(7), 'gold');
  assert.equal(getStreakTier(13), 'gold');
  assert.equal(getStreakTier(14), 'diamond');
  assert.equal(getStreakTier(29), 'diamond');
  assert.equal(getStreakTier(30), 'plasma');
  assert.equal(getStreakTier(100), 'plasma');
});

test('computeWinningStreakRuns classifies green, silver, gold, diamond, and plasma runs', () => {
  const completed: Record<string, (4 | 5 | 6)[]> = {};
  // 2-day green streak
  completed['2026-08-01'] = [5];
  completed['2026-08-02'] = [5];
  // 4-day silver streak
  for (let i = 0; i < 4; i++) completed[addDaysToDateKey('2026-08-10', i)] = [4];
  // 8-day gold streak
  for (let i = 0; i < 8; i++) completed[addDaysToDateKey('2026-09-01', i)] = [5];
  // 16-day diamond streak
  for (let i = 0; i < 16; i++) completed[addDaysToDateKey('2026-10-01', i)] = [6];
  // 32-day plasma streak
  for (let i = 0; i < 32; i++) completed[addDaysToDateKey('2026-10-27', i)] = [4, 5, 6];

  const { dateMeta, longestWinningStreak, totalWonDays } = computeWinningStreakRuns(completed);
  assert.equal(longestWinningStreak, 32);
  assert.equal(totalWonDays, 62);

  assert.equal(dateMeta['2026-08-01'].tier, 'green');
  assert.equal(dateMeta['2026-08-10'].tier, 'silver');
  assert.equal(dateMeta['2026-08-13'].position, 'end');
  assert.equal(dateMeta['2026-09-01'].tier, 'gold');
  assert.equal(dateMeta['2026-10-01'].tier, 'diamond');
  assert.equal(dateMeta['2026-10-27'].tier, 'plasma');
  assert.equal(dateMeta['2026-11-27'].tier, 'plasma');
  assert.equal(dateMeta['2026-11-27'].position, 'end');
});

test('buildPersianCalendarMonth generates full 30-day Azar month and preserves cross-month gold/diamond/plasma tiers', () => {
  // 15-day diamond streak ending on 2026-11-27 (spans Aban -> Azar 1405)
  const completed: Record<string, (4 | 5 | 6)[]> = {};
  for (let i = 0; i < 15; i++) {
    completed[addDaysToDateKey('2026-11-27', -i)] = [5];
  }

  const todayJalali = gregorianToJalaliParts('2026-11-27');
  const month = buildPersianCalendarMonth(
    todayJalali.year,
    todayJalali.month,
    '2026-11-27',
    completed
  );

  assert.equal(month.monthName, 'آذر');
  assert.equal(month.days.length, 30);
  const todayCell = month.days.find((d) => d.dateKey === '2026-11-27');
  assert.ok(todayCell);
  assert.equal(todayCell.isToday, true);
  assert.equal(todayCell.isWon, true);
  assert.equal(todayCell.streakTier, 'diamond');
  assert.equal(todayCell.streakLength, 15);
});

test('getEffectiveCompletedDates backfills legacy streak when completedDates is absent', () => {
  const legacyStats: PlayerStats = {
    gamesPlayed: 5,
    gamesWon: 5,
    currentStreak: 4,
    maxStreak: 4,
    lastPlayedDate: '2026-11-27',
    guessDistribution: { 1: 0, 2: 2, 3: 3, 4: 0, 5: 0, 6: 0 },
    points: 80,
    starterBonusGranted: true,
  };

  const effective = getEffectiveCompletedDates(legacyStats);
  assert.deepEqual(Object.keys(effective).sort(), [
    '2026-11-24',
    '2026-11-25',
    '2026-11-26',
    '2026-11-27',
  ]);
});

test('updateDailyStreak records solved wordLength in completedDates on win only', () => {
  const base: PlayerStats = {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    lastPlayedDate: '',
    guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    points: 50,
    starterBonusGranted: true,
  };

  const afterLoss = updateDailyStreak(base, '2026-11-26', false, 6, 5);
  assert.deepEqual(afterLoss.completedDates, {});

  const afterWin5 = updateDailyStreak(afterLoss, '2026-11-27', true, 3, 5);
  assert.deepEqual(afterWin5.completedDates, { '2026-11-27': [5] });

  const afterWin4 = updateDailyStreak(afterWin5, '2026-11-27', true, 2, 4);
  assert.deepEqual(afterWin4.completedDates, { '2026-11-27': [4, 5] });
});
