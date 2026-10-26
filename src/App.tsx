/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import words4Initial from './data/words4.json';
import words5Initial from './data/words5.json';
import words6Initial from './data/words6.json';
import {
  WordEntry,
  EvaluationResult,
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
  normalizeWordList,
} from './game/wordleLogic';
import {
  playKeySound,
  playFlipSound,
  playErrorSound,
  playWinSound,
} from './utils/audio';

import { Header } from './components/Header';
import { GameBoard } from './components/GameBoard';
import { PersianKeyboard } from './components/PersianKeyboard';
import { AdBanner } from './components/AdBanner';
import { DesktopDashboard } from './components/DesktopDashboard';
import { DesktopSponsorPanel } from './components/DesktopSponsorPanel';
import { PreGameAdModal } from './components/PreGameAdModal';
import { LoginModal } from './components/Modals/LoginModal';
import { VocabularyModal } from './components/Modals/VocabularyModal';
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

  // 3 Distinct Word Lists for 4, 5, and 6 letter words with sequential counter IDs (four1.., five1.., six1..)
  const [words4, setWords4] = useState<WordEntry[]>(() => {
    try {
      const saved = localStorage.getItem('kalabaz_words_4');
      const raw = saved ? JSON.parse(saved) : words4Initial;
      return normalizeWordList(4, raw);
    } catch {
      return normalizeWordList(4, words4Initial as WordEntry[]);
    }
  });

  const [words5, setWords5] = useState<WordEntry[]>(() => {
    try {
      const saved = localStorage.getItem('kalabaz_words_5');
      const raw = saved ? JSON.parse(saved) : words5Initial;
      return normalizeWordList(5, raw);
    } catch {
      return normalizeWordList(5, words5Initial as WordEntry[]);
    }
  });

  const [words6, setWords6] = useState<WordEntry[]>(() => {
    try {
      const saved = localStorage.getItem('kalabaz_words_6');
      const raw = saved ? JSON.parse(saved) : words6Initial;
      return normalizeWordList(6, raw);
    } catch {
      return normalizeWordList(6, words6Initial as WordEntry[]);
    }
  });

  // Get active word list for current length
  const activeWordList = useMemo(() => {
    return currentLength === 4 ? words4 : currentLength === 5 ? words5 : words6;
  }, [currentLength, words4, words5, words6]);

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
      const vocabForLen =
        len === 4
          ? (words4Initial as WordEntry[])
          : len === 5
          ? (words5Initial as WordEntry[])
          : (words6Initial as WordEntry[]);
      const canonicalTarget = getDailyWord(todayStr, len, vocabForLen);

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
  const [isVocabOpen, setIsVocabOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Active game state
  const currentGame = gameStates[currentLength] || {
    wordLength: currentLength,
    targetWord: getDailyWord(todayStr, currentLength, activeWordList),
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

  // Save 4/5/6 word lists
  useEffect(() => {
    try {
      localStorage.setItem('kalabaz_words_4', JSON.stringify(words4));
    } catch {}
  }, [words4]);

  useEffect(() => {
    try {
      localStorage.setItem('kalabaz_words_5', JSON.stringify(words5));
    } catch {}
  }, [words5]);

  useEffect(() => {
    try {
      localStorage.setItem('kalabaz_words_6', JSON.stringify(words6));
    } catch {}
  }, [words6]);

  // Sync account updates to localStorage
  const syncAccountData = useCallback((updatedStats: PlayerStats, updatedGameStates: { [len: number]: DailyGameState }) => {
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
  }, [currentAccount]);

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
    setCurrentAccount(account);
    localStorage.setItem('kalabaz_current_user', account.username);
    if (account.stats) {
      setStats(account.stats);
    }
    if (account.gameStates) {
      setGameStates((prev) => ({
        ...prev,
        ...account.gameStates,
      }));
    }
    showToast(`خوش آمدید، ${account.username}!`);
    if (settings.showAds && !isAutostart) {
      setIsPreGameAdOpen(true);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('kalabaz_current_user');
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

    // 2. Dictionary validity check from active list
    const isValidWord = activeWordList.some(
      (entry) => normalizePersian(entry.word) === normalizedGuess
    );

    if (!isValidWord) {
      setIsShaking(true);
      playErrorSound(settings.soundEnabled);
      showToast(`کلمه در لیست کلمات ${currentLength.toLocaleString('fa-IR')} حرفی یافت نشد!`);
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

    // Handle Game Conclusion (Win or Loss)
    if (isWin || isLoss) {
      const updatedStats = updateDailyStreak(
        stats,
        todayStr,
        isWin,
        newGuesses.length
      );
      setStats(updatedStats);

      // Sync to current account
      syncAccountData(updatedStats, newGameStates);

      if (isWin) {
        setTimeout(() => {
          playWinSound(settings.soundEnabled);
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#10b981', '#8b5cf6', '#eab308', '#ec4899'],
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
    }
  }, [
    activeWordList,
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

  // Vocabulary handlers for 4, 5, 6 (maintaining sequential counter IDs: four1.., five1.., six1..)
  const handleSaveWord = (length: 4 | 5 | 6, newWord: WordEntry, oldWord?: string) => {
    const updateList = (prev: WordEntry[]) => {
      const idx = oldWord
        ? prev.findIndex((w) => w.word === oldWord)
        : prev.findIndex((w) => w.word === newWord.word);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { id: copy[idx].id, word: newWord.word };
        return normalizeWordList(length, copy);
      }
      return normalizeWordList(length, [...prev, newWord]);
    };

    if (length === 4) setWords4(updateList);
    else if (length === 5) setWords5(updateList);
    else setWords6(updateList);

    showToast(`کلمه «${newWord.word}» در لیست ${length} حرفی ذخیره شد`);
  };

  const handleDeleteWord = (length: 4 | 5 | 6, wordText: string) => {
    const removeWord = (prev: WordEntry[]) =>
      normalizeWordList(
        length,
        prev.filter((w) => w.word !== wordText)
      );
    if (length === 4) setWords4(removeWord);
    else if (length === 5) setWords5(removeWord);
    else setWords6(removeWord);

    showToast(`کلمه «${wordText}» از لیست کلمات حذف شد`);
  };

  const handleResetVocabulary = (length: 4 | 5 | 6) => {
    if (length === 4) setWords4(normalizeWordList(4, words4Initial as WordEntry[]));
    else if (length === 5) setWords5(normalizeWordList(5, words5Initial as WordEntry[]));
    else setWords6(normalizeWordList(6, words6Initial as WordEntry[]));

    showToast(`کلمات ${length} حرفی به حالت اولیه بازنشانی شدند`);
  };

  const handleImportVocabulary = (length: 4 | 5 | 6, newWords: WordEntry[]) => {
    const merge = (prev: WordEntry[]) => {
      const existingMap = new Set(prev.map((w) => w.word));
      const additions = newWords.filter((w) => !existingMap.has(w.word));
      return normalizeWordList(length, [...prev, ...additions]);
    };

    if (length === 4) setWords4(merge);
    else if (length === 5) setWords5(merge);
    else setWords6(merge);

    showToast(`واژگان ${length} حرفی با موفقیت به‌روزرسانی شدند`);
  };

  return (
    <div
      dir="rtl"
      className={`min-h-screen flex flex-col justify-between transition-colors duration-300 ${
        settings.darkMode
          ? 'bg-gradient-to-b from-purple-950 via-neutral-950 to-emerald-950 text-white'
          : 'bg-gradient-to-b from-emerald-50 via-amber-50/30 to-purple-50 text-neutral-900'
      }`}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-bounce">
          <div className="px-4 py-2 rounded-xl bg-neutral-900/95 border border-purple-400 text-white text-xs sm:text-sm font-bold shadow-xl backdrop-blur-md">
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
        onOpenVocab={() => setIsVocabOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenProfile={() => setIsLoginOpen(true)}
        darkMode={settings.darkMode}
        hardMode={settings.hardMode}
      />

      {/* Main Container: 3 Columns on Desktop, 1 Column on Mobile */}
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 flex-1 flex flex-col justify-between min-h-0">
        <div className="flex-1 flex flex-col lg:flex-row items-center lg:items-start justify-center lg:justify-between gap-4 xl:gap-8 my-auto w-full py-1">
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
          <main className="flex-1 flex flex-col items-center justify-between w-full max-w-xl mx-auto min-h-0">
            {/* Mobile Top Ad Banner (only on < lg) */}
            {settings.showAds && (
              <div className="lg:hidden w-full">
                <AdBanner
                  position="top"
                  darkMode={settings.darkMode}
                  onNotify={showToast}
                />
              </div>
            )}

            {/* Game Board */}
            <div className="flex-1 flex items-center justify-center py-1 sm:py-2 min-h-0 w-full my-auto">
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
            <div className="w-full pb-2">
              <PersianKeyboard
                onChar={handleChar}
                onEnter={handleEnter}
                onDelete={handleDelete}
                evaluations={currentGame.evaluations}
                disabled={currentGame.status !== 'playing'}
                darkMode={settings.darkMode}
                highContrast={settings.highContrast}
              />

              {/* Mobile Bottom Ad Banner (only on < lg) */}
              {settings.showAds && (
                <div className="lg:hidden w-full">
                  <AdBanner
                    position="bottom"
                    darkMode={settings.darkMode}
                    onNotify={showToast}
                  />
                </div>
              )}
            </div>
          </main>

          {/* Desktop Left Sidebar: Modular Advertisement and Quick Tools */}
          <DesktopSponsorPanel
            darkMode={settings.darkMode}
            hardMode={settings.hardMode}
            showAds={settings.showAds}
            onOpenHelp={() => setIsHelpOpen(true)}
            onOpenVocab={() => setIsVocabOpen(true)}
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
      />

      <PreGameAdModal
        isOpen={isPreGameAdOpen}
        onProceed={() => setIsPreGameAdOpen(false)}
        username={currentAccount?.username}
      />

      <VocabularyModal
        isOpen={isVocabOpen}
        onClose={() => setIsVocabOpen(false)}
        words4={words4}
        words5={words5}
        words6={words6}
        onSaveWord={handleSaveWord}
        onDeleteWord={handleDeleteWord}
        onResetVocabulary={handleResetVocabulary}
        onImportVocabulary={handleImportVocabulary}
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

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
