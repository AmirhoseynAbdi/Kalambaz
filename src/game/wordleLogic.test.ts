import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizePersian,
  evaluateGuess,
  validateHardMode,
  updateDailyStreak,
  getDailyWord,
  normalizeWordList,
  getWordPrefix,
  mergeWordLists,
  isWordInVocabulary,
} from './wordleLogic';
import { PlayerStats, WordEntry } from '../types';
import { DAILY_WORDS, ELIGIBLE_WORDS } from '../data/wordLists';

test('normalizePersian handles Arabic variants, diacritics, and spaces', () => {
  assert.equal(normalizePersian(' كِتاب '), 'کتاب');
  assert.equal(normalizePersian('علي'), 'علی');
  assert.equal(normalizePersian('کلم\u200Cباز'), 'کلمباز');
});

test('evaluateGuess calculates correct, present, and absent statuses', () => {
  const resExact = evaluateGuess('باران', 'باران');
  assert.equal(resExact.every((r) => r.status === 'correct'), true);

  const res2 = evaluateGuess('آسمان', 'باران');
  assert.equal(res2[4].status, 'correct');
  assert.equal(res2[3].status, 'correct');
  assert.equal(res2[1].status, 'absent');

  const res3 = evaluateGuess('دریا', 'بهار');
  assert.equal(res3[0].status, 'absent');
  assert.equal(res3[1].status, 'present');
  assert.equal(res3[2].status, 'absent');
  assert.equal(res3[3].status, 'present');
});

test('validateHardMode enforces green and yellow constraints', () => {
  const previous = [
    {
      word: 'بهار',
      result: [
        { letter: 'ب', status: 'correct' as const },
        { letter: 'ه', status: 'absent' as const },
        { letter: 'ا', status: 'present' as const },
        { letter: 'ر', status: 'absent' as const },
      ],
    },
  ];

  const checkGreenFail = validateHardMode('دریا', previous);
  assert.equal(checkGreenFail.valid, false);
  assert.match(checkGreenFail.reason || '', /حرف ۱ام باید «ب» باشد/);

  const checkYellowFail = validateHardMode('بلبل', previous);
  assert.equal(checkYellowFail.valid, false);
  assert.match(checkYellowFail.reason || '', /شامل حرف «ا» باشد/);

  const checkPass = validateHardMode('باران'.slice(0, 4), previous);
  assert.equal(checkPass.valid, true);
});

test('updateDailyStreak updates streak even when failing to guess the word', () => {
  const initialStats: PlayerStats = {
    gamesPlayed: 5,
    gamesWon: 4,
    currentStreak: 3,
    maxStreak: 3,
    lastPlayedDate: '2026-10-25',
    guessDistribution: { 1: 0, 2: 1, 3: 1, 4: 2, 5: 0, 6: 0 },
  };

  const updatedLost = updateDailyStreak(initialStats, '2026-10-26', false, 6);
  assert.equal(updatedLost.gamesPlayed, 6);
  assert.equal(updatedLost.gamesWon, 4);
  assert.equal(updatedLost.currentStreak, 4);
  assert.equal(updatedLost.maxStreak, 4);
  assert.equal(updatedLost.lastPlayedDate, '2026-10-26');

  const sameDay = updateDailyStreak(updatedLost, '2026-10-26', true, 3);
  assert.equal(sameDay.currentStreak, 4);

  const afterGap = updateDailyStreak(sameDay, '2026-10-30', false, 6);
  assert.equal(afterGap.currentStreak, 1);
});

test('getDailyWord selects deterministically from DAILY_WORDS only, never from guess-only eligible words', () => {
  const daily4Only: WordEntry[] = [
    { id: 'four1', word: 'بهار' },
    { id: 'four2', word: 'کتاب' },
  ];
  const eligible4Broad: WordEntry[] = [
    ...daily4Only,
    { id: 'four3', word: 'لرکر' }, // uncommon guess-only word
  ];

  assert.equal(getWordPrefix(4), 'four');
  assert.equal(getWordPrefix(5), 'five');
  assert.equal(getWordPrefix(6), 'six');

  // Verify daily selection only chooses from daily4Only across many dates
  for (let day = 1; day <= 20; day++) {
    const picked = getDailyWord(`2026-10-${String(day).padStart(2, '0')}`, 4, daily4Only);
    assert.equal(
      daily4Only.some((d) => d.word === picked.word),
      true
    );
    assert.notEqual(picked.word, 'لرکر');
  }

  // Meanwhile, 'لرکر' IS accepted as a valid guess via eligible4Broad
  assert.equal(isWordInVocabulary('لرکر', eligible4Broad, daily4Only), true);
  // And any daily word is always accepted as a valid guess
  assert.equal(isWordInVocabulary('بهار', eligible4Broad, daily4Only), true);
});

test('DAILY_WORDS and ELIGIBLE_WORDS are separated and properly formatted for 4, 5, and 6 letters', () => {
  assert.equal(DAILY_WORDS[4].length, 807);
  assert.equal(DAILY_WORDS[5].length, 578);
  assert.equal(DAILY_WORDS[6].length, 322);

  assert.equal(ELIGIBLE_WORDS[4].length > DAILY_WORDS[4].length, true);
  assert.equal(ELIGIBLE_WORDS[5].length > DAILY_WORDS[5].length, true);
  assert.equal(ELIGIBLE_WORDS[6].length > DAILY_WORDS[6].length, true);

  // Curated words are in DAILY_WORDS and valid guesses
  assert.equal(DAILY_WORDS[5].some((w) => w.word === 'سرباز'), true);
  assert.equal(DAILY_WORDS[4].some((w) => w.word === 'اردک'), true);
  assert.equal(DAILY_WORDS[6].some((w) => w.word === 'خارپشت'), true);

  // Verb forms like نترسی must NEVER be in DAILY_WORDS (daily puzzle targets),
  // but MUST remain in ELIGIBLE_WORDS so players can guess them to clear letters
  assert.equal(DAILY_WORDS[5].some((w) => w.word === 'نترسی'), false);
  assert.equal(ELIGIBLE_WORDS[5].some((w) => w.word === 'نترسی'), true);
  assert.equal(isWordInVocabulary('نترسی', ELIGIBLE_WORDS[5], DAILY_WORDS[5]), true);

  assert.equal(isWordInVocabulary('سرباز', ELIGIBLE_WORDS[5], DAILY_WORDS[5]), true);
  assert.equal(isWordInVocabulary('اردک', ELIGIBLE_WORDS[4], DAILY_WORDS[4]), true);
  assert.equal(isWordInVocabulary('خارپشت', ELIGIBLE_WORDS[6], DAILY_WORDS[6]), true);
});

test('Orthography check: مسئله, رئیس, پنگوئن are properly spelled in word lists', () => {
  const e4 = ELIGIBLE_WORDS[4].map((w) => w.word);
  const e5 = ELIGIBLE_WORDS[5].map((w) => w.word);
  const e6 = ELIGIBLE_WORDS[6].map((w) => w.word);

  assert.equal(e4.includes('رئیس'), true);
  assert.equal(e4.includes('رییس'), false);
  assert.equal(e5.includes('مسئله'), true);
  assert.equal(e5.includes('مسیله'), false);
  assert.equal(e6.includes('پنگوئن'), true);
});




