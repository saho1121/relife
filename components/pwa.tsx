"use client"

import { useEffect, useState } from "react"
import { Download, Share, SquarePlus, X } from "lucide-react"

type InstallEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

const DISMISS_KEY = "relife-pwa-dismissed"

export function PWA() {
  const [deferred, setDeferred] = useState<InstallEvent | null>(null)
  const [showIos, setShowIos] = useState(false)
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    // Service Worker 登録
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {})
    }

    // すでにインストール済み（スタンドアロン表示）なら何も出さない
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari 独自プロパティ
      (navigator as unknown as { standalone?: boolean }).standalone === true
    if (standalone) return

    // 以前「あとで」を押していれば出さない
    if (localStorage.getItem(DISMISS_KEY) === "1") return

    setDismissed(false)

    // Android / Chrome 系: インストールプロンプトを捕捉
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as InstallEvent)
    }
    window.addEventListener("beforeinstallprompt", onPrompt)

    // iOS Safari は beforeinstallprompt が無いので手動案内
    const ua = window.navigator.userAgent.toLowerCase()
    const isIos = /iphone|ipad|ipod/.test(ua)
    const isSafari = isIos && !/crios|fxios|edgios/.test(ua)
    if (isSafari) setShowIos(true)

    return () => window.removeEventListener("beforeinstallprompt", onPrompt)
  }, [])

  const close = () => {
    setDismissed(true)
    setDeferred(null)
    setShowIos(false)
    localStorage.setItem(DISMISS_KEY, "1")
  }

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    close()
  }

  if (dismissed) return null
  if (!deferred && !showIos) return null

  return (
    <div className="pwa-banner" role="dialog" aria-label="アプリをインストール">
      <div className="pwa-card">
        <img src="/icon-192.png" alt="" className="pwa-icon" />
        <div className="pwa-body">
          <strong>ホーム画面に追加</strong>
          {showIos ? (
            <p>
              <Share size={13} /> 共有ボタンから
              <SquarePlus size={13} /> 「ホーム画面に追加」でアプリのように使えます
            </p>
          ) : (
            <p>アプリのように、ホーム画面からすぐにひらけます</p>
          )}
        </div>
        {deferred && (
          <button className="pwa-install" onClick={install}>
            <Download size={15} />
            追加
          </button>
        )}
        <button className="pwa-close" onClick={close} aria-label="閉じる">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
