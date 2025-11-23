import { VehicleData, Difficulty, VehicleSummary } from '../types';

// In development, we use the Vite proxy to bypass CORS.
// In production, we use the direct URL.
const API_BASE = import.meta.env.DEV 
  ? '/api' 
  : 'https://www.wtvehiclesapi.sgambe.serv00.net/api';

// Helper for delays to prevent rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mapping for roman numerals
const toRoman = (num: number): string => {
  const map: Record<number, string> = {
    1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX'
  };
  return map[num] || num.toString();
};

// Mapping for nation codes to display names
const getNationName = (code: string): string => {
  const map: Record<string, string> = {
    'usa': 'USA',
    'germany': 'Germany',
    'ussr': 'USSR',
    'britain': 'Great Britain',
    'japan': 'Japan',
    'china': 'China',
    'italy': 'Italy',
    'france': 'France',
    'sweden': 'Sweden',
    'israel': 'Israel'
  };
  return map[code.toLowerCase()] || code.charAt(0).toUpperCase() + code.slice(1);
};

// Helper to get common ID prefixes for countries
const getCountryPrefix = (country: string): string => {
  const map: Record<string, string> = {
    'usa': 'us',
    'germany': 'germ', 
    'ussr': 'ussr',
    'britain': 'uk',
    'japan': 'jp',
    'china': 'cn',
    'italy': 'it',
    'france': 'fr',
    'sweden': 'sw',
    'israel': 'il'
  };
  return map[country.toLowerCase()] || country.toLowerCase();
};

// Explicit list of nations to query
const API_NATIONS = [
  'britain', 
  'china', 
  'france', 
  'germany', 
  'israel', // Fixed typo: was 'isreal'
  'italy', 
  'japan', 
  'sweden', 
  'usa', 
  'ussr'
];

// Common acronyms that should always be uppercase
const FORCE_UPPERCASE = new Set([
  'df', 'cm', 'pt', 'bk', 'is', 'kv', 'cv', 'pv', 'ikv', 'strv', 
  'lvkv', 'pbv', 'pvkv', 'sav', 'amx', 'amd', 'aml', 'ztz', 'zsd', 
  'zbd', 'pgz', 'bmd', 'bmp', 'btr', 'asus', 'm1', 'm2', 'm3', 'm4',
  'm60', 't54', 't55', 't62', 't64', 't72', 't80', 't90'
]);

