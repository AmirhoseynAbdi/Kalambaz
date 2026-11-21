import React from 'react';
import { X, Lightbulb, Keyboard } from 'lucide-react';
import { HINT_COST, STARTING_POINTS } from '../../game/wordleLogic';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode?: boolean;
}

export const HelpModal: React.FC<HelpModalProps> = ({
  isOpen,
  onClose,
  darkMode = true,
}) => {
  if (!isOpen) return null;

  const absentTile = darkMode
    ? 'bg-[#291e40] border-[#433266] text-[#c4b5fd]'
    : 'bg-[#4b6355] border-[#3a4f43] text-white';

  const neutralTile = darkMode
    ? 'bg-[#201733] border-[#3d2e5c] text-[#f5f3ff]'
    : 'bg-white border-[#86efac] text-[#14532d]';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="راهنمای بازی کلمباز"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 animate-fade-in"
    >
      <div
        dir="ltr"
        onClick={(e) => e.stopPropagation()}
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
              darkMode ? 'border-[#362854]' : 'border-[#bbf7d0]'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl select-none">🥦</span>
              <div>
                <h2 className="text-lg sm:text-xl font-bold font-['Lalezar',sans-serif] leading-tight">
                  چطور کَلَمباز بازی کنیم؟
                </h2>
                <p
                  className={`text-[11px] font-semibold ${
                    darkMode ? 'text-[#c4b5fd]' : 'text-[#166534]'
                  }`}
                >
                  کلمه پنهان امروز را در ۶ تلاش حدس بزنید!
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="بستن راهنما"
              className={`p-1.5 rounded-lg transition-colors ${
                darkMode
                  ? 'text-[#c4b5fd] hover:text-white hover:bg-[#291e40]'
                  : 'text-[#166534] hover:text-[#14532d] hover:bg-[#dcfce7]'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 3 Simple Steps */}
          <div className="space-y-3 text-xs sm:text-sm">
            <div
              className={`p-3 rounded-xl border font-semibold leading-relaxed ${
                darkMode
                  ? 'bg-[#161022] border-[#362854] text-[#e9d5ff]'
                  : 'bg-[#f0fdf4] border-[#86efac] text-[#14532d]'
              }`}
            >
              یک کلمه فارسی (۴، ۵ یا ۶ حرفی) بنویسید و دکمه{' '}
              <strong className={darkMode ? 'text-[#4ade80]' : 'text-[#6b21a8]'}>
                ثبت
              </strong>{' '}
              را بزنید. رنگ خانه‌ها به شما می‌گوید چقدر به جواب نزدیکید:
            </div>

            {/* Visual Color Examples */}
            <div className="space-y-2.5">
              {/* Green = Right letter, right spot */}
              <div
                className={`p-3 rounded-xl border flex flex-col gap-2 ${
                  darkMode
                    ? 'bg-[#143d25] border-[#22c55e]'
                    : 'bg-[#dcfce7] border-[#22c55e]'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-8 h-8 rounded-lg bg-[#16a34a] border-2 border-[#22c55e] text-white flex items-center justify-center font-black text-base">
                    ب
                  </div>
                  <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center font-bold text-base ${neutralTile}`}>
                    ه
                  </div>
                  <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center font-bold text-base ${neutralTile}`}>
                    ا
                  </div>
                  <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center font-bold text-base ${neutralTile}`}>
                    ر
                  </div>
                </div>
                <p
                  className={`text-xs font-bold ${
                    darkMode ? 'text-[#dcfce7]' : 'text-[#14532d]'
                  }`}
                >
                  <span className="font-black">سبز:</span> حرف «ب» در کلمه هست و{' '}
                  <span className="underline">جایش دقیقاً درست است</span>.
                </p>
              </div>

              {/* Orange/Yellow = Right letter, wrong spot */}
              <div
                className={`p-3 rounded-xl border flex flex-col gap-2 ${
                  darkMode
                    ? 'bg-[#3b2210] border-[#f97316]'
                    : 'bg-[#fef3c7] border-[#f59e0b]'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center font-bold text-base ${neutralTile}`}>
                    د
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-[#f97316] border-2 border-[#fb923c] text-white flex items-center justify-center font-black text-base">
                    ر
                  </div>
                  <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center font-bold text-base ${neutralTile}`}>
                    خ
                  </div>
                  <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center font-bold text-base ${neutralTile}`}>
                    ت
                  </div>
                </div>
                <p
                  className={`text-xs font-bold ${
                    darkMode ? 'text-[#ffedd5]' : 'text-[#78350f]'
                  }`}
                >
                  <span className="font-black">نارنجی:</span> حرف «ر» در کلمه هست، اما{' '}
                  <span className="underline">در خانه دیگری</span> قرار دارد.
                </p>
              </div>

              {/* Dark = Not in word */}
              <div
                className={`p-3 rounded-xl border flex flex-col gap-2 ${
                  darkMode
                    ? 'bg-[#161022] border-[#362854]'
                    : 'bg-[#f0fdf4] border-[#86efac]'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center font-bold text-base ${neutralTile}`}>
                    س
                  </div>
                  <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center font-black text-base ${absentTile}`}>
                    ی
                  </div>
                  <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center font-bold text-base ${neutralTile}`}>
                    ا
                  </div>
                  <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center font-bold text-base ${neutralTile}`}>
                    ه
                  </div>
                </div>
                <p
                  className={`text-xs font-bold ${
                    darkMode ? 'text-[#c4b5fd]' : 'text-[#14532d]'
                  }`}
                >
                  <span className="font-black">تیره:</span> حرف «ی»{' '}
                  <span className="underline">اصلاً در کلمه امروز نیست</span>.
                </p>
              </div>
            </div>

            {/* 2 Quick Tips */}
            <div className="grid grid-cols-1 gap-2 pt-1">
              <div
                className={`flex items-start gap-2 p-2.5 rounded-xl border text-xs ${
                  darkMode
                    ? 'bg-[#291e40] border-[#433266] text-[#e9d5ff]'
                    : 'bg-[#dcfce7] border-[#86efac] text-[#14532d]'
                }`}
              >
                <Lightbulb
                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                    darkMode ? 'text-[#fde047]' : 'text-[#6b21a8]'
                  }`}
                />
                <span>
                  <strong>بذر و راهنما:</strong> با {STARTING_POINTS.toLocaleString('fa-IR')} بذر شروع می‌کنید. با هر برد بذر جایزه می‌گیرید و با {HINT_COST.toLocaleString('fa-IR')} بذر می‌توانید یک حرف سبز را ببینید.
                </span>
              </div>

              <div
                className={`flex items-start gap-2 p-2.5 rounded-xl border text-xs ${
                  darkMode
                    ? 'bg-[#291e40] border-[#433266] text-[#e9d5ff]'
                    : 'bg-[#dcfce7] border-[#86efac] text-[#14532d]'
                }`}
              >
                <Keyboard
                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                    darkMode ? 'text-[#4ade80]' : 'text-[#15803d]'
                  }`}
                />
                <span>
                  <strong>حروف آ، ژ، ئ:</strong> روی کلیدهای «ا»، «ز» یا «ی» کمی نگه دارید (یا کلیک‌راست کنید).
                </span>
              </div>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="pt-4 mt-4">
            <button
              type="button"
              onClick={onClose}
              className={`w-full py-2.5 rounded-xl font-extrabold text-white text-sm transition-colors ${
                darkMode
                  ? 'bg-[#15803d] hover:bg-[#16a34a]'
                  : 'bg-[#6b21a8] hover:bg-[#7e22ce]'
              }`}
            >
              فهمیدم، بزن بریم بازی! 🥦
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
