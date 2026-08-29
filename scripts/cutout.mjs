import sharp from "sharp"
import { readFileSync, writeFileSync } from "node:fs"

// 画像の縁から連続する「白〜クリーム」の背景をだけ透過にする（flood fill）。
// キャラ内部の白（ハイライトなど）は残す。
const files = process.argv.slice(2)

for (const file of files) {
  const img = sharp(file).ensureAlpha()
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info
  const idx = (x, y) => (y * width + x) * channels

  const isBg = (i) => {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    // 明るくて彩度の低いピクセル = 背景の白/クリーム
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    return min > 205 && (max - min) < 40
  }

  const visited = new Uint8Array(width * height)
  const stack = []
  for (let x = 0; x < width; x++) { stack.push([x, 0], [x, height - 1]) }
  for (let y = 0; y < height; y++) { stack.push([0, y], [width - 1, y]) }

  while (stack.length) {
    const [x, y] = stack.pop()
    if (x < 0 || y < 0 || x >= width || y >= height) continue
    const p = y * width + x
    if (visited[p]) continue
    visited[p] = 1
    const i = idx(x, y)
    if (!isBg(i)) continue
    data[i + 3] = 0 // 透過
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
  }

  const out = await sharp(data, { raw: { width, height, channels } }).png().toBuffer()
  writeFileSync(file, out)
  console.log("cutout done:", file)
}
