import React, { useState, useCallback, useEffect } from 'react';
import { GameState, VehicleData, Difficulty, VehicleSummary, Achievement } from './types';
import { fetchMysteryVehicle } from './services/apiService';
import { Game } from './components/Game';
import { ServiceRecord } from './components/ServiceRecord';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Radar, Trophy, AlertOctagon, Play, ShieldAlert, RefreshCw, Crosshair, Skull, Calendar, Medal, HelpCircle, Info, Share2, Copy, Check, Sparkles } from 'lucide-react';
import { initAudio, playSound } from './utils/audio';
import { processGameResult } from './utils/achievements';
import { getGameStats, isDailyChallengeCompleted, saveDailyCompleted } from './utils/storage';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.HARD);
  const [pool, setPool] = useState<VehicleSummary[]>([]);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [showServiceRecord, setShowServiceRecord] = useState(false);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showDifficultyInfo, setShowDifficultyInfo] = useState<'easy' | 'hard' | 'daily' | null>(null);
  const [tooltipsEnabled, setTooltipsEnabled] = useState(true);
  const [isDaily, setIsDaily] = useState(false);
  const [dailyCompleted, setDailyCompleted] = useState(isDailyChallengeCompleted());

  // Confetti effect for wins
  const [showConfetti, setShowConfetti] = useState(false);
  
  const createConfetti = useCallback(() => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  }, []);

  const startGame = useCallback(async (selectedDifficulty: Difficulty, seed?: string) => {
    initAudio();
    playSound('start');
    setDifficulty(selectedDifficulty);
    setIsDaily(!!seed);
    setGameState(GameState.LOADING);
    setLoadingError(null);
    setNewAchievements([]);
    
    try {
      const result = await fetchMysteryVehicle(selectedDifficulty, seed);
      setVehicle(result.vehicle);
      setPool(result.pool);
      setGameState(GameState.PLAYING);
    } catch (error) {
      console.error('Failed to start game:', error);
      setLoadingError('Failed to establish connection to HQ (API Error). Please retry.');
      setGameState(GameState.MENU);
    }
  }, []);

  const handleGameOver = useCallback((won: boolean, attempts: number) => {
    setGameState(won ? GameState.VICTORY : GameState.GAME_OVER);
    setAttemptsUsed(attempts);

    if (won) {
      createConfetti();
    }

    // Mark daily challenge as completed
    if (isDaily) {
      saveDailyCompleted();
      setDailyCompleted(true);
    }

    if (vehicle) {
      const stats = getGameStats();
      const { newUnlocks } = processGameResult(vehicle, won, attempts, stats.currentStreak);
      
      if (newUnlocks.length > 0) {
        setNewAchievements(newUnlocks);
        setTimeout(() => playSound('win'), 500);
      }
    }
  }, [vehicle, createConfetti, isDaily]);

  // Share result functionality
  const handleShare = useCallback(() => {
    if (!vehicle) return;
    
    const stats = getGameStats();
    const result = gameState === GameState.VICTORY 
      ? `🎯 Identified: ${vehicle.name}\n⚡ Attempts: ${attemptsUsed + 1}/6`
      : `❌ Failed to identify\n🎯 It was: ${vehicle.name}`;
    
    const shareText = `🔍 WT Guesser\n${result}\n🔥 Streak: ${stats.currentStreak}\n\nPlay at: ${window.location.href}`;
    
    if (navigator.share) {
      navigator.share({ text: shareText }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }, [vehicle, gameState, attemptsUsed]);

  const handleReturnToMenu = useCallback(() => {
    playSound('click');
    setShowDifficultyInfo(null);
    setTooltipsEnabled(false);
    setGameState(GameState.MENU);
    // Re-enable tooltips after a short delay to prevent immediate hover triggers
    setTimeout(() => setTooltipsEnabled(true), 300);
  }, []);

  const handleOpenServiceRecord = useCallback(() => {
    setShowServiceRecord(true);
  }, []);

  const handleCloseServiceRecord = useCallback(() => {
    setShowServiceRecord(false);
  }, []);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#121212] text-gray-100 font-sans selection:bg-wt-orange selection:text-black overflow-x-hidden relative">
        {/* Decorative Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
          <div className="absolute inset-0 bg-camo-pattern opacity-5"></div>
          <div className="scanline"></div>
        </div>

        {/* Header */}
        <header className="relative z-50 border-b border-gray-800 bg-[#1a1a1a]/90 backdrop-blur-md sticky top-0">
          <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
            <button 
              className="flex items-center space-x-3 cursor-pointer" 
              onClick={() => setGameState(GameState.MENU)}
              aria-label="Return to main menu"
            >
              <div className="bg-wt-orange p-1.5 rounded-sm" aria-hidden="true">
                <Radar className="w-6 h-6 text-black" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tighter text-white leading-none">
                  WT<span className="text-wt-orange">GUESSER</span>
                </h1>
                <p className="text-[0.6rem] font-mono text-gray-500 tracking-[0.2em]">
                  ARMORED VEHICLE IDENTIFICATION
                </p>
              </div>
            </button>
            <div className="hidden md:block">
              <div className="flex items-center space-x-1 text-xs font-mono text-gray-500">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" aria-hidden="true"></span>
                <span>SYSTEM ONLINE</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative z-20 max-w-5xl mx-auto px-4 py-8 flex flex-col items-center min-h-[80vh] justify-center">

          {gameState === GameState.MENU && (
            <div className="text-center max-w-lg w-full animate-in fade-in zoom-in duration-500">
              <div className="mb-8 relative inline-block" aria-hidden="true">
                <ShieldAlert className="w-24 h-24 text-gray-700 mx-auto" />
                <ShieldAlert className="w-24 h-24 text-wt-orange absolute top-0 left-0 animate-pulse opacity-50 blur-lg" />
              </div>
              <h2 className="text-4xl font-black mb-4 tracking-tight">MISSION BRIEFING</h2>
              <p className="text-gray-400 mb-8 font-mono leading-relaxed">
                Intelligence has intercepted data on an unknown enemy vehicle.
                Identify the target using progressive hints.
                <br /><br />
                <span className="text-wt-orange">Failure allows the enemy to advance.</span>
              </p>

              {loadingError && (
                <div 
                  role="alert"
                  className="mb-6 p-4 bg-red-900/20 border border-red-800 text-red-400 text-sm font-mono rounded-sm"
                >
                  {loadingError}
                </div>
              )}

              <div className="flex flex-col gap-4 justify-center">
                <div className="flex flex-col sm:flex-row gap-4 justify-center w-full">
                  {/* Easy Mode */}
                  <div className="relative group">
                    <button
                      onClick={() => startGame(Difficulty.EASY)}
                      onMouseEnter={() => tooltipsEnabled && setShowDifficultyInfo('easy')}
                      onMouseLeave={() => setShowDifficultyInfo(null)}
                      className="relative flex items-center justify-center px-6 py-4 font-bold text-white transition-all duration-200 bg-gray-800 border border-gray-700 hover:border-green-500 hover:bg-gray-750 rounded-sm w-full sm:w-auto group"
                    >
                      <div className="flex flex-col items-center">
                        <div className="flex items-center mb-1">
                          <Crosshair className="w-4 h-4 mr-2 text-green-500" aria-hidden="true" />
                          <span className="text-lg tracking-wider">EASY</span>
                        </div>
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono group-hover:text-gray-400">
                          Assisted Mode
                        </span>
                      </div>
                      <HelpCircle className="absolute top-2 right-2 w-3 h-3 text-gray-600 group-hover:text-green-500" />
                    </button>
                    {showDifficultyInfo === 'easy' && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 bg-[#1a1a1a] border border-gray-700 rounded-sm text-xs text-left w-64 z-50 animate-fade-in shadow-xl">
                        <div className="font-bold text-green-500 mb-1">Easy Mode</div>
                        <ul className="text-gray-400 space-y-1">
                          <li>• Filtered vehicle list based on hints</li>
                          <li>• Click to select from matching vehicles</li>
                          <li>• Great for learning vehicle names</li>
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Hard Mode */}
                  <div className="relative group">
                    <button
                      onClick={() => startGame(Difficulty.HARD)}
                      onMouseEnter={() => tooltipsEnabled && setShowDifficultyInfo('hard')}
                      onMouseLeave={() => setShowDifficultyInfo(null)}
                      className="relative flex items-center justify-center px-6 py-4 font-bold text-black transition-all duration-200 bg-wt-orange hover:bg-white rounded-sm w-full sm:w-auto group"
                    >
                      <div className="flex flex-col items-center">
                        <div className="flex items-center mb-1">
                          <Skull className="w-4 h-4 mr-2" aria-hidden="true" />
                          <span className="text-lg tracking-wider">HARD</span>
                        </div>
                        <span className="text-[10px] text-black/60 uppercase tracking-widest font-mono">
                          Manual Entry
                        </span>
                      </div>
                      <HelpCircle className="absolute top-2 right-2 w-3 h-3 text-black/40 group-hover:text-black/70" />
                    </button>
                    {showDifficultyInfo === 'hard' && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 bg-[#1a1a1a] border border-gray-700 rounded-sm text-xs text-left w-64 z-50 animate-fade-in shadow-xl">
                        <div className="font-bold text-wt-orange mb-1">Hard Mode</div>
                        <ul className="text-gray-400 space-y-1">
                          <li>• Type vehicle name manually</li>
                          <li>• Autocomplete suggestions available</li>
                          <li>• Tests your War Thunder knowledge</li>
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Daily Challenge */}
                  <div className="relative group">
                    <button
                      onClick={() => {
                        if (dailyCompleted) return;
                        const today = new Date().toISOString().split('T')[0];
                        startGame(Difficulty.HARD, today);
                      }}
                      onMouseEnter={() => tooltipsEnabled && setShowDifficultyInfo('daily')}
                      onMouseLeave={() => setShowDifficultyInfo(null)}
                      disabled={dailyCompleted}
                      className={`relative flex items-center justify-center px-6 py-4 font-bold transition-all duration-200 rounded-sm w-full sm:w-auto group ${
                        dailyCompleted
                          ? 'bg-gray-700 text-gray-400 border border-gray-600 cursor-not-allowed opacity-60'
                          : 'text-white bg-blue-600 hover:bg-blue-500 border border-blue-400'
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <div className="flex items-center mb-1">
                          <Calendar className="w-4 h-4 mr-2" aria-hidden="true" />
                          <span className="text-lg tracking-wider">DAILY</span>
                        </div>
                        <span className={`text-[10px] uppercase tracking-widest font-mono ${
                          dailyCompleted ? 'text-gray-500' : 'text-blue-200'
                        }`}>
                          {dailyCompleted ? 'Completed ✓' : 'Global Target'}
                        </span>
                      </div>
                      {dailyCompleted ? (
                        <Check className="absolute top-2 right-2 w-3 h-3 text-green-500" />
                      ) : (
                        <Sparkles className="absolute top-2 right-2 w-3 h-3 text-blue-300 animate-pulse" />
                      )}
                    </button>
                    {showDifficultyInfo === 'daily' && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 bg-[#1a1a1a] border border-gray-700 rounded-sm text-xs text-left w-64 z-50 animate-fade-in shadow-xl">
                        <div className="font-bold text-blue-400 mb-1">Daily Challenge</div>
                        <ul className="text-gray-400 space-y-1">
                          <li>• Same vehicle for everyone today</li>
                          <li>• Compare with friends</li>
                          <li>• New target every 24 hours</li>
                          {dailyCompleted && (
                            <li className="text-green-400">✓ You've completed today's challenge!</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Service Record Button */}
                <button
                  onClick={handleOpenServiceRecord}
                  className="mx-auto mt-2 flex items-center justify-center px-4 py-2 text-xs font-mono text-gray-500 hover:text-wt-orange hover:bg-gray-800 rounded-sm transition-colors w-auto"
                >
                  <Medal className="w-4 h-4 mr-2" aria-hidden="true" />
                  VIEW SERVICE RECORD
                </button>

                {/* Quick Stats */}
                {(() => {
                  const stats = getGameStats();
                  if (stats.gamesPlayed > 0) {
                    return (
                      <div className="mt-4 pt-4 border-t border-gray-800 flex justify-center gap-8 text-xs font-mono text-gray-500">
                        <div className="text-center">
                          <div className="text-xl font-bold text-gray-300">{stats.gamesPlayed}</div>
                          <div>Games</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-green-500">{Math.round((stats.wins / stats.gamesPlayed) * 100)}%</div>
                          <div>Win Rate</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-wt-orange">{stats.maxStreak}</div>
                          <div>Best Streak</div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          )}

          {gameState === GameState.LOADING && (
            <div className="flex flex-col items-center justify-center py-10 w-full max-w-md animate-in fade-in duration-500" role="status" aria-label="Loading game">
              {/* Radar Animation */}
              <div className="relative w-32 h-32 mb-8" aria-hidden="true">
                {/* Outer Ring */}
                <div className="absolute inset-0 border-2 border-gray-700 rounded-full opacity-30"></div>
                {/* Inner Ring */}
                <div className="absolute inset-4 border border-gray-600 border-dashed rounded-full opacity-30"></div>

                {/* Scanning Sweep */}
                <div className="absolute inset-0 rounded-full animate-[spin_3s_linear_infinite] origin-center">
                  <div className="h-1/2 w-full bg-gradient-to-t from-transparent via-wt-orange/5 to-wt-orange/20 border-b border-wt-orange/50 blur-[1px]"></div>
                </div>

                {/* Center Point */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-wt-orange rounded-full animate-pulse"></div>
                </div>

                {/* Random Blips */}
                <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-red-500 rounded-full animate-[ping_2s_linear_infinite]"></div>
                <div className="absolute bottom-1/3 right-1/3 w-1 h-1 bg-green-500 rounded-full animate-[ping_1.5s_linear_infinite_0.5s]"></div>
              </div>

              <h3 className="text-lg font-black text-white tracking-[0.2em] mb-4 animate-pulse">
                ACQUIRING TARGET
              </h3>

              <div className="w-64 space-y-3">
                <div>
                  <div className="flex justify-between text-[10px] font-mono text-gray-500 uppercase mb-1">
                    <span>Secure Database</span>
                    <span className="text-green-500">CONNECTED</span>
                  </div>
                  <div className="w-full h-0.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-wt-orange animate-[loading_1.5s_ease-in-out_infinite]"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] font-mono text-gray-500 uppercase mb-1">
                    <span>Decryption Sequence</span>
                    <span className="animate-pulse text-wt-orange">RUNNING...</span>
                  </div>
                  <div className="w-full h-0.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-wt-orange animate-[loading_2s_ease-in-out_infinite_0.5s]"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {gameState === GameState.PLAYING && vehicle && (
            <Game
              vehicle={vehicle}
              pool={pool}
              difficulty={difficulty}
              onGameOver={handleGameOver}
            />
          )}

          {(gameState === GameState.VICTORY || gameState === GameState.GAME_OVER) && vehicle && (
            <div className="w-full max-w-2xl bg-[#1a1a1a] border border-gray-700 p-8 rounded-sm shadow-2xl text-center animate-in slide-in-from-bottom-10 duration-500 relative overflow-hidden">
              {/* Confetti effect */}
              {showConfetti && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
                  {Array.from({ length: 50 }).map((_, i) => (
                    <div
                      key={i}
                      className="confetti"
                      style={{
                        left: `${Math.random() * 100}%`,
                        backgroundColor: ['#e6a33e', '#22c55e', '#3b82f6', '#ef4444', '#a855f7'][Math.floor(Math.random() * 5)],
                        animationDelay: `${Math.random() * 2}s`,
                        transform: `rotate(${Math.random() * 360}deg)`,
                      }}
                    />
                  ))}
                </div>
              )}

              <div className="mb-6">
                {gameState === GameState.VICTORY ? (
                  <div className="inline-block p-4 rounded-full bg-green-500/20 mb-4 animate-pulse-glow" aria-hidden="true">
                    <Trophy className="w-16 h-16 text-green-500" />
                  </div>
                ) : (
                  <div className="inline-block p-4 rounded-full bg-red-500/20 mb-4" aria-hidden="true">
                    <AlertOctagon className="w-16 h-16 text-red-500" />
                  </div>
                )}

                <h2 className={`text-4xl font-black mb-2 ${gameState === GameState.VICTORY ? 'text-green-500' : 'text-red-500'}`}>
                  {gameState === GameState.VICTORY ? 'TARGET IDENTIFIED' : 'MISSION FAILED'}
                </h2>
                <p className="text-gray-400 font-mono uppercase tracking-widest">
                  {gameState === GameState.VICTORY 
                    ? `Identified in ${attemptsUsed + 1} attempt${attemptsUsed === 0 ? '' : 's'}!` 
                    : 'Vehicle escaped identification.'}
                </p>
                
                {/* Performance badge */}
                {gameState === GameState.VICTORY && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-gradient-to-r from-wt-orange/20 to-transparent border border-wt-orange/30">
                    {attemptsUsed === 0 && <span className="text-yellow-400">🏆 PERFECT - First Try!</span>}
                    {attemptsUsed === 1 && <span className="text-green-400">⚡ Excellent - 2 Attempts</span>}
                    {attemptsUsed >= 2 && attemptsUsed <= 3 && <span className="text-blue-400">✓ Good Work</span>}
                    {attemptsUsed >= 4 && <span className="text-gray-400">Close Call!</span>}
                  </div>
                )}
              </div>

              {/* Achievement Unlock Notification */}
              {newAchievements.length > 0 && (
                <div className="mb-6 space-y-2" role="alert">
                  {newAchievements.map((ach) => (
                    <div
                      key={ach.id}
                      className="bg-gradient-to-r from-wt-orange/20 to-transparent border-l-4 border-wt-orange p-3 text-left animate-in slide-in-from-left duration-700"
                    >
                      <div className="flex items-center text-wt-orange mb-1">
                        <Medal className="w-4 h-4 mr-2" aria-hidden="true" />
                        <span className="text-xs font-bold uppercase tracking-widest">New Medal Awarded</span>
                      </div>
                      <div className="font-bold text-white">{ach.title}</div>
                      <div className="text-xs text-gray-400">{ach.description}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-black/40 p-6 rounded-sm border border-gray-700 mb-8 text-left">
                <p className="text-xs text-gray-500 font-mono mb-1 uppercase">Identity Confirmed</p>
                <h3 className="text-3xl font-bold text-white mb-4">{vehicle.name}</h3>

                <div className="grid grid-cols-2 gap-4 text-sm font-mono">
                  <div className="flex justify-between border-b border-gray-800 pb-1">
                    <span className="text-gray-500">NATION</span>
                    <span className="text-wt-orange">{vehicle.nation}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-800 pb-1">
                    <span className="text-gray-500">RANK</span>
                    <span className="text-white">{vehicle.rank}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-800 pb-1">
                    <span className="text-gray-500">BR</span>
                    <span className="text-white">{vehicle.br.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-800 pb-1">
                    <span className="text-gray-500">TYPE</span>
                    <span className="text-white">{vehicle.vehicleType}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-800">
                  {vehicle.description && vehicle.description.startsWith('http') ? (
                    <div className="w-full rounded-sm overflow-hidden border border-gray-700">
                      <img
                        src={vehicle.description}
                        alt={vehicle.name}
                        className="w-full h-auto object-cover max-h-64"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm italic">"{vehicle.description}"</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleReturnToMenu}
                  className="bg-white hover:bg-gray-200 text-black font-bold py-3 px-8 rounded-sm flex items-center justify-center space-x-2 transition-colors"
                >
                  <RefreshCw className="w-5 h-5" aria-hidden="true" />
                  <span>NEXT MISSION</span>
                </button>
                
                <button
                  onClick={handleShare}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-sm flex items-center justify-center space-x-2 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5 text-green-500" aria-hidden="true" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-5 h-5" aria-hidden="true" />
                      <span>Share Result</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="relative z-10 text-center py-6 text-xs text-gray-600 font-mono">
          <p>WT-GUESSER v1.5.1 // UNOFFICIAL WAR THUNDER API</p>
        </footer>

        {/* Service Record Modal */}
        {showServiceRecord && <ServiceRecord onClose={handleCloseServiceRecord} />}

        <style>{`
          @keyframes loading {
            0% { width: 0%; margin-left: 0; }
            50% { width: 100%; margin-left: 0; }
            100% { width: 0%; margin-left: 100%; }
          }
        `}</style>
      </div>
    </ErrorBoundary>
  );
}