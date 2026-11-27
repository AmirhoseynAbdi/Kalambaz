import { WordEntry, EvaluationResult, PlayerStats } from '../types';

/**
 * Normalizes Persian string (unifies Arabic/Persian variants like ك/ی, removes zero-width characters)
 */
export function normalizePersian(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .replace(/[يیى]/g, 'ی')
    .replace(/[كک]/g, 'ک')
    .replace(/ة/g, 'ه')
    .replace(/[\u064B-\u065F\u0670]/g, '') // remove Arabic diacritics/harakat
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // remove invisible spaces/joiners
    .replace(/\s+/g, '');
}

/**
 * Loose normalization that also equates آ/أ/إ with ا and ئ/ؤ with ی/و for forgiving dictionary lookup.
 */
export function normalizeLoosePersian(text: string): string {
  return normalizePersian(text)
    .replace(/[آأإ]/g, 'ا')
    .replace(/ئ/g, 'ی')
    .replace(/ؤ/g, 'و');
}

/**
 * Evaluates a guess against a target word following official Wordle duplicate-letter rules.
 * 1. Find exact matches ('correct' / green) and mark them.
 * 2. For remaining letters, if target has remaining occurrences of that letter, mark as 'present' (yellow).
 * 3. Otherwise mark as 'absent' (gray).
 */
export function evaluateGuess(guess: string, target: string): EvaluationResult[] {
  const normGuess = normalizePersian(guess);
  const normTarget = normalizePersian(target);
  const len = normTarget.length;

  const guessChars = Array.from(normGuess);
  const targetChars = Array.from(normTarget);

  const results: EvaluationResult[] = guessChars.map((letter) => ({
    letter,
    status: 'absent' as const,
  }));

  // Frequency map for target letters not yet matched exactly
  const targetFrequencies: { [char: string]: number } = {};

  // First pass: identify exact matches
  for (let i = 0; i < len; i++) {
    const tChar = targetChars[i];
    const gChar = guessChars[i];

    if (gChar === tChar) {
      results[i].status = 'correct';
    } else {
      targetFrequencies[tChar] = (targetFrequencies[tChar] || 0) + 1;
    }
  }

  // Second pass: identify letters present in other spots
  for (let i = 0; i < len; i++) {
    if (results[i].status === 'correct') continue;

    const gChar = guessChars[i];
    if (targetFrequencies[gChar] && targetFrequencies[gChar] > 0) {
      results[i].status = 'present';
      targetFrequencies[gChar]--;
    } else {
      results[i].status = 'absent';
    }
  }

  return results;
}

/**
 * Checks if a guess satisfies Hard Mode rules based on previous attempts:
 * - Any letter confirmed 'correct' (green) must be used at that exact same index.
 * - Any letter confirmed 'present' (yellow) must be included anywhere in the guess.
 */
export function validateHardMode(
  guess: string,
  previousEvaluations: { word: string; result: EvaluationResult[] }[]
): { valid: boolean; reason?: string } {
  const normGuess = normalizePersian(guess);
  const guessChars = Array.from(normGuess);

  for (const prev of previousEvaluations) {
    // 1. Check greens (exact placement)
    for (let i = 0; i < prev.result.length; i++) {
      const item = prev.result[i];
      if (item.status === 'correct') {
        if (guessChars[i] !== item.letter) {
          const posPersian = (i + 1).toLocaleString('fa-IR');
          return {
            valid: false,
            reason: `در حالت سخت، حرف ${posPersian}ام باید «${item.letter}» باشد`,
          };
        }
      }
    }

    // 2. Check yellows (must be present)
    for (const item of prev.result) {
      if (item.status === 'present') {
        if (!normGuess.includes(item.letter)) {
          return {
            valid: false,
            reason: `در حالت سخت، حدس جدید باید حتماً شامل حرف «${item.letter}» باشد`,
          };
        }
      }
    }
  }

  return { valid: true };
}

/**
 * Helper to compute days difference between two ISO date strings (YYYY-MM-DD)
 */
