import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, Shield, Loader2, Database, Settings, X, RefreshCw, Activity, Zap, AlertTriangle, Radio, Terminal, Menu } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, onSnapshot } from 'firebase/firestore';

// --- Tactical Logic ---
const STATE = { NORMAL: "Stable", RUNAWAY: "Active", ZERO: "Standby" };

function calculateRuinScore(core, ef) {
  const intensitySum = core.A.v + core.B.v + core.C.v;
  const volatilitySum = core.A.delta + core.B.delta + core.C.delta;
  const efImpact = (1 - ef.E0) + Math.abs(ef.E3);
  let score = (intensitySum / 6) * 0.4 + (volatilitySum / 3) * 0.3 + (efImpact / 2) * 0.3;
  return Math.min(1, Math.max(0, score));
}

function stepTacticalCore(core, inputJson, ef) {
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  let vA = core.A.v + (inputJson.E1 || 0) * 0.2 + (ef.E1 * 0.1);
  let vB = core.B.v + (inputJson.E2 || 0) * 0.2 + (ef.E2 * 0.1);
  let vC = core.C.v + (inputJson.E3 || 0) * 0.2 + (ef.E3 * 0.1);

  vA -= (vC >= 1.5 ? 0.2 : 0);
  vC += (vB >= 1.5 ? 0.2 : 0);
  vB -= (vA >= 1.5 ? 0.2 : 0);

  return {
    A: { ...core.A, v: clamp(vA, 0, 2) },
    B: { ...core.B, v: clamp(vB, 0, 2) },
    C: { ...core.C, v: clamp(vC, 0, 2) }
  };
}

const safeFirebaseConfig = () => {
  try {
    return typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
  } catch (e) { return null; }
};

const config = safeFirebaseConfig();
let db = null;
let auth = null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'ada-tactical-v1';

if (config) {
  const app = initializeApp(config);
  auth = getAuth(app);
  db = getFirestore(app);
}

