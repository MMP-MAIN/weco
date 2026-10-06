import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {getInquiryContext} from '../inquiry-context.mjs';
const read=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');
const base='https://wecocompany.com/';
const pages={'office-branding-interior.html':'office','office-interior-quote-guide.html':'office-quote','daegu-office-interior.html':'daegu-office','small-office-interior-guide.html':'small-office'};
const titles=new Set();
for(const [file,id] of Object.entries(pages)){
 const html=read(file), title=html.match(/<title>(.*?)<\/title>/s)?.[1];
 assert.ok(title&&!titles.has(title),file);titles.add(title);
 assert.equal((html.match(/<h1>/g)||[]).length,1,file);
 assert.ok(html.includes('rel="canonical" href="'+base+file+'"'),file);
 assert.ok(html.includes('content="index,follow,max-image-preview:large"'),file);
 assert.ok(html.includes('office-guides.css?v=1'),file);
 assert.equal(getInquiryContext('?inquiry='+id).page,file);
 assert.equal(html.split('href="index.html?inquiry='+id+'#contact"').length-1,2,file);
 const schemas=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(m=>{const s=JSON.parse(m[1]);return s['@graph']||[s]});
 assert.ok(schemas.some(s=>s['@type']==='Article'&&s.dateModified==='2026-10-02'),file);
 for(const schema of schemas.filter(s=>s['@type']==='FAQPage'))for(const q of schema.mainEntity){assert.ok(html.includes('<summary>'+q.name+'</summary>'),file+': FAQ question');assert.ok(html.includes(q.acceptedAnswer.text),file+': FAQ answer')}
 for(const m of html.matchAll(/(?:href|src)="([^"]+)"/g)){
  const u=new URL(m[1],base+file);if(u.origin!==new URL(base).origin)continue;
  let target=u.pathname.slice(1)||'index.html';if(target.endsWith('/'))target+='index.html';
  assert.ok(existsSync(new URL('../'+target,import.meta.url)),file+': '+target);
  if(u.hash){
   const projectRoute=target==='index.html'&&u.hash==='#portfolio'&&read('main.js').includes("'#portfolio'");
   assert.ok(projectRoute||read(target).includes('id="'+u.hash.slice(1)+'"'),file+': '+u.hash);
  }
 }
 const sitemap=read('sitemap.xml');assert.equal(sitemap.split('<loc>'+base+file+'</loc>').length-1,1,file);
 console.log('PASS: '+file+' — metadata, schema, FAQ parity, links, inquiry context');
}
for(const file of ['insights.html','sitemap.xml','rss.xml','llms.txt','office-branding-interior.html','office-interior-quote-guide.html','daegu-office-interior.html'])assert.ok(read(file).includes('small-office-interior-guide.html'),file);
assert.ok(read('index.html').includes('사무실 인테리어 ↗'));
assert.ok(read('index.html').includes('https://mpmarketing.co.kr/'));
for(const term of ['30평','40평','50평'])assert.ok(read('office-interior-quote-guide.html').includes(term));
console.log('PASS: office search expansion. No lead submitted or indexing claimed.');
