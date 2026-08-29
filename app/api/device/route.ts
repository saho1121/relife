import { NextResponse } from "next/server"
import { randomBytes } from "node:crypto"
import { sql } from "@/lib/db"

export const runtime = "nodejs"

// 新しい同期キー（デバイス）を発行する
export async function POST(request: Request) {
  let label = "わたしのiPhone"
  try {
    const body = await request.json()
    if (typeof body?.label === "string" && body.label.trim()) {
      label = body.label.trim().slice(0, 40)
    }
  } catch {
    // body なしでもOK
  }

  // 推測されにくいランダムなキー
  const syncKey = randomBytes(12).toString("hex") // 24文字

  await sql`
    INSERT INTO devices (sync_key, label)
    VALUES (${syncKey}, ${label})
    ON CONFLICT (sync_key) DO NOTHING
  `

  return NextResponse.json({ syncKey, label })
}
