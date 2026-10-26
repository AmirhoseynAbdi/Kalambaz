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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div
        dir="ltr"
        className="relative w-full max-w-md rounded-2xl bg-neutral-900 border border-purple-500/40 p-5 sm:p-6 text-white shadow-2xl overflow-y-auto max-h-[90vh]"
      >
        <div dir="rtl">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="بستن پنجره"
          className="absolute top-4 left-4 p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 mb-2 border border-amber-500/30">
            <Flame className="w-6 h-6 fill-amber-400" />
          </div>
          <h2 className="text-xl font-bold font-['Lalezar',sans-serif]">
            کارنامه و آمار کلمباز
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            ثبت روند پیشرفت و استریک روزانه
          </p>
        </div>

        {/* Word Reveal Card (when game completed) */}
        {gameStatus !== 'playing' && targetWord && (
          <div className="mb-5 p-4 rounded-xl bg-gradient-to-br from-purple-950/80 to-emerald-950/80 border border-purple-500/40 text-center">
            <span className="text-[11px] font-semibold text-emerald-300">
              {gameStatus === 'won' ? '🎉 آفرین! کلمه امروز:' : 'کلمه امروز کلمباز:'}
            </span>
            <h3 className="text-2xl font-black text-white font-['Lalezar',sans-serif] my-1 tracking-wide">
              {targetWord.word}
            </h3>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-purple-900/80 text-[10px] text-purple-200 border border-purple-700 font-bold">
                کلمه {wordLength.toLocaleString('fa-IR')} حرفی
              </span>
              {targetWord.id && (
                <span
                  dir="ltr"
                  className="inline-block px-2 py-0.5 rounded-full bg-black/50 text-[10px] font-mono text-emerald-300 border border-emerald-700/60 font-bold"
                >
                  #{targetWord.id}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Stats 4-Grid */}
        <div className="grid grid-cols-4 gap-2 text-center mb-5">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <span className="block text-xl sm:text-2xl font-black text-emerald-400">
              {stats.gamesPlayed.toLocaleString('fa-IR')}
            </span>
            <span className="text-[10px] text-neutral-400">بازی‌ها</span>
          </div>

          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <span className="block text-xl sm:text-2xl font-black text-purple-300">
              {winRate.toLocaleString('fa-IR')}٪
            </span>
            <span className="text-[10px] text-neutral-400">درصد برد</span>
          </div>

          <div className="p-2.5 rounded-xl bg-gradient-to-b from-amber-950/40 to-neutral-900 border border-amber-500/30">
            <span className="block text-xl sm:text-2xl font-black text-amber-400">
              {stats.currentStreak.toLocaleString('fa-IR')}
            </span>
            <span className="text-[10px] text-amber-200/80 font-bold">استریک روزانه</span>
          </div>

          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <span className="block text-xl sm:text-2xl font-black text-teal-300">
              {stats.maxStreak.toLocaleString('fa-IR')}
            </span>
            <span className="text-[10px] text-neutral-400">بیشترین</span>
          </div>
        </div>

        {/* Note on Streak preservation */}
        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-emerald-200 leading-relaxed mb-5">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            <strong>ویژگی کلمباز:</strong> استریک روزانه با صرفاً بازی کردن در هر روز حفظ و زیاد می‌شود، حتی اگر در پیدا کردن کلمه روز موفق نشوید!
          </span>
        </div>

        {/* Guess Distribution Bars */}
        <div className="mb-5">
          <h4 className="text-xs font-bold text-neutral-300 mb-2.5">
            توزیع تعداد حدس‌ها:
          </h4>
          <div className="space-y-1.5 text-xs">
            {[1, 2, 3, 4, 5, 6].map((attemptNum) => {
              const count = stats.guessDistribution[attemptNum] || 0;
              const percentage = Math.round((count / maxGuessesCount) * 100);
              const isCurrentAttempt =
                gameStatus === 'won' && guesses.length === attemptNum;

              return (
                <div key={attemptNum} className="flex items-center gap-2">
                  <span className="w-4 text-center font-bold text-neutral-400 text-xs">
                    {attemptNum.toLocaleString('fa-IR')}
                  </span>
                  <div className="flex-1 bg-white/5 rounded-md overflow-hidden h-5 flex items-center">
                    <div
                      style={{ width: `${Math.max(8, percentage)}%` }}
                      className={`h-full flex items-center justify-end px-2 text-[11px] font-bold text-white transition-all duration-500 ${
                        isCurrentAttempt
                          ? 'bg-gradient-to-r from-emerald-500 to-purple-600'
                          : count > 0
                          ? 'bg-neutral-700'
                          : 'bg-neutral-800 text-neutral-500'
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
        <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <Clock className="w-4 h-4 text-purple-400" />
            <span>کلمه جدید تا:</span>
            <span className="font-mono font-bold text-white tracking-widest">
              {timeLeft}
            </span>
          </div>

          {gameStatus !== 'playing' && (
            <button
              onClick={handleShare}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
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
