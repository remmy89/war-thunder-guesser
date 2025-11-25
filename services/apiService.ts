import { VehicleData, Difficulty, VehicleSummary } from '../types';
import { 
  API_CONFIG, 
  API_NATIONS, 
  GROUND_VEHICLE_TYPES, 
  ROMAN_MAP, 
  NATION_NAMES 
} from '../constants';
import { formatName, generateAliases } from '../utils/stringUtils';

// In development, we use the Vite proxy to bypass CORS.
// In production, we use the direct URL.
const API_BASE = import.meta.env.DEV
  ? API_CONFIG.BASE_URL_DEV
  : API_CONFIG.BASE_URL_PROD;

// Mapping for roman numerals
const toRoman = (num: number): string => ROMAN_MAP[num] ?? num.toString();

// Mapping for nation codes to display names
const getNationName = (code: string): string => {
  return NATION_NAMES[code.toLowerCase()] ?? code.charAt(0).toUpperCase() + code.slice(1);
};

/**
 * Seeded random number generator for deterministic results
 */
class SeededRandom {
  private seed: number;

  constructor(seedStr: string) {
    // FNV-1a hash to convert string to number
    let h = 0x811c9dc5;
    for (let i = 0; i < seedStr.length; i++) {
      h ^= seedStr.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    this.seed = h >>> 0;
  }

  // Mulberry32 PRNG
  next(): number {
    let t = (this.seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

// Type guard for ground vehicles
const isGroundVehicle = (vehicleType: string): boolean => {
  return (GROUND_VEHICLE_TYPES as readonly string[]).includes(vehicleType);
};

/**
 * Fetch all vehicles for a specific nation with pagination
 */
const fetchVehiclesByNation = async (country: string): Promise<VehicleApiResponse[]> => {
  const collected: VehicleApiResponse[] = [];

  for (let page = 0; page < API_CONFIG.MAX_NATION_PAGES; page++) {
    const params = new URLSearchParams({
      limit: API_CONFIG.PAGE_SIZE.toString(),
      page: page.toString(),
      country,
      excludeEventVehicles: 'true',
      excludeKillstreak: 'true',
      isPremium: 'false',
      isPack: 'false',
      isSquadronVehicle: 'false',
      isOnMarketplace: 'false',
    });

    try {
      const response = await fetch(`${API_BASE}/vehicles?${params.toString()}`);
      
      if (!response.ok) {
        console.warn(`Fetch failed for country ${country} (page ${page}): ${response.status}`);
        break;
      }

      const payload = await response.json();
      
      if (!Array.isArray(payload) || payload.length === 0) {
        break;
      }

      collected.push(...payload);

      if (payload.length < API_CONFIG.PAGE_SIZE) {
        break;
      }
    } catch (error) {
      console.warn(`Fetch error for country ${country} (page ${page}):`, error);
      break;
    }
  }

  return collected;
};

// API response types
interface VehicleApiResponse {
  identifier: string;
  country: string;
  era: number;
  vehicle_type: string;
  realistic_ground_br?: number;
  realistic_br?: number;
  arcade_br?: number;
  images?: {
    image?: string;
  };
}

interface VehicleDetailResponse extends VehicleApiResponse {
  weapons?: Array<{
    weapon_type: string;
    name: string;
    ammos?: Array<{
      caliber?: number;
    }>;
  }>;
}

// Global in-memory cache to prevent refetching on "Next Mission"
let globalCachedPool: VehicleApiResponse[] = [];
const fetchedNations = new Set<string>();

/**
 * Clear the vehicle cache (useful for testing or forced refresh)
 */
export const clearVehicleCache = (): void => {
  globalCachedPool = [];
  fetchedNations.clear();
};

/**
 * Fetch a mystery vehicle for the guessing game
 */
export const fetchMysteryVehicle = async (
  difficulty: Difficulty,
  seed?: string
): Promise<{ vehicle: VehicleData; pool: VehicleSummary[] }> => {
  const rng = seed ? new SeededRandom(seed) : { next: Math.random };

  try {
    // Determine which nation to fetch
    const targetNationIndex = Math.floor(rng.next() * API_NATIONS.length);
    const targetNation = API_NATIONS[targetNationIndex];

    // Fetch data if not cached
    if (!fetchedNations.has(targetNation)) {
      const vehicles = await fetchVehiclesByNation(targetNation);
      const groundVehicles = vehicles.filter((v) => isGroundVehicle(v.vehicle_type));
      
      globalCachedPool = [...globalCachedPool, ...groundVehicles];
      fetchedNations.add(targetNation);
    }

    // Filter candidates
    let candidates = globalCachedPool.filter((v) => isGroundVehicle(v.vehicle_type));

    if (candidates.length === 0) {
      throw new Error('Database Query Failed: No suitable vehicles found. Check connection.');
    }

    // Deduplicate by identifier
    const uniqueCandidates = new Map<string, VehicleApiResponse>();
    for (const candidate of candidates) {
      if (!uniqueCandidates.has(candidate.identifier)) {
        uniqueCandidates.set(candidate.identifier, candidate);
      }
    }
    candidates = Array.from(uniqueCandidates.values());

    // For seeded games, filter to specific nation for determinism
    let selectionPool = candidates;
    if (seed) {
      selectionPool = candidates.filter((c) => c.country === targetNation);
    }

    if (selectionPool.length === 0) {
      throw new Error('No vehicles found for the selected nation.');
    }

    // Select random vehicle
    const selection = selectionPool[Math.floor(rng.next() * selectionPool.length)];
    const vehicle = await getFullDetails(selection.identifier);

    // Generate pool for UI
    const pool: VehicleSummary[] = candidates.map((c) => ({
      id: c.identifier,
      name: formatName(c.identifier, c.country),
      nation: getNationName(c.country),
      rank: toRoman(c.era),
      br: c.realistic_ground_br ?? c.realistic_br ?? c.arcade_br ?? 0.0,
      vehicleType: c.vehicle_type.replace(/_/g, ' ').toUpperCase(),
      image: c.images?.image ?? '',
    }));

    return { vehicle, pool };
  } catch (error) {
    console.error('Error fetching from WT API:', error);
    const message = error instanceof Error
      ? error.message
      : 'Critical Mission Failure: Data retrieval aborted.';
    throw new Error(message);
  }
};

/**
 * Fetch full vehicle details by identifier
 */
const getFullDetails = async (identifier: string): Promise<VehicleData> => {
  const detailResponse = await fetch(`${API_BASE}/vehicles/${identifier}`);
  
  if (!detailResponse.ok) {
    throw new Error(`Failed to fetch vehicle details: ${detailResponse.status}`);
  }

  const detail: VehicleDetailResponse = await detailResponse.json();

  // Process Armament
  let armament = 'Unknown Armament';
  if (detail.weapons && detail.weapons.length > 0) {
    const mainGun = detail.weapons.find(
      (w) => w.weapon_type.includes('cannon') || w.weapon_type.includes('gun')
    ) ?? detail.weapons[0];

    if (mainGun) {
      const ammo = mainGun.ammos?.[0];
      const caliber = ammo?.caliber ?? 0;
      const gunName = mainGun.name.replace(/_/g, ' ').toUpperCase();
      armament = caliber > 0 ? `${caliber}mm ${gunName}` : gunName;
    }
  }

  // Format vehicle data
  const name = formatName(detail.identifier, detail.country);
  const nation = getNationName(detail.country);
  const rank = toRoman(detail.era);
  const br = detail.realistic_ground_br ?? detail.realistic_br ?? detail.arcade_br ?? 0.0;
  const type = detail.vehicle_type.replace(/_/g, ' ').toUpperCase();
  const description = detail.images?.image ?? 'VISUAL DATA CORRUPTED. NO IMAGE AVAILABLE.';

  return {
    name,
    nation,
    rank,
    br,
    vehicleType: type,
    armament,
    description,
    aliases: generateAliases(name, detail.identifier),
  };
};