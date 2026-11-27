import React, { useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronRight,
  ChevronLeft,
  Flame,
  Check,
  Sparkles,
} from 'lucide-react';
import { DailyGameState, PlayerStats } from '../types';
import { getTodayDateString } from '../game/wordleLogic';
import {
  PERSIAN_WEEKDAYS_SHORT,
  CalendarDayCell,
  gregorianToJalaliParts,
  getEffectiveCompletedDates,
  computeWinningStreakRuns,
  buildPersianCalendarMonth,
  shiftJalaliMonth,
} from '../utils/streakCalendar';

interface StreakCalendarProps {
  stats: PlayerStats;
  gameStates?: { [len: number]: DailyGameState };
  darkMode?: boolean;
}

const LENGTH_DOT_COLOR: Record<4 | 5 | 6, string> = {
  4: 'bg-[#4ade80]',
  5: 'bg-[#d8b4fe]',
  6: 'bg-[#fde047]',
};

export const StreakCalendar: React.FC<StreakCalendarProps> = ({
  stats,
  gameStates,
  darkMode = true,
}) => {
  const todayDateKey = useMemo(() => getTodayDateString(), []);
  const todayJalali = useMemo(
    () => gregorianToJalaliParts(todayDateKey),
    [todayDateKey]
  );

  const [viewMonth, setViewMonth] = useState<{ year: number; month: number }>({
    year: todayJalali.year,
    month: todayJalali.month,
  });
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(todayDateKey);

  const completedDates = useMemo(
    () => getEffectiveCompletedDates(stats, gameStates),
    [stats, gameStates]
  );

  const { longestWinningStreak } = useMemo(
    () => computeWinningStreakRuns(completedDates),
    [completedDates]
  );

  const monthData = useMemo(
    () =>
      buildPersianCalendarMonth(
        viewMonth.year,
        viewMonth.month,
        todayDateKey,
        completedDates
      ),
    [viewMonth.year, viewMonth.month, todayDateKey, completedDates]
  );

  const isViewingCurrentMonth =
    viewMonth.year === todayJalali.year && viewMonth.month === todayJalali.month;

  const selectedDayCell: CalendarDayCell | null = useMemo(() => {
    if (!selectedDayKey) return null;
    return monthData.days.find((d) => d.dateKey === selectedDayKey) || null;
  }, [monthData.days, selectedDayKey]);

  const handlePrevMonth = () => {
    setViewMonth((prev) => shiftJalaliMonth(prev.year, prev.month, -1));
    setSelectedDayKey(null);
  };

  const handleNextMonth = () => {
    if (isViewingCurrentMonth) return;
    setViewMonth((prev) => shiftJalaliMonth(prev.year, prev.month, 1));
    setSelectedDayKey(null);
  };

  const handleJumpToday = () => {
    setViewMonth({ year: todayJalali.year, month: todayJalali.month });
    setSelectedDayKey(todayDateKey);
  };

  const getCellStyle = (cell: CalendarDayCell, isSelected: boolean) => {
    const selectedRing = isSelected
      ? darkMode
        ? 'ring-2 ring-white ring-offset-1 ring-offset-[#201733]'
        : 'ring-2 ring-[#581c87] ring-offset-1 ring-offset-white'
      : '';

    if (cell.isWon) {
      if (cell.streakTier === 'fire') {
        // 7+ day long winning streak: radiant golden-amber highlight
        return `bg-gradient-to-br from-[#f59e0b] via-[#eab308] to-[#d97706] text-[#1c1003] border-[#fef08a] font-black shadow-[0_0_10px_rgba(245,158,11,0.5)] ${selectedRing}`;
      }
      if (cell.streakTier === 'hot') {
        // 3..6 day winning streak: bright emerald-jade glowing highlight
        return darkMode
          ? `bg-gradient-to-br from-[#16a34a] to-[#15803d] text-white border-[#4ade80] font-black shadow-[0_0_8px_rgba(34,197,94,0.45)] ${selectedRing}`
          : `bg-gradient-to-br from-[#16a34a] to-[#15803d] text-white border-[#86efac] font-black shadow-[0_0_8px_rgba(22,163,74,0.35)] ${selectedRing}`;
      }
      // Single or 2-day win: crisp emerald green badge
      return darkMode
        ? `bg-[#14532d] text-[#dcfce7] border-[#22c55e]/80 font-extrabold ${selectedRing}`
        : `bg-[#15803d] text-white border-[#16a34a] font-extrabold ${selectedRing}`;
    }

    if (cell.isToday) {
      return darkMode
        ? `bg-[#291e40] text-[#f5f3ff] border-[#a855f7] font-extrabold ${selectedRing}`
        : `bg-[#f3e8ff] text-[#581c87] border-[#9333ea] font-extrabold ${selectedRing}`;
    }

    if (cell.isFuture) {
      return darkMode
        ? 'bg-[#171124]/40 text-[#5e5078] border-transparent cursor-default'
        : 'bg-[#f8fafc] text-[#94a3b8] border-transparent cursor-default';
    }

    return darkMode
      ? `bg-[#1b142b] text-[#b4a3d4] border-[#31234d]/70 hover:border-[#6b21a8] ${selectedRing}`
      : `bg-[#f0fdf4] text-[#166534] border-[#bbf7d0] hover:border-[#16a34a] ${selectedRing}`;
  };

  return (
    <div
      className={`mb-4 p-3.5 rounded-xl border-2 ${
        darkMode
          ? 'bg-[#181126] border-[#3d2d5e] text-[#f5f3ff]'
          : 'bg-[#f7fef9] border-[#86efac] text-[#14532d]'
      }`}
      aria-label="تقویم تکمیل معماهای روزانه"
    >
      {/* Header & Month Navigation */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <CalendarDays
            className={`w-4 h-4 shrink-0 ${
              darkMode ? 'text-[#4ade80]' : 'text-[#6b21a8]'
            }`}
          />
          <h4 className="text-xs font-extrabold truncate">
            تقویم بردهای روزانه
          </h4>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {!isViewingCurrentMonth && (
            <button
              type="button"
              onClick={handleJumpToday}
              className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold transition-colors ${
                darkMode
                  ? 'bg-[#291e40] text-[#86efac] hover:bg-[#352752]'
                  : 'bg-[#dcfce7] text-[#15803d] hover:bg-[#bbf7d0]'
              }`}
            >
              امروز
            </button>
          )}
          <button
            type="button"
            onClick={handlePrevMonth}
            aria-label="ماه قبل"
            className={`p-1 rounded-lg border transition-colors ${
              darkMode
                ? 'bg-[#241a38] border-[#3d2d5e] text-[#d8b4fe] hover:bg-[#32244d]'
                : 'bg-white border-[#86efac] text-[#166534] hover:bg-[#dcfce7]'
            }`}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <span
            className={`min-w-[78px] text-center text-[11px] font-extrabold tabular-nums ${
              darkMode ? 'text-[#f5f3ff]' : 'text-[#14532d]'
            }`}
          >
            {monthData.monthName} {monthData.year.toLocaleString('fa-IR', { useGrouping: false })}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            disabled={isViewingCurrentMonth}
            aria-label="ماه بعد"
            className={`p-1 rounded-lg border transition-colors disabled:opacity-35 disabled:cursor-not-allowed ${
              darkMode
                ? 'bg-[#241a38] border-[#3d2d5e] text-[#d8b4fe] hover:bg-[#32244d]'
                : 'bg-white border-[#86efac] text-[#166534] hover:bg-[#dcfce7]'
            }`}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Month & Streak Highlights Row */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2.5 text-[10px] font-extrabold">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border ${
            darkMode
              ? 'bg-[#143d25] border-[#22c55e]/60 text-[#bbf7d0]'
              : 'bg-[#dcfce7] border-[#86efac] text-[#14532d]'
          }`}
        >
          <Check className="w-3 h-3 shrink-0" />
          <span>
            {monthData.wonDaysInMonth.toLocaleString('fa-IR')} روز موفق در {monthData.monthName}
          </span>
        </span>

        {longestWinningStreak >= 3 && (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border ${
              longestWinningStreak >= 7
                ? 'bg-[#f59e0b]/20 border-[#f59e0b] text-[#fbbf24]'
                : darkMode
                ? 'bg-[#2e1d4d] border-[#a855f7]/70 text-[#e9d5ff]'
                : 'bg-[#f3e8ff] border-[#a855f7] text-[#6b21a8]'
            }`}
          >
            <Flame className="w-3 h-3 shrink-0 fill-current" />
            <span>
              رکورد استریک برد: {longestWinningStreak.toLocaleString('fa-IR')} روز
            </span>
          </span>
        )}
      </div>

      {/* Persian Weekday Header Row (RTL: Saturday rightmost -> Friday leftmost) */}
      <div className="grid grid-cols-7 gap-1 mb-1 text-center">
        {PERSIAN_WEEKDAYS_SHORT.map((dayLabel, idx) => (
          <div
            key={dayLabel}
            className={`text-[10px] font-extrabold py-0.5 ${
              idx === 6
                ? darkMode
                  ? 'text-[#fb7185]'
                  : 'text-[#be123c]'
                : darkMode
                ? 'text-[#a78bfa]'
                : 'text-[#15803d]'
            }`}
          >
            {dayLabel}
          </div>
        ))}
      </div>

      {/* Calendar Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty leading offset slots */}
        {Array.from({ length: monthData.leadingEmptyCells }).map((_, idx) => (
          <div key={`empty-${idx}`} className="h-9" aria-hidden="true" />
        ))}

        {monthData.days.map((cell) => {
          const isSelected = selectedDayKey === cell.dateKey;
          const isFireStreak = cell.isWon && cell.streakTier === 'fire';
          const isHotStreak = cell.isWon && cell.streakTier === 'hot';
          const ribbonBg = isFireStreak
            ? 'bg-[#f59e0b]/35'
            : isHotStreak
            ? 'bg-[#22c55e]/30'
            : '';

          return (
            <div key={cell.dateKey} className="relative h-9 flex items-center justify-center">
              {/* Horizontal streak ribbon connector in RTL (prev = right side, next = left side) */}
              {cell.connectsPrevInRow && (
                <div
                  aria-hidden="true"
                  className={`absolute inset-y-1.5 -right-1 w-2.5 pointer-events-none ${ribbonBg}`}
                />
              )}
              {cell.connectsNextInRow && (
                <div
                  aria-hidden="true"
                  className={`absolute inset-y-1.5 -left-1 w-2.5 pointer-events-none ${ribbonBg}`}
                />
              )}

              <button
                type="button"
                disabled={cell.isFuture}
                onClick={() => setSelectedDayKey(cell.dateKey)}
                data-date={cell.dateKey}
                data-won={cell.isWon ? 'true' : 'false'}
                data-streak-tier={cell.streakTier}
                aria-label={`${cell.jalaliDay.toLocaleString('fa-IR')} ${monthData.monthName}${
                  cell.isWon
                    ? ` - تکمیل شده${
                        cell.streakLength >= 3
                          ? ` (استریک ${cell.streakLength.toLocaleString('fa-IR')} روزه)`
                          : ''
                      }`
                    : ''
                }`}
                className={`relative z-10 w-full h-9 rounded-lg border flex flex-col items-center justify-center transition-all text-[11px] tabular-nums select-none ${getCellStyle(
                  cell,
                  isSelected
                )}`}
              >
                <span className="leading-none">
                  {cell.jalaliDay.toLocaleString('fa-IR')}
                </span>

                {/* Bottom micro-indicators: flame on long streak endpoints, length dots, or check */}
                {cell.isWon && (
                  <div className="flex items-center justify-center gap-0.5 mt-0.5 h-2">
                    {isFireStreak && (cell.streakPosition === 'end' || cell.streakPosition === 'start') ? (
                      <Flame className="w-2.5 h-2.5 text-[#78350f] fill-[#fffbeb]" />
                    ) : cell.wonLengths.length > 0 ? (
                      cell.wonLengths.map((len) => (
                        <span
                          key={len}
                          className={`w-1.5 h-1.5 rounded-full ${
                            isFireStreak ? 'bg-[#451a03]' : LENGTH_DOT_COLOR[len]
                          }`}
                        />
                      ))
                    ) : (
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    )}
                  </div>
                )}

                {/* Today subtle indicator dot when not yet won */}
                {!cell.isWon && cell.isToday && (
                  <span
                    className={`w-1 h-1 rounded-full mt-0.5 ${
                      darkMode ? 'bg-[#c084fc]' : 'bg-[#6b21a8]'
                    }`}
                  />
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Selected Day Detail Bar */}
      {selectedDayCell && (
        <div
          className={`mt-2.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold flex items-center justify-between gap-2 ${
            selectedDayCell.isWon
              ? selectedDayCell.streakTier === 'fire'
                ? darkMode
                  ? 'bg-[#451a03]/60 border-[#f59e0b]/70 text-[#fef3c7]'
                  : 'bg-[#fef3c7] border-[#f59e0b] text-[#78350f]'
                : darkMode
                ? 'bg-[#143d25] border-[#22c55e]/60 text-[#dcfce7]'
                : 'bg-[#dcfce7] border-[#22c55e] text-[#14532d]'
              : darkMode
              ? 'bg-[#221836] border-[#3d2d5e] text-[#c4b5fd]'
              : 'bg-white border-[#bbf7d0] text-[#166534]'
          }`}
        >
          <span className="truncate">
            {selectedDayCell.jalaliDay.toLocaleString('fa-IR')} {monthData.monthName}:{' '}
            {selectedDayCell.isWon ? (
              selectedDayCell.wonLengths.length > 0 ? (
                <>
                  حل‌شده ({selectedDayCell.wonLengths.map((l) => `${l.toLocaleString('fa-IR')} حرفی`).join('، ')})
                </>
              ) : (
                'معمای روزانه حل شد ✓'
              )
            ) : selectedDayCell.isToday ? (
              'هنوز معمای امروز حل نشده'
            ) : (
              'بردی ثبت نشده است'
            )}
          </span>

          {selectedDayCell.isWon && selectedDayCell.streakLength >= 2 && (
            <span className="inline-flex items-center gap-0.5 shrink-0 font-extrabold text-[10px]">
              {selectedDayCell.streakTier === 'fire' ? (
                <Flame className="w-3 h-3 fill-current" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              <span>استریک {selectedDayCell.streakLength.toLocaleString('fa-IR')} روزه</span>
            </span>
          )}
        </div>
      )}

      {/* Compact Legend */}
      <div
        className={`mt-2.5 pt-2 border-t flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] font-bold ${
          darkMode
            ? 'border-[#31234d] text-[#c4b5fd]'
            : 'border-[#bbf7d0] text-[#166534]'
        }`}
      >
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-xs bg-[#15803d] border border-[#22c55e]" />
          <span>برد روزانه</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-xs bg-[#16a34a] border border-[#4ade80] shadow-[0_0_5px_rgba(34,197,94,0.6)]" />
          <span>استریک ۳+ روز</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-xs bg-gradient-to-br from-[#f59e0b] to-[#d97706] border border-[#fef08a] shadow-[0_0_5px_rgba(245,158,11,0.65)]" />
          <span>استریک طلایی ۷+ روز</span>
        </span>
      </div>
    </div>
  );
};
