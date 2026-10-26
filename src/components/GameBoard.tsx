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

  return (
    <div
      role="grid"
      aria-label="جدول حدس کلمات کلمباز"
      className="flex flex-col items-center justify-center gap-1.5 sm:gap-2 my-auto max-w-full px-2"
    >
      {rows.map((_, rowIndex) => {
        const isSubmitted = rowIndex < guesses.length;
        const isCurrent = rowIndex === guesses.length;
        const rowEvaluation = evaluations[rowIndex] || [];
        const isWinningRow = isSubmitted && gameStatus === 'won' && rowIndex === guesses.length - 1;

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
            className={`flex items-center justify-center gap-1.5 sm:gap-2 transition-transform ${
              isCurrent && isShaking ? 'animate-tile-shake' : ''
            }`}
          >
            {rowLetters.map((letter, colIndex) => {
              const evalResult = rowEvaluation[colIndex];
              const status = evalResult ? evalResult.status : undefined;

              // Compute styling based on tile status
              let bgClass = '';
              let borderClass = '';
              let textClass = '';
              let shadowClass = '';

              if (status === 'correct') {
                bgClass = highContrast ? 'bg-emerald-500' : 'bg-emerald-600';
                borderClass = 'border-emerald-500';
                textClass = 'text-white font-black';
                shadowClass = 'shadow-md shadow-emerald-950/30';
              } else if (status === 'present') {
                bgClass = highContrast ? 'bg-orange-500' : 'bg-amber-500';
                borderClass = 'border-amber-400';
                textClass = 'text-white font-black';
                shadowClass = 'shadow-md shadow-amber-950/30';
              } else if (status === 'absent') {
                bgClass = darkMode ? 'bg-neutral-800' : 'bg-neutral-400';
                borderClass = darkMode ? 'border-neutral-700' : 'border-neutral-400';
                textClass = 'text-white/90 font-bold';
              } else if (letter) {
                // Currently typed letter
                bgClass = darkMode ? 'bg-purple-950/50' : 'bg-purple-50';
                borderClass = darkMode ? 'border-purple-400' : 'border-purple-600';
                textClass = darkMode ? 'text-purple-100 font-extrabold' : 'text-purple-900 font-extrabold';
              } else {
                // Empty placeholder
                bgClass = darkMode ? 'bg-purple-950/20' : 'bg-white/40';
                borderClass = darkMode ? 'border-purple-900/60' : 'border-emerald-200/80';
                textClass = 'text-transparent';
              }

              // Dynamic sizing based on word length to fit mobile viewports
              const sizeClasses =
                wordLength === 6
                  ? 'w-10 h-11 sm:w-13 sm:h-14 text-lg sm:text-2xl'
                  : wordLength === 5
                  ? 'w-12 h-12 sm:w-14 sm:h-15 text-xl sm:text-2xl'
                  : 'w-14 h-13 sm:w-16 sm:h-16 text-2xl sm:text-3xl';

              return (
                <div
                  key={colIndex}
                  role="gridcell"
                  aria-label={letter ? `حرف ${colIndex + 1}: ${letter}` : `خانه خالی ${colIndex + 1}`}
                  style={{
                    animationDelay: isWinningRow ? `${colIndex * 120}ms` : undefined,
                    transitionDelay: isSubmitted ? `${colIndex * 140}ms` : undefined,
                  }}
                  className={`relative flex items-center justify-center rounded-xl border-2 select-none transition-all duration-300 ${sizeClasses} ${bgClass} ${borderClass} ${textClass} ${shadowClass} ${
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
