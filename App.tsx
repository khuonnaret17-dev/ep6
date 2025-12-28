import React, { useState, useCallback, useEffect, useRef } from 'react';
import { analyzeKhmerText } from './services/geminiService';
import { AnalysisResult, HistoryItem, SpellCorrection } from './types';
import CorrectionCard from './components/CorrectionCard';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<{ message: string; type: 'auth' | 'general' } | null>(null);
  const [needsKey, setNeedsKey] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightLayerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkKeyStatus = async () => {
      const globalKey = process.env.API_KEY;
      if (!globalKey) {
        if (typeof window !== 'undefined' && (window as any).aistudio) {
          try {
            const hasStudioKey = await (window as any).aistudio.hasSelectedApiKey();
            setNeedsKey(!hasStudioKey);
          } catch (e) {
            setNeedsKey(true);
          }
        } else {
          setNeedsKey(true);
        }
      }
    };
    checkKeyStatus();
  }, []);

  const handleOpenKey = async () => {
    if (typeof window !== 'undefined' && (window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      setNeedsKey(false);
      setError(null);
    } else {
      setError({
        type: 'auth',
        message: 'សូមបញ្ចូល API_KEY ក្នុង Vercel Environment Variables ដើម្បីឱ្យកម្មវិធីដំណើរការបាន។'
      });
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (highlightLayerRef.current) {
      highlightLayerRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  useEffect(() => {
    const savedHistory = localStorage.getItem('khmer_spellcheck_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  const saveToHistory = useCallback((text: string, analysis: AnalysisResult) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      text,
      result: analysis
    };
    const updatedHistory = [newItem, ...history].slice(0, 10);
    setHistory(updatedHistory);
    localStorage.setItem('khmer_spellcheck_history', JSON.stringify(updatedHistory));
  }, [history]);

  const handleCheck = async () => {
    if (!inputText.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    try {
      const data = await analyzeKhmerText(inputText);
      setResult(data);
      saveToHistory(inputText, data);
    } catch (err: any) {
      console.error("Analysis error:", err);
      if (err.message === 'MISSING_API_KEY' || err.message === 'INVALID_API_KEY') {
        setNeedsKey(true);
        setError({
          type: 'auth',
          message: 'បញ្ហាតភ្ជាប់៖ API Key មិនត្រឹមត្រូវ ឬមិនទាន់បានកំណត់។ សូមពិនិត្យមើល settings ក្នុង Vercel Dashboard។'
        });
      } else {
        setError({
          type: 'general',
          message: 'មានបញ្ហាបច្ចេកទេសមួយចំនួន។ សូមព្យាយាមម្តងទៀតនៅពេលក្រោយ។'
        });
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyAll = () => {
    if (result) {
      setInputText(result.improvedText);
      setResult(null);
    }
  };

  const handleApplySingle = (correction: SpellCorrection) => {
    const escapedOriginal = correction.originalText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const newText = inputText.replace(new RegExp(escapedOriginal, 'g'), correction.suggestedText);
    setInputText(newText);
    if (result) {
      const newCorrections = result.corrections.filter(c => c.originalText !== correction.originalText);
      setResult({ ...result, corrections: newCorrections, isCorrect: newCorrections.length === 0 });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inputText);
    alert('ចម្លងបានជោគជ័យ!');
  };

  const renderHighlightedText = () => {
    if (!result || result.corrections.length === 0) return inputText;
    let finalHtml = inputText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const sortedCorrections = [...result.corrections].sort((a, b) => b.originalText.length - a.originalText.length);
    sortedCorrections.forEach(correction => {
      if (correction.originalText.trim()) {
        const escaped = correction.originalText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const parts = finalHtml.split(escaped);
        finalHtml = parts.join(`<span class="highlight-error">${escaped}</span>`);
      }
    });
    return <div dangerouslySetInnerHTML={{ __html: finalHtml + '\n' }} />;
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col items-center py-8 px-4 sm:px-6">
      <header className="max-w-5xl w-full text-center mb-12">
        <div className="relative inline-block">
          <div className="khmer-ancient-frame">
            <div className="kbach-corner tl-kbach" />
            <div className="kbach-corner tr-kbach" />
            <div className="kbach-corner bl-kbach" />
            <div className="kbach-corner br-kbach" />
            <div className="kbach-center top-center" />
            <div className="kbach-center bottom-center" />
            <div className="frame-inner-border" />
            <h1 className="text-4xl md:text-6xl font-black text-white niroth-font relative z-10 px-4">
              កម្មវិធីពិនិត្យអក្ខរាវិរុទ្ធ
            </h1>
          </div>
        </div>
        <h2 className="text-blue-400 max-w-2xl mx-auto niroth-font text-xl tracking-widest mt-6 uppercase shadow-sm">
          ជំនួយការសម្រាប់កិច្ចការរដ្ឋបាល
        </h2>
      </header>

      <main className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-8 flex flex-col gap-4">
          {(error?.type === 'auth' || needsKey) && (
            <div className="bg-amber-500/20 backdrop-blur-md border border-amber-500/50 p-6 rounded-2xl mb-4 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="bg-amber-500 p-2 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-amber-200 font-bold khmer-font mb-2 text-lg">រកមិនឃើញ API Key</h4>
                  <p className="text-amber-100/80 text-sm khmer-font leading-relaxed mb-4">
                    {"កម្មវិធីនេះត្រូវការ API Key ដើម្បីដំណើរការ។ ប្រសិនបើអ្នកកំពុងប្រើលើ Vercel សូមចូលទៅកាន់ Dashboard → Settings → Environment Variables រួចបន្ថែម Key ឈ្មោះ"} <span className="font-mono bg-black/30 px-2 py-0.5 rounded text-white">API_KEY</span> {"។"}
                  </p>
                  <button onClick={handleOpenKey} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold khmer-font transition-all shadow-lg">
                    ព្យាយាមភ្ជាប់ម្តងទៀត (Connect AI)
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-white/10 flex flex-col min-h-[500px] relative">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex justify-between items-center">
              <div className="flex gap-6 text-sm bokor-font text-blue-600 font-bold">
                <span>តួអក្សរ: {inputText.length}</span>
                <span>ពាក្យ: {inputText.trim() ? inputText.trim().split(/\s+/).length : 0}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setInputText('')} className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-600" title="លុបទាំងអស់">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
                <button onClick={copyToClipboard} className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-600" title="ចម្លង">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                </button>
              </div>
            </div>

            <div className="editor-container">
              <div ref={highlightLayerRef} className="editor-layer khmer-font custom-scrollbar">{renderHighlightedText()}</div>
              <textarea
                ref={textareaRef}
                className="editor-textarea khmer-font custom-scrollbar"
                placeholder="សរសេរ ឬចម្លងអត្ថបទរបស់អ្នកមកទីនេះ..."
                value={inputText}
                onScroll={handleScroll}
                onChange={(e) => {
                  setInputText(e.target.value);
                  if (result && Math.abs(e.target.value.length - inputText.length) > 5) setResult(null);
                }}
              />
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 sticky bottom-0 z-20">
               {result && !result.isCorrect && (
                <button onClick={handleApplyAll} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg khmer-font">
                  កែតម្រូវទាំងអស់
                </button>
              )}
              <button 
                onClick={handleCheck}
                disabled={isAnalyzing || !inputText.trim()}
                className={`px-8 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 khmer-font ${
                  isAnalyzing || !inputText.trim()
                  ? 'bg-slate-300 cursor-not-allowed text-slate-500' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-105 active:scale-95'
                }`}
              >
                {isAnalyzing ? 'កំពុងពិនិត្យ...' : 'ពិនិត្យអត្ថបទ'}
              </button>
            </div>
          </div>
          {error?.type === 'general' && <div className="p-4 bg-red-500/10 backdrop-blur-md border border-red-500/50 text-red-400 rounded-xl khmer-font">{error.message}</div>}
        </section>

        <aside className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/10 p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4 khmer-font">លទ្ធផលនៃការពិនិត្យ</h3>
            {!result && !isAnalyzing && (
              <div className="text-center py-12 text-slate-400">
                <p className="khmer-font text-slate-500">សូមបញ្ចូលអត្ថបទរបស់អ្នក ដើម្បីចាប់ផ្តើម</p>
              </div>
            )}
            {isAnalyzing && <div className="space-y-4 animate-pulse"><div className="h-4 bg-slate-200 rounded w-3/4"></div><div className="h-4 bg-slate-200 rounded w-full"></div></div>}
            {result && (
              <div className="space-y-4">
                <div className={`p-4 rounded-xl border ${result.isCorrect ? 'bg-green-50 border-green-200 text-green-800' : 'bg-indigo-50 border-indigo-100 text-indigo-800'}`}>
                  <p className="font-bold khmer-font mb-1">{result.isCorrect ? '✨ ត្រឹមត្រូវល្អ!' : '📝 ចំណុចគួរកែលម្អ'}</p>
                  <p className="text-sm khmer-font">{result.summary}</p>
                </div>
                <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                  {result.corrections.map((c, i) => <CorrectionCard key={i} correction={c} onApply={handleApplySingle} />)}
                </div>
              </div>
            )}
          </div>
        </aside>
      </main>

      <footer className="mt-12 flex flex-col items-center gap-4 text-slate-400 text-sm khmer-font text-center pb-12">
        <a href="https://t.me/Naret26" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-[#229ED9]/10 hover:bg-[#229ED9]/20 text-[#229ED9] px-6 py-2 rounded-full border border-[#229ED9]/30 transition-all shadow-lg">
          <span className="font-bold">Join Telegram</span>
        </a>
        <p>&copy; {new Date().getFullYear()} កម្មវិធីពិនិត្យអក្ខរាវិរុទ្ធ - បង្កើតឡើងដោយក្តីស្រឡាញ់សម្រាប់ភាសាខ្មែរ</p>
      </footer>
    </div>
  );
};

export default App;