import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, Image as ImageIcon, Sparkles, RefreshCcw, Info } from 'lucide-react';

// API Key (Canvas環境で自動注入されます)
const apiKey = "";

export default function App() {
  // === UI States ===
  // ユーザー向けのスライダー値 (0-100)
  const [passion, setPassion] = useState(50); // 筆の勢い・情熱
  const [chaos, setChaos] = useState(20);     // 偶然性・ゆらぎ
  const [realism, setRealism] = useState(70); // 写実性・正確さ
  const [design, setDesign] = useState(50);   // 構図の整理・デザイン

  const [customPrompt, setCustomPrompt] = useState("A mysterious cat sitting in a neon-lit alley");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // === Core Logic (ABC Model v3.2.0 based) ===
  // UIの 0-100 を Core層の 0.0 - 2.0 にマッピング
  const mapToCore = (value) => (value / 100) * 2.0;

  const generateStyleKeywords = () => {
    // 内部変数として扱う (ABCモデルの定義に従う)
    const vA = mapToCore(passion); // Authenticity: 生感・強さ
    const deltaA = mapToCore(chaos); // Aの変動: ゆらぎ・スパイク
    const vB = mapToCore(realism); // Aesthetic: 基準・正確さ
    const vC = mapToCore(design);  // Meta: 俯瞰・構成

    let keywords = [];

    // --- A: Authenticity (筆致・生感) ---
    if (vA <= 0.5) keywords.push("delicate lines", "flat colors", "clean artwork");
    else if (vA < 1.5) keywords.push("expressive strokes", "natural painting style");
    else keywords.push("thick impasto", "chaotic brushstrokes", "raw artistic energy", "bold colors");

    // --- ΔA: 偶然性・ゆらぎ ---
    if (deltaA <= 0.5) keywords.push("uniform texture", "precise execution");
    else if (deltaA < 1.5) keywords.push("organic textures", "slight paint bleed");
    else keywords.push("ink splatters", "dripping paint", "unintended marks", "grunge elements");

    // --- B: Aesthetic (基準・写実性) ---
    if (vB <= 0.5) keywords.push("highly stylized", "abstract proportions", "surreal deformation");
    else if (vB < 1.5) keywords.push("stylized but anatomically sound", "semi-realistic");
    else keywords.push("hyper-realistic", "photorealistic", "anatomically perfect", "highly detailed");

    // --- C: Meta (俯瞰・構成) ---
    if (vC <= 0.5) keywords.push("snapshot-like", "unorganized background", "messy environment");
    else if (vC < 1.5) keywords.push("well-framed", "balanced composition");
    else keywords.push("highly graphical", "minimalist layout", "poster-like composition", "negative space");

    // --- 相互作用的な複合ルール (簡易版) ---
    // Aが強くてBが低い -> 表現主義・抽象画
    if (vA > 1.5 && vB < 0.5) keywords.push("Abstract Expressionism", "avant-garde");
    // BとCが両方高い -> コマーシャルアート・精緻なコンセプトアート
    if (vB > 1.5 && vC > 1.5) keywords.push("high-end commercial art", "masterpiece concept art");

    return keywords.join(", ");
  };

  const handleGenerate = async () => {
    if (!customPrompt.trim()) {
      setErrorMsg("描きたいもののキーワードを入力してください。");
      return;
    }

    setIsGenerating(true);
    setErrorMsg("");
    setImageUrl("");

    const styleKeywords = generateStyleKeywords();
    // Imagen向けのプロンプト（モチーフ + 画風指定）
    const finalPrompt = `${customPrompt.trim()}. Art style: ${styleKeywords}. High quality, trending on artstation.`;
    setCurrentPrompt(finalPrompt);

    try {
      // Exponential backoff retry logic
      const generateImage = async (retryCount = 0) => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`;
        const payload = {
          instances: { prompt: finalPrompt },
          parameters: { sampleCount: 1 }
        };

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          if (response.status === 429 && retryCount < 5) {
            const delay = Math.pow(2, retryCount) * 1000;
            await new Promise(r => setTimeout(r, delay));
            return generateImage(retryCount + 1);
          }
          throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        if (data.predictions && data.predictions[0]) {
          return `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`;
        } else {
          throw new Error("No image data returned.");
        }
      };

      const resultUrl = await generateImage();
      setImageUrl(resultUrl);

    } catch (err) {
      console.error(err);
      setErrorMsg("画像の生成に失敗しました。時間をおいて再試行してください。");
    } finally {
      setIsGenerating(false);
    }
  };

  // スライダーUIコンポーネント
  const SliderControl = ({ label, value, setter, leftLabel, rightLabel, description }) => (
    <div className="mb-5 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-end mb-2">
        <label className="text-sm font-bold text-gray-800">{label}</label>
        <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">
          {value}%
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-3 leading-snug">{description}</p>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => setter(parseInt(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
      />
      <div className="flex justify-between text-[10px] sm:text-xs text-gray-400 mt-2 font-medium">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans selection:bg-indigo-100">
      {/* Header */}
      <header className="bg-indigo-600 text-white p-4 sm:p-6 shadow-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-200" />
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">画風チューナー</h1>
          </div>
          <div className="text-xs sm:text-sm text-indigo-200 font-medium bg-indigo-700/50 px-3 py-1.5 rounded-full border border-indigo-500/30">
            Powered by ABC Model Logic
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        
        {/* Left Column: Controls */}
        <section className="lg:col-span-5 flex flex-col gap-1">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4">
            <label className="block text-sm font-bold text-gray-800 mb-2">
              描きたいもの (モチーフ)
            </label>
            <textarea
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
              rows="3"
              placeholder="例: サイバーパンクな街に佇む侍、花畑で遊ぶ子犬..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
            ></textarea>
          </div>

          <div className="flex items-center gap-2 mb-2 px-1">
            <SlidersHorizontal className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-bold text-gray-700">スタイルの調合</h2>
          </div>

          <SliderControl
            label="筆の勢い・情熱"
            description="筆致の強さや生々しさを調整します。(Core: vA)"
            value={passion}
            setter={setPassion}
            leftLabel="繊細・フラット"
            rightLabel="荒々しい・厚塗り"
          />
          <SliderControl
            label="偶然性・ゆらぎ"
            description="意図しないかすれや、絵の具の飛び散りを生みます。(Core: ΔA)"
            value={chaos}
            setter={setChaos}
            leftLabel="均一・整然"
            rightLabel="ノイズ・飛び散り"
          />
          <SliderControl
            label="写実性・正確さ"
            description="デッサンの正確さやリアルさを決定します。(Core: vB)"
            value={realism}
            setter={setRealism}
            leftLabel="デフォルメ・抽象"
            rightLabel="超写実・写真風"
          />
          <SliderControl
            label="構図の整理・デザイン"
            description="画面内の要素の配置や、デザインとしての完成度。(Core: vC)"
            value={design}
            setter={setDesign}
            leftLabel="雑多・スナップ感"
            rightLabel="計算された配置"
          />

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`mt-4 w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2
              ${isGenerating 
                ? 'bg-indigo-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0'
              }`}
          >
            {isGenerating ? (
              <>
                <RefreshCcw className="w-5 h-5 animate-spin" />
                描画中...
              </>
            ) : (
              <>
                <ImageIcon className="w-5 h-5" />
                この画風で描く
              </>
            )}
          </button>
        </section>

        {/* Right Column: Preview */}
        <section className="lg:col-span-7 flex flex-col">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex-grow flex flex-col">
            <div className="bg-gray-50 border-b border-gray-100 p-4 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-bold text-gray-700">キャンバス</h2>
            </div>
            
            <div className="flex-grow p-4 flex flex-col items-center justify-center min-h-[300px] sm:min-h-[400px] bg-gray-50/50">
              {errorMsg && (
                <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
                  {errorMsg}
                </div>
              )}

              {!imageUrl && !isGenerating && !errorMsg && (
                <div className="text-gray-400 flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-200">
                    <Sparkles className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium">スライダーを調整してボタンを押してください</p>
                </div>
              )}

              {isGenerating && (
                <div className="flex flex-col items-center gap-4 text-indigo-500">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                  </div>
                  <p className="text-sm font-bold animate-pulse">AIが画風を調合し、筆を動かしています...</p>
                </div>
              )}

              {imageUrl && !isGenerating && (
                <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-500">
                  <img 
                    src={imageUrl} 
                    alt="Generated artwork" 
                    className="w-full h-auto object-contain rounded-lg shadow-md border border-gray-200"
                    style={{ maxHeight: '600px' }}
                  />
                </div>
              )}
            </div>
            
            {/* プロンプト表示エリア */}
            {(currentPrompt || isGenerating) && (
              <div className="bg-gray-800 text-gray-300 p-4 text-xs font-mono border-t border-gray-700">
                <div className="flex items-center gap-1.5 text-gray-400 mb-2 font-sans font-bold">
                  <Info className="w-3.5 h-3.5" />
                  <span>背後で生成されたプロンプト (Coreのパラメーター翻訳)</span>
                </div>
                <div className="break-words bg-gray-900 p-3 rounded-lg border border-gray-700 leading-relaxed">
                  {currentPrompt || "パラメーターを解析中..."}
                </div>
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}