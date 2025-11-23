export enum GameState {
  MENU = 'MENU',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}

export enum Difficulty {
  EASY = 'EASY',
  HARD = 'HARD'
}

export interface VehicleData {
  name: string;
  nation: string;
  rank: string;
  br: number;
  vehicleType: string;
  armament: string;
  description: string;
  aliases: string[];
}

export interface VehicleSummary {
  id: string;
  name: string;
  nation: string;
  rank: string;
  br: number;
  vehicleType: string;
  image: string;
}

export interface GuessResult {
  guess: string;
  isCorrect: boolean;
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