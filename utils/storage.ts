
import { GameStats, AchievementState } from '../types';
import { STORAGE_KEYS, DEFAULT_GAME_STATS } from '../constants';

const INITIAL_ACHIEVEMENT_STATE: AchievementState = {
  unlockedIds: [],
  stats: {
    germanWins: 0,
    coldWarStreak: 0,
    totalWins: 0,
    perfectGames: 0,
  },
};

/**
 * Safely parse JSON from localStorage with fallback
 */
function safeJsonParse<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  
  try {
    return JSON.parse(json) as T;
  } catch {
    console.warn('Failed to parse localStorage data, using fallback');
    return fallback;
  }
}

/**
 * Safely stringify and store data in localStorage
 */
function safeJsonStore(key: string, data: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Failed to store data in localStorage:', error);
    return false;
  }
}

// Game Stats functions
export function getGameStats(): GameStats {
  return safeJsonParse(localStorage.getItem(STORAGE_KEYS.STATS), { ...DEFAULT_GAME_STATS });
}

export function saveGameStats(stats: GameStats): boolean {
  return safeJsonStore(STORAGE_KEYS.STATS, stats);
}

export function updateGameStats(won: boolean): GameStats {
  const currentStats = getGameStats();
  
  currentStats.gamesPlayed += 1;

  if (won) {
    currentStats.wins += 1;
    currentStats.currentStreak += 1;
    currentStats.maxStreak = Math.max(currentStats.maxStreak, currentStats.currentStreak);
  } else {
    currentStats.currentStreak = 0;
  }

  saveGameStats(currentStats);
  return currentStats;
}

// Achievement State functions
export function getAchievementState(): AchievementState {
  return safeJsonParse(localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS), { ...INITIAL_ACHIEVEMENT_STATE });
}

export function saveAchievementState(state: AchievementState): boolean {
  return safeJsonStore(STORAGE_KEYS.ACHIEVEMENTS, state);
}
