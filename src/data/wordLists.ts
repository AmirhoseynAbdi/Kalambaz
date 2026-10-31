import { WordEntry } from '../types';
import dailyWords4 from './dailyWords4.json';
import dailyWords5 from './dailyWords5.json';
import dailyWords6 from './dailyWords6.json';
import eligibleWords4 from './eligibleWords4.json';
import eligibleWords5 from './eligibleWords5.json';
import eligibleWords6 from './eligibleWords6.json';

/**
 * Curated daily puzzle target words (words that can be selected as the daily answer).
 */
export const DAILY_WORDS: { 4: WordEntry[]; 5: WordEntry[]; 6: WordEntry[] } = {
  4: dailyWords4 as WordEntry[],
  5: dailyWords5 as WordEntry[],
  6: dailyWords6 as WordEntry[],
};

/**
 * Broad vocabulary of valid words players can guess to clear letters.
 */
export const ELIGIBLE_WORDS: { 4: WordEntry[]; 5: WordEntry[]; 6: WordEntry[] } = {
  4: eligibleWords4 as WordEntry[],
  5: eligibleWords5 as WordEntry[],
  6: eligibleWords6 as WordEntry[],
};
