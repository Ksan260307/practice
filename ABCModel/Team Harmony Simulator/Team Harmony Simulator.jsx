import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, 
  Users, 
  Target, 
  AlertCircle, 
  Heart, 
  TrendingUp, 
  Zap, 
  ShieldAlert,
  Info
} from 'lucide-react';

/**
 * ABCモデル v3.2.0 準拠ロジック (UI秘匿版)
 * A: Authenticity -> 「集中力・作業効率」
 * B: Aesthetic -> 「理想・基準の高さ」
 * C: Meta -> 「相手への配慮・俯瞰」
 * EF: External -> 「体調・環境」
 */

const App = () => {
  // --- 状態管理 (スライダー用 0-100) ---
  const [paramA, setParamA] = useState(80); // 作業能力
  const [paramB, setParamB] = useState(90); // 基準の高さ
  const [paramC, setParamC] = useState(20); // 配慮・俯瞰
  const [paramE, setParamE] = useState(50); // 心身の余裕 (Health/Environment)

  // --- ABCモデル変換ロジック ---
  const simulation = useMemo(() => {
    // 0-100をモデルの0/1/2スケールにマッピング(内部計算)
    const vA = paramA > 70 ? 2 : paramA > 30 ? 1 : 0;
    const vB = paramB > 70 ? 2 : paramB > 30 ? 1 : 0;
    const vC = paramC > 70 ? 2 : paramC > 30 ? 1 : 0;
    const vE = paramE / 100; // 0.0 ~ 1.0

    // 記事のロジック再現: B(基準)が高く、C(俯瞰)が低いと「話しにくさ」が増大
    // モデルの相互作用係数(k) C->A=-1, B->C=+1 などに基づきつつ直感化
    
    // チームからの信頼度 (Health/C/Aのバランス)
    const harmony = Math.max(0, Math.min(100, (paramC * 0.6 + paramE * 0.4) - (paramB - paramA) * 0.2));
    
    // 破綻スコア (RuinScore相当)
    // 「基準(B)が高いのに配慮(C)がない」かつ「余裕(E)がない」時に急上昇
    let ruinProb = 0;
    if (vB === 2 && vC === 0) ruinProb += 40; // 基準高・配慮低
    if (vE < 0.4) ruinProb += 30;             // 余裕なし
    if (vA === 2) ruinProb += 10;             // 仕事ができる故の「だるい」感
    
    const finalRuin = Math.min(100, ruinProb + (100 - harmony) * 0.5);

    // キャラクターのセリフと状態
    let statusLabel = "良好";
    let message = "淡々と仕事をこなしています。";
    let color = "bg-green-500";
    let emoji = "🤓";

    if (finalRuin > 70) {
      statusLabel = "危険：契約終了の危機";
      message = "「話しにくい」という苦情が殺到しています。";
      color = "bg-red-500";
      emoji = "⚠️";
    } else if (finalRuin > 40) {
      statusLabel = "注意：とっつきにくい";
      message = "作業は完璧ですが、周囲は話しかけるのをためらっています。";
      color = "bg-yellow-500";
      emoji = "😥";
    }

    return { harmony, ruin: finalRuin, statusLabel, message, color, emoji };
  }, [paramA, paramB, paramC, paramE]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Target className="text-blue-600" />
          <span>チーム相性シミュレーター</span>
        </h1>
        <div className={`px-3 py-1 rounded-full text-white text-xs font-bold ${simulation.color}`}>
          {simulation.statusLabel}
        </div>
      </header>

      <main className="max-w-md mx-auto p-6 space-y-8">
        
        {/* Visual Feedback Section */}
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-100">
            <div 
              className={`h-full transition-all duration-500 ${simulation.color}`} 
              style={{ width: `${100 - simulation.ruin}%` }}
            ></div>
          </div>
          
          <div className="text-6xl mb-4 animate-bounce">{simulation.emoji}</div>
          <p className="text-lg font-bold mb-2">{simulation.message}</p>
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-slate-50 p-4 rounded-2xl">
              <p className="text-xs text-slate-500 mb-1">チーム調和度</p>
              <p className="text-2xl font-black text-blue-600">{Math.round(simulation.harmony)}%</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl">
              <p className="text-xs text-slate-500 mb-1">離職・解約リスク</p>
              <p className="text-2xl font-black text-red-500">{Math.round(simulation.ruin)}%</p>
            </div>
          </div>
        </div>

        {/* Sliders Section */}
        <div className="space-y-6">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Zap size={16} /> パラメータ調整
          </h2>

          {/* A: 作業遂行能力 */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <label className="font-bold flex items-center gap-2">
                <Target size={18} className="text-orange-500" /> 
                個人の作業能力
              </label>
              <span className="text-sm font-mono bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                {paramA}
              </span>
            </div>
            <input 
              type="range" 
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
              value={paramA}
              onChange={(e) => setParamA(parseInt(e.target.value))}
            />
            <p className="text-[10px] text-slate-400 mt-2">※高いほど仕事は早いが、周囲への要求も厳しくなりがち</p>
          </div>

          {/* B: 基準の高さ */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <label className="font-bold flex items-center gap-2">
                <ShieldAlert size={18} className="text-purple-500" /> 
                理想・基準の高さ
              </label>
              <span className="text-sm font-mono bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                {paramB}
              </span>
            </div>
            <input 
              type="range" 
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
              value={paramB}
              onChange={(e) => setParamB(parseInt(e.target.value))}
            />
            <p className="text-[10px] text-slate-400 mt-2">※高いほど妥協を許さないが、余裕がないと「威圧」に変わる</p>
          </div>

          {/* C: 俯瞰・配慮 */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <label className="font-bold flex items-center gap-2">
                <Users size={18} className="text-blue-500" /> 
                相手への配慮・俯瞰力
              </label>
              <span className="text-sm font-mono bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                {paramC}
              </span>
            </div>
            <input 
              type="range" 
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              value={paramC}
              onChange={(e) => setParamC(parseInt(e.target.value))}
            />
            <p className="text-[10px] text-slate-400 mt-2">※チームを円滑にする鍵。不足すると「話しにくい」印象に</p>
          </div>

          {/* E: 心身の余裕 */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <label className="font-bold flex items-center gap-2">
                <Heart size={18} className="text-rose-500" /> 
                心身のコンディション
              </label>
              <span className="text-sm font-mono bg-rose-100 text-rose-700 px-2 py-0.5 rounded">
                {paramE}
              </span>
            </div>
            <input 
              type="range" 
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
              value={paramE}
              onChange={(e) => setParamE(parseInt(e.target.value))}
            />
            <p className="text-[10px] text-slate-400 mt-2">※睡眠不足やストレス。低いとつい「ため息」が出てしまう</p>
          </div>
        </div>

        {/* Insight Card */}
        <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-lg space-y-3">
          <div className="flex items-center gap-2 font-bold italic">
            <Info size={20} />
            <span>シミュレーターの考察</span>
          </div>
          <p className="text-sm leading-relaxed opacity-90">
            記事のスタッフは「作業能力」と「基準」がMAXに近い一方で、「配慮」と「余裕」が欠けていました。
            この状態は、本人にとっては<span className="font-bold underline">「大変さが予測できるからこその慎重さ」</span>ですが、
            周囲からは<span className="font-bold">「グレた中学生のような拒絶」</span>に見えてしまいます。
          </p>
          <div className="pt-2 border-t border-blue-400 text-xs italic">
            ★解決策：コンディションを整え、相手の視点(C)を10%上げるだけで、リスクは劇的に下がります。
          </div>
        </div>
      </main>

      {/* Mobile Tab Bar (Fake for aesthetic) */}
      <footer className="fixed bottom-0 left-0 w-full bg-white border-t py-3 px-8 flex justify-around items-center md:hidden">
        <TrendingUp className="text-blue-600" />
        <Users className="text-slate-400" />
        <AlertCircle className="text-slate-400" />
      </footer>
    </div>
  );
};

export default App;