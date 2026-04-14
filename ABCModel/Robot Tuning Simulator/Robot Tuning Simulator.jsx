import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Power, Activity, Crosshair, ShieldAlert, Cpu } from 'lucide-react';

// ABCモデルの内部ロジックをシミュレーションするフック
const useMechaCoreLogic = (inputA, inputB, inputC, inputE) => {
  const [systemState, setSystemState] = useState({
    vA: 0, vB: 0, vC: 0,
    stateA: 0, stateB: 0, stateC: 0, // 0: Normal, 1: Zero(機能停止), 2: Runaway(暴走)
    ruinScore: 0,
    logs: []
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setSystemState(prev => {
        let logs = [];
        const addLog = (msg) => {
          logs.push(`[${new Date().toLocaleTimeString('en-US', { hour12: false, fractionalSecondDigits: 1 })}] ${msg}`);
          if (logs.length > 5) logs.shift();
        };

        // 1. 外部負荷(E)の投影 (EF→Core)
        let nextVA = inputA - 0.5 * inputE;
        let nextVB = inputB + 0.5 * inputE;
        let nextVC = inputC + 0.5 * inputE;

        // クランプ [0, 2]
        nextVA = Math.max(0, Math.min(2, nextVA));
        nextVB = Math.max(0, Math.min(2, nextVB));
        nextVC = Math.max(0, Math.min(2, nextVC));

        // 2. 状態(State)の初期判定
        let sA = 0; let sB = 0; let sC = 0;
        if (nextVA >= 1.6) sA = 2; // Runaway
        else if (nextVA <= 0.3) sA = 1; // Zero

        if (nextVB >= 1.6) sB = 2; // Runaway
        if (nextVC >= 1.6) sC = 2; // Runaway

        // 3. 相互作用ルール (TR-1 ~ TR-3)
        // TR-1: C→A (戦術AI暴走 + 出力低下 -> ジェネレーター強制停止)
        if (sC === 2 && nextVA <= 1.0) {
          sA = 1;
          if (prev.stateA !== 1) addLog("CRITICAL: 戦術AIが過剰防衛。ジェネレーターを強制停止(Zero)。");
        }

        // TR-2: B→C (制御過剰 + ジェネレーター停止 -> 戦術AI暴走)
        if (sB === 2 && sA === 1) {
          sC = 2;
          if (prev.stateC !== 2) addLog("WARNING: 制御干渉により戦術AIがパニック状態(Runaway)。");
        }

        // TR-3: A→B (高出力で安定 -> 制御系が安定化)
        if (sA === 0 && nextVA >= 1.5) {
          nextVB = Math.max(0, nextVB - 0.3); // 減衰
          if (nextVB < 1.6) sB = 0;
        }

        // 4. 機体崩壊危険度 (RuinScore) の計算 [0~6]
        // w_vA=-1 (出力が高いほどスコア低下=安全), w_vB=1, w_vC=1
        const calcScore = (v, state, w) => {
          let score = w * v + (state === 2 ? 2 : (state === 1 ? 1 : 0));
          return Math.max(0, score);
        };

        let rA = calcScore(nextVA, sA, -1);
        if (sA === 1) rA = Math.max(rA, 3); // Zero-Guard (停止時は最低R1レベルの危険度)
        if (sA === 2 && nextVA > 1.8) rA = Math.max(rA, 5); // 強制境界(暴走MAX)

        let rB = calcScore(nextVB, sB, 1);
        let rC = calcScore(nextVC, sC, 1);
        let rE = inputE * 2;

        let totalRuin = Math.max(rA, rB, rC, rE);
        totalRuin = Math.min(6, Math.round(totalRuin * 10) / 10); // 0.0 ~ 6.0

        if (totalRuin >= 5 && prev.ruinScore < 5) addLog("DANGER: 機体崩壊の危機！直ちに設定を見直せ！");
        if (totalRuin < 2 && prev.ruinScore >= 2) addLog("INFO: システム安定。機体状態良好。");

        return {
          vA: nextVA, vB: nextVB, vC: nextVC,
          stateA: sA, stateB: sB, stateC: sC,
          ruinScore: totalRuin,
          logs: logs.length > 0 ? [...prev.logs, ...logs].slice(-5) : prev.logs
        };
      });
    }, 500);

    return () => clearInterval(timer);
  }, [inputA, inputB, inputC, inputE]);

  return systemState;
};

