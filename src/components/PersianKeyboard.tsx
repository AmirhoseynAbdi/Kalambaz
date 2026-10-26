import React, { useState } from 'react';
import { Delete, CornerDownLeft, Sparkles, ChevronUp } from 'lucide-react';
import { EvaluationResult } from '../types';

interface PersianKeyboardProps {
  onChar: (char: string) => void;
  onEnter: () => void;
  onDelete: () => void;
  evaluations: EvaluationResult[][];
  disabled?: boolean;
  darkMode?: boolean;
  highContrast?: boolean;
}

// Persian keyboard layout rows (standard left-to-right physical & digital layout)
const ROW_1 = ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج', 'چ'];
const ROW_2 = ['ش', 'س', 'ی', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ک', 'گ'];
const ROW_3 = ['ظ', 'ط', 'ز', 'ر', 'ذ', 'د', 'پ', 'و', 'ژ'];

// Alternate characters dictionary
const ALTERNATES_MAP: { [char: string]: string[] } = {
  ا: ['آ', 'أ', 'إ'],
  ز: ['ژ'],
  ه: ['ة'],
  ی: ['ئ', 'ي'],
  و: ['ؤ'],
  ک: ['ك'],
};

// Common quick alternate characters list for the quick access bar
const QUICK_ALTERNATES = ['آ', 'ژ', 'ة', 'ئ', 'ؤ', 'أ', 'إ'];

export const PersianKeyboard: React.FC<PersianKeyboardProps> = ({
  onChar,
  onEnter,
  onDelete,
  evaluations,
  disabled = false,
  darkMode = true,
  highContrast = false,
}) => {
  const [activePopoverKey, setActivePopoverKey] = useState<string | null>(null);

  // Compute key letter statuses from all previous guess evaluations
  const letterStatuses: { [letter: string]: 'correct' | 'present' | 'absent' } = {};

  evaluations.forEach((row) => {
    row.forEach(({ letter, status }) => {
      const current = letterStatuses[letter];
      if (status === 'correct') {
        letterStatuses[letter] = 'correct';
      } else if (status === 'present' && current !== 'correct') {
        letterStatuses[letter] = 'present';
      } else if (status === 'absent' && !current) {
        letterStatuses[letter] = 'absent';
      }
    });
  });

  const getKeyColor = (char: string) => {
    const status = letterStatuses[char];
    if (status === 'correct') {
      return highContrast
        ? 'bg-emerald-500 text-white border-emerald-400 font-bold'
        : 'bg-emerald-600 text-white border-emerald-500 font-bold';
    }
    if (status === 'present') {
      return highContrast
        ? 'bg-orange-500 text-white border-orange-400 font-bold'
        : 'bg-amber-500 text-white border-amber-400 font-bold';
    }
    if (status === 'absent') {
      return darkMode
        ? 'bg-neutral-800/90 text-neutral-500 border-neutral-800 opacity-60'
        : 'bg-neutral-300 text-neutral-500 border-neutral-300 opacity-60';
    }
    // Default unrevealed key
    return darkMode
      ? 'bg-purple-900/40 text-purple-100 hover:bg-purple-800/60 active:bg-purple-700 border-purple-800/50'
      : 'bg-white text-emerald-950 hover:bg-emerald-50 active:bg-emerald-100 border-emerald-200/90 shadow-xs';
  };

  const handleKeyClick = (char: string) => {
    if (disabled) return;
    setActivePopoverKey(null);
    onChar(char);
  };

  return (
    <div
      dir="ltr"
      role="region"
      aria-label="صفحه‌کلید فارسی کلمباز"
      className="w-full max-w-xl mx-auto px-1 sm:px-2 pt-1 pb-2 flex flex-col gap-1.5 select-none"
    >
      {/* Quick Alternates Bar */}
      <div className="flex items-center justify-center gap-1 sm:gap-1.5 py-1 px-2 rounded-xl bg-purple-950/20 dark:bg-purple-950/40 border border-purple-800/20 text-xs">
        <span
          dir="rtl"
          className="text-[11px] font-semibold text-purple-300 dark:text-purple-400 flex items-center gap-1 shrink-0 pr-1"
        >
          <Sparkles className="w-3 h-3 text-amber-400" />
          حروف خاص:
        </span>
        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          {QUICK_ALTERNATES.map((altChar) => (
            <button
              key={altChar}
              type="button"
              disabled={disabled}
              onClick={() => handleKeyClick(altChar)}
              aria-label={`تایپ حرف ${altChar}`}
              className={`h-7 px-2.5 rounded-lg border text-sm font-bold transition-all active:scale-95 flex items-center justify-center ${getKeyColor(
                altChar
              )}`}
            >
              {altChar}
            </button>
          ))}
        </div>
      </div>

      {/* Row 1 */}
      <div className="flex items-center justify-center gap-1 sm:gap-1.5">
        {ROW_1.map((char) => {
          const hasAlts = !!ALTERNATES_MAP[char];
          return (
            <div key={char} className="relative flex-1 max-w-[42px]">
              <button
                type="button"
                disabled={disabled}
                onClick={() => handleKeyClick(char)}
                onContextMenu={(e) => {
                  if (hasAlts) {
                    e.preventDefault();
                    setActivePopoverKey(activePopoverKey === char ? null : char);
                  }
                }}
                aria-label={`حرف ${char}`}
                className={`w-full h-10 sm:h-12 rounded-lg border text-sm sm:text-base font-bold flex flex-col items-center justify-center transition-all active:scale-95 ${getKeyColor(
                  char
                )}`}
              >
                <span>{char}</span>
                {hasAlts && (
                  <span className="text-[8px] sm:text-[9px] -mt-1 opacity-70">
                    •••
                  </span>
                )}
              </button>

              {/* Long-press / context alternates popover */}
              {activePopoverKey === char && hasAlts && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 p-1 rounded-lg bg-neutral-900 border border-purple-500 shadow-xl">
                  {ALTERNATES_MAP[char].map((alt) => (
                    <button
                      key={alt}
                      type="button"
                      onClick={() => handleKeyClick(alt)}
                      className="w-8 h-8 rounded bg-purple-700 hover:bg-purple-600 text-white font-bold text-sm flex items-center justify-center"
                    >
                      {alt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Row 2 */}
      <div className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3">
        {ROW_2.map((char) => {
          const hasAlts = !!ALTERNATES_MAP[char];
          return (
            <div key={char} className="relative flex-1 max-w-[44px]">
              <button
                type="button"
                disabled={disabled}
                onClick={() => handleKeyClick(char)}
                onContextMenu={(e) => {
                  if (hasAlts) {
                    e.preventDefault();
                    setActivePopoverKey(activePopoverKey === char ? null : char);
                  }
                }}
                aria-label={`حرف ${char}`}
                className={`w-full h-10 sm:h-12 rounded-lg border text-sm sm:text-base font-bold flex flex-col items-center justify-center transition-all active:scale-95 ${getKeyColor(
                  char
                )}`}
              >
                <span>{char}</span>
                {hasAlts && (
                  <span className="text-[8px] sm:text-[9px] -mt-1 opacity-70">
                    •••
                  </span>
                )}
              </button>

              {/* Long-press / context alternates popover */}
              {activePopoverKey === char && hasAlts && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 p-1 rounded-lg bg-neutral-900 border border-purple-500 shadow-xl">
                  {ALTERNATES_MAP[char].map((alt) => (
                    <button
                      key={alt}
                      type="button"
                      onClick={() => handleKeyClick(alt)}
                      className="w-8 h-8 rounded bg-purple-700 hover:bg-purple-600 text-white font-bold text-sm flex items-center justify-center"
                    >
                      {alt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Row 3 with Enter and Backspace */}
      <div className="flex items-center justify-center gap-1 sm:gap-1.5">
        {/* Enter key */}
        <button
          type="button"
          disabled={disabled}
          onClick={onEnter}
          aria-label="ثبت حدس کلمه"
          className="flex-[1.5] max-w-[68px] h-10 sm:h-12 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1 border border-emerald-400 shadow-sm transition-all active:scale-95"
        >
          <span>ثبت</span>
          <CornerDownLeft className="w-3.5 h-3.5" />
        </button>

        {ROW_3.map((char) => {
          const hasAlts = !!ALTERNATES_MAP[char];
          return (
            <div key={char} className="relative flex-1 max-w-[42px]">
              <button
                type="button"
                disabled={disabled}
                onClick={() => handleKeyClick(char)}
                onContextMenu={(e) => {
                  if (hasAlts) {
                    e.preventDefault();
                    setActivePopoverKey(activePopoverKey === char ? null : char);
                  }
                }}
                aria-label={`حرف ${char}`}
                className={`w-full h-10 sm:h-12 rounded-lg border text-sm sm:text-base font-bold flex flex-col items-center justify-center transition-all active:scale-95 ${getKeyColor(
                  char
                )}`}
              >
                <span>{char}</span>
                {hasAlts && (
                  <span className="text-[8px] sm:text-[9px] -mt-1 opacity-70">
                    •••
                  </span>
                )}
              </button>

              {activePopoverKey === char && hasAlts && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 p-1 rounded-lg bg-neutral-900 border border-purple-500 shadow-xl">
                  {ALTERNATES_MAP[char].map((alt) => (
                    <button
                      key={alt}
                      type="button"
                      onClick={() => handleKeyClick(alt)}
                      className="w-8 h-8 rounded bg-purple-700 hover:bg-purple-600 text-white font-bold text-sm flex items-center justify-center"
                    >
                      {alt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Delete key */}
        <button
          type="button"
          disabled={disabled}
          onClick={onDelete}
          aria-label="حذف حرف آخر"
          className="flex-[1.5] max-w-[68px] h-10 sm:h-12 rounded-lg bg-rose-700/80 hover:bg-rose-600 active:bg-rose-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1 border border-rose-500 shadow-sm transition-all active:scale-95"
        >
          <Delete className="w-4 h-4" />
          <span className="hidden sm:inline">حذف</span>
        </button>
      </div>
    </div>
  );
};
