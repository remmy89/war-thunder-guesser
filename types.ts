export enum GameState {
  MENU = 'MENU',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY',
}

export enum Difficulty {
  EASY = 'EASY',
  HARD = 'HARD',
}

export interface VehicleData {
  readonly name: string;
  readonly nation: string;
  readonly rank: string;
  readonly br: number;
  readonly vehicleType: string;
  readonly armament: string;
  readonly description: string;
  readonly aliases: readonly string[];
}

export interface VehicleSummary {
  readonly id: string;
  readonly name: string;
  readonly nation: string;
  readonly rank: string;
  readonly br: number;
  readonly vehicleType: string;
  readonly image: string;
}

export interface GuessResult {
  readonly guess: string;
  readonly isCorrect: boolean;
}

export type FeedbackIndicator = 'correct' | 'higher' | 'lower' | 'wrong';

export interface GuessFeedback {
  readonly vehicleName: string;
  readonly nation: { guessed: string; correct: boolean };
  readonly rank: { guessed: string; indicator: FeedbackIndicator };
  readonly br: { guessed: number; indicator: FeedbackIndicator };
  readonly vehicleType: { guessed: string; correct: boolean };
}

export interface GameStats {
  gamesPlayed: number;
  wins: number;
  currentStreak: number;
  maxStreak: number;
}


export type AchievementId = 'iron_cross' | 'sharpshooter' | 'cold_war' | 'veteran' | 'tank_ace';

export interface Achievement {
  id: AchievementId;
  title: string;
  description: string;
  icon: string; 
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

export interface AchievementState {
  unlockedIds: string[];
  stats: {
    germanWins: number;
    coldWarStreak: number; 
    totalWins: number;
    perfectGames: number;
  };
}