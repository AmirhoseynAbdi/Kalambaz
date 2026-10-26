export interface WordEntry {
  word: string; // The Persian word
  meaning?: string; // Meaning / Definition in Persian
  example?: string;
}

export type TileStatus = 'correct' | 'present' | 'absent' | 'empty' | 'tbd';

export interface EvaluationResult {
  letter: string;
  status: 'correct' | 'present' | 'absent';
}

export type GameStatus = 'playing' | 'won' | 'lost';

export interface DailyGameState {
  wordLength: 4 | 5 | 6;
  targetWord: WordEntry;
  guesses: string[];
  evaluations: EvaluationResult[][];
  status: GameStatus;
  hardMode: boolean;
  dateKey: string;
  lastPlayedAt?: number;
}

export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  lastPlayedDate: string; // YYYY-MM-DD
  guessDistribution: { [guesses: number]: number }; // 1..6 -> count
}

export interface UserAccount {
  username: string;
  password: string;
  stats: PlayerStats;
  gameStates: { [len: number]: DailyGameState };
  createdAt: string;
}

export interface AppSettings {
  darkMode: boolean;
  hardMode: boolean;
  soundEnabled: boolean;
  highContrast: boolean;
  showAds: boolean;
}
