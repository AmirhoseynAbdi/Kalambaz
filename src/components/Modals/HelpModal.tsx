import React from 'react';
import { X, HelpCircle, CheckCircle, AlertCircle, Sparkles, Flame } from 'lucide-react';

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="راهنمای بازی کلمباز"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
    >
      <div
        dir="ltr"
        className={`relative w-full max-w-lg rounded-2xl border-2 p-5 sm:p-6 shadow-2xl overflow-y-auto max-h-[90vh] ${
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
                راهنمای بازی کلمباز (Kalabaz)
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="بستن راهنما"
              className={`p-1 rounded-lg transition-colors ${
                darkMode
                  ? 'text-[#d8b4fe] hover:text-white hover:bg-[#31214f]/60'
                  : 'text-[#215c46] hover:text-[#123628] hover:bg-[#cfe5da]/60'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div
            className={`space-y-4 text-xs sm:text-sm leading-relaxed font-medium ${
              darkMode ? 'text-[#e9d5ff]' : 'text-[#17382b]'
            }`}
          >
            <p>
              در{' '}
              <strong
                className={darkMode ? 'text-[#86efac]' : 'text-[#5c328c]'}
              >
                کلمباز
              </strong>{' '}
              شما ۶ فرصت دارید تا کلمه رمزآلود امروز را حدس بزنید. کلمه روز می‌تواند{' '}
              <strong
                className={darkMode ? 'text-[#a7f3d0]' : 'text-[#21664d]'}
              >
                ۴، ۵ یا ۶ حرفی
              </strong>{' '}
              باشد که می‌توانید از منوی بالای صفحه حالت مورد نظر خود را انتخاب کنید.
            </p>

            <p
              className={`p-2.5 rounded-xl border text-xs font-semibold ${
                darkMode
                  ? 'bg-[#281b40]/80 border-[#563d82]/70 text-[#e9d5ff]'
                  : 'bg-[#ebe3f6] border-[#9b7ec7] text-[#351857]'
              }`}
            >
              ⚠️ <strong>نکته:</strong> هر حدس شما باید یک{' '}
              <strong
                className={darkMode ? 'text-[#86efac]' : 'text-[#4c2478]'}
              >
                کلمه معتبر فارسی
              </strong>{' '}
              از واژه‌نامه گسترده بازی باشد.
            </p>

            {/* Color explanations with visual tiles */}
            <div className="space-y-3 pt-1">
              <h3 className="font-extrabold text-sm">
                معنای رنگ خانه‌ها پس از ثبت هر حدس:
              </h3>

              {/* Green example */}
              <div
                className={`space-y-1.5 p-3 rounded-xl border ${
                  darkMode
                    ? 'bg-[#16362e]/70 border-[#3d8b73]/60'
                    : 'bg-[#dfeee6] border-[#7ab399]'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <div className="w-7 h-7 rounded-lg bg-[#237a5b] border border-[#6ee7b7]/60 text-white flex items-center justify-center font-extrabold text-sm">
                    ک
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-[#4d4263] text-white flex items-center justify-center text-sm">
                    ل
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-[#4d4263] text-white flex items-center justify-center text-sm">
                    م
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-[#4d4263] text-white flex items-center justify-center text-sm">
                    ب
                  </div>
                </div>
                <p
                  className={`text-xs font-semibold ${
                    darkMode ? 'text-[#d1fae5]' : 'text-[#17382b]'
                  }`}
                >
                  حرف <strong>«ک»</strong> به رنگ سبز است: یعنی در کلمه هدف وجود دارد و{' '}
                  <strong className="underline">دقیقاً در جایگاه درست</strong> است.
                </p>
              </div>

              {/* Yellow example */}
              <div
                className={`space-y-1.5 p-3 rounded-xl border ${
                  darkMode
                    ? 'bg-[#362619]/70 border-[#a16218]/60'
                    : 'bg-[#f7eedc] border-[#cfa055]'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <div className="w-7 h-7 rounded-lg bg-[#4d4263] text-white flex items-center justify-center text-sm">
                    ب
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-[#c9822b] text-white flex items-center justify-center font-extrabold text-sm">
                    ا
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-[#4d4263] text-white flex items-center justify-center text-sm">
                    ه
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-[#4d4263] text-white flex items-center justify-center text-sm">
                    ار
                  </div>
                </div>
                <p
                  className={`text-xs font-semibold ${
                    darkMode ? 'text-[#fef3c7]' : 'text-[#5c390e]'
                  }`}
                >
                  حرف <strong>«ا»</strong> به رنگ زرد است: یعنی در کلمه وجود دارد، اما{' '}
                  <strong className="underline">در جایگاه دیگری</strong> از کلمه است.
                </p>
              </div>

              {/* Muted Purple-Sage Absent example */}
              <div
                className={`space-y-1.5 p-3 rounded-xl border ${
                  darkMode
                    ? 'bg-[#25193b]/75 border-[#543c7d]/60'
                    : 'bg-[#ebe4f5] border-[#a58fd1]'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <div className="w-7 h-7 rounded-lg bg-[#685c7a] text-white flex items-center justify-center text-sm">
                    د
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-[#685c7a] text-white flex items-center justify-center text-sm">
                    ر
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-[#382b4d] border border-[#68548c] text-white flex items-center justify-center font-extrabold text-sm">
                    ی
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-[#685c7a] text-white flex items-center justify-center text-sm">
                    ا
                  </div>
                </div>
                <p
                  className={`text-xs font-semibold ${
                    darkMode ? 'text-[#d8c7f0]' : 'text-[#351857]'
                  }`}
                >
                  حرف <strong>«ی»</strong> به رنگ تیره (خاکستری-بنفش) است: یعنی این حرف{' '}
                  <strong className="underline">اصلاً در کلمه رمز وجود ندارد</strong>.
                </p>
              </div>
            </div>

            {/* Features Highlights */}
            <div
              className={`space-y-2 pt-2 border-t ${
                darkMode ? 'border-[#4c3773]/60' : 'border-[#86b8a1]/60'
              }`}
            >
              <div className="flex items-start gap-2">
                <Flame
                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                    darkMode ? 'text-[#86efac]' : 'text-[#5c328c]'
                  }`}
                />
                <p className="text-xs">
                  <strong
                    className={darkMode ? 'text-[#a7f3d0]' : 'text-[#4c2478]'}
                  >
                    استریک روزانه پیاپی:
                  </strong>{' '}
                  کلمباز در صورتی که هر روز بازی کنید استریک شما را حتی در صورت نرسیدن به جواب نهایی افزایش می‌دهد!
                </p>
              </div>

              <div className="flex items-start gap-2">
                <Sparkles
                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                    darkMode ? 'text-[#d8b4fe]' : 'text-[#21664d]'
                  }`}
                />
                <p className="text-xs">
                  <strong
                    className={darkMode ? 'text-[#e9d5ff]' : 'text-[#1c5942]'}
                  >
                    حروف ویژه داخل کیبورد:
                  </strong>{' '}
                  با نگه داشتن (لمس طولانی) یا کلیک‌راست روی کلیدهایی مانند «ا» یا «ز» می‌توانید حروف هم‌خانواده آن‌ها مانند <strong>«آ»</strong> و <strong>«ژ»</strong> را انتخاب کنید.
                </p>
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
              متوجه شدم، بزن بریم کلم‌بازی! 🥬
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
