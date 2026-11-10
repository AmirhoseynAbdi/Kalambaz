import React from 'react';
import { X, Mail, Instagram, Copy, ExternalLink, Sparkles } from 'lucide-react';

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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
    >
      <div
        dir="ltr"
        className={`relative w-full max-w-md rounded-2xl border-2 p-5 sm:p-6 shadow-2xl overflow-y-auto max-h-[90vh] ${
          darkMode
            ? 'bg-gradient-to-br from-[#23173b] via-[#1d2236] to-[#152b26] border-[#543c7d]/75 text-[#f2edfa]'
            : 'bg-gradient-to-br from-[#e6f3ec] via-[#eef6f1] to-[#ece4f6] border-[#82b59d] text-[#17382b]'
        }`}
      >
        <div dir="rtl">
          {/* Header */}
          <div
            className={`flex items-center justify-between pb-3 border-b mb-4 ${
              darkMode ? 'border-[#4c3773]/60' : 'border-[#86b8a1]/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">🥬</span>
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
                  : 'text-[#215c46] hover:text-[#123628] hover:bg-[#cfe5da]/60'
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
                : 'bg-[#ebe3f6] border-[#82b59d] text-[#17382b]'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5 font-extrabold text-sm mb-1">
              <Sparkles
                className={`w-4 h-4 ${
                  darkMode ? 'text-[#86efac]' : 'text-[#5c328c]'
                }`}
              />
              <span>تبلیغات خود را به ما بسپارید</span>
            </div>
            <p
              className={`text-xs font-medium leading-relaxed ${
                darkMode ? 'text-[#d8c7f0]' : 'text-[#215c46]'
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
                  : 'bg-[#dfeee6] border-[#7ab399]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-extrabold text-xs sm:text-sm">
                  <Mail
                    className={`w-4 h-4 ${
                      darkMode ? 'text-[#86efac]' : 'text-[#1e6349]'
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
                      : 'bg-white/80 border-[#82b59d] text-[#17382b] hover:bg-white'
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
                    darkMode ? 'text-[#6ee7b7] hover:text-white' : 'text-[#184a37] hover:text-[#5c328c]'
                  }`}
                >
                  {email}
                </a>
                <a
                  href={`mailto:${email}`}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold text-white flex items-center gap-1 shrink-0 ${
                    darkMode
                      ? 'bg-gradient-to-r from-[#237a5b] to-[#3f2b69]'
                      : 'bg-gradient-to-r from-[#5c328c] to-[#266b52]'
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
                  : 'bg-[#ede4f7] border-[#9b7ec7]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-extrabold text-xs sm:text-sm">
                  <Instagram
                    className={`w-4 h-4 ${
                      darkMode ? 'text-[#d8b4fe]' : 'text-[#5c328c]'
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
                      : 'bg-white/80 border-[#9b7ec7] text-[#351857] hover:bg-white'
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
                    darkMode ? 'text-[#e9d5ff] hover:text-white' : 'text-[#4c2478] hover:text-[#184a37]'
                  }`}
                >
                  {instagramId}
                </a>
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold text-white flex items-center gap-1 shrink-0 ${
                    darkMode
                      ? 'bg-gradient-to-r from-[#3f2b69] to-[#237a5b]'
                      : 'bg-gradient-to-r from-[#5c328c] to-[#266b52]'
                  }`}
                >
                  <span>مشاهده صفحه</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Footer button */}
          <div
            className={`pt-4 mt-4 border-t ${
              darkMode ? 'border-[#4c3773]/60' : 'border-[#86b8a1]/60'
            }`}
          >
            <button
              onClick={onClose}
              className={`w-full py-2.5 rounded-xl font-extrabold text-white text-xs sm:text-sm transition-all shadow-md ${
                darkMode
                  ? 'bg-gradient-to-r from-[#237a5b] to-[#3f2b69] hover:from-[#298f6b] hover:to-[#4c357d]'
                  : 'bg-gradient-to-r from-[#5c328c] to-[#266b52] hover:from-[#6b3ba1] hover:to-[#2d7d60]'
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
