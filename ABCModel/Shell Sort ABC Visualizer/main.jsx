import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend, AreaChart, Area 
} from 'recharts';
import { 
  Play, Pause, RotateCcw, ChevronRight, Info, AlertTriangle, 
  Settings2, Activity, Eye, Zap 
} from 'lucide-react';

const App = () => {
  // --- Constants & Config ---
  const ARRAY_SIZE = 20;
  const INITIAL_ARRAY = useMemo(() => 
    Array.from({ length: ARRAY_SIZE }, () => Math.floor(Math.random() * 90) + 10), 
  []);

  // --- States ---
  const [array, setArray] = useState([...INITIAL_ARRAY]);
  const [gap, setGap] = useState(Math.floor(ARRAY_SIZE / 2));
  const [activeIndices, setActiveIndices] = useState([]);
  const [comparingIndices, setComparingIndices] = useState([]);
  const [isSorted, setIsSorted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(500);
  const [stepCount, setStepCount] = useState(0);

  // ABC Model States
  const [abcData, setAbcData] = useState([]);
  const [currentABC, setCurrentABC] = useState({
    vA: 1.0, ΔA: 0.5, // Authenticity: Movement/Swap
    vB: 1.5, ΔB: 1.0, // Aesthetic: Evaluation Pressure
    vC: 2.0, ΔC: 0.2, // Meta: Gap Strategy
    ruinScore: 4.5
  });

  // Internal Logic Refs for Generator
  const sortingGenerator = useRef(null);

  // --- Shell Sort Logic ---
  function* shellSortGenerator(arr) {
    let tempArr = [...arr];
    let n = tempArr.length;
    let currentGap = Math.floor(n / 2);

    while (currentGap > 0) {
      setGap(currentGap);
      // vC (Meta) depends on gap size. Large gap = high Meta abstraction
      const vC = (currentGap / (n / 2)) * 2;
      
      for (let i = currentGap; i < n; i++) {
        let temp = tempArr[i];
        let j = i;
        setActiveIndices([i]);
        
        // vB (Evaluation Pressure) spikes when we start a new element check
        const vB = 1.2 + Math.random() * 0.5;

        while (j >= currentGap && tempArr[j - currentGap] > temp) {
          setComparingIndices([j, j - currentGap]);
          
          // vA (Authenticity/Action) spikes during comparison and shift
          const vA = 1.8;
          updateABC(vA, vB, vC);
          
          yield { array: [...tempArr], active: [j], comparing: [j, j - currentGap] };
          
          tempArr[j] = tempArr[j - currentGap];
          j -= currentGap;
        }
        tempArr[j] = temp;
        
        // Action completion
        updateABC(0.5, 0.8, vC);
        yield { array: [...tempArr], active: [j], comparing: [] };
      }
      currentGap = Math.floor(currentGap / 2);
    }
    setIsSorted(true);
    setIsPlaying(false);
    updateABC(0.1, 0.1, 0.1, 0); // Final state
  }

  const updateABC = (vA, vB, vC) => {
    // Delta and RuinScore calculation based on Core 3.2.0 logic
    // Simplified RuinScore: max of (vB + ΔB) as primary driver of tension
    const ΔA = vA > 1.5 ? 1.8 : 0.4;
    const ΔB = vB > 1.0 ? 1.2 : 0.5;
    const ΔC = 0.3; // Meta strategy is stable during a single gap phase

    const rA = vA * 0.5 + ΔA;
    const rB = vB * 1.2 + ΔB;
    const rC = vC * 0.8 + ΔC;
    const ruinScore = Math.min(6, Math.max(rA, rB, rC));

    const newData = { vA, ΔA, vB, ΔB, vC, ΔC, ruinScore };
    setCurrentABC(newData);
    setAbcData(prev => [...prev.slice(-19), { ...newData, time: stepCount }]);
  };

  // --- Handlers ---
  const handleStart = () => {
    if (!sortingGenerator.current || isSorted) {
      sortingGenerator.current = shellSortGenerator(array);
      setIsSorted(false);
      setStepCount(0);
      setAbcData([]);
    }
    setIsPlaying(true);
  };

  const handleStep = () => {
    if (!sortingGenerator.current || isSorted) {
      sortingGenerator.current = shellSortGenerator(array);
    }
    const result = sortingGenerator.current.next();
    if (!result.done) {
      setArray(result.value.array);
      setActiveIndices(result.value.active);
      setComparingIndices(result.value.comparing);
      setStepCount(s => s + 1);
    } else {
      setIsSorted(true);
      setIsPlaying(false);
    }
  };

  const handleReset = () => {
    setArray([...INITIAL_ARRAY]);
    setGap(Math.floor(ARRAY_SIZE / 2));
    setActiveIndices([]);
    setComparingIndices([]);
    setIsSorted(false);
    setIsPlaying(false);
    setStepCount(0);
    setAbcData([]);
    sortingGenerator.current = null;
    setCurrentABC({ vA: 1.0, ΔA: 0.5, vB: 1.5, ΔB: 1.0, vC: 2.0, ΔC: 0.2, ruinScore: 4.5 });
  };

  useEffect(() => {
    let timer;
    if (isPlaying && !isSorted) {
      timer = setTimeout(handleStep, speed);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, stepCount, speed]);

  // --- UI Components ---
  const StatCard = ({ icon: Icon, label, value, color, subValue, delta }) => (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-1">
      <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
        <Icon size={14} className={color} />
        {label}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-black text-slate-800">{value.toFixed(1)}</span>
        <span className="text-xs text-slate-400">Δ {delta.toFixed(1)}</span>
      </div>
      <div className="w-full bg-slate-100 h-1 rounded-full mt-1 overflow-hidden">
        <div 
          className={`h-full transition-all duration-300 ${color.replace('text-', 'bg-')}`} 
          style={{ width: `${(value / 2) * 100}%` }}
        />
      </div>
      <div className="text-[10px] text-slate-400 mt-1">{subValue}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">CORE 3.2.0</span>
              <h1 className="text-2xl font-black tracking-tight italic">ABC-SHELL SORT</h1>
            </div>
            <p className="text-slate-500 text-sm max-w-xl">
              シェルソートのアルゴリズムを「生感(A)」「評価(B)」「俯瞰(C)」の心理力学で解釈。
              gapの変化はメタ認知(C)の変容、要素の交換は自己基準(B)との対峙を意味します。
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
            <button 
              onClick={handleReset}
              className="p-3 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"
              title="リセット"
            >
              <RotateCcw size={20} />
            </button>
            <button 
              onClick={() => isPlaying ? setIsPlaying(false) : handleStart()}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                isPlaying 
                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
              }`}
            >
              {isPlaying ? <><Pause size={20} fill="currentColor" /> PAUSE</> : <><Play size={20} fill="currentColor" /> START</>}
            </button>
            <button 
              onClick={handleStep}
              disabled={isPlaying}
              className="p-3 hover:bg-slate-100 rounded-xl text-slate-600 disabled:opacity-30 transition-colors"
              title="ステップ実行"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard 
            icon={Activity} 
            label="A: Authenticity" 
            value={currentABC.vA} 
            delta={currentABC.ΔA}
            color="text-emerald-500" 
            subValue="交換・移動に伴うエネルギー" 
          />
          <StatCard 
            icon={Eye} 
            label="B: Aesthetic" 
            value={currentABC.vB} 
            delta={currentABC.ΔB}
            color="text-rose-500" 
            subValue="ソート順守への評価圧" 
          />
          <StatCard 
            icon={Zap} 
            label="C: Meta" 
            value={currentABC.vC} 
            delta={currentABC.ΔC}
            color="text-blue-500" 
            subValue={`Gap ${gap} による俯瞰的制御`} 
          />
          <div className="bg-slate-900 p-4 rounded-xl shadow-xl flex flex-col justify-between border-b-4 border-amber-500">
            <div className="flex items-center justify-between text-amber-400 text-[10px] font-bold uppercase">
              <span>RuinScore</span>
              <AlertTriangle size={14} />
            </div>
            <div className="text-4xl font-black text-white italic">
              {currentABC.ruinScore.toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-400">
              {currentABC.ruinScore > 5 ? "DANGER: HIGH DISORDER" : 
               currentABC.ruinScore > 3 ? "WARNING: PROCESSING" : "STABLE: ORDERED"}
            </div>
          </div>
        </div>

        {/* Main Visualizer Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Sorting Visualizer */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
             <div className="flex items-center justify-between mb-8">
                <h3 className="font-bold text-slate-400 flex items-center gap-2">
                  <Activity size={18} /> ARRAY REAL-TIME STATE
                </h3>
                <div className="flex items-center gap-4">
                  <div className="text-xs font-bold text-slate-400">SPEED</div>
                  <input 
                    type="range" min="10" max="1000" step="10" 
                    value={1010 - speed} 
                    onChange={(e) => setSpeed(1010 - parseInt(e.target.value))}
                    className="w-24 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
             </div>

             <div className="h-64 flex items-end justify-between gap-1 px-2">
                {array.map((val, idx) => {
                  const isActive = activeIndices.includes(idx);
                  const isComparing = comparingIndices.includes(idx);
                  const isGapBuddy = comparingIndices.length > 0 && 
                                    (idx === comparingIndices[0] - gap || idx === comparingIndices[0] + gap);

                  return (
                    <div 
                      key={idx} 
                      className="flex-1 flex flex-col items-center gap-2 group"
                    >
                      <div 
                        className={`w-full rounded-t-lg transition-all duration-300 relative ${
                          isActive ? 'bg-indigo-500 shadow-lg scale-110 z-10' : 
                          isComparing ? 'bg-rose-500 animate-pulse' : 
                          isGapBuddy ? 'bg-blue-300' : 'bg-slate-200'
                        }`}
                        style={{ height: `${val}%` }}
                      >
                        {isComparing && (
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-rose-600 whitespace-nowrap">
                            CHECK
                          </div>
                        )}
                      </div>
                      <span className={`text-[10px] font-mono ${isActive ? 'font-bold text-indigo-600' : 'text-slate-400'}`}>
                        {val}
                      </span>
                    </div>
                  );
                })}
             </div>

             {/* Gap Visualizer */}
             <div className="mt-8 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-4 text-xs">
                  <span className="font-bold text-slate-500">CURRENT STRATEGY (Gap):</span>
                  <div className="flex gap-1">
                    {Array.from({ length: Math.ceil(ARRAY_SIZE / gap) }).map((_, i) => (
                      <div key={i} className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                        {i < Math.ceil(ARRAY_SIZE / gap) - 1 && (
                          <div className="h-0.5 bg-blue-100" style={{ width: `${gap * 10}px` }} />
                        )}
                      </div>
                    ))}
                  </div>
                  <span className="font-mono font-bold text-blue-600 ml-auto">{gap} units</span>
                </div>
             </div>
          </div>

          {/* Model Dynamics Chart */}
          <div className="bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-800">
            <h3 className="font-bold text-slate-400 mb-6 flex items-center gap-2">
              <Activity size={18} /> DYNAMICS ANALYSIS
            </h3>
            <div className="h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={abcData}>
                  <defs>
                    <linearGradient id="colorA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorB" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorR" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="time" hide />
                  <YAxis domain={[0, 6]} hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="vA" stroke="#10b981" fillOpacity={1} fill="url(#colorA)" strokeWidth={2} name="A: 生感" />
                  <Area type="monotone" dataKey="vB" stroke="#f43f5e" fillOpacity={1} fill="url(#colorB)" strokeWidth={2} name="B: 評価" />
                  <Area type="monotone" dataKey="ruinScore" stroke="#f59e0b" fillOpacity={1} fill="url(#colorR)" strokeWidth={3} name="RuinScore" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="bg-slate-800/50 p-2 rounded-lg text-center">
                <div className="text-[10px] text-slate-500 uppercase">Steps</div>
                <div className="text-xl font-mono font-bold text-white">{stepCount}</div>
              </div>
              <div className="bg-slate-800/50 p-2 rounded-lg text-center">
                <div className="text-[10px] text-slate-500 uppercase">Efficiency</div>
                <div className="text-xl font-mono font-bold text-emerald-400">
                  {isSorted ? "MAX" : "CALC..."}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Educational Footer */}
        <footer className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-8 rounded-3xl border border-slate-200">
          <div className="space-y-2">
            <h4 className="font-black text-sm flex items-center gap-2 text-emerald-600">
              <Zap size={16} /> A: AUTHENTICITY (生の動き)
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              シェルソートにおける「要素の移動」そのものです。vAが高い時は、配列がダイナミックに変化し、実体的な再構成が行われている状態を指します。
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-black text-sm flex items-center gap-2 text-rose-600">
              <Settings2 size={16} /> B: AESTHETIC (評価の基準)
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              「昇順であるべき」という理想（基準）との比較圧です。比較が発生するたびにvBが高まり、不一致が見つかると修正（移動）へのエネルギーを生成します。
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-black text-sm flex items-center gap-2 text-blue-600">
              <Eye size={16} /> C: META (俯瞰的制御)
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              「どの程度の細かさで見るか」という戦略です。Gapが大きい時は大局的な構造を、Gapが1に近づくほど局所的な細部を俯瞰しているメタ認知状態を意味します。
            </p>
          </div>
        </footer>

        {isSorted && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 animate-bounce">
            <Activity size={24} />
            <span className="font-black tracking-widest">STABILITY REACHED: R-LEVEL 0</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;