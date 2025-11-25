import React, { useEffect, useState, useRef } from 'react';
import { Lock, Unlock, Shield, Map, Crosshair, Target, Eye, Database, Sparkles } from 'lucide-react';

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
  const [justRevealed, setJustRevealed] = useState(false);
  const prevRevealedRef = useRef(isRevealed);

  // Track when a card transitions from hidden to revealed
  useEffect(() => {
    if (isRevealed && !prevRevealedRef.current) {
      setJustRevealed(true);
      const timer = setTimeout(() => setJustRevealed(false), 600);
      return () => clearTimeout(timer);
    }
    prevRevealedRef.current = isRevealed;
  }, [isRevealed]);

  return (
    <div 
      className={`
        relative overflow-hidden border transition-all duration-500 ease-in-out
        ${justRevealed ? 'animate-hint-reveal' : 'animate-fade-in'}
        ${isRevealed 
          ? 'bg-wt-panel border-wt-orange shadow-[0_0_10px_rgba(230,163,62,0.2)]' 
          : 'bg-[#202020] border-gray-700 opacity-60 grayscale hover:opacity-80 hover:border-gray-600'}
        p-4 rounded-sm mb-3 group cursor-default
      `}
      style={{
        animationDelay: justRevealed ? '0ms' : `${index * 100}ms`
      }}
      role="listitem"
      aria-label={`${label}: ${isRevealed ? value : 'Classified'}`}
    >
      {/* Just revealed sparkle effect */}
      {justRevealed && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <Sparkles className="absolute top-2 right-2 w-4 h-4 text-wt-orange animate-pulse" />
          <div className="absolute inset-0 bg-wt-orange/10 animate-pulse" />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 w-full">
          <div className={`
            p-2 rounded-sm shrink-0 transition-all duration-300
            ${isRevealed ? 'bg-wt-orange/20 text-wt-orange' : 'bg-gray-800 text-gray-500'}
            ${justRevealed ? 'scale-110' : 'scale-100'}
          `}>
            {isRevealed ? getIcon(iconType) : <Lock className="w-5 h-5" />}
          </div>
          <div className="w-full">
            <p className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-2">
              {label}
              {!isRevealed && (
                <span className="text-[10px] text-gray-600 normal-case">(Reveal with wrong guess or skip)</span>
              )}
            </p>
            <div className="font-bold font-mono text-lg break-words">
              {isRevealed ? (
                isImage ? (
                  <div className="mt-2 relative w-full aspect-video bg-black rounded-sm overflow-hidden border border-gray-600">
                    <img src={value} alt="Visual Intel" className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                  </div>
                ) : (
                  <span className={`text-wt-text ${justRevealed ? 'animate-pulse' : ''}`}>{value}</span>
                )
              ) : (
                <span className="text-gray-600 tracking-widest select-none">CLASSIFIED</span>
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
      
      {/* Progress indicator for locked hints */}
      {!isRevealed && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
          <span className="text-[9px] font-mono text-gray-600">HINT #{index + 1}</span>
        </div>
      )}
    </div>
  );
};
