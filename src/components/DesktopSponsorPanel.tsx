import React from 'react';
import { HelpCircle, Settings, ShieldAlert, Sparkles } from 'lucide-react';
import { AdBanner } from './AdBanner';
import { BANNER_ADS } from '../config/advertisements';

interface DesktopSponsorPanelProps {
  darkMode: boolean;
  hardMode: boolean;
  showAds: boolean;
  onOpenHelp: () => void;
  onOpenSettings: () => void;
  onNotify: (msg: string) => void;
}

export const DesktopSponsorPanel: React.FC<DesktopSponsorPanelProps> = ({
  darkMode,
  hardMode,
  showAds,
  onOpenHelp,
  onOpenSettings,
  onNotify,
}) => {
  return (
    <aside
      aria-label="بخش حامیان مالی و امکانات کلمباز"
      className="relative z-10 hidden lg:flex flex-col gap-3 w-full max-w-[280px] xl:max-w-[310px]"
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
        className={`p-3.5 rounded-2xl border-2 shadow-sm backdrop-blur-sm ${
          darkMode
            ? 'bg-gradient-to-br from-[#23173a]/90 via-[#1d2238]/90 to-[#162d28]/90 border-[#523b78]/70 text-[#f2edfa]'
            : 'bg-gradient-to-br from-[#e7f4ed]/95 via-[#eff7f2]/95 to-[#ede5f7]/95 border-[#82b59d]/75 text-[#17382b]'
        }`}
      >
        <div className="flex items-center gap-1.5 font-extrabold text-xs mb-2.5">
          <Sparkles
            className={`w-3.5 h-3.5 ${
              darkMode ? 'text-[#86efac]' : 'text-[#5c328c]'
            }`}
          />
          <span>امکانات و ابزارها</span>
        </div>

        <div className="flex flex-col gap-1.5">
          <button
            onClick={onOpenHelp}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all border-2 ${
              darkMode
                ? 'bg-[#26193d]/80 hover:bg-[#31214f]/85 border-[#543c7d]/70 hover:border-[#529980]/70 text-[#e9d5ff]'
                : 'bg-[#e2f1ea]/90 hover:bg-[#d5eadf] border-[#82b59d]/75 hover:border-[#8e73ba] text-[#17382b]'
            }`}
          >
            <div className="flex items-center gap-2">
              <HelpCircle
                className={`w-4 h-4 ${
                  darkMode ? 'text-[#86efac]' : 'text-[#5c328c]'
                }`}
              />
              <span>راهنما و قوانین بازی</span>
            </div>
            <span
              className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                darkMode
                  ? 'bg-[#173b31] text-[#a7f3d0] border border-[#3d8b73]/50'
                  : 'bg-[#5c328c] text-white'
              }`}
            >
              کلمباز
            </span>
          </button>

          <button
            onClick={onOpenSettings}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all border-2 ${
              darkMode
                ? 'bg-[#17332c]/80 hover:bg-[#1d4037]/85 border-[#387d68]/65 hover:border-[#8b6fc2]/70 text-[#d1fae5]'
                : 'bg-[#ece4f7]/90 hover:bg-[#e1d4f2] border-[#a58fd1]/75 hover:border-[#68a389] text-[#351857]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Settings
                className={`w-4 h-4 ${
                  darkMode ? 'text-[#d8b4fe]' : 'text-[#1e6349]'
                }`}
              />
              <span>تنظیمات و صدا</span>
            </div>
            <span
              className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                darkMode
                  ? 'bg-[#352354] text-[#e9d5ff] border border-[#684b99]/50'
                  : 'bg-[#22664d] text-white'
              }`}
            >
              سفارشی
            </span>
          </button>
        </div>
      </div>

      {/* Hard Mode Badge / Notice if active */}
      {hardMode && (
        <div
          className={`p-3 rounded-2xl border-2 text-xs flex items-start gap-2 ${
            darkMode
              ? 'border-[#48967c]/60 bg-gradient-to-r from-[#16382f]/80 to-[#26193d]/80 text-[#d1fae5]'
              : 'border-[#9b82c7]/75 bg-gradient-to-r from-[#ebe2f7]/90 to-[#e0f0e8]/90 text-[#351857]'
          }`}
        >
          <ShieldAlert
            className={`w-4 h-4 shrink-0 mt-0.5 ${
              darkMode ? 'text-[#86efac]' : 'text-[#5c328c]'
            }`}
          />
          <div className="leading-relaxed text-[11px] font-semibold">
            <strong
              className={`block mb-0.5 ${
                darkMode ? 'text-[#a7f3d0]' : 'text-[#482373]'
              }`}
            >
              قانون حالت سخت:
            </strong>
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
