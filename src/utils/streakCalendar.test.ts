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

test('computeWinningStreakRuns classifies 1-2d normal, 3-6d hot, and 7+d fire streaks', () => {
  const completed: Record<string, (4 | 5 | 6)[]> = {
    // 1-day win
    '2026-11-01': [5],
    // 4-day hot streak
    '2026-11-05': [4],
    '2026-11-06': [5],
    '2026-11-07': [4, 5],
    '2026-11-08': [6],
    // 8-day fire (long winning) streak
    '2026-11-15': [5],
    '2026-11-16': [5],
    '2026-11-17': [5],
    '2026-11-18': [5],
    '2026-11-19': [5],
    '2026-11-20': [5],
    '2026-11-21': [5],
    '2026-11-22': [4, 5, 6],
  };

  const { dateMeta, longestWinningStreak, totalWonDays } = computeWinningStreakRuns(completed);
  assert.equal(longestWinningStreak, 8);
  assert.equal(totalWonDays, 13);

  assert.equal(dateMeta['2026-11-01'].tier, 'normal');
  assert.equal(dateMeta['2026-11-01'].position, 'single');

  assert.equal(dateMeta['2026-11-05'].tier, 'hot');
  assert.equal(dateMeta['2026-11-05'].position, 'start');
  assert.equal(dateMeta['2026-11-06'].position, 'middle');
  assert.equal(dateMeta['2026-11-08'].position, 'end');

  assert.equal(dateMeta['2026-11-15'].tier, 'fire');
  assert.equal(dateMeta['2026-11-15'].streakLength, 8);
  assert.equal(dateMeta['2026-11-22'].tier, 'fire');
  assert.equal(dateMeta['2026-11-22'].position, 'end');
});

test('buildPersianCalendarMonth generates full 30-day Azar month and connects streak runs across month boundary', () => {
  // 8-day winning streak ending on 2026-11-27 (spans Aban -> Azar 1405)
  const completed: Record<string, (4 | 5 | 6)[]> = {};
  for (let i = 0; i < 8; i++) {
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
  assert.equal(todayCell.streakTier, 'fire');
  assert.equal(todayCell.streakLength, 8);
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
