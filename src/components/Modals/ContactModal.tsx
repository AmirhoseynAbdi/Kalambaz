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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 animate-fade-in"
    >
      <div
        dir="ltr"
        className={`relative w-full max-w-md rounded-2xl border-2 p-5 sm:p-6 shadow-2xl overflow-y-auto max-h-[90vh] ${
          darkMode
            ? 'bg-[#201733] border-[#433266] text-[#f5f3ff]'
            : 'bg-white border-[#86efac] text-[#14532d]'
        }`}
      >
        <div dir="rtl">
          {/* Header */}
          <div
            className={`flex items-center justify-between pb-3 border-b mb-4 ${
              darkMode ? 'border-[#4c3773]/60' : 'border-[#bbf7d0]'
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
              className={`p-1 rounded-lg transition-colors ${
                darkMode
                  ? 'text-[#d8b4fe] hover:text-white hover:bg-[#31214f]/60'
                  : 'text-[#166534] hover:text-[#14532d] hover:bg-[#dcfce7]'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Ad Banner Callout */}
          <div
            className={`p-3.5 rounded-xl border-2 mb-4 text-center ${
              darkMode
                ? 'bg-[#26193d]/80 border-[#48967c]/60 text-[#f2edfa]'
                : 'bg-[#f0fdf4] border-[#86efac] text-[#14532d]'
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
              className={`p-3.5 rounded-xl border-2 transition-all ${
                darkMode
                  ? 'bg-[#17332c]/80 border-[#387d68]/70'
                  : 'bg-[#dcfce7] border-[#86efac]'
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
                  className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg border transition-colors ${
                    darkMode
                      ? 'bg-[#23173b]/80 border-[#543c7d] text-[#d8b4fe] hover:text-white'
                      : 'bg-white border-[#86efac] text-[#14532d] hover:bg-[#f0fdf4]'
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
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold text-white flex items-center gap-1 shrink-0 transition-colors ${
                    darkMode
                      ? 'bg-[#15803d] hover:bg-[#16a34a]'
                      : 'bg-[#6b21a8] hover:bg-[#7e22ce]'
                  }`}
                >
                  <span>ارسال ایمیل</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Instagram Card */}
            <div
              className={`p-3.5 rounded-xl border-2 transition-all ${
                darkMode
                  ? 'bg-[#281b40]/85 border-[#563d82]/75'
                  : 'bg-[#f0fdf4] border-[#86efac]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-extrabold text-xs sm:text-sm">
                  <Instagram
                    className={`w-4 h-4 ${
                      darkMode ? 'text-[#d8b4fe]' : 'text-[#16a34a]'
                    }`}
                  />
                  <span>اینستاگرام:</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(instagramId, 'آیدی اینستاگرام')}
                  className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg border transition-colors ${
                    darkMode
                      ? 'bg-[#17332c]/80 border-[#387d68] text-[#a7f3d0] hover:text-white'
                      : 'bg-white border-[#86efac] text-[#14532d] hover:bg-[#dcfce7]'
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
                    darkMode ? 'text-[#e9d5ff] hover:text-white' : 'text-[#15803d] hover:text-[#14532d]'
                  }`}
                >
                  {instagramId}
                </a>
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold flex items-center gap-1 shrink-0 transition-colors ${
                    darkMode
                      ? 'bg-[#6b21a8] hover:bg-[#7e22ce] text-white'
                      : 'bg-[#15803d] hover:bg-[#16a34a] text-white'
                  }`}
                >
                  <span>مشاهده صفحه</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Telegram Card */}
            <div
              className={`p-3.5 rounded-xl border-2 transition-all ${
                darkMode
                  ? 'bg-[#122645]/85 border-[#38bdf8]/65'
                  : 'bg-[#e0f2fe] border-[#38bdf8]'
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
                  className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg border transition-colors ${
                    darkMode
                      ? 'bg-[#0c1b33]/85 border-[#38bdf8]/50 text-[#bae6fd] hover:text-white'
                      : 'bg-white border-[#7dd3fc] text-[#0c4a6e] hover:bg-[#f0f9ff]'
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
                  className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-[#0284c7] hover:bg-[#0369a1] text-white flex items-center gap-1 shrink-0 transition-colors"
                >
                  <span>عضویت در کانال</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* X (Twitter) Card */}
            <div
              className={`p-3.5 rounded-xl border-2 transition-all ${
                darkMode
                  ? 'bg-[#181826]/90 border-[#64748b]/70'
                  : 'bg-[#f1f5f9] border-[#94a3b8]'
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
                  className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg border transition-colors ${
                    darkMode
                      ? 'bg-[#0f172a]/85 border-[#475569] text-[#e2e8f0] hover:text-white'
                      : 'bg-white border-[#94a3b8] text-[#0f172a] hover:bg-[#e2e8f0]'
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
                  className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-[#0f172a] hover:bg-[#1e293b] text-white flex items-center gap-1 shrink-0 transition-colors"
                >
                  <span>دنبال کردن</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Footer button */}
          <div
            className={`pt-4 mt-4 border-t ${
              darkMode ? 'border-[#4c3773]/60' : 'border-[#bbf7d0]'
            }`}
          >
            <button
              onClick={onClose}
              className={`w-full py-2.5 rounded-xl font-extrabold text-white text-xs sm:text-sm transition-colors ${
                darkMode
                  ? 'bg-[#15803d] hover:bg-[#16a34a]'
                  : 'bg-[#6b21a8] hover:bg-[#7e22ce]'
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
