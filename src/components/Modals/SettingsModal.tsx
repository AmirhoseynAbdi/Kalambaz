import React from 'react';
import {
  X,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Eye,
  Bell,
  BellOff,
  Smartphone,
  Download,
} from 'lucide-react';
import { AppSettings } from '../../types';
import {
  NotificationPermissionState,
  getNotificationStatusLabel,
} from '../../utils/notifications';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  canChangeHardMode: boolean; // Cannot change hard mode mid-game if already guessed
  notificationPermission?: NotificationPermissionState;
  notificationsEnabled?: boolean;
  onToggleNotifications?: () => void;
  isInstallable?: boolean;
  isInstalled?: boolean;
  onInstallApp?: () => void;
  onOpenInstallGuide?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  canChangeHardMode,
  notificationPermission = 'default',
  notificationsEnabled = false,
  onToggleNotifications,
  isInstallable = false,
  isInstalled = false,
  onInstallApp,
  onOpenInstallGuide,
}) => {
  if (!isOpen) return null;
  const darkMode = settings.darkMode;
  const isNotifActive = notificationPermission === 'granted' && notificationsEnabled;

  const offTrackClass = darkMode ? 'bg-[#140e21]' : 'bg-[#cfead8]';
  const onTrackClass = darkMode ? 'bg-[#16a34a]' : 'bg-[#7e22ce]';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="تنظیمات کلمباز"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-[2px] animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md rounded-2xl p-5 sm:p-6 shadow-2xl transition-colors overflow-y-auto max-h-[92vh] ${
          darkMode
            ? 'bg-[#211836] text-[#f5f3ff] shadow-black/50'
            : 'bg-white text-[#14532d] shadow-emerald-950/15'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between pb-3 border-b mb-4 ${
            darkMode ? 'border-white/8' : 'border-emerald-950/8'
          }`}
        >
          <h2 className="text-lg font-bold font-['Lalezar',sans-serif]">
            تنظیمات بازی کلمباز 🥦
          </h2>
          <button
            onClick={onClose}
            aria-label="بستن تنظیمات"
            className={`p-1.5 rounded-xl transition-colors ${
              darkMode
                ? 'bg-[#2e224b] text-[#d8b4fe] hover:text-white hover:bg-[#3c2d62]'
                : 'bg-[#eefaf2] text-[#166534] hover:text-[#14532d] hover:bg-[#dcfce7]'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options List */}
        <div className="space-y-2.5">
          {/* Hard Mode */}
          <div
            className={`flex items-center justify-between p-3 rounded-xl ${
              darkMode ? 'bg-[#171126]' : 'bg-[#eefaf2]'
            }`}
          >
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
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 focus:outline-hidden shrink-0 ${
                settings.hardMode ? onTrackClass : offTrackClass
              } ${!canChangeHardMode ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
                  settings.hardMode ? '-translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Dark Mode */}
          <div
            className={`flex items-center justify-between p-3 rounded-xl ${
              darkMode ? 'bg-[#171126]' : 'bg-[#eefaf2]'
            }`}
          >
            <div className="space-y-0.5 max-w-[78%]">
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
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 focus:outline-hidden cursor-pointer shrink-0 ${
                settings.darkMode ? 'bg-[#16a34a]' : offTrackClass
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
                  settings.darkMode ? '-translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Sound Effects */}
          <div
            className={`flex items-center justify-between p-3 rounded-xl ${
              darkMode ? 'bg-[#171126]' : 'bg-[#eefaf2]'
            }`}
          >
            <div className="space-y-0.5 max-w-[78%]">
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
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 focus:outline-hidden cursor-pointer shrink-0 ${
                settings.soundEnabled ? onTrackClass : offTrackClass
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
                  settings.soundEnabled ? '-translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* High Contrast Mode */}
          <div
            className={`flex items-center justify-between p-3 rounded-xl ${
              darkMode ? 'bg-[#171126]' : 'bg-[#eefaf2]'
            }`}
          >
            <div className="space-y-0.5 max-w-[78%]">
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
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 focus:outline-hidden cursor-pointer shrink-0 ${
                settings.highContrast ? onTrackClass : offTrackClass
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
                  settings.highContrast ? '-translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Daily Notifications Toggle */}
          {onToggleNotifications && (
            <div
              className={`flex items-center justify-between p-3 rounded-xl ${
                darkMode ? 'bg-[#171126]' : 'bg-[#eefaf2]'
              }`}
            >
              <div className="space-y-0.5 max-w-[78%]">
                <span className="block text-sm font-extrabold flex items-center gap-1.5">
                  {isNotifActive ? (
                    <Bell
                      className={`w-4 h-4 ${
                        darkMode ? 'text-[#86efac]' : 'text-[#6b21a8]'
                      }`}
                    />
                  ) : (
                    <BellOff className="w-4 h-4 opacity-70" />
                  )}
                  اعلان روزانه کلمه جدید
                </span>
                <p
                  className={`text-[11px] font-medium ${
                    darkMode ? 'text-[#d8c7f0]' : 'text-[#166534]'
                  }`}
                >
                  {getNotificationStatusLabel(notificationPermission, notificationsEnabled)}
                </p>
              </div>

              <button
                role="switch"
                aria-label="اعلان روزانه کلمه جدید"
                aria-checked={isNotifActive}
                onClick={onToggleNotifications}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 focus:outline-hidden cursor-pointer shrink-0 ${
                  isNotifActive ? onTrackClass : offTrackClass
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
                    isNotifActive ? '-translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          )}

          {/* Install App / Home Screen Shortcut */}
          {!isInstalled && (onInstallApp || onOpenInstallGuide) && (
            <div
              className={`flex items-center justify-between gap-2 p-3 rounded-xl ${
                darkMode ? 'bg-[#171126]' : 'bg-[#eefaf2]'
              }`}
            >
              <div className="space-y-0.5">
                <span className="block text-sm font-extrabold flex items-center gap-1.5">
                  <Smartphone
                    className={`w-4 h-4 ${
                      darkMode ? 'text-[#86efac]' : 'text-[#6b21a8]'
                    }`}
                  />
                  نصب روی صفحه گوشی
                </span>
                <p
                  className={`text-[11px] font-medium ${
                    darkMode ? 'text-[#d8c7f0]' : 'text-[#166534]'
                  }`}
                >
                  ساخت میانبر کلمباز در صفحه اصلی موبایل با کروم.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (isInstallable && onInstallApp) {
                    onInstallApp();
                  } else if (onOpenInstallGuide) {
                    onClose();
                    onOpenInstallGuide();
                  }
                }}
                className={`px-3.5 py-2 rounded-xl font-extrabold text-xs text-white flex items-center gap-1.5 transition-colors shrink-0 ${
                  darkMode
                    ? 'bg-[#16a34a] hover:bg-[#15803d]'
                    : 'bg-[#7e22ce] hover:bg-[#6b21a8]'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isInstallable ? 'نصب' : 'راهنما'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div
          className={`mt-5 pt-3 border-t text-center text-[11px] font-bold ${
            darkMode
              ? 'border-white/8 text-[#c4b5fd]'
              : 'border-emerald-950/8 text-[#166534]'
          }`}
        >
          کلمباز (Kalabaz) - نگارش ۲.۰ • بازی روزانه کلمات کلمی
        </div>
      </div>
    </div>
  );
};
