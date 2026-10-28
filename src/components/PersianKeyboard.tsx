import React, { useState, useRef, useEffect } from 'react';
import { Delete, CornerDownLeft } from 'lucide-react';
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

  const defaultKeyStyle = darkMode
    ? 'bg-gradient-to-b from-[#2e1f47] to-[#231938] text-[#efe9f7] hover:from-[#392759] hover:to-[#2c2047] active:bg-[#46306b] border-[#594085]/75 shadow-xs'
    : 'bg-gradient-to-b from-[#e2f1ea] to-[#d3e8de] text-[#173a2c] hover:from-[#d5eadf] hover:to-[#c4dfd2] active:bg-[#b5d6c6] border-2 border-[#7eb39a]/85 font-extrabold shadow-xs';

  const getKeyColor = (char: string) => {
    const status = letterStatuses[char];
    if (status === 'correct') {
      return highContrast
        ? 'bg-emerald-500 text-white border-emerald-400 font-extrabold shadow-sm'
        : darkMode
        ? 'bg-gradient-to-b from-[#237d5e] to-[#195e46] text-white border-[#6ee7b7]/75 font-extrabold shadow-sm'
        : 'bg-gradient-to-b from-[#258060] to-[#1b634a] text-white border-[#134d39] font-extrabold shadow-sm';
    }
    if (status === 'present') {
      return highContrast
        ? 'bg-orange-500 text-white border-orange-400 font-extrabold shadow-sm'
        : darkMode
        ? 'bg-gradient-to-b from-[#c9822b] to-[#a16218] text-white border-[#fcd34d]/75 font-extrabold shadow-sm'
        : 'bg-gradient-to-b from-[#d4842a] to-[#b36818] text-white border-[#8c4f0e] font-extrabold shadow-sm';
    }
    if (status === 'absent') {
      return darkMode
        ? 'bg-[#1c152b]/90 text-[#86769e] border-[#33264a]/80 opacity-70'
        : 'bg-[#736785]/85 text-[#f3eff8] border-[#5b4f6b] opacity-80';
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
          className={`w-full h-11 sm:h-12 rounded-lg sm:rounded-xl border text-sm sm:text-base font-bold flex flex-col items-center justify-center transition-all active:scale-95 relative touch-manipulation select-none ${getKeyColor(
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
                  ? 'text-[#c4b5fd]/80'
                  : 'text-[#255c46]/80'
              }`}
            >
              {alts[0]}
            </span>
          )}
        </button>

        {/* Long-press / right-click alternates popover */}
        {activePopoverKey === char && hasAlts && (
          <div
            className={`absolute -top-13 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 p-1 rounded-xl border-2 shadow-xl ${
              darkMode
                ? 'bg-[#221638] border-[#6ee7b7]'
                : 'bg-[#f4effa] border-[#653699]'
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
                className={`w-9 h-9 rounded-lg font-extrabold text-sm flex items-center justify-center transition-colors ${
                  darkMode
                    ? 'bg-gradient-to-b from-[#237a5b] to-[#195c44] hover:from-[#2a8f6b] hover:to-[#1f6e52] text-white'
                    : 'bg-gradient-to-b from-[#5c328c] to-[#46236e] hover:from-[#6b3ba1] hover:to-[#532a82] text-white'
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
        {/* Enter key */}
        <button
          type="button"
          disabled={disabled}
          onClick={onEnter}
          aria-label="ثبت حدس کلمه"
          className={`flex-[1.5] max-w-[74px] h-11 sm:h-12 rounded-lg sm:rounded-xl border font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1 transition-all active:scale-95 touch-manipulation shrink-0 ${defaultKeyStyle}`}
        >
          <span>ثبت</span>
          <CornerDownLeft className="w-3.5 h-3.5 shrink-0" />
        </button>

        {ROW_3.map((char) => renderKey(char, 'max-w-[46px]'))}

        {/* Delete key */}
        <button
          type="button"
          disabled={disabled}
          onClick={onDelete}
          aria-label="حذف حرف آخر"
          className={`flex-[1.5] max-w-[74px] h-11 sm:h-12 rounded-lg sm:rounded-xl border font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1 transition-all active:scale-95 touch-manipulation shrink-0 ${defaultKeyStyle}`}
        >
          <Delete className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">حذف</span>
        </button>
      </div>
    </div>
  );
};
