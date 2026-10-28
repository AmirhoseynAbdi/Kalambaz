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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
    >
      <div
        className={`relative w-full max-w-md rounded-2xl border-2 p-5 sm:p-6 shadow-2xl transition-colors ${
          darkMode
            ? 'bg-gradient-to-br from-[#23173b] via-[#1d2236] to-[#152b26] border-[#543c7d]/75 text-[#f2edfa]'
            : 'bg-gradient-to-br from-[#e6f3ec] via-[#eef6f1] to-[#ece4f6] border-[#82b59d] text-[#17382b]'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between pb-3 border-b mb-4 ${
            darkMode ? 'border-[#4c3773]/60' : 'border-[#86b8a1]/60'
          }`}
        >
          <h2 className="text-lg font-bold font-['Lalezar',sans-serif]">
            تنظیمات بازی کلمباز 🥬
          </h2>
          <button
            onClick={onClose}
            aria-label="بستن تنظیمات"
            className={`p-1 rounded-lg transition-colors ${
              darkMode
                ? 'text-[#d8b4fe] hover:text-white hover:bg-[#31214f]/60'
                : 'text-[#215c46] hover:text-[#123628] hover:bg-[#cfe5da]/60'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options List */}
        <div
          className={`space-y-4 divide-y ${
            darkMode ? 'divide-[#463269]/60' : 'divide-[#88b8a2]/60'
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
                  darkMode ? 'text-[#d8c7f0]' : 'text-[#215c46]'
                }`}
              >
                هر نشانه‌ای که کشف شود (سبز یا زرد) باید حتماً در حدس‌های بعدی به کار گرفته شود.
              </p>
              {!canChangeHardMode && (
                <p
                  className={`text-[10px] font-bold mt-1 ${
                    darkMode ? 'text-[#86efac]' : 'text-[#5c328c]'
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
                    ? 'bg-gradient-to-r from-[#237a5b] to-[#3f2b69]'
                    : 'bg-gradient-to-r from-[#5c328c] to-[#266b52]'
                  : darkMode
                  ? 'bg-[#1c132e] border border-[#543c7d]'
                  : 'bg-[#d5e8df] border border-[#7eb39a]'
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
                  <Sun className="w-4 h-4 text-[#5c328c]" />
                )}
                حالت شب (طیف‌های سبز و بنفش ملایم)
              </span>
              <p
                className={`text-[11px] font-medium ${
                  darkMode ? 'text-[#d8c7f0]' : 'text-[#215c46]'
                }`}
              >
                ترکیب چشم‌نواز سایه‌های متنوع بنفش و سبز در هر دو حالت تاریک و روشن.
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
                  ? 'bg-gradient-to-r from-[#237a5b] to-[#3f2b69]'
                  : 'bg-gradient-to-r from-[#5c328c] to-[#266b52]'
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
                      darkMode ? 'text-[#d8b4fe]' : 'text-[#21664d]'
                    }`}
                  />
                ) : (
                  <VolumeX className="w-4 h-4 opacity-60" />
                )}
                جلوه‌های صوتی
              </span>
              <p
                className={`text-[11px] font-medium ${
                  darkMode ? 'text-[#d8c7f0]' : 'text-[#215c46]'
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
                    ? 'bg-gradient-to-r from-[#237a5b] to-[#3f2b69]'
                    : 'bg-gradient-to-r from-[#5c328c] to-[#266b52]'
                  : darkMode
                  ? 'bg-[#1c132e] border border-[#543c7d]'
                  : 'bg-[#d5e8df] border border-[#7eb39a]'
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
                    darkMode ? 'text-[#86efac]' : 'text-[#5c328c]'
                  }`}
                />
                کنتراست بالا
              </span>
              <p
                className={`text-[11px] font-medium ${
                  darkMode ? 'text-[#d8c7f0]' : 'text-[#215c46]'
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
                    ? 'bg-gradient-to-r from-[#237a5b] to-[#3f2b69]'
                    : 'bg-gradient-to-r from-[#5c328c] to-[#266b52]'
                  : darkMode
                  ? 'bg-[#1c132e] border border-[#543c7d]'
                  : 'bg-[#d5e8df] border border-[#7eb39a]'
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
                    darkMode ? 'text-[#d8b4fe]' : 'text-[#21664d]'
                  }`}
                />
                نمایش بنر حامیان مالی
              </span>
              <p
                className={`text-[11px] font-medium ${
                  darkMode ? 'text-[#d8c7f0]' : 'text-[#215c46]'
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
                    ? 'bg-gradient-to-r from-[#237a5b] to-[#3f2b69]'
                    : 'bg-gradient-to-r from-[#5c328c] to-[#266b52]'
                  : darkMode
                  ? 'bg-[#1c132e] border border-[#543c7d]'
                  : 'bg-[#d5e8df] border border-[#7eb39a]'
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
              : 'border-[#86b8a1]/60 text-[#215c46]'
          }`}
        >
          کلمباز (Kalabaz) - نگارش ۲.۰ • بازی روزانه کلمات کلمی
        </div>
      </div>
    </div>
  );
};
