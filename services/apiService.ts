import { VehicleData, Difficulty, VehicleSummary } from '../types';

const API_BASE = 'https://www.wtvehiclesapi.sgambe.serv00.net/api';

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

// Common acronyms that should always be uppercase
const FORCE_UPPERCASE = new Set([
  'df', 'cm', 'pt', 'bk', 'is', 'kv', 'cv', 'pv', 'ikv', 'strv', 
  'lvkv', 'pbv', 'pvkv', 'sav', 'amx', 'amd', 'aml', 'ztz', 'zsd', 
  'zbd', 'pgz', 'bmd', 'bmp', 'btr', 'asus', 'm1', 'm2', 'm3', 'm4',
  'm60', 't54', 't55', 't62', 't64', 't72', 't80', 't90'
]);

// Format technical identifiers into readable names
// e.g. "cn_cm11" -> "CM11", "ussr_t_34_85_zis_53" -> "T-34-85 (ZiS-53)"
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

    // Roman numerals check (I, II, III, IV, V, VI, VII, VIII, IX, X)
    if (/^(x|ix|iv|v?i{1,3}|v)$/i.test(word)) return word.toUpperCase();
    
    // Single letters often uppercase (Model T -> Model T)
    if (word.length === 1) return word.toUpperCase();

    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');

  // Restore hyphens for common patterns (Letter followed by Number)
  // e.g. T 34 -> T-34, M 4 -> M-4
  name = name.replace(/([A-Za-z]) (\d)/g, '$1-$2'); 
  
  // Fix common issues like "T-34 85" -> "T-34-85"
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

  // Extract just the model number if applicable (e.g. "T-34-85" -> "T-34")
  const nameParts = name.split(' ');
  if (nameParts.length > 1) {
    aliases.add(nameParts[0].toLowerCase());
  }
  
  // Common shorthand (e.g. "Pz.Kpfw. IV" -> "Panzer IV")
  if (name.toLowerCase().includes('pzkpfw')) {
    aliases.add(name.toLowerCase().replace('pzkpfw', 'panzer'));
  }

  return Array.from(aliases);
};

// Removed 'tank' as it can be ambiguous in some contexts, prefer specific classes
const fetchVehicleTypes = ['medium_tank', 'heavy_tank', 'tank_destroyer', 'spaa', 'light_tank'];

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

