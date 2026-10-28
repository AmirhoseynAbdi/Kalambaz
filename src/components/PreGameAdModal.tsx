import React, { useState, useEffect } from 'react';
import { Play, Sparkles, X, ShieldCheck } from 'lucide-react';
import { PRE_GAME_AD } from '../config/advertisements';

interface PreGameAdModalProps {
  isOpen: boolean;
  onProceed: () => void;
  username?: string;
  darkMode?: boolean;
}

export const PreGameAdModal: React.FC<PreGameAdModalProps> = ({
  isOpen,
  onProceed,
  username,
  darkMode = true,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(PRE_GAME_AD.countdownSeconds || 3);

  useEffect(() => {
    if (!isOpen) return;
    setSecondsLeft(PRE_GAME_AD.countdownSeconds || 3);
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="تبلیغات پیش از بازی کلمباز"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
    >
      <div
        className={`relative w-full max-w-md rounded-2xl border-2 p-6 shadow-2xl ${
          darkMode
            ? 'bg-gradient-to-br from-[#23173b] via-[#1d2236] to-[#152b26] border-[#543c7d]/75 text-[#f2edfa]'
            : 'bg-gradient-to-br from-[#e6f3ec] via-[#eef6f1] to-[#ece4f6] border-[#82b59d] text-[#17382b]'
        }`}
      >
        {/* Top bar with sponsor badge */}
        <div
          className={`flex items-center justify-between pb-3 border-b ${
            darkMode ? 'border-[#4c3773]/60' : 'border-[#86b8a1]/60'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">🥬</span>
            <span
              className={`text-xs font-extrabold tracking-wide uppercase ${
                darkMode ? 'text-[#86efac]' : 'text-[#5c328c]'
              }`}
            >
              پیام حامی مالی کلمباز
            </span>
          </div>
          <span
            className={`text-xs font-bold ${
              darkMode ? 'text-[#d8b4fe]' : 'text-[#215c46]'
            }`}
          >
            {secondsLeft > 0 ? `امکان عبور پس از ${secondsLeft} ثانیه` : 'آماده ورود'}
          </span>
        </div>

        {/* Ad Body */}
        <div className="my-5 space-y-4">
          <div
            className={`rounded-xl overflow-hidden border-2 p-4 text-center ${
              darkMode
                ? 'bg-[#26193d]/80 border-[#48967c]/50'
                : 'bg-[#f4f0fa] border-[#82b59d]/75'
            }`}
          >
            <div
              className={`w-16 h-16 mx-auto mb-3 rounded-2xl border-2 flex items-center justify-center text-3xl shadow-inner ${
                darkMode
                  ? 'bg-[#173830]/80 border-[#6ee7b7]/50'
                  : 'bg-[#e3f2ea] border-[#9b7ec7]'
              }`}
            >
              {PRE_GAME_AD.icon || '🥗'}
            </div>
            <h3
              className={`text-lg font-extrabold mb-1 ${
                darkMode ? 'text-white' : 'text-[#17382b]'
              }`}
            >
              {PRE_GAME_AD.title}
            </h3>
            <p
              className={`text-xs font-semibold leading-relaxed max-w-xs mx-auto ${
                darkMode ? 'text-[#d8c7f0]' : 'text-[#215c46]'
              }`}
            >
              {PRE_GAME_AD.tagline}
            </p>

            {PRE_GAME_AD.discountCode && (
              <div
                className={`mt-3 flex items-center justify-center gap-2 text-[11px] font-bold py-1.5 px-3 rounded-lg border ${
                  darkMode
                    ? 'text-[#d1fae5] bg-[#173830]/80 border-[#428f76]'
                    : 'text-[#391a5e] bg-[#ebe2f7] border-[#9b7ec7]'
                }`}
              >
                <Sparkles
                  className={`w-3.5 h-3.5 ${
                    darkMode ? 'text-[#86efac]' : 'text-[#5c328c]'
                  }`}
                />
                <span>
                  کد تخفیف اختصاصی بازیکنان:{' '}
                  <strong className="font-mono font-extrabold">
                    {PRE_GAME_AD.discountCode}
                  </strong>
                </span>
              </div>
            )}
          </div>

          <div
            className={`flex items-center gap-3 p-3 rounded-xl border ${
              darkMode
                ? 'bg-[#18332c]/65 border-[#488f78]/55'
                : 'bg-[#dfeee6]/85 border-[#82b59d]/65'
            }`}
          >
            <div className="text-2xl">🥬</div>
            <div className="text-right flex-1 min-w-0">
              <p
                className={`text-xs font-semibold ${
                  darkMode ? 'text-[#f2edfa]' : 'text-[#17382b]'
                }`}
              >
                خوش آمدید،{' '}
                <span
                  className={`font-extrabold ${
                    darkMode ? 'text-[#86efac]' : 'text-[#5c328c]'
                  }`}
                >
                  {username || 'کلم‌باز عزیز'}
                </span>
              </p>
              <p
                className={`text-[11px] font-medium ${
                  darkMode ? 'text-[#d8b4fe]' : 'text-[#215c46]'
                }`}
              >
                جدول معمای روزانه برای شما بارگذاری شد.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={onProceed}
            className={`w-full py-3 px-4 rounded-xl font-extrabold flex items-center justify-center gap-2 transition-all shadow-lg text-sm sm:text-base border-2 ${
              secondsLeft > 0
                ? darkMode
                  ? 'bg-[#281b40] text-[#d8b4fe] border-[#563d82] cursor-pointer hover:bg-[#32224f]'
                  : 'bg-[#dfeee6] text-[#17382b] border-[#82b59d] cursor-pointer hover:bg-[#d2e7dc]'
                : darkMode
                ? 'bg-gradient-to-r from-[#237a5b] to-[#3f2b69] hover:from-[#298f6b] hover:to-[#4c357d] text-white border-[#6ee7b7]/70'
                : 'bg-gradient-to-r from-[#5c328c] to-[#266b52] hover:from-[#6b3ba1] hover:to-[#2d7d60] text-white border-[#482373]'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>
              {secondsLeft > 0
                ? `شروع بازی (${secondsLeft})`
                : PRE_GAME_AD.ctaText || 'شروع بازی کلمباز 🥬'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
