import React from 'react';
import { Award, Target, Snowflake, Medal, Trophy, X, Lock } from 'lucide-react';
import { getAchievements } from '../utils/achievements';

interface ServiceRecordProps {
  onClose: () => void;
}

const iconMap: Record<string, React.ReactNode> = {
  'cross': <Award className="w-8 h-8" />,
  'scope': <Target className="w-8 h-8" />,
  'snowflake': <Snowflake className="w-8 h-8" />,
  'medal': <Medal className="w-8 h-8" />,
  'trophy': <Trophy className="w-8 h-8" />
};

export const ServiceRecord: React.FC<ServiceRecordProps> = ({ onClose }) => {
  const achievements = getAchievements();
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-[#1a1a1a] border border-gray-700 shadow-2xl rounded-sm flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700 bg-[#222]">
          <div className="flex items-center space-x-3">
            <Medal className="w-6 h-6 text-wt-orange" />
            <div>
              <h2 className="text-xl font-black text-white tracking-widest">SERVICE RECORD</h2>
              <p className="text-[10px] font-mono text-gray-500 uppercase">Classified Personnel File</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Stats Summary */}
        <div className="bg-black/50 p-4 border-b border-gray-800 flex justify-between items-center px-8">
           <span className="text-xs font-mono text-gray-500">MEDALS AWARDED</span>
           <span className="text-2xl font-black text-wt-orange font-mono">
             {unlockedCount} <span className="text-gray-600 text-lg">/ {achievements.length}</span>
           </span>
        </div>

        {/* Grid */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((ach) => (
              <div 
                key={ach.id}
                className={`
                  relative border p-4 rounded-sm flex items-start space-x-4 transition-all
                  ${ach.unlocked 
                    ? 'bg-gradient-to-br from-gray-800 to-black border-wt-orange/50 shadow-[0_0_15px_rgba(230,163,62,0.1)]' 
                    : 'bg-[#111] border-gray-800 opacity-60'}
                `}
              >
                <div className={`
                  p-3 rounded-full border shrink-0
                  ${ach.unlocked 
                    ? 'bg-wt-orange/10 border-wt-orange text-wt-orange' 
                    : 'bg-gray-900 border-gray-800 text-gray-700'}
                `}>
                  {ach.unlocked ? iconMap[ach.icon] : <Lock className="w-8 h-8" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className={`font-bold font-mono ${ach.unlocked ? 'text-white' : 'text-gray-500'}`}>
                      {ach.title}
                    </h3>
                    {ach.unlocked && (
                      <span className="text-[10px] font-bold bg-wt-orange text-black px-1.5 rounded-sm">
                        AWARDED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    {ach.description}
                  </p>
                  
                  {/* Progress Bar (if applicable and not fully unlocked) */}
                  {ach.maxProgress && !ach.unlocked && (
                    <div className="mt-3">
                      <div className="flex justify-between text-[10px] font-mono text-gray-500 mb-1">
                        <span>PROGRESS</span>
                        <span>{ach.progress || 0} / {ach.maxProgress}</span>
                      </div>
                      <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-wt-orange transition-all duration-500"
                          style={{ width: `${Math.min(100, ((ach.progress || 0) / ach.maxProgress) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-[#1a1a1a] text-center">
          <p className="text-[10px] text-gray-600 font-mono">
            GAIJIN ENTERTAINMENT ASSETS USED FOR IDENTIFICATION PURPOSES ONLY.
          </p>
        </div>
      </div>
    </div>
  );
};