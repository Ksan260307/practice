import React, { useState, useEffect, useCallback } from 'react';
import { 
  Sparkles, Heart, RefreshCw, Sun, Moon, 
  ChevronRight, History, Award, Leaf, ChevronUp
} from 'lucide-react';

// --- CVM Constants ---
const MAX_L = 100;
const SEASONS = [
  { id: 'spring', name: '春', emoji: '🌸', envMod: 0, color: 'from-pink-100 to-white' },
  { id: 'summer', name: '夏', emoji: '☀️', envMod: -1, color: 'from-blue-50 to-white' },
  { id: 'autumn', name: '秋', emoji: '🍂', envMod: 1, color: 'from-orange-50 to-white' },
  { id: 'winter', name: '冬', emoji: '❄️', envMod: -2, color: 'from-slate-100 to-white' }
];

const TRAITS = [
  { id: 'adventurer', name: '冒険家', icon: '🏃', effect: '元気に動き回る' },
  { id: 'philosopher', name: 'のんびり', icon: '💤', effect: 'ゆっくり長く生きる' },
  { id: 'scholar', name: '天才', icon: '🎓', effect: '次世代の才能が大幅UP' }
];

export default function App() {
  // --- Core CVM State ---
  const [generation, setGeneration] = useState(1);
  const [accumulation, setAccumulation] = useState(0); // L
  const [inheritedAdvantage, setInheritedAdvantage] = useState(0); // α
  const [history, setHistory] = useState([]);
  
  // --- Game State ---
  const [mood, setMood] = useState(3); // E (User control)
  const [seasonIdx, setSeasonIdx] = useState(0);
  const [day, setDay] = useState(1);
  const [activeTrait, setActiveTrait] = useState(null);
  const [recentGains, setRecentGains] = useState([]);
  const [showRebirthModal, setShowRebirthModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // --- Derived CVM Logic ---
  const currentSeason = SEASONS[seasonIdx];
  const isDeath = accumulation >= MAX_L;
  
  const calculateVelocity = useCallback(() => {
    if (isDeath) return 10; 
    let v = mood + inheritedAdvantage + currentSeason.envMod;
    if (activeTrait?.id === 'adventurer') v += 1;
    return Math.max(1, Math.min(10, v)); 
  }, [isDeath, mood, inheritedAdvantage, currentSeason, activeTrait]);

  const currentVelocity = calculateVelocity();

  const getState = () => {
    if (isDeath) return { label: '伝説', color: 'text-amber-600', bg: 'bg-amber-100', emoji: '👑', border: 'border-amber-300' };
    const r = accumulation / MAX_L;
    if (r < 0.2) return { label: 'あかちゃん', color: 'text-sky-500', bg: 'bg-sky-100', emoji: '🍼', border: 'border-sky-200' };
    if (r < 0.5) return { label: 'こども', color: 'text-emerald-500', bg: 'bg-emerald-100', emoji: '🎈', border: 'border-emerald-200' };
    if (r < 0.8) return { label: 'おとな', color: 'text-orange-500', bg: 'bg-orange-100', emoji: '🏠', border: 'border-orange-200' };
    return { label: 'ろうご', color: 'text-violet-500', bg: 'bg-violet-100', emoji: '🍵', border: 'border-violet-200' };
  };
  const state = getState();

  // --- Actions ---
  const handleTick = () => {
    if (isDeath) return;
    const factor = activeTrait?.id === 'philosopher' ? 0.7 : 1.0;
    const gain = Math.round(currentVelocity * factor * 1.5);
    const newL = Math.min(MAX_L, accumulation + gain);
    
    const newParticle = { id: Date.now(), val: gain, x: Math.random() * 40 + 30 };
    setRecentGains(prev => [...prev, newParticle]);
    setTimeout(() => setRecentGains(prev => prev.filter(p => p.id !== newParticle.id)), 800);

    setAccumulation(newL);
    setDay(prev => prev + 1);
    if (day % 4 === 0) setSeasonIdx(prev => (prev + 1) % SEASONS.length);
  };

  const completeRebirth = (chosenTrait) => {
    setHistory([{ gen: generation, days: day, trait: activeTrait?.name || 'なし' }, ...history]);
    setGeneration(prev => prev + 1);
    setInheritedAdvantage(prev => prev + (chosenTrait.id === 'scholar' ? 2 : 1));
    setActiveTrait(chosenTrait);
    setAccumulation(0);
    setDay(1);
    setSeasonIdx(0);
    setMood(3);
    setShowRebirthModal(false);
  };

  return (
    <div className="fixed inset-0 bg-neutral-900 flex flex-col items-center justify-center overflow-hidden font-sans">
      {/* --- Phone Container --- */}
      <div className={`w-full h-full max-w-md bg-white flex flex-col relative transition-all duration-500 bg-gradient-to-b ${currentSeason.color} overflow-hidden`}>
        
        {/* --- Top Bar: Status --- */}
        <div className="pt-8 sm:pt-12 px-6 pb-2 flex justify-between items-end shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="bg-neutral-900 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">GEN {generation}</span>
              {activeTrait && (
                <span className="bg-indigo-100 text-indigo-600 text-[10px] px-2 py-0.5 rounded-full font-bold">{activeTrait.name}</span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 leading-none">
              はりねずみ
            </h1>
          </div>
          <div className="text-right">
            <div className="text-xl sm:text-2xl">{currentSeason.emoji}</div>
            <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{currentSeason.name} {day}日目</div>
          </div>
        </div>

        {/* --- Scrollable Main Content --- */}
        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col items-center no-scrollbar">
          <div className={`w-full aspect-square max-h-[320px] rounded-[2.5rem] sm:rounded-[3rem] bg-white/60 backdrop-blur shadow-xl border-2 ${state.border} flex flex-col items-center justify-center relative overflow-hidden transition-all duration-500 shrink-0`}>
            
            {/* Particles */}
            {recentGains.map(p => (
              <div key={p.id} className="absolute bottom-1/2 text-rose-500 font-black animate-ping text-3xl z-10" style={{ left: `${p.x}%` }}>
                +{p.val}
              </div>
            ))}

            <div className={`text-7xl sm:text-9xl mb-2 sm:mb-4 transition-transform duration-500 ${isDeath ? 'scale-110 drop-shadow-2xl' : 'hover:scale-105'}`}>
              {isDeath ? '✨🦔✨' : '🦔'}
            </div>

            <div className={`px-4 py-1 rounded-full ${state.bg} ${state.color} font-black text-xs sm:text-sm flex items-center gap-2 border-2 border-white shadow-sm`}>
              {state.emoji} {state.label}
            </div>

            {/* Progress Bar (Accumulation) */}
            <div className="absolute bottom-6 sm:bottom-8 left-8 sm:left-10 right-8 sm:right-10 space-y-1 sm:space-y-2">
              <div className="flex justify-between items-center text-[9px] font-black text-neutral-400 uppercase">
                <span className="flex items-center gap-1"><Heart className="w-2.5 h-2.5 fill-current" /> 思い出</span>
                <span>{Math.floor(accumulation)}%</span>
              </div>
              <div className="h-3 sm:h-4 bg-white/80 rounded-full p-1 shadow-inner border border-neutral-100">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ease-out ${isDeath ? 'bg-gradient-to-r from-amber-400 to-yellow-300' : 'bg-gradient-to-r from-rose-400 to-pink-500'}`}
                  style={{ width: `${accumulation}%` }}
                />
              </div>
            </div>
          </div>

          {/* Spacer for mobile scrollability */}
          <div className="h-4 shrink-0" />
        </div>

        {/* --- Control Panel (Thumb Zone) --- */}
        <div className="bg-white rounded-t-[2.5rem] sm:rounded-t-[3rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] px-6 sm:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 shrink-0">
          
          {/* Slider Control */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex justify-between items-end">
              <div className="space-y-0.5">
                <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest block">Gokigen Level</span>
                <span className="text-base sm:text-lg font-black text-neutral-800">今日のごきげん</span>
              </div>
              <div className="text-right">
                <span className={`text-2xl sm:text-3xl font-black tabular-nums ${currentVelocity >= 9 ? 'text-rose-500' : 'text-neutral-900'}`}>
                  {currentVelocity}
                </span>
                <span className="text-[10px] font-bold text-neutral-400 ml-1">/ 10</span>
              </div>
            </div>
            
            <div className="relative flex items-center py-1">
              <input 
                type="range" min="1" max="5" value={mood}
                onChange={(e) => setMood(Number(e.target.value))}
                disabled={isDeath}
                className="w-full h-3 sm:h-4 bg-neutral-100 rounded-full appearance-none cursor-pointer accent-neutral-900"
              />
            </div>
            <div className="flex justify-between text-[9px] font-black text-neutral-300 px-1">
              <span>のんびり</span>
              <span>アクティブ</span>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="pb-6 sm:pb-8">
            {!isDeath ? (
              <button 
                onClick={handleTick}
                className="w-full bg-neutral-900 active:bg-black text-white py-5 sm:py-6 rounded-2xl sm:rounded-[2rem] text-lg sm:text-xl font-black shadow-2xl shadow-neutral-200 flex items-center justify-center gap-3 transition-transform active:scale-95"
              >
                1日をすごす
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            ) : (
              <button 
                onClick={() => setShowRebirthModal(true)}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-5 sm:py-6 rounded-2xl sm:rounded-[2rem] text-lg sm:text-xl font-black shadow-2xl shadow-orange-100 flex items-center justify-center gap-3 transition-transform active:scale-95 animate-bounce"
              >
                <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6" />
                新しい命へ
              </button>
            )}
          </div>
        </div>

        {/* --- History Drawer Mini --- */}
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center text-neutral-300 hover:text-neutral-400 transition-colors z-30"
        >
          <ChevronUp className={`w-4 h-4 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
          <span className="text-[8px] font-black uppercase tracking-widest">History</span>
        </button>

        {/* History Overlay */}
        {showHistory && (
          <div className="absolute inset-x-0 bottom-0 top-20 bg-white/98 backdrop-blur-md z-40 rounded-t-[2.5rem] sm:rounded-t-[3rem] p-6 sm:p-8 overflow-y-auto animate-in slide-in-from-bottom">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg sm:text-xl font-black flex items-center gap-2"><History className="w-5 h-5" /> 歴代の記録</h3>
              <button onClick={() => setShowHistory(false)} className="text-xs font-bold text-neutral-400">閉じる</button>
            </div>
            <div className="space-y-3 pb-10">
              {history.length === 0 && <p className="text-center text-neutral-400 py-10 italic text-sm">まだ記録がありません</p>}
              {history.map((h, i) => (
                <div key={i} className="flex justify-between items-center p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                  <div>
                    <div className="text-[10px] font-black text-neutral-400">第 {h.gen} 世代</div>
                    <div className="font-bold text-neutral-800 text-sm">{h.trait}</div>
                  </div>
                  <div className="text-right font-black text-neutral-900 text-sm">
                    {h.days} <span className="text-[10px] text-neutral-400 font-normal">Days</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* --- Rebirth Selection Modal --- */}
      {showRebirthModal && (
        <div className="fixed inset-0 bg-neutral-900/80 backdrop-blur-lg flex items-end justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-t-[3rem] p-8 sm:p-10 pb-12 sm:pb-16 space-y-6 sm:space-y-8 animate-in slide-in-from-bottom duration-500 overflow-y-auto max-h-[90vh]">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Sparkles className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-neutral-900">次世代へのギフト</h2>
              <p className="text-xs sm:text-sm text-neutral-500 px-4">
                今回の人生は終わりました。{"\n"}次の子にどんな才能を贈りますか？
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:gap-3">
              {TRAITS.map(trait => (
                <button
                  key={trait.id}
                  onClick={() => completeRebirth(trait)}
                  className="w-full text-left p-4 sm:p-5 rounded-[1.5rem] sm:rounded-3xl border-2 border-neutral-100 hover:border-neutral-900 active:bg-neutral-50 transition-all flex items-center gap-4 sm:gap-5 group"
                >
                  <span className="text-3xl sm:text-4xl group-hover:scale-110 transition-transform">{trait.icon}</span>
                  <div className="flex-1">
                    <div className="font-black text-base sm:text-lg text-neutral-900">{trait.name}</div>
                    <div className="text-[10px] sm:text-xs text-neutral-400 font-bold">{trait.effect}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-200 group-hover:text-neutral-900 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}