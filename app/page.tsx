"use client"

import { useEffect, useMemo, useState } from "react"
import { BarChart3, Check, ChevronRight, Clock3, Home, Lightbulb, RefreshCw, Sparkles, Smartphone, UserRound, WandSparkles } from "lucide-react"
import { useScreentime } from "@/components/use-screentime"
import { ConnectPanel } from "@/components/connect-panel"

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

// スクリーンタイムを何に使ったか、カテゴリで分けて記録する
const CATEGORIES = [
  { key: "sns", label: "SNS", note: "Instagram・X など", color: "#eaa9ab", kind: "leisure" },
  { key: "video", label: "動画・エンタメ", note: "YouTube・配信など", color: "#b6a8e0", kind: "leisure" },
  { key: "game", label: "ゲーム", note: "アプリゲームなど", color: "#f0b88f", kind: "leisure" },
  { key: "work", label: "仕事・勉強", note: "調べもの・作業など", color: "#8fccb8", kind: "focus" },
  { key: "other", label: "その他", note: "連絡・地図など", color: "#cbb8c2", kind: "focus" },
] as const

type CatKey = typeof CATEGORIES[number]["key"]
type Breakdown = Record<CatKey, number>

const DEFAULT_BREAKDOWN: Breakdown = { sns: 1.8, video: 1.2, game: 0.4, work: 0.8, other: 0.3 }

// 使いすぎになりがちなカテゴリ別の、やさしい提案
const CAT_ADVICE: Record<string, { title: string; step: string; effect: string }> = {
  sns: { title: "SNSは時間を決めて楽しむ", step: "アプリに1日の利用時間の上限を設定して、その中で気持ちよく楽しもう。", effect: "SNSに -30分" },
  video: { title: "動画は「あと1本」で止める", step: "見る前に本数を決めておくと、だらだら視聴をふせげます。", effect: "動画に -40分" },
  game: { title: "ゲームは始める前にアラーム", step: "プレイ前にタイマーをセットして、区切りのタイミングをつくろう。", effect: "ゲームに -30分" },
}

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

