import { NextResponse } from "next/server"
import { sql, isCategoryKey, isValidSyncKey, CATEGORY_KEYS, type CategoryKey } from "@/lib/db"

export const runtime = "nodejs"

// 今日の日付（サーバーのローカル日付ではなく、送信側の day を優先）
// サーバーはUTCで動くため、そのままだとJST 0:00〜8:59が前日扱いになる。
// このアプリはJSTユーザーのみを想定しているため、JST基準の日付に固定する。
const JST_OFFSET_MS = 9 * 60 * 60 * 1000
function todayISO() {
  return new Date(Date.now() + JST_OFFSET_MS).toISOString().slice(0, 10)
}

function isValidDay(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)
}

// ---- iPhone のショートカットから呼ばれる：スクリーンタイムを保存 ----
// 期待する JSON:
// { "key": "同期キー", "day": "2026-08-29"(任意),
//   "categories": { "sns": 108, "video": 72, ... } }  ※分単位
// もしくは { "categories": { "sns": 1.8, ... }, "unit": "hours" }
export async function POST(request: Request) {
  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 })
  }

  const key = body?.key
  if (!isValidSyncKey(key)) {
    return NextResponse.json({ error: "invalid or missing key" }, { status: 401 })
  }

  // キーが登録済みか確認
  const rows = await sql`SELECT sync_key FROM devices WHERE sync_key = ${key}`
  if (rows.length === 0) {
    return NextResponse.json({ error: "unknown key" }, { status: 401 })
  }

  const day = isValidDay(body?.day) ? body.day : todayISO()
  const unit = body?.unit === "hours" ? "hours" : "minutes"
  const categories = body?.categories
  if (!categories || typeof categories !== "object") {
    return NextResponse.json({ error: "categories required" }, { status: 400 })
  }

  // 入力を検証・正規化（分単位の整数に統一、0〜1440にクランプ）
  const clean: { category: CategoryKey; minutes: number }[] = []
  for (const [rawKey, rawVal] of Object.entries(categories)) {
    if (!isCategoryKey(rawKey)) continue
    let num = Number(rawVal)
    if (!Number.isFinite(num) || num < 0) num = 0
    if (unit === "hours") num = num * 60
    const minutes = Math.min(1440, Math.round(num))
    clean.push({ category: rawKey, minutes })
  }

  if (clean.length === 0) {
    return NextResponse.json({ error: "no valid categories" }, { status: 400 })
  }

  // カテゴリごとに upsert（同じ日・同じカテゴリは上書き）
  for (const { category, minutes } of clean) {
    await sql`
      INSERT INTO screentime (sync_key, day, category, minutes)
      VALUES (${key}, ${day}, ${category}, ${minutes})
      ON CONFLICT (sync_key, day, category)
      DO UPDATE SET minutes = EXCLUDED.minutes, updated_at = now()
    `
  }

  await sql`UPDATE devices SET last_synced_at = now() WHERE sync_key = ${key}`

  return NextResponse.json({ ok: true, day, saved: clean })
}

// ---- アプリから呼ばれる：最新のスクリーンタイムを取得 ----
// GET /api/sync?key=...&day=2026-08-29(任意)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get("key")
  if (!isValidSyncKey(key)) {
    return NextResponse.json({ error: "invalid or missing key" }, { status: 401 })
  }

  const device = await sql`SELECT sync_key, label, last_synced_at FROM devices WHERE sync_key = ${key}`
  if (device.length === 0) {
    return NextResponse.json({ error: "unknown key" }, { status: 404 })
  }

  const dayParam = searchParams.get("day")
  const day = isValidDay(dayParam) ? dayParam : todayISO()

  const rows = await sql`
    SELECT category, minutes FROM screentime
    WHERE sync_key = ${key} AND day = ${day}
  `

  // カテゴリ別の時間（時間単位に変換）を返す
  const breakdown: Record<string, number> = {}
  for (const k of CATEGORY_KEYS) breakdown[k] = 0
  for (const r of rows as { category: string; minutes: number }[]) {
    breakdown[r.category] = Math.round((r.minutes / 60) * 10) / 10
  }

  // 直近7日の合計（時間）もあわせて返す
  const weekRows = await sql`
    SELECT day, SUM(minutes)::int AS total
    FROM screentime
    WHERE sync_key = ${key} AND day > (${day}::date - INTERVAL '7 days')
    GROUP BY day ORDER BY day
  `
  const weekly = (weekRows as { day: string; total: number }[]).map(r => ({
    day: typeof r.day === "string" ? r.day.slice(0, 10) : new Date(r.day).toISOString().slice(0, 10),
    hours: Math.round((r.total / 60) * 10) / 10,
  }))

  return NextResponse.json({
    day,
    label: device[0].label,
    lastSyncedAt: device[0].last_synced_at,
    hasData: rows.length > 0,
    breakdown,
    weekly,
  })
}
