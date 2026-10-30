// Local validation only. No claim of indexing, ranking or inquiry delivery.
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {INQUIRY_GUIDES, getInquiryContext} from '../inquiry-context.mjs';
import {matchesGuide} from '../guide-tools.mjs';
const origin = 'https://wecocompany.com/';
const read = f => readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const pages = ['commercial-recipe', 'menu-planning', 'transfer-startup'];
const sitemap = read('sitemap.xml'), feed = read('rss.xml');
const titles = new Set();
for (const id of pages) {
  const {page} = INQUIRY_GUIDES[id];
  const html = read(page);
  assert.equal((html.match(/<h1>/g) || []).length, 1);
  assert.match(html, /name="viewport"/);
  assert.match(html, /content="index,follow,max-image-preview:large"/);
  assert.ok(html.includes(`rel="canonical" href="${origin}${page}"`));
  assert.ok(html.includes('insight-tracking.js?v=6'));
  assert.ok(html.includes('레시피 판매·전수 교육 상품 안내가 아닙니다.'));
  assert.ok(html.includes('href="https://mpmarketing.co.kr/"'));
  const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
  const article = graph.find(x => x['@type'] === 'Article');
  assert.equal(article.mainEntityOfPage, origin + page);
  assert.equal(article.dateModified, '2026-10-07');
  assert.ok(!titles.has(article.headline)); titles.add(article.headline);
  const faq = graph.find(x => x['@type'] === 'FAQPage');
  const visible = [...html.matchAll(/<details><summary>(.*?)<\/summary><p>(.*?)<\/p><\/details>/g)].map(m=>[m[1],m[2]]);
  assert.deepEqual(faq.mainEntity.map(q=>[q.name,q.acceptedAnswer.text]), visible);
  assert.equal(visible.length,3);
  for (const [,href] of html.matchAll(/href="([^"]+)"/g)) {
    const u = new URL(href, origin + page);
    if(u.origin !== new URL(origin).origin) continue;
    const target = u.pathname.slice(1) || 'index.html';
    assert.ok(existsSync(new URL('../'+target, import.meta.url)), `${page}: ${target}`);
    if(u.hash) assert.ok(read(target).includes(`id="${u.hash.slice(1)}"`), `${page}: ${href}`);
    if(u.searchParams.has('inquiry')) {
      assert.equal(getInquiryContext(u.search).id,id);
      assert.equal(u.searchParams.has('utm_source'),false);
    }
  }
  assert.equal((html.match(/href="index.html\?inquiry=/g)||[]).length,2);
  assert.ok(sitemap.includes(`<loc>${origin}${page}</loc><lastmod>2026-10-07</lastmod>`));
  assert.equal([...feed.matchAll(/<item>[\s\S]*?<\/item>/g)].filter(m=>m[0].includes(`<link>${origin}${page}</link>`)).length,1);
  for(const hub of ['insights.html','industry-guides.html']) assert.ok(read(hub).includes(`href="${page}"`));
  assert.ok(read('llms.txt').includes(origin + page));
  console.log(`PASS: ${page} — metadata, FAQ, internal links, CTA context, RSS and sitemap`);
}
const cards = [...read('insights.html').matchAll(/<a class="insight-card"[^>]*>([\s\S]*?)<\/a>/g)].map(m=>m[1].replace(/<[^>]+>/g,' '));
for(const query of ['업소용 레시피','메뉴 개발','전수창업','카페 음료','술집']) assert.ok(cards.some(c=>matchesGuide(c,query)), `guide search: ${query}`);
assert.ok(read('main.js').includes('inquiry-context.mjs?v=9'));
assert.ok(read('index.html').includes('main.js?v=156'));
console.log('PASS: guide search and inquiry cache versions');
