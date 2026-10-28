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
      className="relative z-10 hidden lg:flex flex-col gap-3 w-full max-w-[280px] xl:max-w-[310px]"
    >
      {/* Player Profile Card */}
      <div
        className={`p-3.5 rounded-2xl border-2 shadow-sm transition-all backdrop-blur-sm ${
          darkMode
            ? 'bg-gradient-to-br from-[#25183d]/90 via-[#1f1c36]/90 to-[#162d28]/90 border-[#523b78]/70 text-[#f2edfa]'
            : 'bg-gradient-to-br from-[#e7f4ed]/95 via-[#eff7f2]/95 to-[#ede6f7]/95 border-[#82b59d]/75 text-[#17382b] shadow-emerald-950/5'
        }`}
      >
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-extrabold shadow-xs ${
                darkMode
                  ? 'bg-gradient-to-br from-[#237a5b] to-[#3f2b69]'
                  : 'bg-gradient-to-br from-[#5c328c] to-[#246b52]'
              }`}
            >
              {currentAccount ? currentAccount.username.charAt(0).toUpperCase() : '🥬'}
            </div>
            <div>
              <div className="text-xs font-extrabold truncate max-w-[120px]">
                {currentAccount ? currentAccount.username : 'کاربر مهمان'}
              </div>
              <div
                className={`text-[10px] font-bold ${
                  darkMode ? 'text-[#86efac]' : 'text-[#582c87]'
                }`}
              >
                {currentAccount ? 'کلمباز ثبت‌شده' : 'پیشرفت روی مرورگر'}
              </div>
            </div>
          </div>
          <button
            onClick={onOpenProfile}
            className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg transition-colors ${
              darkMode
                ? 'bg-gradient-to-r from-[#237a5b] to-[#38265c] hover:from-[#298f6b] hover:to-[#442e70] text-white border border-[#6ee7b7]/50'
                : 'bg-gradient-to-r from-[#5c328c] to-[#266b52] hover:from-[#6b3ba1] hover:to-[#2e7d60] text-white'
            }`}
          >
            {currentAccount ? 'حساب' : 'ورود'}
          </button>
        </div>

        {/* Quick Stats Grid using alternating green & purple shades */}
        <div
          className={`grid grid-cols-3 gap-1.5 pt-2 border-t text-center ${
            darkMode ? 'border-[#4a356e]/60' : 'border-[#88b8a2]/60'
          }`}
        >
          {/* Streak: Moss/Jade tint in dark, Lavender tint in light */}
          <div
            className={`p-1.5 rounded-xl border ${
              darkMode
                ? 'bg-[#17362f]/80 border-[#387d68]/60'
                : 'bg-[#ebe3f6]/90 border-[#a992d1]/75'
            }`}
          >
            <div
              className={`flex items-center justify-center gap-0.5 text-xs font-extrabold ${
                darkMode ? 'text-[#86efac]' : 'text-[#4c2478]'
              }`}
            >
              <Flame
                className={`w-3.5 h-3.5 ${
                  darkMode ? 'fill-[#86efac]' : 'fill-[#5c328c]'
                }`}
              />
              <span>{stats.currentStreak.toLocaleString('fa-IR')}</span>
            </div>
            <span
              className={`text-[10px] font-bold block mt-0.5 ${
                darkMode ? 'text-[#d1fae5]' : 'text-[#391b5c]'
              }`}
            >
              استریک
            </span>
          </div>

          {/* Wins: Plum/Amethyst tint in dark, Sage/Celadon tint in light */}
          <div
            className={`p-1.5 rounded-xl border ${
              darkMode
                ? 'bg-[#2a1c42]/80 border-[#583e85]/60'
                : 'bg-[#dfeee6]/90 border-[#82b59d]/75'
            }`}
          >
            <div
              className={`flex items-center justify-center gap-0.5 text-xs font-extrabold ${
                darkMode ? 'text-[#d8b4fe]' : 'text-[#1c5942]'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>{stats.gamesWon.toLocaleString('fa-IR')}</span>
            </div>
            <span
              className={`text-[10px] font-bold block mt-0.5 ${
                darkMode ? 'text-[#e9d5ff]' : 'text-[#17382b]'
              }`}
            >
              بردها
            </span>
          </div>

          {/* Win rate: Blended Eucalyptus-Violet */}
          <div
            className={`p-1.5 rounded-xl border ${
              darkMode
                ? 'bg-[#212b3d]/80 border-[#496978]/60'
                : 'bg-[#e6ecf4]/90 border-[#93a8c4]/75'
            }`}
          >
            <div
              className={`text-xs font-extrabold ${
                darkMode ? 'text-[#a7f3d0]' : 'text-[#482373]'
              }`}
            >
              %{winRate.toLocaleString('fa-IR')}
            </div>
            <span
              className={`text-[10px] font-bold block mt-0.5 ${
                darkMode ? 'text-[#ddd6fe]' : 'text-[#1c4233]'
              }`}
            >
              درصد پیروزی
            </span>
          </div>
        </div>
      </div>

      {/* Daily Challenge Progress for 4, 5, 6 letter words */}
      <div
        className={`p-3.5 rounded-2xl border-2 shadow-sm backdrop-blur-sm ${
          darkMode
            ? 'bg-gradient-to-br from-[#221738]/90 via-[#1b2630]/90 to-[#25183b]/90 border-[#4e3873]/70 text-[#f2edfa]'
            : 'bg-gradient-to-br from-[#ecf5f0]/95 via-[#e5f2eb]/95 to-[#efe8f8]/95 border-[#82b59d]/75 text-[#17382b]'
        }`}
      >
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-extrabold flex items-center gap-1.5">
            <Sparkles
              className={`w-3.5 h-3.5 ${
                darkMode ? 'text-[#86efac]' : 'text-[#5c328c]'
              }`}
            />
            چالش‌های روزانه امروز
          </span>
          <button
            onClick={onOpenStats}
            className={`text-[11px] font-extrabold underline underline-offset-2 ${
              darkMode
                ? 'text-[#a7f3d0] hover:text-[#d1fae5]'
                : 'text-[#5c328c] hover:text-[#3b1d5e]'
            }`}
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
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border-2 text-xs font-bold transition-all ${
                  isSelected
                    ? darkMode
                      ? 'border-[#6ee7b7]/80 bg-gradient-to-r from-[#193d33]/90 to-[#2d1e47]/90 text-white shadow-xs'
                      : 'border-[#65389c] bg-gradient-to-r from-[#ebe2f7] to-[#dff0e7] text-[#351857] shadow-xs'
                    : darkMode
                    ? 'border-[#4a356e]/60 hover:border-[#529980]/60 bg-[#231738]/60 text-[#e2d6f5]'
                    : 'border-[#86b8a1]/70 hover:border-[#9b7ec7] bg-[#e2f1ea]/80 text-[#17382b]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center font-extrabold text-[11px] ${
                      darkMode
                        ? 'bg-gradient-to-br from-[#237a5b] to-[#3f2b69] text-white'
                        : 'bg-gradient-to-br from-[#5c328c] to-[#266b52] text-white'
                    }`}
                  >
                    {len.toLocaleString('fa-IR')}
                  </span>
                  <span>کلمه {len.toLocaleString('fa-IR')} حرفی</span>
                </div>

                <div className="flex items-center gap-1">
                  {isWon ? (
                    <span
                      className={`flex items-center gap-1 text-[11px] font-extrabold ${
                        darkMode ? 'text-[#86efac]' : 'text-[#1b634a]'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      حل شده
                    </span>
                  ) : isLost ? (
                    <span
                      className={`text-[11px] font-extrabold ${
                        darkMode ? 'text-rose-300' : 'text-rose-700'
                      }`}
                    >
                      پایان فرصت
                    </span>
                  ) : isPlaying ? (
                    <span
                      className={`flex items-center gap-1 text-[11px] font-extrabold ${
                        darkMode ? 'text-[#d8b4fe]' : 'text-[#5c328c]'
                      }`}
                    >
                      <Hourglass className="w-3.5 h-3.5" />
                      {st.guesses.length.toLocaleString('fa-IR')} از ۶
                    </span>
                  ) : (
                    <span
                      className={`text-[10px] font-bold ${
                        darkMode ? 'text-[#c4b5fd]' : 'text-[#215c46]'
                      }`}
                    >
                      آماده شروع
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Keyboard Shortcuts for Laptop Users */}
      <div
        className={`p-3 rounded-2xl border-2 text-xs backdrop-blur-sm ${
          darkMode
            ? 'bg-gradient-to-br from-[#192e29]/85 to-[#24183b]/85 border-[#456b6e]/65 text-[#e9d5ff]'
            : 'bg-gradient-to-br from-[#ebe4f6]/90 to-[#e2f1ea]/90 border-[#9c88c4]/75 text-[#17382b]'
        }`}
      >
        <div className="flex items-center gap-1.5 font-extrabold mb-2 text-xs">
          <Keyboard
            className={`w-3.5 h-3.5 ${
              darkMode ? 'text-[#86efac]' : 'text-[#5c328c]'
            }`}
          />
          <span>کلیدهای میانبر لپ‌تاپ:</span>
        </div>
        <ul className="space-y-1.5 text-[11px] leading-relaxed font-semibold">
          <li className="flex items-center justify-between">
            <span className={darkMode ? 'text-[#d8c7f0]' : 'text-[#1c4233]'}>
              تایپ کلمات:
            </span>
            <span
              className={`px-2 py-0.5 rounded-md border text-[10px] font-extrabold ${
                darkMode
                  ? 'bg-[#173830]/90 border-[#428f76]/60 text-[#a7f3d0]'
                  : 'bg-[#ede5f8] border-[#9b7ec7] text-[#45216e]'
              }`}
            >
              حروف فارسی
            </span>
          </li>
          <li className="flex items-center justify-between">
            <span className={darkMode ? 'text-[#d8c7f0]' : 'text-[#1c4233]'}>
              ثبت حدس:
            </span>
            <kbd
              className={`px-2 py-0.5 rounded-md border font-mono text-[10px] font-extrabold ${
                darkMode
                  ? 'bg-[#2a1c42]/90 border-[#5e438c]/60 text-[#d8b4fe]'
                  : 'bg-[#dfeee6] border-[#7ab399] text-[#184a37]'
              }`}
            >
              Enter ↵
            </kbd>
          </li>
          <li className="flex items-center justify-between">
            <span className={darkMode ? 'text-[#d8c7f0]' : 'text-[#1c4233]'}>
              حذف حرف آخر:
            </span>
            <kbd
              className={`px-2 py-0.5 rounded-md border font-mono text-[10px] font-extrabold ${
                darkMode
                  ? 'bg-[#173830]/90 border-[#428f76]/60 text-[#a7f3d0]'
                  : 'bg-[#ede5f8] border-[#9b7ec7] text-[#45216e]'
              }`}
            >
              Backspace ⌫
            </kbd>
          </li>
        </ul>
      </div>
    </aside>
  );
};
