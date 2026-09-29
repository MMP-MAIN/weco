// Read-only content verification: does not send inquiries or publish the site.
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {getInquiryContext} from '../inquiry-context.mjs';
const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const origin = 'https://wecocompany.com/';
const pages = {
  'meat-restaurant-startup-interior.html': 'budget-sheet',
  'restaurant-startup-reality.html': 'order-example',
  'brand-consulting-guide.html': 'deliverable-example',
  'commercial-interior-quote-checklist.html': 'quote-example',
  'hair-salon-interior-process-guide.html': 'salon-brief-example'
};
const voids = new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
const feed=read('rss.xml'), sitemap=read('sitemap.xml');
for(const [file,id] of Object.entries(pages)) {
  const html=read(file), stack=[];
  for(const m of html.matchAll(/<!--[\s\S]*?-->|<![^>]*>|<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>|<\/?[a-z][^>]*>/gi)) {
    const token=m[0]; if(token.startsWith('<!'))continue;
    const tag=token.match(/^<\/?([\w:-]+)/)[1].toLowerCase();
    if(token.startsWith('</')) assert.equal(stack.pop(),tag,`${file}: tag nesting`);
    else if(!voids.has(tag)&&!['script','style'].includes(tag)&&!token.endsWith('/>'))stack.push(tag);
  }
  assert.equal(stack.length,0);
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,ids.length,`${file}: unique IDs`);
  assert.equal((html.match(/<h1>/g)||[]).length,1);
  assert.ok(html.includes(`rel="canonical" href="${origin}${file}"`));
  assert.ok(html.includes(`href="#${id}"`));
  const section=html.match(new RegExp(`<section id="${id}"[\\s\\S]*?<\\/section>`))?.[0];
  assert.ok(section,`${file}: static, crawlable example`);
  assert.ok(section.includes('가상')&&section.includes('예시'));
  assert.ok(section.includes('<caption>')&&section.includes('scope="col"')&&section.includes('scope="row"'));
  assert.doesNotMatch(section, /<form\b|<script\b|<input\b/);
  assert.ok(html.includes('insights.css?v=2'));
  const schema=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(m=>{const j=JSON.parse(m[1]);return j['@graph']||[j]});
  assert.equal(schema.find(j=>j['@type']==='Article').dateModified,'2026-09-29');
  for(const faq of schema.filter(j=>j['@type']==='FAQPage')) for(const q of faq.mainEntity) {
    assert.ok(html.includes(q.name)&&html.includes(q.acceptedAnswer.text),`${file}: visible FAQ`);
  }
  assert.ok(sitemap.includes(`<loc>${origin}${file}</loc><lastmod>2026-09-29</lastmod>`));
  const items=[...feed.matchAll(/<item>[\s\S]*?<\/item>/g)].filter(m=>m[0].includes(`<link>${origin}${file}</link>`));
  assert.equal(items.length,1);
  assert.ok(items[0][0].includes(`id="${id}"`),`${file}: RSS updated`);
  for(const [,href] of html.matchAll(/href="([^"]+)"/g)) {
    const url=new URL(href,origin+file); if(url.origin!==new URL(origin).origin)continue;
    const target=url.pathname.slice(1)||'index.html';
    assert.ok(existsSync(new URL(`../${target}`,import.meta.url)),`${file}: ${href}`);
    if(url.hash)assert.ok(read(target).includes(`id="${url.hash.slice(1)}"`),`${file}: anchor ${href}`);
    if(url.searchParams.has('inquiry'))assert.equal(getInquiryContext(url.search)?.page,file);
    assert.ok(!url.searchParams.has('utm_source'),'preserve original attribution');
  }
  console.log(`PASS: ${file}: static example, accessible table, links, schema, RSS and dates`);
}
assert.equal(30000000/25/20000,60);
assert.equal(30000000/25/15000,80);
assert.ok(read('restaurant-startup-reality.html').includes('고객 수'));
console.log('PASS: arithmetic is illustrative, not a profitability forecast. No live form submission.');
