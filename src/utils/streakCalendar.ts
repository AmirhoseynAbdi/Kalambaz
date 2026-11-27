import { DailyGameState, PlayerStats } from '../types';
import { getDaysDifference } from '../game/wordleLogic';

export const PERSIAN_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
] as const;

// Standard Iranian calendar weekday order: Saturday (0) -> Friday (6)
export const PERSIAN_WEEKDAYS_SHORT = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'] as const;

export type StreakTier = 'none' | 'normal' | 'hot' | 'fire';
export type StreakPosition = 'none' | 'single' | 'start' | 'middle' | 'end';

export interface StreakDateMeta {
  streakLength: number;
  position: StreakPosition;
  tier: StreakTier;
  runId: number;
}

export interface CalendarDayCell {
  dateKey: string; // YYYY-MM-DD (Gregorian canonical key)
  jalaliYear: number;
  jalaliMonth: number; // 1..12
  jalaliDay: number; // 1..31
  weekdayIndex: number; // 0 = Saturday .. 6 = Friday
  isToday: boolean;
  isFuture: boolean;
  isWon: boolean;
  wonLengths: (4 | 5 | 6)[];
  streakLength: number;
  streakPosition: StreakPosition;
  streakTier: StreakTier;
  connectsPrevInRow: boolean;
  connectsNextInRow: boolean;
}

export interface PersianCalendarMonthData {
  year: number;
  month: number; // 1..12
  monthName: string;
  leadingEmptyCells: number;
  days: CalendarDayCell[];
  wonDaysInMonth: number;
  longestStreakInMonth: number;
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const persianPartsFormatter = new Intl.DateTimeFormat('en-US-u-ca-persian', {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  timeZone: 'UTC',
});

/**
 * Adds a signed integer number of days to a YYYY-MM-DD date string using UTC math (DST-safe).
 */
export function addDaysToDateKey(dateKey: string, deltaDays: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, (d || 1) + deltaDays));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/**
 * Converts a Gregorian YYYY-MM-DD string into Persian (Jalali) year, month (1..12), and day (1..31).
 */
export function gregorianToJalaliParts(dateKey: string): {
  year: number;
  month: number;
  day: number;
} {
  const [y, m, d] = dateKey.split('-').map(Number);
  const utcDate = new Date(Date.UTC(y, (m || 1) - 1, d || 1, 12, 0, 0));
  const parts = persianPartsFormatter.formatToParts(utcDate);
  let year = 1405;
  let month = 1;
  let day = 1;
  for (const p of parts) {
    if (p.type === 'year') year = parseInt(p.value, 10);
    else if (p.type === 'month') month = parseInt(p.value, 10);
    else if (p.type === 'day') day = parseInt(p.value, 10);
  }
  return { year, month, day };
}

/**
 * Returns Iranian weekday index for a Gregorian YYYY-MM-DD date (0 = Saturday .. 6 = Friday).
 */
export function getIranianWeekdayIndex(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number);
  const utcDay = new Date(Date.UTC(y, (m || 1) - 1, d || 1, 12, 0, 0)).getUTCDay(); // 0=Sun..6=Sat
  return (utcDay + 1) % 7;
}

/**
 * Shifts a Jalali (year, month) by -1 or +1 month.
 */
export function shiftJalaliMonth(
  year: number,
  month: number,
  delta: -1 | 1
): { year: number; month: number } {
  const nextMonth = month + delta;
  if (nextMonth < 1) {
    return { year: year - 1, month: 12 };
  }
  if (nextMonth > 12) {
    return { year: year + 1, month: 1 };
  }
  return { year, month: nextMonth };
}

/**
 * Finds the exact Gregorian YYYY-MM-DD for day 1 of a given Jalali (jYear, jMonth).
 */
