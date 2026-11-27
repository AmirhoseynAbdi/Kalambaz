import React from 'react';
import { X, Mail, Instagram, Copy, ExternalLink, Sparkles } from 'lucide-react';
import { KALAMBAZ_SOCIALS, TelegramIcon, XSocialIcon } from '../SocialIcons';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode?: boolean;
  onNotify?: (msg: string) => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  onClose,
  darkMode = true,
  onNotify,
}) => {
  if (!isOpen) return null;

  const email = 'justhawkstuff@gmail.com';
  const instagramId = '@aha_hawk';
  const instagramUrl = 'https://instagram.com/aha_hawk';

  const handleCopy = (text: string, label: string) => {
    try {
      navigator.clipboard?.writeText(text);
      if (onNotify) {
        onNotify(`${label} کپی شد: ${text}`);
      }
    } catch {
      if (onNotify) {
        onNotify(`${label}: ${text}`);
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="تماس با ما و سفارش تبلیغات"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-[2px] animate-fade-in"
    >
      <div
        dir="ltr"
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md rounded-2xl p-5 sm:p-6 shadow-2xl overflow-y-auto max-h-[90vh] ${
          darkMode
            ? 'bg-[#211836] text-[#f5f3ff] shadow-black/50'
            : 'bg-white text-[#14532d] shadow-emerald-950/15'
        }`}
      >
        <div dir="rtl">
          {/* Header */}
          <div
            className={`flex items-center justify-between pb-3 border-b mb-4 ${
              darkMode ? 'border-white/8' : 'border-emerald-950/8'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">🥦</span>
              <h2 className="text-lg sm:text-xl font-bold font-['Lalezar',sans-serif]">
                تماس با ما و سفارش تبلیغات
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="بستن پنجره تماس با ما"
              className={`p-1.5 rounded-xl transition-colors ${
                darkMode
                  ? 'bg-[#2e224b] text-[#d8b4fe] hover:text-white hover:bg-[#3c2d62]'
                  : 'bg-[#eefaf2] text-[#166534] hover:text-[#14532d] hover:bg-[#dcfce7]'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Ad Banner Callout */}
          <div
            className={`p-3.5 rounded-2xl mb-4 text-center ${
              darkMode
                ? 'bg-[#2a1f45] text-[#f2edfa]'
                : 'bg-[#eefaf2] text-[#14532d]'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5 font-extrabold text-sm mb-1">
              <Sparkles
                className={`w-4 h-4 ${
                  darkMode ? 'text-[#86efac]' : 'text-[#15803d]'
                }`}
              />
              <span>تبلیغات خود را به ما بسپارید</span>
            </div>
            <p
              className={`text-xs font-medium leading-relaxed ${
                darkMode ? 'text-[#d8c7f0]' : 'text-[#166534]'
              }`}
            >
              برای سفارش تبلیغات، همکاری تجاری، یا ارسال پیشنهادها و نظرات خود از طریق راه‌های زیر با ما در ارتباط باشید:
            </p>
          </div>

          {/* Contact Channels */}
          <div className="space-y-3">
            {/* Email Card */}
            <div
              className={`p-3.5 rounded-2xl transition-colors ${
                darkMode ? 'bg-[#16382b]' : 'bg-[#dcfce7]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-extrabold text-xs sm:text-sm">
                  <Mail
                    className={`w-4 h-4 ${
                      darkMode ? 'text-[#86efac]' : 'text-[#15803d]'
                    }`}
                  />
                  <span>ایمیل ارتباطی و تبلیغات:</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(email, 'ایمیل')}
                  className={`flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-lg transition-colors active:scale-95 ${
                    darkMode
                      ? 'bg-[#265240] text-[#d1fae5] hover:bg-[#2f6650]'
                      : 'bg-white text-[#14532d] hover:bg-[#eefaf2]'
                  }`}
                >
                  <Copy className="w-3 h-3" />
                  <span>کپی ایمیل</span>
                </button>
              </div>
              <div
                dir="ltr"
                className="flex items-center justify-between gap-2 pt-1"
              >
                <a
                  href={`mailto:${email}`}
                  className={`font-mono text-xs sm:text-sm font-extrabold truncate underline underline-offset-2 ${
                    darkMode ? 'text-[#6ee7b7] hover:text-white' : 'text-[#14532d] hover:text-[#15803d]'
                  }`}
                >
                  {email}
                </a>
                <a
                  href={`mailto:${email}`}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold text-white flex items-center gap-1 shrink-0 transition-colors ${
                    darkMode
                      ? 'bg-[#16a34a] hover:bg-[#15803d]'
                      : 'bg-[#7e22ce] hover:bg-[#6b21a8]'
                  }`}
                >
                  <span>ارسال ایمیل</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Instagram Card */}
            <div
              className={`p-3.5 rounded-2xl transition-colors ${
                darkMode ? 'bg-[#2a1d47]' : 'bg-[#f3e8ff]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-extrabold text-xs sm:text-sm">
                  <Instagram
                    className={`w-4 h-4 ${
                      darkMode ? 'text-[#d8b4fe]' : 'text-[#7e22ce]'
                    }`}
                  />
                  <span>اینستاگرام:</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(instagramId, 'آیدی اینستاگرام')}
                  className={`flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-lg transition-colors active:scale-95 ${
                    darkMode
                      ? 'bg-[#3d2b66] text-[#e9d5ff] hover:bg-[#4c3680]'
                      : 'bg-white text-[#581c87] hover:bg-[#faf5ff]'
                  }`}
                >
                  <Copy className="w-3 h-3" />
                  <span>کپی آیدی</span>
                </button>
              </div>
              <div
                dir="ltr"
                className="flex items-center justify-between gap-2 pt-1"
              >
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`font-mono text-xs sm:text-sm font-extrabold underline underline-offset-2 ${
                    darkMode ? 'text-[#e9d5ff] hover:text-white' : 'text-[#581c87] hover:text-[#3b0764]'
                  }`}
                >
                  {instagramId}
                </a>
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1 shrink-0 transition-colors ${
                    darkMode
                      ? 'bg-[#7e22ce] hover:bg-[#9333ea] text-white'
                      : 'bg-[#15803d] hover:bg-[#166534] text-white'
                  }`}
                >
                  <span>مشاهده صفحه</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Telegram Card */}
            <div
              className={`p-3.5 rounded-2xl transition-colors ${
                darkMode ? 'bg-[#13294a]' : 'bg-[#e0f2fe]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-extrabold text-xs sm:text-sm">
                  <TelegramIcon
                    className={`w-4 h-4 ${
                      darkMode ? 'text-[#7dd3fc]' : 'text-[#0284c7]'
                    }`}
                  />
                  <span>کانال تلگرام کلمباز:</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(KALAMBAZ_SOCIALS.telegram.handle, 'آیدی تلگرام')}
                  className={`flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-lg transition-colors active:scale-95 ${
                    darkMode
                      ? 'bg-[#1d3c6b] text-[#bae6fd] hover:bg-[#254b85]'
                      : 'bg-white text-[#0c4a6e] hover:bg-[#f0f9ff]'
                  }`}
                >
                  <Copy className="w-3 h-3" />
                  <span>کپی آیدی</span>
                </button>
              </div>
              <div
                dir="ltr"
                className="flex items-center justify-between gap-2 pt-1"
              >
                <a
                  href={KALAMBAZ_SOCIALS.telegram.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`font-mono text-xs sm:text-sm font-extrabold underline underline-offset-2 ${
                    darkMode ? 'text-[#7dd3fc] hover:text-white' : 'text-[#0369a1] hover:text-[#0c4a6e]'
                  }`}
                >
                  {KALAMBAZ_SOCIALS.telegram.handle}
                </a>
                <a
                  href={KALAMBAZ_SOCIALS.telegram.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl text-[11px] font-extrabold bg-[#0284c7] hover:bg-[#0369a1] text-white flex items-center gap-1 shrink-0 transition-colors"
                >
                  <span>عضویت در کانال</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* X (Twitter) Card */}
            <div
              className={`p-3.5 rounded-2xl transition-colors ${
                darkMode ? 'bg-[#1c2033]' : 'bg-[#e2e8f0]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-extrabold text-xs sm:text-sm">
                  <XSocialIcon
                    className={`w-4 h-4 ${
                      darkMode ? 'text-white' : 'text-[#0f172a]'
                    }`}
                  />
                  <span>صفحه ایکس (X) کلمباز:</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(KALAMBAZ_SOCIALS.x.handle, 'آیدی ایکس')}
                  className={`flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-lg transition-colors active:scale-95 ${
                    darkMode
                      ? 'bg-[#2c3350] text-[#e2e8f0] hover:bg-[#384063]'
                      : 'bg-white text-[#0f172a] hover:bg-[#f8fafc]'
                  }`}
                >
                  <Copy className="w-3 h-3" />
                  <span>کپی آیدی</span>
                </button>
              </div>
              <div
                dir="ltr"
                className="flex items-center justify-between gap-2 pt-1"
              >
                <a
                  href={KALAMBAZ_SOCIALS.x.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`font-mono text-xs sm:text-sm font-extrabold underline underline-offset-2 ${
                    darkMode ? 'text-[#e2e8f0] hover:text-white' : 'text-[#0f172a] hover:text-[#334155]'
                  }`}
                >
                  {KALAMBAZ_SOCIALS.x.handle}
                </a>
                <a
                  href={KALAMBAZ_SOCIALS.x.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl text-[11px] font-extrabold bg-[#0f172a] hover:bg-[#1e293b] text-white flex items-center gap-1 shrink-0 transition-colors"
                >
                  <span>دنبال کردن</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Footer button */}
          <div className="pt-4 mt-4">
            <button
              onClick={onClose}
              className={`w-full py-2.5 rounded-xl font-extrabold text-white text-xs sm:text-sm transition-colors shadow-sm ${
                darkMode
                  ? 'bg-[#16a34a] hover:bg-[#15803d]'
                  : 'bg-[#7e22ce] hover:bg-[#6b21a8]'
              }`}
            >
              بستن
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
