import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  Send, 
  User, 
  ChevronRight, 
  BarChart3, 
  RotateCcw, 
  Brain, 
  Sparkles,
  Loader2
} from 'lucide-react';

// --- Constants ---
const API_KEY = ""; // Environment provides this
const MODEL_NAME = "gemini-2.5-flash-preview-09-2025";

const QUESTIONS = [
  {
    id: 'Q1',
    text: "最近、心が動いたこと（嬉しい・楽しい・感動したなど）はありますか？",
    axes: ["Sensitivity", "ValueOrientation"]
  },
  {
    id: 'Q2',
    text: "初めてのこと・知らないことに触れるとき、あなたはどう動くタイプですか？（例：すぐ試す／慎重に調べる／人に聞く など）",
    axes: ["Adaptability", "ImpulseDynamics", "Abstraction"]
  },
  {
    id: 'Q3',
    text: "「一人の時間」と「人と一緒にいる時間」はどちらが好きですか？",
    axes: ["SocialFit", "InterpersonalDistance"]
  },
  {
    id: 'Q4',
    text: "仕事や作業に没頭することはありますか？（例：時間を忘れる・ほどほど・集中は苦手）",
    axes: ["FocusDepth", "PracticalStability"]
  },
  {
    id: 'Q5',
    text: "気持ちが揺れたり気分が変わりやすい方ですか？",
    axes: ["EmotionalRange", "ImpulseDynamics"]
  },
  {
    id: 'Q6',
    text: "物事の筋道や美しさを重視するほうですか？",
    axes: ["SelfStandard", "ValueOrientation", "Abstraction"]
  },
  {
    id: 'Q7',
    text: "理想よりも効率・現実を優先することは多いですか？",
    axes: ["PracticalStability", "ValueOrientation", "Adaptability"]
  }
];

const AXIS_NAMES = [
  "Sensitivity", "Abstraction", "FocusDepth", "SocialFit",
  "InterpersonalDistance", "EmotionalRange", "SelfStandard",
  "PracticalStability", "CreativityStyle", "Adaptability",
  "ImpulseDynamics", "ValueOrientation"
];

