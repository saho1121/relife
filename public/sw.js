// Re:LIFE Service Worker
const CACHE = "relife-v1"
const APP_SHELL = [
  "/",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/relife-mocomo.png",
  "/relife-mocomo-happy.png",
  "/relife-mocomo-content.png",
  "/relife-mocomo-angry.png",
  "/deco-flower-pink.png",
  "/deco-flower-purple.png",
  "/deco-flower-yellow.png",
  "/deco-leaf.png",
]

// インストール時にアプリシェルを事前キャッシュ
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL).catch(() => {})),
  )
  self.skipWaiting()
})

// 古いキャッシュを掃除
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // GET 以外・別オリジン・API は素通し（キャッシュしない）
  if (request.method !== "GET" || url.origin !== self.location.origin) return
  if (url.pathname.startsWith("/api/")) return

  // ページ遷移: ネットワーク優先、オフライン時はキャッシュ or トップにフォールバック
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((cache) => cache.put(request, copy))
          return res
        })
        .catch(() => caches.match(request).then((r) => r || caches.match("/"))),
    )
    return
  }

  // 静的アセット: キャッシュ優先、無ければ取得してキャッシュ
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((cache) => cache.put(request, copy))
          }
          return res
        }),
    ),
  )
})
