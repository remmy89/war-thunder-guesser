import React from 'react';
import { Lock, Unlock, Shield, Map, Crosshair, Target, Eye, Database } from 'lucide-react';

interface HintCardProps {
  label: string;
  value: string | number;
  isRevealed: boolean;
  iconType: 'nation' | 'rank' | 'br' | 'type' | 'gun' | 'desc';
  index: number;
}

const getIcon = (type: string) => {
  switch (type) {
    case 'nation': return <Map className="w-5 h-5" />;
    case 'rank': return <Shield className="w-5 h-5" />;
    case 'br': return <Target className="w-5 h-5" />;
    case 'type': return <Database className="w-5 h-5" />;
    case 'gun': return <Crosshair className="w-5 h-5" />;
    case 'desc': return <Eye className="w-5 h-5" />;
    default: return <Lock className="w-5 h-5" />;
  }
};

export const HintCard: React.FC<HintCardProps> = ({ label, value, isRevealed, iconType, index }) => {
  const isImage = typeof value === 'string' && value.startsWith('http');

  return (
    <div 
      className={`
        relative overflow-hidden border transition-all duration-500 ease-in-out animate-fade-in
        ${isRevealed 
          ? 'bg-wt-panel border-wt-orange shadow-[0_0_10px_rgba(230,163,62,0.2)]' 
          : 'bg-[#202020] border-gray-700 opacity-60 grayscale'}
        p-4 rounded-sm mb-3 group
      `}
      style={{
        animationDelay: `${index * 100}ms`
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 w-full">
          <div className={`
            p-2 rounded-sm shrink-0
            ${isRevealed ? 'bg-wt-orange/20 text-wt-orange' : 'bg-gray-800 text-gray-500'}
          `}>
            {isRevealed ? getIcon(iconType) : <Lock className="w-5 h-5" />}
          </div>
          <div className="w-full">
            <p className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-1">{label}</p>
            <div className="font-bold font-mono text-lg break-words">
              {isRevealed ? (
                isImage ? (
                  <div className="mt-2 relative w-full aspect-video bg-black rounded-sm overflow-hidden border border-gray-600">
                    <img src={value} alt="Visual Intel" className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                  </div>
                ) : (
                  <span className="text-wt-text animate-pulse-once">{value}</span>
                )
              ) : (
                <span className="text-gray-600 tracking-widest">CLASSIFIED</span>
              )}
            </div>
          </div>
        </div>
        
        {!isRevealed && (
          <div className="absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-black/50 to-transparent" />
        )}
      </div>
      
      {/* Decorative tech lines */}
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-wt-orange/50 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-wt-orange/50 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};
