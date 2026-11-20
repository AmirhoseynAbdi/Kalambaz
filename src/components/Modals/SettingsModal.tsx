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
  const darkMode = settings.darkMode;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="تنظیمات کلمباز"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 animate-fade-in"
    >
      <div
        className={`relative w-full max-w-md rounded-2xl border-2 p-5 sm:p-6 shadow-2xl transition-colors ${
          darkMode
            ? 'bg-[#201733] border-[#433266] text-[#f5f3ff]'
            : 'bg-white border-[#86efac] text-[#14532d]'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between pb-3 border-b mb-4 ${
            darkMode ? 'border-[#4c3773]/60' : 'border-[#bbf7d0]'
          }`}
        >
          <h2 className="text-lg font-bold font-['Lalezar',sans-serif]">
            تنظیمات بازی کلمباز 🥦
          </h2>
          <button
            onClick={onClose}
            aria-label="بستن تنظیمات"
            className={`p-1 rounded-lg transition-colors ${
              darkMode
                ? 'text-[#d8b4fe] hover:text-white hover:bg-[#31214f]/60'
                : 'text-[#166534] hover:text-[#14532d] hover:bg-[#dcfce7]'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options List */}
        <div
          className={`space-y-4 divide-y ${
            darkMode ? 'divide-[#463269]/60' : 'divide-[#bbf7d0]'
          }`}
        >
          {/* Hard Mode */}
          <div className="flex items-center justify-between pt-3 first:pt-0">
            <div className="space-y-0.5 max-w-[78%]">
              <span className="block text-sm font-extrabold">
                حالت سخت (Hard Mode)
              </span>
              <p
                className={`text-[11px] font-medium leading-snug ${
                  darkMode ? 'text-[#d8c7f0]' : 'text-[#166534]'
                }`}
              >
                هر نشانه‌ای که کشف شود (سبز یا زرد) باید حتماً در حدس‌های بعدی به کار گرفته شود.
              </p>
              {!canChangeHardMode && (
                <p
                  className={`text-[10px] font-bold mt-1 ${
                    darkMode ? 'text-[#86efac]' : 'text-[#15803d]'
                  }`}
                >
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
                settings.hardMode
                  ? darkMode
                    ? 'bg-[#15803d]'
                    : 'bg-[#6b21a8]'
                  : darkMode
                  ? 'bg-[#161022] border border-[#433266]'
                  : 'bg-[#dcfce7] border border-[#86efac]'
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
              <span className="block text-sm font-extrabold flex items-center gap-1.5">
                {settings.darkMode ? (
                  <Moon className="w-4 h-4 text-[#86efac]" />
                ) : (
                  <Sun className="w-4 h-4 text-[#6b21a8]" />
                )}
                حالت شب / روز
              </span>
              <p
                className={`text-[11px] font-medium ${
                  darkMode ? 'text-[#d8c7f0]' : 'text-[#166534]'
                }`}
              >
                تم شب (بنفش با دکمه‌های سبز) و تم روز (سبز روشن با دکمه‌های بنفش).
              </p>
            </div>

            <button
              role="switch"
              aria-checked={settings.darkMode}
              onClick={() =>
                onUpdateSettings({ darkMode: !settings.darkMode })
              }
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 focus:outline-hidden cursor-pointer ${
                settings.darkMode
                  ? 'bg-[#15803d]'
                  : 'bg-[#dcfce7] border border-[#86efac]'
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
              <span className="block text-sm font-extrabold flex items-center gap-1.5">
                {settings.soundEnabled ? (
                  <Volume2
                    className={`w-4 h-4 ${
                      darkMode ? 'text-[#d8b4fe]' : 'text-[#15803d]'
                    }`}
                  />
                ) : (
                  <VolumeX className="w-4 h-4 opacity-60" />
                )}
                جلوه‌های صوتی
              </span>
              <p
                className={`text-[11px] font-medium ${
                  darkMode ? 'text-[#d8c7f0]' : 'text-[#166534]'
                }`}
              >
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
                settings.soundEnabled
                  ? darkMode
                    ? 'bg-[#15803d]'
                    : 'bg-[#6b21a8]'
                  : darkMode
                  ? 'bg-[#161022] border border-[#433266]'
                  : 'bg-[#dcfce7] border border-[#86efac]'
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
              <span className="block text-sm font-extrabold flex items-center gap-1.5">
                <Eye
                  className={`w-4 h-4 ${
                    darkMode ? 'text-[#86efac]' : 'text-[#6b21a8]'
                  }`}
                />
                کنتراست بالا
              </span>
              <p
                className={`text-[11px] font-medium ${
                  darkMode ? 'text-[#d8c7f0]' : 'text-[#166534]'
                }`}
              >
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
                settings.highContrast
                  ? darkMode
                    ? 'bg-[#15803d]'
                    : 'bg-[#6b21a8]'
                  : darkMode
                  ? 'bg-[#161022] border border-[#433266]'
                  : 'bg-[#dcfce7] border border-[#86efac]'
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
              <span className="block text-sm font-extrabold flex items-center gap-1.5">
                <Megaphone
                  className={`w-4 h-4 ${
                    darkMode ? 'text-[#d8b4fe]' : 'text-[#15803d]'
                  }`}
                />
                نمایش بنر حامیان مالی
              </span>
              <p
                className={`text-[11px] font-medium ${
                  darkMode ? 'text-[#d8c7f0]' : 'text-[#166534]'
                }`}
              >
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
                settings.showAds
                  ? darkMode
                    ? 'bg-[#15803d]'
                    : 'bg-[#6b21a8]'
                  : darkMode
                  ? 'bg-[#161022] border border-[#433266]'
                  : 'bg-[#dcfce7] border border-[#86efac]'
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
        <div
          className={`mt-6 pt-3 border-t text-center text-[11px] font-bold ${
            darkMode
              ? 'border-[#4c3773]/60 text-[#d8b4fe]'
              : 'border-[#bbf7d0] text-[#166534]'
          }`}
        >
          کلمباز (Kalabaz) - نگارش ۲.۰ • بازی روزانه کلمات کلمی
        </div>
      </div>
    </div>
  );
};
