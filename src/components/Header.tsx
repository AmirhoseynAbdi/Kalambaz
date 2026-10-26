import React from 'react';
import {
  HelpCircle,
  BarChart2,
  BookOpen,
  Settings,
  Flame,
  User,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  currentLength: 4 | 5 | 6;
  onSelectLength: (len: 4 | 5 | 6) => void;
  streak: number;
  username?: string;
  onOpenHelp: () => void;
  onOpenStats: () => void;
  onOpenVocab: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  darkMode: boolean;
  hardMode: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentLength,
  onSelectLength,
  streak,
  username,
  onOpenHelp,
  onOpenStats,
  onOpenVocab,
  onOpenSettings,
  onOpenProfile,
  darkMode,
  hardMode,
}) => {
  return (
    <header className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 pt-2 pb-1.5">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
        {/* Left Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            onClick={onOpenHelp}
            aria-label="راهنمای بازی"
            className="p-1.5 sm:p-2 rounded-xl text-neutral-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            title="راهنمای کلمباز"
          >
            <HelpCircle className="w-5 h-5 text-emerald-400" />
          </button>

          <button
            onClick={onOpenVocab}
            aria-label="مدیریت واژه‌نامه"
            className="p-1.5 sm:p-2 rounded-xl text-neutral-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all relative"
            title="واژه‌نامه ۴، ۵ و ۶ حرفی کلمباز"
          >
            <BookOpen className="w-5 h-5 text-purple-400" />
            <span className="hidden sm:inline text-xs font-semibold mr-1 text-purple-300">
              واژه‌نامه
            </span>
          </button>

          <button
            onClick={onOpenStats}
            aria-label="آمار و نمودارها"
            className="p-1.5 sm:p-2 rounded-xl text-neutral-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            title="آمار عملکرد"
          >
            <BarChart2 className="w-5 h-5 text-amber-400" />
          </button>
        </div>

        {/* Center: Brand Title */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            <span className="text-2xl drop-shadow-sm">🥬</span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-purple-400 bg-clip-text text-transparent font-['Lalezar',sans-serif]">
              کَلَمباز
            </h1>
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-900/60 border border-purple-600/50 text-purple-300 font-mono font-bold">
              Kalabaz
            </span>
          </div>
          {hardMode && (
            <span className="text-[10px] font-bold text-rose-400 tracking-wide mt-0.5 animate-pulse">
              حالت سخت فعال است
            </span>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Daily Streak Badge */}
          <button
            onClick={onOpenStats}
            aria-label={`استریک پیاپی: ${streak} روز`}
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 transition-all text-xs font-bold"
            title="استریک روزانه کلمباز"
          >
            <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
            <span>{streak.toLocaleString('fa-IR')}</span>
          </button>

          <button
            onClick={onOpenSettings}
            aria-label="تنظیمات"
            className="p-1.5 sm:p-2 rounded-xl text-neutral-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
            title="تنظیمات"
          >
            <Settings className="w-5 h-5 text-emerald-400" />
          </button>

          {/* User Account / Profile */}
          <button
            onClick={onOpenProfile}
            aria-label={username ? `حساب کاربری ${username}` : 'ورود به حساب کاربری'}
            className="flex items-center gap-1.5 p-1 sm:px-2.5 py-1 rounded-xl bg-purple-900/50 hover:bg-purple-800/70 border border-purple-600/50 active:scale-95 transition-all text-xs font-bold"
            title={username ? `حساب: ${username}` : 'ورود / ثبت‌نام'}
          >
            <User className="w-4 h-4 text-emerald-300" />
            <span className="hidden sm:inline text-purple-200 max-w-[80px] truncate">
              {username || 'ورود'}
            </span>
          </button>
        </div>
      </div>

      {/* Mode Length Selector Tabs */}
      <div className="flex items-center justify-center gap-2 mt-2">
        <span className="text-xs font-semibold text-neutral-400 pl-1">
          حالت کلمه:
        </span>
        <div className="inline-flex rounded-xl p-1 bg-black/30 backdrop-blur-sm border border-purple-500/20">
          {[4, 5, 6].map((len) => {
            const isSelected = currentLength === len;
            const faNum = len.toLocaleString('fa-IR');
            return (
              <button
                key={len}
                onClick={() => onSelectLength(len as 4 | 5 | 6)}
                aria-label={`بازی با کلمات ${faNum} حرفی`}
                className={`px-3 py-1 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-emerald-600 to-purple-700 text-white shadow-sm ring-1 ring-emerald-400/50'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {faNum} حرفی
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
