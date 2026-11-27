import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  wordLength?: 4 | 5 | 6;
  lastPressedKey?: { key: string; seq: number } | null;
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

// Theme color tokens matching each selected game length (4 = Emerald, 5 = Purple, 6 = Amber)
const LENGTH_PULSE_THEMES: Record<
  4 | 5 | 6,
  {
    border: string;
    glow: string;
    ring: string;
    pulseRingClass: string;
  }
> = {
  4: {
    border: '#4ade80',
    glow: 'rgba(34, 197, 94, 0.85)',
    ring: 'rgba(74, 222, 128, 0.4)',
    pulseRingClass: 'ring-2 ring-[#4ade80] border-[#4ade80]',
  },
  5: {
    border: '#c084fc',
    glow: 'rgba(168, 85, 247, 0.85)',
    ring: 'rgba(192, 132, 252, 0.42)',
    pulseRingClass: 'ring-2 ring-[#c084fc] border-[#c084fc]',
  },
  6: {
    border: '#fbbf24',
    glow: 'rgba(245, 158, 11, 0.85)',
    ring: 'rgba(251, 191, 36, 0.42)',
    pulseRingClass: 'ring-2 ring-[#fbbf24] border-[#fbbf24]',
  },
};

const PULSE_DURATION_MS = 300;

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
  wordLength = 5,
  lastPressedKey = null,
}) => {
  const [activePopoverKey, setActivePopoverKey] = useState<string | null>(null);
  // Maps key identifier (Persian char, 'ENTER', or 'BACKSPACE') -> incrementing pulse counter
  const [pulsingKeys, setPulsingKeys] = useState<Record<string, number>>({});
  const pulseTimersRef = useRef<Record<string, number>>({});
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef<boolean>(false);
  const keyboardRef = useRef<HTMLDivElement | null>(null);

  const pulseTheme = LENGTH_PULSE_THEMES[wordLength] || LENGTH_PULSE_THEMES[5];

  const triggerKeyPulse = useCallback((rawKey: string) => {
    const normalized =
      rawKey === 'ENTER' || rawKey === 'BACKSPACE'
        ? rawKey
        : ALT_TO_BASE[rawKey] || rawKey;

    if (pulseTimersRef.current[normalized]) {
      window.clearTimeout(pulseTimersRef.current[normalized]);
    }

    setPulsingKeys((prev) => ({
      ...prev,
      [normalized]: (prev[normalized] || 0) + 1,
    }));

    pulseTimersRef.current[normalized] = window.setTimeout(() => {
      delete pulseTimersRef.current[normalized];
      setPulsingKeys((prev) => {
        if (!(normalized in prev)) return prev;
        const next = { ...prev };
        delete next[normalized];
        return next;
      });
    }, PULSE_DURATION_MS);
  }, []);

  // Trigger visual pulse when physical keyboard keys are pressed from App.tsx
  useEffect(() => {
    if (!lastPressedKey || !lastPressedKey.key) return;
    triggerKeyPulse(lastPressedKey.key);
  }, [lastPressedKey, triggerKeyPulse]);

  // Clean up any active key pulse timers on unmount
  useEffect(() => {
    return () => {
      Object.values(pulseTimersRef.current).forEach((timerId) => {
        window.clearTimeout(timerId);
      });
      pulseTimersRef.current = {};
    };
  }, []);

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
    triggerKeyPulse(char);
    onChar(char);
  };

  const handleEnterClick = () => {
    if (disabled) return;
    triggerKeyPulse('ENTER');
    onEnter();
  };

  const handleDeleteClick = () => {
    if (disabled) return;
    triggerKeyPulse('BACKSPACE');
    onDelete();
  };

  const pulseCssVars = {
    '--key-pulse-border': pulseTheme.border,
    '--key-pulse-glow': pulseTheme.glow,
    '--key-pulse-ring': pulseTheme.ring,
  } as React.CSSProperties;

  const renderKey = (char: string, maxWidthClass: string) => {
    const alts = ALTERNATES_MAP[char];
    const hasAlts = !!alts;
    const isPulsing = Boolean(pulsingKeys[char]);

    return (
      <div key={char} className={`relative flex-1 min-w-0 ${maxWidthClass}`}>
        <button
          type="button"
          disabled={disabled}
          data-key={char}
          data-pulsing={isPulsing ? 'true' : undefined}
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
          )} ${isPulsing ? `animate-key-pulse ${pulseTheme.pulseRingClass}` : ''}`}
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
                  triggerKeyPulse(char);
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

  const isEnterPulsing = Boolean(pulsingKeys['ENTER']);
  const isDeletePulsing = Boolean(pulsingKeys['BACKSPACE']);

  return (
    <div
      ref={keyboardRef}
      dir="ltr"
      role="region"
      aria-label="صفحه‌کلید فارسی کلمباز"
      data-theme-length={wordLength}
      style={pulseCssVars}
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
          data-key="ENTER"
          data-pulsing={isEnterPulsing ? 'true' : undefined}
          onClick={handleEnterClick}
          aria-label="ثبت حدس کلمه"
          className={`flex-[1.5] max-w-[74px] h-11 sm:h-12 rounded-lg sm:rounded-xl border font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1 transition-colors active:scale-95 touch-manipulation shrink-0 text-white relative ${
            darkMode
              ? 'bg-[#15803d] hover:bg-[#16a34a] border-[#22c55e]'
              : 'bg-[#6b21a8] hover:bg-[#7e22ce] border-[#9333ea]'
          } ${isEnterPulsing ? `animate-key-pulse ${pulseTheme.pulseRingClass}` : ''}`}
        >
          <span>ثبت</span>
          <CornerDownLeft className="w-3.5 h-3.5 shrink-0" />
        </button>

        {ROW_3.map((char) => renderKey(char, 'max-w-[46px]'))}

        {/* Delete key (Purple in Night Mode, Green in Day Mode) */}
        <button
          type="button"
          disabled={disabled}
          data-key="BACKSPACE"
          data-pulsing={isDeletePulsing ? 'true' : undefined}
          onClick={handleDeleteClick}
          aria-label="حذف حرف آخر"
          className={`flex-[1.5] max-w-[74px] h-11 sm:h-12 rounded-lg sm:rounded-xl border font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1 transition-colors active:scale-95 touch-manipulation shrink-0 text-white relative ${
            darkMode
              ? 'bg-[#6b21a8] hover:bg-[#7e22ce] border-[#9333ea]'
              : 'bg-[#15803d] hover:bg-[#16a34a] border-[#22c55e]'
          } ${isDeletePulsing ? `animate-key-pulse ${pulseTheme.pulseRingClass}` : ''}`}
        >
          <Delete className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">حذف</span>
        </button>
      </div>
    </div>
  );
};