function buildAnalysis(weekly: number[], breakdown: Breakdown, goal: number) {
  const today = CATEGORIES.reduce((sum, c) => sum + (breakdown[c.key] || 0), 0)
  const leisure = CATEGORIES.filter(c => c.kind === "leisure").reduce((sum, c) => sum + (breakdown[c.key] || 0), 0)
  const focus = today - leisure
  // いちばん長い息抜きカテゴリを見つける
  const leisureCats = CATEGORIES.filter(c => c.kind === "leisure")
  const topCat = leisureCats.reduce((top, c) => (breakdown[c.key] > breakdown[top.key] ? c : top), leisureCats[0])
  const topVal = breakdown[topCat.key]
  const topShare = today > 0 ? (topVal / today) * 100 : 0

  const avg = weekly.reduce((a, b) => a + b, 0) / weekly.length
  const firstHalf = weekly.slice(0, 3).reduce((a, b) => a + b, 0) / 3
  const lastHalf = weekly.slice(-3).reduce((a, b) => a + b, 0) / 3
  const trendDelta = lastHalf - firstHalf
  const trend: "improving" | "worsening" | "steady" =
    trendDelta < -0.4 ? "improving" : trendDelta > 0.4 ? "worsening" : "steady"
  const worstIdx = weekly.indexOf(Math.max(...weekly))
  const worstVal = weekly[worstIdx]
  const weekendAvg = (weekly[5] + weekly[6]) / 2
  const weekdayAvg = weekly.slice(0, 5).reduce((a, b) => a + b, 0) / 5
  const gap = avg - goal
  const todayGap = today - goal
  const level: "good" | "close" | "over" = gap <= 0 ? "good" : gap <= 1 ? "close" : "over"

  const pool: Rec[] = [
    // いちばん長い息抜きカテゴリへの提案（あなたのデータに一番効く）
    {
      key: `cat-${topCat.key}`,
      title: CAT_ADVICE[topCat.key]?.title ?? "使いすぎのアプリと少し距離を",
      tone: "pink",
      reason: `今日のいちばんは ${topCat.label} で ${topVal.toFixed(1)}時間（全体の約${Math.round(topShare)}%）。ここが整うと大きく変わります。`,
      step: CAT_ADVICE[topCat.key]?.step ?? "使う時間帯を決めて、その中だけで楽しもう。",
      effect: CAT_ADVICE[topCat.key]?.effect ?? "いちばんを -30分",
      score: topVal * 4,
    },
    {
      key: "evening",
      title: "夜のスマホをそっと手放す",
      tone: "mint",
      reason: `息抜きの時間が合計 ${leisure.toFixed(1)}時間。夜に積み重なっているのかも。`,
      step: "寝る30分前に、スマホをベッドから少し離れた場所へ。心と体が休む準備を始められます。",
      effect: "夜に -30分",
      score: leisure * 1.6 + (level === "over" ? 2 : 0),
    },
    {
      key: "balance",
      title: "息抜きと集中のバランスを見る",
      tone: "lavender",
      reason: `息抜き ${leisure.toFixed(1)}時間 / 集中 ${focus.toFixed(1)}時間。息抜きが多めなら、少しだけ切り替えを。`,
      step: "「見る」から「する」へ。散歩やお茶など、画面から離れる時間をひとつ足してみよう。",
      effect: "バランスを整える",
      score: leisure - focus,
    },
    {
      key: "worstday",
      title: `${DAY_LABELS[worstIdx]}曜日に小さな予定を`,
      tone: "pink",
      reason: `${DAY_LABELS[worstIdx]}曜が ${worstVal.toFixed(1)}時間 と、今週いちばん長め。`,
      step: `${DAY_LABELS[worstIdx]}の夕方に散歩やお茶など、画面から離れる予定をひとつ入れてみよう。`,
      effect: "ピークをならす",
      score: (Math.max(...weekly) - Math.min(...weekly)) * 1.5,
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
  const summary = `今日は合計 ${today.toFixed(1)}時間。そのうち ${topCat.label} が ${topVal.toFixed(1)}時間 といちばん長めでした。傾向は${trendText}。あなたの使い方に合わせて、下の習慣を選びました。`
  const trendLabel = trend === "improving" ? "↓ 改善中" : trend === "worsening" ? "↑ 増加ぎみ" : "→ 安定"
  const achievement = Math.min(100, (goal / Math.max(today, 0.1)) * 100)
  const parts = CATEGORIES.map(c => ({ ...c, value: breakdown[c.key] || 0, share: today > 0 ? (breakdown[c.key] / today) * 100 : 0 }))

  return { today, leisure, focus, topCat, topVal, avg, gap, level, trend, trendLabel, worstIdx, worstVal, headline, summary, habits, achievement, parts }
}

function Mascot({ expression, className = "" }: { expression: Expression; className?: string }) {
  return <div className={`mascot-character expression-${expression} ${className}`} role="img" aria-label="モコモコ"><img src={mascotImage(expression) || "/placeholder.svg"} alt="" /></div>
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabId>("record")
  const [breakdown, setBreakdown] = useState<Breakdown>(DEFAULT_BREAKDOWN)
  const [goal, setGoal] = useState(3)
  const [analyzing, setAnalyzing] = useState(false)
  const [selectedTip, setSelectedTip] = useState<number | null>(null)
  const [mascotReacting, setMascotReacting] = useState(false)
  const [edited, setEdited] = useState(false)

  // スマホから同期されたスクリーンタイム
  const { ready, syncKey, setSyncKey, createKey, data: sync, mutate } = useScreentime()

  // 同期データが届いたら（手動で編集していない限り）カテゴリに反映する
  useEffect(() => {
    if (sync?.hasData && !edited) {
      setBreakdown(prev => ({ ...prev, ...sync.breakdown } as Breakdown))
    }
  }, [sync, edited])

  const synced = !!(syncKey && sync?.hasData)

  // 同期の週間データがあればそれを使い、なければサンプル
  const weekly = useMemo<number[]>(() => {
    if (sync?.weekly && sync.weekly.length > 0) {
      const filled = [...WEEKLY]
      const recent = sync.weekly.slice(-7).map(w => w.hours)
      for (let i = 0; i < recent.length; i++) filled[filled.length - recent.length + i] = recent[i]
      return filled
    }
    return WEEKLY
  }, [sync])

  const screenTime = useMemo(() => CATEGORIES.reduce((sum, c) => sum + (breakdown[c.key] || 0), 0), [breakdown])
  const over = screenTime - goal
  const goalMet = over <= 0
  // 目標を超えたら怒り顔、達成できたら笑顔
  const moodByGoal: Expression = goalMet ? "happy" : "angry"
  const expression: Expression =
    activeTab === "ai" && analyzing ? "thinking"
    : activeTab === "profile" ? "relaxed"
    : moodByGoal
  const analysis = useMemo(() => buildAnalysis(weekly, breakdown, goal), [weekly, breakdown, goal])
  const setCat = (key: CatKey, value: number) => { setEdited(true); setBreakdown(prev => ({ ...prev, [key]: Math.max(0, value || 0) })) }
  const disconnect = () => { setSyncKey(null); setEdited(false); setBreakdown(DEFAULT_BREAKDOWN) }
  const resync = () => { setEdited(false); mutate() }
  const analyze = () => { setActiveTab("ai"); setAnalyzing(true); window.setTimeout(() => setAnalyzing(false), 1300) }
  const switchTab = (id: TabId) => { setActiveTab(id); setSelectedTip(null); setMascotReacting(true); window.setTimeout(() => setMascotReacting(false), 450) }
  return <main className="app-shell"><div className="phone-content">
    <header className="topbar"><div className="brand-mark"><span>Re:</span>LIFE</div><button className={`status-pill ${goalMet ? "ok" : "over"}`} onClick={() => switchTab("visual")} aria-label="今日のスクリーンタイムを見る"><Clock3 size={14} /><strong>{screenTime.toFixed(1)}h</strong><span>/ {goal}h</span></button></header>
    {activeTab !== "home" && activeTab !== "profile" && activeTab !== "record" && <div className="page-title"><div><p className="eyebrow">YOUR LITTLE SPACE</p><h1>{tabs.find(tab => tab.id === activeTab)?.label}</h1></div><div className="mascot-blend"><Mascot expression={expression} className={`tiny-mascot ${mascotReacting ? "mascot-tapped" : ""}`} /></div></div>}
    {activeTab === "home" && <section className="section-block home-page">
      <div className="welcome-card"><div><p className="eyebrow">GOOD MORNING</p><h2>今日も自分に<br /><span>やさしくね。</span></h2><p>モコモコと一緒に<br />心地よい一日をはじめよう。</p></div><Mascot expression={expression} className={`mascot-art ${mascotReacting ? "mascot-tapped" : ""}`} /></div>
      <div className="today-card"><div className="progress-ring" style={{"--progress": `${Math.min(100, screenTime / 8 * 100) * 3.6}deg`} as React.CSSProperties}><div className="ring-inner"><strong>{screenTime.toFixed(1)}</strong><span>時間</span></div></div><div className="today-info"><p className="eyebrow">TODAY</p><h3>{goalMet ? "目標のなかで過ごせています" : `目標まであと ${Math.max(0, screenTime - goal).toFixed(1)}時間`}</h3><p className="today-sub">いちばんは {analysis.topCat.label}・{analysis.topVal.toFixed(1)}時間</p><span className={`today-flag ${goalMet ? "ok" : "over"}`}>{goalMet ? <><Check size={12} />目標達成</> : "目標オーバー"}</span></div></div>
      <div className="mini-stats"><button onClick={() => switchTab("visual")}><small>週平均</small><strong>{analysis.avg.toFixed(1)}h</strong></button><button onClick={() => switchTab("visual")}><small>傾向</small><strong>{analysis.trendLabel}</strong></button><button onClick={() => switchTab("record")}><small>目標</small><strong>{goal}h</strong></button></div>
      <div className="cat-breakdown"><p className="eyebrow">BY CATEGORY</p><h3 className="cat-break-title">なにに使ったか</h3><div className="cat-stack" role="img" aria-label="カテゴリ別の内訳">{analysis.parts.filter(p => p.value > 0).map(p => <span key={p.key} className="cat-seg" style={{width: `${p.share}%`, background: p.color}} title={`${p.label} ${p.value.toFixed(1)}h`} />)}</div><div className="cat-legend">{analysis.parts.map(p => <div className="cat-legend-item" key={p.key}><span className="cat-dot" style={{background: p.color}} /><span className="cat-legend-name">{p.label}</span><span className="cat-legend-val">{p.value.toFixed(1)}h</span></div>)}</div></div>
      <div className="home-actions"><button className="primary-button" onClick={() => switchTab("record")}>時間を入力する <Clock3 size={18} /></button><button className="ghost-button" onClick={analyze}>AIに分析してもらう <Sparkles size={18} /></button></div>
    </section>}
    {activeTab === "profile" && <section className="section-block profile-page"><div className="profile-card"><Mascot expression={expression} className={`mascot-art ${mascotReacting ? "mascot-tapped" : ""}`} /><div><p className="eyebrow">MY LITTLE SPACE</p><h2>わたしのページ</h2><p>無理なく、少しずつ。<br />あなたのペースで整えていこう。</p></div></div><div className="profile-list"><div><span>今週の記録</span><strong>{sync?.weekly?.length ?? 0}日</strong></div><div><span>スマホ同期</span><strong>{synced ? "オン" : "オフ"}</strong></div></div>
      {ready && <ConnectPanel syncKey={syncKey} createKey={createKey} data={sync} onDisconnect={disconnect} onRefresh={resync} />}</section>}
    {activeTab === "record" && <section className="section-block"><div className="welcome-card"><div><p className="eyebrow">MOCOMO&apos;S NOTE</p><h2>今日はなにに<br /><span>使ったかな？</span></h2><p>カテゴリごとに分けると、<br />使い方がもっと見えてくるよ。</p></div><Mascot expression={expression} className={`mascot-art ${mascotReacting ? "mascot-tapped" : ""}`} /></div>
      <div className="cat-inputs">{CATEGORIES.map(cat => <label className="cat-input" key={cat.key} htmlFor={`cat-${cat.key}`}><span className="cat-dot" style={{background: cat.color}} /><span className="cat-name"><strong>{cat.label}</strong><small>{cat.note}</small></span><div className="cat-number"><input id={`cat-${cat.key}`} type="number" min="0" max="24" step=".5" value={breakdown[cat.key]} onChange={e => setCat(cat.key, Number(e.target.value))} /><span>h</span></div></label>)}</div>
      <div className="cat-total"><span>合計スクリーンタイム</span><strong>{screenTime.toFixed(1)}時間</strong></div>
      {synced ? <button type="button" className="sync-badge" onClick={resync}><Smartphone size={14} /><span>スマホと同期中{edited ? "（手動で編集ずみ）" : ""}</span><RefreshCw size={13} /></button>
        : <button type="button" className="sync-badge muted" onClick={() => switchTab("profile")}><Smartphone size={14} /><span>スマホのスクリーンタイムと同期する</span><ChevronRight size={14} /></button>}
      <label className="input-card goal-row" htmlFor="goal-time">目標にしたい時間<div className="number-input"><input id="goal-time" type="number" min="0" max="24" step=".5" value={goal} onChange={e => setGoal(Number(e.target.value))} /><span>時間</span></div></label>
      <button className="primary-button" onClick={analyze}>AIに分析してもらう <Sparkles size={18} /></button></section>}
    {activeTab === "visual" && <section className="section-block"><p className="eyebrow">YOUR RHYTHM</p><h2>スクリーンタイムの見える化</h2><div className="chart-card"><div className="ring-wrap"><div className="progress-ring" style={{"--progress": `${Math.min(100, screenTime / 8 * 100) * 3.6}deg`} as React.CSSProperties}><div className="ring-inner"><strong>{screenTime.toFixed(1)}</strong><span>時間</span></div></div><small>今日のスクリーンタイム</small></div><div className="chart-bars">{weekly.map((value, i) => <div className="bar-column" key={i}><div className="bar-track"><div className="bar-fill" style={{height: `${value * 13}%`}} /></div><span>{DAY_LABELS[i]}</span></div>)}</div></div>
      <div className="cat-breakdown"><p className="eyebrow">BY CATEGORY</p><h3 className="cat-break-title">なにに使ったか</h3><div className="cat-stack" role="img" aria-label="カテゴリ別の内訳">{analysis.parts.filter(p => p.value > 0).map(p => <span key={p.key} className="cat-seg" style={{width: `${p.share}%`, background: p.color}} title={`${p.label} ${p.value.toFixed(1)}h`} />)}</div><div className="cat-legend">{analysis.parts.map(p => <div className="cat-legend-item" key={p.key}><span className="cat-dot" style={{background: p.color}} /><span className="cat-legend-name">{p.label}</span><span className="cat-legend-val">{p.value.toFixed(1)}h</span></div>)}</div></div>
      <p className="soft-note">目標まであと <strong>{Math.max(0, goal - screenTime).toFixed(1)}時間</strong>。あなたのペースで大丈夫。</p></section>}
    {activeTab === "ai" && <section className={`analysis-page ${analyzing ? "is-analyzing" : ""}`}>
      {analyzing ? <>
        <Mascot expression="thinking" className={`mascot-art ${mascotReacting ? "mascot-tapped" : ""}`} />
        <p className="eyebrow">MOCOMO&apos;S INSIGHT</p>
        <h2>あなたの時間を見ています…</h2>
        <p>カテゴリごとの使い方と1週間の流れから、あなたに合うヒントを探しています。</p>
        <div className="analysis-loader" aria-hidden="true"><span /><span /><span /></div>
      </> : <div className="ai-result">
        <div className="ai-diagnosis">
          <p className="eyebrow">MOCOMO&apos;S INSIGHT</p>
          <h2>{analysis.headline}</h2>
          <p>{analysis.summary}</p>
        </div>
        <div className="ai-stats">
          <div className="ai-stat"><small>今日の合計</small><strong>{analysis.today.toFixed(1)}h</strong></div>
          <div className="ai-stat"><small>いちばん長い</small><strong>{analysis.topCat.label} {analysis.topVal.toFixed(1)}h</strong></div>
          <div className="ai-stat"><small>息抜き / 集中</small><strong>{analysis.leisure.toFixed(1)} / {analysis.focus.toFixed(1)}h</strong></div>
        </div>
        <div className="cat-stack ai-cat-stack" role="img" aria-label="カテゴリ別の内訳">{analysis.parts.filter(p => p.value > 0).map(p => <span key={p.key} className="cat-seg" style={{width: `${p.share}%`, background: p.color}} title={`${p.label} ${p.value.toFixed(1)}h`} />)}</div>
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
