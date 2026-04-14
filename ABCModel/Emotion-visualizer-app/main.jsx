import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Brain,
  HeartPulse,
  Blend,
  Quote,
  ScanText,
  CircleAlert,
  Smile,
  MoonStar,
} from "lucide-react";

const EMOTION_DEFS = [
  {
    id: "joy",
    label: "喜び",
    tone: "positive",
    aliases: [
      ["嬉しい", 3.2],
      ["うれしい", 3.2],
      ["楽しい", 3.1],
      ["幸せ", 3.8],
      ["安心", 2.6],
      ["安堵", 2.8],
      ["ほっと", 2.4],
      ["満足", 2.7],
      ["よかった", 2.3],
      ["感謝", 2.4],
      ["助かった", 2.5],
      ["心地よい", 2.7],
      ["誇らしい", 2.5],
      ["嬉しかった", 3.3],
    ],
    color: "#f59e0b",
  },
  {
    id: "sadness",
    label: "悲しみ",
    tone: "negative",
    aliases: [
      ["悲しい", 3.5],
      ["つらい", 3.4],
      ["辛い", 3.4],
      ["寂しい", 3.1],
      ["孤独", 3.2],
      ["落ち込", 3.3],
      ["泣きたい", 3.6],
      ["しんどい", 2.8],
      ["失望", 2.9],
      ["無力感", 3.3],
      ["やるせない", 3.2],
      ["切ない", 2.9],
      ["苦しい", 3.1],
      ["むなしい", 3.3],
      ["虚無", 3.5],
    ],
    color: "#6366f1",
  },
  {
    id: "anger",
    label: "怒り",
    tone: "negative",
    aliases: [
      ["腹が立つ", 3.8],
      ["イライラ", 3.2],
      ["いらいら", 3.2],
      ["苛立", 3.3],
      ["むかつく", 3.8],
      ["納得いかない", 3.0],
      ["悔しい", 2.8],
      ["憤り", 3.6],
      ["怒り", 3.4],
      ["許せない", 3.7],
      ["不満", 2.7],
      ["腹立", 3.6],
      ["カチン", 3.1],
    ],
    color: "#ef4444",
  },
  {
    id: "anxiety",
    label: "不安",
    tone: "negative",
    aliases: [
      ["不安", 3.7],
      ["心配", 3.4],
      ["怖い", 3.6],
      ["こわい", 3.6],
      ["恐い", 3.6],
      ["恐れ", 3.4],
      ["緊張", 2.7],
      ["焦り", 3.0],
      ["そわそわ", 2.5],
      ["気がかり", 2.8],
      ["落ち着かない", 2.9],
      ["胸騒ぎ", 3.2],
      ["どうしよう", 3.2],
      ["やばい", 2.4],
      ["おびえ", 3.2],
    ],
    color: "#8b5cf6",
  },
  {
    id: "surprise",
    label: "驚き",
    tone: "neutral",
    aliases: [
      ["驚", 3.0],
      ["びっくり", 3.2],
      ["意外", 2.8],
      ["まさか", 2.8],
      ["思わず", 1.8],
      ["予想外", 2.8],
      ["当惑", 3.0],
      ["戸惑", 3.0],
      ["呆然", 3.2],
    ],
    color: "#06b6d4",
  },
  {
    id: "disgust",
    label: "嫌悪",
    tone: "negative",
    aliases: [
      ["嫌", 1.8],
      ["嫌悪", 3.5],
      ["うんざり", 3.1],
      ["反感", 2.6],
      ["気持ち悪い", 3.4],
      ["しらけ", 2.7],
      ["無理", 2.1],
      ["不快", 2.8],
      ["気味が悪い", 3.3],
      ["嫌気", 3.0],
    ],
    color: "#14b8a6",
  },
  {
    id: "expectation",
    label: "期待",
    tone: "positive",
    aliases: [
      ["楽しみ", 3.3],
      ["期待", 3.2],
      ["ワクワク", 3.4],
      ["わくわく", 3.4],
      ["気になる", 1.9],
      ["知りたい", 2.6],
      ["やってみたい", 2.8],
      ["希望", 2.8],
      ["見込み", 2.4],
      ["待ち遠しい", 3.0],
    ],
    color: "#f97316",
  },
  {
    id: "trust",
    label: "信頼",
    tone: "positive",
    aliases: [
      ["信頼", 3.5],
      ["頼れる", 3.0],
      ["安心感", 3.0],
      ["心強い", 3.0],
      ["尊敬", 2.8],
      ["任せたい", 2.7],
      ["親近感", 2.8],
      ["絆", 2.9],
      ["見守られている", 3.0],
      ["打ち解け", 2.6],
    ],
    color: "#22c55e",
  },
  {
    id: "contempt",
    label: "軽蔑",
    tone: "negative",
    aliases: [
      ["見下", 3.4],
      ["軽蔑", 3.8],
      ["侮辱", 2.7],
      ["侮蔑", 3.8],
      ["冷笑", 3.2],
      ["ばかばかしい", 2.7],
      ["あきれる", 2.7],
      ["嘲", 3.1],
      ["見くび", 3.0],
    ],
    color: "#a855f7",
  },
  {
    id: "fatigue",
    label: "疲れ・だるさ",
    tone: "negative",
    aliases: [
      ["疲れ", 3.8],
      ["疲れた", 3.8],
      ["だるい", 3.6],
      ["だるさ", 3.6],
      ["倦怠", 3.6],
      ["眠い", 3.0],
      ["へとへと", 4.2],
      ["重い", 2.3],
      ["気力が出ない", 3.8],
      ["無気力", 3.8],
      ["しんどい", 2.4],
      ["だめだ", 2.4],
      ["心が動かない", 3.7],
      ["面倒", 2.5],
      ["ぐったり", 4.0],
    ],
    color: "#64748b",
  },
];

