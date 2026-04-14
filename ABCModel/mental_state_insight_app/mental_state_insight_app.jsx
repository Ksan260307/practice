import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, HeartPulse, Brain, ShieldCheck, Users, Sparkles } from "lucide-react";

const clamp = (value, min = 0, max = 2) => Math.min(max, Math.max(min, value));
const toInternal = (value) => value / 50;
const toPercent = (value) => Math.round((value / 2) * 100);
const band = (value) => (value <= 0.5 ? "low" : value < 1.5 ? "mid" : "high");
const deltaBand = (value) => (value < 0.5 ? "stable" : value < 1.5 ? "swing" : "spike");
const stateMag = { normal: 0, zero: 1, runaway: 2 };
const friendlyState = {
  normal: "ふつう",
  runaway: "強く出ている",
  zero: "止まり気味",
};

const presets = {
  balanced: {
    label: "落ち着いている日",
    values: {
      a: 70,
      b: 42,
      c: 48,
      da: 28,
      db: 34,
      dc: 32,
      stateA: "normal",
      stateB: "normal",
      stateC: "normal",
      e0: 24,
      e1: 26,
      e2: 30,
      e3: 20,
      bType: "mixed",
      cType: "c2",
      socialSensitivity: "normal",
    },
  },
  social: {
    label: "比較で疲れている日",
    values: {
      a: 38,
      b: 76,
      c: 72,
      da: 42,
      db: 68,
      dc: 74,
      stateA: "normal",
      stateB: "runaway",
      stateC: "runaway",
      e0: 34,
      e1: 48,
      e2: 82,
      e3: 58,
      bType: "external",
      cType: "c4",
      socialSensitivity: "high",
    },
  },
  overload: {
    label: "考えすぎで重い日",
    values: {
      a: 32,
      b: 56,
      c: 84,
      da: 36,
      db: 50,
      dc: 82,
      stateA: "normal",
      stateB: "normal",
      stateC: "runaway",
      e0: 52,
      e1: 42,
      e2: 56,
      e3: 74,
      bType: "internal",
      cType: "c3",
      socialSensitivity: "normal",
    },
  },
  drained: {
    label: "体力が切れている日",
    values: {
      a: 22,
      b: 46,
      c: 64,
      da: 54,
      db: 42,
      dc: 58,
      stateA: "zero",
      stateB: "normal",
      stateC: "normal",
      e0: 86,
      e1: 52,
      e2: 34,
      e3: 46,
      bType: "mixed",
      cType: "c2",
      socialSensitivity: "normal",
    },
  },
};

const initialState = {
  a: 62,
  b: 48,
  c: 54,
  da: 34,
  db: 42,
  dc: 46,
  stateA: "normal",
  stateB: "normal",
  stateC: "normal",
  e0: 30,
  e1: 34,
  e2: 44,
  e3: 32,
  bType: "mixed",
  cType: "c2",
  socialSensitivity: "normal",
};

function g(value) {
  return 0.5 * Math.tanh(0.7 * value);
}

function labelFromScore(score) {
  if (score <= 2) return { title: "落ち着きあり", tone: "今は大きく崩れにくい状態です。" };
  if (score <= 4) return { title: "少し負荷あり", tone: "無理を重ねる前に整えるのがよさそうです。" };
  if (score === 5) return { title: "要リセット", tone: "休息や負荷調整を優先したい状態です。" };
  return { title: "かなりしんどい", tone: "まず安全と休息を確保したい状態です。" };
}

function mapSocialSensitivity(value) {
  if (value === "high") return 2;
  if (value === "low") return 0.85;
  return 1;
}

function cTypeLabel(value) {
  return {
    c1: "構造で整理しやすい",
    c2: "場を整えて落ち着きやすい",
    c3: "自分を見すぎてしまいやすい",
    c4: "人間関係や空気を拾いやすい",
  }[value];
}

function bTypeLabel(value) {
  return {
    internal: "自分の理想や基準を見やすい",
    external: "周りの目や比較を見やすい",
    mixed: "内と外の両方を見やすい",
  }[value];
}