// --- SVG Robot Components ---
const RobotSVG = ({ state }) => {
  const { stateA, stateB, stateC, ruinScore } = state;

  const getColor = (s) => {
    if (s === 1) return '#4B5563'; // Zero: 停止 (グレー)
    if (s === 2) return '#EF4444'; // Runaway: 暴走 (赤)
    return '#06B6D4'; // Normal: 正常 (シアン)
  };

  const getGlow = (s) => s === 2 ? 'url(#glow-danger)' : (s === 0 ? 'url(#glow-normal)' : 'none');
  const getAnimation = (s) => s === 2 ? 'animate-pulse origin-center' : '';

  const coreColor = getColor(stateA);
  const armorColor = getColor(stateB);
  const sensorColor = getColor(stateC);

  const isCritical = ruinScore >= 5;

  return (
    <div className={`relative w-full h-full flex items-center justify-center transition-all duration-500 ${isCritical ? 'scale-[1.02]' : ''}`}>
      <svg viewBox="0 0 400 400" className={`w-full max-w-md h-auto drop-shadow-2xl ${isCritical ? 'animate-shake' : 'animate-float'}`}>
        <defs>
          <filter id="glow-normal" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-danger" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComponentTransfer in="blur" result="glow">
              <feFuncA type="linear" slope="2"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="glow"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Aura / Background Effect */}
        {isCritical && (
          <circle cx="200" cy="200" r="150" fill="#EF4444" opacity="0.1" className="animate-ping origin-center" />
        )}

        {/* --- Armor/Control (B: Aesthetic) --- */}
        <g id="armor" className={`transition-colors duration-500 ${getAnimation(stateB)}`} style={{ transformBox: 'fill-box' }}>
          {/* Shoulders */}
          <path d="M 90 120 L 130 100 L 150 120 L 110 160 Z" fill="#1F2937" stroke={armorColor} strokeWidth="4" filter={getGlow(stateB)} />
          <path d="M 310 120 L 270 100 L 250 120 L 290 160 Z" fill="#1F2937" stroke={armorColor} strokeWidth="4" filter={getGlow(stateB)} />
          {/* Arms */}
          <rect x="70" y="150" width="30" height="80" rx="5" fill="#111827" stroke={armorColor} strokeWidth="3" />
          <rect x="300" y="150" width="30" height="80" rx="5" fill="#111827" stroke={armorColor} strokeWidth="3" />
          {/* Legs */}
          <path d="M 150 250 L 170 350 L 130 360 L 140 250 Z" fill="#111827" stroke={armorColor} strokeWidth="3" />
          <path d="M 250 250 L 230 350 L 270 360 L 260 250 Z" fill="#111827" stroke={armorColor} strokeWidth="3" />
        </g>

        {/* --- Body/Core (A: Authenticity) --- */}
        <g id="body" className={`transition-colors duration-500 ${getAnimation(stateA)}`} style={{ transformBox: 'fill-box' }}>
          {/* Chest */}
          <path d="M 150 100 L 250 100 L 270 160 L 200 200 L 130 160 Z" fill="#111827" stroke="#374151" strokeWidth="4" />
          {/* Core Engine */}
          <circle cx="200" cy="140" r="25" fill={coreColor} filter={getGlow(stateA)} />
          <circle cx="200" cy="140" r="10" fill="#FFF" opacity="0.8" />
          {/* Vents */}
          <rect x="150" y="110" width="20" height="30" fill="#374151" transform="skewY(-15)" />
          <rect x="230" y="110" width="20" height="30" fill="#374151" transform="skewY(15)" />
          {/* Waist */}
          <path d="M 170 200 L 230 200 L 240 250 L 160 250 Z" fill="#1F2937" stroke="#4B5563" strokeWidth="3" />
        </g>

        {/* --- Head/Sensor (C: Meta) --- */}
        <g id="head" className={`transition-colors duration-500 ${getAnimation(stateC)}`} style={{ transformBox: 'fill-box' }}>
          {/* Base */}
          <path d="M 180 90 L 220 90 L 210 50 L 190 50 Z" fill="#1F2937" stroke="#4B5563" strokeWidth="3" />
          {/* V-Antenna */}
          <path d="M 200 60 L 150 20 L 170 70 Z" fill="#FBBF24" filter="url(#glow-normal)" />
          <path d="M 200 60 L 250 20 L 230 70 Z" fill="#FBBF24" filter="url(#glow-normal)" />
          {/* Main Camera / Eyes */}
          <rect x="185" y="70" width="30" height="8" fill={sensorColor} filter={getGlow(stateC)} />
          <polygon points="200,50 195,65 205,65" fill={sensorColor} filter={getGlow(stateC)}/>
        </g>
      </svg>
    </div>
  );
};

