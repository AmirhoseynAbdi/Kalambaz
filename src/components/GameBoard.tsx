import React from 'react';
import { EvaluationResult, GameStatus } from '../types';

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
}) => {
  const currentGuessChars = Array.from(currentGuess);
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

              // Compute styling based on tile status using soothing shades of green & purple
              let bgClass = '';
              let borderClass = '';
              let textClass = '';
              let shadowClass = '';

              if (status === 'correct') {
                bgClass = highContrast
                  ? 'bg-emerald-500'
                  : darkMode
                  ? 'bg-gradient-to-br from-[#217a5c] to-[#175943]'
                  : 'bg-gradient-to-br from-[#258060] to-[#1b634a]';
                borderClass = darkMode ? 'border-[#6ee7b7]/80' : 'border-[#144d39]';
                textClass = 'text-white font-black';
                shadowClass = 'shadow-md shadow-emerald-950/25';
              } else if (status === 'present') {
                bgClass = highContrast
                  ? 'bg-orange-500'
                  : darkMode
                  ? 'bg-gradient-to-br from-[#c9822b] to-[#a16218]'
                  : 'bg-gradient-to-br from-[#d4842a] to-[#b36818]';
                borderClass = darkMode ? 'border-[#fcd34d]/80' : 'border-[#8c4f0e]';
                textClass = 'text-white font-black';
                shadowClass = 'shadow-md shadow-amber-950/25';
              } else if (status === 'absent') {
                bgClass = darkMode
                  ? 'bg-gradient-to-br from-[#261d36] to-[#1d2928]'
                  : 'bg-gradient-to-br from-[#756887] to-[#5e736b]';
                borderClass = darkMode ? 'border-[#43345c]' : 'border-[#544866]';
                textClass = darkMode
                  ? 'text-[#b5a8c9] font-bold'
                  : 'text-[#f5f2f9] font-bold';
              } else if (letter) {
                bgClass = darkMode
                  ? 'bg-gradient-to-br from-[#342252] to-[#1d3d35]'
                  : 'bg-gradient-to-br from-[#f3ecfa] to-[#e4f5ec]';
                borderClass = darkMode ? 'border-[#6ee7b7]' : 'border-[#683b9e]';
                textClass = darkMode
                  ? 'text-[#bbf7d0] font-black'
                  : 'text-[#391a5e] font-black';
                shadowClass = darkMode
                  ? 'shadow-sm shadow-emerald-500/20'
                  : 'shadow-sm shadow-purple-700/15';
              } else {
                // Alternating subtle green & purple shades by row/col for a soft, eye-friendly board
                const isEvenCell = (rowIndex + colIndex) % 2 === 0;
                bgClass = darkMode
                  ? isEvenCell
                    ? 'bg-[#241838]/85'
                    : 'bg-[#192e29]/85'
                  : isEvenCell
                  ? 'bg-[#e3f2ea]/90'
                  : 'bg-[#ebe4f5]/90';
                borderClass = darkMode
                  ? isEvenCell
                    ? 'border-[#523b78]/70'
                    : 'border-[#2f6b5b]/70'
                  : isEvenCell
                  ? 'border-[#82b59d]/75'
                  : 'border-[#a58fd1]/75';
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
                      : `خانه خالی ${colIndex + 1}`
                  }
                  style={{
                    width: tileDimension,
                    height: tileDimension,
                    animationDelay: isWinningRow ? `${colIndex * 120}ms` : undefined,
                    transitionDelay: isSubmitted ? `${colIndex * 140}ms` : undefined,
                  }}
                  className={`relative flex items-center justify-center rounded-xl border-2 select-none transition-all duration-300 ${fontSizeClass} ${bgClass} ${borderClass} ${textClass} ${shadowClass} ${
                    isCurrent && letter ? 'animate-tile-pop' : ''
                  } ${isWinningRow ? 'animate-tile-win' : ''}`}
                >
                  <span className="leading-none pt-0.5">{letter}</span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