export function getDaysDifference(dateStr1: string, dateStr2: string): number {
  if (!dateStr1 || !dateStr2) return 999;
  const d1 = new Date(dateStr1 + 'T00:00:00Z').getTime();
  const d2 = new Date(dateStr2 + 'T00:00:00Z').getTime();
  const diffMs = Math.abs(d2 - d1);
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Formats a Date to YYYY-MM-DD
 */
export function getTodayDateString(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Initial starter points granted once to every user.
 */
export const STARTING_POINTS = 50;

/**
 * Cost in points to reveal one unfound green (correct position) letter hint.
 */
export const HINT_COST = 10;

/**
 * Ensures every user receives the one-time 50-point starter gift
 * without granting it twice or overwriting spent/earned points.
 */
export function ensureStarterBonus(stats: PlayerStats): PlayerStats {
  const safePoints = Math.max(0, Number(stats.points) || 0);
  if (stats.starterBonusGranted) {
    return {
      ...stats,
      points: safePoints,
      starterBonusGranted: true,
    };
  }

  return {
    ...stats,
    points: safePoints + STARTING_POINTS,
    starterBonusGranted: true,
  };
}

/**
 * Reward points multiplied per remaining guess (6th try = 2 pts ... 1st try = 12 pts).
 */
export const REWARD_POINTS_PER_GUESS = 2;

/**
 * Calculates points earned for a correct word guess.
 * Fewer tries earn more points (2 points per remaining guess):
 * 1 try: 12 pts | 2 tries: 10 pts | 3 tries: 8 pts | 4 tries: 6 pts | 5 tries: 4 pts | 6 tries: 2 pts
 */
export function calculateGuessPoints(numGuesses: number, isWin: boolean): number {
  if (!isWin || numGuesses < 1 || numGuesses > 6) return 0;
  return (7 - numGuesses) * REWARD_POINTS_PER_GUESS;
}

/**
 * Finds the next unfound green letter (a letter position not yet guessed as 'correct'
 * in any previous attempt and not yet revealed via a hint).
 */
export function getAvailableGreenHint(
  targetWord: string,
  evaluations: EvaluationResult[][],
  revealedHints: number[] = []
): { index: number; letter: string } | null {
  const normTarget = normalizePersian(targetWord);
  const targetChars = Array.from(normTarget);
  if (targetChars.length === 0) return null;

  for (let i = 0; i < targetChars.length; i++) {
    const alreadyGreen = evaluations.some((row) => row && row[i]?.status === 'correct');
    const alreadyHinted = revealedHints.includes(i);
    if (!alreadyGreen && !alreadyHinted) {
      return { index: i, letter: targetChars[i] };
    }
  }

  return null;
}

/**
 * Validates and applies a green-letter hint purchase using player points.
 */
export function applyGreenHint(
  currentPoints: number,
  targetWord: string,
  evaluations: EvaluationResult[][],
  revealedHints: number[] = [],
  cost: number = HINT_COST
): {
  ok: boolean;
  error?: string;
  hint?: { index: number; letter: string };
  remainingPoints: number;
  updatedHints: number[];
} {
  const safePoints = Math.max(0, Number(currentPoints) || 0);
  if (safePoints < cost) {
    return {
      ok: false,
      error: `بذر کافی ندارید! برای دریافت راهنمای حرف سبز به ${cost.toLocaleString('fa-IR')} بذر نیاز دارید (موجودی فعلی: ${safePoints.toLocaleString('fa-IR')} بذر).`,
      remainingPoints: safePoints,
      updatedHints: [...revealedHints],
    };
  }

  const nextHint = getAvailableGreenHint(targetWord, evaluations, revealedHints);
  if (!nextHint) {
    return {
      ok: false,
      error: 'تمام حروف سبز این کلمه قبلاً پیدا یا آشکار شده‌اند!',
      remainingPoints: safePoints,
      updatedHints: [...revealedHints],
    };
  }

  return {
    ok: true,
    hint: nextHint,
    remainingPoints: safePoints - cost,
    updatedHints: [...revealedHints, nextHint.index],
  };
}

/**
 * Updates streak and points based on completed game.
 * Rule: Daily streak increases or is preserved simply by playing for the day,
 * EVEN IN THE CASE OF FAILING TO GUESS THE WORD.
 * Points are awarded on every winning game inversely proportional to the number of tries.
 */
export function updateDailyStreak(
  currentStats: PlayerStats,
  todayStr: string,
  isWin: boolean,
  numGuesses: number,
  wordLength?: 4 | 5 | 6
): PlayerStats {
  const existingCompleted: { [dateKey: string]: (4 | 5 | 6)[] } = {};
  if (currentStats.completedDates && typeof currentStats.completedDates === 'object') {
    for (const [k, v] of Object.entries(currentStats.completedDates)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(k) && Array.isArray(v)) {
        existingCompleted[k] = [...v];
      }
    }
  }

  const stats: PlayerStats = {
    ...currentStats,
    points: Math.max(0, Number(currentStats.points) || 0),
    guessDistribution: { ...currentStats.guessDistribution },
    completedDates: existingCompleted,
  };

  stats.gamesPlayed += 1;
  if (isWin) {
    stats.gamesWon += 1;
    stats.guessDistribution[numGuesses] = (stats.guessDistribution[numGuesses] || 0) + 1;
    stats.points += calculateGuessPoints(numGuesses, true);

    if (/^\d{4}-\d{2}-\d{2}$/.test(todayStr)) {
      const prevLengths = existingCompleted[todayStr] || [];
      if (wordLength && !prevLengths.includes(wordLength)) {
        existingCompleted[todayStr] = [...prevLengths, wordLength].sort((a, b) => a - b) as (
          | 4
          | 5
          | 6
        )[];
      } else if (!(todayStr in existingCompleted)) {
        existingCompleted[todayStr] = [];
      }
    }
  }

  // Check streak based on day continuity
  if (!stats.lastPlayedDate) {
    stats.currentStreak = 1;
  } else if (stats.lastPlayedDate === todayStr) {
    // Already recorded a game today, keep current streak
  } else {
    const diff = getDaysDifference(stats.lastPlayedDate, todayStr);
    if (diff === 1) {
      // Consecutive day!
      stats.currentStreak += 1;
    } else {
      // Gap in days, reset to 1
      stats.currentStreak = 1;
    }
  }

  stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
  stats.lastPlayedDate = todayStr;

  return stats;
}

/**
 * Returns the ID prefix for a word length ("four", "five", or "six").
 */
export function getWordPrefix(length: 4 | 5 | 6): 'four' | 'five' | 'six' {
  return length === 4 ? 'four' : length === 5 ? 'five' : 'six';
}

/**
 * Ensures every entry in a word list has a sequential counter id ("four1", "four2", etc.)
 * and normalizes Persian characters while deduplicating identical words.
 */
export function normalizeWordList(
  length: 4 | 5 | 6,
  rawList: Array<{ id?: string; word: string } | string>
): WordEntry[] {
  const prefix = getWordPrefix(length);
  const seen = new Set<string>();
  const cleaned: { word: string }[] = [];

  for (const item of rawList || []) {
    const word = normalizePersian(typeof item === 'string' ? item : item?.word || '');
    if (word.length === length && !seen.has(word)) {
      seen.add(word);
      cleaned.push({ word });
    }
  }

  return cleaned.map((item, idx) => ({
    id: `${prefix}${idx + 1}`,
    word: item.word,
  }));
}

/**
 * Merges two word lists (e.g., eligible guess words and daily target words) and normalizes them.
 */
export function mergeWordLists(
  length: 4 | 5 | 6,
  primaryList: Array<{ id?: string; word: string } | string>,
  secondaryList?: Array<{ id?: string; word: string } | string> | null
): WordEntry[] {
  const combined = [...(primaryList || []), ...(secondaryList || [])];
  return normalizeWordList(length, combined);
}

const vocabularySetCache = new WeakMap<
  object,
  { strict: Set<string>; loose: Set<string> }
>();

function getOrBuildVocabularySets(
  list: Array<{ id?: string; word: string } | string>
): { strict: Set<string>; loose: Set<string> } {
  const cached = vocabularySetCache.get(list);
  if (cached) return cached;

  const strict = new Set<string>();
  const loose = new Set<string>();

  for (let i = 0; i < list.length; i++) {
    const entry = list[i];
    const rawWord = typeof entry === 'string' ? entry : entry?.word;
    if (!rawWord) continue;
    const normEntry = normalizePersian(rawWord);
    if (!normEntry) continue;
    strict.add(normEntry);
    const looseEntry = normalizeLoosePersian(rawWord);
    if (looseEntry.length === normEntry.length) {
      loose.add(looseEntry);
    }
  }

  const built = { strict, loose };
  vocabularySetCache.set(list, built);
  return built;
}

/**
 * Checks whether a guessed word exists in the eligible guess word list or the daily puzzle target word list.
 * Uses WeakMap-cached O(1) Set lookups for instant validation across 85,000+ words.
 */
export function isWordInVocabulary(
  guess: string,
  eligibleGuessList: Array<{ id?: string; word: string } | string>,
  dailyTargetList?: Array<{ id?: string; word: string } | string>
): boolean {
  const normGuess = normalizePersian(guess);
  if (!normGuess) return false;
  const looseGuess = normalizeLoosePersian(guess);
  const canCheckLoose = looseGuess.length === normGuess.length;

  if (eligibleGuessList && eligibleGuessList.length > 0) {
    const { strict, loose } = getOrBuildVocabularySets(eligibleGuessList);
    if (strict.has(normGuess) || (canCheckLoose && loose.has(looseGuess))) {
      return true;
    }
  }

  if (dailyTargetList && dailyTargetList.length > 0) {
    const { strict, loose } = getOrBuildVocabularySets(dailyTargetList);
    if (strict.has(normGuess) || (canCheckLoose && loose.has(looseGuess))) {
      return true;
    }
  }

  return false;
}

const normalizedListCache = new WeakMap<object, WordEntry[]>();

/**
 * Selects a deterministic daily 4-letter, 5-letter, or 6-letter word based on date and length
 * using its counter ID ("four1".."fourN", "five1".."fiveN", "six1".."sixN") so it is identical
 * for all users on the same calendar day (like Wordle).
 */
export function getDailyWord(
  dateStr: string,
  length: 4 | 5 | 6,
  wordsList: WordEntry[]
): WordEntry {
  const prefix = getWordPrefix(length);
  let cleanList: WordEntry[];
  if (wordsList && typeof wordsList === 'object') {
    const cached = normalizedListCache.get(wordsList);
    if (cached) {
      cleanList = cached;
    } else {
      cleanList = normalizeWordList(length, wordsList);
      normalizedListCache.set(wordsList, cleanList);
    }
  } else {
    cleanList = normalizeWordList(length, []);
  }

  if (cleanList.length === 0) {
    return {
      id: `${prefix}1`,
      word: length === 4 ? 'واژه' : length === 5 ? 'باران' : 'خورشید',
    };
  }

  // Deterministic hash from YYYY-MM-DD and word length prefix ("four", "five", "six")
  let hash = 2166136261;
  const seedKey = `kalabaz_daily_${dateStr}_${prefix}`;
  for (let i = 0; i < seedKey.length; i++) {
    hash ^= seedKey.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  const positiveHash = Math.abs(hash);
  const counterNum = (positiveHash % cleanList.length) + 1;
  const targetId = `${prefix}${counterNum}`;

  const matchedById = cleanList.find((w) => w.id === targetId);
  if (matchedById) {
    return { id: matchedById.id, word: matchedById.word };
  }

  const fallback = cleanList[counterNum - 1] || cleanList[0];
  return {
    id: fallback.id || targetId,
    word: fallback.word,
  };
}

