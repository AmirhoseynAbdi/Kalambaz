import React, { useState, useEffect } from 'react';
import { Play, Sparkles, X, ShieldCheck } from 'lucide-react';
import { PRE_GAME_AD } from '../config/advertisements';

interface PreGameAdModalProps {
  isOpen: boolean;
  onProceed: () => void;
  username?: string;
}

export const PreGameAdModal: React.FC<PreGameAdModalProps> = ({
  isOpen,
  onProceed,
  username,
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-gradient-to-b from-purple-950 via-emerald-950 to-neutral-900 border border-purple-500/40 p-6 text-white shadow-2xl">
        {/* Top bar with sponsor badge */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-xl">🥬</span>
            <span className="text-xs font-bold text-emerald-300 tracking-wide uppercase">
              پیام حامی مالی کلمباز
            </span>
          </div>
          <span className="text-xs text-neutral-400">
            {secondsLeft > 0 ? `امکان عبور پس از ${secondsLeft} ثانیه` : 'آماده ورود'}
          </span>
        </div>

        {/* Ad Body */}
        <div className="my-5 space-y-4">
          <div className="rounded-xl overflow-hidden bg-gradient-to-br from-purple-900/60 to-emerald-900/60 border border-emerald-500/30 p-4 text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-3xl shadow-inner">
              {PRE_GAME_AD.icon || '🥗'}
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              {PRE_GAME_AD.title}
            </h3>
            <p className="text-xs text-emerald-200/90 leading-relaxed max-w-xs mx-auto">
              {PRE_GAME_AD.tagline}
            </p>

            {PRE_GAME_AD.discountCode && (
              <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-purple-200 bg-purple-950/60 py-1.5 px-3 rounded-lg border border-purple-800">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>کد تخفیف اختصاصی بازیکنان: <strong className="text-amber-300 font-mono">{PRE_GAME_AD.discountCode}</strong></span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="text-2xl">🥬</div>
            <div className="text-right flex-1 min-w-0">
              <p className="text-xs text-neutral-300">خوش آمدید، <span className="font-bold text-emerald-400">{username || 'کلم‌باز عزیز'}</span></p>
              <p className="text-[11px] text-neutral-400">جدول معمای روزانه برای شما بارگذاری شد.</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={onProceed}
            className={`w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg text-sm sm:text-base ${
              secondsLeft > 0
                ? 'bg-neutral-800 text-neutral-400 border border-neutral-700 cursor-pointer hover:bg-neutral-700'
                : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-purple-600 text-white hover:from-emerald-600 hover:to-purple-700 active:scale-98 ring-2 ring-emerald-400/40'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>
              {secondsLeft > 0 ? `شروع بازی (${secondsLeft})` : PRE_GAME_AD.ctaText || 'شروع بازی کلمباز 🥬'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
