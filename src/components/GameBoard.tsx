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
      className="flex flex-col items-center justify-center gap-1.5 sm:gap-2 my-auto max-w-full px-1.5"
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
            className={`flex items-center justify-center gap-1.5 sm:gap-2 transition-transform ${
              isCurrent && isShaking ? 'animate-tile-shake' : ''
            }`}
          >
            {rowLetters.map((letter, colIndex) => {
              const evalResult = rowEvaluation[colIndex];
              const status = evalResult ? evalResult.status : undefined;
              const isHintedGreen = !isSubmitted && revealedHints.includes(colIndex);
              const hintedChar = isHintedGreen ? targetChars[colIndex] || '' : '';
              const displayLetter = letter || (isCurrent && isHintedGreen ? hintedChar : '');

              // Clean borderless tonal fills — states are distinguished by rich background contrast
              let tileStyleClass = '';

              if (status === 'correct') {
                tileStyleClass = highContrast
                  ? 'bg-[#16a34a] text-white font-black shadow-sm'
                  : 'bg-[#15803d] text-white font-black shadow-sm';
              } else if (status === 'present') {
                tileStyleClass = highContrast
                  ? 'bg-[#f97316] text-white font-black shadow-sm'
                  : 'bg-[#ca8a04] text-white font-black shadow-sm';
              } else if (status === 'absent') {
                tileStyleClass = darkMode
                  ? 'bg-[#1b142c] text-[#7c6d99] font-bold'
                  : 'bg-[#566d60] text-white font-bold';
              } else if (letter) {
                tileStyleClass = darkMode
                  ? 'bg-[#36285a] text-white font-black shadow-sm'
                  : 'bg-[#ede9fe] text-[#4c1d95] font-black shadow-xs';
              } else if (isCurrent && isHintedGreen && hintedChar) {
                tileStyleClass = darkMode
                  ? 'bg-[#15452b] text-[#bbf7d0] font-black ring-1 ring-inset ring-[#4ade80]/55'
                  : 'bg-[#bbf7d0] text-[#14532d] font-black ring-1 ring-inset ring-[#16a34a]/50';
              } else if (isCurrent) {
                tileStyleClass = darkMode
                  ? 'bg-[#261c3f] text-transparent'
                  : 'bg-[#ffffff] text-transparent shadow-xs shadow-emerald-950/5';
              } else {
                tileStyleClass = darkMode
                  ? 'bg-[#201735] text-transparent'
                  : 'bg-[#dcf3e5] text-transparent';
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
                  className={`relative flex items-center justify-center rounded-xl select-none transition-colors duration-200 ${fontSizeClass} ${tileStyleClass} ${
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