// --- App Component ---
export default function App() {
  const [step, setStep] = useState('welcome'); // 'welcome', 'diagnosing', 'result'
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [history, setHistory] = useState([]); // {type: 'bot'|'user', text: string}
  const [isTyping, setIsTyping] = useState(false);
  const [finalProfile, setFinalProfile] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isTyping]);

  const startDiagnosis = () => {
    setStep('diagnosing');
    const firstQ = QUESTIONS[0].text;
    setHistory([{ type: 'bot', text: "こんにちは。TDPV診断へようこそ。あなたの性質を紐解くために、いくつか質問をさせていただきますね。無理のない範囲でお答えください。" }, { type: 'bot', text: firstQ }]);
  };

  const handleSend = async () => {
    if (!currentInput.trim() || isTyping) return;

    const userMsg = currentInput.trim();
    setCurrentInput('');
    setHistory(prev => [...prev, { type: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      // Analyze current answer and prepare next step
      const isLast = currentQIndex === QUESTIONS.length - 1;
      
      const response = await callGeminiAnalysis(userMsg, currentQIndex, isLast, answers);
      
      setAnswers(prev => [...prev, { question: QUESTIONS[currentQIndex].text, answer: userMsg }]);

      if (isLast) {
        // Prepare results
        setHistory(prev => [...prev, { type: 'bot', text: response.analysis }]);
        setTimeout(() => {
          setFinalProfile(response.profile);
          setStep('result');
        }, 1500);
      } else {
        // Intermediate analysis and next question
        setHistory(prev => [
          ...prev, 
          { type: 'bot', text: response.analysis },
          { type: 'bot', text: QUESTIONS[currentQIndex + 1].text }
        ]);
        setCurrentQIndex(prev => prev + 1);
      }
    } catch (error) {
      console.error(error);
      setHistory(prev => [...prev, { type: 'bot', text: "申し訳ありません。通信エラーが発生しました。もう一度入力してみてください。" }]);
    } finally {
      setIsTyping(false);
    }
  };

  const callGeminiAnalysis = async (userAnswer, qIndex, isLast, previousAnswers) => {
    const systemPrompt = `
      あなたはTDPV診断（12次元人格ベクトルモデル）のエキスパートです。
      ユーザーの回答から、以下の12軸の数値を1.0〜5.0（0.5刻み）で推定してください。
      1: Sensitivity, 2: Abstraction, 3: FocusDepth, 4: SocialFit, 
      5: InterpersonalDistance, 6: EmotionalRange, 7: SelfStandard, 
      8: PracticalStability, 9: CreativityStyle, 10: Adaptability, 
      11: ImpulseDynamics, 12: ValueOrientation

      【現在の質問】: ${QUESTIONS[qIndex].text}
      【ユーザーの回答】: ${userAnswer}

      ${isLast ? "これが最後の質問です。全回答を考慮して、最終的な12軸のスコアと、全体的なまとめ（3〜4行）を作成してください。" : "各質問の直後に、回答を受けて軽く分析してください。専門用語は使わず「◯◯軸がやや高めに見えます。◯◯な時に心が動くタイプかもしれません」といったやさしい表現で1〜2文で答えてください。"}

      返信は必ず以下のJSON形式にしてください。
      {
        "analysis": "ユーザーへの返信メッセージ",
        "profile": ${isLast ? '{ "scores": { "AxisName": score_val... }, "summary": "まとめ文" }' : "null"}
      }
    `;

    let retries = 0;
    while (retries < 5) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: userAnswer }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: { responseMimeType: "application/json" }
          })
        });
        const data = await response.json();
        return JSON.parse(data.candidates[0].content.parts[0].text);
      } catch (e) {
        retries++;
        await new Promise(r => setTimeout(r, Math.pow(2, retries) * 1000));
      }
    }
    throw new Error("Failed after retries");
  };

  const renderWelcome = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-6 animate-in fade-in duration-700">
      <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mb-6 text-indigo-600 shadow-inner">
        <Sparkles size={48} />
      </div>
      <h1 className="text-3xl font-bold text-gray-800 mb-4">TDPV性格診断</h1>
      <p className="text-gray-600 mb-8 max-w-md leading-relaxed">
        12次元のベクトルモデルを用いて、あなたの感性や行動の傾向をやさしく可視化します。いくつかの質問に答えるだけで、あなたの「心のカタチ」が見えてきます。
      </p>
      <button 
        onClick={startDiagnosis}
        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-semibold transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
      >
        診断をはじめる
        <ChevronRight size={20} />
      </button>
    </div>
  );

  const renderDiagnosing = () => (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      <div className="p-4 bg-white border-b flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Brain className="text-indigo-600" size={20} />
          <span className="font-bold text-gray-700">診断中</span>
        </div>
        <div className="text-xs text-gray-400 font-mono">
          Progress: {currentQIndex + 1} / {QUESTIONS.length}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {history.map((msg, i) => (
          <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
            <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
              msg.type === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
            }`}>
              <p className="text-sm leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex gap-1">
              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="ここに回答を入力..."
            className="flex-1 p-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm outline-none"
          />
          <button 
            onClick={handleSend}
            disabled={!currentInput.trim() || isTyping}
            className={`p-3 rounded-xl transition-colors ${
              currentInput.trim() && !isTyping ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'
            }`}
          >
            {isTyping ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );

  const renderResult = () => {
    if (!finalProfile) return null;
    
    return (
      <div className="flex flex-col h-full bg-white overflow-y-auto animate-in fade-in duration-1000">
        <div className="p-8 text-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
          <h2 className="text-2xl font-bold mb-2">診断結果</h2>
          <p className="text-indigo-100 text-sm">あなたのTDPV簡易プロファイル</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-6 -mt-12 mx-2">
            <h3 className="flex items-center gap-2 font-bold text-gray-800 mb-6 pb-2 border-b">
              <BarChart3 size={18} className="text-indigo-600" />
              12次元パラメータ評価
            </h3>
            
            <div className="space-y-4">
              {Object.entries(finalProfile.scores).map(([key, value]) => {
                const blocks = Math.round(value);
                return (
                  <div key={key} className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600 font-medium">{key}</span>
                      <span className="text-indigo-600 font-bold">{value.toFixed(1)}</span>
                    </div>
                    <div className="flex gap-1 h-3">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div 
                          key={i} 
                          className={`flex-1 rounded-sm transition-all duration-700 delay-${i*100} ${
                            i <= blocks ? 'bg-indigo-500 shadow-sm' : 'bg-gray-100'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
            <h3 className="flex items-center gap-2 font-bold text-indigo-900 mb-3">
              <Heart size={18} />
              分析サマリー
            </h3>
            <p className="text-indigo-800 text-sm leading-relaxed italic">
              「{finalProfile.summary}」
            </p>
          </div>

          <button 
            onClick={() => {
              setStep('welcome');
              setCurrentQIndex(0);
              setAnswers([]);
              setHistory([]);
              setFinalProfile(null);
            }}
            className="w-full py-4 bg-gray-800 hover:bg-black text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw size={18} />
            もう一度診断する
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-lg h-screen sm:h-[800px] bg-white sm:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col relative">
        {step === 'welcome' && renderWelcome()}
        {step === 'diagnosing' && renderDiagnosing()}
        {step === 'result' && renderResult()}
      </div>
    </div>
  );
}