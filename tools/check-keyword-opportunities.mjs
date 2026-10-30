// Local regression checks only: never submit a lead or claim ranking/indexing.
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {getInquiryContext} from '../inquiry-context.mjs';
const read = f => readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const origin = 'https://wecocompany.com/';
const additions = {
  'logo-brand-design-guide.html': 'logo-design',
  'menu-board-design-guide.html': 'menu-design',
};
const updated = [...Object.keys(additions), 'startup-guide.html', 'commercial-remodeling-planning-guide.html'];
const schemas = html => [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
  .flatMap(m => { const j = JSON.parse(m[1]); return j['@graph'] || [j]; });
const sitemap = read('sitemap.xml'), feed = read('rss.xml');
const titles = new Set(), descriptions = new Set();
const voids = new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
for (const file of updated) {
  const html = read(file), stack = [];
  for (const m of html.matchAll(/<!--[\s\S]*?-->|<![^>]*>|<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>|<\/?[a-z][^>]*>/gi)) {
    const token = m[0]; if (token.startsWith('<!')) continue;
    const tag = token.match(/^<\/?([\w:-]+)/)[1].toLowerCase();
    if (token.startsWith('</')) assert.equal(stack.pop(), tag, file + ': balanced tags');
    else if (!voids.has(tag) && !['script','style'].includes(tag) && !token.endsWith('/>')) stack.push(tag);
  }
  assert.equal(stack.length, 0);
  assert.equal((html.match(/<h1>/g) || []).length, 1);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(ids.length, new Set(ids).size, file + ': unique IDs');
  assert.ok(html.includes('rel="canonical" href="' + origin + file + '"'));
  assert.doesNotMatch(html, /<meta name="robots"[^>]*noindex/);
  assert.doesNotMatch(html, /<meta name="keywords"/, file + ': not a keyword dump');
  const title = html.match(/<title>(.*?)<\/title>/s)[1];
  const description = html.match(/<meta name="description" content="([^"]+)"/)[1];
  assert.ok(!titles.has(title) && !descriptions.has(description), file + ': distinct intent');
  titles.add(title); descriptions.add(description);
  const data = schemas(html), article = data.find(j => j['@type'] === 'Article');
  assert.equal(article.dateModified, '2026-10-24');
  assert.ok(title.includes(article.headline));
  assert.ok(sitemap.includes('<loc>' + origin + file + '</loc><lastmod>2026-10-24</lastmod>'));
  for (const [,href] of html.matchAll(/<a\b[^>]*href="([^"]+)"/g)) {
    const url = new URL(href.replaceAll('&amp;', '&'), origin + file);
    if (url.origin !== new URL(origin).origin) continue;
    let target = url.pathname.slice(1) || 'index.html';
    if (target.endsWith('/')) target += 'index.html';
    const targetHtml = read(target);
    if (url.hash) assert.ok(targetHtml.includes('id="' + decodeURIComponent(url.hash.slice(1)) + '"'), file + ': ' + href);
    assert.ok(!url.searchParams.has('utm_source'), file + ': retain source attribution');
  }
  if (Object.hasOwn(additions, file)) {
    assert.equal(article.datePublished, '2026-10-24');
    assert.equal(article.description, description);
    const id = additions[file];
    assert.equal(getInquiryContext('?inquiry=' + id).page, file);
    assert.equal((html.match(new RegExp('href="index.html\\?inquiry=' + id + '#contact"', 'g')) || []).length, 2);
    for (const faq of data.filter(j => j['@type'] === 'FAQPage')) {
      assert.equal(faq.mainEntity.length, 3);
      for (const q of faq.mainEntity) {
        assert.ok(html.includes('<summary>' + q.name + '</summary>'));
        assert.ok(html.includes(q.acceptedAnswer.text));
      }
    }
    assert.ok(html.includes('class="decision-table"') && html.includes('<caption>'));
    assert.ok(html.includes('href="https://mpmarketing.co.kr/"'));
    assert.ok(html.includes('https://www.kidp.or.kr/?menuno=935'));
    for (const hub of ['insights.html','industry-guides.html','brand-consulting-guide.html']) {
      assert.ok(read(hub).includes('href="' + file), file + ': context link from ' + hub);
    }
    const incoming = readdirSync(new URL('../', import.meta.url)).filter(f => f.endsWith('.html') && f !== file && read(f).includes('href="' + file));
    assert.ok(incoming.length >= 3);
    const items = [...feed.matchAll(/<item>[\s\S]*?<\/item>/g)].filter(m => m[0].includes('<link>' + origin + file + '</link>'));
    assert.equal(items.length, 1);
    assert.ok(items[0][0].includes('<guid>' + origin + file + '</guid>'));
    console.log('PASS: ' + file + ' — visible guide, 3 FAQs, inquiry context, ' + incoming.length + ' linking pages, sitemap and RSS');
  }
}
const startup = read('startup-guide.html');
const food = startup.slice(startup.indexOf('<section class="food-type-guide"'), startup.indexOf('<section class="notice">'));
assert.equal((food.match(/<th scope="row">/g) || []).length, 12);
for (const term of ['반찬가게 창업','배달전문점 창업','디저트카페 창업','베이커리카페 창업','샐러드 창업','김밥·분식집 창업','한식·국밥 창업','돈까스·일식 창업']) assert.ok(food.includes(term));
assert.ok(startup.includes('href="#food-types"'));
assert.ok(read('startup-guide.css').includes('min-width:640px') && read('startup-guide.css').includes('overflow-x:auto'));
assert.ok(food.includes('영업신고 업종을 판정하는 표가 아닙니다'));
assert.ok(read('commercial-remodeling-planning-guide.html').includes('id="vacancy-plan"'));
assert.ok(read('index.html').includes('main.js?v=156'));
assert.ok(read('main.js').includes('inquiry-context.mjs?v=9'));
console.log('PASS: 12 food-business comparisons, bounded mobile table, vacancy/renewal guide and versioned inquiry routes.');
