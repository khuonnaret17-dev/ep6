
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { analyzeKhmerText } from './services/geminiService';
import { AnalysisResult, HistoryItem, SpellCorrection } from './types';
import CorrectionCard from './components/CorrectionCard';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [needsKey, setNeedsKey] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightLayerRef = useRef<HTMLDivElement>(null);

  // Check if API key is already selected (for environments like Vercel)
  useEffect(() => {
    const checkKey = async () => {
      if (typeof window !== 'undefined' && (window as any).aistudio) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (!hasKey && !process.env.API_KEY) {
          setNeedsKey(true);
        }
      }
    };
    checkKey();
  }, []);

  const handleOpenKey = async () => {
    if (typeof window !== 'undefined' && (window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      setNeedsKey(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (highlightLayerRef.current) {
      highlightLayerRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  useEffect(() => {
    const savedHistory = localStorage.getItem('khmer_spellcheck_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
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
      if (err.message?.includes('Requested entity was not found') || !process.env.API_KEY) {
        setNeedsKey(true);
        setError('សូមភ្ជាប់គណនី AI របស់អ្នកជាមុនសិន។');
      } else {
        setError('មានបញ្ហាក្នុងការភ្ជាប់ទៅកាន់ AI។ សូមព្យាយាមម្តងទៀត។');
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
    const newText = inputText.replace(correction.originalText, correction.suggestedText);
    setInputText(newText);
    if (result) {
      const newCorrections = result.corrections.filter(c => c !== correction);
      setResult({
        ...result,
        corrections: newCorrections,
        isCorrect: newCorrections.length === 0
      });
    }
  };

  const clearAll = () => {
    setInputText('');
    setResult(null);
    setError(null);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inputText);
    alert('ចម្លងបានជោគជ័យ!');
  };

  const renderHighlightedText = () => {
    if (!result || result.corrections.length === 0) return inputText;
    const escapedText = inputText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    let finalHtml = escapedText;
    const sortedCorrections = [...result.corrections].sort((a, b) => b.originalText.length - a.originalText.length);
    sortedCorrections.forEach(correction => {
      if (correction.originalText.trim()) {
        const regex = new RegExp(correction.originalText, 'g');
        finalHtml = finalHtml.replace(regex, `<span class="highlight-error">${correction.originalText}</span>`);
      }
    });
    return <div dangerouslySetInnerHTML={{ __html: finalHtml + '\n' }} />;
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col items-center py-8 px-4 sm:px-6">
      <header className="max-w-5xl w-full text-center mb-12">
        <div className="relative inline-block">
          <div className="khmer-ancient-frame">
            <div className="kbach-corner tl-kbach"></div>
            <div className="kbach-corner tr-kbach"></div>
            <div className="kbach-corner bl-kbach"></div>
            <div className="kbach-corner br-kbach"></div>
            <div className="kbach-center top-center"></div>
            <div className="kbach-center bottom-center"></div>
            <div className="frame-inner-border"></div>
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
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-white/10 flex flex-col min-h-[500px]">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex justify-between items-center">
              <div className="flex gap-6 text-sm bokor-font text-blue-600 font-bold">
                <span>តួអក្សរ: {inputText.length}</span>
                <span>ពាក្យ: {inputText.trim() ? inputText.trim().split(/\s+/).length : 0}</span>
              </div>
              <div className="flex gap-2">
                {needsKey && (
                  <button onClick={handleOpenKey} className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold khmer-font hover:bg-amber-200 transition-all border border-amber-200">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                    ភ្ជាប់ AI
                  </button>
                )}
                <button onClick={clearAll} className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-600" title="លុបទាំងអស់">
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
                  កែតម្រូវទាំងអស់ (Apply All)
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
                {isAnalyzing ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    កំពុងពិនិត្យ...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    ពិនិត្យអត្ថបទ
                  </>
                )}
              </button>
            </div>
          </div>
          {error && <div className="p-4 bg-red-500/10 backdrop-blur-md border border-red-500/50 text-red-400 rounded-xl khmer-font">{error}</div>}
        </section>

        <aside className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/10 p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4 khmer-font flex items-center gap-2">
              <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              លទ្ធផលនៃការពិនិត្យ
            </h3>
            {!result && !isAnalyzing && (
              <div className="text-center py-12 text-slate-400">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <p className="khmer-font text-slate-500">សូមបញ្ចូលអត្ថបទរបស់អ្នក ដើម្បីចាប់ផ្តើមការវិភាគ</p>
              </div>
            )}
            {isAnalyzing && <div className="space-y-4"><div className="h-4 bg-slate-200/50 animate-pulse rounded w-3/4"></div><div className="h-4 bg-slate-200/50 animate-pulse rounded w-full"></div><div className="h-4 bg-slate-200/50 animate-pulse rounded w-5/6"></div></div>}
            {result && (
              <div className="space-y-4">
                <div className={`p-4 rounded-xl mb-4 border ${result.isCorrect ? 'bg-green-50 border-green-200' : 'bg-indigo-50 border-indigo-100'}`}>
                  <p className={`font-bold khmer-font mb-1 ${result.isCorrect ? 'text-green-700' : 'text-indigo-800'}`}>{result.isCorrect ? '✨ អត្ថបទរបស់អ្នកត្រឹមត្រូវ!' : '📝 រកឃើញចំណុចគួរកែលម្អ'}</p>
                  <p className="text-sm text-slate-600 khmer-font leading-relaxed">{result.summary}</p>
                </div>
                <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                  {result.corrections.map((c, i) => <CorrectionCard key={i} correction={c} onApply={handleApplySingle} />)}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/10 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 khmer-font">ប្រវត្តិថ្មីៗ</h3>
            {history.length > 0 ? (
              <div className="space-y-4 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
                {history.map((item) => (
                  <div key={item.id} onClick={() => { setInputText(item.text); setResult(item.result); }} className="p-3 bg-slate-50/80 rounded-lg hover:bg-white cursor-pointer transition-all border border-transparent hover:border-slate-200 shadow-sm">
                    <p className="text-sm khmer-font line-clamp-2 text-slate-600 mb-1">{item.text}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{new Date(item.timestamp).toLocaleString('km-KH')}</p>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-slate-400 khmer-font text-center">មិនទាន់មានប្រវត្តិប្រើប្រាស់ទេ។</p>}
          </div>
        </aside>
      </main>

      <footer className="mt-12 flex flex-col items-center gap-4 text-slate-400 text-sm khmer-font text-center pb-12">
        <a href="https://t.me/Naret26" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-[#229ED9]/10 hover:bg-[#229ED9]/20 text-[#229ED9] px-6 py-2 rounded-full border border-[#229ED9]/30 transition-all hover:scale-105 active:scale-95 group shadow-lg">
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12.023 12.023 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.303.48-.429-.012-1.253-.245-1.865-.444-.754-.245-1.352-.375-1.3-.791.027-.217.323-.44.89-.669 3.488-1.518 5.815-2.52 6.983-3.006 3.318-1.385 4.007-1.626 4.455-1.634z"/></svg>
          <span className="font-bold">ឆាណែលតេឡេក្រាម (Join Telegram)</span>
        </a>
        <p>&copy; {new Date().getFullYear()} កម្មវិធីពិនិត្យអក្ខរាវិរុទ្ធ - បង្កើតឡើងដោយការយកចិត្តទុកដាក់សម្រាប់ភាសាខ្មែរ</p>
      </footer>
    </div>
  );
};

export default App;
