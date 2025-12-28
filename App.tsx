
import React, { useState, useEffect } from 'react';
import { analyzeKhmerText } from './services/geminiService';
import { AnalysisResult, AnalysisStatus } from './types';
import CorrectionCard from './components/CorrectionCard';

const BACKGROUNDS = [
  { id: 'dots', name: 'គ្រាប់ចុចតូចៗ', class: 'bg-pattern-dots' },
  { id: 'khmer', name: 'ក្រដាសបុរាណ', class: 'bg-pattern-khmer' },
  { id: 'silk', name: 'សូត្រមាស', class: 'bg-pattern-silk' },
  { id: 'gradient', name: 'ពណ៌ចម្រុះ', class: 'bg-pattern-gradient' },
];

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [selectedBg, setSelectedBg] = useState('dots');
  const [showBgLibrary, setShowBgLibrary] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('selected-bg');
    if (saved) setSelectedBg(saved);
  }, []);

  const changeBg = (id: string) => {
    setSelectedBg(id);
    localStorage.setItem('selected-bg', id);
  };

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;

    setStatus(AnalysisStatus.LOADING);
    setError(null);
    try {
      const data = await analyzeKhmerText(inputText);
      setResult(data);
      setStatus(AnalysisStatus.SUCCESS);
    } catch (err) {
      console.error(err);
      setError('មានបញ្ហាក្នុងការភ្ជាប់ទៅកាន់ប្រព័ន្ធ។ សូមព្យាយាមម្ដងទៀត។');
      setStatus(AnalysisStatus.ERROR);
    }
  };

  const clearInput = () => {
    setInputText('');
    setResult(null);
    setStatus(AnalysisStatus.IDLE);
    setError(null);
  };

  const activeBgClass = BACKGROUNDS.find(b => b.id === selectedBg)?.class || 'bg-pattern-dots';

  return (
    <div className={`min-h-screen flex flex-col transition-all duration-700 ${activeBgClass}`}>
      {/* Header */}
      <header className="bg-indigo-900/95 backdrop-blur-md text-white shadow-xl py-8 px-4 sticky top-0 z-40 border-b border-indigo-500/20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <h1 className="khmer-title text-3xl md:text-5xl text-amber-400 mb-2 drop-shadow-md">
              កម្មវិធីពិនិត្យអក្ខរាវិរុទ្ធ
            </h1>
            <p className="text-indigo-100 opacity-90 text-lg">
              ត្រួតពិនិត្យអក្ខរាវិរុទ្ធ វេយ្យាករណ៍ និងរចនាបថសំណេរខ្មែរ
            </p>
          </div>
          <div className="flex gap-4">
            <div className="bg-indigo-800/60 backdrop-blur px-4 py-2 rounded-xl border border-indigo-400/30 shadow-inner hidden sm:block">
              <span className="block text-xs uppercase opacity-70 font-bold tracking-widest mb-1">ស្ដង់ដារ</span>
              <span className="font-semibold text-amber-100">វចនានុក្រម ជួន ណាត</span>
            </div>
            <button 
              onClick={() => setShowBgLibrary(!showBgLibrary)}
              className="bg-white/10 hover:bg-white/20 p-3 rounded-full border border-white/20 transition-all active:scale-90"
              title="បណ្ណាល័យផ្ទៃខាងក្រោយ"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122l9.37-9.37a2.85 2.85 0 114.03 4.03l-9.37 9.37a2.85 2.85 0 11-4.03-4.03z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122l-3.91 3.91a2.85 2.85 0 11-4.03-4.03l3.91-3.91m4.03 4.03l-1.06 1.06" />
              </svg>
            </button>
          </div>
        </div>

        {/* Background Library Overlay */}
        {showBgLibrary && (
          <div className="absolute top-full right-4 mt-2 bg-white text-slate-800 p-4 rounded-2xl shadow-2xl border border-slate-200 z-50 animate-in fade-in slide-in-from-top-4 duration-300 w-64">
            <h4 className="font-bold text-sm uppercase text-slate-400 mb-3 px-2">បណ្ណាល័យផ្ទៃខាងក្រោយ</h4>
            <div className="grid grid-cols-1 gap-2">
              {BACKGROUNDS.map(bg => (
                <button
                  key={bg.id}
                  onClick={() => changeBg(bg.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all border ${
                    selectedBg === bg.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full border border-slate-200 shadow-sm ${bg.class}`}></div>
                  <span className="text-sm font-medium">{bg.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <section className="flex flex-col gap-4">
          <div className="glass-panel rounded-3xl shadow-xl overflow-hidden flex flex-col h-[550px] transition-all duration-300 hover:shadow-2xl border border-white/40">
            <div className="bg-slate-50/50 backdrop-blur-sm px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <span className="text-sm font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                  <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                </svg>
                បញ្ចូលអត្ថបទខ្មែរ
              </span>
              <button 
                onClick={clearInput}
                className="text-xs bg-slate-200/50 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-full font-bold transition-all"
              >
                សម្អាតទាំងអស់
              </button>
            </div>
            <textarea
              className="flex-1 p-8 outline-none text-xl resize-none leading-relaxed text-slate-800 bg-transparent placeholder:text-slate-400"
              placeholder="សូមសរសេរ ឬចម្លងអត្ថបទខ្មែរមកទីនេះ ដើម្បីពិនិត្យ..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <div className="p-6 bg-white/50 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleAnalyze}
                disabled={status === AnalysisStatus.LOADING || !inputText.trim()}
                className={`px-10 py-4 rounded-2xl font-bold transition-all shadow-lg flex items-center gap-3 text-lg ${
                  status === AnalysisStatus.LOADING || !inputText.trim()
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 hover:shadow-indigo-200 shadow-indigo-100'
                }`}
              >
                {status === AnalysisStatus.LOADING ? (
                  <>
                    <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    កំពុងវិភាគ...
                  </>
                ) : (
                  <>
                    <span>ពិនិត្យអត្ថបទ</span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
          {error && (
            <div className="bg-red-500 text-white p-4 rounded-2xl text-sm flex items-center gap-3 shadow-lg animate-bounce">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 shrink-0">
                <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.289 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.401 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
              </svg>
              <span className="font-bold">{error}</span>
            </div>
          )}
        </section>

        {/* Output Section */}
        <section className="flex flex-col gap-6">
          {!result && status === AnalysisStatus.IDLE && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-12 text-center border-2 border-dashed border-slate-300 rounded-3xl glass-panel">
              <div className="bg-white p-8 rounded-full mb-8 text-indigo-200 shadow-sm border border-slate-100">
                <svg xmlns="http://www.w3.org/2000/center" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-24 h-24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125V18a2.25 2.25 0 0 0 2.25 2.25h12.75a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H15m-4.5 0v3a1.5 1.5 0 0 0 1.5 1.5h3m-15 0a3 3 0 0 0-3 3v7.5a3 3 0 0 0 3 3h7.5a3 3 0 0 0 3-3V15a3 3 0 0 0-3-3H5.25Z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-slate-600">លទ្ធផលនឹងបង្ហាញនៅទីនេះ</h3>
              <p className="max-w-xs text-lg opacity-80 leading-relaxed">បច្ចេកវិទ្យា AI នឹងជួយវិភាគអក្ខរាវិរុទ្ធ និងវេយ្យាករណ៍របស់អ្នកដោយស្វ័យប្រវត្តិ។</p>
            </div>
          )}

          {status === AnalysisStatus.LOADING && (
            <div className="h-full flex flex-col items-center justify-center space-y-6 glass-panel rounded-3xl shadow-lg border border-white/50 animate-pulse">
              <div className="relative">
                <div className="w-20 h-20 border-8 border-indigo-100 rounded-full"></div>
                <div className="w-20 h-20 border-8 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
              </div>
              <p className="text-indigo-900 font-bold text-xl">កំពុងពិនិត្យអត្ថបទយ៉ាងយកចិត្តទុកដាក់...</p>
            </div>
          )}

          {result && status === AnalysisStatus.SUCCESS && (
            <div className="space-y-6 overflow-y-auto max-h-[850px] pr-4 custom-scrollbar animate-in slide-in-from-right-4 duration-500">
              {/* Overall Feedback Card */}
              <div className="glass-panel p-8 rounded-3xl shadow-xl border border-white/60">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-2xl text-slate-800">ការវាយតម្លៃជារួម</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-3 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-widest">
                          កម្រិតភាសា៖ {result.languageLevel}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100/50 text-slate-700 leading-relaxed text-lg">
                  {result.overallFeedback}
                </div>
              </div>

              {/* List of Corrections */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-3">
                    <span className="w-8 h-1 bg-red-500 rounded-full"></span>
                    កំហុស ({result.corrections.length})
                  </h3>
                </div>
                
                {result.corrections.length > 0 ? (
                  result.corrections.map((corr, idx) => (
                    <CorrectionCard key={idx} correction={corr} />
                  ))
                ) : (
                  <div className="glass-panel p-10 rounded-3xl text-center border border-green-200 bg-green-50/30">
                    <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-100 border-4 border-white">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-10 h-10">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    </div>
                    <p className="font-bold text-2xl text-green-800">ឥតខ្ចោះ!</p>
                    <p className="text-green-700/80 mt-2 text-lg">អត្ថបទរបស់អ្នកមានភាពត្រឹមត្រូវខ្ពស់ និងគ្មានកំហុសឡើយ។</p>
                  </div>
                )}
              </div>

              {/* Suggestions Box */}
              {result.suggestions && (
                <div className="bg-amber-100/40 backdrop-blur-sm p-8 rounded-3xl border border-amber-200/50 shadow-lg shadow-amber-900/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-32 h-32 text-amber-900">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                      </svg>
                  </div>
                  <h3 className="font-bold text-xl text-amber-900 flex items-center gap-3 mb-4 relative z-10">
                    <span className="p-2 bg-amber-500 text-white rounded-lg shadow-md">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                      </svg>
                    </span>
                    អនុសាសន៍សម្រាប់ពង្រឹងរចនាបថ
                  </h3>
                  <p className="text-amber-950 leading-relaxed text-lg whitespace-pre-wrap relative z-10 font-medium opacity-90">
                    {result.suggestions}
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-4 text-center border-t border-slate-800 mt-12">
        <div className="max-w-2xl mx-auto">
          <p className="text-lg font-bold text-white mb-2">កម្មវិធីពិនិត្យអក្ខរាវិរុទ្ធខ្មែរ</p>
          <p className="text-sm opacity-60 leading-relaxed">
            រៀបចំឡើងដោយប្រើបច្ចេកវិទ្យា Gemini 3.0 Pro AI និងផ្អែកលើគោលការណ៍វិស័យភាសាខ្មែររបស់សម្ដេចព្រះសង្ឃរាជ ជួន ណាត ដើម្បីគាំទ្រដល់ការប្រើប្រាស់អក្សរសាស្ត្រខ្មែរឱ្យបានត្រឹមត្រូវបំផុតក្នុងសម័យឌីជីថល។
          </p>
          <div className="mt-8 flex justify-center gap-6 opacity-40">
            <div className="h-0.5 w-12 bg-white rounded-full"></div>
            <div className="h-0.5 w-12 bg-white rounded-full"></div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
