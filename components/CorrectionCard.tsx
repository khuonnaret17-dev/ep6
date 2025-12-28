import React from 'react';
import { SpellCorrection } from '../types';

interface CorrectionCardProps {
  correction: SpellCorrection;
  onApply: (correction: SpellCorrection) => void;
}

const CorrectionCard: React.FC<CorrectionCardProps> = ({ correction, onApply }) => {
  const typeStyles = {
    spelling: 'bg-rose-100 text-rose-700 border-rose-200',
    grammar: 'bg-amber-100 text-amber-700 border-amber-200',
    style: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  };

  const typeLabels = {
    spelling: 'អក្ខរាវិរុទ្ធ',
    grammar: 'វេយ្យាករណ៍',
    style: 'រចនាបថ',
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group">
      <div className="flex justify-between items-start mb-3">
        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider border ${typeStyles[correction.type]}`}>
          {typeLabels[correction.type] || correction.type}
        </span>
        <button 
          onClick={() => onApply(correction)}
          className="text-indigo-600 hover:text-indigo-800 text-xs font-bold transition-colors khmer-font"
        >
          {"អនុវត្ត"}
        </button>
      </div>
      
      <div className="flex items-center flex-wrap gap-2 mb-3 bg-slate-50 p-2 rounded-xl">
        <span className="line-through text-slate-400 khmer-font text-sm">{correction.originalText}</span>
        <span className="text-slate-300 font-bold">{"→"}</span>
        <span className="text-teal-600 font-black khmer-font text-base">{correction.suggestedText}</span>
      </div>
      
      <p className="text-xs text-slate-500 khmer-font leading-relaxed italic">
        {correction.reason}
      </p>
    </div>
  );
};

export default CorrectionCard;