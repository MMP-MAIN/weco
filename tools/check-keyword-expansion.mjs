// Local, read-only validation. Does not submit leads or claim search indexing.
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { getInquiryContext } from '../inquiry-context.mjs';
const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const origin = 'https://wecocompany.com/';
const pages = {
  'cafe-startup-interior.html': ['independent-cafe', 'consulting'],
  'hair-salon-interior-process-guide.html': ['solo-layout'],
  'brand-consulting-guide.html': ['weco-fit'],
  'spatial-branding-guide.html': ['consulting'],
  'brand-renewal-checklist.html': ['keep-name'],
  'restaurant-business-conversion-guide.html': ['reason', 'reuse', 'budget', 'reopen', 'scope', 'faq'],
};
const feed = read('rss.xml'), sitemap = read('sitemap.xml');
const voidTags = new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
for (const [file, sections] of Object.entries(pages)) {
  const html = read(file), stack = [];
  for (const m of html.matchAll(/<!--[\s\S]*?-->|<![^>]*>|<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>|<\/?[a-z][^>]*>/gi)) {
    const t = m[0];
    if (t.startsWith('<!')) continue;
    const tag = t.match(/^<\/?([\w:-]+)/)[1].toLowerCase();
    if (t.startsWith('</')) assert.equal(stack.pop(), tag, `${file}: balanced ${tag}`);
    else if (!voidTags.has(tag) && !['script', 'style'].includes(tag) && !/\/\s*>$/.test(t)) stack.push(tag);
  }
  assert.equal(stack.length, 0, `${file}: closed tags`);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(ids.length, new Set(ids).size, `${file}: unique IDs`);
  assert.equal((html.match(/<h1>/g) || []).length, 1);
  assert.ok(html.includes(`rel="canonical" href="${origin}${file}"`));
  assert.ok(html.includes('width=device-width,initial-scale=1'));
  assert.ok(html.includes('insight-tracking.js?v=5'));
  const schema = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(m => {
    const j = JSON.parse(m[1]); return j['@graph'] || [j];
  });
  assert.equal(schema.find(n => n['@type'] === 'Article').dateModified, '2026-09-25');
  assert.ok(html.includes('<time datetime="2026-09-25">2026.09.25</time>'));
  const faq = schema.find(n => n['@type'] === 'FAQPage');
  if (faq) for (const q of faq.mainEntity) {
    assert.ok(html.includes(q.name), `${file}: visible FAQ question`);
    assert.ok(html.includes(q.acceptedAnswer.text), `${file}: visible FAQ answer`);
  }
  for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
    const u = new URL(href, origin + file);
    if (u.origin !== new URL(origin).origin) continue;
    const target = u.pathname.slice(1) || 'index.html';
    assert.ok(existsSync(new URL(`../${target}`, import.meta.url)), `${file}: ${target}`);
    if (u.hash) assert.ok(read(target).includes(`id="${u.hash.slice(1)}"`), `${file}: ${href}`);
    if (u.searchParams.has('inquiry')) assert.equal(getInquiryContext(u.search)?.page, file);
  }
  assert.ok(sitemap.includes(`<loc>${origin}${file}</loc><lastmod>2026-09-25</lastmod>`));
  const items = [...feed.matchAll(/<item>[\s\S]*?<\/item>/g)].filter(m => m[0].includes(`<link>${origin}${file}</link>`));
  assert.equal(items.length, 1, `${file}: unique RSS item`);
  for (const id of sections) {
    assert.ok(ids.includes(id) && html.includes(`href="#${id}"`), `${file}: reachable new section`);
    assert.ok(items[0][0].includes(`id="${id}"`), `${file}: RSS current content`);
  }
  assert.ok(['insights.html', 'industry-guides.html'].some(hub => read(hub).includes(`href="${file}"`)), `${file}: hub discovery`);
  console.log(`PASS: ${file}: structure, links, FAQ, dates, RSS and inquiry context`);
}
const fresh = 'restaurant-business-conversion-guide.html';
assert.ok(read('industry-guides.html').includes(`href="${fresh}"`));
assert.ok(read('cafe-startup-interior.html').includes(`href="${fresh}"`));
assert.ok(read('brand-renewal-checklist.html').includes(`href="${fresh}"`));
assert.ok(read('main.js').includes('inquiry-context.mjs?v=2'));
assert.ok(read('index.html').includes('main.js?v=145'));
console.log('PASS: new guide discoverable, versioned consultation routes, no live submission.');
