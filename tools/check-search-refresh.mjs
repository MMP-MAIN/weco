// Focused landing-page checks and a read-only discovery audit.
// Crawl permission and internal links do not prove that Google has indexed a URL.
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
const read = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const origin = 'https://wecocompany.com/';
const changed = {
  'brand-consulting-guide.html': ['2026-09-07', 'project-quote', 'deliverable-example', 'quote-check'],
  'restaurant-interior-cost.html': ['2026-08-22', 'kitchen-quote', 'estimate', 'prepare'],
  'commercial-interior-quote-checklist.html': ['2026-08-30', 'quote-example', 'photos', 'industry'],
};
const priority = [
  'bar-startup-interior-guide.html', 'bbq-restaurant-duct-interior-guide.html',
  'brand-naming-slogan-guide.html', 'cafe-lease-interior-checklist.html',
  'daegu-cafe-interior.html',
];
const pages = readdirSync(new URL('../', import.meta.url)).filter(f => f.endsWith('.html'));
const sitemap = read('sitemap.xml'), robots = read('robots.txt');
for (const [file, [published, ...anchors]] of Object.entries(changed)) {
  const html = read(file);
  const hero = html.match(/<header class="article-hero">([\s\S]*?)<\/header>/)?.[1];
  assert.ok(hero, file + ': article hero');
  for (const id of anchors) {
    assert.ok(hero.includes('href="#' + id + '"'), file + ': shortcut to ' + id);
    assert.ok(html.includes('id="' + id + '"'), file + ': target ' + id);
  }
  assert.match(hero, /datetime="2026-10-24"/);
  assert.ok(hero.includes('class="hero-shortcuts"'), file + ': touch-friendly shortcuts');
  assert.ok(html.includes('insights.css?v=3'), file + ': refreshed style cache');
  assert.equal((html.match(/<h1>/g) || []).length, 1, file);
  const schemas = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .flatMap(m => { const data = JSON.parse(m[1]); return data['@graph'] || [data]; });
  const article = schemas.find(x => x['@type'] === 'Article');
  assert.equal(article.datePublished, published, file + ': original publication');
  assert.equal(article.dateModified, '2026-10-24');
  const title = html.match(/<title>(.*?)<\/title>/s)[1];
  assert.equal(title, article.headline + ' | 위코컴퍼니', file + ': title/schema alignment');
  assert.ok(html.includes('name="description" content="' + article.description + '"'));
  for (const data of schemas.filter(x => x['@type'] === 'FAQPage')) {
    for (const q of data.mainEntity) {
      assert.ok(html.includes('<summary>' + q.name + '</summary>'), file + ': visible FAQ question');
      assert.ok(html.includes(q.acceptedAnswer.text), file + ': visible FAQ answer');
    }
  }
}
const disallows = [...robots.matchAll(/^Disallow:\s*(\S*)/gm)].map(m => m[1]).filter(Boolean);
for (const file of priority) {
  const html = read(file), url = origin + file;
  assert.ok(html.includes('rel="canonical" href="' + url + '"'), file + ': self canonical');
  assert.doesNotMatch(html, /<meta name="robots"[^>]+noindex/i, file + ': no index exclusion');
  assert.ok(!disallows.some(rule => ('/' + file).startsWith(rule)), file + ': robots permission');
  assert.ok(sitemap.includes('<loc>' + url + '</loc>'), file + ': sitemap');
  const incoming = pages.filter(source => source !== file &&
    [...read(source).matchAll(/<a\b[^>]*href="([^"]+)"/g)].some(m =>
      new URL(m[1], origin + source).href.split(/[?#]/)[0] === url));
  assert.ok(incoming.length >= 1, file + ': incoming link');
  console.log('DISCOVERY: ' + file + ' — ' + incoming.length + ' linking pages; canonical/robots/sitemap OK (not index confirmation)');
}
for (const file of Object.keys(changed)) {
  const html = read(file);
  for (const [, href] of html.matchAll(/<a\b[^>]*href="([^"]+)"/g)) {
    const u = new URL(href, origin + file);
    if (u.origin !== new URL(origin).origin) continue;
    const target = u.pathname.slice(1) || 'index.html';
    const targetHtml = read(target);
    if (u.hash) assert.ok(targetHtml.includes('id="' + decodeURIComponent(u.hash.slice(1)) + '"'), file + ': ' + href);
    assert.ok(!u.searchParams.has('utm_source'), file + ': preserve acquisition');
  }
}
console.log('PASS: 3 refreshed pages — shortcuts, original dates, metadata, FAQ and local links.');
