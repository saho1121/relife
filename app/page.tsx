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
const tips = [["寝る前はスマホを置いてみる", "寝る30分前に、画面から離れる時間をつくろう", "mint", "眠る前の光を減らすと、心と体がゆっくり休む準備を始められます。まずはベッドから少し離れた場所にスマホを置いてみよう。"], ["朝の10分を自分の時間に", "起きてすぐのスマホを、少しだけ後回しに", "pink", "カーテンを開けて深呼吸したり、お水を飲んだり。スマホを見る前の10分を、自分のために使ってみよう。"], ["通知をおやすみさせる", "大切な通知だけにして、集中を守ろう", "lavender", "集中したい時間は通知をおやすみ。設定はいつでも戻せるから、気軽に試せます。"]]
type TabId = typeof tabs[number]["id"]
type Expression = "happy" | "thinking" | "curious" | "insight" | "cheer" | "relaxed" | "worried" | "hello"

function Mascot({ expression, className = "" }: { expression: Expression; className?: string }) {
  return <div className={`mascot-character expression-${expression} ${className}`} role="img" aria-label="モコモコ"><img src="/relife-mocomo.png" alt="" /></div>
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabId>("record")
  const [screenTime, setScreenTime] = useState(4.5)
  const [goal, setGoal] = useState(3)
  const [analyzing, setAnalyzing] = useState(false)
  const [selectedTip, setSelectedTip] = useState<number | null>(null)
  const [mascotReacting, setMascotReacting] = useState(false)
  const over = screenTime - goal
  const expression: Expression = activeTab === "record" ? (over > 1 ? "worried" : "thinking") : activeTab === "ai" ? (analyzing ? "thinking" : "insight") : activeTab === "visual" ? "curious" : activeTab === "tips" ? "cheer" : activeTab === "profile" ? "relaxed" : "happy"
  const insight = useMemo(() => over <= 0 ? "いいペースだね。自分の時間を上手に守れているよ。" : over <= 1 ? "あと少しだけ。夜の30分を自分のために使ってみよう。" : "スマホと過ごす時間が少し長めかも。小さな一歩から整えていこう。", [over])
  const analyze = () => { setActiveTab("ai"); setAnalyzing(true); window.setTimeout(() => setAnalyzing(false), 1300) }
  const switchTab = (id: TabId) => { setActiveTab(id); setSelectedTip(null); setMascotReacting(true); window.setTimeout(() => setMascotReacting(false), 450) }
  return <main className="app-shell"><div className="phone-content">
    <header className="topbar"><div className="brand-mark"><span>Re:</span>LIFE</div><button className="round-button" aria-label="お気に入り"><Heart size={18} /></button></header>
    <div className="page-title"><div><p className="eyebrow">YOUR LITTLE SPACE</p><h1>{activeTab === "record" ? <>今日の時間を<br /><span>教えてね</span></> : tabs.find(tab => tab.id === activeTab)?.label}</h1></div><div className="mascot-blend"><Mascot expression={expression} className={`tiny-mascot ${mascotReacting ? "mascot-tapped" : ""}`} /></div></div>
    {activeTab === "home" && <section className="section-block home-page"><div className="welcome-card"><div><p className="eyebrow">GOOD MORNING</p><h2>今日も自分に<br /><span>やさしくね。</span></h2><p>モコモコと一緒に<br />心地よい一日をはじめよう。</p></div><Mascot expression={expression} className={`mascot-art ${mascotReacting ? "mascot-tapped" : ""}`} /></div><div className="home-summary"><p className="eyebrow">TODAY&apos;S SUMMARY</p><h2>まだ記録がありません</h2><p>時間を入力すると、あなたの一日がここにまとまります。</p><button className="primary-button" onClick={() => switchTab("record")}>時間を入力する <Clock3 size={18} /></button></div></section>}
    {activeTab === "profile" && <section className="section-block profile-page"><div className="profile-card"><Mascot expression={expression} className={`mascot-art ${mascotReacting ? "mascot-tapped" : ""}`} /><div><p className="eyebrow">MY LITTLE SPACE</p><h2>わたしのページ</h2><p>無理なく、少しずつ。<br />あなたのペースで整えていこう。</p></div></div><div className="profile-list"><div><span>今週の記録</span><strong>0日</strong></div><div><span>覚えておきたいヒント</span><strong>0個</strong></div></div></section>}
    {activeTab === "record" && <section className="section-block"><div className="welcome-card"><div><p className="eyebrow">MOCOMO&apos;S NOTE</p><h2>今日もやさしく、<br /><span>記録してみよう。</span></h2><p>モコモコと一緒に、あなたの<br />時間を見つめてみよう。</p></div><Mascot expression={expression} className={`mascot-art ${mascotReacting ? "mascot-tapped" : ""}`} /></div><div className="input-grid"><label className="input-card" htmlFor="screen-time">スクリーンタイム<div className="number-input"><input id="screen-time" type="number" min="0" max="24" step=".5" value={screenTime} onChange={e => setScreenTime(Number(e.target.value))} /><span>時間</span></div></label><label className="input-card" htmlFor="goal-time">目標にしたい時間<div className="number-input"><input id="goal-time" type="number" min="0" max="24" step=".5" value={goal} onChange={e => setGoal(Number(e.target.value))} /><span>時間</span></div></label></div><button className="primary-button" onClick={analyze}>時間を見てみる <Sparkles size={18} /></button></section>}
    {activeTab === "visual" && <section className="section-block"><p className="eyebrow">YOUR RHYTHM</p><h2>スクリーンタイムの見える化</h2><div className="chart-card"><div className="ring-wrap"><div className="progress-ring" style={{"--progress": `${Math.min(100, screenTime / 8 * 100) * 3.6}deg`} as React.CSSProperties}><div className="ring-inner"><strong>{screenTime}</strong><span>時間</span></div></div><small>今日のスクリーンタイム</small></div><div className="chart-bars">{[3.2, 5.1, 4, 6.2, 3.8, 4.5, 2.9].map((value, i) => <div className="bar-column" key={i}><div className="bar-track"><div className="bar-fill" style={{height: `${value * 13}%`}} /></div><span>{["月","火","水","木","金","土","日"][i]}</span></div>)}</div></div><p className="soft-note">目標まであと <strong>{Math.max(0, goal - screenTime).toFixed(1)}時間</strong>。あなたのペースで大丈夫。</p></section>}
    {activeTab === "ai" && <section className={`analysis-page ${analyzing ? "is-analyzing" : ""}`}><Mascot expression={expression} className={`mascot-art ${mascotReacting ? "mascot-tapped" : ""}`} /><p className="eyebrow">MOCOMO&apos;S INSIGHT</p><h2>{analyzing ? "あなたの時間を見ています…" : "ゆっくり、整えていこう"}</h2><p>{analyzing ? "あなたに合うヒントを探しています" : insight}</p><div className="insight-meter"><span style={{width: `${Math.min(100, screenTime / 8 * 100)}%`}} /></div></section>}
    {activeTab === "tips" && <section className="habits-section"><p className="eyebrow">MOCOMO&apos;S TIPS</p><h2>できそうなことから<br />選んでみよう</h2><div className="habit-list">{tips.map(([title, detail, tone, full], i) => <div key={title} className={`tip-wrap ${selectedTip === i ? "open" : ""}`}><button className={`habit-card ${tone}`} onClick={() => setSelectedTip(selectedTip === i ? null : i)}><span className="habit-check">{selectedTip === i ? <Check size={16} /> : null}</span><span className="habit-text"><strong>{title}</strong><small>{detail}</small></span><ChevronRight size={18} /></button>{selectedTip === i && <div className="tip-detail"><p>{full}</p><button onClick={() => setSelectedTip(null)}>でき��う。覚えておく</button></div>}</div>)}</div></section>}
    <footer>あなたの毎日に、ちいさな余白を。</footer><nav className="bottom-nav" aria-label="メインナビゲーション">{tabs.map(({ id, label, icon: Icon }) => <button key={id} className={activeTab === id ? "active" : ""} onClick={() => switchTab(id)}><Icon size={19} /><span>{label}</span></button>)}</nav>
  </div></main>
}
