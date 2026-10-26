import React from 'react';
import { X, Moon, Sun, ShieldAlert, Volume2, VolumeX, Eye, Megaphone } from 'lucide-react';
import { AppSettings } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  canChangeHardMode: boolean; // Cannot change hard mode mid-game if already guessed
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  canChangeHardMode,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="تنظیمات کلمباز"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-neutral-900 border border-purple-500/40 p-5 sm:p-6 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <h2 className="text-lg font-bold font-['Lalezar',sans-serif]">
            تنظیمات بازی کلمباز 🥬
          </h2>
          <button
            onClick={onClose}
            aria-label="بستن تنظیمات"
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options List */}
        <div className="space-y-4 divide-y divide-white/5">
          {/* Hard Mode */}
          <div className="flex items-center justify-between pt-3 first:pt-0">
            <div className="space-y-0.5 max-w-[78%]">
              <span className="block text-sm font-bold text-white">
                حالت سخت (Hard Mode)
              </span>
              <p className="text-[11px] text-neutral-400 leading-snug">
                هر نشانه‌ای که کشف شود (سبز یا زرد) باید حتماً در حدس‌های بعدی به کار گرفته شود.
              </p>
              {!canChangeHardMode && (
                <p className="text-[10px] text-amber-400 mt-1">
                  حالت سخت فقط در آغاز بازی و قبل از ثبت حدس قابل تغییر است.
                </p>
              )}
            </div>

            <button
              role="switch"
              aria-checked={settings.hardMode}
              disabled={!canChangeHardMode}
              onClick={() =>
                onUpdateSettings({ hardMode: !settings.hardMode })
              }
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 focus:outline-hidden ${
                settings.hardMode ? 'bg-emerald-600' : 'bg-neutral-700'
              } ${!canChangeHardMode ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  settings.hardMode ? '-translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Dark Mode */}
          <div className="flex items-center justify-between pt-3">
            <div className="space-y-0.5">
              <span className="block text-sm font-bold text-white flex items-center gap-1.5">
                {settings.darkMode ? (
                  <Moon className="w-4 h-4 text-purple-400" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-400" />
                )}
                حالت شب (تم تاریک)
              </span>
              <p className="text-[11px] text-neutral-400">
                پوسته کلمی بنفش تیره برای دید بهتر در محیط‌های کم‌نور.
              </p>
            </div>

            <button
              role="switch"
              aria-checked={settings.darkMode}
              onClick={() =>
                onUpdateSettings({ darkMode: !settings.darkMode })
              }
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 focus:outline-hidden cursor-pointer ${
                settings.darkMode ? 'bg-purple-600' : 'bg-neutral-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  settings.darkMode ? '-translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Sound Effects */}
          <div className="flex items-center justify-between pt-3">
            <div className="space-y-0.5">
              <span className="block text-sm font-bold text-white flex items-center gap-1.5">
                {settings.soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-neutral-400" />
                )}
                جلوه‌های صوتی
              </span>
              <p className="text-[11px] text-neutral-400">
                صدای فشردن کلیدها و افکت پیروزی.
              </p>
            </div>

            <button
              role="switch"
              aria-checked={settings.soundEnabled}
              onClick={() =>
                onUpdateSettings({ soundEnabled: !settings.soundEnabled })
              }
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 focus:outline-hidden cursor-pointer ${
                settings.soundEnabled ? 'bg-emerald-600' : 'bg-neutral-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  settings.soundEnabled ? '-translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* High Contrast Mode */}
          <div className="flex items-center justify-between pt-3">
            <div className="space-y-0.5">
              <span className="block text-sm font-bold text-white flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-teal-400" />
                کنتراست بالا
              </span>
              <p className="text-[11px] text-neutral-400">
                تقویت تفکیک رنگ خانه‌های سبز و نارنجی.
              </p>
            </div>

            <button
              role="switch"
              aria-checked={settings.highContrast}
              onClick={() =>
                onUpdateSettings({ highContrast: !settings.highContrast })
              }
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 focus:outline-hidden cursor-pointer ${
                settings.highContrast ? 'bg-teal-600' : 'bg-neutral-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  settings.highContrast ? '-translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Show Ads / Sponsors */}
          <div className="flex items-center justify-between pt-3">
            <div className="space-y-0.5">
              <span className="block text-sm font-bold text-white flex items-center gap-1.5">
                <Megaphone className="w-4 h-4 text-amber-400" />
                نمایش بنر حامیان مالی
              </span>
              <p className="text-[11px] text-neutral-400">
                فضای تبلیغات استاندارد برای پشتیبانی از نگهداری رایگان کلمباز.
              </p>
            </div>

            <button
              role="switch"
              aria-checked={settings.showAds}
              onClick={() =>
                onUpdateSettings({ showAds: !settings.showAds })
              }
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 focus:outline-hidden cursor-pointer ${
                settings.showAds ? 'bg-amber-600' : 'bg-neutral-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  settings.showAds ? '-translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 pt-3 border-t border-white/10 text-center text-[11px] text-neutral-500">
          کلمباز (Kalabaz) - نگارش ۲.۰ • بازی روزانه کلمات کلمی
        </div>
      </div>
    </div>
  );
};
