// Read-only checks. Does not send leads, deploy, or claim search indexing.
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {getInquiryContext} from '../inquiry-context.mjs';
const read = file => readFileSync(new URL('../'+file, import.meta.url), 'utf8');
const origin = 'https://wecocompany.com/';
const pages = {
  'restaurant-interior-cost.html': 'kitchen-quote',
  'restaurant-business-conversion-guide.html': 'change-sheet',
  'daegu-commercial-interior.html': 'local-work'
};
const voids = new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
const feed = read('rss.xml'), sitemap = read('sitemap.xml');
for (const [file, section] of Object.entries(pages)) {
  const html = read(file), stack = [];
  for (const m of html.matchAll(/<!--[\s\S]*?-->|<![^>]*>|<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>|<\/?[a-z][^>]*>/gi)) {
    const t=m[0]; if(t.startsWith('<!')) continue;
    const tag=t.match(/^<\/?([\w:-]+)/)[1].toLowerCase();
    if(t.startsWith('</')) assert.equal(stack.pop(),tag,file+': nesting');
    else if(!voids.has(tag)&&!['script','style'].includes(tag)&&!t.endsWith('/>')) stack.push(tag);
  }
  assert.equal(stack.length,0);
  assert.equal((html.match(/<h1>/g)||[]).length,1);
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(ids.length,new Set(ids).size,file+': unique IDs');
  assert.ok(ids.includes(section)&&html.includes('href="#'+section+'"'));
  assert.ok(html.includes('insights.css?v=2'));
  assert.ok(html.includes('width=device-width,initial-scale=1'));
  assert.ok(html.includes('rel="canonical" href="'+origin+file+'"'));
  assert.ok(html.includes('<time datetime="2026-10-13">2026.10.13</time>'));
  const schemas=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(m=>{const s=JSON.parse(m[1]);return s['@graph']||[s]});
  assert.equal(schemas.find(s=>s['@type']==='Article').dateModified,'2026-10-13');
  for(const s of schemas.filter(s=>s['@type']==='FAQPage')) for(const q of s.mainEntity) {
    assert.ok(html.includes(q.name)&&html.includes(q.acceptedAnswer.text));
  }
  for(const [,href] of html.matchAll(/href="([^"]+)"/g)) {
    const u=new URL(href,origin+file); if(u.origin!==new URL(origin).origin) continue;
    const target=decodeURIComponent(u.pathname.slice(1))||'index.html';
    assert.ok(existsSync(new URL('../'+target,import.meta.url)),file+': '+href);
    if(u.hash) assert.ok(read(target).includes('id="'+u.hash.slice(1)+'"'),file+': '+href);
    if(u.searchParams.has('inquiry')) assert.equal(getInquiryContext(u.search).page,file);
    assert.ok(!u.searchParams.has('utm_source'),'Internal links must preserve acquisition');
  }
  assert.ok(sitemap.includes('<loc>'+origin+file+'</loc><lastmod>2026-10-13</lastmod>'));
  const items=[...feed.matchAll(/<item>[\s\S]*?<\/item>/g)].filter(m=>m[0].includes('<link>'+origin+file+'</link>'));
  assert.equal(items.length,1);
  if(items[0][0].includes('<content:encoded>')) assert.ok(items[0][0].includes('id="'+section+'"'));
  if(section!=='local-work') {
    const body=html.slice(html.indexOf('<section id="'+section+'"')).split('</section>')[0];
    assert.ok(body.includes('가상 예시'));
    assert.ok(body.includes('<caption>')&&body.includes('scope="col"')&&body.includes('scope="row"'));
    assert.doesNotMatch(body,/<input\b|<form\b/);
  }
  console.log('PASS: '+file+' — content, tables, links, dates, schema, RSS, inquiry attribution');
}
assert.ok(read('daegu-commercial-interior.html').includes('href="project-gasik.html#role"'));
assert.ok(read('index.html').includes('삼덕 · 더현대 · 범어'));
assert.ok(read('project-gasik.html').includes('기획·디자인·공간·광고'));
assert.ok(read('daegu-commercial-interior.html').includes('href="https://mpmarketing.co.kr/"'));
console.log('PASS: regional reference matches existing published project scope; no fabricated metrics.');
