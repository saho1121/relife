"use client"

import { useMemo, useState } from "react"
import { BarChart3, Check, ChevronRight, Clock3, Heart, Home, Lightbulb, Sparkles, UserRound, WandSparkles } from "lucide-react"

const tabs = [
  { id: "home", label: "ホーム", icon: Home },
  { id: "record", label: "時間を入力", icon: Clock3 },
  { id: "visual", label: "見える化", icon: BarChart3 },
  { id: "ai", label: "AI分析", icon: WandSparkles },
  { id: "tips", label: "改善方法", icon: Lightbulb },
  { id: "profile", label: "マイページ", icon: UserRound },
] as const

const WEEKLY = [3.2, 5.1, 4, 6.2, 3.8, 4.5, 2.9]
const DAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"]

const tips = [
  ["寝る前はスマホを置いてみる", "寝る30分前に、画面から離れる時間をつくろう", "mint", "眠る前の光を減らすと、心と体がゆっくり休む準備を始められます。まずはベッドから少し離れた場所にスマホを置いてみよう。"],
  ["朝の10分を自分の時間に", "起きてすぐのスマホを、少しだけ後回しに", "pink", "カーテンを開けて深呼吸したり、お水を飲んだり。スマホを見る前の10分を、自分のために使ってみよう。"],
  ["通知をおやすみさせる", "大切な通知だけにして、集中を守ろう", "lavender", "集中したい時間は通知をおやすみ。設定はいつでも戻せるから、気軽に試せます。"],
]

type TabId = typeof tabs[number]["id"]
type Expression = "happy" | "thinking" | "curious" | "insight" | "cheer" | "relaxed" | "worried" | "hello" | "angry"

// 目標達成→笑顔、未達成→怒り、それ以外→ふだんの顔
const MASCOT_SRC: Record<string, string> = {
  angry: "/relife-mocomo-angry.png",
  worried: "/relife-mocomo-angry.png",
  happy: "/relife-mocomo-happy.png",
  cheer: "/relife-mocomo-happy.png",
}
function mascotImage(expression: Expression) {
  return MASCOT_SRC[expression] ?? "/relife-mocomo.png"
}

// あなたのデータから、一人ひとりに合う習慣を組み立てる仕組み
type Rec = { key: string; title: string; reason: string; step: string; effect: string; tone: string; score: number }