const MIXED_TERMS = [
  ["焦り", 2.4],
  ["戸惑", 2.5],
  ["もどかしい", 2.7],
  ["複雑", 3.0],
  ["そわそわ", 2.5],
  ["落ち着かない", 2.6],
  ["気まずい", 2.8],
  ["羞恥", 2.7],
  ["ためら", 2.5],
  ["悔しい", 2.8],
  ["無力感", 2.6],
  ["ノスタルジー", 2.7],
  ["後ろめたい", 2.8],
  ["居心地が悪い", 2.9],
  ["やるせない", 2.6],
];

const BODY_TERMS = [
  ["胸", 1.0],
  ["胃", 1.0],
  ["頭", 0.9],
  ["肩", 0.8],
  ["体", 1.0],
  ["息", 1.0],
  ["心臓", 1.1],
  ["手汗", 1.3],
  ["震え", 1.3],
  ["重い", 1.1],
  ["眠い", 1.2],
  ["だるい", 1.4],
  ["張る", 0.8],
  ["痛い", 1.0],
  ["圧迫感", 1.3],
];

const COGNITIVE_TERMS = [
  ["と思う", 1.1],
  ["気がする", 1.2],
  ["かもしれない", 1.5],
  ["たぶん", 1.0],
  ["もしかして", 1.2],
  ["どうしよう", 1.8],
  ["なぜ", 1.0],
  ["なんで", 1.0],
  ["べき", 1.8],
  ["はず", 1.3],
  ["無理", 1.4],
  ["失敗", 1.4],
  ["うまくいかない", 1.8],
  ["足りない", 1.2],
  ["嫌われ", 1.8],
  ["心配", 1.6],
  ["期待", 1.3],
  ["気になる", 1.4],
];

const NEGATORS = ["ない", "なく", "なかった", "ぬ", "ず", "じゃない", "ではない"];
const UNCERTAIN_WORDS = ["かもしれない", "気がする", "たぶん", "なんとなく", "もしかして"];
const EMPHASIS_WORDS = ["すごく", "かなり", "とても", "めちゃ", "本当に", "すごい", "全然"];
const SARCASM_MARKERS = ["皮肉", "笑", "w", "最高", "さすが", "ありがとうよ", "はいはい"];

const EXAMPLES = [
  "今日は頑張ったのに思ったより評価されなくて、悔しいし少し疲れた。",
  "明日の発表が近づいてきてワクワクするけど、ちゃんと話せるか不安でもある。",
  "最近ずっとだるくて、何をしても気力が出ない。",
  "あの人がいてくれると安心するし、ちゃんと任せられる気がする。",
];

const TONE_THEMES = {
  joy: { bg: "from-amber-100 via-orange-50 to-pink-50", glow: "rgba(245,158,11,0.28)" },
  sadness: { bg: "from-indigo-100 via-sky-50 to-slate-50", glow: "rgba(99,102,241,0.24)" },
  anger: { bg: "from-rose-100 via-orange-50 to-red-50", glow: "rgba(239,68,68,0.22)" },
  anxiety: { bg: "from-violet-100 via-fuchsia-50 to-slate-50", glow: "rgba(139,92,246,0.22)" },
  surprise: { bg: "from-cyan-100 via-sky-50 to-white", glow: "rgba(6,182,212,0.22)" },
  disgust: { bg: "from-teal-100 via-emerald-50 to-white", glow: "rgba(20,184,166,0.24)" },
  expectation: { bg: "from-orange-100 via-amber-50 to-yellow-50", glow: "rgba(249,115,22,0.22)" },
  trust: { bg: "from-green-100 via-emerald-50 to-white", glow: "rgba(34,197,94,0.20)" },
  contempt: { bg: "from-purple-100 via-fuchsia-50 to-white", glow: "rgba(168,85,247,0.22)" },
  fatigue: { bg: "from-slate-200 via-slate-100 to-white", glow: "rgba(100,116,139,0.25)" },
};

const ANALYZER_OPTIONS = [
  { id: "llm", label: "LLM分析", description: "文脈・含み・複雑な感情の読み取りを優先" },
  { id: "rule", label: "簡易分析", description: "キーワード中心の軽量分析" },
];

const EMOTION_ORDER = ["喜び", "悲しみ", "怒り", "不安", "驚き", "嫌悪", "期待", "信頼", "軽蔑", "疲れ・だるさ"];
const TYPE_ORDER = ["考えの感情", "身体的な感情", "混ざった感情"];

