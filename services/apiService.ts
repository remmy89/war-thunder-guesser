import { VehicleData, Difficulty, VehicleSummary } from '../types';
import { ROMAN_MAP, NATION_NAMES } from '../constants';
import { formatName, generateAliases } from '../utils/stringUtils';
import vehiclesData from '../assets/vehicles.json';

// Local JSON vehicle type
interface LocalVehicle {
  id: string;
  country: string;
  rank: number;
  br: number;
  type: string;
  armament: string;
  image: string;
  is_premium: boolean;
}

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

// Cast the imported JSON to the correct type
const vehicles: LocalVehicle[] = vehiclesData as LocalVehicle[];

/**
 * Clear the vehicle cache (no-op for local data, kept for API compatibility)
 */
export const clearVehicleCache = (): void => {
  // No-op: local data doesn't need cache clearing
};

/**
 * Fetch a mystery vehicle for the guessing game
 */
export const fetchMysteryVehicle = async (
  _difficulty: Difficulty,
  seed?: string
): Promise<{ vehicle: VehicleData; pool: VehicleSummary[] }> => {
  const rng = seed ? new SeededRandom(seed) : { next: Math.random };

  try {
    // Use all vehicles from local JSON
    const candidates = vehicles;

    if (candidates.length === 0) {
      throw new Error('Database Query Failed: No suitable vehicles found.');
    }

    // Deduplicate by id
    const uniqueCandidates = new Map<string, LocalVehicle>();
    for (const candidate of candidates) {
      if (!uniqueCandidates.has(candidate.id)) {
        uniqueCandidates.set(candidate.id, candidate);
      }
    }
    const uniqueVehicles = Array.from(uniqueCandidates.values());

    // Select random vehicle
    const selection = uniqueVehicles[Math.floor(rng.next() * uniqueVehicles.length)];
    const vehicle = getVehicleDetails(selection);

    // Generate pool for UI
    const pool: VehicleSummary[] = uniqueVehicles.map((v) => ({
      id: v.id,
      name: formatName(v.id, v.country),
      nation: getNationName(v.country),
      rank: toRoman(v.rank),
      br: v.br,
      vehicleType: v.type.replace(/_/g, ' ').toUpperCase(),
      image: v.image,
    }));

    return { vehicle, pool };
  } catch (error) {
    console.error('Error loading vehicle data:', error);
    const message = error instanceof Error
      ? error.message
      : 'Critical Mission Failure: Data retrieval aborted.';
    throw new Error(message);
  }
};

/**
 * Get full vehicle details from local data
 */
const getVehicleDetails = (vehicle: LocalVehicle): VehicleData => {
  const name = formatName(vehicle.id, vehicle.country);
  const nation = getNationName(vehicle.country);
  const rank = toRoman(vehicle.rank);
  const br = vehicle.br;
  const type = vehicle.type.replace(/_/g, ' ').toUpperCase();
  const armament = vehicle.armament || 'Unknown Armament';
  const description = vehicle.image || 'VISUAL DATA CORRUPTED. NO IMAGE AVAILABLE.';

  return {
    name,
    nation,
    rank,
    br,
    vehicleType: type,
    armament,
    description,
    aliases: generateAliases(name, vehicle.id),
  };
};