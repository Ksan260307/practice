import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  BarChart3, 
  MessageSquare, 
  AlertTriangle, 
  Activity, 
  Settings2,
  BrainCircuit,
  ShieldAlert,
  Save,
  Info,
  X,
  Trash2
} from 'lucide-react';

// --- Constants & Logic from ABC Model Core 3.2.0 ---

const ABC_TYPES = {
  A: { 
    expertLabel: 'Authenticity (体感/自然感)', 
    generalLabel: '行動力・モチベーション',
    color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-200' 
  },
  B: { 
    expertLabel: 'Aesthetic (基準/評価感)', 
    generalLabel: 'こだわり・責任感',
    color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' 
  },
  C: { 
    expertLabel: 'Meta (俯瞰/監視認知)', 
    generalLabel: '客観性・気配り',
    color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' 
  },
};

const EF_LABELS = {
  E0: { expert: 'Health (睡眠/体調)', general: '体調・睡眠の悪化' },
  E1: { expert: 'Environment (物理的環境)', general: '職場環境のストレス' },
  E2: { expert: 'Social (対人的評価圧)', general: '対人・評価のプレッシャー' },
  E3: { expert: 'Noise (マルチタスク/雑音)', general: 'タスク過多・雑音' }
};

// スライダーの値に応じたラベル
const getIntensityLabel = (val) => ['低', '中', '高'][val];
const getDeltaLabel = (val) => ['安定', 'やや揺らぐ', '不安定'][val];
const getEFLabel = (val) => ['なし', '少し', '強い'][val];

// サブタイプ表示用ヘルパー関数
const getCTypeLabel = (cType, isExpert) => {
  const labels = {
    'C1': { e: 'C1（構造俯瞰型）', g: '全体像・仕組みから物事を捉える' },
    'C2': { e: 'C2（場面整序型）', g: '場の空気や進行、整頓を重視する' },
    'C3': { e: 'C3（監視-自己意識型）', g: '他者の目や見られ方を意識する' },
    'C4': { e: 'C4（社会文脈型）', g: '社会通念や常識・大義を重んじる' },
    'None': { e: '設定なし', g: '特定の強い偏りは見られない' }
  };
  return isExpert ? labels[cType]?.e : labels[cType]?.g;
};

const getBTypeLabel = (bType, isExpert) => {
  const labels = {
    'B1': { e: 'B1（内向き基準）', g: '他人からの評価より「自分の理想」を重視する' },
    'B2': { e: 'B2（外向き評価）', g: '自分の理想より「他者からの評価・承認」を重視する' },
    'None': { e: '設定なし', g: '特定の強い偏りは見られない' }
  };
  return isExpert ? labels[bType]?.e : labels[bType]?.g;
};

const DEFAULT_MEMBER = {
  id: '1',
  name: '田中 太郎',
  role: 'シニアエンジニア',
  notes: '一生懸命に突っ走る傾向がある。',
  params: {
    vA: 2, deltaA: 1,
    vB: 2, deltaB: 1,
    vC: 1, deltaC: 0,
    E0: 0, E1: 0, E2: 0, E3: 0,
  },
  cType: 'C2', // 俯瞰特化型
  bType: 'B1'  // 内向き評価
};

