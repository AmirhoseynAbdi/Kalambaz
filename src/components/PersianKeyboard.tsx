import React, { useState, useRef, useEffect } from 'react';
import { Delete, CornerDownLeft } from 'lucide-react';
import { EvaluationResult } from '../types';
import { normalizePersian } from '../game/wordleLogic';

interface PersianKeyboardProps {
  onChar: (char: string) => void;
  onEnter: () => void;
  onDelete: () => void;
  evaluations: EvaluationResult[][];
  targetWord?: string;
  revealedHints?: number[];
  disabled?: boolean;
  darkMode?: boolean;
  highContrast?: boolean;
}

// Persian keyboard layout rows (standard layout without standalone ژ since ژ is under ز)
const ROW_1 = ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج', 'چ'];
const ROW_2 = ['ش', 'س', 'ی', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ک', 'گ'];
const ROW_3 = ['ظ', 'ط', 'ز', 'ر', 'ذ', 'د', 'پ', 'و'];

// Alternate characters accessible via long-press or right-click on the base key
const ALTERNATES_MAP: { [char: string]: string[] } = {
  ا: ['آ', 'أ', 'إ'],
  ز: ['ژ'],
  ه: ['ة'],
  ی: ['ئ', 'ي'],
  و: ['ؤ'],
  ک: ['ك'],
};

const ALT_TO_BASE: { [alt: string]: string } = Object.entries(ALTERNATES_MAP).reduce(
  (acc, [base, alts]) => {
    alts.forEach((alt) => {
      acc[alt] = base;
    });
    return acc;
  },
  {} as { [alt: string]: string }
);

export const PersianKeyboard: React.FC<PersianKeyboardProps> = ({
  onChar,
  onEnter,
  onDelete,
  evaluations,
  targetWord = '',
  revealedHints = [],
  disabled = false,
  darkMode = true,
  highContrast = false,
}) => {
  const [activePopoverKey, setActivePopoverKey] = useState<string | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef<boolean>(false);
  const keyboardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!activePopoverKey) return;
    const handleOutsidePointer = (e: PointerEvent) => {
      if (keyboardRef.current && !keyboardRef.current.contains(e.target as Node)) {
        setActivePopoverKey(null);
      }
    };
    window.addEventListener('pointerdown', handleOutsidePointer);
    return () => window.removeEventListener('pointerdown', handleOutsidePointer);
  }, [activePopoverKey]);

  // Compute key letter statuses from all previous guess evaluations + revealed green hints
  const letterStatuses: { [letter: string]: 'correct' | 'present' | 'absent' } = {};

  evaluations.forEach((row) => {
    row.forEach(({ letter, status }) => {
      const targetKey = ALT_TO_BASE[letter] || letter;
      const current = letterStatuses[targetKey];
      if (status === 'correct') {
        letterStatuses[targetKey] = 'correct';
      } else if (status === 'present' && current !== 'correct') {
        letterStatuses[targetKey] = 'present';
      } else if (status === 'absent' && !current) {
        letterStatuses[targetKey] = 'absent';
      }
    });
  });

  if (targetWord && revealedHints.length > 0) {
    const targetChars = Array.from(normalizePersian(targetWord));
    revealedHints.forEach((hintIdx) => {
      const hintChar = targetChars[hintIdx];
      if (hintChar) {
        const baseKey = ALT_TO_BASE[hintChar] || hintChar;
        letterStatuses[baseKey] = 'correct';
      }
    });
  }

  const defaultKeyStyle = darkMode
    ? 'bg-[#2a1f42] text-[#f5f3ff] hover:bg-[#362854] active:bg-[#433266] border-[#433266]'
    : 'bg-[#dcfce7] text-[#14532d] hover:bg-[#bbf7d0] active:bg-[#86efac] border-[#86efac] font-extrabold';

  const getKeyColor = (char: string) => {
    const status = letterStatuses[char];
    if (status === 'correct') {
      return highContrast
        ? 'bg-[#16a34a] text-white border-[#22c55e] font-extrabold'
        : 'bg-[#15803d] text-white border-[#16a34a] font-extrabold';
    }
    if (status === 'present') {
      return highContrast
        ? 'bg-[#f97316] text-white border-[#fb923c] font-extrabold'
        : 'bg-[#ca8a04] text-white border-[#eab308] font-extrabold';
    }
    if (status === 'absent') {
      return darkMode
        ? 'bg-[#1b1429] text-[#7c6d99] border-[#2e2345]'
        : 'bg-[#4b6355] text-white border-[#3a4f43]';
    }
    return defaultKeyStyle;
  };

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handlePointerDown = (char: string, hasAlts: boolean) => {
    if (disabled || !hasAlts) return;
    longPressTriggeredRef.current = false;
    clearLongPressTimer();
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      setActivePopoverKey((prev) => (prev === char ? null : char));
    }, 340);
  };

  const handlePointerUpOrLeave = () => {
    clearLongPressTimer();
  };

  const handleKeyClick = (char: string) => {
    if (disabled) return;
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    setActivePopoverKey(null);
    onChar(char);
  };

  const renderKey = (char: string, maxWidthClass: string) => {
    const alts = ALTERNATES_MAP[char];
    const hasAlts = !!alts;

    return (
      <div key={char} className={`relative flex-1 min-w-0 ${maxWidthClass}`}>
        <button
          type="button"
          disabled={disabled}
          onPointerDown={() => handlePointerDown(char, hasAlts)}
          onPointerUp={handlePointerUpOrLeave}
          onPointerLeave={handlePointerUpOrLeave}
          onPointerCancel={handlePointerUpOrLeave}
          onClick={() => handleKeyClick(char)}
          onContextMenu={(e) => {
            if (hasAlts) {
              e.preventDefault();
              setActivePopoverKey(activePopoverKey === char ? null : char);
            }
          }}
          aria-label={hasAlts ? `حرف ${char} (${alts.join('، ')})` : `حرف ${char}`}
          title={hasAlts ? `نگه دارید یا کلیک راست برای: ${alts.join(' ، ')}` : undefined}
          className={`w-full h-11 sm:h-12 rounded-lg sm:rounded-xl border text-sm sm:text-base font-bold flex flex-col items-center justify-center transition-colors active:scale-95 relative touch-manipulation select-none ${getKeyColor(
            char
          )}`}
        >
          <span className="leading-none">{char}</span>
          {hasAlts && (
            <span
              className={`text-[9px] sm:text-[10px] leading-none mt-0.5 font-bold ${
                letterStatuses[char]
                  ? 'text-white/90'
                  : darkMode
                  ? 'text-[#a78bfa]'
                  : 'text-[#15803d]'
              }`}
            >
              {alts[0]}
            </span>
          )}
        </button>

        {/* Long-press / right-click alternates popover */}
        {activePopoverKey === char && hasAlts && (
          <div
            className={`absolute -top-13 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 p-1 rounded-xl border-2 shadow-lg ${
              darkMode
                ? 'bg-[#201733] border-[#22c55e]'
                : 'bg-white border-[#9333ea]'
            }`}
          >
            {alts.map((alt) => (
              <button
                key={alt}
                type="button"
                onClick={() => {
                  setActivePopoverKey(null);
                  onChar(alt);
                }}
                className={`w-9 h-9 rounded-lg font-extrabold text-sm flex items-center justify-center transition-colors text-white ${
                  darkMode
                    ? 'bg-[#15803d] hover:bg-[#16a34a]'
                    : 'bg-[#6b21a8] hover:bg-[#7e22ce]'
                }`}
              >
                {alt}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={keyboardRef}
      dir="ltr"
      role="region"
      aria-label="صفحه‌کلید فارسی کلمباز"
      className="w-full max-w-xl mx-auto px-1 sm:px-2 pt-0.5 pb-1.5 sm:pb-2 flex flex-col gap-1 sm:gap-1.5 select-none shrink-0"
    >
      {/* Row 1 (12 keys) */}
      <div className="flex items-center justify-center gap-[3px] sm:gap-1.5">
        {ROW_1.map((char) => renderKey(char, 'max-w-[44px]'))}
      </div>

      {/* Row 2 (11 keys) */}
      <div className="flex items-center justify-center gap-[3px] sm:gap-1.5 px-1.5 sm:px-3">
        {ROW_2.map((char) => renderKey(char, 'max-w-[46px]'))}
      </div>

      {/* Row 3 with Enter and Backspace */}
      <div className="flex items-center justify-center gap-[3px] sm:gap-1.5">
        {/* Enter key (Green in Night Mode, Purple in Day Mode) */}
        <button
          type="button"
          disabled={disabled}
          onClick={onEnter}
          aria-label="ثبت حدس کلمه"
          className={`flex-[1.5] max-w-[74px] h-11 sm:h-12 rounded-lg sm:rounded-xl border font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1 transition-colors active:scale-95 touch-manipulation shrink-0 text-white ${
            darkMode
              ? 'bg-[#15803d] hover:bg-[#16a34a] border-[#22c55e]'
              : 'bg-[#6b21a8] hover:bg-[#7e22ce] border-[#9333ea]'
          }`}
        >
          <span>ثبت</span>
          <CornerDownLeft className="w-3.5 h-3.5 shrink-0" />
        </button>

        {ROW_3.map((char) => renderKey(char, 'max-w-[46px]'))}

        {/* Delete key (Purple in Night Mode, Green in Day Mode) */}
        <button
          type="button"
          disabled={disabled}
          onClick={onDelete}
          aria-label="حذف حرف آخر"
          className={`flex-[1.5] max-w-[74px] h-11 sm:h-12 rounded-lg sm:rounded-xl border font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1 transition-colors active:scale-95 touch-manipulation shrink-0 text-white ${
            darkMode
              ? 'bg-[#6b21a8] hover:bg-[#7e22ce] border-[#9333ea]'
              : 'bg-[#15803d] hover:bg-[#16a34a] border-[#22c55e]'
          }`}
        >
          <Delete className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">حذف</span>
        </button>
      </div>
    </div>
  );
};
