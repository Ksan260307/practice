import React, { useState, useEffect, useRef } from 'react';
import { Moon, Star, AlertTriangle, Coffee, Eye, EyeOff } from 'lucide-react';

// --- VIF Core Logic (バックエンド数理モデル) ---
class VIFController {
  constructor() {
    this.v = 0;           // 実効ベロシティ
    this.v_target = 0;    // 目標ベロシティ (UIからの入力)
    this.strength = 5;    // インパルス強度 (UIからの入力)
    this.fatigue = 0;     // 蓄積疲労
    this.quality = 1.0;   // 出力品質
    this.isBreakdown = false; // 破綻状態

    // システム定数
    this.alpha = 0.05;         // ベロシティの追従性（慣性）
    this.fatigueRate = 0.005;  // 疲労蓄積係数 (ゆっくり鑑賞できるよう大幅に軽減)
    this.recoveryRate = 2.0;   // 回復係数 (蓄積低下に合わせて調整)
    this.heatThreshold = 300;  // v * F の限界値（認知オーバーフロー閾値）
    this.maxFatigue = 80;      // 絶対的な疲労限界
    this.fatigueVelocityThreshold = 4; // 疲労が蓄積し始めるペースの閾値
  }

  update(dt) {
    // 破綻状態（クールダウン）の処理
    if (this.isBreakdown) {
      this.v_target = 0;
      this.v += this.alpha * (this.v_target - this.v);
      this.fatigue -= this.recoveryRate * 1.5 * dt; // ソフトリカバリ中は回復が少し早い
      this.quality = 0;

      // 疲労が抜けきったら復帰
      if (this.fatigue <= 0) {
        this.fatigue = 0;
        this.isBreakdown = false;
      }
      return;
    }

    // 通常状態のロジック
    // 1. ベロシティの慣性更新
    this.v += this.alpha * (this.v_target - this.v);
    
    // 2. 疲労と回復の計算
    if (this.v_target === 0 && this.v < 0.5) {
      // Recoveryモード (v=0)
      this.fatigue -= this.recoveryRate * dt;
      if (this.fatigue < 0) this.fatigue = 0;
    } else if (this.v >= this.fatigueVelocityThreshold) {
      // 稼働中: ペースが閾値(4)以上の時のみ疲労が蓄積される
      this.fatigue += (this.v * this.strength) * this.fatigueRate * dt;
    }

    // 3. 破綻（オーバーフロー）判定
    const currentHeat = this.v * this.fatigue;
    if (currentHeat > this.heatThreshold || this.fatigue > this.maxFatigue) {
      this.isBreakdown = true;
    }

    // 4. 品質の計算 (ベロシティと疲労に反比例)
    // 熟練度Sは固定値として省略
    const denominator = 1 + (0.05 * this.v) + (0.02 * this.fatigue);
    this.quality = Math.max(0, 1 / denominator);
  }
}

