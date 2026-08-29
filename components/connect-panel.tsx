"use client"

import { useState } from "react"
import { Check, Copy, RefreshCw, Smartphone, Sparkles } from "lucide-react"
import type { SyncData } from "./use-screentime"

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {}
  }
  return (
    <div className="copy-field">
      <div className="copy-field-body">
        <small>{label}</small>
        <code>{value}</code>
      </div>
      <button type="button" onClick={copy} aria-label={`${label}をコピー`}>
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </button>
    </div>
  )
}

export function ConnectPanel({
  syncKey,
  createKey,
  data,
  onDisconnect,
  onRefresh,
}: {
  syncKey: string | null
  createKey: (label?: string) => Promise<string>
  data?: SyncData
  onDisconnect: () => void
  onRefresh: () => void
}) {
  const [busy, setBusy] = useState(false)
  const origin = typeof window !== "undefined" ? window.location.origin : ""
  const endpoint = `${origin}/api/sync`

  const start = async () => {
    setBusy(true)
    try {
      await createKey("わたしのiPhone")
    } finally {
      setBusy(false)
    }
  }

  if (!syncKey) {
    return (
      <div className="connect-card">
        <div className="connect-hero">
          <Smartphone size={26} />
          <div>
            <p className="eyebrow">SCREEN TIME SYNC</p>
            <h3>スマホのスクリーンタイムと同期</h3>
          </div>
        </div>
        <p className="connect-lead">
          iPhoneの「ショートカット」からスクリーンタイムを送ると、記録が自動でこのアプリに反映されます。まずは同期キーを発行しましょう。
        </p>
        <button className="primary-button" onClick={start} disabled={busy}>
          {busy ? "発行中…" : "同期をはじめる"} <Sparkles size={18} />
        </button>
      </div>
    )
  }

  const lastSynced = data?.lastSyncedAt
    ? new Date(data.lastSyncedAt).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : null

  const sampleBody = `{
  "key": "${syncKey}",
  "unit": "hours",
  "categories": {
    "sns": 1.8, "video": 1.2, "game": 0.4,
    "work": 0.8, "other": 0.3
  }
}`

  return (
    <div className="connect-card">
      <div className="connect-hero">
        <span className={`connect-dot ${data?.hasData ? "on" : ""}`} />
        <div>
          <p className="eyebrow">SCREEN TIME SYNC</p>
          <h3>{data?.hasData ? "同期できています" : "同期の準備ができました"}</h3>
        </div>
        <button className="connect-refresh" onClick={onRefresh} aria-label="最新に更新"><RefreshCw size={16} /></button>
      </div>

      <p className="connect-lead">
        {lastSynced
          ? `最後の同期：${lastSynced}`
          : "まだデータが届いていません。下の手順でショートカットから送ってみてください。"}
      </p>

      <CopyField label="送信先URL（エンドポイント）" value={endpoint} />
      <CopyField label="あなたの同期キー" value={syncKey} />

      <div className="connect-steps">
        <p className="eyebrow">iPhone ショートカットの作り方</p>
        <ol>
          <li>「ショートカット」アプリで新規ショートカットを作成</li>
          <li>アクション「URLの内容を取得」を追加し、上の<strong>送信先URL</strong>を貼り付け</li>
          <li>方法を <strong>POST</strong>、本文を <strong>JSON</strong> にして、下の内容を貼り付け（数値は自分の値に）</li>
          <li>カテゴリ別の時間を入れて実行。ホーム画面やオートメーションから毎日実行もできます</li>
        </ol>
        <CopyField label="送信するJSON（本文）" value={sampleBody} />
        <p className="connect-hint">
          ※ iOSにはスクリーンタイムを自動で読むショートカット機能がないため、数値はショートカット内で指定します。分で送る場合は <code>&quot;unit&quot;</code> を消してください。
        </p>
      </div>

      <button className="connect-unlink" onClick={onDisconnect}>この端末の同期を解除する</button>
    </div>
  )
}
