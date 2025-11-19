import React, { useState, useEffect, useRef, useMemo } from 'react';
import { VehicleData, Difficulty, VehicleSummary, GameStats } from '../types';
import { HintCard } from './HintCard';
import { Send, AlertTriangle, Search, Shield, Target } from 'lucide-react';
import { playSound } from '../utils/audio';

const romanMap: Record<string, string> = {
  'i': '1', 'ii': '2', 'iii': '3', 'iv': '4', 'v': '5',
  'vi': '6', 'vii': '7', 'viii': '8', 'ix': '9', 'x': '10'
};

interface GameProps {
  vehicle: VehicleData;
  pool: VehicleSummary[]; // Changed from options string[]
  difficulty: Difficulty;
  onGameOver: (won: boolean) => void;
}

export const Game: React.FC<GameProps> = ({ vehicle, pool, difficulty, onGameOver }) => {
  const [guess, setGuess] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [stats, setStats] = useState<GameStats>({
    gamesPlayed: 0,
    wins: 0,
    currentStreak: 0,
    maxStreak: 0
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const maxAttempts = 6;

  useEffect(() => {
    const savedStats = localStorage.getItem('wt_guesser_stats');
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }
  }, []);

  const updateLocalStats = (won: boolean) => {
    const currentStats = { ...stats };
    currentStats.gamesPlayed += 1;
    
    if (won) {
      currentStats.wins += 1;
      currentStats.currentStreak += 1;
      if (currentStats.currentStreak > currentStats.maxStreak) {
        currentStats.maxStreak = currentStats.currentStreak;
      }
    } else {
      currentStats.currentStreak = 0;
    }
    
    localStorage.setItem('wt_guesser_stats', JSON.stringify(currentStats));
    setStats(currentStats);
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [attempts, difficulty]);

  // Play reveal sound when attempts increase
  useEffect(() => {
    if (attempts > 0 && attempts < maxAttempts) {
      const timer = setTimeout(() => playSound('reveal'), 200);
      return () => clearTimeout(timer);
    }
  }, [attempts]);

  // Dynamic Filtering for Easy Mode
  const filteredPool = useMemo(() => {
    if (difficulty !== Difficulty.EASY) return [];

    let result = pool;

    // Filter 1: Nation (Always revealed as Hint 0)
    result = result.filter(v => v.nation === vehicle.nation);

    // Filter 2: Rank (Revealed at attempt 1)
    if (attempts >= 1) {
      result = result.filter(v => v.rank === vehicle.rank);
    }

    // Filter 3: Type (Revealed at attempt 3)
    if (attempts >= 3) {
      result = result.filter(v => v.vehicleType === vehicle.vehicleType);
    }

    // Filter by User Input (Search)
    if (guess.trim()) {
      const search = guess.toLowerCase();
      result = result.filter(v => v.name.toLowerCase().includes(search));
    }

    // Sort alphabetically
    return result.sort((a, b) => a.name.localeCompare(b.name));

  }, [pool, difficulty, vehicle, attempts, guess]);

  // Standardize string: remove special chars, lowercase
  const normalize = (str: string) => {
    let processed = str.toLowerCase();
    
    if (difficulty === Difficulty.HARD) {
      processed = processed.split(/([\s\-_/()]+)/).map(part => {
        return romanMap[part] || part;
      }).join('');
    }

    return processed.replace(/[^a-z0-9]/g, '');
  };

  // Split into meaningful parts
  const tokenize = (str: string) => {
    let tokens = str.toLowerCase().split(/[\s\-_/()]+/).filter(t => t.length > 0);

    if (difficulty === Difficulty.HARD) {
      tokens = tokens.map(t => romanMap[t] || t);
    }

    return tokens;
  };

  // Levenshtein Distance for fuzzy matching
  const levenshtein = (a: string, b: string): number => {
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
            matrix[i - 1][j - 1] + 1, // substitution
            Math.min(
              matrix[i][j - 1] + 1, // insertion
              matrix[i - 1][j] + 1 // deletion
            )
          );
        }
      }
    }

    return matrix[b.length][a.length];
  };

  const isFuzzyMatch = (input: string, target: string) => {
    const nInput = normalize(input);
    const nTarget = normalize(target);
    
    // 1. Exact normalized match (covers "Marder Df-105" vs "marderdf105")
    if (nInput === nTarget) return true;

    // 2. Levenshtein distance (covers typos like "Marder" vs "Mardar")
    const dist = levenshtein(nInput, nTarget);
    const maxLength = Math.max(nInput.length, nTarget.length);
    
    // Allow flexibility based on string length
    if (maxLength > 6 && dist <= 2) return true;
    if (maxLength > 3 && dist <= 1) return true;

    return false;
  };

  const isTokenMatch = (tokensA: string[], tokensB: string[]) => {
    if (tokensA.length === 0 || tokensB.length === 0) return false;
    
    // Check if tokensA is a subset of tokensB (e.g. "Marder" inside "Marder 1A3")
    const aInB = tokensA.every(token => tokensB.includes(token));
    
    // Check if tokensB is a subset of tokensA (e.g. "DF105" inside "Marder DF105")
    // This allows users to type "Marder DF105" for the answer "DF105"
    const bInA = tokensB.every(token => tokensA.includes(token));
    
    return aInB || bInA;
  };

  const checkGuess = (valueToCheck: string) => {
    if (!valueToCheck.trim()) return;

    let isMatch = false;

    // 1. Check against Main Name
    if (isFuzzyMatch(valueToCheck, vehicle.name)) {
        isMatch = true;
    } 
    else {
        // Token Check for Main Name
        const guessTokens = tokenize(valueToCheck);
        const nameTokens = tokenize(vehicle.name);
        if (isTokenMatch(guessTokens, nameTokens)) {
            isMatch = true;
        }
    }

    // 2. Check against Aliases
    if (!isMatch) {
      for (const alias of vehicle.aliases) {
        if (isFuzzyMatch(valueToCheck, alias)) {
          isMatch = true;
          break;
        }
        if (isTokenMatch(tokenize(valueToCheck), tokenize(alias))) {
          isMatch = true;
          break;
        }
      }
    }

    if (isMatch) {
      playSound('win');
      updateLocalStats(true);
      onGameOver(true);
    } else {
      const nextAttempts = attempts + 1;
      
      if (nextAttempts >= maxAttempts) {
        playSound('loss');
        updateLocalStats(false);
        onGameOver(false);
      } else {
        playSound('wrong');
        setAttempts(nextAttempts);
        setGuess('');
        setErrorMsg(`Incorrect. Intel updated.`);
        setTimeout(() => setErrorMsg(null), 2000);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (difficulty === Difficulty.EASY && filteredPool.length > 0) {
        // In Easy mode, Enter selects the first option if available
        checkGuess(filteredPool[0].name);
      } else {
        checkGuess(guess);
      }
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      {/* Status Bar */}
      <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-500 font-mono text-sm tracking-widest">LIVE FEED // SECURE</span>
          </div>
          <div className="hidden md:flex space-x-4 text-xs font-mono text-gray-500 border-l border-gray-700 pl-4">
             <span>GAMES: <span className="text-gray-300">{stats.gamesPlayed}</span></span>
             <span>STREAK: <span className="text-wt-orange">{stats.currentStreak}</span></span>
             <span>BEST: <span className="text-gray-300">{stats.maxStreak}</span></span>
             <span>WIN%: <span className="text-gray-300">{stats.gamesPlayed > 0 ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0}%</span></span>
          </div>
        </div>
        <div className="font-mono text-sm text-gray-400">
          ATTEMPTS REMAINING: <span className="text-wt-orange text-xl font-bold">{maxAttempts - attempts}</span>
        </div>
      </div>

      {/* Hints Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <HintCard 
          label="NATION" 
          value={vehicle.nation} 
          isRevealed={true} 
          iconType="nation" 
          index={0}
        />
        <HintCard 
          label="RANK" 
          value={`RANK ${vehicle.rank}`} 
          isRevealed={attempts >= 1} 
          iconType="rank" 
          index={1}
        />
        <HintCard 
          label="BATTLE RATING" 
          value={`${vehicle.br.toFixed(1)} (RB)`} 
          isRevealed={attempts >= 2} 
          iconType="br" 
          index={2}
        />
        <HintCard 
          label="CLASS" 
          value={vehicle.vehicleType} 
          isRevealed={attempts >= 3} 
          iconType="type" 
          index={3}
        />
        <HintCard 
          label="MAIN ARMAMENT" 
          value={vehicle.armament} 
          isRevealed={attempts >= 4} 
          iconType="gun" 
          index={4}
        />
        <div className="md:col-span-2">
          <HintCard 
            label="VISUAL INTEL" 
            value={vehicle.description} 
            isRevealed={attempts >= 5} 
            iconType="desc" 
            index={5}
          />
        </div>
      </div>

      {/* Controls Area */}
      <div className="relative z-20">
        {/* Background Glow */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-wt-orange to-red-600 rounded-lg blur opacity-30 transition duration-1000"></div>
        
        <div className="relative bg-wt-dark rounded-lg p-4 border border-gray-700">
            <label className="block text-xs font-mono text-gray-400 mb-2 uppercase">
              {difficulty === Difficulty.HARD ? 'Identify Vehicle' : 'Search Database (Filters Active)'}
            </label>
            
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={difficulty === Difficulty.HARD ? "Enter vehicle name..." : "Type to search..."}
                  className="w-full bg-black/50 border border-gray-600 text-wt-text px-4 py-3 pl-10 rounded-sm font-mono focus:outline-none focus:border-wt-orange focus:ring-1 focus:ring-wt-orange transition-all"
                  autoComplete="off"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  {difficulty === Difficulty.HARD ? (
                     <Search className="w-4 h-4 text-gray-500" />
                  ) : (
                     <Search className="w-4 h-4 text-wt-orange" />
                  )}
                </div>
              </div>
              
              <button
                onClick={() => checkGuess(guess)}
                className="bg-wt-orange hover:bg-yellow-600 text-black font-bold px-6 py-3 rounded-sm flex items-center space-x-2 transition-colors"
              >
                <span>SEND</span>
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* Assisted Mode Dropdown List */}
            {difficulty === Difficulty.EASY && (
              <div className="mt-4 border-t border-gray-700 pt-2">
                <p className="text-[10px] text-gray-500 font-mono mb-2 uppercase tracking-wider">
                  Potential Matches: <span className="text-white">{filteredPool.length}</span>
                </p>
                
                <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                  {filteredPool.length > 0 ? (
                    filteredPool.slice(0, 50).map((item) => ( // Limit render to top 50 for performance
                      <button
                        key={item.id}
                        onClick={() => checkGuess(item.name)}
                        className="w-full flex items-center space-x-3 p-2 rounded-sm hover:bg-gray-800 border border-transparent hover:border-gray-600 group transition-all text-left"
                      >
                        {/* Thumbnail */}
                        <div className="w-12 h-8 bg-black rounded-sm overflow-hidden shrink-0 border border-gray-700 relative">
                           {item.image && item.image.startsWith('http') ? (
                             <img src={item.image} alt="" className="w-full h-full object-cover" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-gray-700">
                               <Shield className="w-3 h-3" />
                             </div>
                           )}
                        </div>
                        
                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="font-mono font-bold text-sm text-gray-200 group-hover:text-wt-orange truncate">
                            {item.name}
                          </div>
                          <div className="flex items-center space-x-3 text-[10px] text-gray-500">
                             <span className="flex items-center"><Shield className="w-2 h-2 mr-1"/> {item.rank}</span>
                             <span className="flex items-center"><Target className="w-2 h-2 mr-1"/> {item.br.toFixed(1)}</span>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                     <div className="p-4 text-center text-gray-500 font-mono text-xs">
                        NO MATCHING VEHICLES IN DATABASE
                     </div>
                  )}
                  {filteredPool.length > 50 && (
                     <div className="text-center text-[10px] text-gray-600 py-1">
                        ... {filteredPool.length - 50} more matches ...
                     </div>
                  )}
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Error Toast */}
      {errorMsg && (
        <div className="mt-4 p-3 bg-red-900/30 border border-red-600/50 text-red-400 rounded-sm flex items-center justify-center animate-bounce">
          <AlertTriangle className="w-4 h-4 mr-2" />
          <span className="font-mono text-sm">{errorMsg}</span>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4a4a4a;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #e6a33e;
        }
      `}</style>
    </div>
  );
};