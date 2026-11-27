import React from 'react';
import {
  HelpCircle,
  Settings,
  Flame,
  User,
  CheckCircle2,
  Mail,
} from 'lucide-react';
import { DailyGameState } from '../types';
import { calculateGuessPoints } from '../game/wordleLogic';
import { getStreakTier, getStreakTierLabelFa, StreakTier } from '../utils/streakCalendar';
import { GreenSeedIcon } from './GreenSeedIcon';

interface HeaderProps {
  currentLength: 4 | 5 | 6;
  onSelectLength: (len: 4 | 5 | 6) => void;
  streak: number;
  points: number;
  hintCost: number;
  canUseHint: boolean;
  onUseHint: () => void;
  username?: string;
  onOpenHelp: () => void;
  onOpenStats: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenContact: () => void;
  darkMode: boolean;
  hardMode: boolean;
  gameStates?: { [len: number]: DailyGameState };
}

const LENGTH_TAB_THEME: Record<4 | 5 | 6, { active: string; dot: string }> = {
  4: {
    active: 'bg-[#15803d] text-white shadow-sm',
    dot: 'bg-[#4ade80]',
  },
  5: {
    active: 'bg-[#7e22ce] text-white shadow-sm',
    dot: 'bg-[#c084fc]',
  },
  6: {
    active: 'bg-[#d97706] text-white shadow-sm',
    dot: 'bg-[#fbbf24]',
  },
};

