import { neon, type NeonQueryFunction } from "@neondatabase/serverless"

// 実際にクエリを呼ぶときに初めて DATABASE_URL を検査してクライアントを生成する。
// （モジュール読み込み時に throw するとビルドのページデータ収集で失敗するため遅延化）
let _sql: NeonQueryFunction<false, false> | null = null
function getSql(): NeonQueryFunction<false, false> {
  if (_sql) return _sql
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error("DATABASE_URL is not set")
  }
  _sql = neon(url)
  return _sql
}

// サーバー専用の SQL クライアント（タグ付きテンプレートで自動的にパラメータ化される）
// getSql() に委譲することで、実行時にのみ接続を初期化する。
export const sql = ((...args: Parameters<NeonQueryFunction<false, false>>) =>
  (getSql() as (...a: unknown[]) => unknown)(...args)) as unknown as NeonQueryFunction<false, false>

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
