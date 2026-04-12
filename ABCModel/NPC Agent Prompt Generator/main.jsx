import React, { useState, useEffect, useCallback } from 'react';
import { Copy, User, Brain, Eye, Settings, HeartPulse, RefreshCw, CheckCircle2, MessageSquare, Sliders, ChevronRight, Info } from 'lucide-react';

// --- API Helper ---
const apiKey = ""; 

const App = () => {
  // --- States ---
  const [activeTab, setActiveTab] = useState('settings'); 
  const [isGenerating, setIsGenerating] = useState(false);
  const [samples, setSamples] = useState(["パラメータを動かして、AIにセリフを作らせてみましょう。"]);

  // Basic Info
  const [basic, setBasic] = useState({
    name: 'アルト',
    role: '没落した騎士',
    personality: 'かつての栄光にすがりつつも、現状を打破したいと焦っている。口調は硬いが、余裕がない。'
  });

  // ABC Layers (Core Logic)
  const [A, setA] = useState({ v: 1, delta: 1, state: 'Normal' }); // 心
  const [B, setB] = useState({ v: 2, delta: 0, state: 'Normal', type: 'B1' }); // 理想
  const [C, setC] = useState({ v: 1, delta: 1, state: 'Normal', type: 'C3' }); // 周囲

  const [customPrompt, setCustomPrompt] = useState('プレイヤーに対して最初は警戒するが、実力を認めると態度が軟化する。');
  const [copied, setCopied] = useState(false);
  const [ruinScore, setRuinScore] = useState(0);

  // --- Mappings ---
  const levelMap = { 0: 'よわい', 1: 'ふつう', 2: 'つよい' };
  const deltaMap = { 0: 'おだやか', 1: 'ゆらゆら', 2: 'ぐちゃぐちゃ' };
  const bTypeMap = { 'B1': '自分に厳しい (内向き)', 'B2': '人の目が気になる (外向き)' };
  const cTypeMap = { 'C1': '論理的', 'C2': '空気を読む', 'C3': '自意識過剰', 'C4': '常識人' };
  const stateLabelMap = { 'Normal': '平常心', 'Runaway': '暴走中', 'Zero': '無反応' };

  // --- Logic ---
  // 精神負荷計算
  useEffect(() => {
    const calcLayerScore = (layer) => {
      let score = layer.v + layer.delta;
      if (layer.state === 'Runaway') score += 2;
      if (layer.state === 'Zero') score += 1.5;
      return score;
    };
    const maxCore = Math.max(calcLayerScore(A), calcLayerScore(B), calcLayerScore(C));
    const total = Math.min(100, Math.round((maxCore / 6) * 100));
    setRuinScore(total);
  }, [A, B, C]);

  // プロンプト生成
  const promptBody = `あなたは以下の深層心理設定を持つNPCとして振る舞ってください。

【基本設定】
■名前: ${basic.name}
■役割: ${basic.role}
■性格: ${basic.personality}

【心理パラメータ (ABCモデル)】
1. A (心・感情): 強さ=${levelMap[A.v]}, 不安定さ=${deltaMap[A.delta]}, 状態=${stateLabelMap[A.state]}
2. B (理想・信念): 強さ=${levelMap[B.v]}, 不安定さ=${deltaMap[B.delta]}, 状態=${stateLabelMap[B.state]}, タイプ=${bTypeMap[B.type]}
3. C (周囲・客観性): 強さ=${levelMap[C.v]}, 不安定さ=${deltaMap[C.delta]}, 状態=${stateLabelMap[C.state]}, タイプ=${cTypeMap[C.type]}

【現在のコンディション】
■精神負荷度: ${ruinScore}%
■補足事項: ${customPrompt}

上記の心理状態を反映し、そのキャラらしい口調で回答してください。`;

  const randomise = () => {
    const rState = () => Math.random() > 0.85 ? (Math.random() > 0.5 ? 'Runaway' : 'Zero') : 'Normal';
    const rVal = () => Math.floor(Math.random() * 3);
    
    setA({ v: rVal(), delta: rVal(), state: rState() });
    setB({ v: rVal(), delta: rVal(), state: rState(), type: Math.random() > 0.5 ? 'B1' : 'B2' });
    setC({ v: rVal(), delta: rVal(), state: rState(), type: ['C1','C2','C3','C4'][Math.floor(Math.random()*4)] });
  };

  const fetchSamples = async () => {
    setIsGenerating(true);
    const systemPrompt = "あなたはゲームのシナリオライターです。与えられたNPCのパラメータ設定を読み取り、そのキャラクターが言いそうなセリフを3つ、JSON形式の配列(例: [\"セリフ1\", \"セリフ2\", \"セリフ3\"])で出力してください。";
    const userQuery = `設定: ${basic.name}(${basic.role})。性格: ${basic.personality}。負荷: ${ruinScore}%。A(感情): ${levelMap[A.v]}/${stateLabelMap[A.state]}。B(信念): ${levelMap[B.v]}/${stateLabelMap[B.state]}。C(周囲): ${levelMap[C.v]}/${stateLabelMap[C.state]}。この設定で短いセリフを3つ生成して。`;

    let retries = 3;
    while (retries > 0) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: userQuery }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: { responseMimeType: "application/json" }
          })
        });
        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          setSamples(JSON.parse(text));
          break;
        }
      } catch (error) {
        retries--;
        await new Promise(res => setTimeout(res, 1000));
      }
    }
    setIsGenerating(false);
  };

  const handleCopy = () => {
    const textArea = document.createElement("textarea");
    textArea.value = promptBody;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed');
    }
    document.body.removeChild(textArea);
  };

  // --- Components ---
  const Slider = ({ label, value, onChange, map }) => (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-slate-300">{label}</label>
        <span className="text-xs bg-indigo-500/20 px-2 py-1 rounded text-indigo-400 font-bold">{map[value]}</span>
      </div>
      <input
        type="range" min="0" max="2" step="1"
        value={value} onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
      />
    </div>
  );

  const StateSelector = ({ value, onChange }) => (
    <div className="flex gap-1 bg-slate-800 p-1 rounded-lg mb-4">
      {Object.keys(stateLabelMap).map(s => (
        <button
          key={s} onClick={() => onChange(s)}
          className={`flex-1 py-2 text-xs rounded-md transition-all font-bold ${value === s ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
        >
          {stateLabelMap[s]}
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans pb-24 md:pb-12">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 p-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight leading-none">NPC Agent Creator</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Mental Logic Model v3.2</p>
            </div>
          </div>
          <button 
            onClick={randomise}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-full text-xs font-bold border border-slate-700 transition-all active:scale-95"
          >
            <RefreshCw className="w-3 h-3" />
            ランダム設定
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4">
        {/* Mobile Tabs */}
        <div className="flex md:hidden mb-6 bg-slate-900 rounded-2xl p-1.5 border border-slate-800 shadow-inner">
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'settings' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500'}`}
          >
            <Sliders className="w-4 h-4" /> 設定
          </button>
          <button 
            onClick={() => setActiveTab('preview')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'preview' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500'}`}
          >
            <MessageSquare className="w-4 h-4" /> プレビュー
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Settings Section */}
          <div className={`${activeTab === 'settings' ? 'block' : 'hidden md:block'} space-y-6`}>
            
            {/* Basic Info */}
            <section className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-4 h-4 text-indigo-400" />
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">基本情報 (見た目や役割)</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 mb-1 block">キャラクター名</label>
                  <input type="text" value={basic.name} onChange={e=>setBasic({...basic, name:e.target.value})} placeholder="例: アルト" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 mb-1 block">役割・職業 (社会的立場)</label>
                  <input type="text" value={basic.role} onChange={e=>setBasic({...basic, role:e.target.value})} placeholder="例: 没落した騎士、怪しい商人" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 mb-1 block">性格・口調 (ベースとなる性格)</label>
                  <textarea value={basic.personality} onChange={e=>setBasic({...basic, personality:e.target.value})} rows="2" placeholder="例: プライドが高く、他人を見下すような口調だが、実は寂しがり屋。" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"></textarea>
                </div>
              </div>
            </section>

            {/* A Layer */}
            <section className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl border-l-4 border-l-rose-500">
              <h2 className="text-xs font-black text-rose-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <HeartPulse className="w-4 h-4" /> 心・感情 (素直な反応)
              </h2>
              <Slider label="感情の強さ (喜怒哀楽の大きさ)" value={A.v} onChange={v=>setA({...A, v})} map={levelMap} />
              <Slider label="不安定さ (感情の変わりやすさ)" value={A.delta} onChange={d=>setA({...A, delta:d})} map={deltaMap} />
              <StateSelector value={A.state} onChange={s=>setA({...A, state:s})} />
            </section>

            {/* B Layer */}
            <section className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl border-l-4 border-l-amber-500">
              <h2 className="text-xs font-black text-amber-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4" /> 理想・こだわり (信念)
              </h2>
              <Slider label="こだわりの強さ (プライドの高低)" value={B.v} onChange={v=>setB({...B, v})} map={levelMap} />
              <Slider label="迷い (自分への疑い)" value={B.delta} onChange={d=>setB({...B, delta:d})} map={deltaMap} />
              <StateSelector value={B.state} onChange={s=>setB({...B, state:s})} />
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <label className="text-[10px] font-bold text-slate-500 mb-2 block">何を重視するか</label>
                <select value={B.type} onChange={e=>setB({...B, type:e.target.value})} className="w-full bg-transparent text-sm outline-none text-slate-300">
                  {Object.entries(bTypeMap).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </section>

            {/* C Layer */}
            <section className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl border-l-4 border-l-cyan-500">
              <h2 className="text-xs font-black text-cyan-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Eye className="w-4 h-4" /> 周囲への意識 (世間体)
              </h2>
              <Slider label="気にする度 (空気を読む力)" value={C.v} onChange={v=>setC({...C, v})} map={levelMap} />
              <Slider label="疑心暗鬼 (他人の目への恐怖)" value={C.delta} onChange={d=>setC({...C, delta:d})} map={deltaMap} />
              <StateSelector value={C.state} onChange={s=>setC({...C, state:s})} />
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <label className="text-[10px] font-bold text-slate-500 mb-2 block">周りの捉え方</label>
                <select value={C.type} onChange={e=>setC({...C, type:e.target.value})} className="w-full bg-transparent text-sm outline-none text-slate-300">
                  {Object.entries(cTypeMap).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </section>

            {/* Custom Extra */}
            <section className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">補足指示</h2>
              <textarea 
                value={customPrompt} 
                onChange={e=>setCustomPrompt(e.target.value)} 
                placeholder="例: 実は隠し持っている宝の地図がある。プレイヤーが魔法使いなら態度が悪くなる。"
                rows="3" 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              ></textarea>
            </section>
          </div>

          {/* Preview Section */}
          <div className={`${activeTab === 'preview' ? 'block' : 'hidden md:block'} space-y-6 sticky md:top-24`}>
            
            {/* Ruin Score Header */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mental Stability</p>
                  <h3 className={`text-4xl font-black ${ruinScore > 80 ? 'text-red-500' : ruinScore > 50 ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {ruinScore}%
                  </h3>
                </div>
                <div className={`px-4 py-2 rounded-full text-[10px] font-black border uppercase ${ruinScore > 80 ? 'bg-red-500/10 text-red-500 border-red-500/30' : ruinScore > 50 ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'}`}>
                  {ruinScore > 80 ? 'Critical' : ruinScore > 50 ? 'Unstable' : 'Stable'}
                </div>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-700 ${ruinScore > 80 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : ruinScore > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${ruinScore}%` }}
                />
              </div>
              <div className="mt-4 flex items-start gap-2 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                <Info className="w-3 h-3 text-slate-500 mt-0.5" />
                <p className="text-[11px] text-slate-400">
                  {ruinScore > 80 ? "精神状態が極限です。会話が成立しなかったり、攻撃的・絶望的な言動が目立ちます。" : 
                   ruinScore > 50 ? "ストレスが溜まっています。時折、心の余裕のなさが言葉の端々に現れます。" : 
                   "落ち着いた状態です。本来の性格に基づいた安定した受け答えが期待できます。"}
                </p>
              </div>
            </div>

            {/* Dialogue Samples */}
            <div className="bg-indigo-900/10 border border-indigo-500/20 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black text-indigo-400 flex items-center gap-2 uppercase tracking-widest">
                  <MessageSquare className="w-4 h-4" /> セリフのサンプル (AI生成)
                </h3>
                <button 
                  onClick={fetchSamples} disabled={isGenerating}
                  className="p-2 bg-indigo-600 rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 text-white ${isGenerating ? 'animate-spin' : ''}`} />
                </button>
              </div>
              
              <div className="space-y-3">
                {samples.map((s, i) => (
                  <div key={i} className="bg-slate-950/80 p-4 rounded-2xl border border-indigo-500/10 text-sm italic text-slate-100 shadow-sm">
                    「{s}」
                  </div>
                ))}
              </div>
            </div>

            {/* Prompt Preview */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800 flex justify-between items-center bg-slate-800/40">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Generated Prompt</span>
                <button onClick={handleCopy} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${copied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}>
                  {copied ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="p-4 h-48 bg-slate-950 overflow-y-auto custom-scrollbar">
                <pre className="text-[11px] font-mono text-slate-500 whitespace-pre-wrap leading-relaxed">
                  {promptBody}
                </pre>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Mobile Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800 md:hidden z-30">
        <button 
          onClick={handleCopy}
          className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all border border-indigo-500"
        >
          {copied ? 'コピー完了！' : 'プロンプトをコピー'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 22px;
          width: 22px;
          border-radius: 50%;
          background: #6366f1;
          cursor: pointer;
          border: 4px solid #0f172a;
          box-shadow: 0 0 15px rgba(99, 102, 241, 0.3);
        }
      `}} />
    </div>
  );
};

export default App;