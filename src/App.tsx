/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { DAILY_WORDS, ELIGIBLE_WORDS } from './data/wordLists';
import {
  GameStatus,
  PlayerStats,
  UserAccount,
  AppSettings,
  DailyGameState,
} from './types';
import {
  normalizePersian,
  evaluateGuess,
  validateHardMode,
  updateDailyStreak,
  getDailyWord,
  getTodayDateString,
  isWordInVocabulary,
} from './game/wordleLogic';
import {
  playKeySound,
  playFlipSound,
  playErrorSound,
  playWinSound,
} from './utils/audio';
import {
  apiFetchCurrentUser,
  apiSyncUserData,
  setSessionToken,
} from './utils/api';

import { Header } from './components/Header';
import { GameBoard } from './components/GameBoard';
import { PersianKeyboard } from './components/PersianKeyboard';
import { AdBanner } from './components/AdBanner';
import { DesktopDashboard } from './components/DesktopDashboard';
import { DesktopSponsorPanel } from './components/DesktopSponsorPanel';
import { PreGameAdModal } from './components/PreGameAdModal';
import { LoginModal } from './components/Modals/LoginModal';
import { StatsModal } from './components/Modals/StatsModal';
import { SettingsModal } from './components/Modals/SettingsModal';
import { HelpModal } from './components/Modals/HelpModal';

const INITIAL_STATS: PlayerStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  maxStreak: 0,
  lastPlayedDate: '',
  guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
};

const INITIAL_SETTINGS: AppSettings = {
  darkMode: true,
  hardMode: false,
  soundEnabled: true,
  highContrast: false,
  showAds: true,
};

