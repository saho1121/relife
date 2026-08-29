"use client"

import { useEffect, useState } from "react"

export type ThemeId = "sakura" | "mint" | "lavender" | "honey" | "sky"
export type AvatarId = "normal" | "happy" | "angry"

export type Prefs = {
  name: string
  avatar: AvatarId
  theme: ThemeId
  streak: number
  lastCheckIn: string // YYYY-MM-DD
}

const KEY = "relife-prefs-v1"

const DEFAULTS: Prefs = { name: "あなた", avatar: "normal", theme: "sakura", streak: 1, lastCheckIn: "" }

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

  // 読み込み時に連続記録を判定して更新（今日を自動チェックイン）
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
        // 今日はもうチェックイン済み
      } else if (diff === 1) {
        streak = streak + 1 // 昨日も続いていた → 連続日数+1
      } else if (diff > 1) {
        streak = 1 // 間があいた → リセット
      }
    }
    const next = { ...base, streak, lastCheckIn: today }
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

  return { prefs, ready, update }
}
