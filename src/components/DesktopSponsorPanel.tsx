import React from 'react';
import { HelpCircle, BookOpen, Settings, ShieldAlert, Sparkles } from 'lucide-react';
import { AdBanner } from './AdBanner';
import { BANNER_ADS } from '../config/advertisements';

interface DesktopSponsorPanelProps {
  darkMode: boolean;
  hardMode: boolean;
  showAds: boolean;
  onOpenHelp: () => void;
  onOpenVocab: () => void;
  onOpenSettings: () => void;
  onNotify: (msg: string) => void;
}

export const DesktopSponsorPanel: React.FC<DesktopSponsorPanelProps> = ({
  darkMode,
  hardMode,
  showAds,
  onOpenHelp,
  onOpenVocab,
  onOpenSettings,
  onNotify,
}) => {
  return (
    <aside
      aria-label="بخش حامیان مالی و امکانات کلمباز"
      className="hidden lg:flex flex-col gap-3 w-full max-w-[280px] xl:max-w-[310px]"
    >
      {/* Primary Sidebar Ad Module */}
      {showAds && BANNER_ADS.length > 0 && (
        <AdBanner
          position="sidebar"
          adIndex={0}
          darkMode={darkMode}
          onNotify={onNotify}
        />
      )}

      {/* Quick Access Card */}
      <div
        className={`p-3.5 rounded-2xl border shadow-sm ${
          darkMode
            ? 'bg-neutral-900/60 border-purple-900/40 text-white'
            : 'bg-white/90 border-purple-200/80 text-purple-950'
        }`}
      >
        <div className="flex items-center gap-1.5 font-bold text-xs mb-2.5">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>امکانات و ابزارها</span>
        </div>

        <div className="flex flex-col gap-1.5">
          <button
            onClick={onOpenHelp}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-black/10 dark:bg-white/5 hover:bg-black/20 dark:hover:bg-white/10 text-xs font-semibold transition-all border border-transparent hover:border-emerald-500/30"
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              <span>راهنما و قوانین بازی</span>
            </div>
            <span className="text-[10px] text-neutral-400">کلمباز</span>
          </button>

          <button
            onClick={onOpenVocab}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-black/10 dark:bg-white/5 hover:bg-black/20 dark:hover:bg-white/10 text-xs font-semibold transition-all border border-transparent hover:border-purple-500/30"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-400" />
              <span>مدیریت ۳ فایل واژگان</span>
            </div>
            <span className="text-[10px] text-purple-300">۴، ۵، ۶</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-black/10 dark:bg-white/5 hover:bg-black/20 dark:hover:bg-white/10 text-xs font-semibold transition-all border border-transparent hover:border-amber-500/30"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-amber-400" />
              <span>تنظیمات و صدا</span>
            </div>
            <span className="text-[10px] text-neutral-400">سفارشی</span>
          </button>
        </div>
      </div>

      {/* Hard Mode Badge / Notice if active */}
      {hardMode && (
        <div className="p-3 rounded-2xl border border-rose-500/30 bg-rose-950/20 text-rose-200 text-xs flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed text-[11px]">
            <strong className="block text-rose-300 mb-0.5">قانون حالت سخت:</strong>
            حروف کشف‌شده باید حتماً در تمام حدس‌های بعدی با موقعیت صحیح استفاده شوند.
          </div>
        </div>
      )}

      {/* Secondary Ad if available (on larger displays) */}
      {showAds && BANNER_ADS.length > 1 && (
        <div className="hidden 2xl:block">
          <AdBanner
            position="sidebar"
            adIndex={1}
            darkMode={darkMode}
            onNotify={onNotify}
          />
        </div>
      )}
    </aside>
  );
};
