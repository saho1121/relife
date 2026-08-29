import { neon } from "@neondatabase/serverless"
import { readFileSync } from "node:fs"

// .env.local から DATABASE_URL を読む
const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8")
const match = env.match(/^DATABASE_URL=(.*)$/m)
const url = match ? match[1].trim().replace(/^["']|["']$/g, "") : process.env.DATABASE_URL
if (!url) throw new Error("DATABASE_URL not found")

const sql = neon(url)

// デバイス（＝1台のスマホ / 1ユーザー）ごとの同期キー
await sql`
  CREATE TABLE IF NOT EXISTS devices (
    sync_key TEXT PRIMARY KEY,
    label TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_synced_at TIMESTAMPTZ
  )
`

// 日付 x カテゴリごとのスクリーンタイム（分）
await sql`
  CREATE TABLE IF NOT EXISTS screentime (
    id BIGSERIAL PRIMARY KEY,
    sync_key TEXT NOT NULL REFERENCES devices(sync_key) ON DELETE CASCADE,
    day DATE NOT NULL,
    category TEXT NOT NULL,
    minutes INTEGER NOT NULL CHECK (minutes >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (sync_key, day, category)
  )
`

await sql`CREATE INDEX IF NOT EXISTS screentime_key_day_idx ON screentime (sync_key, day)`

console.log("[init-db] tables ready")