function buildAnalysis(weekly: number[], today: number, goal: number) {
  const avg = weekly.reduce((a, b) => a + b, 0) / weekly.length
  const firstHalf = weekly.slice(0, 3).reduce((a, b) => a + b, 0) / 3
  const lastHalf = weekly.slice(-3).reduce((a, b) => a + b, 0) / 3
  const trendDelta = lastHalf - firstHalf
  const trend: "improving" | "worsening" | "steady" =
    trendDelta < -0.4 ? "improving" : trendDelta > 0.4 ? "worsening" : "steady"
  const worstIdx = weekly.indexOf(Math.max(...weekly))
  const worstVal = weekly[worstIdx]
  const swing = Math.max(...weekly) - Math.min(...weekly)
  const weekendAvg = (weekly[5] + weekly[6]) / 2
  const weekdayAvg = weekly.slice(0, 5).reduce((a, b) => a + b, 0) / 5
  const gap = avg - goal
  const todayGap = today - goal
  const level: "good" | "close" | "over" = gap <= 0 ? "good" : gap <= 1 ? "close" : "over"

  const pool: Rec[] = [
    {
      key: "evening",
      title: "夜のスマホをそっと手放す",
      tone: "mint",
      reason: `目標より平均で ${gap.toFixed(1)}時間 多め。夜の時間が積み重なっているのかも。`,
      step: "寝る30分前に、スマホをベッドから少し離れた場所へ。心と体が休む準備を始められます。",
      effect: "夜に -30分",
      score: gap * 2 + (level === "over" ? 2 : 0),
    },
    {
      key: "worstday",
      title: `${DAY_LABELS[worstIdx]}曜日に小さな予定を`,
      tone: "pink",
      reason: `${DAY_LABELS[worstIdx]}曜が ${worstVal.toFixed(1)}時間 と、今週いちばん長め。`,
      step: `${DAY_LABELS[worstIdx]}の夕方に散歩やお茶など、画面から離れる予定をひとつ入れてみよう。`,
      effect: "ピークをならす",
      score: swing * 2,
    },
    {
      key: "weekend",
      title: "週末のリズムをやさしく整える",
      tone: "lavender",
      reason: `週末は平均 ${weekendAvg.toFixed(1)}時間 で、平日(${weekdayAvg.toFixed(1)}時間)より長め。`,
      step: "休みの日の朝、最初の1時間はスマホを見ずにゆっくり過ごしてみよう。",
      effect: "週末に -45分",
      score: (weekendAvg - weekdayAvg) * 3,
    },
    {
      key: "notify",
      title: "通知をおやすみモードに",
      tone: "mint",
      reason: `平均 ${avg.toFixed(1)}時間。無意識に開く回数が多いのかもしれません。`,
      step: "集中したい時間帯だけ通知をオフに。開くきっかけそのものを減らせます。",
      effect: "開く回数を減らす",
      score: avg * 0.7,
    },
    {
      key: "morning",
      title: "朝の10分を自分の時間に",
      tone: "pink",
      reason:
        level === "good"
          ? "いいリズム。朝に余白を足すと、もっと心地よい一日に。"
          : "起きてすぐのスマホが、一日の使いすぎのきっかけになりがちです。",
      step: "起きてすぐスマホを見る前に、深呼吸やお水など10分の余白をつくろう。",
      effect: "一日の始まりを整える",
      score: level === "good" ? 2.5 : 1.2 + (todayGap > 0 ? 1 : 0),
    },
    {
      key: "stepdown",
      title: "目標をほんの少しだけ下げる",
      tone: "lavender",
      reason:
        trend === "improving"
          ? `直近は ${Math.abs(trendDelta).toFixed(1)}時間 減ってきていて good。`
          : `今の目標(${goal}時間)は、少し高めかもしれません。`,
      step: `次の目標は ${Math.max(0, level === "good" ? goal - 0.5 : goal).toFixed(1)}時間 くらいから、無理なく。`,
      effect: "続けやすい目標に",
      score: trend === "improving" ? 3 : 0.6,
    },
  ]

  const habits = [...pool].sort((a, b) => b.score - a.score).slice(0, 3)

  const headline =
    level === "good"
      ? "あなたのペース、とてもいい感じ"
      : level === "close"
        ? "あと少しで目標に届きそう"
        : "少しずつ整えていこう"
  const trendText =
    trend === "improving" ? "だんだん減ってきているよ" : trend === "worsening" ? "少し増え気味かも" : "落ち着いたリズム"
  const summary = `今週の平均は ${avg.toFixed(1)}時間。${
    gap <= 0 ? "目標を上手に守れているよ" : `目標まであと ${gap.toFixed(1)}時間`
  }。傾向は${trendText}。あなたのデータに合わせて、下の習慣を選びました。`
  const trendLabel = trend === "improving" ? "↓ 改善中" : trend === "worsening" ? "↑ 増加ぎみ" : "→ 安定"
  const achievement = Math.min(100, (goal / avg) * 100)

  return { avg, gap, level, trend, trendLabel, worstIdx, worstVal, headline, summary, habits, achievement }
}

