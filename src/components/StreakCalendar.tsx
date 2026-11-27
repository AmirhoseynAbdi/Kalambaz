import React, { useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronRight,
  ChevronLeft,
  Flame,
  Check,
  Sparkles,
  Gem,
  Zap,
} from 'lucide-react';
import { DailyGameState, PlayerStats } from '../types';
import { getTodayDateString } from '../game/wordleLogic';
import {
  PERSIAN_WEEKDAYS_SHORT,
  STREAK_TIER_LIST,
  CalendarDayCell,
  StreakTier,
  getStreakTier,
  getStreakTierLabelFa,
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

const RIBBON_BY_TIER: Record<StreakTier, string> = {
  none: '',
  green: 'bg-[#22c55e]/30',
  silver: 'bg-[#cbd5e1]/40',
  gold: 'bg-[#f59e0b]/40',
  diamond: 'bg-[#22d3ee]/40',
  plasma: 'bg-gradient-to-r from-[#a855f7]/50 via-[#ec4899]/50 to-[#22d3ee]/50',
};

const LEGEND_SWATCH_BY_TIER: Record<Exclude<StreakTier, 'none'>, string> = {
  green: 'bg-[#16a34a]',
  silver: 'bg-gradient-to-br from-[#f1f5f9] via-[#cbd5e1] to-[#64748b]',
  gold: 'bg-gradient-to-br from-[#fde047] via-[#f59e0b] to-[#b45309]',
  diamond: 'bg-gradient-to-br from-[#a5f3fc] via-[#22d3ee] to-[#0284c7]',
  plasma: 'animate-streak-plasma',
};

function renderTierBadgeIcon(tier: StreakTier, className = 'w-2.5 h-2.5') {
  if (tier === 'plasma') return <Zap className={`${className} fill-current`} />;
  if (tier === 'diamond') return <Gem className={className} />;
  if (tier === 'gold') return <Flame className={`${className} fill-current`} />;
  if (tier === 'silver') return <Sparkles className={className} />;
  return <Check className={`${className} stroke-[3]`} />;
}

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

  const longestTier = getStreakTier(longestWinningStreak);

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

  const getRecordBadgeClass = (tier: StreakTier) => {
    if (tier === 'plasma') {
      return 'animate-streak-plasma text-white';
    }
    if (tier === 'diamond') {
      return darkMode
        ? 'bg-[#083344] text-[#67e8f9]'
        : 'bg-[#cffafe] text-[#164e63]';
    }
    if (tier === 'gold') {
      return darkMode
        ? 'bg-[#451a03] text-[#fcd34d]'
        : 'bg-[#fef3c7] text-[#78350f]';
    }
    if (tier === 'silver') {
      return darkMode
        ? 'bg-[#334155] text-[#f1f5f9]'
        : 'bg-[#e2e8f0] text-[#1e293b]';
    }
    return darkMode
      ? 'bg-[#164a2d] text-[#a7f3d0]'
      : 'bg-[#dcfce7] text-[#14532d]';
  };

  const getCellStyle = (cell: CalendarDayCell, isSelected: boolean) => {
    const selectedRing = isSelected
      ? darkMode
        ? 'ring-2 ring-white ring-offset-1 ring-offset-[#171126]'
        : 'ring-2 ring-[#6b21a8] ring-offset-1 ring-offset-[#eefaf2]'
      : '';

    if (cell.isWon) {
      if (cell.streakTier === 'plasma') {
        return `animate-streak-plasma text-white font-black ${selectedRing}`;
      }
      if (cell.streakTier === 'diamond') {
        return `bg-gradient-to-br from-[#67e8f9] via-[#22d3ee] to-[#0284c7] text-[#082f49] font-black shadow-[0_0_10px_rgba(34,211,238,0.45)] ${selectedRing}`;
      }
      if (cell.streakTier === 'gold') {
        return `bg-gradient-to-br from-[#fde047] via-[#f59e0b] to-[#d97706] text-[#1c1003] font-black shadow-[0_0_10px_rgba(245,158,11,0.4)] ${selectedRing}`;
      }
      if (cell.streakTier === 'silver') {
        return `bg-gradient-to-br from-[#f8fafc] via-[#cbd5e1] to-[#94a3b8] text-[#0f172a] font-black shadow-[0_0_8px_rgba(203,213,225,0.35)] ${selectedRing}`;
      }
      return `bg-[#15803d] text-white font-extrabold ${selectedRing}`;
    }

    if (cell.isToday) {
      return darkMode
        ? `bg-[#3b2866] text-white font-extrabold ${selectedRing}`
        : `bg-[#e9d5ff] text-[#581c87] font-extrabold ${selectedRing}`;
    }

    if (cell.isFuture) {
      return darkMode
        ? 'bg-[#1b142c]/45 text-[#5b4d78] cursor-default'
        : 'bg-[#e8f5ed]/65 text-[#94a3b8] cursor-default';
    }

    return darkMode
      ? `bg-[#251b3d] text-[#c4b5fd] hover:bg-[#322552] ${selectedRing}`
      : `bg-white text-[#166534] hover:bg-[#dcfce7] ${selectedRing}`;
  };

  const getDetailBarClass = (cell: CalendarDayCell) => {
    if (!cell.isWon) {
      return darkMode
        ? 'bg-[#251b3d] text-[#d8c8ff]'
        : 'bg-white text-[#166534]';
    }
    if (cell.streakTier === 'plasma') {
      return darkMode
        ? 'bg-[#3b0764]/85 text-[#fdf4ff]'
        : 'bg-[#fae8ff] text-[#701a75]';
    }
    if (cell.streakTier === 'diamond') {
      return darkMode
        ? 'bg-[#083344]/85 text-[#cffafe]'
        : 'bg-[#cffafe] text-[#164e63]';
    }
    if (cell.streakTier === 'gold') {
      return darkMode
        ? 'bg-[#451a03]/80 text-[#fef3c7]'
        : 'bg-[#fef3c7] text-[#78350f]';
    }
    if (cell.streakTier === 'silver') {
      return darkMode
        ? 'bg-[#1e293b] text-[#f1f5f9]'
        : 'bg-[#e2e8f0] text-[#1e293b]';
    }
    return darkMode
      ? 'bg-[#16422b] text-[#dcfce7]'
      : 'bg-[#dcfce7] text-[#14532d]';
  };

  return (
    <div
      className={`mb-4 p-3.5 rounded-2xl ${
        darkMode
          ? 'bg-[#171126] text-[#f5f3ff]'
          : 'bg-[#eefaf2] text-[#14532d]'
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
              className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-colors ${
                darkMode
                  ? 'bg-[#2e224b] text-[#86efac] hover:bg-[#3c2d62]'
                  : 'bg-[#d5f3e0] text-[#15803d] hover:bg-[#bbead0]'
              }`}
            >
              امروز
            </button>
          )}
          <button
            type="button"
            onClick={handlePrevMonth}
            aria-label="ماه قبل"
            className={`p-1.5 rounded-lg transition-colors active:scale-95 ${
              darkMode
                ? 'bg-[#2a1f45] text-[#d8b4fe] hover:bg-[#38295c]'
                : 'bg-white text-[#166534] hover:bg-[#dcfce7]'
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
            className={`p-1.5 rounded-lg transition-colors active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed ${
              darkMode
                ? 'bg-[#2a1f45] text-[#d8b4fe] hover:bg-[#38295c]'
                : 'bg-white text-[#166534] hover:bg-[#dcfce7]'
            }`}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Month & Record Streak Highlights Row */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2.5 text-[10px] font-extrabold">
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg ${
            darkMode
              ? 'bg-[#16422b] text-[#bbf7d0]'
              : 'bg-[#dcfce7] text-[#14532d]'
          }`}
        >
          <Check className="w-3 h-3 shrink-0" />
          <span>
            {monthData.wonDaysInMonth.toLocaleString('fa-IR')} روز موفق در {monthData.monthName}
          </span>
        </span>

        {longestWinningStreak >= 1 && (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg ${getRecordBadgeClass(
              longestTier
            )}`}
          >
            {renderTierBadgeIcon(longestTier, 'w-3 h-3 shrink-0')}
            <span>
              رکورد استریک ({getStreakTierLabelFa(longestTier)}):{' '}
              {longestWinningStreak.toLocaleString('fa-IR')} روز
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
          const ribbonBg = cell.isWon ? RIBBON_BY_TIER[cell.streakTier] : '';
          const isLightSurface =
            cell.streakTier === 'silver' ||
            cell.streakTier === 'gold' ||
            cell.streakTier === 'diamond';
          const showEndpointIcon =
            cell.isWon &&
            cell.streakTier !== 'green' &&
            (cell.streakPosition === 'end' || cell.streakPosition === 'start');

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
                    ? ` - تکمیل شده (استریک ${getStreakTierLabelFa(cell.streakTier)} ${cell.streakLength.toLocaleString('fa-IR')} روزه)`
                    : ''
                }`}
                className={`relative z-10 w-full h-9 rounded-lg flex flex-col items-center justify-center transition-all text-[11px] tabular-nums select-none ${getCellStyle(
                  cell,
                  isSelected
                )}`}
              >
                <span className="leading-none">
                  {cell.jalaliDay.toLocaleString('fa-IR')}
                </span>

                {/* Bottom micro-indicators */}
                {cell.isWon && (
                  <div className="flex items-center justify-center gap-0.5 mt-0.5 h-2">
                    {showEndpointIcon ? (
                      renderTierBadgeIcon(
                        cell.streakTier,
                        `w-2.5 h-2.5 ${isLightSurface ? 'opacity-85' : 'text-white'}`
                      )
                    ) : cell.wonLengths.length > 0 ? (
                      cell.wonLengths.map((len) => (
                        <span
                          key={len}
                          className={`w-1.5 h-1.5 rounded-full ${
                            isLightSurface ? 'bg-black/65' : LENGTH_DOT_COLOR[len]
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
          className={`mt-2.5 px-3 py-2 rounded-xl text-[11px] font-bold flex items-center justify-between gap-2 ${getDetailBarClass(
            selectedDayCell
          )}`}
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

          {selectedDayCell.isWon && (
            <span className="inline-flex items-center gap-1 shrink-0 font-extrabold text-[10px]">
              {renderTierBadgeIcon(selectedDayCell.streakTier, 'w-3 h-3')}
              <span>
                {getStreakTierLabelFa(selectedDayCell.streakTier)} •{' '}
                {selectedDayCell.streakLength.toLocaleString('fa-IR')} روزه
              </span>
            </span>
          )}
        </div>
      )}

      {/* 5-Tier Streak Legend: Green, Silver, Gold, Diamond, Plasma */}
      <div
        className={`mt-2.5 pt-2.5 border-t flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[10px] font-bold ${
          darkMode
            ? 'border-white/8 text-[#c4b5fd]'
            : 'border-emerald-950/8 text-[#166534]'
        }`}
      >
        {STREAK_TIER_LIST.map(({ tier, labelFa, minDays }) => (
          <span key={tier} className="inline-flex items-center gap-1">
            <span
              className={`w-2.5 h-2.5 rounded-xs ${LEGEND_SWATCH_BY_TIER[tier]}`}
            />
            <span>
              {labelFa} ({minDays.toLocaleString('fa-IR')}+)
            </span>
          </span>
        ))}
      </div>
    </div>
  );
};
