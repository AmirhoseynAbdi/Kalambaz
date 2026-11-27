/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Megaphone, X, ExternalLink } from 'lucide-react';
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
  HINT_COST,
  STARTING_POINTS,
  calculateGuessPoints,
  getAvailableGreenHint,
  applyGreenHint,
  ensureStarterBonus,
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
import {
  fetchPublicGameConfig,
  SiteAnnouncement,
} from './utils/adminApi';
import {
  extractReferralFromUrl,
  getPendingReferrer,
  setPendingReferrer,
  clearPendingReferrer,
} from './utils/referral';
import { usePWAInstall } from './hooks/usePWAInstall';
import {
  NotificationPermissionState,
  getBrowserNotificationPermission,
  isDailyNotificationEnabled,
  getLastNotifiedDate,
  markDateNotified,
  shouldTriggerDailyNotification,
  requestAndEnableNotifications,
  showKalabazNotification,
  unsubscribeFromWebPush,
  syncExistingPushSubscription,
} from './utils/notifications';

import { Header } from './components/Header';
import { GameBoard } from './components/GameBoard';
import { PersianKeyboard } from './components/PersianKeyboard';
import { AdBanner } from './components/AdBanner';
import { DesktopSponsorPanel } from './components/DesktopSponsorPanel';
import { PreGameAdModal } from './components/PreGameAdModal';
import { LoginModal } from './components/Modals/LoginModal';
import { StatsModal } from './components/Modals/StatsModal';
import { SettingsModal } from './components/Modals/SettingsModal';
import { HelpModal } from './components/Modals/HelpModal';
import { ContactModal } from './components/Modals/ContactModal';

const INITIAL_STATS: PlayerStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  maxStreak: 0,
  points: STARTING_POINTS,
  starterBonusGranted: true,
  lastPlayedDate: '',
  guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
};

const INITIAL_SETTINGS: AppSettings = {
  darkMode: true,
  hardMode: false,
  soundEnabled: true,
  highContrast: true,
  showAds: true,
};

