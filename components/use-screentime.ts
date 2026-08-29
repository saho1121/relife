"use client"

import { useCallback, useEffect, useState } from "react"
import useSWR from "swr"

const STORAGE_KEY = "relife-sync-key"

export type SyncBreakdown = Record<string, number>
export type SyncData = {
  day: string
  label: string
  lastSyncedAt: string | null
  hasData: boolean
  breakdown: SyncBreakdown
  weekly: { day: string; hours: number }[]
}

const fetcher = async (url: string): Promise<SyncData> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("failed to load")
  return res.json()
}

// この端末の同期キーを管理し、同期されたスクリーンタイムを取得するフック
export function useScreentime() {
  const [syncKey, setSyncKeyState] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  // 端末に保存された同期キーを読み込む（キー自体は識別子。実データはDB側）
  useEffect(() => {
    try {
      setSyncKeyState(localStorage.getItem(STORAGE_KEY))
    } catch {
      // localStorage が使えない環境でも動くように
    }
    setReady(true)
  }, [])

  const setSyncKey = useCallback((key: string | null) => {
    setSyncKeyState(key)
    try {
      if (key) localStorage.setItem(STORAGE_KEY, key)
      else localStorage.removeItem(STORAGE_KEY)
    } catch {}
  }, [])

  const { data, error, isLoading, mutate } = useSWR<SyncData>(
    syncKey ? `/api/sync?key=${encodeURIComponent(syncKey)}` : null,
    fetcher,
    { refreshInterval: 60000, revalidateOnFocus: true },
  )

  // 新しい同期キーを発行する
  const createKey = useCallback(async (label?: string) => {
    const res = await fetch("/api/device", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ label }),
    })
    if (!res.ok) throw new Error("failed to create key")
    const json = await res.json()
    setSyncKey(json.syncKey)
    return json.syncKey as string
  }, [setSyncKey])

  return { ready, syncKey, setSyncKey, createKey, data, error, isLoading, mutate }
}
