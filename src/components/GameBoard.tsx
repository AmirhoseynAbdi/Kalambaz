import React from 'react';
import { EvaluationResult, GameStatus } from '../types';
import { normalizePersian } from '../game/wordleLogic';

interface GameBoardProps {
  wordLength: 4 | 5 | 6;
  maxGuesses?: number;
  guesses: string[];
  evaluations: EvaluationResult[][];
  currentGuess: string;
  isShaking: boolean;
  gameStatus: GameStatus;
  darkMode: boolean;
  highContrast: boolean;
  targetWord?: string;
  revealedHints?: number[];
}

export const GameBoard: React.FC<GameBoardProps> = ({
  wordLength,
  maxGuesses = 6,
  guesses,
  evaluations,
  currentGuess,
  isShaking,
  gameStatus,
  darkMode,
  highContrast,
  targetWord = '',
  revealedHints = [],
}) => {
  const currentGuessChars = Array.from(currentGuess);
  const targetChars = Array.from(normalizePersian(targetWord));
  const rows = Array.from({ length: maxGuesses });

  const maxTilePx = wordLength === 6 ? 54 : wordLength === 5 ? 58 : 62;
  const tileDimension = `clamp(36px, min(calc((100vw - 44px) / ${wordLength}), calc((100dvh - 340px) / ${maxGuesses})), ${maxTilePx}px)`;

  return (
    <div
      role="grid"
      aria-label="جدول حدس کلمات کلمباز"
      className="flex flex-col items-center justify-center gap-1 sm:gap-1.5 my-auto max-w-full px-1.5"
    >
      {rows.map((_, rowIndex) => {
        const isSubmitted = rowIndex < guesses.length;
        const isCurrent = rowIndex === guesses.length;
        const rowEvaluation = evaluations[rowIndex] || [];
        const isWinningRow =
          isSubmitted && gameStatus === 'won' && rowIndex === guesses.length - 1;

        // Letters to display for this row
        const rowLetters: string[] = [];
        if (isSubmitted) {
          rowLetters.push(...Array.from(guesses[rowIndex]));
        } else if (isCurrent) {
          rowLetters.push(...currentGuessChars);
        }

        // Fill remaining empty cells for this row
        while (rowLetters.length < wordLength) {
          rowLetters.push('');
        }

        return (
          <div
            key={rowIndex}
            role="row"
            className={`flex items-center justify-center gap-1 sm:gap-1.5 transition-transform ${
              isCurrent && isShaking ? 'animate-tile-shake' : ''
            }`}
          >
            {rowLetters.map((letter, colIndex) => {
              const evalResult = rowEvaluation[colIndex];
              const status = evalResult ? evalResult.status : undefined;
              const isHintedGreen = !isSubmitted && revealedHints.includes(colIndex);
              const hintedChar = isHintedGreen ? targetChars[colIndex] || '' : '';
              const displayLetter = letter || (isCurrent && isHintedGreen ? hintedChar : '');

              // Flat, crisp styling using solid purple & green theme colors
              let bgClass = '';
              let borderClass = '';
              let textClass = '';

              if (status === 'correct') {
                bgClass = highContrast ? 'bg-[#16a34a]' : 'bg-[#15803d]';
                borderClass = highContrast ? 'border-[#22c55e]' : 'border-[#16a34a]';
                textClass = 'text-white font-black';
              } else if (status === 'present') {
                bgClass = highContrast ? 'bg-[#f97316]' : 'bg-[#ca8a04]';
                borderClass = highContrast ? 'border-[#fb923c]' : 'border-[#eab308]';
                textClass = 'text-white font-black';
              } else if (status === 'absent') {
                bgClass = darkMode ? 'bg-[#1b1429]' : 'bg-[#4b6355]';
                borderClass = darkMode ? 'border-[#2e2345]' : 'border-[#3a4f43]';
                textClass = darkMode ? 'text-[#8c7ca8] font-bold' : 'text-white font-bold';
              } else if (letter) {
                bgClass = darkMode ? 'bg-[#2b1f45]' : 'bg-[#dcfce7]';
                borderClass = darkMode ? 'border-[#22c55e]' : 'border-[#7e22ce]';
                textClass = darkMode ? 'text-white font-black' : 'text-[#14532d] font-black';
              } else if (isCurrent && isHintedGreen && hintedChar) {
                bgClass = darkMode ? 'bg-[#143d25]' : 'bg-[#bbf7d0]';
                borderClass = darkMode
                  ? 'border-[#4ade80] border-dashed'
                  : 'border-[#16a34a] border-dashed';
                textClass = darkMode
                  ? 'text-[#bbf7d0] font-black'
                  : 'text-[#14532d] font-black';
              } else {
                bgClass = darkMode ? 'bg-[#201733]' : 'bg-white';
                borderClass = darkMode ? 'border-[#3d2e5c]' : 'border-[#86efac]';
                textClass = 'text-transparent';
              }

              const fontSizeClass =
                wordLength === 6
                  ? 'text-lg sm:text-2xl'
                  : wordLength === 5
                  ? 'text-xl sm:text-2xl'
                  : 'text-xl sm:text-3xl';

              return (
                <div
                  key={colIndex}
                  role="gridcell"
                  aria-label={
                    letter
                      ? `حرف ${colIndex + 1}: ${letter}`
                      : isCurrent && isHintedGreen && hintedChar
                      ? `راهنمای حرف سبز ${colIndex + 1}: ${hintedChar}`
                      : `خانه خالی ${colIndex + 1}`
                  }
                  style={{
                    width: tileDimension,
                    height: tileDimension,
                    animationDelay: isWinningRow ? `${colIndex * 120}ms` : undefined,
                    transitionDelay: isSubmitted ? `${colIndex * 140}ms` : undefined,
                  }}
                  className={`relative flex items-center justify-center rounded-xl border-2 select-none transition-colors duration-200 ${fontSizeClass} ${bgClass} ${borderClass} ${textClass} ${
                    isCurrent && letter ? 'animate-tile-pop' : ''
                  } ${isWinningRow ? 'animate-tile-win' : ''}`}
                >
                  {isCurrent && isHintedGreen && (
                    <span
                      title={`حرف سبز راهنما: ${hintedChar}`}
                      className="absolute top-0.5 left-1 text-[9px] leading-none select-none pointer-events-none"
                    >
                      💡
                    </span>
                  )}
                  <span className="leading-none pt-0.5">{displayLetter}</span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
