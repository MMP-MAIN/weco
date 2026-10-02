import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const origin = 'https://wecocompany.com';
const read = (file) => readFileSync(resolve(root, file), 'utf8');
const restored = new Set([
  'residential.html', 'apartment-interior-planning-checklist.html',
  'daegu-apartment-interior.html', 'old-apartment-remodeling-checklist.html',
  '30-pyeong-apartment-interior-guide.html',
]);
const regions = [
  'daegu-interior-space-branding.html', 'gumi-interior-space-branding.html',
  'ulsan-interior-space-branding.html', 'pohang-interior-space-branding.html',
  'gyeongsan-hayang-interior.html', 'yeongnam-interior-service-area.html',
];
const marketingPages = [
  'cafe-startup-interior.html', 'commercial-space-brand-consulting.html',
  'hair-salon-branding-interior.html', 'meat-restaurant-startup-interior.html',
];
const archived = new Set(); // No retired residential pages after the 2026-10-02 request.
const changed = [...restored, ...regions, ...marketingPages, 'insights.html', 'rss.xml', 'sitemap.xml', 'service-archive.css'];
const pathOf = (url) => decodeURIComponent(new URL(url, `${origin}/`).pathname).replace(/^\//, '');
const sitemap = read('sitemap.xml');
const rss = read('rss.xml');
const sitemapUrls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
const rssUrls = [...rss.matchAll(/<(?:link|guid)>(.*?)<\/(?:link|guid)>/g)].map((match) => match[1]);

for (const url of [...sitemapUrls, ...rssUrls]) {
  assert.equal(new URL(url).origin, origin, `discovery domain: ${url}`);
  assert.ok(!archived.has(pathOf(url)), `archived page still promoted: ${url}`);
}
for (const file of restored) {
  const html = read(file);
  assert.equal((html.match(/<meta name="robots"/g) || []).length, 1);
  assert.ok(html.includes('content="index,follow,max-image-preview:large"'), file);
  assert.doesNotMatch(html, /data-service-status="archived"|service-archive-notice|이전 자료/);
  assert.ok(html.includes(`rel="canonical" href="${origin}/${file}"`), file);
  assert.ok(html.includes('#contact'), file + ': inquiry route');
  assert.ok(sitemapUrls.includes(`${origin}/${file}`), file + ': sitemap');
  assert.ok(rssUrls.includes(`${origin}/${file}`), file + ': RSS');
  assert.ok(read('insights.html').includes(`href="${file}"`), file + ': discoverable');
  assert.ok(!read('robots.txt').includes(`Disallow: /${file}`), file + ': crawl allowed');
}
assert.doesNotMatch(read('robots.txt'), /^Disallow:\s*\/\s*$/m, 'do not block the whole site');

for (const url of sitemapUrls) {
  let file = pathOf(url) || 'index.html';
  if (file.endsWith('/')) file += 'index.html';
  assert.ok(existsSync(resolve(root, file)), `discovery target: ${file}`);
  const html = read(file);
  assert.doesNotMatch(html, /<meta name="robots"[^>]*content="[^\"]*noindex/i, `${file}: active page excluded`);
}
for (const file of readdirSync(root).filter((name) => name.endsWith('.html') && !archived.has(name))) {
  const html = read(file);
  for (const match of html.matchAll(/<a\b[^>]*href="([^"]+)"/g)) {
    const url = new URL(match[1], `${origin}/${file}`);
    if (url.origin === origin) assert.ok(!archived.has(pathOf(url)), `${file}: active link to archived ${pathOf(url)}`);
  }
  for (const match of html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) JSON.parse(match[1]);
}
for (const file of regions) {
  assert.doesNotMatch(read(file), /주거|아파트|주택|RESIDENTIAL/i, `${file}: obsolete residential positioning`);
}
for (const file of marketingPages) {
  const html = read(file);
  assert.ok(html.includes('href="https://mpmarketing.co.kr/"'), `${file}: marketing referral`);
  assert.ok(html.includes('STRATEGY · BRANDING · SPATIAL · DIRECTION'), `${file}: current company scope`);
  const sales = html.match(/<aside class="next-card">[\s\S]*?<\/aside>/)?.[0];
  assert.ok(sales, `${file}: consultation CTA retained`);
  assert.doesNotMatch(sales, /마케팅/, `${file}: do not imply in-house marketing`);
}
console.log(`PASS: ${restored.size} apartment pages restored; ${sitemapUrls.length} active sitemap URLs; company/education links checked.`);

// Verifies deployment bytes only, not that a search engine has recrawled them.
if (process.argv.includes('--live')) {
  const hash = (data) => createHash('sha256').update(data).digest('hex');
  for (let i = 0; i < changed.length; i += 4) {
    await Promise.all(changed.slice(i, i + 4).map(async (file) => {
      const response = await fetch(`${origin}/${file}`, { signal: AbortSignal.timeout(20000), redirect: 'error', headers: { 'Cache-Control': 'no-cache' } });
      assert.equal(response.status, 200, `live status: ${file}`);
      assert.equal(hash(Buffer.from(await response.arrayBuffer())), hash(readFileSync(resolve(root, file))), `live content: ${file}`);
      console.log(`LIVE MATCH: ${file}`);
    }));
  }
}