export default function App() {
  const isAutostart = typeof window !== 'undefined' && window.location.search.includes('autostart=1');

  // App Settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('kalabaz_settings');
      return saved ? { ...INITIAL_SETTINGS, ...JSON.parse(saved) } : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  // Current Logged-in User Account
  const [currentAccount, setCurrentAccount] = useState<UserAccount | null>(() => {
    try {
      const savedUsername = localStorage.getItem('kalabaz_current_user');
      if (savedUsername) {
        const accountsRaw = localStorage.getItem('kalabaz_accounts');
        if (accountsRaw) {
          const accounts = JSON.parse(accountsRaw);
          if (accounts[savedUsername]) {
            return accounts[savedUsername];
          }
        }
      }
      return null;
    } catch {
      return null;
    }
  });

  // Active letter length (4, 5, or 6)
  const [currentLength, setCurrentLength] = useState<4 | 5 | 6>(5);

  // Today's Date String (YYYY-MM-DD)
  const todayStr = useMemo(() => getTodayDateString(), []);

  // Player Stats (tracked with account if logged in)
  const [stats, setStats] = useState<PlayerStats>(() => {
    if (currentAccount && currentAccount.stats) {
      return currentAccount.stats;
    }
    try {
      const saved = localStorage.getItem('kalabaz_stats');
      return saved ? JSON.parse(saved) : INITIAL_STATS;
    } catch {
      return INITIAL_STATS;
    }
  });

  // Multi-length Game States dictionary: length -> DailyGameState
  const [gameStates, setGameStates] = useState<{ [len: number]: DailyGameState }>(() => {
    const states: { [len: number]: DailyGameState } = {};
    const lengths: (4 | 5 | 6)[] = [4, 5, 6];

    // Check account-saved game states or local storage
    lengths.forEach((len) => {
      const dailyListForLen = DAILY_WORDS[len];
      const canonicalTarget = getDailyWord(todayStr, len, dailyListForLen);

      const accountState = currentAccount?.gameStates?.[len];
      if (
        accountState &&
        accountState.dateKey === todayStr &&
        accountState.targetWord?.word === canonicalTarget.word
      ) {
        states[len] = {
          ...accountState,
          targetWord: canonicalTarget,
        };
        return;
      }

      try {
        const saved = localStorage.getItem(`kalabaz_state_${len}_${todayStr}`);
        if (saved) {
          const parsedState: DailyGameState = JSON.parse(saved);
          if (parsedState.targetWord?.word === canonicalTarget.word) {
            states[len] = {
              ...parsedState,
              targetWord: canonicalTarget,
            };
            return;
          }
        }
      } catch {}

      states[len] = {
        wordLength: len,
        targetWord: canonicalTarget,
        guesses: [],
        evaluations: [],
        status: 'playing',
        hardMode: false,
        dateKey: todayStr,
      };
    });

    return states;
  });

  // Current guess string in active board
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(() => {
    if (isAutostart) return false;
    return !currentAccount;
  });
  const [isPreGameAdOpen, setIsPreGameAdOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Active game state
  const currentGame = gameStates[currentLength] || {
    wordLength: currentLength,
    targetWord: getDailyWord(todayStr, currentLength, DAILY_WORDS[currentLength]),
    guesses: [],
    evaluations: [],
    status: 'playing',
    hardMode: settings.hardMode,
    dateKey: todayStr,
  };

  // Toast message helper
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  }, []);

  // Save settings
  useEffect(() => {
    try {
      localStorage.setItem('kalabaz_settings', JSON.stringify(settings));
    } catch {}
  }, [settings]);

  // Apply account data to local states
  const applyAccountState = useCallback(
    (account: UserAccount) => {
      setCurrentAccount(account);
      try {
        localStorage.setItem('kalabaz_current_user', account.username);
        const accountsRaw = localStorage.getItem('kalabaz_accounts');
        const accounts = accountsRaw ? JSON.parse(accountsRaw) : {};
        accounts[account.username] = account;
        localStorage.setItem('kalabaz_accounts', JSON.stringify(accounts));
      } catch {}

      if (account.stats) {
        setStats(account.stats);
      }

      setGameStates((prev) => {
        const next = { ...prev };
        ([4, 5, 6] as const).forEach((len) => {
          const accState = account.gameStates?.[len];
          const canonicalTarget = getDailyWord(todayStr, len, DAILY_WORDS[len]);
          if (
            accState &&
            accState.dateKey === todayStr &&
            accState.targetWord?.word === canonicalTarget.word
          ) {
            next[len] = { ...accState, targetWord: canonicalTarget };
          } else {
            next[len] = {
              wordLength: len,
              targetWord: canonicalTarget,
              guesses: [],
              evaluations: [],
              status: 'playing',
              hardMode: settings.hardMode,
              dateKey: todayStr,
            };
          }
        });
        return next;
      });
    },
    [todayStr, settings.hardMode]
  );

  // On initial load, fetch latest profile from SQLite server if a session token exists
  useEffect(() => {
    let active = true;
    apiFetchCurrentUser()
      .then((serverAccount) => {
        if (active && serverAccount) {
          applyAccountState(serverAccount);
          setIsLoginOpen(false);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [applyAccountState]);

  // Sync account updates to SQLite backend and localStorage cache
  const syncAccountData = useCallback(
    (updatedStats: PlayerStats, updatedGameStates: { [len: number]: DailyGameState }) => {
      if (!currentAccount) return;
      try {
        const accountsRaw = localStorage.getItem('kalabaz_accounts');
        const accounts = accountsRaw ? JSON.parse(accountsRaw) : {};
        const updatedAccount: UserAccount = {
          ...currentAccount,
          stats: updatedStats,
          gameStates: updatedGameStates,
        };
        accounts[currentAccount.username] = updatedAccount;
        localStorage.setItem('kalabaz_accounts', JSON.stringify(accounts));
        setCurrentAccount(updatedAccount);
      } catch {}

      // Persist asynchronously to SQLite backend
      apiSyncUserData(updatedStats, updatedGameStates).catch(() => {});
    },
    [currentAccount]
  );

  // Save active game state locally
  useEffect(() => {
    try {
      if (currentGame) {
        localStorage.setItem(
          `kalabaz_state_${currentLength}_${todayStr}`,
          JSON.stringify(currentGame)
        );
      }
    } catch {}
  }, [currentGame, currentLength, todayStr]);

  // Handle Login / Signup
  const handleLoginSuccess = (account: UserAccount) => {
    applyAccountState(account);
    showToast(`خوش آمدید، ${account.username}!`);
    if (settings.showAds && !isAutostart) {
      setIsPreGameAdOpen(true);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('kalabaz_current_user');
    setSessionToken(null);
    setCurrentAccount(null);
    showToast('از حساب کاربری خارج شدید.');
    setIsLoginOpen(true);
  };

  // Keyboard letter input
  const handleChar = useCallback(
    (char: string) => {
      if (currentGame.status !== 'playing') return;
      if (currentGuess.length >= currentLength) return;

      playKeySound(settings.soundEnabled);
      setCurrentGuess((prev) => prev + char);
    },
    [currentGame.status, currentGuess.length, currentLength, settings.soundEnabled]
  );

  // Keyboard delete letter
  const handleDelete = useCallback(() => {
    if (currentGame.status !== 'playing') return;
    if (currentGuess.length === 0) return;

    playKeySound(settings.soundEnabled);
    setCurrentGuess((prev) => prev.slice(0, -1));
  }, [currentGame.status, currentGuess.length, settings.soundEnabled]);

  // Keyboard submit guess
  const handleEnter = useCallback(() => {
    if (currentGame.status !== 'playing') return;

    const normalizedGuess = normalizePersian(currentGuess);

    // 1. Length check
    if (normalizedGuess.length !== currentLength) {
      setIsShaking(true);
      playErrorSound(settings.soundEnabled);
      showToast(`کلمه باید دقیقاً ${currentLength.toLocaleString('fa-IR')} حرفی باشد`);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    // 2. Dictionary validity check from Eligible Guess Word List + Daily Puzzle Target Word List
    const isValidWord = isWordInVocabulary(
      normalizedGuess,
      ELIGIBLE_WORDS[currentLength],
      DAILY_WORDS[currentLength]
    );

    if (!isValidWord) {
      setIsShaking(true);
      playErrorSound(settings.soundEnabled);
      showToast(`کلمه در لیست کلمات مجاز ${currentLength.toLocaleString('fa-IR')} حرفی یافت نشد!`);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    // 3. Hard Mode constraint check
    if (settings.hardMode && currentGame.guesses.length > 0) {
      const prevEvals = currentGame.guesses.map((word, idx) => ({
        word,
        result: currentGame.evaluations[idx],
      }));
      const hardModeCheck = validateHardMode(normalizedGuess, prevEvals);
      if (!hardModeCheck.valid) {
        setIsShaking(true);
        playErrorSound(settings.soundEnabled);
        showToast(hardModeCheck.reason || 'قوانین حالت سخت رعایت نشده است!');
        setTimeout(() => setIsShaking(false), 500);
        return;
      }
    }

    // 4. Evaluate guess
    const target = currentGame.targetWord.word;
    const evaluation = evaluateGuess(normalizedGuess, target);

    // Staggered sound
    evaluation.forEach((_, idx) => {
      setTimeout(() => {
        playFlipSound(settings.soundEnabled, idx);
      }, idx * 140);
    });

    const isWin = normalizedGuess === normalizePersian(target);
    const newGuesses = [...currentGame.guesses, normalizedGuess];
    const newEvaluations = [...currentGame.evaluations, evaluation];
    const isLoss = !isWin && newGuesses.length >= 6;
    const newStatus: GameStatus = isWin ? 'won' : isLoss ? 'lost' : 'playing';

    const updatedGame = {
      ...currentGame,
      guesses: newGuesses,
      evaluations: newEvaluations,
      status: newStatus,
    };

    const newGameStates = {
      ...gameStates,
      [currentLength]: updatedGame,
    };

    setGameStates(newGameStates);
    setCurrentGuess('');

    // Handle Game Conclusion (Win or Loss) or intermediate guess sync
    if (isWin || isLoss) {
      const updatedStats = updateDailyStreak(
        stats,
        todayStr,
        isWin,
        newGuesses.length
      );
      setStats(updatedStats);

      // Sync to current account and SQLite server
      syncAccountData(updatedStats, newGameStates);

      if (isWin) {
        setTimeout(() => {
          playWinSound(settings.soundEnabled);
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#2b8a68', '#6ee7b7', '#7c4dff', '#c4b5fd', '#1f634b', '#5e358c'],
          });
          showToast('تبریک! کلمه را درست حدس زدید 🥬🎉');
          setTimeout(() => setIsStatsOpen(true), 1500);
        }, newGuesses.length * 150);
      } else {
        setTimeout(() => {
          showToast(`فرصت تمام شد! کلمه امروز: «${target}» بود`);
          setTimeout(() => setIsStatsOpen(true), 1500);
        }, newGuesses.length * 150);
      }
    } else {
      syncAccountData(stats, newGameStates);
    }
  }, [
    currentGame,
    currentGuess,
    currentLength,
    gameStates,
    settings.hardMode,
    settings.soundEnabled,
    showToast,
    stats,
    syncAccountData,
    todayStr,
  ]);

  // Physical Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        handleEnter();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const char = normalizePersian(e.key);
        if (/[\u0600-\u06FF]/.test(char)) {
          e.preventDefault();
          handleChar(char);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleEnter, handleDelete, handleChar]);

  return (
    <div
      dir="rtl"
      className={`relative h-[100dvh] min-h-[540px] lg:min-h-screen lg:h-auto overflow-hidden lg:overflow-visible flex flex-col justify-between transition-colors duration-300 ${
        settings.darkMode
          ? 'bg-gradient-to-br from-[#19112b] via-[#1f1836] to-[#122622] text-[#efe9f7]'
          : 'bg-gradient-to-br from-[#deefe6] via-[#ebf4ef] to-[#eae3f3] text-[#17362a]'
      }`}
    >
      {/* Subtle multi-shade green & purple ambient botanical backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden z-0"
      >
        <div
          className={`absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl transition-opacity duration-500 ${
            settings.darkMode
              ? 'bg-[#3b215d]/35'
              : 'bg-[#b5dfca]/55'
          }`}
        />
        <div
          className={`absolute top-1/3 -left-24 w-80 h-80 rounded-full blur-3xl transition-opacity duration-500 ${
            settings.darkMode
              ? 'bg-[#17463a]/35'
              : 'bg-[#d4c4eb]/50'
          }`}
        />
        <div
          className={`absolute -bottom-24 right-1/4 w-96 h-96 rounded-full blur-3xl transition-opacity duration-500 ${
            settings.darkMode
              ? 'bg-[#2a1c47]/40'
              : 'bg-[#c5e6d6]/55'
          }`}
        />
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-bounce w-max max-w-[92vw]">
          <div
            className={`px-4 py-2 rounded-xl border-2 text-xs sm:text-sm font-extrabold shadow-xl backdrop-blur-md text-center ${
              settings.darkMode
                ? 'bg-gradient-to-r from-[#26183f]/95 via-[#1d2e2b]/95 to-[#26183f]/95 border-[#6ee7b7]/70 text-[#d1fae5]'
                : 'bg-gradient-to-r from-[#4b2775]/95 via-[#21614b]/95 to-[#4b2775]/95 border-[#d8b4fe] text-[#f5f3ff]'
            }`}
          >
            {toastMessage}
          </div>
        </div>
      )}

      {/* Header with Cabbage logo, tabs, streak, and actions */}
      <Header
        currentLength={currentLength}
        onSelectLength={(len) => {
          setCurrentLength(len);
          setCurrentGuess('');
        }}
        streak={stats.currentStreak}
        username={currentAccount?.username}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenProfile={() => setIsLoginOpen(true)}
        darkMode={settings.darkMode}
        hardMode={settings.hardMode}
        gameStates={gameStates}
      />

      {/* Main Container: 3 Columns on Desktop, 1 Column on Mobile */}
      <div className="w-full max-w-7xl mx-auto px-1.5 sm:px-4 lg:px-6 flex-1 flex flex-col justify-between min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col lg:flex-row items-center lg:items-start justify-between gap-1 sm:gap-3 xl:gap-8 w-full min-h-0 py-0.5 sm:py-1">
          {/* Desktop Right Sidebar: Daily Player Hub & Status */}
          <DesktopDashboard
            stats={stats}
            currentAccount={currentAccount}
            currentLength={currentLength}
            onSelectLength={(len) => {
              setCurrentLength(len);
              setCurrentGuess('');
            }}
            gameStates={gameStates}
            hardMode={settings.hardMode}
            darkMode={settings.darkMode}
            onOpenProfile={() => setIsLoginOpen(true)}
            onOpenStats={() => setIsStatsOpen(true)}
          />

          {/* Center Column: Game Board & Persian Keyboard */}
          <main className="flex-1 flex flex-col items-center justify-between w-full max-w-xl mx-auto h-full min-h-0">
            {/* Mobile Compact Top Ad Strip (only on < lg) */}
            {settings.showAds && (
              <div className="lg:hidden w-full shrink-0">
                <AdBanner
                  position="top"
                  darkMode={settings.darkMode}
                  onNotify={showToast}
                />
              </div>
            )}

            {/* Game Board */}
            <div className="flex-1 flex items-center justify-center py-0.5 sm:py-1.5 min-h-0 w-full">
              <GameBoard
                wordLength={currentLength}
                guesses={currentGame.guesses}
                evaluations={currentGame.evaluations}
                currentGuess={currentGuess}
                isShaking={isShaking}
                gameStatus={currentGame.status}
                darkMode={settings.darkMode}
                highContrast={settings.highContrast}
              />
            </div>

            {/* Persian Virtual Keyboard */}
            <div className="w-full pb-1 sm:pb-2 shrink-0">
              <PersianKeyboard
                onChar={handleChar}
                onEnter={handleEnter}
                onDelete={handleDelete}
                evaluations={currentGame.evaluations}
                disabled={currentGame.status !== 'playing'}
                darkMode={settings.darkMode}
                highContrast={settings.highContrast}
              />
            </div>
          </main>

          {/* Desktop Left Sidebar: Modular Advertisement and Quick Tools */}
          <DesktopSponsorPanel
            darkMode={settings.darkMode}
            hardMode={settings.hardMode}
            showAds={settings.showAds}
            onOpenHelp={() => setIsHelpOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onNotify={showToast}
          />
        </div>
      </div>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onLoginSuccess={handleLoginSuccess}
        onClose={() => setIsLoginOpen(false)}
        currentUsername={currentAccount?.username}
        onLogout={handleLogout}
        darkMode={settings.darkMode}
      />

      <PreGameAdModal
        isOpen={isPreGameAdOpen}
        onProceed={() => setIsPreGameAdOpen(false)}
        username={currentAccount?.username}
        darkMode={settings.darkMode}
      />

      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        stats={stats}
        targetWord={currentGame.targetWord}
        gameStatus={currentGame.status}
        guesses={currentGame.guesses}
        evaluations={currentGame.evaluations}
        wordLength={currentLength}
        hardMode={settings.hardMode}
        darkMode={settings.darkMode}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newSettings) =>
          setSettings((prev) => ({ ...prev, ...newSettings }))
        }
        canChangeHardMode={currentGame.guesses.length === 0}
      />

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        darkMode={settings.darkMode}
      />
    </div>
  );
}