export const Header: React.FC<HeaderProps> = ({
  currentLength,
  onSelectLength,
  streak,
  points,
  hintCost,
  canUseHint,
  onUseHint,
  username,
  onOpenHelp,
  onOpenStats,
  onOpenSettings,
  onOpenProfile,
  onOpenContact,
  darkMode,
  hardMode,
  gameStates,
}) => {
  const iconBtnClass = `w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center transition-colors active:scale-95 shrink-0 ${
    darkMode
      ? 'bg-[#2e224b] text-[#d8c8ff] hover:bg-[#3c2d62] hover:text-white'
      : 'bg-[#dff5e7] text-[#14532d] hover:bg-[#c5ecd4]'
  }`;

  return (
    <header className="relative z-10 w-full max-w-7xl mx-auto px-1.5 sm:px-4 lg:px-6 pt-1.5 sm:pt-2 pb-1 shrink-0">
      {/* Main Top Bar */}
      <div
        className={`flex items-center justify-between gap-1 sm:gap-2 px-1.5 sm:px-3 py-1.5 sm:py-2 rounded-2xl transition-colors ${
          darkMode
            ? 'bg-[#211836] text-[#f5f3ff] shadow-md shadow-black/25'
            : 'bg-white text-[#14532d] shadow-md shadow-emerald-950/6'
        }`}
      >
        {/* Right Zone (RTL Start): Brand Identity */}
        <div className="flex items-center gap-1 sm:gap-2 min-w-0 shrink-0">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <span className="text-base sm:text-2xl select-none">🥦</span>
            <h1
              className={`text-sm sm:text-2xl font-black tracking-tight font-['Lalezar',sans-serif] leading-none whitespace-nowrap ${
                darkMode ? 'text-[#4ade80]' : 'text-[#6b21a8]'
              }`}
            >
              کلمباز
            </h1>
            <span
              className={`hidden xl:inline-block text-xs font-mono font-bold ${
                darkMode ? 'text-[#a78bfa]' : 'text-[#15803d]'
              }`}
            >
              Kalabaz
            </span>
          </div>

          {hardMode && (
            <span
              className={`hidden sm:inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-lg whitespace-nowrap ${
                darkMode
                  ? 'text-[#bbf7d0] bg-[#164a2d]'
                  : 'text-[#581c87] bg-[#ede9fe]'
              }`}
            >
              حالت سخت
            </span>
          )}
        </div>

        {/* Center Zone (Desktop >= md): Mode Length Selector Tabs */}
        <div className="hidden md:flex items-center justify-center gap-2">
          <span
            className={`text-xs font-bold whitespace-nowrap ${
              darkMode ? 'text-[#c4b5fd]' : 'text-[#166534]'
            }`}
          >
            حالت کلمه:
          </span>
          <div
            className={`inline-flex rounded-xl p-1 gap-0.5 ${
              darkMode ? 'bg-[#150f24]' : 'bg-[#e3f6ea]'
            }`}
          >
            {([4, 5, 6] as const).map((len) => {
              const isSelected = currentLength === len;
              const faNum = len.toLocaleString('fa-IR');
              const st = gameStates?.[len];
              const isWon = st?.status === 'won';
              const theme = LENGTH_TAB_THEME[len];
              return (
                <button
                  key={len}
                  type="button"
                  onClick={() => onSelectLength(len)}
                  aria-label={`بازی با کلمات ${faNum} حرفی`}
                  className={`px-3.5 py-1 rounded-lg text-xs sm:text-sm font-extrabold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    isSelected
                      ? theme.active
                      : darkMode
                      ? 'text-[#c4b5fd] hover:text-white hover:bg-[#2a1f44]'
                      : 'text-[#166534] hover:bg-[#ccefd9]'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      isSelected ? 'bg-white' : theme.dot
                    }`}
                  />
                  <span>{faNum} حرفی</span>
                  {isWon && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Left Zone (RTL End): Streak, Unified Hint+Seeds, Help, Contact Us, Settings, Profile */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Daily Streak Viewing Button (Tiered: Green, Silver, Gold, Diamond, Plasma) */}
          {(() => {
            const streakTier: StreakTier = getStreakTier(streak);
            const tierLabel = getStreakTierLabelFa(streakTier);
            const streakBtnStyle =
              streakTier === 'plasma'
                ? 'animate-streak-plasma text-white shadow-sm'
                : streakTier === 'diamond'
                ? 'bg-gradient-to-br from-[#67e8f9] to-[#0284c7] text-[#082f49] shadow-sm'
                : streakTier === 'gold'
                ? 'bg-gradient-to-br from-[#fde047] to-[#d97706] text-[#1c1003] shadow-sm'
                : streakTier === 'silver'
                ? 'bg-gradient-to-br from-[#f1f5f9] to-[#94a3b8] text-[#0f172a] shadow-sm'
                : streakTier === 'green'
                ? darkMode
                  ? 'bg-[#164a2d] text-[#bbf7d0] hover:bg-[#1c5e3a]'
                  : 'bg-[#bbf7d0] text-[#14532d] hover:bg-[#86efac]'
                : darkMode
                ? 'bg-[#2e224b] text-[#e9d5ff] hover:bg-[#3c2d62]'
                : 'bg-[#dff5e7] text-[#14532d] hover:bg-[#c5ecd4]';

            const flameClass =
              streakTier === 'plasma'
                ? 'text-white fill-white'
                : streakTier === 'diamond'
                ? 'text-[#082f49] fill-[#ecfeff]'
                : streakTier === 'gold'
                ? 'text-[#78350f] fill-[#fef08a]'
                : streakTier === 'silver'
                ? 'text-[#334155] fill-[#f8fafc]'
                : streakTier === 'green'
                ? 'text-[#22c55e] fill-[#4ade80]'
                : darkMode
                ? 'text-[#a855f7] fill-[#a855f7]'
                : 'text-[#16a34a] fill-[#22c55e]';

            return (
              <button
                type="button"
                onClick={onOpenStats}
                aria-label={`مشاهده استریک و آمار: ${streak} روز${tierLabel ? ` (${tierLabel})` : ''}`}
                className={`h-7 sm:h-9 flex items-center gap-0.5 px-1.5 sm:px-2 rounded-lg sm:rounded-xl transition-all active:scale-95 text-[10px] sm:text-xs font-extrabold shrink-0 tabular-nums ${streakBtnStyle}`}
                title={
                  tierLabel
                    ? `استریک ${tierLabel}: ${streak.toLocaleString('fa-IR')} روز (مشاهده تقویم و آمار)`
                    : 'مشاهده استریک روزانه و آمار'
                }
              >
                <Flame className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 ${flameClass}`} />
                <span>{streak.toLocaleString('fa-IR')}</span>
              </button>
            );
          })()}

          {/* Compact Unified Hint + Seeds Balance Button (No Lightbulb Icon) */}
          <button
            type="button"
            onClick={onUseHint}
            aria-label={
              username
                ? `راهنمای حرف سبز — موجودی شما: ${points} بذر (هزینه هر راهنما: ${hintCost} بذر)`
                : `راهنمای حرف سبز (نیاز به ورود) — موجودی شما: ${points} بذر`
            }
            className={`h-7 sm:h-9 flex items-center gap-1 pr-1.5 pl-1 sm:pr-2 sm:pl-1 rounded-lg sm:rounded-xl transition-all active:scale-95 text-[10px] sm:text-xs font-extrabold shrink-0 ${
              canUseHint
                ? darkMode
                  ? 'bg-[#15803d] hover:bg-[#16a34a] text-white shadow-sm'
                  : 'bg-[#7e22ce] hover:bg-[#6b21a8] text-white shadow-sm'
                : darkMode
                ? 'bg-[#2e224b] text-[#d8c8ff] hover:bg-[#3c2d62] hover:text-white'
                : 'bg-[#ede9fe] text-[#581c87] hover:bg-[#ddd6fe]'
            }`}
            title={
              username
                ? `دریافت راهنمای یک حرف سبز (هزینه: ${hintCost.toLocaleString('fa-IR')} بذر • موجودی شما: ${points.toLocaleString('fa-IR')} بذر • هر برد بین ${calculateGuessPoints(6, true).toLocaleString('fa-IR')} تا ${calculateGuessPoints(1, true).toLocaleString('fa-IR')} بذر جایزه دارد)`
                : `موجودی شما: ${points.toLocaleString('fa-IR')} بذر — برای استفاده از راهنمای حرف سبز ابتدا وارد حساب کاربری شوید`
            }
          >
            <span>راهنما</span>
            <span
              className={`inline-flex items-center gap-0.5 px-1 sm:px-1.5 py-0.5 rounded-md text-[9px] sm:text-[11px] font-black tabular-nums ${
                canUseHint
                  ? 'bg-black/22 text-white'
                  : darkMode
                  ? 'bg-[#1a132c] text-[#86efac]'
                  : 'bg-white/85 text-[#14532d]'
              }`}
            >
              <GreenSeedIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
              <span>{points.toLocaleString('fa-IR')}</span>
            </span>
          </button>

          {/* Help / Tutorial Button */}
          <button
            type="button"
            onClick={onOpenHelp}
            aria-label="راهنمای بازی"
            className={iconBtnClass}
            title="راهنمای کلمباز"
          >
            <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Contact Us Button */}
          <button
            type="button"
            onClick={onOpenContact}
            aria-label="تماس با ما"
            className={`h-7 sm:h-9 w-7 sm:w-auto flex items-center justify-center gap-1 sm:px-2 rounded-lg sm:rounded-xl transition-colors active:scale-95 text-xs font-extrabold shrink-0 ${
              darkMode
                ? 'bg-[#2e224b] text-[#d8c8ff] hover:bg-[#3c2d62] hover:text-white'
                : 'bg-[#dff5e7] text-[#14532d] hover:bg-[#c5ecd4]'
            }`}
            title="تماس با ما و سفارش تبلیغات"
          >
            <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden lg:inline">تماس با ما</span>
          </button>

          {/* Settings Button */}
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="تنظیمات"
            className={iconBtnClass}
            title="تنظیمات"
          >
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* User Account / Profile */}
          <button
            type="button"
            onClick={onOpenProfile}
            aria-label={username ? `حساب کاربری ${username}` : 'ورود به حساب کاربری'}
            className={`h-7 sm:h-9 w-7 sm:w-auto flex items-center justify-center gap-1 sm:px-2.5 rounded-lg sm:rounded-xl active:scale-95 transition-colors text-xs font-extrabold shrink-0 shadow-sm ${
              darkMode
                ? 'bg-[#7e22ce] hover:bg-[#9333ea] text-white'
                : 'bg-[#15803d] hover:bg-[#166534] text-white'
            }`}
            title={username ? `حساب: ${username}` : 'ورود / ثبت‌نام'}
          >
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden sm:inline max-w-[72px] truncate">
              {username || 'ورود'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile-Only Mode Length Segmented Bar (< md) */}
      <div className="md:hidden flex items-center gap-1.5 mt-1.5">
        <div
          className={`grid grid-cols-3 gap-1 w-full rounded-xl p-1 ${
            darkMode
              ? 'bg-[#211836] shadow-sm shadow-black/20'
              : 'bg-white shadow-sm shadow-emerald-950/6'
          }`}
        >
          {([4, 5, 6] as const).map((len) => {
            const isSelected = currentLength === len;
            const faNum = len.toLocaleString('fa-IR');
            const st = gameStates?.[len];
            const isWon = st?.status === 'won';
            const isLost = st?.status === 'lost';
            const guessCount = st?.guesses?.length || 0;
            const theme = LENGTH_TAB_THEME[len];

            return (
              <button
                key={len}
                type="button"
                onClick={() => onSelectLength(len)}
                aria-label={`بازی با کلمات ${faNum} حرفی`}
                className={`py-1.5 px-2 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1 whitespace-nowrap ${
                  isSelected
                    ? theme.active
                    : darkMode
                    ? 'text-[#c4b5fd] hover:text-white hover:bg-[#2c2048] active:bg-[#342657]'
                    : 'text-[#166534] hover:bg-[#e3f6ea] active:bg-[#ccefd9]'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    isSelected ? 'bg-white' : theme.dot
                  }`}
                />
                <span>{faNum} حرفی</span>
                {isWon ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#bbf7d0]" />
                ) : isLost ? (
                  <span className="text-[10px] opacity-80">✗</span>
                ) : guessCount > 0 ? (
                  <span
                    className={`text-[10px] px-1 rounded font-mono tabular-nums ${
                      isSelected
                        ? 'bg-black/20 text-white'
                        : darkMode
                        ? 'bg-[#2e224b] text-[#86efac]'
                        : 'bg-[#dff5e7] text-[#6b21a8]'
                    }`}
                  >
                    {guessCount.toLocaleString('fa-IR')}/۶
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {hardMode && (
          <span
            className={`sm:hidden shrink-0 text-[10px] font-extrabold px-2.5 py-2 rounded-xl whitespace-nowrap ${
              darkMode
                ? 'text-[#bbf7d0] bg-[#164a2d]'
                : 'text-[#581c87] bg-[#ede9fe]'
            }`}
          >
            سخت ⚡
          </span>
        )}
      </div>
    </header>
  );
};