const App = () => {
  const [members, setMembers] = useState([DEFAULT_MEMBER]);
  const [selectedMemberId, setSelectedMemberId] = useState(members[0].id);
  const [activeTab, setActiveTab] = useState('analysis');
  
  // 設定用のステート
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExpertMode, setIsExpertMode] = useState(false); // 一般モードがデフォルト

  const currentMember = members.find(m => m.id === selectedMemberId) || members[0];

  // --- Member Management ---

  const handleAddMember = () => {
    const newMember = {
      id: Date.now().toString(),
      name: '新規メンバー',
      role: '役割未設定',
      notes: '',
      params: {
        vA: 1, deltaA: 0,
        vB: 1, deltaB: 0,
        vC: 1, deltaC: 0,
        E0: 0, E1: 0, E2: 0, E3: 0,
      },
      cType: 'None',
      bType: 'None'
    };
    setMembers([...members, newMember]);
    setSelectedMemberId(newMember.id);
  };

  const handleDeleteMember = () => {
    if (members.length === 1) {
      alert("最後の1人は削除できません。");
      return;
    }
    const confirmDelete = window.confirm(`${currentMember.name} を削除しますか？`);
    if (confirmDelete) {
      const newMembers = members.filter(m => m.id !== selectedMemberId);
      setMembers(newMembers);
      setSelectedMemberId(newMembers[0].id);
    }
  };

  const updateMemberProfile = (key, value) => {
    setMembers(prev => prev.map(m => 
      m.id === selectedMemberId 
        ? { ...m, [key]: value } 
        : m
    ));
  };

  const updateParam = (key, val) => {
    setMembers(prev => prev.map(m => 
      m.id === selectedMemberId 
        ? { ...m, params: { ...m.params, [key]: parseInt(val) } } 
        : m
    ));
  };

  // --- Logic Calculations ---

  const calculateRuinScore = (params) => {
    // Simplified representation of Core 3.2.0 RuinScore logic
    const coreVal = (params.vB * 1.5 + params.vC * 1.0 - params.vA * 0.5);
    const deltaImpact = (params.deltaA + params.deltaB + params.deltaC) * 0.3;
    const efImpact = (params.E0 + params.E1 + params.E2 + params.E3) * 0.8;
    
    let score = coreVal + deltaImpact + efImpact;
    return Math.min(6, Math.max(0, score.toFixed(1)));
  };

  const ruinScore = useMemo(() => calculateRuinScore(currentMember.params), [currentMember]);

  const getStatusMessage = (score) => {
    if (score >= 5) return { 
      expertLabel: 'CRITICAL: Zero状態の懸念', 
      generalLabel: '要注意：心身の限界（休息が必要です）',
      color: 'bg-red-600', text: 'white' 
    };
    if (score >= 3.5) return { 
      expertLabel: 'WARNING: 強い社会的圧力下', 
      generalLabel: '警告：強いストレスがかかっています',
      color: 'bg-orange-500', text: 'white' 
    };
    if (score >= 2) return { 
      expertLabel: 'CAUTION: 不安定な帯域', 
      generalLabel: '注意：やや不安定な状態です',
      color: 'bg-yellow-400', text: 'black' 
    };
    return { 
      expertLabel: 'STABLE: 安定領域', 
      generalLabel: '安定：良好な状態です',
      color: 'bg-emerald-500', text: 'white' 
    };
  };

  const status = getStatusMessage(ruinScore);

  // --- Strategy Content ---

  const getCommunicationStrategy = () => {
    const { vA, vB, vC } = currentMember.params;
    let strategy = [];

    // B軸に関する戦略
    if (vB >= 2) {
      if (currentMember.bType === 'B2') {
        strategy.push(isExpertMode 
          ? "B2(外向き評価)かつvB高：他者や社会からの承認を必要とします。チームへの貢献を可視化して伝えてください。"
          : "他人や周囲からどう評価されているかを強く気にするタイプです。周囲への良い影響や感謝を具体的に伝えてください。"
        );
      } else {
        strategy.push(isExpertMode 
          ? "高い基準(B)を持っているため、論理的な妥当性と『なぜやるか』の明確化を重視してください。"
          : "強いこだわりと責任感を持っています。仕事の目的や「なぜそのルールが必要か」を論理的に説明すると納得しやすくなります。"
        );
      }
    }

    // A軸に関する戦略
    if (vA >= 2) {
      strategy.push(isExpertMode 
        ? "行動量(A)が多い反面、燃え尽きリスクがあります。定期的なブレーキ役が必要です。"
        : "モチベーションが高く自走できますが、頑張りすぎて突然燃え尽きるリスクがあります。上司側から定期的にブレーキをかけて休ませてください。"
      );
    }

    // Cサブタイプに基づく戦略
    if (currentMember.cType === 'C1') {
      strategy.push(isExpertMode 
        ? "C1(構造俯瞰型): 全体の目的やシステムの構造から説明すると理解が早いです。"
        : "物事を俯瞰して「全体像・仕組み」で理解するタイプです。タスクの背景や全体での位置づけを最初に説明してください。"
      );
    } else if (currentMember.cType === 'C2') {
      strategy.push(isExpertMode 
        ? "C2(場面整序型): メタ認知(C)が構造に寄りすぎています。感情面への配慮を言語化して伝えると効果的です。"
        : "物事を客観的・進行ベースで見るのが得意な反面、人の感情への配慮が漏れることがあります。感情面も「一つの事実」として言語化して伝えると効果的です。"
      );
    } else if (currentMember.cType === 'C3') {
      strategy.push(isExpertMode 
        ? "C3(監視-自己意識型): 監視認知が強いため、細かすぎるマイクロマネジメントは避けてください。"
        : "「人からどう見られているか」を敏感に察知します。過度な監視やマイクロマネジメントは避け、ある程度任せる姿勢を見せてください。"
      );
    } else if (currentMember.cType === 'C4') {
      strategy.push(isExpertMode 
        ? "C4(社会文脈型): 社会通念や常識を重んじます。世間的な正しさや社会的意義を強調してください。"
        : "社会の常識や「世間的に正しいか」を重んじます。その仕事が社会や会社にどう役立つのか、大義名分を伝えるとモチベーションに繋がります。"
      );
    }
    
    // EFリスクに基づく戦略
    if (ruinScore > 4) {
      strategy.push(isExpertMode 
        ? "【緊急】対人的評価(E2)等の外的ストレスを遮断し、睡眠・休息(E0)を優先させる指示を出してください。"
        : "【緊急】現在非常に高いプレッシャーを感じています。一旦新しいタスクを止め、しっかり休息を取れるように調整してください。"
      );
    }

    if (strategy.length === 0) {
      strategy.push(isExpertMode 
        ? "現在、特筆すべきリスクや強い偏りはありません。" 
        : "現在、性格のバランスは安定しています。通常通りのコミュニケーションで問題ありません。"
      );
    }

    return strategy;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800 font-sans relative">
      
      {/* --- Settings Modal --- */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-96 transform transition-all">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Settings2 size={20} className="text-indigo-500" />
                アプリ設定
              </h2>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-6 mb-8">
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="pr-4">
                  <p className="font-bold text-sm text-slate-700">専門家モード (ABC Model)</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    ABCモデルの生パラメータ(v, Δ)や、RuinScore等の専門用語をそのまま表示します。
                  </p>
                </div>
                <button 
                  onClick={() => setIsExpertMode(!isExpertMode)}
                  className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${isExpertMode ? 'bg-indigo-500' : 'bg-slate-300'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${isExpertMode ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>

            <button 
              onClick={() => setIsSettingsOpen(false)}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors"
            >
              設定を閉じる
            </button>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex shrink-0">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl">
            <BrainCircuit size={28} />
            <span>ABC Insights</span>
          </div>
          {isExpertMode && <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">Model Core v3.2.0</p>}
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">メンバー一覧</h2>
            <button 
              onClick={handleAddMember}
              className="p-1.5 hover:bg-slate-100 hover:text-indigo-600 rounded text-slate-400 transition-colors"
              title="新規メンバーを追加"
            >
              <UserPlus size={16} />
            </button>
          </div>
          
          <nav className="space-y-1">
            {members.map(m => (
              <button
                key={m.id}
                onClick={() => setSelectedMemberId(m.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedMemberId === m.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${selectedMemberId === m.id ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                <span className="truncate text-left flex-1">{m.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
          >
            <Settings2 size={16} />
            設定
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 flex-1">
            <input 
              type="text"
              value={currentMember.name}
              onChange={(e) => updateMemberProfile('name', e.target.value)}
              placeholder="名前を入力..."
              className="text-xl font-bold bg-transparent border-none outline-none focus:ring-2 focus:ring-indigo-100 rounded px-1 w-48 hover:bg-slate-50 transition-colors"
            />
            <input 
              type="text"
              value={currentMember.role}
              onChange={(e) => updateMemberProfile('role', e.target.value)}
              placeholder="役職を入力..."
              className="text-sm font-normal text-slate-600 bg-slate-100 px-3 py-1 rounded-full outline-none border border-transparent focus:border-indigo-300 focus:bg-white w-40 hover:bg-slate-200 transition-colors"
            />
          </div>
          <div className="flex items-center gap-3 shrink-0">
             <div className={`${status.color} text-${status.text} px-4 py-1.5 rounded-full text-xs font-bold shadow-sm transition-all`}>
               {isExpertMode ? status.expertLabel : status.generalLabel}
             </div>
             <div className="w-px h-6 bg-slate-200 mx-1"></div>
             {members.length > 1 && (
               <button 
                 onClick={handleDeleteMember}
                 className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
                 title="メンバーを削除"
               >
                 <Trash2 size={20} />
               </button>
             )}
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="bg-white px-8 flex gap-8 border-b border-slate-200 shrink-0">
          {[
            { id: 'analysis', label: '特性分析', icon: BarChart3 },
            { id: 'strategy', label: 'コミュニケーション戦略', icon: MessageSquare },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === tab.id ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          {activeTab === 'analysis' && (
            <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Core Parameters */}
              <div className="lg:col-span-2 space-y-6">
                <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2">
                    <Activity size={18} className="text-indigo-500" /> 
                    {isExpertMode ? 'Core Parameters (v / Δ)' : 'パーソナリティ・パラメータ'}
                  </h3>
                  
                  <div className="space-y-6">
                    {Object.entries(ABC_TYPES).map(([key, info]) => {
                      const vVal = currentMember.params[`v${key}`];
                      const dVal = currentMember.params[`delta${key}`];
                      
                      return (
                        <div key={key} className={`p-5 rounded-xl border-l-4 ${info.border} ${info.bg}`}>
                          <div className="flex justify-between items-center mb-4">
                            <label className={`text-base font-bold ${info.color}`}>
                              {isExpertMode ? info.expertLabel : info.generalLabel}
                            </label>
                            {isExpertMode && (
                              <span className="text-xs font-mono bg-white px-2 py-1 rounded border border-slate-100">
                                v{vVal} / Δ{dVal}
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-8">
                            {/* 強度スライダー */}
                            <div>
                              <div className="flex justify-between items-end mb-2">
                                <p className="text-xs font-bold text-slate-600">
                                  {isExpertMode ? '強度 (v: 0-2)' : '特性の強さ'}
                                </p>
                                {!isExpertMode && (
                                  <span className="text-xs font-bold text-indigo-600 bg-white px-2 py-0.5 rounded shadow-sm">
                                    {getIntensityLabel(vVal)}
                                  </span>
                                )}
                              </div>
                              <input 
                                type="range" min="0" max="2" step="1" 
                                value={vVal}
                                onChange={(e) => updateParam(`v${key}`, e.target.value)}
                                className="w-full accent-indigo-500"
                              />
                              <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-0.5">
                                <span>低</span><span>中</span><span>高</span>
                              </div>
                            </div>

                            {/* 変動スライダー */}
                            <div>
                              <div className="flex justify-between items-end mb-2">
                                <p className="text-xs font-bold text-slate-600">
                                  {isExpertMode ? '変動 (Δ: 0-2)' : '不安定さ・揺らぎ'}
                                </p>
                                {!isExpertMode && (
                                  <span className="text-xs font-bold text-slate-600 bg-white px-2 py-0.5 rounded shadow-sm">
                                    {getDeltaLabel(dVal)}
                                  </span>
                                )}
                              </div>
                              <input 
                                type="range" min="0" max="2" step="1" 
                                value={dVal}
                                onChange={(e) => updateParam(`delta${key}`, e.target.value)}
                                className="w-full accent-slate-400"
                              />
                              <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-0.5">
                                <span>安定</span><span>やや揺らぐ</span><span>不安定</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Subtype Settings */}
                <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <Users size={18} className="text-indigo-500" />
                    {isExpertMode ? 'サブタイプ設定 (B_type / C_type)' : '性格のサブタイプ設定'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-2">
                        {isExpertMode ? 'Cサブタイプ' : '状況把握のクセ'}
                      </label>
                      <select 
                        value={currentMember.cType}
                        onChange={(e) => updateMemberProfile('cType', e.target.value)}
                        className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                      >
                        <option value="None">設定なし</option>
                        <option value="C1">C1: 構造俯瞰型 (全体像・仕組み重視)</option>
                        <option value="C2">C2: 場面整序型 (場の空気・進行重視)</option>
                        <option value="C3">C3: 監視-自己意識型 (他者の目・見られ方重視)</option>
                        <option value="C4">C4: 社会文脈型 (社会通念・常識重視)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-2">
                        {isExpertMode ? 'B評価軸' : '基準の置き方'}
                      </label>
                      <select 
                        value={currentMember.bType}
                        onChange={(e) => updateMemberProfile('bType', e.target.value)}
                        className="w-full text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                      >
                        <option value="None">設定なし</option>
                        <option value="B1">B1: 内向き基準 (自分の理想重視)</option>
                        <option value="B2">B2: 外向き評価 (他者からの承認重視)</option>
                      </select>
                    </div>
                  </div>
                </section>

                <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <Info size={18} className="text-indigo-500" /> 観察メモ・入力データ
                  </h3>
                  <textarea 
                    className="w-full h-24 p-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-colors resize-none"
                    placeholder="業務チャットの抜粋や、面談での発言を入力してください..."
                    value={currentMember.notes}
                    onChange={(e) => updateMemberProfile('notes', e.target.value)}
                  />
                  <p className="text-[10px] text-slate-400 mt-2">※メモはメンバーごとに保存されます。</p>
                </section>
              </div>

              {/* Right Column: Calculations & EFs */}
              <div className="space-y-6">
                
                {/* スコア表示領域 */}
                <div className="bg-indigo-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <ShieldAlert size={80} />
                  </div>
                  <h3 className="text-sm font-bold opacity-80 mb-2">
                    {isExpertMode ? 'RuinScore' : '総合ストレス・リスク値'}
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black">{ruinScore}</span>
                    <span className="text-sm opacity-60">/ 6.0</span>
                  </div>
                  <div className="mt-4 w-full bg-indigo-950/50 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-400 via-yellow-400 to-rose-500 transition-all duration-500" 
                      style={{ width: `${(ruinScore / 6) * 100}%` }}
                    />
                  </div>
                </div>

                {/* 外部要因 (EF) */}
                <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-700 mb-5 flex items-center gap-2">
                    {isExpertMode ? '外部要因補正 (EF)' : '外部ストレス要因の影響'}
                  </h3>
                  <div className="space-y-5">
                    {Object.entries(EF_LABELS).map(([key, labels]) => {
                      const val = currentMember.params[key];
                      return (
                        <div key={key}>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-bold text-slate-600">
                              {isExpertMode ? labels.expert : labels.general}
                            </label>
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                              {isExpertMode ? `Level ${val}` : getEFLabel(val)}
                            </span>
                          </div>
                          <input 
                            type="range" min="0" max="2" step="1" 
                            value={val}
                            onChange={(e) => updateParam(key, e.target.value)}
                            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* 警告文 */}
                <div className={`p-4 border rounded-xl ${ruinScore > 3 ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  <div className="flex gap-2">
                    <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold">システムアラート</p>
                      <p className="text-xs leading-relaxed mt-1">
                        {ruinScore > 3 
                          ? (isExpertMode 
                              ? "B(基準)がC(俯瞰)を凌駕し始めています。Ruin現象への移行を注視してください。" 
                              : "ストレスが蓄積し、客観的な判断力が低下し始めている兆候があります。負担を減らすケアが必要です。")
                          : (isExpertMode
                              ? "現在パラメータは安定帯域にあります。"
                              : "現在、ストレスや特性のバランスは安定しています。")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'strategy' && (
            <div className="max-w-4xl mx-auto space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 特性サマリー */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                      <Users size={18} className="text-indigo-500" /> パーソナリティ特性
                    </h3>
                    <div className="space-y-4 text-sm">
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-600 font-medium">{isExpertMode ? 'Cサブタイプ' : '状況把握のクセ'}</span>
                        <span className="font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded text-right max-w-[60%]">
                          {getCTypeLabel(currentMember.cType, isExpertMode)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-600 font-medium">{isExpertMode ? 'B評価軸' : '基準の置き方'}</span>
                        <span className="font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded text-right max-w-[60%]">
                          {getBTypeLabel(currentMember.bType, isExpertMode)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-600 font-medium">対人相性推定（あなたと）</span>
                        <span className="font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded">良好（お互いを補える関係）</span>
                      </div>
                    </div>
                  </div>

                  {/* 禁忌事項 */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                      <AlertTriangle size={18} className="text-rose-500" /> 絶対にやってはいけないこと
                    </h3>
                    <ul className="space-y-3">
                      {[
                        isExpertMode ? "過度な数値化による直接評価の提示（Cを刺激する）" : "「あなたの評価は〇〇点だ」といったドライな点数づけ",
                        isExpertMode ? "『もっと頑張れ』というAへの無根拠な負荷" : "具体的な指示なしに「とにかくもっと頑張れ」と根性論で圧をかける",
                        isExpertMode ? "不明瞭な評価基準でのフィードバック（Bを混乱させる）" : "ルールや評価基準が曖昧なまま、結果だけを注意する"
                      ].map((item, i) => (
                        <li key={i} className="text-sm flex gap-3 text-slate-700 leading-relaxed">
                          <span className="text-rose-500 font-bold shrink-0">×</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
               </div>

               {/* 戦略とアドバイス */}
               <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2">
                    <MessageSquare size={18} className="text-indigo-500" /> 推奨される接し方・戦略
                  </h3>
                  
                  <div className="space-y-4">
                    {getCommunicationStrategy().map((tip, i) => (
                      <div key={i} className="flex gap-4 p-4 border border-slate-100 rounded-xl bg-slate-50/50">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold shrink-0 text-sm">
                          {i + 1}
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed pt-1">{tip}</p>
                      </div>
                    ))}
                  </div>

                  {/* 話法テンプレート */}
                  <div className="mt-8 p-6 bg-slate-800 text-slate-100 rounded-xl shadow-inner">
                    <h4 className="text-sm font-bold text-indigo-300 mb-5 flex items-center gap-2">
                      💡 面談や1on1で使える話法テンプレート
                    </h4>
                    <div className="space-y-6 text-sm">
                      <div className="pl-4 border-l-2 border-slate-600 relative">
                        <div className="absolute -left-2 top-0 w-3.5 h-3.5 rounded-full bg-slate-600 border-4 border-slate-800"></div>
                        <p className="text-slate-400 mb-2 font-medium">
                          ステップ1: {isExpertMode ? 'A（体感）の承認' : 'まずは行動と熱意を認める'}
                        </p>
                        <p className="font-medium text-white">「最近のプロジェクトでの粘り強さ、非常に頼もしく見ています。」</p>
                      </div>
                      <div className="pl-4 border-l-2 border-slate-600 relative">
                        <div className="absolute -left-2 top-0 w-3.5 h-3.5 rounded-full bg-slate-600 border-4 border-slate-800"></div>
                        <p className="text-slate-400 mb-2 font-medium">
                          ステップ2: {isExpertMode ? 'B（基準）のすり合わせ' : 'こだわりのポイント（基準）を共有してもらう'}
                        </p>
                        <p className="font-medium text-white">「このタスクの品質について、あなた自身が目指しているラインを教えてください。」</p>
                      </div>
                      <div className="pl-4 border-l-2 border-slate-600 relative">
                        <div className="absolute -left-2 top-0 w-3.5 h-3.5 rounded-full bg-slate-600 border-4 border-slate-800"></div>
                        <p className="text-slate-400 mb-2 font-medium">
                          ステップ3: {isExpertMode ? 'C（メタ）による距離化' : '客観的な視点を提供し、肩の力を抜かせる'}
                        </p>
                        <p className="font-medium text-white">「少し俯瞰してチーム全体のリソース状況を見ると、今は完璧を目指すより8割の出力で進めるのが『構造的に正解』かもしれません。」</p>
                      </div>
                    </div>
                  </div>
               </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;