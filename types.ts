
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