export function findGregorianStartOfJalaliMonth(jYear: number, jMonth: number): string {
  // Approximate Gregorian date for the start of this Jalali year (Nowruz is around March 20/21)
  const approxGregYear = jYear + 621;
  const approxDaysOffset = (jMonth - 1) * 30;
  let cursor = addDaysToDateKey(`${approxGregYear}-03-21`, approxDaysOffset);

  // Iteratively converge to (jYear, jMonth, 1)
  for (let i = 0; i < 12; i++) {
    const p = gregorianToJalaliParts(cursor);
    if (p.year === jYear && p.month === jMonth && p.day === 1) {
      return cursor;
    }
    const approxDiff =
      (jYear - p.year) * 365 + (jMonth - p.month) * 30 + (1 - p.day);
    if (approxDiff === 0) {
      return cursor;
    }
    cursor = addDaysToDateKey(cursor, approxDiff);
  }

  // Fine step adjustment (±5 days safety net)
  for (let i = 0; i < 40; i++) {
    const p = gregorianToJalaliParts(cursor);
    if (p.year === jYear && p.month === jMonth && p.day === 1) {
      return cursor;
    }
    const isBefore =
      p.year < jYear ||
      (p.year === jYear && (p.month < jMonth || (p.month === jMonth && p.day < 1)));
    cursor = addDaysToDateKey(cursor, isBefore ? 1 : -1);
  }

  return cursor;
}

/**
 * Builds the effective map of completed (won) dates by combining:
 * 1. Explicit stats.completedDates
 * 2. Today's won puzzles from active gameStates
 * 3. Backfill for existing users who had a pre-calendar winning streak (currentStreak + lastPlayedDate)
 */
export function getEffectiveCompletedDates(
  stats: PlayerStats,
  gameStates?: { [len: number]: DailyGameState }
): Record<string, (4 | 5 | 6)[]> {
  const result: Record<string, (4 | 5 | 6)[]> = {};

  if (stats.completedDates && typeof stats.completedDates === 'object') {
    for (const [dateKey, rawLengths] of Object.entries(stats.completedDates)) {
      if (!ISO_DATE_RE.test(dateKey)) continue;
      const validLengths = Array.isArray(rawLengths)
        ? (Array.from(
            new Set(rawLengths.filter((n) => n === 4 || n === 5 || n === 6))
          ).sort((a, b) => a - b) as (4 | 5 | 6)[])
        : [];
      result[dateKey] = validLengths;
    }
  }

  // Merge any won puzzles from live gameStates
  if (gameStates) {
    ([4, 5, 6] as const).forEach((len) => {
      const st = gameStates[len];
      if (st && st.status === 'won' && ISO_DATE_RE.test(st.dateKey)) {
        const existing = result[st.dateKey] || [];
        if (!existing.includes(len)) {
          result[st.dateKey] = [...existing, len].sort((a, b) => a - b) as (4 | 5 | 6)[];
        }
      }
    });
  }

  // Backfill active streak for returning users upgrading from older versions without completedDates
  const hasExplicitHistory =
    stats.completedDates && Object.keys(stats.completedDates).length > 0;
  if (
    !hasExplicitHistory &&
    stats.gamesWon > 0 &&
    stats.currentStreak > 0 &&
    ISO_DATE_RE.test(stats.lastPlayedDate || '')
  ) {
    const backfillDays = Math.min(stats.currentStreak, stats.gamesWon, 365);
    for (let i = 0; i < backfillDays; i++) {
      const dKey = addDaysToDateKey(stats.lastPlayedDate, -i);
      if (!(dKey in result)) {
        result[dKey] = [];
      }
    }
  }

  return result;
}

/**
 * Computes contiguous winning streak runs across all completed dates.
 * - 1..2 consecutive days -> 'normal'
 * - 3..6 consecutive days -> 'hot'
 * - 7+ consecutive days   -> 'fire' (long winning streak highlight)
 */
