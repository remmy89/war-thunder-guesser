import React from 'react';
import { GuessFeedback as GuessFeedbackType, FeedbackIndicator } from '../types';

interface GuessFeedbackProps {
  feedback: GuessFeedbackType;
  index: number;
}

const getIndicatorEmoji = (indicator: FeedbackIndicator | boolean): string => {
  if (typeof indicator === 'boolean') {
    return indicator ? '✅' : '❌';
  }
  switch (indicator) {
    case 'correct':
      return '✅';
    case 'higher':
      return '🔼';
    case 'lower':
      return '🔽';
    case 'wrong':
      return '❌';
  }
};

const getIndicatorBg = (indicator: FeedbackIndicator | boolean): string => {
  if (typeof indicator === 'boolean') {
    return indicator ? 'bg-green-900/40' : 'bg-red-900/40';
  }
  switch (indicator) {
    case 'correct':
      return 'bg-green-900/40';
    case 'higher':
      return 'bg-yellow-900/40';
    case 'lower':
      return 'bg-blue-900/40';
    case 'wrong':
      return 'bg-red-900/40';
  }
};

export const GuessFeedback: React.FC<GuessFeedbackProps> = ({ feedback, index }) => {
  return (
    <div className="flex items-center gap-1 text-[10px] font-mono animate-slide-in-left" style={{ animationDelay: `${index * 30}ms` }}>
      <span className="text-gray-500 w-4">#{index + 1}</span>
      <span className="text-gray-400 truncate max-w-[100px]" title={feedback.vehicleName}>{feedback.vehicleName}</span>
      <div className="flex items-center gap-0.5 ml-auto">
        <span className={`px-1.5 py-0.5 rounded ${getIndicatorBg(feedback.nation.correct)}`} title={`Nation: ${feedback.nation.guessed}`}>
          {getIndicatorEmoji(feedback.nation.correct)}
        </span>
        <span className={`px-1.5 py-0.5 rounded ${getIndicatorBg(feedback.rank.indicator)}`} title={`Rank: ${feedback.rank.guessed}`}>
          {getIndicatorEmoji(feedback.rank.indicator)}
        </span>
        <span className={`px-1.5 py-0.5 rounded ${getIndicatorBg(feedback.br.indicator)}`} title={`BR: ${feedback.br.guessed.toFixed(1)}`}>
          {getIndicatorEmoji(feedback.br.indicator)}
        </span>
        <span className={`px-1.5 py-0.5 rounded ${getIndicatorBg(feedback.vehicleType.correct)}`} title={`Type: ${feedback.vehicleType.guessed}`}>
          {getIndicatorEmoji(feedback.vehicleType.correct)}
        </span>
      </div>
    </div>
  );
};
