import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const read = f => readFileSync(resolve(root, f), 'utf8');
const origin = 'https://wecocompany.com/';
const pages = {
  'restaurant-startup-reality.html': ['solo'],
  'meat-restaurant-startup-interior.html': ['startup-cost', 'butcher-restaurant'],
  'cafe-startup-interior.html': ['small-cafe', 'supplies'],
};
const feed = read('rss.xml');
for (const [file, sections] of Object.entries(pages)) {
  const html = read(file);
  assert.equal((html.match(/<h1>/g) || []).length, 1);
  assert.ok(html.includes(`rel="canonical" href="${origin}${file}"`));
  const data = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
  assert.equal(data.find(x => x['@type'] === 'Article').dateModified, '2026-09-23');
  const faq = data.find(x => x['@type'] === 'FAQPage');
  const visible = [...html.matchAll(/<details><summary>(.*?)<\/summary><p>(.*?)<\/p><\/details>/g)].map(m => [m[1], m[2]]);
  assert.deepEqual(faq.mainEntity.map(q => [q.name, q.acceptedAnswer.text]), visible);
  for (const m of html.matchAll(/href="([^"]+)"/g)) {
    const u = new URL(m[1], origin + file);
    if (u.origin !== new URL(origin).origin) continue;
    const target = decodeURIComponent(u.pathname).slice(1) || 'index.html';
    assert.ok(existsSync(resolve(root, target)), target);
    if (u.hash) assert.ok(read(target).includes(`id="${decodeURIComponent(u.hash.slice(1))}"`), `${file}: ${u.hash}`);
  }
  assert.ok(read('sitemap.xml').includes(`<loc>${origin}${file}</loc><lastmod>2026-09-23</lastmod>`));
  const items = [...feed.matchAll(/<item>[\s\S]*?<\/item>/g)].filter(m => m[0].includes(`<link>${origin}${file}</link>`));
  assert.equal(items.length, 1);
  for (const section of sections) {
    assert.ok(html.includes(`id="${section}"`) && html.includes(`href="#${section}"`));
    assert.ok(items[0][0].includes(`id="${section}"`));
  }
  assert.ok(html.includes('insight-tracking.js?v=5'));
  assert.match(html, /href="index\.html\?inquiry=[a-z-]+#contact"/);
  console.log(`PASS: ${file}: sections, FAQ ${visible.length}, links, sitemap and RSS`);
}
assert.ok(read('cafe-startup-interior.html').includes('href="https://mpmarketing.co.kr/"'));
assert.ok(read('meat-restaurant-startup-interior.html').includes('href="https://mpmarketing.co.kr/"'));
