"use client"

import { useEffect, useState } from "react"

export type ThemeId = "sakura" | "mint" | "lavender" | "honey" | "sky"
export type AvatarId = "normal" | "happy" | "angry" | "custom"

export type SavedTip = { title: string; detail: string }

export type Prefs = {
  name: string
  avatar: AvatarId
  customAvatar: string // アップロードした写真（data URL）
  theme: ThemeId
  streak: number
  bestStreak: number
  lastCheckIn: string // YYYY-MM-DD
  savedTips: SavedTip[]
}

const KEY = "relife-prefs-v1"

const DEFAULTS: Prefs = {
  name: "あなた",
  avatar: "normal",
  customAvatar: "",
  theme: "sakura",
  streak: 1,
  bestStreak: 1,
  lastCheckIn: "",
  savedTips: [],
}

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function daysBetween(a: string, b: string) {
  const [ay, am, ad] = a.split("-").map(Number)
  const [by, bm, bd] = b.split("-").map(Number)
  const da = Date.UTC(ay, am - 1, ad)
  const db = Date.UTC(by, bm - 1, bd)
  return Math.round((db - da) / 86400000)
}

export function usePrefs() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS)
  const [ready, setReady] = useState(false)

  // アプリを開くたびに連続記録を判定して更新（今日を自動チェックイン）
  useEffect(() => {
    let base = DEFAULTS
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) base = { ...DEFAULTS, ...JSON.parse(raw) }
    } catch {}
    const today = todayStr()
    let streak = base.streak || 1
    if (!base.lastCheckIn) {
      streak = 1
    } else {
      const diff = daysBetween(base.lastCheckIn, today)
      if (diff === 0) {
        // 今日はもうチェックイン済み。連続日数は変えない
      } else if (diff === 1) {
        streak = streak + 1 // 昨日も開いていた → 連続日数+1
      } else if (diff > 1) {
        streak = 1 // 間があいた → リセット
      }
    }
    const bestStreak = Math.max(base.bestStreak || 1, streak)
    const next = { ...base, streak, bestStreak, lastCheckIn: today }
    setPrefs(next)
    setReady(true)
    try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
  }, [])

  const update = (patch: Partial<Prefs>) => {
    setPrefs(prev => {
      const next = { ...prev, ...patch }
      try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  // ヒントの保存トグル（同じタイトルがあれば外す）
  const toggleTip = (tip: SavedTip) => {
    setPrefs(prev => {
      const exists = prev.savedTips.some(t => t.title === tip.title)
      const savedTips = exists ? prev.savedTips.filter(t => t.title !== tip.title) : [...prev.savedTips, tip]
      const next = { ...prev, savedTips }
      try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  return { prefs, ready, update, toggleTip }
}
