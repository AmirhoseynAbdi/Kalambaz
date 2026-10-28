import React from 'react';
import {
  HelpCircle,
  BarChart2,
  Settings,
  Flame,
  User,
  CheckCircle2,
} from 'lucide-react';
import { DailyGameState } from '../types';

interface HeaderProps {
  currentLength: 4 | 5 | 6;
  onSelectLength: (len: 4 | 5 | 6) => void;
  streak: number;
  username?: string;
  onOpenHelp: () => void;
  onOpenStats: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  darkMode: boolean;
  hardMode: boolean;
  gameStates?: { [len: number]: DailyGameState };
}

export const Header: React.FC<HeaderProps> = ({
  currentLength,
  onSelectLength,
  streak,
  username,
  onOpenHelp,
  onOpenStats,
  onOpenSettings,
  onOpenProfile,
  darkMode,
  hardMode,
  gameStates,
}) => {
  const iconBtnClass = `w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center transition-all active:scale-95 shrink-0 ${
    darkMode
      ? 'bg-gradient-to-b from-[#2f204a]/90 to-[#1c332e]/85 border-[#5a4282]/70 text-[#86efac] hover:from-[#3a285c] hover:to-[#224039] hover:text-[#bbf7d0]'
      : 'bg-gradient-to-b from-[#efe9f8] to-[#e1f1e9] border-[#9d84c4]/75 text-[#4c2878] hover:from-[#e6dcf5] hover:to-[#d5ebdf] shadow-2xs'
  }`;

  return (
    <header className="relative z-10 w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 pt-1.5 sm:pt-2 pb-1 shrink-0">
      {/* Main Top Bar */}
      <div
        className={`flex items-center justify-between gap-1.5 sm:gap-3 border-b-2 px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl shadow-xs transition-colors backdrop-blur-md ${
          darkMode
            ? 'bg-gradient-to-r from-[#24173b]/95 via-[#1f1c38]/95 to-[#172e29]/95 border-[#523b78]/75 text-[#f3effb]'
            : 'bg-gradient-to-r from-[#e4f2eb]/95 via-[#eef6f1]/95 to-[#ece5f6]/95 border-[#82b59d]/80 text-[#18382b]'
        }`}
      >
        {/* Right Zone (RTL Start): Brand Identity + Streak on Mobile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 shrink-0">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <span className="text-xl sm:text-2xl drop-shadow-sm select-none">🥬</span>
            <h1
              className={`text-lg sm:text-2xl font-black tracking-tight font-['Lalezar',sans-serif] leading-none ${
                darkMode
                  ? 'bg-gradient-to-l from-[#e9d5ff] via-[#d8b4fe] to-[#86efac] bg-clip-text text-transparent'
                  : 'bg-gradient-to-l from-[#184a37] via-[#26634b] to-[#582c87] bg-clip-text text-transparent'
              }`}
            >
              کَلَمباز
            </h1>
            <span
              className={`hidden md:inline-block text-[11px] px-2 py-0.5 rounded-full border font-mono font-extrabold ${
                darkMode
                  ? 'bg-[#1a3d34]/85 border-[#489e82]/65 text-[#a7f3d0]'
                  : 'bg-[#ede5f8] border-[#9b7ec7] text-[#4c2478]'
              }`}
            >
              Kalabaz
            </span>
          </div>

          {hardMode && (
            <span
              className={`hidden sm:inline-block text-[10px] font-extrabold tracking-wide px-2 py-0.5 rounded-full whitespace-nowrap ${
                darkMode
                  ? 'text-[#bbf7d0] bg-[#173b32]/90 border border-[#3d8b73]/60'
                  : 'text-[#482373] bg-[#e9dff7] border border-[#a58ad1]'
              }`}
            >
              حالت سخت
            </span>
          )}
        </div>

        {/* Center Zone (Desktop >= md): Mode Length Selector Tabs */}
        <div className="hidden md:flex items-center justify-center gap-2">
          <span
            className={`text-xs font-extrabold whitespace-nowrap ${
              darkMode ? 'text-[#d8c7f0]' : 'text-[#234d3c]'
            }`}
          >
            حالت کلمه:
          </span>
          <div
            className={`inline-flex rounded-xl p-1 border-2 ${
              darkMode
                ? 'bg-[#1a122b]/90 border-[#4b3570]/75'
                : 'bg-[#d9ece2]/90 border-[#85b8a0]/80 shadow-2xs'
            }`}
          >
            {([4, 5, 6] as const).map((len) => {
              const isSelected = currentLength === len;
              const faNum = len.toLocaleString('fa-IR');
              const st = gameStates?.[len];
              const isWon = st?.status === 'won';
              return (
                <button
                  key={len}
                  type="button"
                  onClick={() => onSelectLength(len)}
                  aria-label={`بازی با کلمات ${faNum} حرفی`}
                  className={`px-3.5 py-1 rounded-lg text-xs sm:text-sm font-extrabold transition-all flex items-center gap-1 whitespace-nowrap ${
                    isSelected
                      ? darkMode
                        ? 'bg-gradient-to-r from-[#227559] to-[#2e5978] text-[#f0fdf4] shadow-sm ring-1 ring-[#6ee7b7]/60'
                        : 'bg-gradient-to-r from-[#5c328c] to-[#3f5e78] text-white shadow-sm ring-1 ring-[#482373]'
                      : darkMode
                      ? 'text-[#d5c5eb] hover:text-white hover:bg-[#2d1f47]/70'
                      : 'text-[#1c4233] hover:bg-[#cbe3d7]/80'
                  }`}
                >
                  <span>{faNum} حرفی</span>
                  {isWon && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Left Zone (RTL End): Utility Actions & Streak */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Daily Streak Badge */}
          <button
            type="button"
            onClick={onOpenStats}
            aria-label={`استریک پیاپی: ${streak} روز`}
            className={`h-9 sm:h-10 flex items-center gap-1 px-2 sm:px-2.5 rounded-xl border transition-all text-xs font-extrabold shrink-0 tabular-nums ${
              darkMode
                ? 'bg-gradient-to-b from-[#173b31]/90 to-[#271b40]/90 border-[#4da688]/70 text-[#a7f3d0] hover:border-[#6ee7b7]'
                : 'bg-gradient-to-b from-[#efe7f9] to-[#dfeee6] border-2 border-[#8c70b8] text-[#45216e] hover:from-[#e6daf6] hover:to-[#d3e8dd]'
            }`}
            title="استریک روزانه کلمباز"
          >
            <Flame
              className={`w-4 h-4 shrink-0 ${
                darkMode
                  ? 'text-[#6ee7b7] fill-[#6ee7b7]'
                  : 'text-[#65349c] fill-[#65349c]'
              }`}
            />
            <span>{streak.toLocaleString('fa-IR')}</span>
          </button>

          <button
            type="button"
            onClick={onOpenStats}
            aria-label="آمار و نمودارها"
            className={iconBtnClass}
            title="آمار عملکرد"
          >
            <BarChart2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            type="button"
            onClick={onOpenHelp}
            aria-label="راهنمای بازی"
            className={iconBtnClass}
            title="راهنمای کلمباز"
          >
            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

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
            className={`h-9 sm:h-10 flex items-center justify-center gap-1.5 px-2 sm:px-2.5 rounded-xl border active:scale-95 transition-all text-xs font-extrabold shrink-0 ${
              darkMode
                ? 'bg-gradient-to-r from-[#237559] to-[#3f2b69] hover:from-[#298767] hover:to-[#4c357d] border-[#6ee7b7]/65 text-[#f0fdf4]'
                : 'bg-gradient-to-r from-[#5c328c] to-[#266b52] hover:from-[#693a9e] hover:to-[#2d7d60] border-[#482373] text-white shadow-xs'
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
              ? 'bg-[#1c132e]/95 border-[#4c3773]/75'
              : 'bg-[#d9ece2]/95 border-[#83b59e]/80 shadow-2xs'
          }`}
        >
          {([4, 5, 6] as const).map((len) => {
            const isSelected = currentLength === len;
            const faNum = len.toLocaleString('fa-IR');
            const st = gameStates?.[len];
            const isWon = st?.status === 'won';
            const isLost = st?.status === 'lost';
            const guessCount = st?.guesses?.length || 0;

            return (
              <button
                key={len}
                type="button"
                onClick={() => onSelectLength(len)}
                aria-label={`بازی با کلمات ${faNum} حرفی`}
                className={`py-1.5 px-2 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1 whitespace-nowrap ${
                  isSelected
                    ? darkMode
                      ? 'bg-gradient-to-r from-[#227559] to-[#3a285c] text-white shadow-xs ring-1 ring-[#6ee7b7]/60'
                      : 'bg-gradient-to-r from-[#5c328c] to-[#286b52] text-white shadow-xs ring-1 ring-[#482373]'
                    : darkMode
                    ? 'text-[#d5c5eb] hover:text-white active:bg-[#2d1f47]/60'
                    : 'text-[#1c4233] active:bg-[#c8e0d4]/80'
                }`}
              >
                <span>{faNum} حرفی</span>
                {isWon ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#a7f3d0]" />
                ) : isLost ? (
                  <span className="text-[10px] opacity-80">✗</span>
                ) : guessCount > 0 ? (
                  <span
                    className={`text-[10px] px-1 rounded font-mono tabular-nums ${
                      isSelected
                        ? 'bg-black/20 text-white'
                        : darkMode
                        ? 'bg-[#2a1c42] text-[#86efac]'
                        : 'bg-[#e6dcf5] text-[#482373]'
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
                ? 'text-[#a7f3d0] bg-[#173b31]/90 border-[#42967b]/60'
                : 'text-[#482373] bg-[#ebe2f7] border-[#9b7ec7]'
            }`}
          >
            سخت ⚡
          </span>
        )}
      </div>
    </header>
  );
};
