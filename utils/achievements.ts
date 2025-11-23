import { Achievement, AchievementState, VehicleData, AchievementId } from '../types';

const STORAGE_KEY = 'wt_guesser_achievements';

const INITIAL_STATE: AchievementState = {
  unlockedIds: [],
  stats: {
    germanWins: 0,
    coldWarStreak: 0,
    totalWins: 0,
    perfectGames: 0
  }
};

export const ACHIEVEMENTS_LIST: Omit<Achievement, 'unlocked'>[] = [
  {
    id: 'sharpshooter',
    title: 'Sharpshooter',
    description: 'Identify a target on the very first attempt.',
    icon: 'scope'
  },
  {
    id: 'iron_cross',
    title: 'Iron Cross',
    description: 'Successfully identify 10 German vehicles.',
    icon: 'cross',
    maxProgress: 10
  },
  {
    id: 'cold_war',
    title: 'Cold War Specialist',
    description: 'Identify 5 Rank VI or higher vehicles in a row.',
    icon: 'snowflake',
    maxProgress: 5
  },
  {
    id: 'veteran',
    title: 'Veteran',
    description: 'Win 50 games total.',
    icon: 'medal',
    maxProgress: 50
  },
  {
    id: 'tank_ace',
    title: 'Tank Ace',
    description: 'Achieve a win streak of 10.',
    icon: 'trophy',
    maxProgress: 10
  }
];

export const getAchievementState = (): AchievementState => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : INITIAL_STATE;
};

export const getAchievements = (): Achievement[] => {
  const state = getAchievementState();
  
  return ACHIEVEMENTS_LIST.map(ach => {
    let progress = 0;
    
    // Map internal stats to specific achievement progress
    switch(ach.id) {
      case 'iron_cross': progress = state.stats.germanWins; break;
      case 'cold_war': progress = state.stats.coldWarStreak; break;
      case 'veteran': progress = state.stats.totalWins; break;
      case 'tank_ace': 
        // We need to fetch the main game streak for this, but for now we'll rely on what we pass in or store externally.
        // For simplicity in this scoped implementation, we won't sync with the main streak here, 
        // but typically you'd want to.
        progress = 0; 
        break;
      case 'sharpshooter': progress = state.stats.perfectGames; break; 
    }

    return {
      ...ach,
      unlocked: state.unlockedIds.includes(ach.id),
      progress
    };
  });
};

export const processGameResult = (
  vehicle: VehicleData, 
  won: boolean, 
  attemptsUsed: number,
  currentGlobalStreak: number
): { newUnlocks: Achievement[] } => {
  const state = getAchievementState();
  const newUnlocks: Achievement[] = [];
  const highRanks = ['VI', 'VII', 'VIII'];

  // Update Stats
  if (won) {
    state.stats.totalWins += 1;
    
    if (vehicle.nation === 'Germany') {
      state.stats.germanWins += 1;
    }

    if (highRanks.includes(vehicle.rank)) {
      state.stats.coldWarStreak += 1;
    } else {
      state.stats.coldWarStreak = 0;
    }

    if (attemptsUsed === 0) { // 0 means 1st try (0 previous failures)
      state.stats.perfectGames += 1;
    }
  } else {
    state.stats.coldWarStreak = 0;
  }

  // Check Conditions
  const checkUnlock = (id: AchievementId, condition: boolean) => {
    if (condition && !state.unlockedIds.includes(id)) {
      state.unlockedIds.push(id);
      const ach = ACHIEVEMENTS_LIST.find(a => a.id === id);
      if (ach) newUnlocks.push({ ...ach, unlocked: true });
    }
  };

  checkUnlock('sharpshooter', won && attemptsUsed === 0);
  checkUnlock('iron_cross', state.stats.germanWins >= 10);
  checkUnlock('cold_war', state.stats.coldWarStreak >= 5);
  checkUnlock('veteran', state.stats.totalWins >= 50);
  checkUnlock('tank_ace', currentGlobalStreak >= 10);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return { newUnlocks };
};