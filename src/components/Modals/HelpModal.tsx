import React from 'react';
import { X, HelpCircle, CheckCircle, AlertCircle, Sparkles, Flame } from 'lucide-react';
import { HINT_COST, STARTING_POINTS, calculateGuessPoints } from '../../game/wordleLogic';

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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 animate-fade-in"
    >
      <div
        dir="ltr"
        className={`relative w-full max-w-lg rounded-2xl border-2 p-5 sm:p-6 shadow-2xl overflow-y-auto max-h-[90vh] ${
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
                راهنمای بازی کلمباز (Kalabaz)
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="بستن راهنما"
              className={`p-1 rounded-lg transition-colors ${
                darkMode
                  ? 'text-[#d8b4fe] hover:text-white hover:bg-[#31214f]/60'
                  : 'text-[#166534] hover:text-[#14532d] hover:bg-[#dcfce7]'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div
            className={`space-y-4 text-xs sm:text-sm leading-relaxed font-medium ${
              darkMode ? 'text-[#e9d5ff]' : 'text-[#14532d]'
            }`}
          >
            <p>
              در{' '}
              <strong
                className={darkMode ? 'text-[#86efac]' : 'text-[#15803d]'}
              >
                کلمباز
              </strong>{' '}
              شما ۶ فرصت دارید تا کلمه رمزآلود امروز را حدس بزنید. کلمه روز می‌تواند{' '}
              <strong
                className={darkMode ? 'text-[#a7f3d0]' : 'text-[#166534]'}
              >
                ۴، ۵ یا ۶ حرفی
              </strong>{' '}
              باشد که می‌توانید از منوی بالای صفحه حالت مورد نظر خود را انتخاب کنید.
            </p>

            <p
              className={`p-2.5 rounded-xl border text-xs font-semibold ${
                darkMode
                  ? 'bg-[#281b40]/80 border-[#563d82]/70 text-[#e9d5ff]'
                  : 'bg-[#dcfce7] border-[#86efac] text-[#14532d]'
              }`}
            >
              ⚠️ <strong>نکته:</strong> هر حدس شما باید یک{' '}
              <strong
                className={darkMode ? 'text-[#86efac]' : 'text-[#15803d]'}
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
                    : 'bg-[#dcfce7] border-[#86efac]'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <div className="w-7 h-7 rounded-lg bg-[#16a34a] border border-[#22c55e] text-white flex items-center justify-center font-extrabold text-sm">
                    ک
                  </div>
                  <div className={`w-7 h-7 rounded-lg text-white flex items-center justify-center text-sm ${darkMode ? 'bg-[#4d4263]' : 'bg-[#4b6355]'}`}>
                    ل
                  </div>
                  <div className={`w-7 h-7 rounded-lg text-white flex items-center justify-center text-sm ${darkMode ? 'bg-[#4d4263]' : 'bg-[#4b6355]'}`}>
                    م
                  </div>
                  <div className={`w-7 h-7 rounded-lg text-white flex items-center justify-center text-sm ${darkMode ? 'bg-[#4d4263]' : 'bg-[#4b6355]'}`}>
                    ب
                  </div>
                </div>
                <p
                  className={`text-xs font-semibold ${
                    darkMode ? 'text-[#d1fae5]' : 'text-[#14532d]'
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
                    : 'bg-[#fef3c7] border-[#f59e0b]'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <div className={`w-7 h-7 rounded-lg text-white flex items-center justify-center text-sm ${darkMode ? 'bg-[#4d4263]' : 'bg-[#4b6355]'}`}>
                    ب
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-[#f97316] text-white flex items-center justify-center font-extrabold text-sm">
                    ا
                  </div>
                  <div className={`w-7 h-7 rounded-lg text-white flex items-center justify-center text-sm ${darkMode ? 'bg-[#4d4263]' : 'bg-[#4b6355]'}`}>
                    ه
                  </div>
                  <div className={`w-7 h-7 rounded-lg text-white flex items-center justify-center text-sm ${darkMode ? 'bg-[#4d4263]' : 'bg-[#4b6355]'}`}>
                    ار
                  </div>
                </div>
                <p
                  className={`text-xs font-semibold ${
                    darkMode ? 'text-[#fef3c7]' : 'text-[#78350f]'
                  }`}
                >
                  حرف <strong>«ا»</strong> به رنگ نارنجی/زرد است: یعنی در کلمه وجود دارد، اما{' '}
                  <strong className="underline">در جایگاه دیگری</strong> از کلمه است.
                </p>
              </div>

              {/* Absent example */}
              <div
                className={`space-y-1.5 p-3 rounded-xl border ${
                  darkMode
                    ? 'bg-[#25193b]/75 border-[#543c7d]/60'
                    : 'bg-[#f0fdf4] border-[#86efac]'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <div className={`w-7 h-7 rounded-lg text-white flex items-center justify-center text-sm ${darkMode ? 'bg-[#685c7a]' : 'bg-[#6b8577]'}`}>
                    د
                  </div>
                  <div className={`w-7 h-7 rounded-lg text-white flex items-center justify-center text-sm ${darkMode ? 'bg-[#685c7a]' : 'bg-[#6b8577]'}`}>
                    ر
                  </div>
                  <div className={`w-7 h-7 rounded-lg border text-white flex items-center justify-center font-extrabold text-sm ${darkMode ? 'bg-[#382b4d] border-[#68548c]' : 'bg-[#4b6355] border-[#3a4f43]'}`}>
                    ی
                  </div>
                  <div className={`w-7 h-7 rounded-lg text-white flex items-center justify-center text-sm ${darkMode ? 'bg-[#685c7a]' : 'bg-[#6b8577]'}`}>
                    ا
                  </div>
                </div>
                <p
                  className={`text-xs font-semibold ${
                    darkMode ? 'text-[#d8c7f0]' : 'text-[#14532d]'
                  }`}
                >
                  حرف <strong>«ی»</strong> به رنگ تیره است: یعنی این حرف{' '}
                  <strong className="underline">اصلاً در کلمه رمز وجود ندارد</strong>.
                </p>
              </div>
            </div>

            {/* Features Highlights */}
            <div
              className={`space-y-2 pt-2 border-t ${
                darkMode ? 'border-[#4c3773]/60' : 'border-[#bbf7d0]'
              }`}
            >
              <div className="flex items-start gap-2">
                <Flame
                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                    darkMode ? 'text-[#86efac]' : 'text-[#16a34a]'
                  }`}
                />
                <p className="text-xs">
                  <strong
                    className={darkMode ? 'text-[#bef264]' : 'text-[#15803d]'}
                  >
                    بذرهای سبز و راهنمای حرف سبز (💡):
                  </strong>{' '}
                  هر بازیکن در شروع <strong>{STARTING_POINTS.toLocaleString('fa-IR')} بذر هدیه</strong> دارد و با هر حدس درست کلمه روز، بین <strong>{calculateGuessPoints(6, true).toLocaleString('fa-IR')} تا {calculateGuessPoints(1, true).toLocaleString('fa-IR')} بذر</strong> (حدس اول: {calculateGuessPoints(1, true).toLocaleString('fa-IR')} تا حدس ششم: {calculateGuessPoints(6, true).toLocaleString('fa-IR')} بذر) می‌گیرد. با <strong>{HINT_COST.toLocaleString('fa-IR')} بذر</strong> می‌توانید یک حرف سبز کشف‌نشده را آشکار کنید!
                </p>
              </div>

              <div className="flex items-start gap-2">
                <Sparkles
                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                    darkMode ? 'text-[#d8b4fe]' : 'text-[#15803d]'
                  }`}
                />
                <p className="text-xs">
                  <strong
                    className={darkMode ? 'text-[#e9d5ff]' : 'text-[#166534]'}
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
              متوجه شدم، بزن بریم کلم‌بازی! 🥦
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
