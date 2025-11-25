import { Achievement, AchievementState, VehicleData, AchievementId } from '../types';
import { HIGH_RANKS } from '../constants';
import { getAchievementState, saveAchievementState } from './storage';

export const ACHIEVEMENTS_LIST: Readonly<Omit<Achievement, 'unlocked'>[]> = [
  {
    id: 'sharpshooter',
    title: 'Sharpshooter',
    description: 'Identify a target on the very first attempt.',
    icon: 'scope',
  },
  {
    id: 'iron_cross',
    title: 'Iron Cross',
    description: 'Successfully identify 10 German vehicles.',
    icon: 'cross',
    maxProgress: 10,
  },
  {
    id: 'cold_war',
    title: 'Cold War Specialist',
    description: 'Identify 5 Rank VI or higher vehicles in a row.',
    icon: 'snowflake',
    maxProgress: 5,
  },
  {
    id: 'veteran',
    title: 'Veteran',
    description: 'Win 50 games total.',
    icon: 'medal',
    maxProgress: 50,
  },
  {
    id: 'tank_ace',
    title: 'Tank Ace',
    description: 'Achieve a win streak of 10.',
    icon: 'trophy',
    maxProgress: 10,
  },
] as const;

export { getAchievementState };

/**
 * Get achievements with current progress
 */
export const getAchievements = (): Achievement[] => {
  const state = getAchievementState();

  return ACHIEVEMENTS_LIST.map((ach) => {
    let progress = 0;

    switch (ach.id) {
      case 'iron_cross':
        progress = state.stats.germanWins;
        break;
      case 'cold_war':
        progress = state.stats.coldWarStreak;
        break;
      case 'veteran':
        progress = state.stats.totalWins;
        break;
      case 'tank_ace':
        progress = 0; // Synced externally with game stats
        break;
      case 'sharpshooter':
        progress = state.stats.perfectGames;
        break;
    }

    return {
      ...ach,
      unlocked: state.unlockedIds.includes(ach.id),
      progress,
    };
  });
};

/**
 * Process game result and check for new achievement unlocks
 */
export const processGameResult = (
  vehicle: VehicleData,
  won: boolean,
  attemptsUsed: number,
  currentGlobalStreak: number
): { newUnlocks: Achievement[] } => {
  const state = getAchievementState();
  const newUnlocks: Achievement[] = [];

  // Update stats based on game result
  if (won) {
    state.stats.totalWins += 1;

    if (vehicle.nation === 'Germany') {
      state.stats.germanWins += 1;
    }

    if ((HIGH_RANKS as readonly string[]).includes(vehicle.rank)) {
      state.stats.coldWarStreak += 1;
    } else {
      state.stats.coldWarStreak = 0;
    }

    if (attemptsUsed === 0) {
      state.stats.perfectGames += 1;
    }
  } else {
    state.stats.coldWarStreak = 0;
  }

  // Check unlock conditions
  const checkUnlock = (id: AchievementId, condition: boolean): void => {
    if (condition && !state.unlockedIds.includes(id)) {
      state.unlockedIds.push(id);
      const ach = ACHIEVEMENTS_LIST.find((a) => a.id === id);
      if (ach) {
        newUnlocks.push({ ...ach, unlocked: true });
      }
    }
  };

  checkUnlock('sharpshooter', won && attemptsUsed === 0);
  checkUnlock('iron_cross', state.stats.germanWins >= 10);
  checkUnlock('cold_war', state.stats.coldWarStreak >= 5);
  checkUnlock('veteran', state.stats.totalWins >= 50);
  checkUnlock('tank_ace', currentGlobalStreak >= 10);

  saveAchievementState(state);
  return { newUnlocks };
};