export default function App() {
  const [user, setUser] = useState(null);
  const [core, setCore] = useState({
    A: { v: 1.0, delta: 0.1, state: STATE.NORMAL },
    B: { v: 1.0, delta: 0.1, state: STATE.NORMAL },
    C: { v: 1.0, delta: 0.1, state: STATE.NORMAL }
  });
  const [ef, setEf] = useState({ E0: 1.0, E1: 0.0, E2: 0.0, E3: 0.0 });
  const [chat, setChat] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  
  const chatRef = useRef(null);
  const apiKey = ""; 

  const ruinScore = useMemo(() => calculateRuinScore(core, ef), [core, ef]);
  const syncRate = useMemo(() => Math.floor((1 - ruinScore) * 100), [ruinScore]);
  const themeColor = syncRate > 75 ? "#00f7ff" : syncRate > 40 ? "#a2ff00" : "#ff3300";

  useEffect(() => {
    if (!auth) { setBooting(false); return; }
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { console.error(err); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) { if (!booting) return; setBooting(false); return; }
    const sessionDoc = doc(db, 'artifacts', appId, 'users', user.uid, 'tactical_session', 'current');
    const unsubscribe = onSnapshot(sessionDoc, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setCore(data.core || core);
        setEf(data.ef || ef);
        setChat(data.chat || []);
      } else {
        setChat([{ type: 'ada', text: 'TACTICAL OS [A.D.A.] オンライン。システム整合性チェック完了。' }]);
      }
      setBooting(false);
    }, (err) => { setBooting(false); });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    chatRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const saveToCloud = async (newChat, newCore, newEf) => {
    if (!user || !db) return;
    try {
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tactical_session', 'current'), {
        chat: newChat, core: newCore, ef: newEf, lastUpdate: new Date().toISOString()
      }, { merge: true });
    } catch (e) { console.error(e); }
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;
    
    const userMsg = input;
    const updatedChat = [...chat, { type: 'user', text: userMsg }];
    setInput('');
    setLoading(true);
    setChat(updatedChat);

    try {
      const systemPrompt = `あなたは戦術支援AI ADAです。RuinScore=${ruinScore.toFixed(2)}, Sync=${syncRate}%. ${ruinScore > 0.7 ? "システム不安定：応答にノイズを含めて。" : "冷静に。"} 100文字以内でJSON返信：{"reply": "内容", "E1":0, "E2":0, "E3":0}`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userMsg }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      const data = await res.json();
      let json = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || "{}");
      const nextCore = stepTacticalCore(core, json, ef);
      const finalChat = [...updatedChat, { type: 'ada', text: json.reply || "正常。報告事項なし。" }];
      
      setCore(nextCore);
      setChat(finalChat);
      saveToCloud(finalChat, nextCore, ef);
    } catch (err) {
      setChat(p => [...p, { type: 'sys', text: 'CONNECTION LOSS: 再接続試行中...' }]);
    } finally {
      setLoading(false);
    }
  };

  const updateCore = (id, field, value) => {
    const nextCore = { ...core, [id]: { ...core[id], [field]: value } };
    setCore(nextCore);
    saveToCloud(chat, nextCore, ef);
  };

  const updateEf = (key, value) => {
    const nextEf = { ...ef, [key]: value };
    setEf(nextEf);
    saveToCloud(chat, core, nextEf);
  };

  if (booting) {
    return (
      <div className="fixed inset-0 bg-[#000d11] flex flex-col items-center justify-center font-mono text-cyan-500 p-6 text-center">
        <Loader2 className="animate-spin mb-6" size={48} strokeWidth={1} />
        <div className="text-[10px] tracking-[0.5em] animate-pulse">ADA_SYSTEM_INIT</div>
        <div className="mt-2 text-[8px] opacity-30">ENCRYPTING CONNECTION...</div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 bg-[#000d11] text-cyan-400 font-mono flex flex-col overflow-hidden select-none transition-colors duration-1000 ${ruinScore > 0.8 ? 'bg-[#1a0505]' : ''}`}>
      {/* Visual Overlays */}
      <div className="absolute inset-0 grid-bg opacity-10 pointer-events-none" />
      {ruinScore > 0.6 && <div className="absolute inset-0 pointer-events-none z-50 opacity-20 bg-red-600 animate-pulse mix-blend-overlay" />}
      
      {/* HEADER: Mobile Optimized */}
      <header className="h-14 md:h-16 shrink-0 border-b border-cyan-800/40 bg-black/80 flex items-center px-4 md:px-6 justify-between z-40 backdrop-blur-lg">
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg border transition-all ${ruinScore > 0.7 ? 'border-red-500 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'border-cyan-500/30 text-cyan-400'}`}>
             <Shield size={20} className={ruinScore > 0.7 ? 'animate-pulse' : ''} />
          </div>
          <div className="block">
            <div className="text-[14px] md:text-lg font-black tracking-widest uppercase leading-none flex items-center gap-1.5">
              <span className="text-white">A.D.A.</span>
              <span className="text-cyan-500/80">TACTICAL</span>
            </div>
            <div className="text-[7px] md:text-[8px] opacity-40 leading-none tracking-[0.2em] mt-0.5">ABC_MOD: TRIAL_PHASE // STABLE_BUILD</div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 md:gap-8">
          <div className="flex flex-col items-end">
            <div className="text-[7px] opacity-40 uppercase">Sync_Rate</div>
            <div className="text-lg md:text-xl font-black italic tabular-nums leading-none" style={{ color: themeColor }}>{syncRate}%</div>
          </div>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2.5 rounded-xl transition-all active:scale-90 ${showSettings ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,247,255,0.4)]' : 'bg-cyan-900/20 text-cyan-600'}`}
          >
            {showSettings ? <X size={20} /> : <Database size={20} />}
          </button>
        </div>
      </header>

      {/* COMPACT CORE STATUS: Mobile Responsive Grid */}
      <div className="h-10 md:h-12 shrink-0 bg-black/40 border-b border-cyan-900/20 flex items-center px-4 md:px-6 gap-3 md:gap-8 z-30">
        {['A', 'B', 'C'].map(id => (
          <div key={id} className="flex items-center gap-2 flex-1">
            <span className="text-[8px] font-bold opacity-30">{id}</span>
            <div className="flex-1 h-0.5 md:h-1 bg-cyan-950/50 rounded-full overflow-hidden">
              <div className="h-full transition-all duration-1000" style={{ width: `${(core[id].v / 2) * 100}%`, backgroundColor: themeColor }} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 relative flex overflow-hidden">
        {/* CHAT LOG: Enhanced Readability */}
        <main className={`flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 scrollbar-hide transition-all duration-500 ${showSettings ? 'opacity-5 blur-md scale-95 pointer-events-none' : 'opacity-100'}`}>
          {chat.map((m, i) => (
            <div key={i} className={`flex flex-col ${m.type === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2`}>
              <div className={`max-w-[88%] md:max-w-[80%] px-4 py-2.5 text-[14px] md:text-[15px] border leading-relaxed relative ${
                m.type === 'user' 
                  ? 'bg-cyan-900/10 border-cyan-800/30 rounded-2xl rounded-tr-none text-cyan-50 shadow-sm' 
                  : m.type === 'sys' 
                  ? 'border-none text-[8px] opacity-30 text-center w-full my-2 tracking-[0.2em] uppercase' 
                  : 'bg-black/60 border-cyan-700/30 rounded-2xl rounded-tl-none border-l-4 shadow-xl'
              }`} style={m.type === 'ada' ? { borderLeftColor: themeColor } : {}}>
                {m.type === 'ada' && <div className="text-[7px] opacity-30 mb-1 font-bold tracking-widest">A.D.A._REPLY</div>}
                {m.text}
              </div>
            </div>
          ))}
          <div ref={chatRef} className="h-4" />
        </main>

        {/* SETTINGS DRAWER: Fully Overlayed on Mobile */}
        <aside className={`absolute inset-y-0 right-0 w-full md:w-80 bg-[#00080a]/98 border-l border-cyan-900/50 z-50 p-6 overflow-y-auto transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) transform ${showSettings ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-cyan-900/30">
            <div className="flex items-center gap-3">
              <Terminal size={16} className="text-cyan-400" />
              <span className="text-[10px] font-black tracking-widest uppercase">System_Console</span>
            </div>
            <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-cyan-900/30 rounded-full transition-colors active:rotate-90">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-10">
            {/* EF CONTROLS */}
            <section className="space-y-6">
               <div className="flex items-center gap-2 text-cyan-700">
                  <Radio size={14} strokeWidth={3} />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Environment (EF)</span>
               </div>
               <div className="grid grid-cols-1 gap-6">
                  {[
                    { key: 'E0', label: 'Stability (E0)' },
                    { key: 'E1', label: 'Surroundings (E1)' },
                    { key: 'E2', label: 'Evaluation (E2)' },
                    { key: 'E3', label: 'Noise_Lvl (E3)' }
                  ].map(f => (
                    <div key={f.key} className="space-y-3">
                       <div className="flex justify-between text-[9px] font-bold">
                          <span className="opacity-40">{f.label}</span>
                          <span className="text-cyan-400 tabular-nums">{ef[f.key].toFixed(1)}</span>
                       </div>
                       <input 
                         type="range" min={f.key === 'E0' ? "0" : "-1"} max="1" step="0.1"
                         value={ef[f.key]} 
                         onChange={(e) => updateEf(f.key, parseFloat(e.target.value))}
                         className="w-full h-8 bg-transparent appearance-none cursor-pointer touch-none custom-range"
                       />
                    </div>
                  ))}
               </div>
            </section>

            {/* CORE VELOCITY */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 text-cyan-700">
                  <Activity size={14} strokeWidth={3} />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Core Velocity</span>
               </div>
              <div className="space-y-4">
                {['A', 'B', 'C'].map(id => (
                  <div key={id} className="p-4 bg-cyan-950/20 border border-cyan-900/30 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-black">
                      <span className="text-cyan-400 tracking-tighter">{id}_MODULE</span>
                      <span className={`text-[7px] tabular-nums ${core[id].v > 1.5 ? 'text-red-500' : 'text-cyan-700'}`}>v.{core[id].v.toFixed(2)}</span>
                    </div>
                    <input 
                      type="range" min="0" max="2" step="0.05" 
                      value={core[id].v} 
                      onChange={(e) => updateCore(id, 'v', parseFloat(e.target.value))}
                      className="w-full h-6 bg-transparent appearance-none cursor-pointer custom-range"
                    />
                  </div>
                ))}
              </div>
            </section>

            <button 
              onClick={() => {
                setCore({
                  A: { v: 1.0, delta: 0.1, state: STATE.NORMAL },
                  B: { v: 1.0, delta: 0.1, state: STATE.NORMAL },
                  C: { v: 1.0, delta: 0.1, state: STATE.NORMAL }
                });
                setEf({ E0: 1.0, E1: 0.0, E2: 0.0, E3: 0.0 });
                setShowSettings(false);
              }}
              className="w-full flex items-center justify-center gap-3 py-4 bg-red-950/20 border border-red-900/40 text-red-500 text-[10px] font-black hover:bg-red-900/40 transition-all uppercase tracking-widest rounded-2xl active:scale-[0.98]"
            >
              <RefreshCw size={14} />
              Perform Cold Reset
            </button>
          </div>
        </aside>
      </div>

      {/* INPUT AREA: Floating Style for Mobile */}
      <footer className="shrink-0 p-4 md:p-6 bg-black/95 border-t border-cyan-900/40 z-40 backdrop-blur-xl pb-[max(1rem,env(safe-area-inset-bottom))]">
        <form onSubmit={handleSend} className="flex gap-2.5 max-w-4xl mx-auto h-12 md:h-14" autoComplete="off">
          <div className="flex-1 relative group">
            <input 
              type="text" 
              value={input} 
              onChange={e => setInput(e.target.value)}
              placeholder={loading ? "PROFILING..." : "ENTER COMMAND"}
              className="w-full h-full bg-cyan-950/10 border border-cyan-800/40 px-5 text-[16px] text-cyan-50 focus:outline-none focus:border-cyan-400 focus:bg-cyan-900/5 rounded-2xl transition-all placeholder:text-[10px] placeholder:tracking-[0.3em] placeholder:opacity-20"
              disabled={loading || showSettings}
            />
            {loading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                 <Loader2 size={16} className="animate-spin text-cyan-400 opacity-50" />
              </div>
            )}
          </div>
          <button 
            type="submit"
            disabled={loading || !input.trim() || showSettings} 
            className="w-12 md:w-16 h-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center hover:bg-cyan-500/20 active:scale-90 transition-all rounded-2xl text-cyan-400 disabled:opacity-20"
          >
            <Send size={20}/>
          </button>
        </form>
      </footer>

      <style>{`
        .grid-bg { 
          background-image: linear-gradient(rgba(0, 247, 255, 0.03) 1px, transparent 1px), 
                            linear-gradient(90deg, rgba(0, 247, 255, 0.03) 1px, transparent 1px); 
          background-size: 30px 30px; 
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        
        .custom-range {
          -webkit-appearance: none; appearance: none;
          background: rgba(0, 247, 255, 0.05);
          height: 4px; border-radius: 2px;
          outline: none;
        }
        .custom-range::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 24px; height: 24px;
          background: #00f7ff; cursor: pointer;
          border-radius: 8px; border: 3px solid #000;
          box-shadow: 0 0 10px rgba(0, 247, 255, 0.5);
        }
        
        @media (max-width: 480px) {
          .custom-range::-webkit-slider-thumb {
            width: 32px; height: 32px;
          }
        }

        @keyframes scan { from { transform: translateY(-10px); opacity: 0; } 50% { opacity: 0.5; } to { transform: translateY(50px); opacity: 0; } }
      `}</style>
    </div>
  );
}