import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

// Render a website share card from the existing official wordmark.
// The embedded source is unchanged: SVG applies black only at display time.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const logoPath = path.join(root, 'brand-assets/Weco_weco-transparent.png')
const outputPath = path.join(root, 'images/og-card-v4.jpg')
const logo = await fs.readFile(logoPath)
const logoMetadata = await sharp(logo).metadata()
if (logoMetadata.width !== 852 || logoMetadata.height !== 192 || !logoMetadata.hasAlpha) {
  throw new Error('Unexpected official wordmark source; review before rendering.')
}

// Generous clear space keeps the wordmark legible in a small chat preview.
// Copy lives in the OG title/description, not duplicated inside the image.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="732" viewBox="0 0 1400 732">
  <defs>
    <filter id="black" color-interpolation-filters="sRGB">
      <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"/>
    </filter>
  </defs>
  <rect width="1400" height="732" fill="#ffffff"/>
  <image x="274" y="270" width="852" height="192" filter="url(#black)" href="data:image/png;base64,${logo.toString('base64')}"/>
</svg>`

await sharp(Buffer.from(svg))
  .flatten({ background: '#ffffff' })
  .jpeg({ quality: 94, chromaSubsampling: '4:4:4', mozjpeg: true })
  .toFile(outputPath)

const result = await sharp(outputPath).metadata()
const { size } = await fs.stat(outputPath)
if (result.width !== 1400 || result.height !== 732 || result.format !== 'jpeg' || size > 1024 * 1024) {
  throw new Error('Share card dimensions, format or file size failed validation.')
}
console.log(JSON.stringify({ output: 'images/og-card-v4.jpg', width: result.width, height: result.height, bytes: size }))
