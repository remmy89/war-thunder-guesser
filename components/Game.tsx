import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { VehicleData, Difficulty, VehicleSummary, GameStats } from '../types';
import { HintCard } from './HintCard';
import { Send, AlertTriangle, Search, Shield, Target, ChevronRight, Wifi, Eye, Lock } from 'lucide-react';
import { playSound } from '../utils/audio';
import { GAME_CONFIG, ROMAN_TO_ARABIC } from '../constants';
import { getGameStats, updateGameStats } from '../utils/storage';
import { normalize, tokenize, isFuzzyMatch, isTokenMatch } from '../utils/stringUtils';

interface GameProps {
  vehicle: VehicleData;
  pool: VehicleSummary[];
  difficulty: Difficulty;
  onGameOver: (won: boolean, attemptsUsed: number) => void;
}

export const Game: React.FC<GameProps> = ({ vehicle, pool, difficulty, onGameOver }) => {
  const [guess, setGuess] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [stats, setStats] = useState<GameStats>(getGameStats);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const { MAX_ATTEMPTS, MAX_BLUR, BLUR_STEP, SUGGESTIONS_LIMIT, POOL_DISPLAY_LIMIT } = GAME_CONFIG;
  const currentBlur = Math.max(0, MAX_BLUR - (attempts * BLUR_STEP));
  const isImageAvailable = vehicle.description?.startsWith('http') ?? false;
  const convertRoman = difficulty === Difficulty.HARD;

  // Focus input on mount and after attempts
  useEffect(() => {
    inputRef.current?.focus();
  }, [attempts, difficulty]);

  // Reset suggestion index when guess changes
  useEffect(() => {
    setActiveSuggestionIndex(-1);
    setShowSuggestions(true);
  }, [guess]);

  // Play reveal sound on new hints
  useEffect(() => {
    if (attempts > 0 && attempts < MAX_ATTEMPTS) {
      const timer = setTimeout(() => playSound('reveal'), 200);
      return () => clearTimeout(timer);
    }
  }, [attempts, MAX_ATTEMPTS]);

  // Filter pool for Easy mode with revealed hints
  const filteredPool = useMemo(() => {
    if (difficulty !== Difficulty.EASY) return [];

    let result = pool.filter((v) => v.nation === vehicle.nation);

    if (attempts >= 1) result = result.filter((v) => v.rank === vehicle.rank);
    if (attempts >= 3) result = result.filter((v) => v.vehicleType === vehicle.vehicleType);

    if (guess.trim()) {
      const search = guess.toLowerCase();
      result = result.filter((v) => v.name.toLowerCase().includes(search));
    }
    
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [pool, difficulty, vehicle.nation, vehicle.rank, vehicle.vehicleType, attempts, guess]);

  // Suggestions for Hard mode autocomplete
  const suggestions = useMemo(() => {
    if (difficulty !== Difficulty.HARD || !guess.trim()) return [];

    const search = guess.toLowerCase();

    return pool
      .filter((v) => v.name.toLowerCase().includes(search))
      .sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        const aStarts = aName.startsWith(search);
        const bStarts = bName.startsWith(search);

        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        return a.name.localeCompare(b.name);
      })
      .slice(0, SUGGESTIONS_LIMIT);
  }, [pool, difficulty, guess, SUGGESTIONS_LIMIT]);

  // Check if guess matches the vehicle
  const checkGuessMatch = useCallback((valueToCheck: string): boolean => {
    // Direct name match
    if (isFuzzyMatch(valueToCheck, vehicle.name, convertRoman)) {
      return true;
    }

    // Token-based match
    const guessTokens = tokenize(valueToCheck, convertRoman);
    const nameTokens = tokenize(vehicle.name, convertRoman);
    if (isTokenMatch(guessTokens, nameTokens)) {
      return true;
    }

    // Check aliases
    for (const alias of vehicle.aliases) {
      if (isFuzzyMatch(valueToCheck, alias, convertRoman)) {
        return true;
      }
      if (isTokenMatch(tokenize(valueToCheck, convertRoman), tokenize(alias, convertRoman))) {
        return true;
      }
    }

    return false;
  }, [vehicle.name, vehicle.aliases, convertRoman]);

  // Handle guess submission
  const checkGuess = useCallback((valueToCheck: string) => {
    if (!valueToCheck.trim()) return;
    setShowSuggestions(false);

    const isMatch = checkGuessMatch(valueToCheck);

    if (isMatch) {
      playSound('win');
      const newStats = updateGameStats(true);
      setStats(newStats);
      onGameOver(true, attempts);
    } else {
      const nextAttempts = attempts + 1;
      if (nextAttempts >= MAX_ATTEMPTS) {
        playSound('loss');
        const newStats = updateGameStats(false);
        setStats(newStats);
        onGameOver(false, nextAttempts);
      } else {
        playSound('wrong');
        setAttempts(nextAttempts);
        setGuess('');
        setErrorMsg('Incorrect. Intel updated.');
        setTimeout(() => setErrorMsg(null), 2000);
      }
    }
  }, [checkGuessMatch, attempts, MAX_ATTEMPTS, onGameOver]);

  // Handle suggestion selection
  const selectSuggestion = useCallback((suggestion: string) => {
    setGuess(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (difficulty === Difficulty.EASY && filteredPool.length > 0) {
        checkGuess(filteredPool[0].name);
      } else if (difficulty === Difficulty.HARD) {
        if (activeSuggestionIndex >= 0 && suggestions.length > 0) {
          selectSuggestion(suggestions[activeSuggestionIndex].name);
        } else {
          checkGuess(guess);
        }
      } else {
        checkGuess(guess);
      }
      return;
    }

    if (difficulty === Difficulty.HARD && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestionIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    }
  }, [difficulty, filteredPool, suggestions, activeSuggestionIndex, guess, checkGuess, selectSuggestion]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setGuess(e.target.value);
    setShowSuggestions(true);
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      {/* Status Bar */}
      <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" aria-hidden="true" />
            <span className="text-red-500 font-mono text-sm tracking-widest">LIVE FEED // SECURE</span>
          </div>
          <div className="hidden md:flex space-x-4 text-xs font-mono text-gray-500 border-l border-gray-700 pl-4">
            <span>GAMES: <span className="text-gray-300">{stats.gamesPlayed}</span></span>
            <span>STREAK: <span className="text-wt-orange">{stats.currentStreak}</span></span>
          </div>
        </div>
        <div className="font-mono text-sm text-gray-400" role="status" aria-live="polite">
          ATTEMPTS: <span className="text-wt-orange text-xl font-bold">{MAX_ATTEMPTS - attempts}</span>
        </div>
      </div>

      {/* --- INTEL INTERCEPT MONITOR (Visual Feed) --- */}
      <div 
        className="relative w-full bg-black border border-gray-700 rounded-sm overflow-hidden mb-6 shadow-2xl group select-none"
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="absolute top-0 left-0 right-0 h-8 bg-black/80 backdrop-blur border-b border-gray-800 z-30 flex items-center justify-between px-3">
           <div className="flex items-center space-x-2">
             <Wifi className={`w-3 h-3 ${attempts < 3 ? 'text-green-500' : 'text-red-500'} animate-pulse`} />
             <span className="text-[10px] font-mono text-gray-400">SAT_LINK_V4.0 // STREAMING</span>
           </div>
           <div className="flex items-center space-x-2">
             <span className="text-[10px] font-mono text-wt-orange border border-wt-orange/30 px-1.5 py-0.5 rounded-sm">
               SIGNAL QUALITY: {Math.min(100, Math.round((attempts / 5) * 100))}%
             </span>
           </div>
        </div>

        <div className="relative aspect-video w-full bg-[#0a0a0a]">
           {isImageAvailable ? (
             <>
               <img 
                 src={vehicle.description} 
                 alt="Target Intel"
                 draggable="false"
                 style={{ 
                   filter: `blur(${currentBlur}px) grayscale(${attempts < 5 ? 100 : 0}%) contrast(1.2)`,
                   opacity: 0.9 
                 }}
                 className="w-full h-full object-cover transition-all duration-1000 ease-in-out pointer-events-none"
               />
               <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] pointer-events-none opacity-50"></div>
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-20 pointer-events-none"></div>
             </>
           ) : (
             <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 space-y-2">
                <Eye className="w-12 h-12 opacity-20" />
                <span className="font-mono text-xs tracking-widest opacity-50">NO VISUAL FEED AVAILABLE</span>
             </div>
           )}
           
           {currentBlur > 10 && (
              <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                 <div className="bg-black/70 border border-red-500/30 px-4 py-2 flex items-center space-x-2 backdrop-blur-sm animate-pulse">
                    <Lock className="w-4 h-4 text-red-500" />
                    <span className="text-red-500 font-mono text-xs tracking-widest font-bold">IMAGE ENCRYPTED</span>
                 </div>
              </div>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <HintCard label="NATION" value={vehicle.nation} isRevealed={true} iconType="nation" index={0} />
        <HintCard label="RANK" value={`RANK ${vehicle.rank}`} isRevealed={attempts >= 1} iconType="rank" index={1} />
        <HintCard label="BATTLE RATING" value={`${vehicle.br.toFixed(1)} (RB)`} isRevealed={attempts >= 2} iconType="br" index={2} />
        <HintCard label="CLASS" value={vehicle.vehicleType} isRevealed={attempts >= 3} iconType="type" index={3} />
        <div className="md:col-span-2">
          <HintCard label="MAIN ARMAMENT" value={vehicle.armament} isRevealed={attempts >= 4} iconType="gun" index={4} />
        </div>
      </div>

      <div className="relative z-20">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-wt-orange to-red-600 rounded-lg blur opacity-30 transition duration-1000"></div>
        <div className="relative bg-wt-dark rounded-lg p-4 border border-gray-700">
            <label className="block text-xs font-mono text-gray-400 mb-2 uppercase">
              {difficulty === Difficulty.HARD ? 'Identify Vehicle' : 'Search Database (Filters Active)'}
            </label>
            
            <div className="flex space-x-2 relative">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={guess}
                  onChange={handleInputChange}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  onKeyDown={handleKeyDown}
                  placeholder={difficulty === Difficulty.HARD ? "Enter vehicle name..." : "Type to search..."}
                  className="w-full bg-black/50 border border-gray-600 text-wt-text px-4 py-3 pl-10 rounded-sm font-mono focus:outline-none focus:border-wt-orange focus:ring-1 focus:ring-wt-orange transition-all"
                  autoComplete="off"
                  aria-label="Vehicle name guess"
                  aria-describedby={errorMsg ? "error-message" : undefined}
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none" aria-hidden="true">
                  {difficulty === Difficulty.HARD ? <Search className="w-4 h-4 text-gray-500" /> : <Search className="w-4 h-4 text-wt-orange" />}
                </div>

                {difficulty === Difficulty.HARD && showSuggestions && suggestions.length > 0 && (
                  <div 
                    ref={suggestionsRef}
                    className="absolute z-50 left-0 right-0 mt-1 bg-[#1a1a1a] border border-wt-orange/50 shadow-xl max-h-60 overflow-y-auto rounded-sm"
                    role="listbox"
                    aria-label="Vehicle suggestions"
                  >
                    {suggestions.map((item, idx) => (
                      <button
                        key={item.id}
                        role="option"
                        aria-selected={idx === activeSuggestionIndex}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          selectSuggestion(item.name);
                        }}
                        className={`
                          w-full text-left px-4 py-2 text-sm font-mono border-b border-gray-800 last:border-0 flex items-center justify-between group
                          ${idx === activeSuggestionIndex ? 'bg-wt-orange text-black' : 'text-gray-300 hover:bg-gray-800'}
                        `}
                      >
                        <span className="truncate">{item.name}</span>
                        {idx === activeSuggestionIndex && <ChevronRight className="w-3 h-3" aria-hidden="true" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <button
                onClick={() => checkGuess(guess)}
                className="bg-wt-orange hover:bg-yellow-600 text-black font-bold px-6 py-3 rounded-sm flex items-center space-x-2 transition-colors shrink-0"
              >
                <span>SEND</span>
                <Send className="w-4 h-4" />
              </button>
            </div>

            {difficulty === Difficulty.EASY && (
              <div className="mt-4 border-t border-gray-700 pt-2">
                <p className="text-[10px] text-gray-500 font-mono mb-2 uppercase tracking-wider">
                  Potential Matches: <span className="text-white">{filteredPool.length}</span>
                </p>
                <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar pr-1" role="list" aria-label="Matching vehicles">
                  {filteredPool.length > 0 ? (
                    filteredPool.slice(0, POOL_DISPLAY_LIMIT).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => checkGuess(item.name)}
                        className="w-full flex items-center space-x-3 p-2 rounded-sm hover:bg-gray-800 border border-transparent hover:border-gray-600 group transition-all text-left"
                        aria-label={`Select ${item.name}`}
                      >
                        <div className="w-12 h-8 bg-black rounded-sm overflow-hidden shrink-0 border border-gray-700 relative" aria-hidden="true">
                          {item.image && item.image.startsWith('http') ? (
                            <img src={item.image} alt="" className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-700">
                              <Shield className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-mono font-bold text-sm text-gray-200 group-hover:text-wt-orange truncate">
                            {item.name}
                          </div>
                          <div className="flex items-center space-x-3 text-[10px] text-gray-500">
                            <span className="flex items-center"><Shield className="w-2 h-2 mr-1" aria-hidden="true" /> {item.rank}</span>
                            <span className="flex items-center"><Target className="w-2 h-2 mr-1" aria-hidden="true" /> {item.br.toFixed(1)}</span>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500 font-mono text-xs">
                      NO MATCHING VEHICLES IN DATABASE
                    </div>
                  )}
                  {filteredPool.length > POOL_DISPLAY_LIMIT && (
                    <div className="text-center text-[10px] text-gray-600 py-1">
                      ... {filteredPool.length - POOL_DISPLAY_LIMIT} more matches ...
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>
      </div>
      {errorMsg && (
        <div 
          id="error-message"
          role="alert"
          className="mt-4 p-3 bg-red-900/30 border border-red-600/50 text-red-400 rounded-sm flex items-center justify-center animate-bounce"
        >
          <AlertTriangle className="w-4 h-4 mr-2" aria-hidden="true" />
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