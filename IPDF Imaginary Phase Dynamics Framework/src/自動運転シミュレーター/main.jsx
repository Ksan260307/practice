import React, { useEffect, useRef, useState } from 'react';
import { ShieldAlert, Brain, Expand, Info, X, Zap } from 'lucide-react';

export default function App() {
  const [params, setParams] = useState({ risk: 70, uncertainty: 50, optionality: 50 });
  const [showInfo, setShowInfo] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Reactのレンダリングサイクルから切り離して高速処理するためのRef
  const paramsRef = useRef(params);
  const simState = useRef({
    agent: { x: 0, y: 0, speed: 4 },
    obstacles: [],
    cameraY: 0,
    bestTrajectory: [],
    initialized: false,
    gameOver: false,
    resetFlag: false,
    width: 0,
    height: 0
  });

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  const handleRestart = () => {
    if (isGameOver) {
      simState.current.resetFlag = true;
      setIsGameOver(false);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const initSimulation = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      canvas.width = width;
      canvas.height = height;
      
      const state = simState.current;
      state.width = width;
      state.height = height;
      
      if (!state.initialized || state.resetFlag) {
        state.agent.x = width / 2;
        state.agent.y = 0;
        state.agent.speed = 4;
        state.cameraY = 0;
        state.bestTrajectory = [];
        state.gameOver = false;
        state.resetFlag = false;
        
        // 障害物の初期配置
        state.obstacles = [
          { x: width * 0.3, y: -200, vx: 0.5, vy: -1.5, size: 15, uncertainty: 0.8 },
          { x: width * 0.7, y: -450, vx: -0.3, vy: -1.0, size: 18, uncertainty: 0.5 },
          { x: width * 0.5, y: -700, vx: 2.0, vy: -0.2, size: 12, uncertainty: 1.5 },
          { x: width * 0.2, y: -900, vx: 0.1, vy: -2.0, size: 20, uncertainty: 0.3 }
        ];
        state.initialized = true;
      }
    };

    const handleResize = () => {
      initSimulation();
    };
    window.addEventListener('resize', handleResize);
    initSimulation();

    const render = () => {
      const state = simState.current;
      const p = paramsRef.current;
      const w = state.width;
      const h = state.height;

      if (state.resetFlag) {
        initSimulation();
      }

      const HORIZON = 24; 
      const TIME_STEP = 3;

      if (!state.gameOver) {
        const wRisk = (p.risk / 50) * 3.0; 
        const wOpt = (p.optionality / 50) * 0.5; 
        const wUnc = (p.uncertainty / 50) * 0.08; 

        // 1. 障害物の更新
        state.obstacles.forEach(obs => {
          obs.vx += (Math.random() - 0.5) * 0.5;
          obs.vx *= 0.95;
          obs.x += obs.vx;
          obs.y += obs.vy;

          if (obs.x < 20) { obs.x = 20; obs.vx *= -1; }
          if (obs.x > w - 20) { obs.x = w - 20; obs.vx *= -1; }

          if (obs.y - state.cameraY > h + 100) {
            obs.y = state.cameraY - h - Math.random() * 500;
            obs.x = 20 + Math.random() * (w - 40);
            obs.uncertainty = 0.5 + Math.random() * 1.5;
          }
        });

        // 2. スピード制御
        const forwardUncertainty = state.obstacles
          .filter(o => o.y < state.agent.y)
          .reduce((sum, o) => sum + o.uncertainty, 0);
        const targetSpeed = 5.0 * Math.exp(-wUnc * (forwardUncertainty / 4));
        state.agent.speed += (targetSpeed - state.agent.speed) * 0.1;

        // 3. IPDF ロジック：意思決定
        let bestVx = 0;
        let maxScore = -Infinity;
        let bestPath = [];

        for (let aVx = -5; aVx <= 5; aVx += 1.25) {
          let testX = state.agent.x;
          let testY = state.agent.y;
          let riskScore = 0;
          let optScore = 0;
          let path = [];

          for (let t = 1; t <= HORIZON; t += TIME_STEP) {
            testX += aVx * TIME_STEP;
            testY -= state.agent.speed * TIME_STEP;
            path.push({ x: testX, y: testY });

            if (testX < 20 || testX > w - 20) riskScore += 100;

            state.obstacles.forEach(obs => {
              let obsFutX = obs.x + obs.vx * t;
              let obsFutY = obs.y + obs.vy * t;
              let spread = obs.size + obs.uncertainty * t * 1.5;
              let dist = Math.hypot(testX - obsFutX, testY - obsFutY);
              
              if (dist < spread * 2) {
                riskScore += Math.exp(-Math.pow(dist / spread, 2)) * 10;
              }
              optScore += Math.min(dist, 150) * 0.01;
            });
          }
          let centerDist = Math.abs(testX - w / 2);
          optScore -= centerDist * 0.05;

          let score = -wRisk * riskScore + wOpt * optScore;
          if (score > maxScore) {
            maxScore = score;
            bestVx = aVx;
            bestPath = path;
          }
        }

        // 4. 状態の更新
        state.agent.x += bestVx;
        if (state.agent.x < 20) state.agent.x = 20;
        if (state.agent.x > w - 20) state.agent.x = w - 20;
        state.agent.y -= state.agent.speed;
        state.bestTrajectory = bestPath;
        state.cameraY = state.agent.y - h * 0.8;

        // 5. 衝突判定
        const agentRadius = 12;
        for (let i = 0; i < state.obstacles.length; i++) {
          const obs = state.obstacles[i];
          const dist = Math.hypot(state.agent.x - obs.x, state.agent.y - obs.y);
          if (dist < obs.size + agentRadius) {
            state.gameOver = true;
            setIsGameOver(true);
            break;
          }
        }
      }

      // 描画
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 4;
      ctx.setLineDash([30, 30]);
      ctx.beginPath();
      let lineOffsetY = -(state.cameraY % 60);
      ctx.moveTo(w / 2, lineOffsetY - 60);
      ctx.lineTo(w / 2, h + 60);
      ctx.stroke();
      ctx.setLineDash([]);

      state.obstacles.forEach(obs => {
        for (let t = 1; t <= HORIZON; t += TIME_STEP) {
          let px = obs.x + obs.vx * t;
          let py = obs.y + obs.vy * t - state.cameraY;
          let spread = obs.size + obs.uncertainty * t * 1.5;
          ctx.beginPath();
          ctx.arc(px, py, spread, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(239, 68, 68, ${0.06 - t * 0.002})`;
          ctx.fill();
        }
      });

      if (state.bestTrajectory.length > 0) {
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(state.agent.x, state.agent.y - state.cameraY);
        state.bestTrajectory.forEach(pt => ctx.lineTo(pt.x, pt.y - state.cameraY));
        ctx.stroke();
      }

      state.obstacles.forEach(obs => {
        ctx.beginPath();
        ctx.arc(obs.x, obs.y - state.cameraY, obs.size, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      ctx.beginPath();
      ctx.moveTo(state.agent.x, state.agent.y - state.cameraY - 15);
      ctx.lineTo(state.agent.x - 10, state.agent.y - state.cameraY + 10);
      ctx.lineTo(state.agent.x + 10, state.agent.y - state.cameraY + 10);
      ctx.closePath();
      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-slate-950 text-slate-200 font-sans">
      <header className="flex justify-between items-center p-4 bg-slate-900/80 backdrop-blur border-b border-slate-800 z-10">
        <div className="flex items-center gap-2">
          <Zap className="text-cyan-400" size={24} />
          <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">IPDF Simulator</h1>
        </div>
        <button onClick={() => setShowInfo(true)} className="p-2 rounded-full bg-slate-800 text-cyan-400 hover:bg-slate-700 transition-colors">
          <Info size={20} />
        </button>
      </header>

      <div className={`flex-1 relative ${isGameOver ? 'cursor-pointer' : ''}`} ref={containerRef} onClick={handleRestart}>
        <canvas ref={canvasRef} className="absolute inset-0 block" style={{ touchAction: 'none' }} />
        <div className="absolute top-4 left-4 bg-slate-900/60 backdrop-blur px-3 py-1 rounded-full text-xs font-mono text-cyan-300 border border-slate-700">
          SPEED: {(simState.current.agent.speed * 10).toFixed(0)} km/h
        </div>
        {isGameOver && (
          <div className="absolute inset-0 bg-red-950/60 backdrop-blur-sm flex flex-col items-center justify-center z-20">
            <ShieldAlert size={64} className="text-red-500 mb-4 animate-bounce" />
            <h2 className="text-4xl font-bold text-white mb-2 tracking-widest drop-shadow-lg">CRASH</h2>
            <p className="text-cyan-200 animate-pulse bg-slate-900/80 px-6 py-3 rounded-full mt-6 border border-cyan-500/50 font-bold shadow-lg">画面タップで再開</p>
          </div>
        )}
      </div>

      <div className="bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 p-5 space-y-5 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-10 pb-8">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2 text-red-400"><ShieldAlert size={16} /><span className="font-semibold">危険の回避力</span></div>
            <span className="text-slate-400 text-xs text-right">赤いモヤモヤをどれだけ嫌がるか</span>
          </div>
          <input type="range" min="0" max="100" value={params.risk} onChange={(e) => setParams(p => ({ ...p, risk: Number(e.target.value) }))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2 text-yellow-400"><Brain size={16} /><span className="font-semibold">迷いのブレーキ</span></div>
            <span className="text-slate-400 text-xs text-right">相手の動きが読めない時どれだけ減速するか</span>
          </div>
          <input type="range" min="0" max="100" value={params.uncertainty} onChange={(e) => setParams(p => ({ ...p, uncertainty: Number(e.target.value) }))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2 text-green-400"><Expand size={16} /><span className="font-semibold">自由空間の確保</span></div>
            <span className="text-slate-400 text-xs text-right">次に逃げやすい広い場所を好むか</span>
          </div>
          <input type="range" min="0" max="100" value={params.optionality} onChange={(e) => setParams(p => ({ ...p, optionality: Number(e.target.value) }))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500" />
        </div>
      </div>

      {showInfo && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full relative">
            <button onClick={() => setShowInfo(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={24} /></button>
            <h2 className="text-xl font-bold mb-4 text-cyan-400">IPDFによる新解釈</h2>
            <div className="space-y-4 text-sm text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
              <p>従来の自動運転は「確定した事実（実数）」のみで計算していましたが、IPDFは「未来の可能性（虚数＝赤いモヤモヤ）」を考慮します。</p>
              <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                <h3 className="font-bold text-red-400 flex items-center gap-2 mb-1"><ShieldAlert size={16}/> 1. 未来の可視化</h3>
                <p className="text-xs">数秒後の不確実な広がりを事前に避けます。</p>
              </div>
              <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                <h3 className="font-bold text-yellow-400 flex items-center gap-2 mb-1"><Brain size={16}/> 2. 迷いを力に変える</h3>
                <p className="text-xs">予測がブレるほど自然に減速します。</p>
              </div>
              <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                <h3 className="font-bold text-green-400 flex items-center gap-2 mb-1"><Expand size={16}/> 3. 止まらない安全</h3>
                <p className="text-xs">常に「次の選択肢」が多い場所を選び続けます。</p>
              </div>
            </div>
            <button onClick={() => setShowInfo(false)} className="mt-6 w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold transition-colors">シミュレーションに戻る</button>
          </div>
        </div>
      )}
    </div>
  );
}