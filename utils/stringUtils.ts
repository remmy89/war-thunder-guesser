
import { ROMAN_TO_ARABIC, COUNTRY_PREFIXES, FORCE_UPPERCASE } from '../constants';
import { Difficulty } from '../types';

/**
 * Normalize a string for comparison by removing non-alphanumeric characters
 * and optionally converting roman numerals to arabic
 */
export const normalize = (str: string, convertRoman = false): string => {
  let processed = str.toLowerCase();
  
  if (convertRoman) {
    processed = processed.split(/([\s\-_/()]+)/).map(part => {
      return ROMAN_TO_ARABIC[part] ?? part;
    }).join('');
  }
  
  return processed.replace(/[^a-z0-9]/g, '');
};

/**
 * Tokenize a string into words, optionally converting roman numerals
 */
export const tokenize = (str: string, convertRoman = false): string[] => {
  let tokens = str.toLowerCase().split(/[\s\-_/()]+/).filter(t => t.length > 0);
  
  if (convertRoman) {
    tokens = tokens.map(t => ROMAN_TO_ARABIC[t] ?? t);
  }
  
  return tokens;
};

/**
 * Calculate Levenshtein distance between two strings
 */
export const levenshtein = (a: string, b: string): number => {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
};

/**
 * Check if two strings match with fuzzy tolerance
 */
export const isFuzzyMatch = (input: string, target: string, convertRoman = false): boolean => {
  const nInput = normalize(input, convertRoman);
  const nTarget = normalize(target, convertRoman);
  
  if (nInput === nTarget) return true;
  
  const dist = levenshtein(nInput, nTarget);
  const maxLength = Math.max(nInput.length, nTarget.length);
  
  if (maxLength > 6 && dist <= 2) return true;
  if (maxLength > 3 && dist <= 1) return true;
  
  return false;
};

/**
 * Check if token arrays match (one contains all tokens of the other)
 */
export const isTokenMatch = (tokensA: string[], tokensB: string[]): boolean => {
  if (tokensA.length === 0 || tokensB.length === 0) return false;
  
  return (
    tokensA.every(token => tokensB.includes(token)) ||
    tokensB.every(token => tokensA.includes(token))
  );
};

/**
 * Get country prefix for ID parsing
 */
export const getCountryPrefix = (country: string): string => {
  return COUNTRY_PREFIXES[country.toLowerCase()] ?? country.toLowerCase();
};

/**
 * Format a technical identifier into a readable name
 */
export const formatName = (id: string, country: string): string => {
  let name = id.toLowerCase();

  // Remove country prefix
  const prefix = getCountryPrefix(country);
  if (name.startsWith(`${prefix}_`)) {
    name = name.substring(prefix.length + 1);
  } else if (name.startsWith(`${country.toLowerCase()}_`)) {
    name = name.replace(`${country.toLowerCase()}_`, '');
  }

  // Replace underscores with spaces
  name = name.replace(/_/g, ' ');

  // Process each word
  name = name.split(' ').map(word => {
    const lower = word.toLowerCase();

    // Specific overrides
    if (lower === 'us') return 'US';
    if (lower === 'kwk') return 'KwK';
    if (lower === 'flak') return 'FlaK';
    if (lower === 'pak') return 'PaK';
    if (FORCE_UPPERCASE.has(lower)) return lower.toUpperCase();

    // Words with numbers
    if (/\d/.test(word)) return word.toUpperCase();

    // Roman numerals
    if (/^(x|ix|iv|v?i{1,3}|v)$/i.test(word)) return word.toUpperCase();

    // Single letters
    if (word.length === 1) return word.toUpperCase();

    // Default: capitalize first letter
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');

  // Restore hyphens for common patterns
  name = name.replace(/([A-Za-z]) (\d)/g, '$1-$2');
  name = name.replace(/(\d)-(\d)/g, '$1-$2');
  name = name.replace(/(\d) (\d)/g, '$1-$2');

  return name;
};

/**
 * Generate aliases for a vehicle name
 */
export const generateAliases = (name: string, id: string): string[] => {
  const aliases = new Set<string>();
  
  // Add base variations
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

  // First word as alias
  const nameParts = name.split(' ');
  if (nameParts.length > 1) {
    aliases.add(nameParts[0].toLowerCase());
  }

  // Special cases
  if (name.toLowerCase().includes('pzkpfw')) {
    aliases.add(name.toLowerCase().replace('pzkpfw', 'panzer'));
  }

  return Array.from(aliases);
};
