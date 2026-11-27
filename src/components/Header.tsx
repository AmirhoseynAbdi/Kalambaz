import React from 'react';
import {
  HelpCircle,
  Settings,
  Flame,
  User,
  CheckCircle2,
  Mail,
  Lightbulb,
  Lock,
} from 'lucide-react';
import { DailyGameState } from '../types';
import { calculateGuessPoints } from '../game/wordleLogic';
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
    active: 'bg-[#15803d] text-white ring-1 ring-[#4ade80]/80 shadow-xs',
    dot: 'bg-[#4ade80]',
  },
  5: {
    active: 'bg-[#7e22ce] text-white ring-1 ring-[#c084fc]/80 shadow-xs',
    dot: 'bg-[#c084fc]',
  },
  6: {
    active: 'bg-[#d97706] text-white ring-1 ring-[#fbbf24]/80 shadow-xs',
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
  const iconBtnClass = `w-8 h-8 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center transition-colors active:scale-95 shrink-0 ${
    darkMode
      ? 'bg-[#291e40] border-[#433266] text-[#c4b5fd] hover:bg-[#352752] hover:text-white'
      : 'bg-[#dcfce7] border-[#86efac] text-[#166534] hover:bg-[#bbf7d0]'
  }`;

  return (
    <header className="relative z-10 w-full max-w-7xl mx-auto px-1.5 sm:px-4 lg:px-6 pt-1.5 sm:pt-2 pb-1 shrink-0">
      {/* Main Top Bar */}
      <div
        className={`flex items-center justify-between gap-1 sm:gap-2.5 border px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl transition-colors ${
          darkMode
            ? 'bg-[#201733] border-[#362854] text-[#f5f3ff]'
            : 'bg-white border-[#86efac] text-[#14532d] shadow-2xs'
        }`}
      >
        {/* Right Zone (RTL Start): Brand Identity */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-lg sm:text-2xl select-none">🥦</span>
            <h1
              className={`text-base sm:text-2xl font-black tracking-tight font-['Lalezar',sans-serif] leading-none whitespace-nowrap ${
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
              className={`hidden sm:inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-lg border whitespace-nowrap ${
                darkMode
                  ? 'text-[#86efac] bg-[#14532d] border-[#22c55e]'
                  : 'text-[#581c87] bg-[#f3e8ff] border-[#9333ea]'
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
            className={`inline-flex rounded-xl p-1 border ${
              darkMode
                ? 'bg-[#161022] border-[#362854]'
                : 'bg-[#dcfce7] border-[#86efac]'
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
                      ? 'text-[#c4b5fd] hover:text-white hover:bg-[#291e40]'
                      : 'text-[#166534] hover:bg-[#bbf7d0]'
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

        {/* Left Zone (RTL End): Streak, Seeds, Green Hint, Help, Contact Us, Settings, Profile */}
        <div className="flex items-center gap-[3px] sm:gap-1.5 shrink-0">
          {/* Daily Streak Viewing Button (Unified Streak & Stats Button) */}
          <button
            type="button"
            onClick={onOpenStats}
            aria-label={`مشاهده استریک و آمار: ${streak} روز`}
            className={`h-8 sm:h-10 flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 rounded-xl border transition-colors text-[11px] sm:text-xs font-extrabold shrink-0 tabular-nums ${
              darkMode
                ? 'bg-[#291e40] border-[#433266] text-[#e9d5ff] hover:bg-[#352752]'
                : 'bg-[#dcfce7] border-[#86efac] text-[#14532d] hover:bg-[#bbf7d0]'
            }`}
            title="مشاهده استریک روزانه و آمار"
          >
            <Flame
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${
                darkMode
                  ? 'text-[#a855f7] fill-[#a855f7]'
                  : 'text-[#16a34a] fill-[#22c55e]'
              }`}
            />
            <span>{streak.toLocaleString('fa-IR')}</span>
          </button>

          {/* Player Seeds Display Badge */}
          <button
            type="button"
            onClick={onOpenStats}
            aria-label={`بذرهای شما: ${points} بذر`}
            className={`h-8 sm:h-10 flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 rounded-xl border transition-colors text-[11px] sm:text-xs font-extrabold shrink-0 tabular-nums ${
              darkMode
                ? 'bg-[#143d25] border-[#22c55e] text-[#bbf7d0] hover:bg-[#16532f]'
                : 'bg-[#f3e8ff] border-[#9333ea] text-[#581c87] hover:bg-[#e9d5ff]'
            }`}
            title={`بذرهای شما: ${points.toLocaleString('fa-IR')} بذر (هر برد بر اساس تعداد حدس بین ${calculateGuessPoints(6, true).toLocaleString('fa-IR')} تا ${calculateGuessPoints(1, true).toLocaleString('fa-IR')} بذر جایزه دارد)`}
          >
            <GreenSeedIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>{points.toLocaleString('fa-IR')}</span>
          </button>

          {/* Green-Letter Hint Button (locked until login) */}
          <button
            type="button"
            onClick={onUseHint}
            aria-label={
              username
                ? `راهنمای حرف سبز (${hintCost} بذر)`
                : 'راهنمای حرف سبز (نیاز به ورود به حساب کاربری)'
            }
            className={`h-8 sm:h-10 flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 rounded-xl border transition-colors active:scale-95 text-[11px] sm:text-xs font-extrabold shrink-0 ${
              canUseHint
                ? darkMode
                  ? 'bg-[#15803d] hover:bg-[#16a34a] border-[#22c55e] text-white'
                  : 'bg-[#6b21a8] hover:bg-[#7e22ce] border-[#9333ea] text-white'
                : darkMode
                ? 'bg-[#291e40] border-[#433266] text-[#9b8bb8] hover:text-white'
                : 'bg-[#dcfce7] border-[#86efac] text-[#166534]'
            }`}
            title={
              username
                ? `دریافت راهنمای یک حرف سبز کشف‌نشده (هزینه: ${hintCost.toLocaleString('fa-IR')} بذر)`
                : 'برای استفاده از راهنمای حرف سبز ابتدا وارد حساب کاربری شوید'
            }
          >
            {username ? (
              <Lightbulb
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${
                  canUseHint
                    ? 'text-[#fde047] fill-[#fde047]'
                    : darkMode
                    ? 'text-[#a78bfa]'
                    : 'text-[#15803d]'
                }`}
              />
            ) : (
              <Lock
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${
                  darkMode ? 'text-[#a78bfa]' : 'text-[#15803d]'
                }`}
              />
            )}
            <span className="hidden sm:inline">راهنما</span>
            <span className="text-[10px] opacity-90 font-mono">
              ({hintCost.toLocaleString('fa-IR')})
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
            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Contact Us Button */}
          <button
            type="button"
            onClick={onOpenContact}
            aria-label="تماس با ما"
            className={`h-8 sm:h-10 w-8 sm:w-auto flex items-center justify-center gap-1 sm:px-2.5 rounded-xl border transition-colors active:scale-95 text-xs font-extrabold shrink-0 ${
              darkMode
                ? 'bg-[#291e40] border-[#433266] text-[#c4b5fd] hover:bg-[#352752] hover:text-white'
                : 'bg-[#dcfce7] border-[#86efac] text-[#166534] hover:bg-[#bbf7d0]'
            }`}
            title="تماس با ما و سفارش تبلیغات"
          >
            <Mail className="w-4 h-4 shrink-0" />
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
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* User Account / Profile */}
          <button
            type="button"
            onClick={onOpenProfile}
            aria-label={username ? `حساب کاربری ${username}` : 'ورود به حساب کاربری'}
            className={`h-8 sm:h-10 w-8 sm:w-auto flex items-center justify-center gap-1.5 sm:px-2.5 rounded-xl border active:scale-95 transition-colors text-xs font-extrabold shrink-0 ${
              darkMode
                ? 'bg-[#6b21a8] hover:bg-[#7e22ce] border-[#9333ea] text-white'
                : 'bg-[#15803d] hover:bg-[#16a34a] border-[#22c55e] text-white'
            }`}
            title={username ? `حساب: ${username}` : 'ورود / ثبت‌نام'}
          >
            <User className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline max-w-[76px] truncate">
              {username || 'ورود'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile-Only Mode Length Segmented Bar (< md) */}
      <div className="md:hidden flex items-center gap-1.5 mt-1.5">
        <div
          className={`grid grid-cols-3 gap-1 w-full rounded-xl p-1 border ${
            darkMode
              ? 'bg-[#201733] border-[#362854]'
              : 'bg-white border-[#86efac]'
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
                    ? 'text-[#c4b5fd] hover:text-white active:bg-[#291e40]'
                    : 'text-[#166534] active:bg-[#dcfce7]'
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
                        ? 'bg-[#291e40] text-[#86efac]'
                        : 'bg-[#dcfce7] text-[#6b21a8]'
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
            className={`sm:hidden shrink-0 text-[10px] font-extrabold px-2 py-2 rounded-xl border whitespace-nowrap ${
              darkMode
                ? 'text-[#86efac] bg-[#14532d] border-[#22c55e]'
                : 'text-[#581c87] bg-[#f3e8ff] border-[#9333ea]'
            }`}
          >
            سخت ⚡
          </span>
        )}
      </div>
    </header>
  );
};