function escapeRegExp(str) {
  return str.replace(/[|\{}()[\]^$+*?.]/g, "\$&");
}

function countMatches(text, keyword) {
  if (!keyword) return 0;
  const regex = new RegExp(escapeRegExp(keyword), "g");
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function softmax(values, temperature = 1.15) {
  const safe = values.map((v) => Math.max(v, 0.01));
  const exps = safe.map((v) => Math.exp(v / temperature));
  const sum = exps.reduce((a, b) => a + b, 0) || 1;
  return exps.map((v) => (v / sum) * 100);
}

function roundToTensDisplay(percent) {
  return clamp(Math.round(percent / 10), 1, 10);
}

function normalizeTop(items) {
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
  let normalized = items.map((item) => ({
    ...item,
    percent: Math.round((item.value / total) * 100),
  }));
  let diff = 100 - normalized.reduce((sum, item) => sum + item.percent, 0);
  let index = 0;
  while (diff !== 0 && normalized.length > 0 && index < 40) {
    const target = normalized[index % normalized.length];
    target.percent += diff > 0 ? 1 : -1;
    diff += diff > 0 ? -1 : 1;
    index += 1;
  }
  return normalized;
}

function makeBar(count) {
  return Array.from({ length: count }).map((_, idx) => idx);
}

function pickTheme(dominantId) {
  return TONE_THEMES[dominantId] || TONE_THEMES.joy;
}

function splitClauses(text) {
  return text
    .split(/[\n。！？!?,、]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function findContextSnippets(text, keywords, maxItems = 3) {
  const found = [];
  keywords.forEach((keyword) => {
    if (!keyword) return;
    const index = text.indexOf(keyword);
    if (index === -1) return;
    const start = Math.max(0, index - 6);
    const end = Math.min(text.length, index + keyword.length + 6);
    const snippet = text.slice(start, end).replace(/[\n]/g, " ").trim();
    const cleaned = snippet.replace(/^[、。\s]+|[、。\s]+$/g, "");
    if (cleaned.length >= 3 && cleaned.length <= 20 && !found.includes(cleaned)) {
      found.push(cleaned);
    }
  });
  return found.slice(0, maxItems);
}

function extractABC(text, sortedEmotions) {
  const clauses = splitClauses(text);
  const beliefPatterns = [
    /[^。！？\n]{0,12}(べき|はず|無理|だめ|ダメ|失敗|足りない|向いてない|嫌われ|心配|不安|怖い|こわい|気になる|どうしよう|楽しみ|期待)[^。！？\n]{0,10}/g,
    /[^。！？\n]{0,12}(と思う|気がする|かもしれない|もしかして)[^。！？\n]{0,10}/g,
  ];

  const eventPatterns = [
    /[^。！？\n]{0,16}(言われた|された|起きた|あった|なくなった|遅れた|間に合わない|間に合わなかった|失敗した|うまくいかない|うまくいかなかった|疲れた|しんどい|評価されない|評価されなくて)[^。！？\n]{0,10}/g,
  ];

  const beliefs = [];
  beliefPatterns.forEach((pattern) => {
    const matches = text.match(pattern) || [];
    matches.forEach((match) => {
      const cleaned = match.trim();
      if (cleaned.length >= 3 && cleaned.length <= 28 && !beliefs.includes(cleaned)) beliefs.push(cleaned);
    });
  });

  const events = [];
  eventPatterns.forEach((pattern) => {
    const matches = text.match(pattern) || [];
    matches.forEach((match) => {
      const cleaned = match.trim();
      if (cleaned.length >= 3 && cleaned.length <= 28 && !events.includes(cleaned)) events.push(cleaned);
    });
  });

  if (events.length === 0 && clauses[0]) {
    events.push(clauses[0].slice(0, 26));
  }

  if (beliefs.length === 0) {
    const fallbackBelief = clauses.find((clause) =>
      ["と思う", "気がする", "かもしれない", "べき", "無理", "どうしよう", "心配", "楽しみ"].some((word) => clause.includes(word))
    );
    if (fallbackBelief) beliefs.push(fallbackBelief.slice(0, 26));
  }

  const emotionFlow = sortedEmotions.slice(0, 3).map((item) => item.label);

  return {
    event: events[0] || "はっきりした出来事表現は少なめ",
    beliefs: beliefs.slice(0, 2),
    feelings: emotionFlow,
  };
}

function buildSummary(topEmotions, typeRank, abc, tendency) {
  const labels = topEmotions.map((item) => item.label);
  const dominant = labels[0] || "気持ち";
  const second = labels[1];
  const typeLabel = typeRank[0]?.label || "考えの感情";

  const line1 =
    dominant === "疲れ・だるさ"
      ? "いちばん目立っているのは、気持ちそのものよりも『消耗感や重さ』です。"
      : second
      ? `中心にあるのは「${dominant}」で、「${second}」も一緒に動いています。`
      : `中心にあるのは「${dominant}」です。`;

  const line2 =
    typeLabel === "身体的な感情"
      ? "頭の中の考えより、体の反応やエネルギーの落ち方が強く出ています。"
      : typeLabel === "混ざった感情"
      ? "考えと体の反応が重なって、気持ちがひとつに絞りにくい状態です。"
      : "気持ちは、出来事そのものより『どう受け止めたか』の影響を受けやすい流れです。";

  const line3 = abc.beliefs[0]
    ? `文章では「${abc.event}」をきっかけに、「${abc.beliefs[0]}」という受け止め方が気持ちの動きにつながっています。`
    : `文章では「${abc.event}」をきっかけに、${tendency === "ネガティブ" ? "気持ちが内側に沈みやすい" : tendency === "ポジティブ" ? "前向きな見通しが広がりやすい" : "複数の気持ちが同時に動きやすい"}様子が見えます。`;

  return [line1, line2, line3];
}

function detectSarcasm(text, positiveScore, negativeScore) {
  const sarcasmHits = SARCASM_MARKERS.reduce((sum, word) => sum + countMatches(text, word), 0);
  const mismatch = positiveScore > 4 && negativeScore > 5 ? 1 : 0;
  return sarcasmHits + mismatch > 1;
}

function normalizePercentItems(items, preferredOrder = []) {
  const filtered = items.filter((item) => item && Number.isFinite(item.percent) && item.percent > 0);
  const sorted = [...filtered].sort((a, b) => {
    const orderA = preferredOrder.indexOf(a.label);
    const orderB = preferredOrder.indexOf(b.label);
    if (orderA !== -1 || orderB !== -1) {
      return (orderA === -1 ? 999 : orderA) - (orderB === -1 ? 999 : orderB);
    }
    return b.percent - a.percent;
  });
  let sum = sorted.reduce((acc, item) => acc + item.percent, 0);
  if (sum === 0) return [];
  const normalized = sorted.map((item) => ({ ...item, percent: Math.round((item.percent / sum) * 100) }));
  let diff = 100 - normalized.reduce((acc, item) => acc + item.percent, 0);
  let i = 0;
  while (diff !== 0 && normalized.length > 0 && i < 100) {
    normalized[i % normalized.length].percent += diff > 0 ? 1 : -1;
    diff += diff > 0 ? -1 : 1;
    i += 1;
  }
  return normalized;
}

function coerceEmotionColor(label) {
  return EMOTION_DEFS.find((def) => def.label === label)?.color || "#94a3b8";
}

function sanitizeLLMResponse(payload, originalText) {
  if (!payload || typeof payload !== "object") return null;

  const emotions = normalizePercentItems(
    Array.isArray(payload.emotions)
      ? payload.emotions.map((item) => ({
          id: EMOTION_DEFS.find((def) => def.label === item.label)?.id || item.label,
          label: item.label,
          percent: clamp(Number(item.percent) || 0, 0, 100),
          color: coerceEmotionColor(item.label),
        }))
      : [],
    EMOTION_ORDER
  ).slice(0, 5);

  const l0 = normalizePercentItems(
    Array.isArray(payload.types)
      ? payload.types.map((item) => ({
          label: item.label,
          percent: clamp(Number(item.percent) || 0, 0, 100),
          icon: item.label === "考えの感情" ? Brain : item.label === "身体的な感情" ? HeartPulse : Blend,
        }))
      : [],
    TYPE_ORDER
  );

  if (emotions.length === 0 || l0.length === 0) return null;

  return {
    text: originalText,
    emotions,
    l0,
    summaryLines: Array.isArray(payload.summaryLines) ? payload.summaryLines.filter(Boolean).slice(0, 3) : [],
    keyPhrases: Array.isArray(payload.keyPhrases) ? payload.keyPhrases.filter(Boolean).slice(0, 3) : [],
    sarcasm: Boolean(payload.sarcasm),
    intensity: ["弱い", "やや弱い", "中程度", "やや強い", "強い"].includes(payload.intensity) ? payload.intensity : "中程度",
    tendency: ["ポジティブ", "ニュートラル", "ネガティブ"].includes(payload.tendency) ? payload.tendency : "ニュートラル",
    abc: {
      event: payload?.abc?.event?.trim() || "はっきりした出来事表現は少なめ",
      beliefs: Array.isArray(payload?.abc?.beliefs) ? payload.abc.beliefs.filter(Boolean).slice(0, 2) : [],
      feelings: Array.isArray(payload?.abc?.feelings) ? payload.abc.feelings.filter(Boolean).slice(0, 3) : emotions.slice(0, 3).map((item) => item.label),
    },
    dominantId: EMOTION_DEFS.find((def) => def.label === emotions[0]?.label)?.id || "joy",
    source: "llm",
  };
}

function buildLLMPrompt(text) {
  return `あなたは日本語の感情分析エンジンです。出力はJSONのみ。説明文は禁止。

固定の感情カテゴリ: 喜び, 悲しみ, 怒り, 不安, 驚き, 嫌悪, 期待, 信頼, 軽蔑, 疲れ・だるさ
上位5種類まで、合計100%。
固定の感情タイプ: 考えの感情, 身体的な感情, 混ざった感情
こちらも合計100%。
原文から感情が出ている短いフレーズを最大3つ抽出。
ABCモデルとして event, beliefs, feelings を返す。
summaryLines は専門用語を避けた日本語3文以内。
sarcasm は boolean。
intensity は 弱い / やや弱い / 中程度 / やや強い / 強い のいずれか。
tendency は ポジティブ / ニュートラル / ネガティブ のいずれか。

JSON schema:
{
  \"emotions\": [{\"label\": string, \"percent\": number}],
  \"types\": [{\"label\": string, \"percent\": number}],
  \"summaryLines\": [string],
  \"keyPhrases\": [string],
  \"sarcasm\": boolean,
  \"intensity\": string,
  \"tendency\": string,
  \"abc\": {\"event\": string, \"beliefs\": [string], \"feelings\": [string]}
}

入力文:
${text}`;
}

async function requestLLMAnalysis(text) {
  const response = await fetch("/api/analyze-emotion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, prompt: buildLLMPrompt(text) }),
  });

  if (!response.ok) throw new Error("LLM分析に失敗しました");

  const data = await response.json();
  return sanitizeLLMResponse(data, text);
}

function analyzeText(text) {
  const cleaned = text.trim();
  if (!cleaned) return null;

  const rawScores = Object.fromEntries(EMOTION_DEFS.map((def) => [def.id, 0]));
  const evidenceWords = [];

  EMOTION_DEFS.forEach((def) => {
    def.aliases.forEach(([keyword, weight]) => {
      const hits = countMatches(cleaned, keyword);
      if (hits > 0) {
        rawScores[def.id] += hits * weight;
        evidenceWords.push(keyword);
      }

      const negHitsAfter = NEGATORS.reduce(
        (sum, neg) => sum + countMatches(cleaned, `${keyword}${neg}`),
        0
      );
      const negHitsBefore = NEGATORS.reduce(
        (sum, neg) => sum + countMatches(cleaned, `${neg}${keyword}`),
        0
      );
      const negHits = negHitsAfter + negHitsBefore;

      if (negHits > 0) {
        if (["joy", "trust", "expectation"].includes(def.id)) {
          rawScores[def.id] -= negHits * weight * 0.55;
          rawScores.sadness += negHits * 0.9;
          rawScores.anxiety += negHits * 0.7;
        } else if (["sadness", "anger", "anxiety", "disgust", "contempt"].includes(def.id)) {
          rawScores[def.id] -= negHits * weight * 0.35;
          rawScores.trust += negHits * 0.5;
          rawScores.joy += negHits * 0.35;
        }
      }
    });
  });

  Object.keys(rawScores).forEach((key) => {
    rawScores[key] = Math.max(rawScores[key], 0);
  });

  const mixedSignal = MIXED_TERMS.reduce((sum, [word, weight]) => sum + countMatches(cleaned, word) * weight, 0);
  const physioSignal = BODY_TERMS.reduce((sum, [word, weight]) => sum + countMatches(cleaned, word) * weight, 0);
  const cognitiveSignal = COGNITIVE_TERMS.reduce((sum, [word, weight]) => sum + countMatches(cleaned, word) * weight, 0);
  const uncertaintySignal = UNCERTAIN_WORDS.reduce((sum, word) => sum + countMatches(cleaned, word), 0);
  const emphasisSignal = EMPHASIS_WORDS.reduce((sum, word) => sum + countMatches(cleaned, word), 0) + countMatches(cleaned, "!") + countMatches(cleaned, "！");

  const positiveScore = rawScores.joy + rawScores.expectation + rawScores.trust;
  const negativeScore = rawScores.sadness + rawScores.anger + rawScores.anxiety + rawScores.disgust + rawScores.contempt + rawScores.fatigue;
  const significantCount = Object.values(rawScores).filter((value) => value >= 2.6).length;

  const l0Raw = [
    cognitiveSignal + (rawScores.joy + rawScores.sadness + rawScores.anger + rawScores.anxiety + rawScores.expectation + rawScores.trust + rawScores.contempt + rawScores.disgust + rawScores.surprise) * 0.26,
    physioSignal + rawScores.fatigue * 0.95,
    mixedSignal + uncertaintySignal * 1.2 + (positiveScore > 0 && negativeScore > 0 ? 2.5 : 0) + (significantCount >= 3 ? 1.5 : 0),
  ];

  const l0Labels = ["考えの感情", "身体的な感情", "混ざった感情"];
  const l0Percents = softmax(l0Raw, 1.18).map((value) => Math.round(value));
  let l0Diff = 100 - l0Percents.reduce((a, b) => a + b, 0);
  let l0Index = 0;
  while (l0Diff !== 0) {
    l0Percents[l0Index % l0Percents.length] += l0Diff > 0 ? 1 : -1;
    l0Diff += l0Diff > 0 ? -1 : 1;
    l0Index += 1;
  }

  const l0 = l0Labels.map((label, idx) => ({
    label,
    percent: l0Percents[idx],
    icon: idx === 0 ? Brain : idx === 1 ? HeartPulse : Blend,
  }));

  const topEmotions = normalizeTop(
    Object.entries(rawScores)
      .map(([id, value]) => ({
        id,
        value: value + (id === "surprise" && value === 0 && cleaned.includes("!?") ? 1.5 : 0),
        label: EMOTION_DEFS.find((def) => def.id === id)?.label || id,
        color: EMOTION_DEFS.find((def) => def.id === id)?.color || "#94a3b8",
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  );

  const finalTopEmotions = topEmotions.length
    ? topEmotions
    : normalizeTop([
        { id: "trust", label: "信頼", value: 1, color: "#22c55e" },
        { id: "surprise", label: "驚き", value: 1, color: "#06b6d4" },
      ]);

  const sarcasm = detectSarcasm(cleaned, positiveScore, negativeScore);
  const intensityScore = negativeScore + positiveScore + mixedSignal + physioSignal + emphasisSignal * 0.8;
  const intensity =
    intensityScore < 5
      ? "弱い"
      : intensityScore < 9
      ? "やや弱い"
      : intensityScore < 14
      ? "中程度"
      : intensityScore < 19
      ? "やや強い"
      : "強い";

  const tendency =
    positiveScore > negativeScore * 1.15
      ? "ポジティブ"
      : negativeScore > positiveScore * 1.1
      ? "ネガティブ"
      : "ニュートラル";

  const keyPhrases = (() => {
    const snippets = findContextSnippets(cleaned, evidenceWords, 3);
    if (snippets.length > 0) return snippets;

    const clauses = splitClauses(cleaned)
      .map((clause) => ({
        clause,
        score:
          EMOTION_DEFS.flatMap((def) => def.aliases.map(([keyword]) => keyword)).reduce((sum, keyword) => sum + countMatches(clause, keyword), 0) +
          COGNITIVE_TERMS.reduce((sum, [word]) => sum + countMatches(clause, word), 0),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.clause.slice(0, 20));

    return [...new Set(clauses)].slice(0, 3);
  })();

  const abc = extractABC(cleaned, finalTopEmotions);
  const summaryLines = buildSummary([...finalTopEmotions], [...l0].sort((a, b) => b.percent - a.percent), abc, tendency);

  return {
    text: cleaned,
    emotions: finalTopEmotions,
    l0: [...l0].sort((a, b) => b.percent - a.percent),
    summaryLines,
    keyPhrases,
    sarcasm,
    intensity,
    tendency,
    abc,
    dominantId: finalTopEmotions[0]?.id || "joy",
    source: "rule",
  };
}

function AnalysisLoadingCard() {
  return (
    <div className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-[0_10px_35px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 animate-pulse rounded-2xl bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-40 animate-pulse rounded-full bg-slate-200" />
          <div className="h-3 w-64 animate-pulse rounded-full bg-slate-100" />
        </div>
      </div>
      <div className="mt-5 space-y-3">
        <div className="h-20 animate-pulse rounded-3xl bg-slate-100" />
        <div className="h-20 animate-pulse rounded-3xl bg-slate-100" />
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, children, right }) {
  return (
    <div className="rounded-[28px] border border-white/70 bg-white/85 p-4 shadow-[0_10px_35px_rgba(15,23,42,0.08)] backdrop-blur md:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900 md:text-lg">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function TinyBlocks({ percent, color }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {makeBar(roundToTensDisplay(percent)).map((block) => (
        <span
          key={block}
          className="h-2.5 w-5 rounded-full"
          style={{ backgroundColor: color, opacity: 0.95 }}
        />
      ))}
    </div>
  );
}

function Donut({ items }) {
  const gradient = items
    .map((item, index) => {
      const start = items.slice(0, index).reduce((sum, current) => sum + current.percent, 0);
      const end = start + item.percent;
      return `${item.color} ${start}% ${end}%`;
    })
    .join(", ");

  return (
    <div className="relative mx-auto h-40 w-40 shrink-0 md:h-44 md:w-44">
      <div
        className="h-full w-full rounded-full shadow-inner"
        style={{ background: `conic-gradient(${gradient})` }}
      />
      <div className="absolute inset-[18%] flex items-center justify-center rounded-full bg-white/90 text-center shadow-inner">
        <div>
          <p className="text-xs text-slate-500">主な気持ち</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{items[0]?.label}</p>
        </div>
      </div>
    </div>
  );
}

function FlowPill({ label, text, accent }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: `${accent}18`, color: accent }}>
        {label}
      </div>
      <p className="text-sm leading-6 text-slate-700">{text}</p>
    </div>
  );
}

export default function EmotionVisualizerApp() {
  const [input, setInput] = useState(EXAMPLES[0]);
  const [mode, setMode] = useState("llm");
  const [analysis, setAnalysis] = useState(() => analyzeText(EXAMPLES[0]));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fallbackAnalysis = useMemo(() => analyzeText(input), [input]);

  useEffect(() => {
    let active = true;
    const text = input.trim();

    if (!text) {
      setAnalysis(null);
      setError("");
      setLoading(false);
      return;
    }

    if (mode === "rule") {
      setAnalysis(fallbackAnalysis);
      setError("");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const timer = setTimeout(async () => {
      try {
        const llmResult = await requestLLMAnalysis(text);
        if (!active) return;
        if (llmResult) {
          setAnalysis(llmResult);
          setError("");
        } else {
          setAnalysis(fallbackAnalysis);
          setError("LLMの応答が不完全だったため、簡易分析で表示しています。");
        }
      } catch (e) {
        if (!active) return;
        setAnalysis(fallbackAnalysis);
        setError("LLMに接続できなかったため、簡易分析で表示しています。/api/analyze-emotion を実装するとLLM分析に切り替わります。");
      } finally {
        if (active) setLoading(false);
      }
    }, 450);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [input, mode, fallbackAnalysis]);

  const theme = pickTheme((analysis || fallbackAnalysis)?.dominantId || "joy");
  const visibleAnalysis = analysis || fallbackAnalysis;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.bg} text-slate-900`}>
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-5 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-[32px] border border-white/70 bg-white/72 shadow-[0_20px_60px_rgba(15,23,42,0.10)] backdrop-blur"
        >
          <div className="relative overflow-hidden p-5 md:p-8">
            <div
              className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full blur-3xl"
              style={{ background: theme.glow }}
            />
            <div className="relative grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-3 py-1.5 text-sm text-slate-600">
                  <Sparkles className="h-4 w-4" />
                  ことばの気持ちを、見やすくやさしく可視化
                </div>
                <h1 className="text-2xl font-bold leading-tight md:text-4xl">
                  入力したテキストの中に、
                  <span className="block">どれだけ感情が含まれているかを見える化するアプリ</span>
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                  LLMなら文脈や含みも読み取り、簡易分析なら軽くすばやく判定します。
                  文章の中の「きっかけ」「受け止め方」「出てきた気持ち」も、やさしい言葉で追える設計です。
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {[
                  { icon: Brain, title: "考えの感情", body: "判断や心配、期待などの頭の中の動き" },
                  { icon: HeartPulse, title: "身体的な感情", body: "疲れ・だるさ・緊張など体に出るサイン" },
                  { icon: Blend, title: "混ざった感情", body: "焦りや戸惑いなど、ひとつに絞れない気持ち" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="rounded-[24px] border border-white/80 bg-white/85 p-4 shadow-sm">
                      <Icon className="mb-3 h-5 w-5 text-slate-700" />
                      <h2 className="font-semibold text-slate-900">{item.title}</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-6">
            <SectionCard
              title="テキストを入力"
              subtitle="そのまま貼るだけで分析できます。スマホでも押しやすい大きめ操作です。"
              right={<ScanText className="h-5 w-5 text-slate-400" />}
            >
              <div className="mb-4 grid gap-2 sm:grid-cols-2">
                {ANALYZER_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setMode(option.id)}
                    className={`rounded-[20px] border px-4 py-3 text-left transition ${
                      mode === option.id
                        ? "border-slate-900 bg-slate-900 text-white shadow-md"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="text-sm font-semibold">{option.label}</div>
                    <div className={`mt-1 text-xs leading-5 ${mode === option.id ? "text-slate-200" : "text-slate-500"}`}>{option.description}</div>
                  </button>
                ))}
              </div>

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="ここに文章を入力してください"
                className="min-h-[180px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-base leading-7 text-slate-800 outline-none transition focus:border-slate-300 focus:bg-white"
              />

              <div className="mt-4 flex flex-wrap gap-2">
                {EXAMPLES.map((example, index) => (
                  <button
                    key={example}
                    onClick={() => setInput(example)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50"
                  >
                    例文 {index + 1}
                  </button>
                ))}
              </div>

              <div className="mt-4 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                {mode === "llm"
                  ? "LLM分析では /api/analyze-emotion に prompt と text を送ります。JSONが返れば、その結果を画面に表示します。"
                  : "簡易分析では、この画面内のロジックだけで判定します。接続なしでも動きます。"}
              </div>
            </SectionCard>

            {error ? (
              <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                {error}
              </div>
            ) : null}

            {loading && mode === "llm" ? <AnalysisLoadingCard /> : null}

            {visibleAnalysis ? (
              <>
                <SectionCard title="1. 入力文" subtitle="原文をそのまま表示します。" right={<Quote className="h-5 w-5 text-slate-400" />}>
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-[15px] leading-8 text-slate-700">
                    {visibleAnalysis.text}
                  </div>
                </SectionCard>

                <SectionCard
                  title="2. 感情の割合（主な気持ち）"
                  subtitle="最大5種類までを、合計100%で見やすく並べています。"
                  right={<Smile className="h-5 w-5 text-slate-400" />}
                >
                  <div className="mb-4 flex items-center justify-between gap-3 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <span>現在の分析方式</span>
                    <span className="rounded-full bg-white px-3 py-1 font-medium text-slate-900">
                      {visibleAnalysis.source === "llm" ? "LLM分析" : "簡易分析"}
                    </span>
                  </div>
                  <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                    <Donut items={visibleAnalysis.emotions} />
                    <div className="space-y-4">
                      {visibleAnalysis.emotions.map((emotion) => (
                        <div key={emotion.id} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: emotion.color }} />
                              <span className="font-medium text-slate-800">{emotion.label}</span>
                            </div>
                            <span className="text-sm font-semibold text-slate-700">{emotion.percent}%</span>
                          </div>
                          <TinyBlocks percent={emotion.percent} color={emotion.color} />
                        </div>
                      ))}
                    </div>
                  </div>
                </SectionCard>

                <SectionCard
                  title="3. 感情タイプの分類（3つの性質）"
                  subtitle="考え寄り・体寄り・混ざり具合を分けて見ます。"
                  right={<Blend className="h-5 w-5 text-slate-400" />}
                >
                  <div className="overflow-hidden rounded-[24px] border border-slate-200">
                    <div className="grid grid-cols-[1.1fr_0.45fr_0.95fr] bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      <div>種類</div>
                      <div>割合</div>
                      <div>バー</div>
                    </div>
                    <div className="divide-y divide-slate-100 bg-white">
                      {visibleAnalysis.l0.map((row) => {
                        const Icon = row.icon;
                        return (
                          <div key={row.label} className="grid grid-cols-[1.1fr_0.45fr_0.95fr] items-center gap-3 px-4 py-4 text-sm text-slate-700">
                            <div className="flex items-center gap-2 font-medium text-slate-800">
                              <Icon className="h-4 w-4 text-slate-500" />
                              {row.label}
                            </div>
                            <div className="font-semibold">{row.percent}%</div>
                            <div className="flex flex-wrap gap-1.5">
                              {makeBar(roundToTensDisplay(row.percent)).map((block) => (
                                <span key={block} className="h-2.5 w-5 rounded-full bg-slate-300" />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="4. 感情の簡易まとめ" subtitle="専門用語を使わず、やさしい言葉で整理します。" right={<Sparkles className="h-5 w-5 text-slate-400" />}>
                  <div className="space-y-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    {visibleAnalysis.summaryLines.map((line) => (
                      <p key={line} className="text-[15px] leading-7 text-slate-700">
                        {line}
                      </p>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="5. 文章中のポイント表示" subtitle="感情が表れやすい箇所を、原文から短く抜き出しています。" right={<MoonStar className="h-5 w-5 text-slate-400" />}>
                  <div className="flex flex-wrap gap-3">
                    {visibleAnalysis.keyPhrases.length > 0 ? (
                      visibleAnalysis.keyPhrases.map((phrase) => (
                        <div key={phrase} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 shadow-sm">
                          {phrase}
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                        特に強い表現は少なめです。
                      </div>
                    )}
                  </div>
                </SectionCard>

                <SectionCard title="6. 追加情報" subtitle="理解を助ける補足です。" right={<CircleAlert className="h-5 w-5 text-slate-400" />}>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">皮肉の有無</p>
                      <p className="mt-3 text-lg font-semibold text-slate-900">{visibleAnalysis.sarcasm ? "ありの可能性" : "目立たない"}</p>
                    </div>
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">気持ちの強さ</p>
                      <p className="mt-3 text-lg font-semibold text-slate-900">{visibleAnalysis.intensity}</p>
                    </div>
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">全体としての傾向</p>
                      <p className="mt-3 text-lg font-semibold text-slate-900">{visibleAnalysis.tendency}</p>
                    </div>
                  </div>
                </SectionCard>
              </>
            ) : null}
          </div>

          <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            {visibleAnalysis ? (
              <>
                <SectionCard title="気持ちが動いた流れ" subtitle="ABCモデルを、わかりやすい言い方に置き換えて表示しています。">
                  <div className="space-y-3">
                    <FlowPill label="きっかけ" text={visibleAnalysis.abc.event} accent="#2563eb" />
                    <FlowPill
                      label="頭の中で起きたこと"
                      text={visibleAnalysis.abc.beliefs.length > 0 ? visibleAnalysis.abc.beliefs.join(" / ") : "はっきりした理由表現は少なめ"}
                      accent="#ea580c"
                    />
                    <FlowPill label="出てきた気持ち" text={visibleAnalysis.abc.feelings.join(" / ")} accent="#dc2626" />
                  </div>
                </SectionCard>

                <SectionCard title="この判定の考え方" subtitle="LLMでも出力形式は固定し、表示のわかりやすさを保っています。">
                  <div className="space-y-3 text-sm leading-7 text-slate-700">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="font-medium text-slate-900">1. LLMには固定のJSONだけ返してもらう</p>
                      <p>感情カテゴリ、割合、要点、ABCの流れを決まった形で返させるので、UIが崩れません。</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="font-medium text-slate-900">2. 文脈を読む分析と、軽い分析を切り替えられる</p>
                      <p>複雑な文脈はLLM、接続なしや高速確認では簡易分析、という使い分けができます。</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="font-medium text-slate-900">3. LLMが失敗したときも止まらない</p>
                      <p>API未接続やJSON欠損時は、自動で簡易分析に戻して結果を表示します。</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="font-medium text-slate-900">4. 本番ではサーバー側でモデルを呼ぶ</p>
                      <p>この画面は /api/analyze-emotion を呼ぶ前提です。APIキーはフロントに置かない構成にしています。</p>
                    </div>
                  </div>
                </SectionCard>
              </>
            ) : (
              <SectionCard title="使い方" subtitle="まずは文章を入力すると、ここに分析結果が出ます。">
                <div className="space-y-3 text-sm leading-7 text-slate-600">
                  <p>短文でも長文でも使えます。気持ちの割合、体の反応、文章の中の注目ポイントまで一度に確認できます。</p>
                  <p>スマホではカードが縦に並ぶので、親指だけでも読み進めやすい作りです。</p>
                </div>