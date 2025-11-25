import React, { useEffect, useState, useRef } from 'react';
import { Lock, Unlock, Shield, Map, Crosshair, Target, Eye, Database, Sparkles } from 'lucide-react';

interface HintCardProps {
  label: string;
  value: string | number;
  isRevealed: boolean;
  iconType: 'nation' | 'rank' | 'br' | 'type' | 'gun' | 'desc';
  index: number;
  compact?: boolean;
}

const getIcon = (type: string, size: string = "w-5 h-5") => {
  switch (type) {
    case 'nation': return <Map className={size} />;
    case 'rank': return <Shield className={size} />;
    case 'br': return <Target className={size} />;
    case 'type': return <Database className={size} />;
    case 'gun': return <Crosshair className={size} />;
    case 'desc': return <Eye className={size} />;
    default: return <Lock className={size} />;
  }
};

export const HintCard: React.FC<HintCardProps> = ({ label, value, isRevealed, iconType, index, compact = false }) => {
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

  // Compact mode for horizontal layout
  if (compact) {
    return (
      <div 
        className={`
          relative overflow-hidden border transition-all duration-300
          ${justRevealed ? 'animate-hint-reveal' : ''}
          ${isRevealed 
            ? 'bg-wt-panel border-wt-orange/50' 
            : 'bg-[#151515] border-gray-800 opacity-50'}
          px-2 py-1.5 rounded-sm
        `}
        role="listitem"
        aria-label={`${label}: ${isRevealed ? value : 'Classified'}`}
      >
        <div className="flex items-center gap-1.5">
          <div className={`shrink-0 ${isRevealed ? 'text-wt-orange' : 'text-gray-600'}`}>
            {isRevealed ? getIcon(iconType, "w-3 h-3") : <Lock className="w-3 h-3" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-mono text-gray-500 uppercase">{label}</p>
            <p className={`font-mono text-xs font-bold truncate ${isRevealed ? 'text-wt-text' : 'text-gray-700'}`}>
              {isRevealed ? value : '???'}
            </p>
          </div>
        </div>
      </div>
    );
  }

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
