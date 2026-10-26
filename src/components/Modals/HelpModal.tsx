import React from 'react';
import { X, HelpCircle, CheckCircle, AlertCircle, Sparkles, Flame } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="راهنمای بازی کلمباز"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div
        dir="ltr"
        className="relative w-full max-w-lg rounded-2xl bg-neutral-900 border border-purple-500/40 p-5 sm:p-6 text-white shadow-2xl overflow-y-auto max-h-[90vh]"
      >
        <div dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🥬</span>
            <h2 className="text-lg sm:text-xl font-bold font-['Lalezar',sans-serif]">
              راهنمای بازی کلمباز (Kalabaz)
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="بستن راهنما"
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 text-xs sm:text-sm text-neutral-300 leading-relaxed">
          <p>
            در <strong className="text-emerald-400">کلمباز</strong> شما ۶ فرصت دارید تا کلمه رمزآلود امروز را حدس بزنید. کلمه روز می‌تواند <strong className="text-purple-300">۴، ۵ یا ۶ حرفی</strong> باشد که می‌توانید از منوی بالای صفحه حالت مورد نظر خود را انتخاب کنید.
          </p>

          <p className="bg-white/5 p-2.5 rounded-xl border border-white/10 text-xs">
            ⚠️ <strong>نکته:</strong> هر حدس شما باید یک <strong className="text-amber-300">کلمه معتبر و معنادار فارسی</strong> از واژه‌نامه بازی باشد.
          </p>

          {/* Color explanations with visual tiles */}
          <div className="space-y-3 pt-1">
            <h3 className="font-bold text-white text-sm">
              معنای رنگ خانه‌ها پس از ثبت هر حدس:
            </h3>

            {/* Green example */}
            <div className="space-y-1.5 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40">
              <div className="flex items-center gap-1.5 font-bold text-emerald-300 text-xs">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                  ک
                </div>
                <div className="w-7 h-7 rounded-lg bg-neutral-700 text-white flex items-center justify-center text-sm">
                  ل
                </div>
                <div className="w-7 h-7 rounded-lg bg-neutral-700 text-white flex items-center justify-center text-sm">
                  م
                </div>
                <div className="w-7 h-7 rounded-lg bg-neutral-700 text-white flex items-center justify-center text-sm">
                  ب
                </div>
              </div>
              <p className="text-xs text-emerald-100">
                حرف <strong className="text-white">«ک»</strong> به رنگ سبز است: یعنی در کلمه هدف وجود دارد و <strong className="underline">دقیقاً در جایگاه درست</strong> است.
              </p>
            </div>

            {/* Yellow example */}
            <div className="space-y-1.5 p-3 rounded-xl bg-amber-950/40 border border-amber-800/40">
              <div className="flex items-center gap-1.5 font-bold text-amber-300 text-xs">
                <div className="w-7 h-7 rounded-lg bg-neutral-700 text-white flex items-center justify-center text-sm">
                  ب
                </div>
                <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-sm">
                  ا
                </div>
                <div className="w-7 h-7 rounded-lg bg-neutral-700 text-white flex items-center justify-center text-sm">
                  ه
                </div>
                <div className="w-7 h-7 rounded-lg bg-neutral-700 text-white flex items-center justify-center text-sm">
                  ار
                </div>
              </div>
              <p className="text-xs text-amber-100">
                حرف <strong className="text-white">«ا»</strong> به رنگ زرد است: یعنی در کلمه وجود دارد، اما <strong className="underline">در جایگاه دیگری</strong> از کلمه است.
              </p>
            </div>

            {/* Gray example */}
            <div className="space-y-1.5 p-3 rounded-xl bg-neutral-800/50 border border-neutral-700">
              <div className="flex items-center gap-1.5 font-bold text-neutral-300 text-xs">
                <div className="w-7 h-7 rounded-lg bg-neutral-600 text-white flex items-center justify-center text-sm">
                  د
                </div>
                <div className="w-7 h-7 rounded-lg bg-neutral-600 text-white flex items-center justify-center text-sm">
                  ر
                </div>
                <div className="w-7 h-7 rounded-lg bg-neutral-800 text-neutral-500 flex items-center justify-center font-bold text-sm">
                  ی
                </div>
                <div className="w-7 h-7 rounded-lg bg-neutral-600 text-white flex items-center justify-center text-sm">
                  ا
                </div>
              </div>
              <p className="text-xs text-neutral-300">
                حرف <strong className="text-white">«ی»</strong> به رنگ خاکستری تیره است: یعنی این حرف <strong className="underline">اصلاً در کلمه رمز وجود ندارد</strong>.
              </p>
            </div>
          </div>

          {/* Features Highlights */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="flex items-start gap-2">
              <Flame className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <p className="text-xs">
                <strong className="text-amber-300">استریک روزانه پیاپی:</strong> کلمباز برای احترام به پشتکار شما، در صورتی که هر روز بازی کنید استریک شما را حتی در صورت نرسیدن به جواب نهایی افزایش می‌دهد!
              </p>
            </div>

            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <p className="text-xs">
                <strong className="text-purple-300">حروف خاص و کلاه‌دار:</strong> نوار بالای کیبورد دسترسی فوری به حروف <strong className="text-white">«آ»، «ة»، «ئ»، «ؤ»</strong> را فراهم می‌کند. همچنین با کلیک‌راست یا لمس طولانی روی حرف «ا» می‌توانید «آ» را انتخاب نمایید.
              </p>
            </div>
          </div>
        </div>

        {/* Footer button */}
        <div className="pt-4 mt-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm transition-all"
          >
            متوجه شدم، بزن بریم کلم‌بازی! 🥬
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};
