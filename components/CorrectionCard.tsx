
import React from 'react';
import { Correction } from '../types';

interface CorrectionCardProps {
  correction: Correction;
}

const CorrectionCard: React.FC<CorrectionCardProps> = ({ correction }) => {
  const typeColors = {
    'អក្ខរាវិរុទ្ធ': {
      bg: 'bg-red-50/80',
      border: 'border-red-200',
      text: 'text-red-700',
      badge: 'bg-red-500',
      accent: 'border-red-100'
    },
    'វេយ្យាករណ៍': {
      bg: 'bg-orange-50/80',
      border: 'border-orange-200',
      text: 'text-orange-700',
      badge: 'bg-orange-500',
      accent: 'border-orange-100'
    },
    'កម្រិតភាសា': {
      bg: 'bg-blue-50/80',
      border: 'border-blue-200',
      text: 'text-blue-700',
      badge: 'bg-blue-500',
      accent: 'border-blue-100'
    },
  };

  const style = typeColors[correction.type];

  return (
    <div className={`p-6 mb-4 border-l-4 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${style.bg} ${style.border}`}>
      <div className="flex justify-between items-center mb-4">
        <span className={`text-[10px] font-black uppercase tracking-widest text-white px-3 py-1 rounded-full ${style.badge} shadow-sm`}>
          {correction.type}
        </span>
      </div>
      
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="relative group">
          <span className="line-through text-slate-400 text-xl font-medium px-2 py-1 rounded bg-white/50 border border-slate-100">
            {correction.original}
          </span>
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            ពាក្យសរសេរខុស
          </div>
        </div>
        
        <div className="text-slate-300 animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="m5.25 4.5 7.5 7.5-7.5 7.5m6-15 7.5 7.5-7.5 7.5" />
          </svg>
        </div>

        <div className="relative">
          <span className={`font-black text-2xl px-3 py-1 rounded-xl bg-white shadow-sm border border-white ${style.text}`}>
            {correction.correction}
          </span>
          <div className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${style.badge}`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${style.badge}`}></span>
          </div>
        </div>
      </div>
      
      <div className={`mt-3 p-4 rounded-xl border ${style.accent} bg-white/40`}>
        <div className="flex items-start gap-3">
          <div className={`mt-1 h-1.5 w-1.5 rounded-full shrink-0 ${style.badge}`}></div>
          <p className="text-[15px] leading-relaxed font-medium text-slate-700/90 italic">
            {correction.explanation}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CorrectionCard;