export function computeWinningStreakRuns(
  completedDates: Record<string, (4 | 5 | 6)[]>
): {
  dateMeta: Record<string, StreakDateMeta>;
  longestWinningStreak: number;
  totalWonDays: number;
} {
  const sortedDates = Object.keys(completedDates)
    .filter((k) => ISO_DATE_RE.test(k))
    .sort();

  const dateMeta: Record<string, StreakDateMeta> = {};
  let longestWinningStreak = 0;

  if (sortedDates.length === 0) {
    return { dateMeta, longestWinningStreak: 0, totalWonDays: 0 };
  }

  let runStartIdx = 0;
  let runId = 0;

  const commitRun = (startIdx: number, endIdx: number) => {
    runId += 1;
    const len = endIdx - startIdx + 1;
    if (len > longestWinningStreak) longestWinningStreak = len;
    const tier: StreakTier = len >= 7 ? 'fire' : len >= 3 ? 'hot' : 'normal';

    for (let i = startIdx; i <= endIdx; i++) {
      const position: StreakPosition =
        len === 1
          ? 'single'
          : i === startIdx
          ? 'start'
          : i === endIdx
          ? 'end'
          : 'middle';
      dateMeta[sortedDates[i]] = {
        streakLength: len,
        position,
        tier,
        runId,
      };
    }
  };

  for (let i = 1; i < sortedDates.length; i++) {
    const diff = getDaysDifference(sortedDates[i - 1], sortedDates[i]);
    if (diff !== 1) {
      commitRun(runStartIdx, i - 1);
      runStartIdx = i;
    }
  }
  commitRun(runStartIdx, sortedDates.length - 1);

  return {
    dateMeta,
    longestWinningStreak,
    totalWonDays: sortedDates.length,
  };
}

/**
 * Builds the full Persian (Jalali) month grid with streak run annotations for rendering.
 */
export function buildPersianCalendarMonth(
  jYear: number,
  jMonth: number,
  todayDateKey: string,
  completedDates: Record<string, (4 | 5 | 6)[]>
): PersianCalendarMonthData {
  const { dateMeta } = computeWinningStreakRuns(completedDates);
  const startGreg = findGregorianStartOfJalaliMonth(jYear, jMonth);
  const leadingEmptyCells = getIranianWeekdayIndex(startGreg);

  const days: CalendarDayCell[] = [];
  let wonDaysInMonth = 0;
  let longestStreakInMonth = 0;

  let cursor = startGreg;
  for (let i = 0; i < 32; i++) {
    const parts = gregorianToJalaliParts(cursor);
    if (parts.year !== jYear || parts.month !== jMonth) {
      break;
    }

    const weekdayIndex = getIranianWeekdayIndex(cursor);
    const isWon = cursor in completedDates;
    const wonLengths = isWon ? completedDates[cursor] : [];
    const meta = isWon ? dateMeta[cursor] : undefined;

    if (isWon) {
      wonDaysInMonth += 1;
      if (meta && meta.streakLength > longestStreakInMonth) {
        longestStreakInMonth = meta.streakLength;
      }
    }

    const prevDayKey = addDaysToDateKey(cursor, -1);
    const nextDayKey = addDaysToDateKey(cursor, 1);
    const hasRunRibbon = Boolean(meta && meta.streakLength >= 3);
    const connectsPrevInRow =
      hasRunRibbon &&
      weekdayIndex > 0 &&
      parts.day > 1 &&
      Boolean(dateMeta[prevDayKey] && dateMeta[prevDayKey].runId === meta?.runId);
    const connectsNextInRow =
      hasRunRibbon &&
      weekdayIndex < 6 &&
      Boolean(dateMeta[nextDayKey] && dateMeta[nextDayKey].runId === meta?.runId);

    days.push({
      dateKey: cursor,
      jalaliYear: parts.year,
      jalaliMonth: parts.month,
      jalaliDay: parts.day,
      weekdayIndex,
      isToday: cursor === todayDateKey,
      isFuture: cursor > todayDateKey,
      isWon,
      wonLengths,
      streakLength: meta?.streakLength || 0,
      streakPosition: meta?.position || 'none',
      streakTier: meta?.tier || 'none',
      connectsPrevInRow,
      connectsNextInRow,
    });

    cursor = nextDayKey;
  }

  // Ensure connectsNextInRow is false on the last day of the displayed month
  if (days.length > 0) {
    days[days.length - 1].connectsNextInRow = false;
  }

  return {
    year: jYear,
    month: jMonth,
    monthName: PERSIAN_MONTH_NAMES[(jMonth - 1) % 12] || PERSIAN_MONTH_NAMES[0],
    leadingEmptyCells,
    days,
    wonDaysInMonth,
    longestStreakInMonth,
  };
}