function computeInsight(form) {
  const raw = {
    A: toInternal(form.a),
    B: toInternal(form.b),
    C: toInternal(form.c),
    dA: toInternal(form.da),
    dB: toInternal(form.db),
    dC: toInternal(form.dc),
    E0: toInternal(form.e0),
    E1: toInternal(form.e1),
    E2: toInternal(form.e2),
    E3: toInternal(form.e3),
  };

  const social = mapSocialSensitivity(form.socialSensitivity);
  const gammaSocial = form.cType === "c4" ? Math.min(2, social * 1.1) : social;
  const kappaSocialC = form.cType === "c4" ? 0.2 : 0;
  const adjE2 = clamp(Math.min(2, raw.E2 + (gammaSocial - 1)));

  let vA1 = clamp(raw.A - 0.5 * (raw.E0 + raw.E1 + raw.E3));
  let vB1 = clamp(raw.B + Math.max(0.5 * adjE2, 0.5 * raw.E3));
  let vC1 = clamp(raw.C + Math.max(0.5 * adjE2, 0.5 * raw.E3, 0.5 * raw.E0));

  let dA1 = clamp(Math.max(raw.dA, raw.E0, raw.E1, raw.E3));
  let dB1 = clamp(Math.max(raw.dB, raw.E2, raw.E3));
  let dC1 = clamp(Math.max(raw.dC, raw.E2, raw.E3, raw.E0) + (adjE2 === 2 ? kappaSocialC : 0));

  if (form.bType === "internal") dB1 = clamp(dB1 - 0.04);
  if (form.bType === "external") dB1 = clamp(dB1 + 0.08);
  if (form.cType === "c2") dC1 = clamp(dC1 - 0.05);
  if (form.cType === "c3") dC1 = clamp(dC1 + 0.08);

  const states = {
    A: form.stateA,
    B: form.stateB,
    C: form.stateC,
  };

  const boostB = deltaBand(dB1) === "spike" ? 1.35 : 1;
  const boostC = deltaBand(dC1) === "spike" ? 1.35 : 1;
  const boostA = deltaBand(dA1) === "spike" ? 1.35 : 1;

  let vA2 = clamp(vA1 + (states.C === "runaway" ? 0.9 * -1 * g(vC1) * boostC : 0));
  let vB2 = clamp(
    vB1 +
      (states.A === "runaway"
        ? 0.9 * -1 * g(vA1) * boostA * (form.bType === "internal" ? 0.8 : 1)
        : 0)
  );

  const gateE2C = adjE2 / 2;
  let vC2 = clamp(
    vC1 +
      (1 - gateE2C) *
        (states.B === "runaway" ? 0.9 * 1 * g(vB1) * boostB : 0)
  );

  let dA2 = Math.max(
    dA1,
    states.A === "runaway" ? 1 : 0,
    states.A === "zero" ? 0.5 : 0,
    states.C === "runaway" || states.C === "zero" ? 0.5 : 0
  );
  let dB2 = Math.max(
    dB1,
    states.B === "runaway" ? 1 : 0,
    states.B === "zero" ? 0.5 : 0,
    states.A === "runaway" || states.A === "zero" ? 0.5 : 0
  );
  let dC2 = Math.max(
    dC1,
    states.C === "runaway" ? 1 : 0,
    states.C === "zero" ? 0.5 : 0,
    states.B === "runaway" || states.B === "zero" ? 0.5 : 0
  );

  if (form.cType === "c3") dC2 = clamp(dC2 + 0.05);

  let stateA2 = states.A;
  let stateB2 = states.B;
  let stateC2 = states.C;

  if (stateC2 === "runaway" && dC2 >= 1.5 && vA2 <= 1) {
    stateA2 = "zero";
  }

  const zeroLock = stateA2 === "zero" && (adjE2 >= 1.5 || [raw.E0, raw.E1, raw.E2, raw.E3].filter((x) => x >= 1.3).length >= 2);

  if (!zeroLock && stateB2 === "runaway" && stateA2 === "zero" && vB2 >= 1.6) {
    stateC2 = "runaway";
  }

  if (vA2 >= 1.55 && dB2 >= 0.5) {
    dB2 = 1;
  }

  if (vB2 >= 1.5 && dC2 < 0.5 && !zeroLock && stateB2 !== "runaway") {
    stateC2 = "normal";
  }

  if (form.socialSensitivity === "high" && adjE2 >= 1.5) {
    stateB2 = "runaway";
  }

  const scoreA = clamp(-1 * vA2 + dA2 + stateMag[stateA2], 0, 6);
  const scoreB = clamp(1 * vB2 + dB2 + stateMag[stateB2], 0, 6);
  const scoreC = clamp(1 * vC2 + dC2 + stateMag[stateC2], 0, 6);
  const scoreE0 = clamp(raw.E0 + raw.E0 + 0, 0, 6);
  const scoreE1 = clamp(raw.E1 + raw.E1 + 0, 0, 6);
  const scoreE2 = clamp(adjE2 + raw.E2 + 0, 0, 6);
  const scoreE3 = clamp(raw.E3 + raw.E3 + 0, 0, 6);

  const forcedFlags = [];
  if (stateA2 === "zero") forcedFlags.push("自然さが止まり気味");
  if (deltaBand(dC2) === "spike" && stateC2 === "runaway") forcedFlags.push("考えすぎが強い");
  if (deltaBand(dB2) === "spike" && stateB2 === "runaway") forcedFlags.push("評価モードが過熱");

  const peakScore = Math.max(scoreA, scoreB, scoreC, scoreE0, scoreE1, scoreE2, scoreE3);
  let rounded = 2;
  if (peakScore < 2.5) rounded = 2;
  else if (peakScore < 4.4) rounded = 4;
  else if (peakScore < 5.4) rounded = 5;
  else rounded = 6;

  const drivers = [
    { key: "A", label: "自然さ", score: scoreA, note: vA2 < 0.8 ? "自然な感覚が落ちやすい" : "自分らしさは残っています" },
    { key: "B", label: "評価モード", score: scoreB, note: vB2 >= 1.5 ? "採点や比較が強くなりやすい" : "評価モードはやや落ち着いています" },
    { key: "C", label: "頭の中の俯瞰", score: scoreC, note: vC2 >= 1.5 ? "考えすぎ・見すぎが起きやすい" : "整理して考えられています" },
    { key: "E0", label: "体調負荷", score: scoreE0, note: raw.E0 >= 1.4 ? "眠気・痛み・消耗の影響が大きめ" : "体調負荷は中程度以下" },
    { key: "E1", label: "環境負荷", score: scoreE1, note: raw.E1 >= 1.2 ? "予定や場の負荷がかかっています" : "環境負荷は控えめ" },
    { key: "E2", label: "対人・社会圧", score: scoreE2, note: raw.E2 >= 1.3 ? "他人の目や比較が刺さりやすい" : "社会的な圧は中程度以下" },
    { key: "E3", label: "ノイズ", score: scoreE3, note: raw.E3 >= 1.2 ? "情報量が多く集中が削られやすい" : "ノイズは比較的少なめ" },
  ].sort((a, b) => b.score - a.score);

  const dominantRaw = [
    { key: "A", value: raw.A },
    { key: "B", value: raw.B },
    { key: "C", value: raw.C },
  ].sort((a, b) => b.value - a.value)[0].key;

  let personalityTitle = "バランス調整タイプ";
  let personalityText = "感覚・評価・整理を行き来しながら、その日の状態で重心が変わるタイプです。";
  let matchTitle = "相性が良いのは、安心感と段取りの両方を持つ人";
  let matchText = "気持ちを急かさず、必要な時だけ整理を手伝ってくれる相手と噛み合いやすいです。";

  if (dominantRaw === "A" && raw.A >= 1.2 && raw.B < 1.2) {
    personalityTitle = "自然体クリエイター";
    personalityText = "自分の感覚や本音から動ける時に力が出やすいタイプです。無理な比較が入るとペースを崩しやすいです。";
    matchTitle = "相性が良いのは、穏やかに整えてくれる人";
    matchText = "細かく採点せず、ペースを尊重しながら生活面を整えてくれる相手と合いやすいです。";
  }

  if (dominantRaw === "B" && form.bType === "internal") {
    personalityTitle = "理想追求タイプ";
    personalityText = "自分の中の基準が高く、丁寧さや完成度を大切にするタイプです。頑張りすぎると自己採点が厳しくなります。";
    matchTitle = "相性が良いのは、結果より回復を見てくれる人";
    matchText = "できた・できないだけで見ず、余白を作ってくれる相手だと無理を減らせます。";
  }

  if (dominantRaw === "B" && form.bType === "external") {
    personalityTitle = "評価センサータイプ";
    personalityText = "周囲の空気や期待を素早く拾えるタイプです。反応の速さが強みですが、比較に巻き込まれやすい面もあります。";
    matchTitle = "相性が良いのは、比較に引っぱられにくい安定型";
    matchText = "周りに合わせすぎず、言葉をやわらかく返してくれる相手と噛み合いやすいです。";
  }

  if (dominantRaw === "C" && form.cType === "c3") {
    personalityTitle = "観察・自己意識タイプ";
    personalityText = "自分や相手の反応を細かく観察できるタイプです。深く考えられる一方で、見すぎて疲れやすいことがあります。";
    matchTitle = "相性が良いのは、急がせず整理を手伝える人";
    matchText = "結論を迫らず、言葉になるまで待てる相手が安心につながりやすいです。";
  }

  if (dominantRaw === "C" && form.cType === "c1") {
    personalityTitle = "構造整理タイプ";
    personalityText = "物事の流れや関係性を整理して理解するのが得意なタイプです。考える力が高いぶん、休みどころを忘れやすいです。";
    matchTitle = "相性が良いのは、感情を自然に言葉にしてくれる人";
    matchText = "ロジックだけでなく気持ちの温度も共有してくれる相手とバランスが取りやすいです。";
  }

  const topDrivers = drivers.slice(0, 2);
  const quickActions = [];

  if (drivers[0].key === "E0" || raw.E0 >= 1.4) {
    quickActions.push("まずは休息を優先。水分・軽食・横になる・痛み対策のどれかを先に。", "難しい判断はあと回しにして、今日は回復に必要なことを1つだけ。");
  }
  if (drivers[0].key === "E2" || raw.E2 >= 1.3 || form.bType === "external") {
    quickActions.push("比較が入る情報をいったん止める。SNSや評価画面から少し離れるのがおすすめです。");
  }
  if (drivers[0].key === "E3" || raw.E3 >= 1.2) {
    quickActions.push("通知を切って、今やることを1つだけに絞ると回復しやすいです。");
  }
  if (stateB2 === "runaway" || vB2 >= 1.5) {
    quickActions.push("今日は採点より事実メモ。『できたことを1つ』だけ書くと評価モードがゆるみます。");
  }
  if (stateC2 === "runaway" || vC2 >= 1.5) {
    quickActions.push("頭の中で回し続けず、3行だけ紙やメモに出すと整理しやすいです。");
  }
  if (stateA2 === "zero" || vA2 < 0.7) {
    quickActions.push("自然さを戻すために、5分で終わる小さな行動を1つ。散歩、白湯、深呼吸、好きな音など。" );
  }

  const uniqueActions = Array.from(new Set(quickActions)).slice(0, 4);
  const status = labelFromScore(rounded);

  return {
    status,
    rounded,
    peakScore,
    values: {
      vA2,
      vB2,
      vC2,
      dA2,
      dB2,
      dC2,
      stateA2,
      stateB2,
      stateC2,
      zeroLock,
    },
    drivers,
    topDrivers,
    personalityTitle,
    personalityText,
    matchTitle,
    matchText,
    uniqueActions,
    forcedFlags,
    helperText: {
      bType: bTypeLabel(form.bType),
      cType: cTypeLabel(form.cType),
    },
  };
}

