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

  // Sync scroll between textarea and highlight layer
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (highlightLayerRef.current) {
      highlightLayerRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  useEffect(() => {
    const checkKey = () => {
      const apiKey = process.env.API_KEY;
      setNeedsKey(!apiKey);
    };
    checkKey();
    
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
      console.error("Check Error:", err);
      if (err.message === 'MISSING_API_KEY' || err.message === 'INVALID_API_KEY') {
        setNeedsKey(true);
        setError({
          type: 'auth',
          message: 'សូមកំណត់ API_KEY ក្នុង Vercel Settings រួច Redeploy ឡើងវិញ។'
        });
      } else {
        setError({
          type: 'general',
          message: 'មានបញ្ហាបច្ចេកទេសក្នុងការទាក់ទងទៅ AI។ សូមព្យាយាមម្តងទៀត។'
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
    // Escaping regex characters for safety
    const escaped = correction.originalText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const newText = inputText.replace(new RegExp(escaped, 'g'), correction.suggestedText);
    setInputText(newText);
    
    if (result) {
      const remaining = result.corrections.filter(c => c.originalText !== correction.originalText);
      setResult({
        ...result,
        corrections: remaining,
        isCorrect: remaining.length === 0
      });
    }
  };

  const renderHighlightedText = () => {
    if (!result || result.corrections.length === 0) return inputText;
    
    let html = inputText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Sort corrections by length descending to prevent overlapping match issues
    const sorted = [...result.corrections].sort((a, b) => b.originalText.length - a.originalText.length);
    
    sorted.forEach(c => {
      const original = c.originalText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      if (original) {
        const regex = new RegExp(original, 'g');
        html = html.replace(regex, `<span class="highlight-error">${original}</span>`);
      }
    });

    return <div dangerouslySetInnerHTML={{ __html: html + '\n' }} />;
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col items-center py-8 px-4 sm:px-6">
      <header className="max-w-5xl w-full text-center mb-10">
        <div className="relative inline-block">
          <div className="khmer-ancient-frame">
            <div className="kbach-corner tl-kbach" />
            <div className="kbach-corner tr-kbach" />
            <div className="kbach-corner bl-kbach" />
            <div className="kbach-corner br-kbach" />
            <div className="kbach-center top-center" />
            <div className="kbach-center bottom-center" />
            <div className="frame-inner-border" />
            <h1 className="text-3xl md:text-5xl font-black text-white niroth-font relative z-10 px-4">
              កម្មវិធីពិនិត្យអក្ខរាវិរុទ្ធ
            </h1>
          </div>
        </div>
        <p className="text-blue-400 mt-6 khmer-font text-lg tracking-wide">
          {"ជំនួយការភាសាខ្មែរឆ្លាតវៃ (AI-Powered)"}
        </p>
      </header>

      <main className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-8 space-y-4">
          {needsKey && (
            <div className="bg-amber-500/10 border border-amber-500/50 p-5 rounded-2xl flex gap-4 items-center animate-pulse">
              <div className="bg-amber-500 p-2 rounded-lg text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <div className="flex-1">
                <p className="text-amber-200 font-bold khmer-font">{"រកមិនឃើញ API_KEY"}</p>
                <p className="text-amber-100/70 text-sm khmer-font">{"សូមចូលទៅកាន់ Vercel Dashboard រួចបន្ថែម Environment Variable ឈ្មោះ API_KEY។"}</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/10 flex flex-col min-h-[550px]">
            <div className="bg-slate-50/80 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
              <div className="flex gap-4 text-xs font-bold uppercase tracking-widest text-slate-500">
                <span>{"តួអក្សរ: "}{inputText.length}</span>
                <span>{"ពាក្យ: "}{inputText.trim() ? inputText.trim().split(/\s+/).length : 0}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setInputText('')} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all" title="Clear">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>

            <div className="editor-container">
              <div ref={highlightLayerRef} className="editor-layer khmer-font custom-scrollbar">{renderHighlightedText()}</div>
              <textarea
                ref={textareaRef}
                className="editor-textarea khmer-font custom-scrollbar"
                placeholder="សូមសរសេរ ឬចម្លងអត្ថបទនៅទីនេះ..."
                value={inputText}
                onScroll={handleScroll}
                onChange={(e) => {
                  setInputText(e.target.value);
                  if (result) setResult(null); // Clear result if user keeps typing
                }}
              />
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 sticky bottom-0 z-30">
               {result && !result.isCorrect && (
                <button onClick={handleApplyAll} className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold transition-all shadow-lg khmer-font">
                  {"កែតម្រូវទាំងអស់"}
                </button>
              )}
              <button 
                onClick={handleCheck}
                disabled={isAnalyzing || !inputText.trim() || needsKey}
                className={`px-10 py-3 rounded-2xl font-bold transition-all shadow-xl flex items-center gap-2 khmer-font ${
                  isAnalyzing || !inputText.trim() || needsKey
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-105'
                }`}
              >
                {isAnalyzing ? (
                  <><span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></span>{"កំពុងពិនិត្យ..."}</>
                ) : 'ពិនិត្យអត្ថបទ'}
              </button>
            </div>
          </div>
        </section>

        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6 min-h-[400px]">
            <h3 className="text-xl font-bold text-slate-800 mb-6 khmer-font flex items-center gap-2">
              <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              {"លទ្ធផល"}
            </h3>
            
            {!result && !isAnalyzing && (
              <div className="text-center py-20">
                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                </div>
                <p className="khmer-font text-slate-400">{"គ្មានទិន្នន័យ"}</p>
              </div>
            )}

            {isAnalyzing && (
              <div className="space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="animate-pulse flex flex-col gap-2">
                    <div className="h-4 bg-slate-100 rounded w-1/3"></div>
                    <div className="h-20 bg-slate-50 rounded-xl"></div>
                  </div>
                ))}
              </div>
            )}

            {result && (
              <div className="space-y-4">
                <div className={`p-4 rounded-2xl border ${result.isCorrect ? 'bg-green-50 border-green-100' : 'bg-indigo-50 border-indigo-100'}`}>
                  <p className="font-bold khmer-font text-slate-800 mb-1">{result.isCorrect ? '✨ ត្រឹមត្រូវល្អ!' : '📝 រកឃើញចំណុចខ្វះខាត'}</p>
                  <p className="text-sm khmer-font text-slate-600 leading-relaxed">{result.summary}</p>
                </div>
                <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                  {result.corrections.map((c, idx) => (
                    <CorrectionCard key={idx} correction={c} onApply={handleApplySingle} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </main>

      <footer className="mt-16 text-center text-slate-500 text-sm khmer-font pb-10">
        <p>{"© "}{new Date().getFullYear()}{" កម្មវិធីពិនិត្យអក្ខរាវិរុទ្ធខ្មែរ"}</p>
      </footer>
    </div>
  );
};

export default App;