export default function App() {
  const isAutostart = typeof window !== 'undefined' && window.location.search.includes('autostart=1');

  // App Settings (High Contrast enabled by default)
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('kalabaz_settings');
      const migrated = localStorage.getItem('kalabaz_hc_default_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!migrated) {
          localStorage.setItem('kalabaz_hc_default_v1', '1');
          return { ...INITIAL_SETTINGS, ...parsed, highContrast: true, showAds: true };
        }
        return { ...INITIAL_SETTINGS, ...parsed, showAds: true };
      }
      localStorage.setItem('kalabaz_hc_default_v1', '1');
      return INITIAL_SETTINGS;
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
      return ensureStarterBonus({
        ...INITIAL_STATS,
        ...currentAccount.stats,
        points: Number(currentAccount.stats.points) || 0,
        starterBonusGranted: Boolean(currentAccount.stats.starterBonusGranted),
      });
    }
    try {
      const saved = localStorage.getItem('kalabaz_stats');
      if (saved) {
        const parsed = JSON.parse(saved);
        return ensureStarterBonus({
          ...INITIAL_STATS,
          ...parsed,
          points: Number(parsed.points) || 0,
          starterBonusGranted: Boolean(parsed.starterBonusGranted),
        });
      }
      return INITIAL_STATS;
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
  const [lastPressedKey, setLastPressedKey] = useState<{ key: string; seq: number } | null>(null);
  const keyPulseSeqRef = useRef<number>(0);

  // Pending referral inviter captured from ?ref=<username> or localStorage
  const [pendingReferrer, setPendingReferrerState] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const fromUrl = extractReferralFromUrl(window.location.search);
    if (fromUrl) {
      setPendingReferrer(fromUrl);
      return fromUrl;
    }
    return getPendingReferrer();
  });

  // Modals state: Login is NOT required to play; new devices only see the tutorial first
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [loginPromptReason, setLoginPromptReason] = useState<'default' | 'first_win' | 'hint_required'>('default');
  const [isPreGameAdOpen, setIsPreGameAdOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(() => {
    if (isAutostart) return false;
    try {
      return !localStorage.getItem('kalabaz_tutorial_seen_v1');
    } catch {
      return true;
    }
  });
  const [helpInitialSlide, setHelpInitialSlide] = useState<0 | 1 | 2>(0);
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isContactOpen, setIsContactOpen] = useState<boolean>(false);

  // PWA install prompt & daily notifications state
  const { isInstallable, isInstalled, isIOS, install: triggerPWAInstall } = usePWAInstall();
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermissionState>(() => getBrowserNotificationPermission());
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() =>
    isDailyNotificationEnabled()
  );

  // Live server announcement banner & daily word overrides
  const [siteAnnouncement, setSiteAnnouncement] = useState<SiteAnnouncement | null>(null);
  const [announcementDismissed, setAnnouncementDismissed] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    fetchPublicGameConfig(todayStr).then((cfg) => {
      if (!active || !cfg) return;

      if (cfg.announcement?.enabled && cfg.announcement.message) {
        setSiteAnnouncement(cfg.announcement);
      }

      if (cfg.wordOverrides && Object.keys(cfg.wordOverrides).length > 0) {
        setGameStates((prev) => {
          let changed = false;
          const next = { ...prev };
          ([4, 5, 6] as const).forEach((len) => {
            const overrideWord = cfg.wordOverrides[len];
            if (!overrideWord || Array.from(overrideWord).length !== len) return;
            const existing = next[len];
            if (existing && existing.targetWord?.word === overrideWord) return;
            changed = true;
            const overrideTarget = {
              id: `override_${todayStr}_${len}`,
              word: overrideWord,
            };
            // Check if saved local state already matches the overridden word
            try {
              const saved = localStorage.getItem(`kalabaz_state_${len}_${todayStr}`);
              if (saved) {
                const parsed: DailyGameState = JSON.parse(saved);
                if (parsed.targetWord?.word === overrideWord) {
                  next[len] = { ...parsed, targetWord: overrideTarget };
                  return;
                }
              }
            } catch {}
            next[len] = {
              wordLength: len,
              targetWord: overrideTarget,
              guesses: [],
              evaluations: [],
              status: 'playing',
              hardMode: existing?.hardMode ?? false,
              dateKey: todayStr,
            };
          });
          return changed ? next : prev;
        });
      }
    });
    return () => {
      active = false;
    };
  }, [todayStr]);

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

  // Trigger a daily browser/PWA reminder notification when enabled and a new day's puzzle is unsolved
  useEffect(() => {
    const checkAndNotify = () => {
      const currentPerm = getBrowserNotificationPermission();
      setNotificationPermission(currentPerm);
      const latestDateKey = getTodayDateString();
      const hasUnsolved = ([4, 5, 6] as const).some(
        (len) => gameStates[len]?.status !== 'won'
      );
      if (
        shouldTriggerDailyNotification({
          enabled: notificationsEnabled,
          permission: currentPerm,
          todayDateKey: latestDateKey,
          lastNotifiedDateKey: getLastNotifiedDate(),
          hasUnsolvedPuzzleToday: hasUnsolved,
        })
      ) {
        markDateNotified(latestDateKey);
        showKalabazNotification(
          '🥦 کلمه جدید امروز کلمباز آماده است!',
          'معماهای ۴، ۵ و ۶ حرفی امروز منتشر شدند — وارد شوید و استریک خود را حفظ کنید!'
        ).catch(() => {});
      }
    };

    checkAndNotify();
    const timer = window.setInterval(checkAndNotify, 60_000);
    return () => window.clearInterval(timer);
  }, [notificationsEnabled, gameStates]);

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
        const normalizedStats = ensureStarterBonus({
          ...INITIAL_STATS,
          ...account.stats,
          points: Number(account.stats.points) || 0,
          starterBonusGranted: Boolean(account.stats.starterBonusGranted),
        });
        setStats(normalizedStats);
        try {
          localStorage.setItem('kalabaz_stats', JSON.stringify(normalizedStats));
        } catch {}
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

  // On initial load, fetch latest profile from SQLite/MySQL server if a session token exists
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

  // Welcome toast when a guest arrives via a referral link (?ref=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const fromUrl = extractReferralFromUrl(window.location.search);
    if (fromUrl) {
      setPendingReferrer(fromUrl);
      setPendingReferrerState(fromUrl);
      if (!currentAccount) {
        showToast(`🎁 شما با دعوت «${fromUrl}» وارد کلمباز شدید!`);
      }
    }
    // Only run once on initial mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Silently refresh profile from server when Stats or Profile modal opens to show newly earned referral rewards
  useEffect(() => {
    if ((!isStatsOpen && !isLoginOpen) || !currentAccount) return;
    let active = true;
    const prevRefPts = Number(stats.referralPointsEarned) || 0;
    apiFetchCurrentUser()
      .then((serverAccount) => {
        if (!active || !serverAccount) return;
        const newRefPts = Number(serverAccount.stats?.referralPointsEarned) || 0;
        if (newRefPts > prevRefPts) {
          const gained = newRefPts - prevRefPts;
          showToast(
            `🎉 دعوت موفق! +${gained.toLocaleString('fa-IR')} بذر هدیه به حساب شما اضافه شد!`
          );
        }
        applyAccountState(serverAccount);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStatsOpen, isLoginOpen]);

  // Sync account updates to SQLite/MySQL backend and localStorage cache
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

      // Persist asynchronously to backend and reconcile any server-credited referral bonuses
      const knownRefPts = Number(updatedStats.referralPointsEarned) || 0;
      apiSyncUserData(updatedStats, updatedGameStates)
        .then((serverAccount) => {
          if (!serverAccount?.stats) return;
          const serverRefPts = Number(serverAccount.stats.referralPointsEarned) || 0;
          if (serverRefPts > knownRefPts) {
            const gained = serverRefPts - knownRefPts;
            const mergedStats: PlayerStats = {
              ...updatedStats,
              points: Number(serverAccount.stats.points) || updatedStats.points,
              referralsCount: serverAccount.stats.referralsCount,
              referralPointsEarned: serverRefPts,
            };
            setStats(mergedStats);
            setCurrentAccount((prev) =>
              prev ? { ...prev, stats: mergedStats } : prev
            );
            showToast(
              `🎉 دعوت موفق! +${gained.toLocaleString('fa-IR')} بذر هدیه به حساب شما اضافه شد!`
            );
          }
        })
        .catch(() => {});
    },
    [currentAccount, showToast]
  );

  // Save active game state and player stats locally
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

  useEffect(() => {
    try {
      localStorage.setItem('kalabaz_stats', JSON.stringify(stats));
    } catch {}
  }, [stats]);

  // Check whether the user can currently purchase a green-letter hint (login required)
  const canUseHint = useMemo(() => {
    if (!currentAccount) return false;
    if (currentGame.status !== 'playing') return false;
    if ((stats.points || 0) < HINT_COST) return false;
    const nextHint = getAvailableGreenHint(
      currentGame.targetWord.word,
      currentGame.evaluations,
      currentGame.revealedHints || []
    );
    return nextHint !== null;
  }, [
    currentAccount,
    currentGame.status,
    currentGame.targetWord.word,
    currentGame.evaluations,
    currentGame.revealedHints,
    stats.points,
  ]);

  // Purchase/activate a green-letter hint (only available after login)
  const handleUseHint = useCallback(() => {
    if (!currentAccount) {
      playErrorSound(settings.soundEnabled);
      showToast('برای استفاده از راهنمای حرف سبز، ابتدا وارد حساب کاربری شوید.');
      setLoginPromptReason('hint_required');
      setIsLoginOpen(true);
      return;
    }

    if (currentGame.status !== 'playing') {
      showToast('این جدول قبلاً به پایان رسیده است!');
      return;
    }

    const res = applyGreenHint(
      stats.points || 0,
      currentGame.targetWord.word,
      currentGame.evaluations,
      currentGame.revealedHints || [],
      HINT_COST
    );

    if (!res.ok || !res.hint) {
      playErrorSound(settings.soundEnabled);
      showToast(res.error || 'امکان استفاده از راهنما وجود ندارد.');
      return;
    }

    playFlipSound(settings.soundEnabled, 0);

    const updatedStats: PlayerStats = {
      ...stats,
      points: res.remainingPoints,
    };

    const updatedGame: DailyGameState = {
      ...currentGame,
      revealedHints: res.updatedHints,
    };

    const newGameStates = {
      ...gameStates,
      [currentLength]: updatedGame,
    };

    setStats(updatedStats);
    setGameStates(newGameStates);
    syncAccountData(updatedStats, newGameStates);

    showToast(
      `💡 راهنما: حرف ${(res.hint.index + 1).toLocaleString('fa-IR')}ام کلمه «${res.hint.letter}» است! (${HINT_COST.toLocaleString('fa-IR')}- بذر 🌱)`
    );
  }, [
    currentAccount,
    currentGame,
    currentLength,
    gameStates,
    settings.soundEnabled,
    showToast,
    stats,
    syncAccountData,
  ]);

  // Close Help/Tutorial and mark it seen on this device
  const handleCloseHelp = useCallback(() => {
    setIsHelpOpen(false);
    try {
      localStorage.setItem('kalabaz_tutorial_seen_v1', '1');
    } catch {}
  }, []);

  // Trigger Chrome native PWA install prompt
  const handleInstallApp = useCallback(async () => {
    const outcome = await triggerPWAInstall();
    if (outcome === 'accepted') {
      showToast('کلمباز با موفقیت روی صفحه گوشی نصب شد! 🥦📱');
    } else if (outcome === 'unavailable') {
      setHelpInitialSlide(1);
      setIsHelpOpen(true);
    }
  }, [triggerPWAInstall, showToast]);

  // Enable daily puzzle notifications
  const handleEnableNotifications = useCallback(async () => {
    const res = await requestAndEnableNotifications();
    setNotificationPermission(res.permission);
    if (res.ok) {
      setNotificationsEnabled(true);
      markDateNotified(getTodayDateString());
      showToast('اعلان روزانه کلمباز فعال شد! 🔔');
    } else if (res.permission === 'denied') {
      setNotificationsEnabled(false);
      showToast('اعلان در مرورگر مسدود است؛ از تنظیمات سایت کروم آن را Allow کنید.');
    } else if (res.permission === 'unsupported') {
      showToast('مرورگر فعلی شما از اعلان پشتیبانی نمی‌کند.');
    }
  }, [showToast]);

  // Toggle daily notifications from Settings
  const handleToggleNotifications = useCallback(async () => {
    if (notificationPermission === 'granted' && notificationsEnabled) {
      await unsubscribeFromWebPush();
      setNotificationsEnabled(false);
      showToast('اعلان روزانه غیرفعال شد.');
      return;
    }
    if (notificationPermission === 'denied') {
      setIsSettingsOpen(false);
      setHelpInitialSlide(2);
      setIsHelpOpen(true);
      return;
    }
    await handleEnableNotifications();
  }, [notificationPermission, notificationsEnabled, handleEnableNotifications, showToast]);

  // Send a test notification right away
  const handleSendTestNotification = useCallback(async () => {
    const sent = await showKalabazNotification(
      '🥦 یادآور آزمایشی کلمباز',
      'عالی! اعلان‌های روزانه کلمباز روی دستگاه شما به درستی کار می‌کنند.',
      'kalambaz-test'
    );
    if (sent) {
      showToast('اعلان آزمایشی ارسال شد! 🔔');
    } else {
      showToast('امکان نمایش اعلان وجود ندارد؛ تنظیمات اعلان گوشی را بررسی کنید.');
    }
  }, [showToast]);

  // Handle Login / Signup
  const handleLoginSuccess = (account: UserAccount) => {
    const wasFirstWinPrompt = loginPromptReason === 'first_win';
    applyAccountState(account);
    syncExistingPushSubscription().catch(() => {});
    setLoginPromptReason('default');
    showToast(`خوش آمدید، ${account.username}! استریک و امتیاز شما ذخیره شد.`);
    if (wasFirstWinPrompt) {
      setIsStatsOpen(true);
    }
  };

  // Handle Closing LoginModal (if dismissed from first_win prompt, show StatsModal so user still sees results)
  const handleCloseLogin = () => {
    const wasFirstWinPrompt = loginPromptReason === 'first_win';
    setIsLoginOpen(false);
    setLoginPromptReason('default');
    if (wasFirstWinPrompt) {
      setIsStatsOpen(true);
    }
  };

  // Handle Logout (stay playable as guest without forcing login)
  const handleLogout = () => {
    localStorage.removeItem('kalabaz_current_user');
    setSessionToken(null);
    setCurrentAccount(null);
    setIsLoginOpen(false);
    showToast('از حساب کاربری خارج شدید.');
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
    const earnedPoints = isWin ? calculateGuessPoints(newGuesses.length, true) : 0;

    const updatedGame: DailyGameState = {
      ...currentGame,
      guesses: newGuesses,
      evaluations: newEvaluations,
      status: newStatus,
      ...(isWin ? { pointsEarned: earnedPoints } : {}),
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
        newGuesses.length,
        currentLength
      );
      setStats(updatedStats);

      // Sync to current account and SQLite server
      syncAccountData(updatedStats, newGameStates);

      if (isWin) {
        const shouldPromptGuestAuth = (() => {
          if (currentAccount) return false;
          try {
            return !localStorage.getItem('kalabaz_post_win_auth_prompted');
          } catch {
            return true;
          }
        })();

        setTimeout(() => {
          playWinSound(settings.soundEnabled);
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#2b8a68', '#6ee7b7', '#7c4dff', '#c4b5fd', '#1f634b', '#5e358c'],
          });
          showToast(
            `تبریک! کلمه را درست حدس زدید (+${earnedPoints.toLocaleString('fa-IR')} بذر 🌱) 🥦🎉`
          );
          setTimeout(() => {
            if (shouldPromptGuestAuth) {
              try {
                localStorage.setItem('kalabaz_post_win_auth_prompted', '1');
              } catch {}
              setLoginPromptReason('first_win');
              setIsLoginOpen(true);
            } else {
              setIsStatsOpen(true);
            }
          }, 1500);
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
    currentAccount,
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
        keyPulseSeqRef.current += 1;
        setLastPressedKey({ key: 'ENTER', seq: keyPulseSeqRef.current });
        handleEnter();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        keyPulseSeqRef.current += 1;
        setLastPressedKey({ key: 'BACKSPACE', seq: keyPulseSeqRef.current });
        handleDelete();
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const char = normalizePersian(e.key);
        if (/[\u0600-\u06FF]/.test(char)) {
          e.preventDefault();
          keyPulseSeqRef.current += 1;
          setLastPressedKey({ key: char, seq: keyPulseSeqRef.current });
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
      className={`relative h-[100dvh] min-h-[540px] lg:min-h-screen lg:h-auto overflow-hidden lg:overflow-visible flex flex-col justify-between transition-colors duration-200 ${
        settings.darkMode
          ? 'bg-[#140e21] text-[#f5f3ff]'
          : 'bg-[#eefaf2] text-[#14532d]'
      }`}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-bounce w-max max-w-[92vw]">
          <div
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold shadow-xl text-center ${
              settings.darkMode
                ? 'bg-[#15803d] text-white shadow-black/45'
                : 'bg-[#6b21a8] text-white shadow-purple-950/25'
            }`}
          >
            {toastMessage}
          </div>
        </div>
      )}

      {/* Header with Cabbage logo, tabs, streak, points, hint, and actions */}
      <Header
        currentLength={currentLength}
        onSelectLength={(len) => {
          setCurrentLength(len);
          setCurrentGuess('');
        }}
        streak={stats.currentStreak}
        points={stats.points || 0}
        hintCost={HINT_COST}
        canUseHint={canUseHint}
        onUseHint={handleUseHint}
        username={currentAccount?.username}
        onOpenHelp={() => {
          setHelpInitialSlide(0);
          setIsHelpOpen(true);
        }}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenProfile={() => {
          setLoginPromptReason('default');
          setIsLoginOpen(true);
        }}
        onOpenContact={() => setIsContactOpen(true)}
        darkMode={settings.darkMode}
        hardMode={settings.hardMode}
        gameStates={gameStates}
      />

      {/* Main Container: Centered Word Panel Flanked by 2 Ad Banners on Each Side on Desktop */}
      <div className="w-full max-w-7xl mx-auto px-1.5 sm:px-4 lg:px-6 flex-1 flex flex-col justify-between min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col lg:grid lg:grid-cols-[1fr_minmax(0,36rem)_1fr] items-center gap-1 sm:gap-3 xl:gap-6 w-full min-h-0 py-0.5 sm:py-1">
          {/* Desktop Right Ad Panel (2 stacked banners) */}
          <DesktopSponsorPanel
            side="right"
            adIndices={[0, 1]}
            darkMode={settings.darkMode}
            showAds={true}
            onOpenContact={() => setIsContactOpen(true)}
            onNotify={showToast}
          />

          {/* Center Column: Game Board & Persian Keyboard */}
          <main className="flex-1 flex flex-col items-center justify-between w-full max-w-xl mx-auto h-full min-h-0">
            {/* Live Admin Announcement Banner */}
            {siteAnnouncement?.enabled && siteAnnouncement.message && !announcementDismissed && (
              <div
                className={`w-full shrink-0 mb-1 px-3 py-2 rounded-xl flex items-center justify-between gap-2 text-xs font-bold ${
                  siteAnnouncement.tone === 'purple'
                    ? settings.darkMode
                      ? 'bg-purple-500/20 text-purple-200'
                      : 'bg-purple-100 text-purple-900'
                    : siteAnnouncement.tone === 'amber'
                      ? settings.darkMode
                        ? 'bg-amber-500/20 text-amber-200'
                        : 'bg-amber-100 text-amber-900'
                      : siteAnnouncement.tone === 'sky'
                        ? settings.darkMode
                          ? 'bg-sky-500/20 text-sky-200'
                          : 'bg-sky-100 text-sky-900'
                        : settings.darkMode
                          ? 'bg-emerald-500/20 text-emerald-200'
                          : 'bg-emerald-100 text-emerald-900'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Megaphone className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{siteAnnouncement.message}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {siteAnnouncement.linkUrl && siteAnnouncement.linkUrl.startsWith('https://') && (
                    <a
                      href={siteAnnouncement.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/15 hover:bg-black/25 transition-colors text-[11px]"
                    >
                      <span>مشاهده</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setAnnouncementDismissed(true)}
                    className="p-1 rounded-lg hover:bg-black/15 transition-colors"
                    aria-label="بستن اطلاعیه"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Mobile Compact Top Ad Strip (only on < lg) */}
            <div className="lg:hidden w-full shrink-0">
              <AdBanner
                position="top"
                darkMode={settings.darkMode}
                onNotify={showToast}
                onOpenContact={() => setIsContactOpen(true)}
              />
            </div>

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
                targetWord={currentGame.targetWord.word}
                revealedHints={currentGame.revealedHints || []}
              />
            </div>

            {/* Persian Virtual Keyboard */}
            <div className="w-full pb-1 sm:pb-2 shrink-0">
              <PersianKeyboard
                onChar={handleChar}
                onEnter={handleEnter}
                onDelete={handleDelete}
                evaluations={currentGame.evaluations}
                targetWord={currentGame.targetWord.word}
                revealedHints={currentGame.revealedHints || []}
                disabled={currentGame.status !== 'playing'}
                darkMode={settings.darkMode}
                highContrast={settings.highContrast}
                wordLength={currentLength}
                lastPressedKey={lastPressedKey}
              />
            </div>
          </main>

          {/* Desktop Left Ad Panel (2 stacked banners) */}
          <DesktopSponsorPanel
            side="left"
            adIndices={[2, 3]}
            darkMode={settings.darkMode}
            showAds={true}
            onOpenContact={() => setIsContactOpen(true)}
            onNotify={showToast}
          />
        </div>
      </div>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onLoginSuccess={handleLoginSuccess}
        onClose={handleCloseLogin}
        currentUsername={currentAccount?.username}
        onLogout={handleLogout}
        darkMode={settings.darkMode}
        promptReason={loginPromptReason}
        guestStats={stats}
        guestGameStates={gameStates}
        pendingReferrer={pendingReferrer}
        referralsCount={stats.referralsCount || 0}
        referralPointsEarned={stats.referralPointsEarned || 0}
        onNotify={showToast}
        onReferralConsumed={() => {
          clearPendingReferrer();
          setPendingReferrerState(null);
        }}
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
        isLoggedIn={Boolean(currentAccount)}
        username={currentAccount?.username}
        gameStates={gameStates}
        onOpenLogin={() => {
          setLoginPromptReason('default');
          setIsLoginOpen(true);
        }}
        onNotify={showToast}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newSettings) =>
          setSettings((prev) => ({ ...prev, ...newSettings }))
        }
        canChangeHardMode={currentGame.guesses.length === 0}
        notificationPermission={notificationPermission}
        notificationsEnabled={notificationsEnabled}
        onToggleNotifications={handleToggleNotifications}
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        onInstallApp={handleInstallApp}
        onOpenInstallGuide={() => {
          setHelpInitialSlide(1);
          setIsHelpOpen(true);
        }}
      />

      <HelpModal
        isOpen={isHelpOpen}
        onClose={handleCloseHelp}
        darkMode={settings.darkMode}
        initialSlide={helpInitialSlide}
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        isIOS={isIOS}
        onInstallApp={handleInstallApp}
        notificationPermission={notificationPermission}
        notificationsEnabled={notificationsEnabled}
        onEnableNotifications={handleEnableNotifications}
        onSendTestNotification={handleSendTestNotification}
      />

      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
        darkMode={settings.darkMode}
        onNotify={showToast}
      />
    </div>
  );
}
