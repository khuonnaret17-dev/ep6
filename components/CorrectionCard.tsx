
import React from 'react';
import { SpellCorrection } from '../types';

interface CorrectionCardProps {
  correction: SpellCorrection;
  onApply: (correction: SpellCorrection) => void;
}

const CorrectionCard: React.FC<CorrectionCardProps> = ({ correction, onApply }) => {
  const typeColors = {
    spelling: 'bg-red-100 text-red-700 border-red-200',
    grammar: 'bg-amber-100 text-amber-700 border-amber-200',
    style: 'bg-blue-100 text-blue-700 border-blue-200',
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all mb-3">
      <div className="flex justify-between items-start mb-2">
        <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider ${typeColors[correction.type]}`}>
          {correction.type}
        </span>
        <button 
          onClick={() => onApply(correction)}
          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors"
        >
          អនុវត្ត (Apply)
        </button>
      </div>
      
      <div className="flex items-center gap-2 mb-2">
        <span className="line-through text-slate-400 khmer-font">{correction.originalText}</span>
        <span className="text-slate-300">→</span>
        <span className="text-green-600 font-bold khmer-font">{correction.suggestedText}</span>
      </div>
      
      <p className="text-sm text-slate-600 khmer-font leading-relaxed">
        {correction.reason}
      </p>
    </div>
  );
};

export default CorrectionCard;
