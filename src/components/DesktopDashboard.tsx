import React from 'react';
import {
  Flame,
  Trophy,
  CheckCircle2,
  Hourglass,
  Keyboard,
  Sparkles,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { PlayerStats, UserAccount, DailyGameState } from '../types';

interface DesktopDashboardProps {
  stats: PlayerStats;
  currentAccount: UserAccount | null;
  currentLength: 4 | 5 | 6;
  onSelectLength: (len: 4 | 5 | 6) => void;
  gameStates: { [len: number]: DailyGameState };
  hardMode: boolean;
  darkMode: boolean;
  onOpenProfile: () => void;
  onOpenStats: () => void;
}

export const DesktopDashboard: React.FC<DesktopDashboardProps> = ({
  stats,
  currentAccount,
  currentLength,
  onSelectLength,
  gameStates,
  hardMode,
  darkMode,
  onOpenProfile,
  onOpenStats,
}) => {
  const winRate =
    stats.gamesPlayed > 0
      ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
      : 0;

  return (
    <aside
      aria-label="پیشخوان روزانه کلمباز"
      className="hidden lg:flex flex-col gap-3 w-full max-w-[280px] xl:max-w-[310px]"
    >
      {/* Player Profile Card */}
      <div
        className={`p-3.5 rounded-2xl border shadow-sm transition-all ${
          darkMode
            ? 'bg-purple-950/40 border-purple-800/40 text-purple-100'
            : 'bg-white/80 border-purple-200/80 text-purple-950 shadow-purple-50'
        }`}
      >
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-xs">
              {currentAccount ? currentAccount.username.charAt(0).toUpperCase() : '🥬'}
            </div>
            <div>
              <div className="text-xs font-bold truncate max-w-[120px]">
                {currentAccount ? currentAccount.username : 'کاربر مهمان'}
              </div>
              <div className="text-[10px] text-emerald-400 font-medium">
                {currentAccount ? 'کلمباز ثبت‌شده' : 'پیشرفت روی مرورگر'}
              </div>
            </div>
          </div>
          <button
            onClick={onOpenProfile}
            className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-purple-700/60 hover:bg-purple-700 text-white transition-colors"
          >
            {currentAccount ? 'حساب' : 'ورود'}
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-purple-500/20 text-center">
          <div className="p-1.5 rounded-xl bg-black/20 dark:bg-black/30">
            <div className="flex items-center justify-center gap-0.5 text-orange-400 text-xs font-bold">
              <Flame className="w-3.5 h-3.5 fill-orange-400" />
              <span>{stats.currentStreak.toLocaleString('fa-IR')}</span>
            </div>
            <span className="text-[9px] text-neutral-400 block mt-0.5">استریک</span>
          </div>

          <div className="p-1.5 rounded-xl bg-black/20 dark:bg-black/30">
            <div className="flex items-center justify-center gap-0.5 text-emerald-400 text-xs font-bold">
              <Trophy className="w-3.5 h-3.5" />
              <span>{stats.gamesWon.toLocaleString('fa-IR')}</span>
            </div>
            <span className="text-[9px] text-neutral-400 block mt-0.5">بردها</span>
          </div>

          <div className="p-1.5 rounded-xl bg-black/20 dark:bg-black/30">
            <div className="text-purple-300 text-xs font-bold">
              %{winRate.toLocaleString('fa-IR')}
            </div>
            <span className="text-[9px] text-neutral-400 block mt-0.5">درصد پیروزی</span>
          </div>
        </div>
      </div>

      {/* Daily Challenge Progress for 4, 5, 6 letter words */}
      <div
        className={`p-3.5 rounded-2xl border shadow-sm ${
          darkMode
            ? 'bg-neutral-900/60 border-purple-900/50 text-white'
            : 'bg-white/90 border-emerald-200/80 text-emerald-950'
        }`}
      >
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            چالش‌های روزانه امروز
          </span>
          <button
            onClick={onOpenStats}
            className="text-[10px] text-purple-400 hover:text-purple-300 underline underline-offset-2"
          >
            نمودار کامل
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          {([4, 5, 6] as (4 | 5 | 6)[]).map((len) => {
            const st = gameStates[len];
            const isWon = st?.status === 'won';
            const isLost = st?.status === 'lost';
            const isPlaying = st && st.guesses?.length > 0 && !isWon && !isLost;
            const isSelected = currentLength === len;

            return (
              <button
                key={len}
                onClick={() => onSelectLength(len)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-600/20 shadow-xs'
                    : 'border-white/5 hover:border-purple-500/40 bg-black/10 hover:bg-black/20'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-purple-900/70 text-purple-200 flex items-center justify-center font-bold text-[11px]">
                    {len.toLocaleString('fa-IR')}
                  </span>
                  <span>کلمه {len.toLocaleString('fa-IR')} حرفی</span>
                </div>

                <div className="flex items-center gap-1">
                  {isWon ? (
                    <span className="text-emerald-400 flex items-center gap-1 text-[11px] font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      حل شده
                    </span>
                  ) : isLost ? (
                    <span className="text-rose-400 text-[11px] font-bold">پایان فرصت</span>
                  ) : isPlaying ? (
                    <span className="text-amber-400 flex items-center gap-1 text-[11px] font-bold">
                      <Hourglass className="w-3.5 h-3.5" />
                      {st.guesses.length.toLocaleString('fa-IR')} از ۶
                    </span>
                  ) : (
                    <span className="text-neutral-400 text-[10px]">آماده شروع</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Keyboard Shortcuts for Laptop Users */}
      <div
        className={`p-3 rounded-2xl border text-xs ${
          darkMode
            ? 'bg-purple-950/20 border-purple-900/40 text-purple-200/90'
            : 'bg-emerald-50/70 border-emerald-200/70 text-emerald-900'
        }`}
      >
        <div className="flex items-center gap-1.5 font-bold mb-2 text-xs">
          <Keyboard className="w-3.5 h-3.5 text-purple-400" />
          <span>کلیدهای میانبر لپ‌تاپ:</span>
        </div>
        <ul className="space-y-1.5 text-[11px] leading-relaxed">
          <li className="flex items-center justify-between">
            <span className="text-neutral-400">تایپ کلمات:</span>
            <span className="px-1.5 py-0.5 rounded bg-black/40 border border-purple-500/30 text-[10px] font-semibold text-white">
              حروف فارسی
            </span>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-neutral-400">ثبت حدس:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-black/40 border border-purple-500/30 font-mono text-[10px] text-white">
              Enter ↵
            </kbd>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-neutral-400">حذف حرف آخر:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-black/40 border border-purple-500/30 font-mono text-[10px] text-white">
              Backspace ⌫
            </kbd>
          </li>
        </ul>
      </div>
    </aside>
  );
};
