
// Game configuration
export const GAME_CONFIG = {
  MAX_ATTEMPTS: 6,
  MAX_BLUR: 30,
  BLUR_STEP: 6,
  SUGGESTIONS_LIMIT: 10,
  POOL_DISPLAY_LIMIT: 50,
} as const;

// Storage keys
export const STORAGE_KEYS = {
  STATS: 'wt_guesser_stats',
  ACHIEVEMENTS: 'wt_guesser_achievements',
} as const;

// API configuration
export const API_CONFIG = {
  PAGE_SIZE: 200,
  MAX_NATION_PAGES: 15,
  BASE_URL_DEV: '/api',
  BASE_URL_PROD: 'https://www.wtvehiclesapi.sgambe.serv00.net/api',
} as const;

// Supported nations
export const API_NATIONS = [
  'britain',
  'china',
  'france',
  'germany',
  'israel',
  'italy',
  'japan',
  'sweden',
  'usa',
  'ussr',
] as const;

export type ApiNation = typeof API_NATIONS[number];

// Ground vehicle types
export const GROUND_VEHICLE_TYPES = [
  'tank',
  'light_tank',
  'medium_tank',
  'heavy_tank',
  'tank_destroyer',
  'spaa',
  'lbv',
  'mbv',
  'hbv',
] as const;

export type GroundVehicleType = typeof GROUND_VEHICLE_TYPES[number];

// Roman numeral mapping
export const ROMAN_MAP: Record<number, string> = {
  1: 'I',
  2: 'II',
  3: 'III',
  4: 'IV',
  5: 'V',
  6: 'VI',
  7: 'VII',
  8: 'VIII',
  9: 'IX',
} as const;

export const ROMAN_TO_ARABIC: Record<string, string> = {
  'i': '1',
  'ii': '2',
  'iii': '3',
  'iv': '4',
  'v': '5',
  'vi': '6',
  'vii': '7',
  'viii': '8',
  'ix': '9',
  'x': '10',
} as const;

// Nation display names
export const NATION_NAMES: Record<string, string> = {
  'usa': 'USA',
  'germany': 'Germany',
  'ussr': 'USSR',
  'britain': 'Great Britain',
  'japan': 'Japan',
  'china': 'China',
  'italy': 'Italy',
  'france': 'France',
  'sweden': 'Sweden',
  'israel': 'Israel',
} as const;

// Country prefixes for ID parsing
export const COUNTRY_PREFIXES: Record<string, string> = {
  'usa': 'us',
  'germany': 'germ',
  'ussr': 'ussr',
  'britain': 'uk',
  'japan': 'jp',
  'china': 'cn',
  'italy': 'it',
  'france': 'fr',
  'sweden': 'sw',
  'israel': 'il',
} as const;

// Acronyms that should be uppercase
export const FORCE_UPPERCASE = new Set([
  'df', 'cm', 'pt', 'bk', 'is', 'kv', 'cv', 'pv', 'ikv', 'strv',
  'lvkv', 'pbv', 'pvkv', 'sav', 'amx', 'amd', 'aml', 'ztz', 'zsd',
  'zbd', 'pgz', 'bmd', 'bmp', 'btr', 'asus', 'm1', 'm2', 'm3', 'm4',
  'm60', 't54', 't55', 't62', 't64', 't72', 't80', 't90',
]);

// High ranks for Cold War achievement
export const HIGH_RANKS = ['VI', 'VII', 'VIII'] as const;

// Sound types
export type SoundType = 'wrong' | 'reveal' | 'win' | 'loss' | 'click' | 'start';

// Default game stats
export const DEFAULT_GAME_STATS = {
  gamesPlayed: 0,
  wins: 0,
  currentStreak: 0,
  maxStreak: 0,
} as const;
