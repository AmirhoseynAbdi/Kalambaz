import { WordEntry } from '../types';
import dailyWords4Json from './dailyWords4.json';
import dailyWords5Json from './dailyWords5.json';
import dailyWords6Json from './dailyWords6.json';
import eligibleWords4Json from './eligibleWords4.json';
import eligibleWords5Json from './eligibleWords5.json';
import eligibleWords6Json from './eligibleWords6.json';
import { normalizeWordList } from '../game/wordleLogic';

/**
 * 1. DAILY PUZZLE TARGET WORDS (کلمات هدف معمای روزانه)
 * Curated, common Persian words used exclusively to select the daily puzzle solution.
 * Files:
 *  - src/data/dailyWords4.json
 *  - src/data/dailyWords5.json
 *  - src/data/dailyWords6.json
 */
export const DAILY_WORDS: Record<4 | 5 | 6, WordEntry[]> = {
  4: normalizeWordList(4, dailyWords4Json as Array<WordEntry | string>),
  5: normalizeWordList(5, dailyWords5Json as Array<WordEntry | string>),
  6: normalizeWordList(6, dailyWords6Json as Array<WordEntry | string>),
};

/**
 * 2. ELIGIBLE GUESS WORDS (کلمات مجاز برای حدس زدن)
 * Comprehensive Persian word lists accepted as valid player guesses.
 * Files:
 *  - src/data/eligibleWords4.json
 *  - src/data/eligibleWords5.json
 *  - src/data/eligibleWords6.json
 */
export const ELIGIBLE_WORDS: Record<4 | 5 | 6, WordEntry[]> = {
  4: normalizeWordList(4, eligibleWords4Json as Array<WordEntry | string>),
  5: normalizeWordList(5, eligibleWords5Json as Array<WordEntry | string>),
  6: normalizeWordList(6, eligibleWords6Json as Array<WordEntry | string>),
};