function Mascot({ expression, className = "" }: { expression: Expression; className?: string }) {
  return <div className={`mascot-character expression-${expression} ${className}`} role="img" aria-label="モコモコ"><img src={mascotImage(expression) || "/placeholder.svg"} alt="" /></div>
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabId>("record")
  const [screenTime, setScreenTime] = useState(4.5)
  const [goal, setGoal] = useState(3)
  const [analyzing, setAnalyzing] = useState(false)
  const [selectedTip, setSelectedTip] = useState<number | null>(null)
  const [mascotReacting, setMascotReacting] = useState(false)
  const over = screenTime - goal
  const goalMet = over <= 0
  // 目標を超えたら怒り顔、達成できたら笑顔
  const moodByGoal: Expression = goalMet ? "happy" : "angry"
  const expression: Expression =
    activeTab === "ai" && analyzing ? "thinking"
    : activeTab === "profile" ? "relaxed"
    : moodByGoal
  const analysis = useMemo(() => buildAnalysis(WEEKLY, screenTime, goal), [screenTime, goal])
  const analyze = () => { setActiveTab("ai"); setAnalyzing(true); window.setTimeout(() => setAnalyzing(false), 1300) }
  const switchTab = (id: TabId) => { setActiveTab(id); setSelectedTip(null); setMascotReacting(true); window.setTimeout(() => setMascotReacting(false), 450) }
  return <main className="app-shell"><div className="phone-content">
    <header className="topbar"><div className="brand-mark"><span>Re:</span>LIFE</div><button className="round-button" aria-label="お気に入り"><Heart size={18} /></button></header>
    <div className="page-title"><div><p className="eyebrow">YOUR LITTLE SPACE</p><h1>{activeTab === "record" ? <>今日の時間を<br /><span>教えてね</span></> : tabs.find(tab => tab.id === activeTab)?.label}</h1></div><div className="mascot-blend"><Mascot expression={expression} className={`tiny-mascot ${mascotReacting ? "mascot-tapped" : ""}`} /></div></div>
    {activeTab === "home" && <section className="section-block home-page"><div className="welcome-card"><div><p className="eyebrow">GOOD MORNING</p><h2>今日も自分に<br /><span>やさしくね。</span></h2><p>モコモコと一緒に<br />心地よい一日をはじめよう。</p></div><Mascot expression={expression} className={`mascot-art ${mascotReacting ? "mascot-tapped" : ""}`} /></div><div className="home-summary"><p className="eyebrow">TODAY&apos;S SUMMARY</p><h2>まだ記録がありません</h2><p>時間を入力すると、あなたの一日がここにまとまります。</p><button className="primary-button" onClick={() => switchTab("record")}>時間を入力する <Clock3 size={18} /></button></div></section>}
    {activeTab === "profile" && <section className="section-block profile-page"><div className="profile-card"><Mascot expression={expression} className={`mascot-art ${mascotReacting ? "mascot-tapped" : ""}`} /><div><p className="eyebrow">MY LITTLE SPACE</p><h2>わたしのページ</h2><p>無理なく、少しずつ。<br />あなたのペースで整えていこう。</p></div></div><div className="profile-list"><div><span>今週の記録</span><strong>0日</strong></div><div><span>覚えておきたいヒント</span><strong>0個</strong></div></div></section>}
    {activeTab === "record" && <section className="section-block"><div className="welcome-card"><div><p className="eyebrow">MOCOMO&apos;S NOTE</p><h2>今日もやさしく、<br /><span>記録してみよう。</span></h2><p>モコモコと一緒に、あなたの<br />時間を見つめてみよう。</p></div><Mascot expression={expression} className={`mascot-art ${mascotReacting ? "mascot-tapped" : ""}`} /></div><div className="input-grid"><label className="input-card" htmlFor="screen-time">スクリーンタイム<div className="number-input"><input id="screen-time" type="number" min="0" max="24" step=".5" value={screenTime} onChange={e => setScreenTime(Number(e.target.value))} /><span>時間</span></div></label><label className="input-card" htmlFor="goal-time">目標にしたい時間<div className="number-input"><input id="goal-time" type="number" min="0" max="24" step=".5" value={goal} onChange={e => setGoal(Number(e.target.value))} /><span>時間</span></div></label></div><button className="primary-button" onClick={analyze}>AIに分析してもらう <Sparkles size={18} /></button></section>}
    {activeTab === "visual" && <section className="section-block"><p className="eyebrow">YOUR RHYTHM</p><h2>スクリーンタイムの見える化</h2><div className="chart-card"><div className="ring-wrap"><div className="progress-ring" style={{"--progress": `${Math.min(100, screenTime / 8 * 100) * 3.6}deg`} as React.CSSProperties}><div className="ring-inner"><strong>{screenTime}</strong><span>時間</span></div></div><small>今日のスクリーンタイム</small></div><div className="chart-bars">{WEEKLY.map((value, i) => <div className="bar-column" key={i}><div className="bar-track"><div className="bar-fill" style={{height: `${value * 13}%`}} /></div><span>{DAY_LABELS[i]}</span></div>)}</div></div><p className="soft-note">目標まであと <strong>{Math.max(0, goal - screenTime).toFixed(1)}時間</strong>。あなたのペースで大丈夫。</p></section>}
    {activeTab === "ai" && <section className={`analysis-page ${analyzing ? "is-analyzing" : ""}`}>
      {analyzing ? <>
        <Mascot expression="thinking" className={`mascot-art ${mascotReacting ? "mascot-tapped" : ""}`} />
        <p className="eyebrow">MOCOMO&apos;S INSIGHT</p>
        <h2>あなたの時間を見ています…</h2>
        <p>今日の記録と1週間の流れから、あなたに合うヒントを探しています。</p>
        <div className="analysis-loader" aria-hidden="true"><span /><span /><span /></div>
      </> : <div className="ai-result">
        <div className="ai-diagnosis">
          <p className="eyebrow">MOCOMO&apos;S INSIGHT</p>
          <h2>{analysis.headline}</h2>
          <p>{analysis.summary}</p>
        </div>
        <div className="ai-stats">
          <div className="ai-stat"><small>今週の平均</small><strong>{analysis.avg.toFixed(1)}h</strong></div>
          <div className="ai-stat"><small>傾向</small><strong>{analysis.trendLabel}</strong></div>
          <div className="ai-stat"><small>いちばん長い日</small><strong>{DAY_LABELS[analysis.worstIdx]} {analysis.worstVal.toFixed(1)}h</strong></div>
        </div>
        <div className="insight-meter"><span style={{width: `${analysis.achievement}%`}} /></div>
        <h3 className="rec-head-title">あなたに合わせた3つの習慣</h3>
        <div className="rec-list">{analysis.habits.map(habit => <div key={habit.key} className={`rec-card ${habit.tone}`}>
          <div className="rec-top"><strong>{habit.title}</strong><span className="rec-effect">{habit.effect}</span></div>
          <p className="rec-reason"><BarChart3 size={14} />{habit.reason}</p>
          <p className="rec-step">{habit.step}</p>
        </div>)}</div>
        <button className="primary-button rec-cta" onClick={() => switchTab("tips")}>改善方法をもっと見る <ChevronRight size={18} /></button>
      </div>}
    </section>}
    {activeTab === "tips" && <section className="habits-section"><p className="eyebrow">MOCOMO&apos;S TIPS</p><h2>できそうなことから<br />選んでみよう</h2><div className="habit-list">{tips.map(([title, detail, tone, full], i) => <div key={title} className={`tip-wrap ${selectedTip === i ? "open" : ""}`}><button className={`habit-card ${tone}`} onClick={() => setSelectedTip(selectedTip === i ? null : i)}><span className="habit-check">{selectedTip === i ? <Check size={16} /> : null}</span><span className="habit-text"><strong>{title}</strong><small>{detail}</small></span><ChevronRight size={18} /></button>{selectedTip === i && <div className="tip-detail"><p>{full}</p><button onClick={() => setSelectedTip(null)}>できそう。覚えておく</button></div>}</div>)}</div></section>}
    <footer>あなたの毎日に、ちいさな余白を。</footer><nav className="bottom-nav" aria-label="メインナビゲーション">{tabs.map(({ id, label, icon: Icon }) => <button key={id} className={activeTab === id ? "active" : ""} onClick={() => switchTab(id)}><Icon size={19} /><span>{label}</span></button>)}</nav>
  </div></main>
}