export default function App() {
  const [inputs, setInputs] = useState({
    A: 1.0, // ジェネレーター出力
    B: 0.5, // スタビライザー制御
    C: 0.5, // 戦術AIセンサー
    E: 0.0  // 外部環境負荷
  });

  const state = useMechaCoreLogic(inputs.A, inputs.B, inputs.C, inputs.E);

  const handleSlider = (key, value) => {
    setInputs(prev => ({ ...prev, [key]: parseFloat(value) }));
  };

  const getStatusText = (s) => {
    if (s === 1) return <span className="text-gray-400 font-bold">SYSTEM DOWN</span>;
    if (s === 2) return <span className="text-red-500 font-bold animate-pulse">RUNAWAY!</span>;
    return <span className="text-cyan-400 font-bold">NORMAL</span>;
  };

  // 危険度ゲージの計算 (0~6 を 0~100% に)
  const dangerPercent = Math.min(100, (state.ruinScore / 6) * 100);
  const isDanger = state.ruinScore >= 4.4;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-4 md:p-8 select-none">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes shake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(2px, 2px) rotate(1deg); }
          50% { transform: translate(-2px, -2px) rotate(-1deg); }
          75% { transform: translate(-2px, 2px) rotate(0deg); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-shake { animation: shake 0.5s ease-in-out infinite; }
        input[type=range] { accent-color: #06B6D4; }
      `}</style>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Panel: Visualizer */}
        <div className="relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-6 flex flex-col items-center min-h-[500px]">
          {isDanger && (
            <div className="absolute inset-0 border-4 border-red-500/50 rounded-2xl pointer-events-none animate-pulse z-10" />
          )}
          
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
            <div>
              <h1 className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                MECHA TUNING OS
              </h1>
              <p className="text-xs text-slate-500 uppercase tracking-widest">Core Architecture Simulator</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400 uppercase">SYS_TIME</div>
              <div className="font-mono text-sm">{new Date().toLocaleTimeString('en-US', { hour12: false })}</div>
            </div>
          </div>

          <RobotSVG state={state} />

          {/* Danger Level UI */}
          <div className="absolute bottom-6 left-6 right-6 z-10 bg-slate-950/80 backdrop-blur border border-slate-800 p-4 rounded-xl">
            <div className="flex justify-between items-end mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className={isDanger ? "text-red-500 animate-pulse" : "text-yellow-500"} size={20} />
                <span className="font-bold tracking-wider text-sm text-slate-300">機体崩壊危険度</span>
              </div>
              <div className="text-2xl font-black font-mono">
                <span className={isDanger ? "text-red-500" : "text-cyan-400"}>
                  {state.ruinScore.toFixed(1)}
                </span>
                <span className="text-sm text-slate-500"> / 6.0</span>
              </div>
            </div>
            <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${isDanger ? 'bg-red-500' : (dangerPercent > 50 ? 'bg-yellow-500' : 'bg-cyan-500')}`}
                style={{ width: `${dangerPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right Panel: Controls & Telemetry */}
        <div className="flex flex-col gap-6">
          
          {/* Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-slate-300 mb-6 flex items-center gap-2 border-b border-slate-800 pb-2">
              <Activity size={20} className="text-cyan-400"/>
              システムチューニング
            </h2>

            <div className="space-y-6">
              {/* Parameter A */}
              <div className="space-y-2 group">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-cyan-200 flex items-center gap-2">
                    <Power size={16} /> ジェネレーター出力 (動力)
                  </label>
                  <div className="font-mono text-sm">{inputs.A.toFixed(2)}</div>
                </div>
                <input 
                  type="range" min="0" max="2" step="0.1" value={inputs.A}
                  onChange={(e) => handleSlider('A', e.target.value)}
                  className="w-full cursor-pointer opacity-80 group-hover:opacity-100 transition-opacity"
                />
                <p className="text-xs text-slate-500">機体の生命線。出力を上げると安定するが、制御を超えると暴走する。</p>
              </div>

              {/* Parameter B */}
              <div className="space-y-2 group">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-blue-200 flex items-center gap-2">
                    <ShieldAlert size={16} /> スタビライザー制御 (装甲/姿勢)
                  </label>
                  <div className="font-mono text-sm">{inputs.B.toFixed(2)}</div>
                </div>
                <input 
                  type="range" min="0" max="2" step="0.1" value={inputs.B}
                  onChange={(e) => handleSlider('B', e.target.value)}
                  className="w-full cursor-pointer opacity-80 group-hover:opacity-100 transition-opacity"
                />
                <p className="text-xs text-slate-500">機体を抑え込む力。強すぎるとAIに干渉し、システム全体を硬直させる。</p>
              </div>

              {/* Parameter C */}
              <div className="space-y-2 group">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-yellow-200 flex items-center gap-2">
                    <Crosshair size={16} /> 戦術AIセンサー (監視/予測)
                  </label>
                  <div className="font-mono text-sm">{inputs.C.toFixed(2)}</div>
                </div>
                <input 
                  type="range" min="0" max="2" step="0.1" value={inputs.C}
                  onChange={(e) => handleSlider('C', e.target.value)}
                  className="w-full cursor-pointer opacity-80 group-hover:opacity-100 transition-opacity"
                />
                <p className="text-xs text-slate-500">周囲の状況と機体を監視。過敏になると強制的に出力を遮断してしまう。</p>
              </div>

              <div className="border-t border-slate-800 my-4" />

              {/* Parameter E */}
              <div className="space-y-2 group p-4 bg-slate-950 rounded-xl border border-red-900/30">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-red-300 flex items-center gap-2">
                    <Cpu size={16} /> 外部環境負荷 (被弾/ノイズ)
                  </label>
                  <div className="font-mono text-sm">{inputs.E.toFixed(2)}</div>
                </div>
                <input 
                  type="range" min="0" max="2" step="0.1" value={inputs.E}
                  onChange={(e) => handleSlider('E', e.target.value)}
                  className="w-full cursor-pointer opacity-80 group-hover:opacity-100 transition-opacity accent-red-500"
                />
                <p className="text-xs text-slate-500">外部からのストレス。出力低下や、制御・センサーの誤作動を引き起こす。</p>
              </div>
            </div>
          </div>

          {/* Telemetry Monitor */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex-1 flex flex-col">
            <h2 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest border-b border-slate-800 pb-2">
              Telemetrics Data
            </h2>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-950 p-3 rounded-lg text-center border border-slate-800">
                <div className="text-xs text-slate-500 mb-1">動力炉</div>
                <div>{getStatusText(state.stateA)}</div>
                <div className="font-mono text-xs mt-1 text-slate-400">LV: {state.vA.toFixed(2)}</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg text-center border border-slate-800">
                <div className="text-xs text-slate-500 mb-1">制御系</div>
                <div>{getStatusText(state.stateB)}</div>
                <div className="font-mono text-xs mt-1 text-slate-400">LV: {state.vB.toFixed(2)}</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg text-center border border-slate-800">
                <div className="text-xs text-slate-500 mb-1">戦術AI</div>
                <div>{getStatusText(state.stateC)}</div>
                <div className="font-mono text-xs mt-1 text-slate-400">LV: {state.vC.toFixed(2)}</div>
              </div>
            </div>

            {/* System Logs */}
            <div className="bg-black/50 rounded-lg p-3 font-mono text-xs overflow-y-auto flex-1 border border-slate-800 min-h-[120px]">
              {state.logs.length === 0 ? (
                <div className="text-slate-600 italic">Waiting for system events...</div>
              ) : (
                state.logs.map((log, i) => (
                  <div key={i} className={`mb-1 ${log.includes('CRITICAL') || log.includes('DANGER') ? 'text-red-400' : (log.includes('WARNING') ? 'text-yellow-400' : 'text-slate-400')}`}>
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}