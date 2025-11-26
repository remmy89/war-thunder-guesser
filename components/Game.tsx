import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { VehicleData, Difficulty, VehicleSummary, GameStats, GuessFeedback as GuessFeedbackType, FeedbackIndicator } from '../types';
import { HintCard } from './HintCard';
import { GuessFeedback } from './GuessFeedback';
import { Send, AlertTriangle, Search, Shield, Target, ChevronRight, Wifi, Eye, Lock, SkipForward, Keyboard, HelpCircle, Zap, X } from 'lucide-react';
import { playSound } from '../utils/audio';
import { GAME_CONFIG, ROMAN_TO_ARABIC, ROMAN_MAP } from '../constants';
import { getGameStats, updateGameStats } from '../utils/storage';
import { normalize, tokenize, isFuzzyMatch, isTokenMatch } from '../utils/stringUtils';

interface GameProps {
  vehicle: VehicleData;
  pool: VehicleSummary[];
  difficulty: Difficulty;
  onGameOver: (won: boolean, attemptsUsed: number) => void;
}

// Toast notification component
const Toast: React.FC<{ message: string; type: 'error' | 'info' | 'success'; onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'error' ? 'bg-red-900/90 border-red-600' : type === 'success' ? 'bg-green-900/90 border-green-600' : 'bg-blue-900/90 border-blue-600';
  const textColor = type === 'error' ? 'text-red-400' : type === 'success' ? 'text-green-400' : 'text-blue-400';

  return (
    <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 ${bgColor} border px-4 py-3 rounded-sm shadow-lg animate-toast-in flex items-center gap-3`}>
      {type === 'error' && <AlertTriangle className="w-4 h-4 text-red-400" />}
      {type === 'info' && <Zap className="w-4 h-4 text-blue-400" />}
      {type === 'success' && <Target className="w-4 h-4 text-green-400" />}
      <span className={`font-mono text-sm ${textColor}`}>{message}</span>
      <button onClick={onClose} className="ml-2 text-gray-400 hover:text-white">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};

export const Game: React.FC<GameProps> = ({ vehicle, pool, difficulty, onGameOver }) => {
  const [guess, setGuess] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'info' | 'success' } | null>(null);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [stats, setStats] = useState<GameStats>(getGameStats);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [guessFeedbackHistory, setGuessFeedbackHistory] = useState<GuessFeedbackType[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const { MAX_ATTEMPTS, MAX_BLUR, BLUR_STEP, SUGGESTIONS_LIMIT, POOL_DISPLAY_LIMIT } = GAME_CONFIG;
  const currentBlur = Math.max(0, MAX_BLUR - (attempts * BLUR_STEP));
  const isImageAvailable = vehicle.description?.startsWith('http') ?? false;
  const convertRoman = difficulty === Difficulty.HARD;

  // Normalize string for flexible search (spaces, hyphens, underscores treated as same)
  const normalizeForSearch = useCallback((str: string): string => {
    return str.toLowerCase().replace(/[-_\s]+/g, ' ').trim();
  }, []);

  // Check if vehicle name matches search query (flexible matching)
  const matchesSearch = useCallback((vehicleName: string, searchQuery: string): boolean => {
    const normalizedName = normalizeForSearch(vehicleName);
    const normalizedSearch = normalizeForSearch(searchQuery);
    return normalizedName.includes(normalizedSearch);
  }, [normalizeForSearch]);

  // Convert Roman numeral rank to number for comparison
  const rankToNumber = useCallback((rank: string): number => {
    const cleanRank = rank.replace(/^RANK\s*/i, '').trim().toLowerCase();
    return parseInt(ROMAN_TO_ARABIC[cleanRank] ?? cleanRank, 10) || 0;
  }, []);

  // Generate feedback for an incorrect guess
  const generateFeedback = useCallback((guessedVehicle: VehicleSummary): GuessFeedbackType => {
    const targetRankNum = rankToNumber(vehicle.rank);
    const guessedRankNum = rankToNumber(guessedVehicle.rank);
    
    let rankIndicator: FeedbackIndicator = 'correct';
    if (guessedRankNum < targetRankNum) {
      rankIndicator = 'higher';
    } else if (guessedRankNum > targetRankNum) {
      rankIndicator = 'lower';
    }

    let brIndicator: FeedbackIndicator = 'correct';
    if (Math.abs(guessedVehicle.br - vehicle.br) < 0.05) {
      brIndicator = 'correct';
    } else if (guessedVehicle.br < vehicle.br) {
      brIndicator = 'higher';
    } else {
      brIndicator = 'lower';
    }

    return {
      vehicleName: guessedVehicle.name,
      nation: {
        guessed: guessedVehicle.nation,
        correct: guessedVehicle.nation.toLowerCase() === vehicle.nation.toLowerCase(),
      },
      rank: {
        guessed: guessedVehicle.rank,
        indicator: rankIndicator,
      },
      br: {
        guessed: guessedVehicle.br,
        indicator: brIndicator,
      },
      vehicleType: {
        guessed: guessedVehicle.vehicleType,
        correct: guessedVehicle.vehicleType.toLowerCase() === vehicle.vehicleType.toLowerCase(),
      },
    };
  }, [vehicle, rankToNumber]);

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
      result = result.filter((v) => matchesSearch(v.name, guess));
    }
    
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [pool, difficulty, vehicle.nation, vehicle.rank, vehicle.vehicleType, attempts, guess, matchesSearch]);

  // Suggestions for Hard mode autocomplete
  const suggestions = useMemo(() => {
    if (difficulty !== Difficulty.HARD || !guess.trim()) return [];

    const normalizedSearch = normalizeForSearch(guess);

    // Deduplicate by name first
    const seenNames = new Set<string>();
    const uniquePool = pool.filter((v) => {
      const lowerName = v.name.toLowerCase();
      if (seenNames.has(lowerName)) return false;
      seenNames.add(lowerName);
      return true;
    });

    // Apply hint-based filtering (same as Easy mode)
    let filteredByHints = uniquePool.filter((v) => v.nation === vehicle.nation);
    if (attempts >= 1) filteredByHints = filteredByHints.filter((v) => v.rank === vehicle.rank);
    if (attempts >= 3) filteredByHints = filteredByHints.filter((v) => v.vehicleType === vehicle.vehicleType);

    return filteredByHints
      .filter((v) => matchesSearch(v.name, guess))
      .sort((a, b) => {
        const aName = normalizeForSearch(a.name);
        const bName = normalizeForSearch(b.name);
        const aStarts = aName.startsWith(normalizedSearch);
        const bStarts = bName.startsWith(normalizedSearch);

        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        return a.name.localeCompare(b.name);
      })
      .slice(0, SUGGESTIONS_LIMIT);
  }, [pool, difficulty, guess, SUGGESTIONS_LIMIT, normalizeForSearch, matchesSearch, vehicle.nation, vehicle.rank, vehicle.vehicleType, attempts]);

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

  // Handle skip hint (reveal next hint without guessing)
  const handleSkipHint = useCallback(() => {
    if (attempts >= MAX_ATTEMPTS - 1) {
      setToast({ message: 'No more hints available!', type: 'info' });
      return;
    }
    
    playSound('reveal');
    setAttempts(prev => prev + 1);
    setToast({ message: `Hint ${attempts + 2} revealed. ${MAX_ATTEMPTS - attempts - 1} attempts remaining.`, type: 'info' });
  }, [attempts, MAX_ATTEMPTS]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Skip hint with Ctrl+S or Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (attempts < MAX_ATTEMPTS - 1) {
          playSound('reveal');
          setAttempts(prev => prev + 1);
          setToast({ message: `Hint revealed. ${MAX_ATTEMPTS - attempts - 1} attempts remaining.`, type: 'info' });
        }
      }
      // Toggle keyboard help with ?
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        setShowKeyboardHelp(prev => !prev);
      }
      // Focus input with /
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [attempts, MAX_ATTEMPTS]);

  // Handle guess submission
  const checkGuess = useCallback((valueToCheck: string) => {
    if (!valueToCheck.trim()) {
      setToast({ message: 'Enter a vehicle name first!', type: 'info' });
      return;
    }
    setShowSuggestions(false);

    const isMatch = checkGuessMatch(valueToCheck);

    if (isMatch) {
      playSound('win');
      const newStats = updateGameStats(true);
      setStats(newStats);
      onGameOver(true, attempts);
    } else {
      const nextAttempts = attempts + 1;
      
      // Generate feedback for Hard Mode
      if (difficulty === Difficulty.HARD) {
        const guessedVehicle = pool.find(
          (v) => v.name.toLowerCase() === valueToCheck.toLowerCase()
        );
        if (guessedVehicle) {
          const feedback = generateFeedback(guessedVehicle);
          setGuessFeedbackHistory((prev) => [...prev, feedback]);
        }
      }
      
      if (nextAttempts >= MAX_ATTEMPTS) {
        playSound('loss');
        const newStats = updateGameStats(false);
        setStats(newStats);
        onGameOver(false, nextAttempts);
      } else {
        playSound('wrong');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
        setAttempts(nextAttempts);
        setGuess('');
        setToast({ message: `Incorrect! New intel unlocked. ${MAX_ATTEMPTS - nextAttempts} attempts left.`, type: 'error' });
      }
    }
  }, [checkGuessMatch, attempts, MAX_ATTEMPTS, onGameOver, difficulty, pool, generateFeedback]);

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
      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Keyboard Shortcuts Help Modal */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowKeyboardHelp(false)}>
          <div className="bg-[#1a1a1a] border border-gray-700 p-6 rounded-sm max-w-sm w-full mx-4 animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-mono text-lg font-bold text-wt-orange flex items-center gap-2">
                <Keyboard className="w-5 h-5" /> Keyboard Shortcuts
              </h3>
              <button onClick={() => setShowKeyboardHelp(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm font-mono">
              <div className="flex justify-between text-gray-400">
                <span>Submit guess</span>
                <kbd className="bg-gray-800 px-2 py-1 rounded text-xs">Enter</kbd>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Skip / Reveal hint</span>
                <kbd className="bg-gray-800 px-2 py-1 rounded text-xs">Ctrl+S</kbd>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Focus search</span>
                <kbd className="bg-gray-800 px-2 py-1 rounded text-xs">/</kbd>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Navigate suggestions</span>
                <kbd className="bg-gray-800 px-2 py-1 rounded text-xs">↑ ↓</kbd>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Close suggestions</span>
                <kbd className="bg-gray-800 px-2 py-1 rounded text-xs">Esc</kbd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" aria-hidden="true" />
            <span className="text-red-500 font-mono text-sm tracking-widest">LIVE FEED // SECURE</span>
          </div>
          <div className="hidden md:flex space-x-4 text-xs font-mono text-gray-500 border-l border-gray-700 pl-4">
            <span>GAMES: <span className="text-gray-300">{stats.gamesPlayed}</span></span>
            <span className={stats.currentStreak >= 3 ? 'animate-streak-pop' : ''}>
              STREAK: <span className={`${stats.currentStreak >= 3 ? 'text-green-500' : 'text-wt-orange'} font-bold`}>
                {stats.currentStreak}{stats.currentStreak >= 5 && ' 🔥'}
              </span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowKeyboardHelp(true)}
            className="text-gray-500 hover:text-wt-orange transition-colors p-1"
            aria-label="Show keyboard shortcuts"
            title="Keyboard shortcuts (?)"
          >
            <Keyboard className="w-4 h-4" />
          </button>
          <div className="font-mono text-sm text-gray-400" role="status" aria-live="polite">
            ATTEMPTS: <span className={`text-xl font-bold ${MAX_ATTEMPTS - attempts <= 2 ? 'text-red-500' : 'text-wt-orange'}`}>
              {MAX_ATTEMPTS - attempts}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-[10px] font-mono text-gray-500 mb-1">
          <span>INTEL PROGRESS</span>
          <span>{Math.min(attempts + 1, 5)}/5 HINTS</span>
        </div>
        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-wt-orange to-yellow-500 transition-all duration-500 ease-out"
            style={{ width: `${Math.min(((attempts + 1) / 5) * 100, 100)}%` }}
          />
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

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4" role="list" aria-label="Hint cards">
        <HintCard label="NATION" value={vehicle.nation} isRevealed={true} iconType="nation" index={0} compact />
        <HintCard label="RANK" value={vehicle.rank} isRevealed={attempts >= 1} iconType="rank" index={1} compact />
        <HintCard label="BR" value={`${vehicle.br.toFixed(1)}`} isRevealed={attempts >= 2} iconType="br" index={2} compact />
        <HintCard label="CLASS" value={vehicle.vehicleType} isRevealed={attempts >= 3} iconType="type" index={3} compact />
        <HintCard label="ARMAMENT" value={vehicle.armament} isRevealed={attempts >= 4} iconType="gun" index={4} compact />
      </div>

      {/* Guess Feedback History (Hard Mode only) */}
      {difficulty === Difficulty.HARD && guessFeedbackHistory.length > 0 && (
        <div className="mb-4 bg-[#0d0d0d] border border-gray-800 rounded-sm p-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-mono text-[10px] text-gray-500 uppercase flex items-center gap-1">
              <Target className="w-2.5 h-2.5 text-wt-orange" /> Guesses
              <span className="text-gray-600 ml-1">(Nation|Rank|BR|Type)</span>
            </span>
            <span className="text-[9px] font-mono text-gray-600">
              ✅=Match 🔼=Higher 🔽=Lower ❌=Wrong
            </span>
          </div>
          <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
            {guessFeedbackHistory.map((feedback, idx) => (
              <GuessFeedback key={idx} feedback={feedback} index={idx} />
            ))}
          </div>
        </div>
      )}

      <div className={`relative z-20 ${isShaking ? 'animate-shake' : ''}`}>
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
                className="bg-wt-orange hover:bg-yellow-600 text-black font-bold px-6 py-3 rounded-sm flex items-center space-x-2 transition-colors shrink-0 active:scale-95"
                aria-label="Submit guess"
              >
                <span className="hidden sm:inline">SEND</span>
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* Skip Hint Button */}
            {attempts < MAX_ATTEMPTS - 1 && (
              <div className="mt-3 flex items-center justify-between">
                <button
                  onClick={handleSkipHint}
                  className="flex items-center gap-2 text-xs font-mono text-gray-500 hover:text-wt-orange transition-colors group"
                  title="Reveal next hint (Ctrl+S)"
                >
                  <SkipForward className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  <span>Skip & reveal next hint</span>
                </button>
                <span className="text-[10px] font-mono text-gray-600">
                  Press <kbd className="bg-gray-800 px-1 rounded">?</kbd> for shortcuts
                </span>
              </div>
            )}

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
                    <div className="text-center text-[10px] text-gray-600 py-2 border-t border-gray-800">
                      Showing top {POOL_DISPLAY_LIMIT} of {filteredPool.length} matches. Type to narrow results.
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>
      </div>
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