// Format technical identifiers into readable names
const formatName = (id: string, country: string): string => {
  let name = id.toLowerCase();
  
  // Remove country prefix
  const prefix = getCountryPrefix(country);
  if (name.startsWith(prefix + '_')) {
    name = name.substring(prefix.length + 1);
  } else if (name.startsWith(country.toLowerCase() + '_')) {
    name = name.replace(country.toLowerCase() + '_', '');
  }

  // Replace underscores with spaces initially
  name = name.replace(/_/g, ' ');

  // Process words
  name = name.split(' ').map(word => {
    const lower = word.toLowerCase();

    // Specific overrides and forced acronyms
    if (lower === 'us') return 'US';
    if (lower === 'kwk') return 'KwK';
    if (lower === 'flak') return 'FlaK';
    if (lower === 'pak') return 'PaK';
    if (FORCE_UPPERCASE.has(lower)) return lower.toUpperCase();
    
    // If word contains a number, uppercase it (e.g. m1, t34, cm11 -> M1, T34, CM11)
    if (/\d/.test(word)) return word.toUpperCase();

    // Roman numerals check
    if (/^(x|ix|iv|v?i{1,3}|v)$/i.test(word)) return word.toUpperCase();
    
    // Single letters often uppercase
    if (word.length === 1) return word.toUpperCase();

    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');

  // Restore hyphens for common patterns
  name = name.replace(/([A-Za-z]) (\d)/g, '$1-$2'); 
  name = name.replace(/(\d)-(\d)/g, '$1-$2');
  name = name.replace(/(\d) (\d)/g, '$1-$2');

  return name;
};

const generateAliases = (name: string, id: string): string[] => {
  const aliases = new Set<string>();
  aliases.add(name.toLowerCase());
  
  // Raw ID cleanups
  const cleanId = id.toLowerCase().replace(/_/g, ' ');
  aliases.add(cleanId);
  
  // ID without country prefix
  const parts = id.split('_');
  if (parts.length > 1) {
    aliases.add(parts.slice(1).join(' ').toLowerCase());
    aliases.add(parts.slice(1).join('').toLowerCase());
  }

  // Name variations
  aliases.add(name.toLowerCase().replace(/-/g, ' '));
  aliases.add(name.toLowerCase().replace(/-/g, ''));
  aliases.add(name.toLowerCase().replace(/\s/g, ''));

  const nameParts = name.split(' ');
  if (nameParts.length > 1) {
    aliases.add(nameParts[0].toLowerCase());
  }
  
  if (name.toLowerCase().includes('pzkpfw')) {
    aliases.add(name.toLowerCase().replace('pzkpfw', 'panzer'));
  }

  return Array.from(aliases);
};

const groundVehicleTypes = [
  'tank',
  'light_tank',
  'medium_tank',
  'heavy_tank',
  'tank_destroyer',
  'spaa',
  'lbv',
  'mbv',
  'hbv'
];

class SeededRandom {
  private seed: number;

  constructor(seedStr: string) {
    // Simple hash to convert string to number (FNV-1a)
    let h = 0x811c9dc5;
    for (let i = 0; i < seedStr.length; i++) {
      h ^= seedStr.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    this.seed = h >>> 0;
  }

  // Mulberry32
  next(): number {
    let t = (this.seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

const PAGE_SIZE = 200;

// Fetch all vehicles for a specific nation
const fetchVehiclesByNation = async (country: string): Promise<any[]> => {
  const collected: any[] = [];
  const MAX_NATION_PAGES = 15; 

  for (let page = 0; page < MAX_NATION_PAGES; page++) {
    const params = new URLSearchParams({
      limit: PAGE_SIZE.toString(),
      page: page.toString(),
      country,
      excludeEventVehicles: 'true',
      excludeKillstreak: 'true',
      isPremium: 'false',
      isPack: 'false',
      isSquadronVehicle: 'false',
      isOnMarketplace: 'false'
    });

    try {
      const response = await fetch(`${API_BASE}/vehicles?${params.toString()}`);
      if (!response.ok) {
        console.warn(`Fetch failed for country ${country} (page ${page})`);
        break;
      }

      const payload = await response.json();
      if (!Array.isArray(payload) || payload.length === 0) {
        break;
      }

      collected.push(...payload);

      if (payload.length < PAGE_SIZE) {
        break;
      }
    } catch (error) {
      console.warn(`Fetch error for country ${country} (page ${page})`, error);
      break;
    }
  }

  return collected;
};

// Global in-memory cache to prevent refetching on "Next Mission"
let globalCachedPool: any[] = [];
let fetchedNations = new Set<string>();

export const fetchMysteryVehicle = async (difficulty: Difficulty, seed?: string): Promise<{ vehicle: VehicleData, pool: VehicleSummary[] }> => {
  const rng = seed ? new SeededRandom(seed) : { next: Math.random };

  try {
    let candidates: any[] = [];

    // Determine which nation to fetch.
    let targetNationIndex = Math.floor(rng.next() * API_NATIONS.length);
    let targetNation = API_NATIONS[targetNationIndex];
    
    
    // If it's a fresh run or we need more data:
    if (!fetchedNations.has(targetNation) || (seed && !fetchedNations.has(targetNation))) {
      
      const vehicles = await fetchVehiclesByNation(targetNation);
      
      // Filter immediately
      const groundVehicles = vehicles.filter((v: any) => groundVehicleTypes.includes(v.vehicle_type));
      
      // Add to global cache
      globalCachedPool = [...globalCachedPool, ...groundVehicles];
      fetchedNations.add(targetNation);
    }

    // Use the global cache as our source of truth
    candidates = globalCachedPool;

    // Ensure we filter again just in case
    candidates = candidates.filter((v: any) => groundVehicleTypes.includes(v.vehicle_type));

    if (candidates.length === 0) {
      throw new Error('Database Query Failed: No suitable vehicles found. Check connection.');
    }

    // Deduplicate
    const uniqueCandidates = new Map<string, any>();
    for (const candidate of candidates) {
      if (!uniqueCandidates.has(candidate.identifier)) {
        uniqueCandidates.set(candidate.identifier, candidate);
      }
    }

    candidates = Array.from(uniqueCandidates.values());

    // If seeded, we need to filter candidates to only the specific nation we picked to ensure determinism,
    // otherwise the index might shift as we add more nations to the cache in future games.
    let selectionPool = candidates;
    if (seed) {
      selectionPool = candidates.filter((c: any) => c.country === targetNation);
    }

    // Pick a random vehicle
    const selection = selectionPool[Math.floor(rng.next() * selectionPool.length)];
    const vehicle = await getFullDetails(selection.identifier);

    // Generate Pool for UI (Autocomplete/List)
    const pool: VehicleSummary[] = candidates.map(c => ({
      id: c.identifier,
      name: formatName(c.identifier, c.country),
      nation: getNationName(c.country),
      rank: toRoman(c.era),
      br: c.realistic_ground_br || c.realistic_br || c.arcade_br || 0.0,
      vehicleType: c.vehicle_type.replace(/_/g, ' ').toUpperCase(),
      image: c.images?.image || ''
    }));

    return { vehicle, pool };

  } catch (error: any) {
    console.error("Error fetching from WT API:", error);
    const message = error instanceof Error ? error.message : 'Critical Mission Failure: Data retrieval aborted.';
    throw new Error(message);
  }
};

const getFullDetails = async (identifier: string): Promise<VehicleData> => {
    const detailResponse = await fetch(`${API_BASE}/vehicles/${identifier}`);
    if (!detailResponse.ok) {
      throw new Error('Failed to fetch vehicle details');
    }

    const detail = await detailResponse.json();

    // Process Armament
    let armament = "Unknown Armament";
    if (detail.weapons && detail.weapons.length > 0) {
      const mainGun = detail.weapons.find((w: any) => 
        w.weapon_type.includes('cannon') || 
        w.weapon_type.includes('gun')
      ) || detail.weapons[0];

      if (mainGun) {
        const ammo = mainGun.ammos?.[0];
        const caliber = ammo?.caliber || 0;
        const gunName = mainGun.name.replace(/_/g, ' ').toUpperCase();
        armament = caliber > 0 ? `${caliber}mm ${gunName}` : gunName;
      }
    }

    // Format Data
    const name = formatName(detail.identifier, detail.country);
    const nation = getNationName(detail.country);
    const rank = toRoman(detail.era);
    const br = detail.realistic_ground_br || detail.realistic_br || detail.arcade_br || 0.0;
    const type = detail.vehicle_type.replace(/_/g, ' ').toUpperCase();
    
    const description = detail.images?.image || "VISUAL DATA CORRUPTED. NO IMAGE AVAILABLE.";

    return {
      name,
      nation,
      rank,
      br,
      vehicleType: type,
      armament,
      description, 
      aliases: generateAliases(name, detail.identifier)
    };
};