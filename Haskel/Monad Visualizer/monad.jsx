import React, { useState } from 'react';
import { ArrowRight, Box, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

const App = () => {
  const [inputValue, setInputValue] = useState(10);
  const [showNone, setShowNone] = useState(false);
  
  // モナドの計算ステップ定義
  const steps = [
    { id: 1, label: "Input", operation: (x) => x },
    { id: 2, label: "Double (*2)", operation: (x) => x * 2 },
    { id: 3, label: "Add Five (+5)", operation: (x) => x + 5 },
    { id: 4, label: "Square (^2)", operation: (x) => x * x }
  ];

  // 計算結果をシミュレートする関数
  const calculateResults = () => {
    let current = showNone ? null : inputValue;
    const results = [];
    
    for (let i = 0; i < steps.length; i++) {
      if (i === 0) {
        results.push(current);
      } else {
        if (current === null) {
          results.push(null);
        } else {
          current = steps[i].operation(current);
          results.push(current);
        }
      }
    }
    return results;
  };

  const results = calculateResults();

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-600 p-6 text-white text-center">
          <h1 className="text-2xl font-bold mb-2">Monad Visualizer</h1>
          <p className="opacity-90 text-sm">値を直接いじらず、「文脈の箱」を通して計算を繋ぐ仕組み</p>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-semibold mb-4 text-slate-600">
                1. 値をセット (Value: {inputValue})
              </label>
              <input
                type="range"
                min="0"
                max="50"
                value={inputValue}
                onChange={(e) => setInputValue(parseInt(e.target.value))}
                className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
            <div className="flex flex-col justify-center space-y-3">
              <label className="block text-sm font-semibold text-slate-600">
                2. 文脈（コンテキスト）の切り替え
              </label>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowNone(false)}
                  className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition ${!showNone ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500'}`}
                >
                  値が存在する (Just)
                </button>
                <button
                  onClick={() => setShowNone(true)}
                  className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition ${showNone ? 'bg-rose-500 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500'}`}
                >
                  値が空 (Nothing)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Visualizer Area */}
        <div className="p-8 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[700px]">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                {/* Step Node */}
                <div className="flex flex-col items-center flex-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{step.label}</span>
                  
                  {/* The Monad Box */}
                  <div className={`relative w-24 h-24 rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-500 transform ${
                    results[index] === null 
                      ? 'border-rose-200 bg-rose-50 shadow-sm scale-95' 
                      : 'border-indigo-200 bg-indigo-50 shadow-inner scale-100'
                  }`}>
                    {results[index] === null ? (
                      <>
                        <AlertCircle className="text-rose-400 mb-1" size={24} />
                        <span className="text-rose-500 font-mono text-xs font-bold">Nothing</span>
                      </>
                    ) : (
                      <>
                        <Box className="text-indigo-400 mb-1 opacity-50" size={20} />
                        <span className="text-indigo-700 font-mono text-xl font-black">{results[index]}</span>
                      </>
                    )}
                    
                    {/* Inner Label */}
                    <div className="absolute -bottom-2 px-2 bg-white border border-slate-100 rounded text-[10px] font-bold text-slate-400">
                      MAYBE
                    </div>
                  </div>
                </div>

                {/* Connector / Bind Function */}
                {index < steps.length - 1 && (
                  <div className="flex flex-col items-center px-2">
                    <div className="h-0.5 w-12 bg-slate-200 relative mb-4">
                      <div className={`absolute top-1/2 -translate-y-1/2 right-0 transition-colors ${results[index+1] === null ? 'text-rose-300' : 'text-indigo-400'}`}>
                        <ArrowRight size={20} />
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded border text-[10px] font-mono font-bold transition-all ${
                      results[index] === null ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-amber-50 border-amber-200 text-amber-700'
                    }`}>
                      {/* 安全にエスケープされたモナド結合子 */}
                      {results[index] === null ? 'SKIP' : '>>= bind'}
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Explanation Footer */}
        <div className="p-6 bg-slate-900 text-slate-300 rounded-b-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-start gap-2">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <CheckCircle2 size={16} className="text-emerald-400" />
                値の抽象化
              </div>
              <p className="text-xs leading-relaxed italic">
                モナドは値を直接計算せず、常に「箱」の中で処理します。
              </p>
            </div>
            <div className="flex flex-col items-start gap-2">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <RefreshCw size={16} className="text-sky-400" />
                計算の合成 (Bind)
              </div>
              <p className="text-xs leading-relaxed italic">
                「{">>="}」は、箱の中身を取り出し、計算し、再び箱に戻して次へ渡します。
              </p>
            </div>
            <div className="flex flex-col items-start gap-2">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <AlertCircle size={16} className="text-rose-400" />
                文脈の維持
              </div>
              <p className="text-xs leading-relaxed italic">
                一度 Nothing になると、後続の計算は自動的に無視（スキップ）されます。
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center text-slate-400 text-sm">
        Pythonでのイメージ: <code className="bg-slate-200 px-2 py-1 rounded text-slate-700">maybe_value.bind(func)</code>
      </div>
    </div>
  );
};

export default App;