export const fetchMysteryVehicle = async (difficulty: Difficulty, seed?: string): Promise<{ vehicle: VehicleData, pool: VehicleSummary[] }> => {
  const rng = seed ? new SeededRandom(seed) : { next: Math.random };

  try {
    // 1. Pick a random ground vehicle type
    const randomType = fetchVehicleTypes[Math.floor(rng.next() * fetchVehicleTypes.length)];
    
    // 2. Fetch a list of vehicles of this type
    // STRICT FILTERING: No premiums, no packs, no squadron vehicles, no marketplace, no event vehicles.
    // In EASY mode, we fetch a larger limit to populate the suggestion pool
    // If seeded (Daily Challenge), we force a high limit to ensure consistency across all players regardless of difficulty
    const limit = (difficulty === Difficulty.EASY || seed) ? '1000' : '100';
    
    const queryParams = new URLSearchParams({
      type: randomType,
      limit: limit,
      excludeEventVehicles: 'true',
      isPack: 'false',
      isPremium: 'false',
      isSquadronVehicle: 'false',
      isOnMarketplace: 'false'
    });

    let candidates: any[] = [];
    
    try {
      const listResponse = await fetch(`${API_BASE}/vehicles?${queryParams.toString()}`);
      if (listResponse.ok) {
         const listData = await listResponse.json();
         if (Array.isArray(listData) && listData.length > 0) {
           candidates = listData;
         }
      }
    } catch (e) {
      console.warn("Primary fetch failed:", e);
    }

    // Fallback 1: If specific type failed, try 'medium_tank' as a reliable fallback category
    if (candidates.length === 0) {
      console.warn(`No tech tree vehicles found for ${randomType}, attempting fallback (medium_tank)...`);
      try {
        const fallbackResponse = await fetch(`${API_BASE}/vehicles?type=medium_tank&limit=${difficulty === Difficulty.EASY ? '500' : '200'}`);
        if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            if (Array.isArray(fallbackData) && fallbackData.length > 0) {
               // Filter client-side to be safe
               candidates = fallbackData.filter((v: any) => 
                   !v.is_premium && !v.is_pack && !v.squadron_vehicle && !v.on_marketplace && (!v.event || v.event === '')
               );
            }
        }
      } catch (e) {
        console.warn("Fallback fetch failed:", e);
      }
    }

    // Fallback 2: Emergency broad fetch (any vehicle, filtered locally)
    if (candidates.length === 0) {
       console.warn("Medium tank fallback failed. Attempting emergency broad fetch...");
       try {
         const emergencyResponse = await fetch(`${API_BASE}/vehicles?limit=500`);
         if (emergencyResponse.ok) {
            const emergencyData = await emergencyResponse.json();
            if (Array.isArray(emergencyData)) {
               candidates = emergencyData.filter((v: any) => 
                   ['medium_tank', 'heavy_tank', 'light_tank', 'tank_destroyer', 'spaa'].includes(v.vehicle_type) &&
                   !v.is_premium && !v.is_pack && !v.squadron_vehicle && !v.on_marketplace
               );
            }
         } else {
             // If the API explicitly returns an error code here
             throw new Error(`API Error: ${emergencyResponse.status}`);
         }
       } catch (e) {
         console.error("Emergency fetch failed:", e);
         throw new Error("HQ Link Lost: The Vehicle Database is currently unreachable. Please check your connection or try again later.");
       }
    }

    if (candidates.length === 0) {
      throw new Error('Database Query Failed: No suitable vehicles found. The API may be experiencing instability.');
    }

    // 3. Pick a random vehicle from the list
    const selection = candidates[Math.floor(rng.next() * candidates.length)];
    
    const vehicle = await getFullDetails(selection.identifier);

    // 4. Generate pool for Easy Mode
    let pool: VehicleSummary[] = [];
    if (difficulty === Difficulty.EASY) {
       // Map candidates to VehicleSummary structure
       pool = candidates.map(c => ({
          id: c.identifier,
          name: formatName(c.identifier, c.country),
          nation: getNationName(c.country),
          rank: toRoman(c.era),
          br: c.realistic_ground_br || c.realistic_br || c.arcade_br || 0.0,
          vehicleType: c.vehicle_type.replace(/_/g, ' ').toUpperCase(),
          image: c.images?.image || ''
       }));
       
       // Ensure the chosen vehicle is in the pool (it should be, but formatting might vary if we didn't map specifically)
       // Since we derived pool from candidates and selection is from candidates, it is there.
    }

    return { vehicle, pool };

  } catch (error: any) {
    console.error("Error fetching from WT API:", error);
    // Rethrow with a clean message if it's not already an Error object
    const message = error instanceof Error ? error.message : 'Critical Mission Failure: Data retrieval aborted.';
    throw new Error(message);
  }
};

const getFullDetails = async (identifier: string): Promise<VehicleData> => {
    // 4. Fetch full details
    const detailResponse = await fetch(`${API_BASE}/vehicles/${identifier}`);
    if (!detailResponse.ok) {
      throw new Error('Failed to fetch vehicle details');
    }

    const detail = await detailResponse.json();

    // 5. Process Armament
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

    // 6. Format Data
    const name = formatName(detail.identifier, detail.country);
    const nation = getNationName(detail.country);
    const rank = toRoman(detail.era);
    const br = detail.realistic_ground_br || detail.realistic_br || detail.arcade_br || 0.0;
    const type = detail.vehicle_type.replace(/_/g, ' ').toUpperCase();
    
    // Description is the image URL
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