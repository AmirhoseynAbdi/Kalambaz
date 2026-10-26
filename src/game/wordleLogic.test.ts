import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizePersian,
  evaluateGuess,
  validateHardMode,
  updateDailyStreak,
  getDailyWord,
} from './wordleLogic';
import { PlayerStats, WordEntry } from '../types';

test('normalizePersian handles Arabic variants and spaces', () => {
  assert.equal(normalizePersian(' كِتاب '), 'کِتاب');
  assert.equal(normalizePersian('علي'), 'علی');
  assert.equal(normalizePersian('کلم\u200Cباز'), 'کلمباز');
});

test('evaluateGuess calculates correct, present, and absent statuses', () => {
  // Target: "باران" (letters: ب, ا, ر, ا, ن)
  // Guess 1: "باران" -> all correct
  const resExact = evaluateGuess('باران', 'باران');
  assert.equal(resExact.every((r) => r.status === 'correct'), true);

  // Guess 2: "آسمان" against "باران"
  // target: [ب, ا, ر, ا, ن]
  // guess:  [آ, س, م, ا, ن]
  // index 3: 'ا' matches target[3] -> 'correct'!
  // index 4: 'ن' matches target[4] -> 'correct'!
  // index 0: 'آ' is not in باران -> 'absent'
  // index 1: 'س' is not in باران -> 'absent'
  // index 2: 'م' is not in باران -> 'absent'
  const res2 = evaluateGuess('آسمان', 'باران');
  assert.equal(res2[4].status, 'correct'); // 'ن' matches exact position
  assert.equal(res2[3].status, 'correct'); // 'ا' matches exact position at idx 3
  assert.equal(res2[1].status, 'absent');  // 'س' not in باران

  // Guess 3: test 'present' status with displaced letters
  // Target: "بهار" [ب, ه, ا, ر]
  // Guess:  "دریا" [د, ر, ی, ا]
  // 'د': absent, 'ر': present (target has 'ر' at index 3), 'ی': absent, 'ا': present (target has 'ا' at index 2)
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

  // Guess missing 'ب' at position 1 (index 0)
  const checkGreenFail = validateHardMode('دریا', previous);
  assert.equal(checkGreenFail.valid, false);
  assert.match(checkGreenFail.reason || '', /حرف ۱ام باید «ب» باشد/);

  // Guess has 'ب' at position 1, but lacks 'ا' (yellow)
  const checkYellowFail = validateHardMode('بلبل', previous);
  assert.equal(checkYellowFail.valid, false);
  assert.match(checkYellowFail.reason || '', /شامل حرف «ا» باشد/);

  // Guess has 'ب' at position 1 and includes 'ا'
  const checkPass = validateHardMode('باران'.slice(0, 4), previous); // "بارا"
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

  // Played next consecutive day (2026-10-26), but LOST the game
  const updatedLost = updateDailyStreak(initialStats, '2026-10-26', false, 6);

  // Games played increments
  assert.equal(updatedLost.gamesPlayed, 6);
  // Games won DOES NOT increment on loss
  assert.equal(updatedLost.gamesWon, 4);
  // DAILY STREAK STILL INCREMENTS (as requested by user brief!)
  assert.equal(updatedLost.currentStreak, 4);
  assert.equal(updatedLost.maxStreak, 4);
  assert.equal(updatedLost.lastPlayedDate, '2026-10-26');

  // Same day replay does not increment streak again
  const sameDay = updateDailyStreak(updatedLost, '2026-10-26', true, 3);
  assert.equal(sameDay.currentStreak, 4);

  // Playing after 3 days gap resets streak to 1
  const afterGap = updateDailyStreak(sameDay, '2026-10-30', false, 6);
  assert.equal(afterGap.currentStreak, 1);
});

test('getDailyWord selects deterministically for date and length', () => {
  const sampleVocab4: WordEntry[] = [
    { word: 'بهار', meaning: 'بهار' },
    { word: 'کتاب', meaning: 'کتاب' },
  ];
  const sampleVocab5: WordEntry[] = [
    { word: 'باران', meaning: 'باران' },
    { word: 'آسمان', meaning: 'آسمان' },
  ];

  const word1 = getDailyWord('2026-10-26', 4, sampleVocab4);
  const word2 = getDailyWord('2026-10-26', 4, sampleVocab4);
  assert.equal(word1.word, word2.word);

  const word5 = getDailyWord('2026-10-26', 5, sampleVocab5);
  assert.equal(word5.word.length, 5);
});
