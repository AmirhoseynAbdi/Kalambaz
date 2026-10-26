import { WordEntry, EvaluationResult, PlayerStats } from '../types';

/**
 * Normalizes Persian string (unifies Arabic/Persian variants like ك/ی, removes zero-width characters)
 */
export function normalizePersian(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // remove invisible spaces/joiners
    .replace(/\s+/g, '');
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
 * Updates streak based on completed game.
 * Rule: Daily streak increases or is preserved simply by playing for the day,
 * EVEN IN THE CASE OF FAILING TO GUESS THE WORD.
 */
export function updateDailyStreak(
  currentStats: PlayerStats,
  todayStr: string,
  isWin: boolean,
  numGuesses: number
): PlayerStats {
  const stats: PlayerStats = {
    ...currentStats,
    guessDistribution: { ...currentStats.guessDistribution },
  };

  stats.gamesPlayed += 1;
  if (isWin) {
    stats.gamesWon += 1;
    stats.guessDistribution[numGuesses] = (stats.guessDistribution[numGuesses] || 0) + 1;
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
 * and strips any legacy fields.
 */
export function normalizeWordList(
  length: 4 | 5 | 6,
  rawList: Array<{ id?: string; word: string }>
): WordEntry[] {
  const prefix = getWordPrefix(length);
  return rawList
    .map((item) => ({
      word: normalizePersian(item?.word || ''),
    }))
    .filter((item) => item.word.length === length)
    .map((item, idx) => ({
      id: `${prefix}${idx + 1}`,
      word: item.word,
    }));
}

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

  if (!wordsList || wordsList.length === 0) {
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
  const counterNum = (positiveHash % wordsList.length) + 1;
  const targetId = `${prefix}${counterNum}`;

  const matchedById = wordsList.find((w) => w.id === targetId);
  if (matchedById) {
    return { id: matchedById.id, word: matchedById.word };
  }

  const fallback = wordsList[counterNum - 1] || wordsList[0];
  return {
    id: fallback.id || targetId,
    word: fallback.word,
  };
}

