import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const toolsDir = path.dirname(new URL(import.meta.url).pathname)
const rootDir = path.resolve(toolsDir, '..')
const imageDir = path.join(rootDir, 'images')
const minimumBytes = 350 * 1024
const contentExtensions = new Set(['.html', '.css', '.js'])
const imagePattern = /images\/[A-Za-z0-9._/-]+\.(?:png|jpe?g)(?:\?[^"'|\s)<>]+)?/gi

const entries = await fs.readdir(rootDir, { withFileTypes: true })
const contentFiles = entries
  .filter((entry) => entry.isFile() && contentExtensions.has(path.extname(entry.name).toLowerCase()))
  .map((entry) => path.join(rootDir, entry.name))

const references = new Map()
for (const file of contentFiles) {
  const content = await fs.readFile(file, 'utf8')
  for (const match of content.matchAll(imagePattern)) {
    const lineStart = content.lastIndexOf('\n', match.index) + 1
    const lineEnd = content.indexOf('\n', match.index)
    const line = content.slice(lineStart, lineEnd === -1 ? content.length : lineEnd)
    if (/og:image|twitter:image/i.test(line)) continue
    const cleanUrl = match[0].split('?')[0]
    const absolutePath = path.join(rootDir, cleanUrl)
    references.set(cleanUrl, absolutePath)
  }
}

const replacements = new Map()
let originalBytes = 0
let optimizedBytes = 0

for (const [url, source] of references) {
  let stat
  try {
    stat = await fs.stat(source)
  } catch {
    continue
  }
  if (stat.size < minimumBytes || /-optimized\.webp$/i.test(url)) continue

  const outputUrl = url.replace(/\.(?:png|jpe?g)$/i, '-optimized.webp')
  const output = path.join(rootDir, outputUrl)
  await sharp(source)
    .rotate()
    .resize({ width: 1920, withoutEnlargement: true })
    .webp({ quality: 82, effort: 5, smartSubsample: true })
    .toFile(output)

  const outputStat = await fs.stat(output)
  if (outputStat.size >= stat.size) {
    await fs.unlink(output)
    continue
  }

  replacements.set(url, outputUrl)
  originalBytes += stat.size
  optimizedBytes += outputStat.size
}

for (const file of contentFiles) {
  const content = await fs.readFile(file, 'utf8')
  const updated = content.replace(imagePattern, (match, offset) => {
    const lineStart = content.lastIndexOf('\n', offset) + 1
    const lineEnd = content.indexOf('\n', offset)
    const line = content.slice(lineStart, lineEnd === -1 ? content.length : lineEnd)
    if (/og:image|twitter:image/i.test(line)) return match
    const [url, query = ''] = match.split('?')
    return replacements.has(url) ? replacements.get(url) + (query ? `?${query}` : '') : match
  })
  if (updated !== content) await fs.writeFile(file, updated)
}

const savedBytes = originalBytes - optimizedBytes
console.log(JSON.stringify({
  converted: replacements.size,
  originalMB: Number((originalBytes / 1024 / 1024).toFixed(2)),
  optimizedMB: Number((optimizedBytes / 1024 / 1024).toFixed(2)),
  savedMB: Number((savedBytes / 1024 / 1024).toFixed(2)),
  reductionPercent: originalBytes ? Math.round((savedBytes / originalBytes) * 100) : 0
}, null, 2))