function SliderField({ label, value, onChange, description }) {
  return (
    <label className="block space-y-2">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-slate-900">{label}</div>
          <div className="text-xs text-slate-500">{description}</div>
        </div>
        <div className="min-w-[3rem] text-right text-sm font-semibold text-slate-700">{value}</div>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={onChange}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-900"
      />
    </label>
  );
}

function RadioRow({ label, value, onChange, options, description }) {
  return (
    <div className="space-y-2">
      <div>
        <div className="text-sm font-medium text-slate-900">{label}</div>
        {description ? <div className="text-xs text-slate-500">{description}</div> : null}
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center gap-2 rounded-2xl border px-3 py-2 text-sm transition ${
                active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              <input
                type="radio"
                name={label}
                value={option.value}
                checked={active}
                onChange={() => onChange(option.value)}
                className="h-4 w-4"
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function StatChip({ title, text }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="text-xs font-semibold text-slate-500">{title}</div>
      <div className="mt-1 text-sm text-slate-800">{text}</div>
    </div>
  );
}

function Meter({ label, value }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium text-slate-900">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-slate-900" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function MentalStateInsightApp() {
  const [form, setForm] = useState(initialState);

  const insight = useMemo(() => computeInsight(form), [form]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const applyPreset = (key) => setForm(presets[key].values);
  const resetAll = () => setForm(initialState);

  const ring = ((insight.rounded / 6) * 283).toFixed(0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100 text-slate-900">
      <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-3xl"
        >
          <div className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  <Sparkles className="h-3.5 w-3.5" />
                  こころのセルフチェック
                </div>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                  状態・性格傾向・相性まで、
                  <span className="block">ひと目でわかるアプリ</span>
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                  スライダーとラジオボタンで今の状態を入れると、今の心の動き、性格傾向、合いやすい相手のタイプ、整え方をやさしい言葉で返します。
                </p>
              </div>
              <button
                onClick={resetAll}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <RefreshCw className="h-4 w-4" />
                初期値に戻す
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(presets).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => applyPreset(key)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-5">
            <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <HeartPulse className="h-4 w-4" />
                今のベース状態
              </div>
              <div className="mt-4 grid gap-4">
                <SliderField
                  label="自然さ・自分らしさ"
                  description="素直に感じたり動いたりできる感覚"
                  value={form.a}
                  onChange={(e) => update("a", Number(e.target.value))}
                />
                <SliderField
                  label="評価モード"
                  description="採点・比較・気にしやすさ"
                  value={form.b}
                  onChange={(e) => update("b", Number(e.target.value))}
                />
                <SliderField
                  label="頭の中の俯瞰"
                  description="考えすぎ・見すぎ・気づきやすさ"
                  value={form.c}
                  onChange={(e) => update("c", Number(e.target.value))}
                />
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Brain className="h-4 w-4" />
                揺れやすさと今の出方
              </div>
              <div className="mt-4 grid gap-4">
                <SliderField
                  label="自然さの揺れ"
                  description="元気さや自分らしさの波"
                  value={form.da}
                  onChange={(e) => update("da", Number(e.target.value))}
                />
                <SliderField
                  label="評価モードの揺れ"
                  description="気にしやすさ・採点の波"
                  value={form.db}
                  onChange={(e) => update("db", Number(e.target.value))}
                />
                <SliderField
                  label="俯瞰の揺れ"
                  description="考え込みやすさ・見すぎの波"
                  value={form.dc}
                  onChange={(e) => update("dc", Number(e.target.value))}
                />

                <RadioRow
                  label="自然さの今の出方"
                  description="今日はどの感じに近いか"
                  value={form.stateA}
                  onChange={(value) => update("stateA", value)}
                  options={[
                    { value: "normal", label: "ふつう" },
                    { value: "runaway", label: "強く出ている" },
                    { value: "zero", label: "止まり気味" },
                  ]}
                />
                <RadioRow
                  label="評価モードの今の出方"
                  value={form.stateB}
                  onChange={(value) => update("stateB", value)}
                  options={[
                    { value: "normal", label: "ふつう" },
                    { value: "runaway", label: "強く出ている" },
                    { value: "zero", label: "止まり気味" },
                  ]}
                />
                <RadioRow
                  label="俯瞰の今の出方"
                  value={form.stateC}
                  onChange={(value) => update("stateC", value)}
                  options={[
                    { value: "normal", label: "ふつう" },
                    { value: "runaway", label: "強く出ている" },
                    { value: "zero", label: "止まり気味" },
                  ]}
                />
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <ShieldCheck className="h-4 w-4" />
                外からかかっている負荷
              </div>
              <div className="mt-4 grid gap-4">
                <SliderField
                  label="体調負荷"
                  description="眠気・痛み・疲労・空腹など"
                  value={form.e0}
                  onChange={(e) => update("e0", Number(e.target.value))}
                />
                <SliderField
                  label="環境負荷"
                  description="予定、人、場所、締切の圧"
                  value={form.e1}
                  onChange={(e) => update("e1", Number(e.target.value))}
                />
                <SliderField
                  label="対人・社会圧"
                  description="周囲の目、比較、期待、空気"
                  value={form.e2}
                  onChange={(e) => update("e2", Number(e.target.value))}
                />
                <SliderField
                  label="ノイズ"
                  description="通知、情報量、雑音、切り替えの多さ"
                  value={form.e3}
                  onChange={(e) => update("e3", Number(e.target.value))}
                />
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Users className="h-4 w-4" />
                性格の傾向
              </div>
              <div className="mt-4 grid gap-4">
                <RadioRow
                  label="評価をどこから受け取りやすい？"
                  description="内向きは自己基準、外向きは他人基準に寄りやすい設定です"
                  value={form.bType}
                  onChange={(value) => update("bType", value)}
                  options={[
                    { value: "internal", label: "自分基準" },
                    { value: "external", label: "他人基準" },
                    { value: "mixed", label: "半々" },
                  ]}
                />
                <RadioRow
                  label="ものの見方のクセ"
                  description="いちばん近いものを選んでください"
                  value={form.cType}
                  onChange={(value) => update("cType", value)}
                  options={[
                    { value: "c1", label: "構造で見る" },
                    { value: "c2", label: "場を整える" },
                    { value: "c3", label: "自分を見すぎる" },
                    { value: "c4", label: "空気を拾う" },
                  ]}
                />
                <RadioRow
                  label="対人・社会圧の刺さりやすさ"
                  value={form.socialSensitivity}
                  onChange={(value) => update("socialSensitivity", value)}
                  options={[
                    { value: "low", label: "低め" },
                    { value: "normal", label: "ふつう" },
                    { value: "high", label: "高め" },
                  ]}
                />
              </div>
            </section>
          </div>

          <div className="space-y-5 lg:sticky lg:top-5 lg:self-start">
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-slate-500">今の読み取り</div>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-950">{insight.status.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{insight.status.tone}</p>
                </div>
                <div className="relative h-24 w-24 shrink-0">
                  <svg viewBox="0 0 100 100" className="h-24 w-24 -rotate-90">
                    <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="8" fill="none" className="text-slate-200" />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray="283"
                      strokeDashoffset={283 - ring}
                      strokeLinecap="round"
                      className="text-slate-900"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-[10px] font-medium uppercase tracking-[0.24em] text-slate-500">負荷</div>
                    <div className="text-2xl font-semibold text-slate-950">{insight.rounded}</div>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <StatChip title="自然さ" text={`${friendlyState[insight.values.stateA2]} / ${toPercent(insight.values.vA2)}%`} />
                <StatChip title="評価モード" text={`${friendlyState[insight.values.stateB2]} / ${toPercent(insight.values.vB2)}%`} />
                <StatChip title="俯瞰" text={`${friendlyState[insight.values.stateC2]} / ${toPercent(insight.values.vC2)}%`} />
              </div>

              <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
                <div className="font-semibold text-slate-900">今の傾向</div>
                <p className="mt-1 leading-6">
                  {insight.helperText.bType} / {insight.helperText.cType}
                  {insight.values.zeroLock ? " / 今は止まり気味が維持されやすい状態" : ""}
                </p>
              </div>

              {insight.forcedFlags.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {insight.forcedFlags.map((flag) => (
                    <span key={flag} className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
                      {flag}
                    </span>
                  ))}
                </div>
              ) : null}
            </motion.section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-950">今の心の動き</h3>
              <div className="mt-4 space-y-3">
                {insight.drivers.slice(0, 4).map((driver) => (
                  <div key={driver.key} className="rounded-2xl border border-slate-200 p-3">
                    <Meter label={driver.label} value={Math.min(100, Math.round((driver.score / 6) * 100))} />
                    <p className="mt-2 text-sm leading-6 text-slate-600">{driver.note}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-950">性格診断</h3>
              <p className="mt-3 text-xl font-semibold text-slate-900">{insight.personalityTitle}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{insight.personalityText}</p>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-950">相性が良い性格</h3>
              <p className="mt-3 text-xl font-semibold text-slate-900">{insight.matchTitle}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{insight.matchText}</p>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-950">おすすめの整え方</h3>
              <div className="mt-4 space-y-3">
                {insight.uniqueActions.map((action, index) => (
                  <div key={action} className="flex gap-3 rounded-2xl bg-slate-50 p-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-6 text-slate-700">{action}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <details>
                <summary className="cursor-pointer list-none text-lg font-semibold text-slate-950">
                  この診断の見方
                </summary>
                <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                  <p>
                    ・自然さは、体調・環境・ノイズの影響を受けると下がりやすくなります。
                  </p>
                  <p>
                    ・評価モードは、対人圧やノイズが強いと上がりやすくなります。
                  </p>
                  <p>
                    ・俯瞰は、対人圧・体調負荷・ノイズが重なると強まりやすくなります。
                  </p>
                  <p>
                    ・考えすぎが強く、自然さが低いときは「止まり気味」と判定されやすくなります。
                  </p>
                  <p>
                    ・これは自己理解を助けるためのアプリです。医療的な診断の代わりではありません。
                  </p>
                </div>
              </details>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
