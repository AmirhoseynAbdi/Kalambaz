import React, { useState, useEffect } from 'react';
import {
  X,
  Flame,
  Share2,
  Clock,
  Sparkles,
  Lightbulb,
} from 'lucide-react';
import { PlayerStats, WordEntry, EvaluationResult, GameStatus, DailyGameState } from '../../types';
import { calculateGuessPoints, HINT_COST } from '../../game/wordleLogic';
import { GreenSeedIcon } from '../GreenSeedIcon';
import { KALAMBAZ_SOCIALS, TelegramIcon, XSocialIcon } from '../SocialIcons';
import { ReferralCard } from '../ReferralCard';
import { StreakCalendar } from '../StreakCalendar';
import { getStreakTier, getStreakTierLabelFa } from '../../utils/streakCalendar';

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
  isLoggedIn?: boolean;
  username?: string;
  gameStates?: { [len: number]: DailyGameState };
  onOpenLogin?: () => void;
  onNotify?: (msg: string) => void;
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
  isLoggedIn = false,
  username,
  gameStates,
  onOpenLogin,
  onNotify,
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
  const totalPoints = Math.max(0, Number(stats.points) || 0);
  const wonPointsThisGame =
    gameStatus === 'won' ? calculateGuessPoints(guesses.length, true) : 0;

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

    const streakText = `🔥 استریک پیاپی: ${stats.currentStreak.toLocaleString('fa-IR')} روز | 🌱 بذر: ${totalPoints.toLocaleString('fa-IR')}`;
    const shareText = `${title}\n\n${emojiGrid}\n\n${streakText}\nکلمباز: بازی روزانه کلمات کلمی 🥦`;

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
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-[2px] animate-fade-in"
    >
      <div
        dir="ltr"
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md rounded-2xl p-5 sm:p-6 shadow-2xl overflow-y-auto max-h-[90vh] ${
          darkMode
            ? 'bg-[#211836] text-[#f5f3ff] shadow-black/50'
            : 'bg-white text-[#14532d] shadow-emerald-950/15'
        }`}
      >
        <div dir="rtl">
          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label="بستن پنجره"
            className={`absolute top-4 left-4 p-1.5 rounded-xl transition-colors ${
              darkMode
                ? 'bg-[#2e224b] text-[#d8b4fe] hover:text-white hover:bg-[#3c2d62]'
                : 'bg-[#eefaf2] text-[#166534] hover:text-[#14532d] hover:bg-[#dcfce7]'
            }`}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="text-center mb-4">
            <div
              className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-2 ${
                darkMode
                  ? 'bg-[#2e224b] text-[#c084fc]'
                  : 'bg-[#dcfce7] text-[#15803d]'
              }`}
            >
              <Flame className="w-6 h-6 fill-current" />
            </div>
            <h2 className="text-xl font-bold font-['Lalezar',sans-serif]">
              استریک، بذرها و کارنامه کلمباز
            </h2>
            <p
              className={`text-xs font-semibold mt-0.5 ${
                darkMode ? 'text-[#c4b5fd]' : 'text-[#166534]'
              }`}
            >
              ثبت روند پیشرفت، استریک روزانه و بذرهای راهنما
            </p>
          </div>

          {/* Total Seeds & Hint Cost Banner */}
          <div
            className={`mb-4 p-3.5 rounded-2xl flex items-center justify-between ${
              darkMode
                ? 'bg-[#163f2a] text-[#dcfce7]'
                : 'bg-[#f3e8ff] text-[#581c87]'
            }`}
          >
            <div className="flex items-center gap-2">
              <GreenSeedIcon className="w-5 h-5 shrink-0" />
              <div>
                <div className="text-xs font-extrabold">
                  موجودی بذر شما:{' '}
                  <span
                    className={`text-sm font-black ${
                      darkMode ? 'text-[#86efac]' : 'text-[#6b21a8]'
                    }`}
                  >
                    {totalPoints.toLocaleString('fa-IR')} بذر
                  </span>
                </div>
                <div
                  className={`text-[10px] font-bold ${
                    darkMode ? 'text-[#bbf7d0]' : 'text-[#6b21a8]'
                  }`}
                >
                  هر راهنمای حرف سبز: {HINT_COST.toLocaleString('fa-IR')} بذر
                </div>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold ${
                darkMode
                  ? 'bg-[#15803d] text-white'
                  : 'bg-[#7e22ce] text-white'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5 text-[#fde047] fill-[#fde047]" />
              <span>
                {Math.floor(totalPoints / HINT_COST).toLocaleString('fa-IR')} راهنما
              </span>
            </span>
          </div>

          {/* Word Reveal Card (when game completed) */}
          {gameStatus !== 'playing' && targetWord && (
            <div
              className={`mb-4 p-4 rounded-2xl text-center ${
                darkMode ? 'bg-[#2a1f45]' : 'bg-[#eefaf2]'
              }`}
            >
              <span
                className={`text-[11px] font-extrabold ${
                  darkMode ? 'text-[#86efac]' : 'text-[#15803d]'
                }`}
              >
                {gameStatus === 'won' ? '🎉 آفرین! کلمه امروز:' : 'کلمه امروز کلمباز:'}
              </span>
              <h3 className="text-2xl font-black font-['Lalezar',sans-serif] my-1 tracking-wide">
                {targetWord.word}
              </h3>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold ${
                    darkMode
                      ? 'bg-[#163f2a] text-[#a7f3d0]'
                      : 'bg-[#15803d] text-white'
                  }`}
                >
                  کلمه {wordLength.toLocaleString('fa-IR')} حرفی
                </span>
                {wonPointsThisGame > 0 && (
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold ${
                      darkMode
                        ? 'bg-[#15803d] text-white'
                        : 'bg-[#dcfce7] text-[#14532d]'
                    }`}
                  >
                    <GreenSeedIcon className="w-3 h-3" />
                    <span>+{wonPointsThisGame.toLocaleString('fa-IR')} بذر جایزه!</span>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Stats 4-Grid */}
          <div className="grid grid-cols-4 gap-2 text-center mb-4">
            <div
              className={`p-2.5 rounded-xl ${
                darkMode ? 'bg-[#2a1f45]' : 'bg-[#eefaf2]'
              }`}
            >
              <span
                className={`block text-xl sm:text-2xl font-black ${
                  darkMode ? 'text-[#d8b4fe]' : 'text-[#15803d]'
                }`}
              >
                {stats.gamesPlayed.toLocaleString('fa-IR')}
              </span>
              <span
                className={`text-[10px] font-bold ${
                  darkMode ? 'text-[#e9d5ff]' : 'text-[#14532d]'
                }`}
              >
                بازی‌ها
              </span>
            </div>

            <div
              className={`p-2.5 rounded-xl ${
                darkMode ? 'bg-[#163a2c]' : 'bg-[#dcfce7]'
              }`}
            >
              <span
                className={`block text-xl sm:text-2xl font-black ${
                  darkMode ? 'text-[#86efac]' : 'text-[#166534]'
                }`}
              >
                {winRate.toLocaleString('fa-IR')}٪
              </span>
              <span
                className={`text-[10px] font-bold ${
                  darkMode ? 'text-[#d1fae5]' : 'text-[#14532d]'
                }`}
              >
                درصد برد
              </span>
            </div>

            {(() => {
              const currentTier = getStreakTier(stats.currentStreak);
              const tierLabel = getStreakTierLabelFa(currentTier);
              const cardClass =
                currentTier === 'plasma'
                  ? 'animate-streak-plasma text-white'
                  : currentTier === 'diamond'
                  ? 'bg-gradient-to-br from-[#67e8f9] via-[#22d3ee] to-[#0284c7] text-[#082f49]'
                  : currentTier === 'gold'
                  ? 'bg-gradient-to-br from-[#fde047] via-[#f59e0b] to-[#d97706] text-[#1c1003]'
                  : currentTier === 'silver'
                  ? 'bg-gradient-to-br from-[#f8fafc] via-[#cbd5e1] to-[#94a3b8] text-[#0f172a]'
                  : currentTier === 'green'
                  ? darkMode
                    ? 'bg-[#164a2d] text-[#dcfce7]'
                    : 'bg-[#bbf7d0] text-[#14532d]'
                  : darkMode
                  ? 'bg-[#16422b]'
                  : 'bg-[#ede9fe]';
              const numClass =
                currentTier === 'plasma'
                  ? 'text-white'
                  : currentTier === 'diamond' || currentTier === 'gold' || currentTier === 'silver'
                  ? 'text-current'
                  : currentTier === 'green'
                  ? darkMode
                    ? 'text-[#4ade80]'
                    : 'text-[#15803d]'
                  : darkMode
                  ? 'text-[#86efac]'
                  : 'text-[#6b21a8]';

              return (
                <div className={`p-2.5 rounded-xl ${cardClass}`}>
                  <span className={`block text-xl sm:text-2xl font-black ${numClass}`}>
                    {stats.currentStreak.toLocaleString('fa-IR')}
                  </span>
                  <span className="text-[10px] font-extrabold block leading-tight">
                    {tierLabel ? `استریک ${tierLabel}` : 'استریک روزانه'}
                  </span>
                </div>
              );
            })()}

            <div
              className={`p-2.5 rounded-xl ${
                darkMode ? 'bg-[#262b45]' : 'bg-[#eefaf2]'
              }`}
            >
              <span
                className={`block text-xl sm:text-2xl font-black ${
                  darkMode ? 'text-[#c4b5fd]' : 'text-[#15803d]'
                }`}
              >
                {stats.maxStreak.toLocaleString('fa-IR')}
              </span>
              <span
                className={`text-[10px] font-bold ${
                  darkMode ? 'text-[#ddd6fe]' : 'text-[#14532d]'
                }`}
              >
                بیشترین
              </span>
            </div>
          </div>

          {/* Calendar View of Completed Daily Puzzles & Highlighted Long Streaks */}
          <StreakCalendar
            stats={stats}
            gameStates={gameStates}
            darkMode={darkMode}
          />

          {/* Note on Streak preservation */}
          <div
            className={`flex items-start gap-2 p-3 rounded-xl text-[11px] font-semibold leading-relaxed mb-4 ${
              darkMode
                ? 'bg-[#17362b] text-[#d1fae5]'
                : 'bg-[#dcfce7] text-[#14532d]'
            }`}
          >
            <Sparkles
              className={`w-4 h-4 shrink-0 mt-0.5 ${
                darkMode ? 'text-[#86efac]' : 'text-[#15803d]'
              }`}
            />
            <span>
              <strong>جدول پاداش بذرها:</strong> هرچه در حدس‌های کمتری کلمه را پیدا کنید، بذر بیشتری می‌گیرید (حدس اول: {calculateGuessPoints(1, true).toLocaleString('fa-IR')} بذر تا حدس ششم: {calculateGuessPoints(6, true).toLocaleString('fa-IR')} بذر).
            </span>
          </div>

          {/* Guess Distribution Bars */}
          <div className="mb-5">
            <h4 className="text-xs font-extrabold mb-2.5">
              توزیع تعداد حدس‌ها و پاداش هر مرحله:
            </h4>
            <div className="space-y-1.5 text-xs">
              {[1, 2, 3, 4, 5, 6].map((attemptNum) => {
                const count = stats.guessDistribution[attemptNum] || 0;
                const percentage = Math.round((count / maxGuessesCount) * 100);
                const isCurrentAttempt =
                  gameStatus === 'won' && guesses.length === attemptNum;
                const isEvenBar = attemptNum % 2 === 0;
                const ptsForAttempt = calculateGuessPoints(attemptNum, true);

                return (
                  <div key={attemptNum} className="flex items-center gap-2">
                    <span className="w-4 text-center font-extrabold text-xs">
                      {attemptNum.toLocaleString('fa-IR')}
                    </span>
                    <div
                      className={`flex-1 rounded-lg overflow-hidden h-5 flex items-center ${
                        darkMode ? 'bg-[#171126]' : 'bg-[#dff5e7]'
                      }`}
                    >
                      <div
                        style={{ width: `${Math.max(8, percentage)}%` }}
                        className={`h-full flex items-center justify-end px-2 text-[11px] font-extrabold text-white transition-all duration-300 ${
                          isCurrentAttempt
                            ? darkMode
                              ? 'bg-[#16a34a]'
                              : 'bg-[#7e22ce]'
                            : count > 0
                            ? isEvenBar
                              ? darkMode
                                ? 'bg-[#7e22ce]'
                                : 'bg-[#15803d]'
                              : darkMode
                              ? 'bg-[#15803d]'
                              : 'bg-[#7e22ce]'
                            : darkMode
                            ? 'bg-[#2e224b] text-[#c4b5fd]'
                            : 'bg-[#bbf7d0] text-[#14532d]'
                        }`}
                      >
                        {count.toLocaleString('fa-IR')}
                      </div>
                    </div>
                    <span
                      className={`w-[68px] whitespace-nowrap text-left font-mono text-[10px] font-extrabold shrink-0 ${
                        darkMode ? 'text-[#bef264]' : 'text-[#6b21a8]'
                      }`}
                    >
                      +{ptsForAttempt.toLocaleString('fa-IR')} بذر
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Referral Link Card (+100 Seeds per Successful Invite) */}
          <div className="mb-4">
            <ReferralCard
              username={isLoggedIn ? username : undefined}
              referralsCount={stats.referralsCount || 0}
              referralPointsEarned={stats.referralPointsEarned || 0}
              darkMode={darkMode}
              onOpenLogin={
                onOpenLogin
                  ? () => {
                      onClose();
                      onOpenLogin();
                    }
                  : undefined
              }
              onNotify={onNotify}
              compact
            />
          </div>

          {/* Social Channels Strip (Telegram & X) */}
          <div
            className={`mb-4 p-3.5 rounded-2xl ${
              darkMode
                ? 'bg-[#171126] text-[#f5f3ff]'
                : 'bg-[#eefaf2] text-[#14532d]'
            }`}
          >
            <div className="text-[11px] font-extrabold text-center mb-2">
              کلمباز را در تلگرام و ایکس دنبال کنید:
            </div>
            <div className="grid grid-cols-2 gap-2">
              <a
                href={KALAMBAZ_SOCIALS.telegram.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-extrabold transition-colors"
              >
                <TelegramIcon className="w-3.5 h-3.5 shrink-0" />
                <span dir="ltr" className="font-mono text-[11px] truncate">
                  {KALAMBAZ_SOCIALS.telegram.handle}
                </span>
              </a>
              <a
                href={KALAMBAZ_SOCIALS.x.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] text-white text-xs font-extrabold transition-colors"
              >
                <XSocialIcon className="w-3.5 h-3.5 shrink-0" />
                <span dir="ltr" className="font-mono text-[11px] truncate">
                  {KALAMBAZ_SOCIALS.x.handle}
                </span>
              </a>
            </div>
          </div>

          {/* Footer: Countdown & Share */}
          <div
            className={`pt-3.5 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${
              darkMode ? 'border-white/8' : 'border-emerald-950/8'
            }`}
          >
            <div
              className={`flex items-center gap-2 text-xs font-bold ${
                darkMode ? 'text-[#d8c7f0]' : 'text-[#14532d]'
              }`}
            >
              <Clock
                className={`w-4 h-4 ${
                  darkMode ? 'text-[#86efac]' : 'text-[#6b21a8]'
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
                className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-white font-extrabold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-colors shadow-sm ${
                  darkMode
                    ? 'bg-[#16a34a] hover:bg-[#15803d]'
                    : 'bg-[#7e22ce] hover:bg-[#6b21a8]'
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
