// Read-only checks for improvements based on actual search queries. No live lead submission.
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {getInquiryContext} from '../inquiry-context.mjs';
const read=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');
const origin='https://wecocompany.com/';
const pages={
 'brand-consulting-guide.html':['brand-consulting','cost','브랜드 컨설팅 비용'],
 'daegu-commercial-interior.html':['daegu-commercial','prepare','대구 상가·식당'],
 'commercial-interior-quote-checklist.html':['commercial-quote','photos','상가 인테리어 견적 비교'],
 'restaurant-interior-cost.html':['restaurant-cost','kitchen','주방 설비 비용']
};
const rss=read('rss.xml'), sitemap=read('sitemap.xml');
for(const [file,[id,section,term]]of Object.entries(pages)){
 const html=read(file);
 assert.equal((html.match(/<h1>/g)||[]).length,1,file);
 assert.ok(html.match(/<title>(.*?)<\/title>/s)[1].includes(term),file+': title intent');
 assert.ok(html.includes('rel="canonical" href="'+origin+file+'"'));
 assert.ok(html.includes('id="'+section+'"')&&html.includes('href="#'+section+'"'));
 assert.equal(getInquiryContext('?inquiry='+id).page,file);
 assert.ok(html.includes('href="index.html?inquiry='+id+'#contact"'));
 const schemas=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(m=>{const s=JSON.parse(m[1]);return s['@graph']||[s]});
 const updated = ['daegu-commercial-interior.html','restaurant-interior-cost.html'].includes(file) ? '2026-10-13' : '2026-10-06';
 assert.equal(schemas.find(s=>s['@type']==='Article').dateModified,updated);
 for(const schema of schemas.filter(s=>s['@type']==='FAQPage'))for(const q of schema.mainEntity){
  assert.ok(html.includes('<summary>'+q.name+'</summary>'));
  assert.ok(html.includes(q.acceptedAnswer.text));
 }
 for(const [,href]of html.matchAll(/href="([^"]+)"/g)){
  const u=new URL(href,origin+file);if(u.origin!==new URL(origin).origin)continue;
  const target=u.pathname.slice(1)||'index.html';
  assert.ok(existsSync(new URL('../'+target,import.meta.url)),file+': '+target);
  if(u.hash)assert.ok(read(target).includes('id="'+u.hash.slice(1)+'"'),file+': '+href);
  assert.ok(!u.searchParams.has('utm_source'),'Internal CTA must preserve acquisition');
 }
 assert.ok(sitemap.includes('<loc>'+origin+file+'</loc><lastmod>'+updated+'</lastmod>'));
 const items=[...rss.matchAll(/<item>[\s\S]*?<\/item>/g)].filter(m=>m[0].includes('<link>'+origin+file+'</link>'));
 assert.equal(items.length,1);
 assert.ok(items[0][0].includes(term));
 if(items[0][0].includes('<content:encoded>'))assert.ok(items[0][0].includes('id="'+section+'"'));
 console.log('PASS: '+file+' — intent, links, context, schema and feed');
}
