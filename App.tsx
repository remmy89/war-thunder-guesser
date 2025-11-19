
import React, { useState } from 'react';
import { GameState, VehicleData, Difficulty, VehicleSummary } from './types';
import { fetchMysteryVehicle } from './services/apiService';
import { Game } from './components/Game';
import { Radar, Trophy, AlertOctagon, Loader2, Play, ShieldAlert, RefreshCw, Crosshair, Skull, Calendar } from 'lucide-react';
import { initAudio, playSound } from './utils/audio';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.HARD);
  const [pool, setPool] = useState<VehicleSummary[]>([]);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  const startGame = async (selectedDifficulty: Difficulty, seed?: string) => {
    initAudio();
    playSound('start');
    setDifficulty(selectedDifficulty);
    setGameState(GameState.LOADING);
    setLoadingError(null);
    try {
      const { vehicle, pool } = await fetchMysteryVehicle(selectedDifficulty, seed);
      setVehicle(vehicle);
      setPool(pool);
      setGameState(GameState.PLAYING);
    } catch (error) {
      console.error(error);
      setLoadingError("Failed to establish connection to HQ (API Error). Please retry.");
      setGameState(GameState.MENU);
    }
  };

  const handleGameOver = (won: boolean) => {
    setGameState(won ? GameState.VICTORY : GameState.GAME_OVER);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-gray-100 font-sans selection:bg-wt-orange selection:text-black overflow-x-hidden relative">
      {/* Decorative Background Elements - Fixed container prevents scrollbar jitter */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-camo-pattern opacity-5"></div>
        <div className="scanline"></div>
      </div>
      
      {/* Header */}
      <header className="relative z-10 border-b border-gray-800 bg-[#1a1a1a]/90 backdrop-blur-sm sticky top-0">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-wt-orange p-1.5 rounded-sm">
              <Radar className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-white leading-none">WT<span className="text-wt-orange">GUESSER</span></h1>
              <p className="text-[0.6rem] font-mono text-gray-500 tracking-[0.2em]">ARMORED VEHICLE IDENTIFICATION</p>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="flex items-center space-x-1 text-xs font-mono text-gray-500">
               <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
               <span>SYSTEM ONLINE</span>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 py-8 flex flex-col items-center min-h-[80vh] justify-center">
        
        {gameState === GameState.MENU && (
          <div className="text-center max-w-lg w-full animate-in fade-in zoom-in duration-500">
            <div className="mb-8 relative inline-block">
              <ShieldAlert className="w-24 h-24 text-gray-700 mx-auto" />
              <ShieldAlert className="w-24 h-24 text-wt-orange absolute top-0 left-0 animate-pulse opacity-50 blur-lg" />
            </div>
            <h2 className="text-4xl font-black mb-4 tracking-tight">MISSION BRIEFING</h2>
            <p className="text-gray-400 mb-8 font-mono leading-relaxed">
              Intelligence has intercepted data on an unknown enemy vehicle. 
              Identify the target using progressive hints. 
              <br/><br/>
              <span className="text-wt-orange">Failure allows the enemy to advance.</span>
            </p>
            
            {loadingError && (
              <div className="mb-6 p-4 bg-red-900/20 border border-red-800 text-red-400 text-sm font-mono rounded-sm">
                {loadingError}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => startGame(Difficulty.EASY)}
                className="group relative flex items-center justify-center px-6 py-4 font-bold text-white transition-all duration-200 bg-gray-800 border border-gray-700 hover:border-green-500 hover:bg-gray-750 rounded-sm w-full sm:w-auto"
              >
                <div className="flex flex-col items-center">
                  <div className="flex items-center mb-1">
                    <Crosshair className="w-4 h-4 mr-2 text-green-500" />
                    <span className="text-lg tracking-wider">EASY</span>
                  </div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono group-hover:text-gray-400">Assisted Mode</span>
                </div>
              </button>

              <button 
                onClick={() => startGame(Difficulty.HARD)}
                className="group relative flex items-center justify-center px-6 py-4 font-bold text-black transition-all duration-200 bg-wt-orange hover:bg-white rounded-sm w-full sm:w-auto"
              >
                <div className="flex flex-col items-center">
                  <div className="flex items-center mb-1">
                    <Skull className="w-4 h-4 mr-2" />
                    <span className="text-lg tracking-wider">HARD</span>
                  </div>
                  <span className="text-[10px] text-black/60 uppercase tracking-widest font-mono">Manual Entry</span>
                </div>
              </button>

              <button 
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  startGame(Difficulty.HARD, today);
                }}
                className="group relative flex items-center justify-center px-6 py-4 font-bold text-white transition-all duration-200 bg-blue-600 hover:bg-blue-500 border border-blue-400 rounded-sm w-full sm:w-auto"
              >
                <div className="flex flex-col items-center">
                  <div className="flex items-center mb-1">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="text-lg tracking-wider">DAILY</span>
                  </div>
                  <span className="text-[10px] text-blue-200 uppercase tracking-widest font-mono">Global Target</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {gameState === GameState.LOADING && (
          <div className="flex flex-col items-center justify-center py-10 w-full max-w-md animate-in fade-in duration-500">
             {/* Radar Animation */}
             <div className="relative w-32 h-32 mb-8">
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
             
             {/* Simulated System Checks */}
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
          <div className="w-full max-w-2xl bg-[#1a1a1a] border border-gray-700 p-8 rounded-sm shadow-2xl text-center animate-in slide-in-from-bottom-10 duration-500">
            <div className="mb-6">
              {gameState === GameState.VICTORY ? (
                <div className="inline-block p-4 rounded-full bg-green-500/20 mb-4">
                  <Trophy className="w-16 h-16 text-green-500" />
                </div>
              ) : (
                <div className="inline-block p-4 rounded-full bg-red-500/20 mb-4">
                  <AlertOctagon className="w-16 h-16 text-red-500" />
                </div>
              )}
              
              <h2 className={`text-4xl font-black mb-2 ${gameState === GameState.VICTORY ? 'text-green-500' : 'text-red-500'}`}>
                {gameState === GameState.VICTORY ? 'TARGET IDENTIFIED' : 'MISSION FAILED'}
              </h2>
              <p className="text-gray-400 font-mono uppercase tracking-widest">
                {gameState === GameState.VICTORY ? 'Superior Intel confirmed.' : 'Vehicle escaped identification.'}
              </p>
            </div>

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
                      />
                   </div>
                 ) : (
                   <p className="text-gray-400 text-sm italic">"{vehicle.description}"</p>
                 )}
              </div>
            </div>

            <button 
              onClick={() => {
                playSound('click');
                setGameState(GameState.MENU); // Go back to menu to choose difficulty again
              }}
              className="bg-white hover:bg-gray-200 text-black font-bold py-3 px-8 rounded-sm flex items-center justify-center mx-auto space-x-2 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              <span>NEXT MISSION</span>
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 text-xs text-gray-600 font-mono">
        <p>WT-GUESSER v1.0.0 // UNOFFICIAL WAR THUNDER API</p>
      </footer>

      <style>{`
        @keyframes loading {
          0% { width: 0%; margin-left: 0; }
          50% { width: 100%; margin-left: 0; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </div>
  );
}
