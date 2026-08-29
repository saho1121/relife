import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set")
}

// サーバー専用の SQL クライアント（タグ付きテンプレートで自動的にパラメータ化される）
export const sql = neon(process.env.DATABASE_URL)

// アプリで使うカテゴリ（page.tsx と揃える）
export const CATEGORY_KEYS = ["sns", "video", "game", "work", "other"] as const
export type CategoryKey = (typeof CATEGORY_KEYS)[number]

export function isCategoryKey(v: string): v is CategoryKey {
  return (CATEGORY_KEYS as readonly string[]).includes(v)
}

// 同期キーの形式チェック（英数字とハイフンのみ、8〜64文字）
export function isValidSyncKey(v: unknown): v is string {
  return typeof v === "string" && /^[A-Za-z0-9-]{8,64}$/.test(v)
}
