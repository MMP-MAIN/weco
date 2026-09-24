import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = name => readFileSync(resolve(root, name), 'utf8');
const origin = 'https://wecocompany.com/';
const files = ['hair-salon-interior-process-guide.html', 'daegu-hair-salon-interior.html'];
for (const file of files) {
  const html = read(file);
  const expectedDate = file === 'hair-salon-interior-process-guide.html' ? '2026-09-25' : '2026-09-23';
  assert.equal((html.match(/<h1>/g) || []).length, 1, `${file}: one heading`);
  assert.ok(html.includes(`rel="canonical" href="${origin}${file}"`));
  assert.ok(html.includes('width=device-width,initial-scale=1'));
  assert.ok(html.includes('insight-tracking.js?v=5'));
  const data = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(m => {
    const json = JSON.parse(m[1]); return json['@graph'] || [json];
  });
  const visible = [...html.matchAll(/<details><summary>(.*?)<\/summary><p>(.*?)<\/p><\/details>/g)].map(m => [m[1], m[2]]);
  const faq = data.find(x => x['@type'] === 'FAQPage');
  assert.deepEqual(faq.mainEntity.map(q => [q.name, q.acceptedAnswer.text]), visible, `${file}: FAQ parity`);
  assert.equal(data.find(x => x['@type'] === 'Article').dateModified, expectedDate);
  assert.ok(read('sitemap.xml').includes(`<loc>${origin}${file}</loc><lastmod>${expectedDate}</lastmod>`));
  for (const m of html.matchAll(/href="([^"]+)"/g)) {
    const url = new URL(m[1], origin + file);
    if (url.origin !== new URL(origin).origin) continue;
    const target = decodeURIComponent(url.pathname).slice(1) || 'index.html';
    assert.ok(existsSync(resolve(root, target)), `${file}: ${target}`);
    if (url.hash) assert.ok(read(target).includes(`id="${decodeURIComponent(url.hash.slice(1))}"`), `${file}: ${url.hash}`);
  }
  console.log(`PASS: ${file}; FAQ ${visible.length}, metadata, links and anchors`);
}
assert.ok(read(files[0]).includes('id="small-salon-cost"'));
assert.ok(read(files[0]).includes('id="quote"'));
assert.ok(read(files[1]).includes('id="partner"'));
assert.ok(read(files[1]).includes('id="visit"'));
const rss = read('rss.xml');
const item = [...rss.matchAll(/<item>[\s\S]*?<\/item>/g)].find(m => m[0].includes(`<link>${origin}${files[0]}</link>`))[0];
assert.ok(item.includes('id="small-salon-cost"') && item.includes('id="quote"'));
assert.ok(item.includes('<pubDate>Sat, 29 Aug 2026 15:00:00 GMT</pubDate>'), 'retain original publication date');
assert.ok(read('insights.html').includes('10평 미용실 인테리어'));
assert.ok(read('industry-guides.html').includes('10평 미용실 인테리어 비용과 견적 준비'));
console.log('PASS: existing guides connected; RSS content and publication date checked');