// --- メインコンポーネント ---
export default function App() {
  const canvasRef = useRef(null);
  const vifRef = useRef(new VIFController());
  
  // UI表示用のステート (ロジック状態を間引いて反映)
  const [uiState, setUiState] = useState({
    velocity: 0,
    strength: 5,
    quality: 100,
    fatigueLevel: 0,
    isBreakdown: false,
  });

  // UIの表示/非表示トグル用のステート
  const [showUI, setShowUI] = useState(true);

  const requestRef = useRef();
  const meteorsRef = useRef([]);
  const lastTimeRef = useRef(performance.now());

  // 流星クラス
  class Meteor {
    constructor(vif) {
      this.x = Math.random() * window.innerWidth * 1.5;
      this.y = -50;
      this.speed = 300 + Math.random() * 200 + (vif.v * 50);
      this.angle = Math.PI / 4 + (Math.random() * 0.1 - 0.05); // 約45度
      
      // VIFモデルのパラメータを視覚化に反映
      const q = vif.quality;
      this.length = (50 + vif.strength * 10) * (0.5 + q * 0.5); // 品質と強度に依存
      this.thickness = (1 + vif.strength * 0.3) * q;
      this.opacity = q * 0.8 + 0.2;
      
      // 品質が高いほど美しく(青〜紫)、低いほどくすむ(灰〜赤)
      const r = Math.floor(255 * (1 - q) + 100 * q);
      const g = Math.floor(200 * q);
      const b = Math.floor(255 * q + 100 * (1 - q));
      this.color = `rgba(${r}, ${g}, ${b}, ${this.opacity})`;
      
      this.active = true;
    }

    update(dt) {
      this.x -= Math.cos(this.angle) * this.speed * dt;
      this.y += Math.sin(this.angle) * this.speed * dt;
      if (this.y > window.innerHeight + 100 || this.x < -100) {
        this.active = false;
      }
    }

    draw(ctx) {
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(
        this.x + Math.cos(this.angle) * this.length,
        this.y - Math.sin(this.angle) * this.length
      );
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.thickness;
      ctx.lineCap = 'round';
      ctx.stroke();
      
      // 先頭の輝き（品質が高い時）
      if (this.opacity > 0.6) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.thickness * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.fill();
      }
    }
  }

  // アニメーションループ
  const animate = (time) => {
    const dt = (time - lastTimeRef.current) / 1000;
    lastTimeRef.current = time;
    const vif = vifRef.current;

    // VIFロジックの更新
    vif.update(dt);

    // キャンバス描画
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      // 疲労度に応じて空の色を少し赤く濁らせる
      const fatigueRatio = Math.min(1, vif.fatigue / vif.maxFatigue);
      const bgR = Math.floor(10 + fatigueRatio * 40);
      const bgG = Math.floor(15 - fatigueRatio * 10);
      const bgB = Math.floor(30 - fatigueRatio * 15);
      
      // 軌跡を残すための半透明クリア
      ctx.fillStyle = `rgba(${bgR}, ${bgG}, ${bgB}, 0.3)`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 流星の生成（ベロシティに比例）
      if (!vif.isBreakdown && vif.v > 0) {
        // v=10の時、1秒間に約10個生成されるような確率
        const spawnRate = vif.v * 1.0; 
        if (Math.random() < spawnRate * dt) {
          meteorsRef.current.push(new Meteor(vif));
        }
      }

      // 流星の更新と描画
      meteorsRef.current.forEach(m => {
        m.update(dt);
        m.draw(ctx);
      });
      // 画面外に出たものを削除
      meteorsRef.current = meteorsRef.current.filter(m => m.active);
    }

    // UI更新（約100msに1回程度に間引いて負荷軽減）
    if (time % 100 < 20) {
      setUiState({
        velocity: vif.v_target,
        strength: vif.strength,
        quality: Math.round(vif.quality * 100),
        // つかれ具合（v * f の限界、または絶対限界に対する割合）
        fatigueLevel: Math.min(100, Math.max(
          (vif.v * vif.fatigue / vif.heatThreshold) * 100,
          (vif.fatigue / vif.maxFatigue) * 100
        )),
        isBreakdown: vif.isBreakdown,
      });
    }

    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // UI入力ハンドラ
  const handleVelocityChange = (e) => {
    if (vifRef.current.isBreakdown) return;
    vifRef.current.v_target = parseFloat(e.target.value);
  };

  const handleStrengthChange = (e) => {
    if (vifRef.current.isBreakdown) return;
    vifRef.current.strength = parseFloat(e.target.value);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-900 text-white font-sans touch-none selection:bg-transparent">
      {/* Background Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block cursor-pointer"
        onClick={() => setShowUI(!showUI)}
      />

      {/* Breakdown (オーバーヒート) オーバーレイ */}
      {uiState.isBreakdown && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/40 backdrop-blur-sm z-20 transition-all duration-500">
          <AlertTriangle size={64} className="text-red-400 mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold text-red-200 mb-2">オーバーヒート！</h2>
          <p className="text-red-100/80 mb-6 text-center px-6">
            無理をして星を呼びすぎました。<br/>つかれが完全に抜けるまで休んでください。
          </p>
          <div className="w-48 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-red-500 transition-all duration-300"
              style={{ width: `${uiState.fatigueLevel}%` }}
            ></div>
          </div>
          <p className="text-xs text-red-300/60 mt-2">Recovery in progress...</p>
        </div>
      )}

      {/* UI Toggle Button */}
      <button 
        onClick={() => setShowUI(!showUI)}
        className="absolute top-4 right-4 z-30 p-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 rounded-full backdrop-blur-md transition-colors"
      >
        {showUI ? <EyeOff size={24} /> : <Eye size={24} />}
      </button>

      {/* Main UI Overlay */}
      <div className={`absolute inset-0 flex flex-col justify-between p-4 sm:p-6 pb-8 transition-opacity duration-500 ${showUI ? 'opacity-100 pointer-events-none' : 'opacity-0 pointer-events-none'}`}>
        
        {/* Header / Status Meters */}
        <div className={`flex flex-col gap-4 w-full max-w-md mx-auto z-10 mt-12 ${showUI ? 'pointer-events-auto' : 'pointer-events-none'}`}>
          {/* Quality Meter */}
          <div className="bg-slate-800/60 backdrop-blur-md p-4 rounded-2xl border border-slate-700/50 shadow-lg">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Star size={18} className={uiState.quality > 80 ? "text-yellow-300" : "text-slate-400"} />
                <span className="font-medium text-sm text-slate-200">星の美しさ</span>
              </div>
              <span className="text-sm font-bold">{uiState.quality}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full transition-all duration-300"
                style={{ 
                  width: `${uiState.quality}%`,
                  background: uiState.quality > 80 ? 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)' : 
                              uiState.quality > 40 ? '#60a5fa' : '#64748b'
                }}
              ></div>
            </div>
          </div>

          {/* Fatigue Meter */}
          <div className="bg-slate-800/60 backdrop-blur-md p-4 rounded-2xl border border-slate-700/50 shadow-lg">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Coffee size={18} className={uiState.fatigueLevel > 70 ? "text-red-400" : "text-slate-400"} />
                <span className="font-medium text-sm text-slate-200">つかれ具合</span>
              </div>
              <span className="text-sm font-bold text-slate-300">
                {uiState.velocity === 0 && uiState.fatigueLevel > 0 ? "回復中..." : `${Math.round(uiState.fatigueLevel)}%`}
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full transition-all duration-300"
                style={{ 
                  width: `${uiState.fatigueLevel}%`,
                  backgroundColor: uiState.fatigueLevel > 80 ? '#ef4444' : 
                                   uiState.fatigueLevel > 50 ? '#f59e0b' : '#34d399'
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className={`w-full max-w-md mx-auto z-10 bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-700/50 shadow-2xl ${showUI ? 'pointer-events-auto' : 'pointer-events-none'}`}>
          
          {/* Velocity Slider */}
          <div className="mb-8">
            <div className="flex justify-between items-end mb-4">
              <label className="font-bold text-lg text-slate-100 flex items-center gap-2">
                <Moon size={20} className="text-indigo-400"/>
                星を呼ぶペース
              </label>
              <span className="text-sm font-mono text-indigo-300 bg-indigo-900/30 px-2 py-1 rounded-md">
                {uiState.velocity === 0 ? "ひとやすみ" : `Lv. ${uiState.velocity}`}
              </span>
            </div>
            <input 
              type="range" 
              min="0" max="10" step="1"
              value={uiState.velocity}
              onChange={handleVelocityChange}
              disabled={uiState.isBreakdown}
              className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-2 px-1">
              <span>0 (休む)</span>
              <span>Lv.4以上で疲労</span>
              <span>速い</span>
            </div>
          </div>

          {/* Strength Slider */}
          <div>
            <div className="flex justify-between items-end mb-4">
              <label className="font-bold text-md text-slate-300">
                星の濃さ (願いの深さ)
              </label>
              <span className="text-sm font-mono text-pink-300 bg-pink-900/30 px-2 py-1 rounded-md">
                Lv. {uiState.strength}
              </span>
            </div>
            <input 
              type="range" 
              min="1" max="10" step="1"
              value={uiState.strength}
              onChange={handleStrengthChange}
              disabled={uiState.isBreakdown}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:accent-pink-400"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-2 px-1">
              <span>浅く</span>
              <span>深く</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}