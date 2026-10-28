import React, { useState, useEffect } from 'react';
import {
  X,
  Flame,
  Award,
  Share2,
  Clock,
  Sparkles,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { PlayerStats, WordEntry, EvaluationResult, GameStatus } from '../../types';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PlayerStats;
  targetWord?: WordEntry;
  gameStatus: GameStatus;
  guesses: string[];
  evaluations: EvaluationResult[][];
  wordLength: 4 | 5 | 6;
  hardMode: boolean;
  darkMode?: boolean;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  stats,
  targetWord,
  gameStatus,
  guesses,
  evaluations,
  wordLength,
  hardMode,
  darkMode = true,
}) => {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  // Calculate countdown to midnight
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diffMs = midnight.getTime() - now.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      setTimeLeft(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!isOpen) return null;

  const winRate =
    stats.gamesPlayed > 0
      ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
      : 0;

  // Max count for distribution scale
  const maxGuessesCount = Math.max(
    1,
    ...Object.values(stats.guessDistribution || {})
  );

  const handleShare = () => {
    const title = `کلمباز (${wordLength.toLocaleString('fa-IR')} حرفی) ${
      gameStatus === 'won' ? `${guesses.length.toLocaleString('fa-IR')}/۶` : 'ناموفق'
    }${hardMode ? ' ⚡' : ''}`;

    const emojiGrid = evaluations
      .map((row) =>
        row
          .map((item) => {
            if (item.status === 'correct') return '🟩';
            if (item.status === 'present') return '🟨';
            return '⬛';
          })
          .join('')
      )
      .join('\n');

    const streakText = `🔥 استریک پیاپی: ${stats.currentStreak.toLocaleString('fa-IR')} روز`;
    const shareText = `${title}\n\n${emojiGrid}\n\n${streakText}\nکلمباز: بازی روزانه کلمات کلمی 🥬`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="آمار و کارنامه کلمباز"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
    >
      <div
        dir="ltr"
        className={`relative w-full max-w-md rounded-2xl border-2 p-5 sm:p-6 shadow-2xl overflow-y-auto max-h-[90vh] ${
          darkMode
            ? 'bg-gradient-to-br from-[#23173b] via-[#1d2236] to-[#152b26] border-[#543c7d]/75 text-[#f2edfa]'
            : 'bg-gradient-to-br from-[#e6f3ec] via-[#eef6f1] to-[#ece4f6] border-[#82b59d] text-[#17382b]'
        }`}
      >
        <div dir="rtl">
          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label="بستن پنجره"
            className={`absolute top-4 left-4 p-1 rounded-lg transition-colors ${
              darkMode
                ? 'text-[#d8b4fe] hover:text-white hover:bg-[#31214f]/60'
                : 'text-[#215c46] hover:text-[#123628] hover:bg-[#cfe5da]/60'
            }`}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="text-center mb-5">
            <div
              className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-2 border-2 ${
                darkMode
                  ? 'bg-gradient-to-br from-[#173830] to-[#2a1c42] text-[#86efac] border-[#48967c]/70'
                  : 'bg-gradient-to-br from-[#ebe3f6] to-[#dfeee6] text-[#5c328c] border-[#9b7ec7]'
              }`}
            >
              <Flame className="w-6 h-6 fill-current" />
            </div>
            <h2 className="text-xl font-bold font-['Lalezar',sans-serif]">
              کارنامه و آمار کلمباز
            </h2>
            <p
              className={`text-xs font-semibold mt-0.5 ${
                darkMode ? 'text-[#d8c7f0]' : 'text-[#215c46]'
              }`}
            >
              ثبت روند پیشرفت و استریک روزانه
            </p>
          </div>

          {/* Word Reveal Card (when game completed) */}
          {gameStatus !== 'playing' && targetWord && (
            <div
              className={`mb-5 p-4 rounded-xl border-2 text-center ${
                darkMode
                  ? 'bg-gradient-to-r from-[#281b40]/85 via-[#17362e]/85 to-[#281b40]/85 border-[#529980]/70'
                  : 'bg-gradient-to-r from-[#dfeee6] via-[#f1ebf9] to-[#dfeee6] border-[#8e73ba]'
              }`}
            >
              <span
                className={`text-[11px] font-extrabold ${
                  darkMode ? 'text-[#86efac]' : 'text-[#5c328c]'
                }`}
              >
                {gameStatus === 'won' ? '🎉 آفرین! کلمه امروز:' : 'کلمه امروز کلمباز:'}
              </span>
              <h3 className="text-2xl font-black font-['Lalezar',sans-serif] my-1 tracking-wide">
                {targetWord.word}
              </h3>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] border font-extrabold ${
                    darkMode
                      ? 'bg-[#173830] text-[#a7f3d0] border-[#428f76]'
                      : 'bg-[#5c328c] text-white border-[#482373]'
                  }`}
                >
                  کلمه {wordLength.toLocaleString('fa-IR')} حرفی
                </span>
                {targetWord.id && (
                  <span
                    dir="ltr"
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-mono border font-extrabold ${
                      darkMode
                        ? 'bg-[#2e1f47] text-[#e9d5ff] border-[#5e438c]'
                        : 'bg-[#f4f0fa] text-[#482373] border-[#9b7ec7]'
                    }`}
                  >
                    #{targetWord.id}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Stats 4-Grid using alternating shades of green and purple */}
          <div className="grid grid-cols-4 gap-2 text-center mb-5">
            <div
              className={`p-2.5 rounded-xl border ${
                darkMode
                  ? 'bg-[#281b40]/80 border-[#583e85]/70'
                  : 'bg-[#dfeee6]/90 border-[#82b59d]/75'
              }`}
            >
              <span
                className={`block text-xl sm:text-2xl font-black ${
                  darkMode ? 'text-[#d8b4fe]' : 'text-[#1c5942]'
                }`}
              >
                {stats.gamesPlayed.toLocaleString('fa-IR')}
              </span>
              <span
                className={`text-[10px] font-bold ${
                  darkMode ? 'text-[#e9d5ff]' : 'text-[#17382b]'
                }`}
              >
                بازی‌ها
              </span>
            </div>

            <div
              className={`p-2.5 rounded-xl border ${
                darkMode
                  ? 'bg-[#17362f]/80 border-[#387d68]/70'
                  : 'bg-[#ebe3f6]/90 border-[#a58fd1]/75'
              }`}
            >
              <span
                className={`block text-xl sm:text-2xl font-black ${
                  darkMode ? 'text-[#86efac]' : 'text-[#5c328c]'
                }`}
              >
                {winRate.toLocaleString('fa-IR')}٪
              </span>
              <span
                className={`text-[10px] font-bold ${
                  darkMode ? 'text-[#d1fae5]' : 'text-[#351857]'
                }`}
              >
                درصد برد
              </span>
            </div>

            <div
              className={`p-2.5 rounded-xl border-2 ${
                darkMode
                  ? 'bg-gradient-to-b from-[#193d33]/85 to-[#2a1c42]/85 border-[#6ee7b7]/70'
                  : 'bg-gradient-to-b from-[#ebe2f7] to-[#dfeee6] border-[#7c56b8]'
              }`}
            >
              <span
                className={`block text-xl sm:text-2xl font-black ${
                  darkMode ? 'text-[#a7f3d0]' : 'text-[#482373]'
                }`}
              >
                {stats.currentStreak.toLocaleString('fa-IR')}
              </span>
              <span
                className={`text-[10px] font-extrabold ${
                  darkMode ? 'text-[#e9d5ff]' : 'text-[#1c5942]'
                }`}
              >
                استریک روزانه
              </span>
            </div>

            <div
              className={`p-2.5 rounded-xl border ${
                darkMode
                  ? 'bg-[#22283d]/80 border-[#4d6382]/70'
                  : 'bg-[#e4eef2]/90 border-[#88b0bd]/75'
              }`}
            >
              <span
                className={`block text-xl sm:text-2xl font-black ${
                  darkMode ? 'text-[#c4b5fd]' : 'text-[#215c46]'
                }`}
              >
                {stats.maxStreak.toLocaleString('fa-IR')}
              </span>
              <span
                className={`text-[10px] font-bold ${
                  darkMode ? 'text-[#ddd6fe]' : 'text-[#17382b]'
                }`}
              >
                بیشترین
              </span>
            </div>
          </div>

          {/* Note on Streak preservation */}
          <div
            className={`flex items-start gap-2 p-2.5 rounded-xl border text-[11px] font-semibold leading-relaxed mb-5 ${
              darkMode
                ? 'bg-[#17362e]/65 border-[#428f76]/60 text-[#d1fae5]'
                : 'bg-[#ebe3f6] border-[#9b7ec7] text-[#351857]'
            }`}
          >
            <Sparkles
              className={`w-4 h-4 shrink-0 mt-0.5 ${
                darkMode ? 'text-[#86efac]' : 'text-[#5c328c]'
              }`}
            />
            <span>
              <strong>ویژگی کلمباز:</strong> استریک روزانه با صرفاً بازی کردن در هر روز حفظ و زیاد می‌شود، حتی اگر در پیدا کردن کلمه روز موفق نشوید!
            </span>
          </div>

          {/* Guess Distribution Bars using alternating green & purple shades */}
          <div className="mb-5">
            <h4 className="text-xs font-extrabold mb-2.5">
              توزیع تعداد حدس‌ها:
            </h4>
            <div className="space-y-1.5 text-xs">
              {[1, 2, 3, 4, 5, 6].map((attemptNum) => {
                const count = stats.guessDistribution[attemptNum] || 0;
                const percentage = Math.round((count / maxGuessesCount) * 100);
                const isCurrentAttempt =
                  gameStatus === 'won' && guesses.length === attemptNum;
                const isEvenBar = attemptNum % 2 === 0;

                return (
                  <div key={attemptNum} className="flex items-center gap-2">
                    <span className="w-4 text-center font-extrabold text-xs">
                      {attemptNum.toLocaleString('fa-IR')}
                    </span>
                    <div
                      className={`flex-1 rounded-md overflow-hidden h-5 flex items-center ${
                        darkMode ? 'bg-[#1a122b]/90' : 'bg-[#d8ece2]/85'
                      }`}
                    >
                      <div
                        style={{ width: `${Math.max(8, percentage)}%` }}
                        className={`h-full flex items-center justify-end px-2 text-[11px] font-extrabold text-white transition-all duration-500 ${
                          isCurrentAttempt
                            ? darkMode
                              ? 'bg-gradient-to-r from-[#237a5b] to-[#349475]'
                              : 'bg-gradient-to-r from-[#5c328c] to-[#7142a6]'
                            : count > 0
                            ? darkMode
                              ? isEvenBar
                                ? 'bg-[#4e3578]'
                                : 'bg-[#21664d]'
                              : isEvenBar
                              ? 'bg-[#267359]'
                              : 'bg-[#684299]'
                            : darkMode
                            ? isEvenBar
                              ? 'bg-[#2d1e47] text-[#c4b5fd]'
                              : 'bg-[#193b32] text-[#a7f3d0]'
                            : isEvenBar
                            ? 'bg-[#6c4f96]/75 text-white'
                            : 'bg-[#357a62]/75 text-white'
                        }`}
                      >
                        {count.toLocaleString('fa-IR')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer: Countdown & Share */}
          <div
            className={`pt-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${
              darkMode ? 'border-[#4c3773]/60' : 'border-[#86b8a1]/60'
            }`}
          >
            <div
              className={`flex items-center gap-2 text-xs font-bold ${
                darkMode ? 'text-[#d8c7f0]' : 'text-[#1c4233]'
              }`}
            >
              <Clock
                className={`w-4 h-4 ${
                  darkMode ? 'text-[#86efac]' : 'text-[#5c328c]'
                }`}
              />
              <span>کلمه جدید تا:</span>
              <span className="font-mono font-extrabold tracking-widest">
                {timeLeft}
              </span>
            </div>

            {gameStatus !== 'playing' && (
              <button
                onClick={handleShare}
                className={`w-full sm:w-auto px-4 py-2 rounded-xl text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all ${
                  darkMode
                    ? 'bg-gradient-to-r from-[#237a5b] to-[#3f2b69] hover:from-[#298f6b] hover:to-[#4c357d]'
                    : 'bg-gradient-to-r from-[#5c328c] to-[#266b52] hover:from-[#6b3ba1] hover:to-[#2d7d60]'
                }`}
              >
                <Share2 className="w-4 h-4" />
                <span>{copied ? 'کپی شد! 🎉' : 'اشتراک‌گذاری نتیجه'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
