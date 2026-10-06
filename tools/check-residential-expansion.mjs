import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {getInquiryContext} from '../inquiry-context.mjs';
const read=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');
const base='https://wecocompany.com/';
const pages={
 'house-remodeling-guide.html':['house-remodeling','단독주택','구옥','노후주택','전원주택'],
 '20-pyeong-apartment-interior-guide.html':['small-apartment','20평','24평','25평','수납'],
 '40-pyeong-apartment-interior-guide.html':['large-apartment','40평','공간별','욕실','일정'],
 'partial-home-interior-guide.html':['partial-home','부분 인테리어','주방','욕실','도배']
};
const titles=new Set;
assert.match(read('sitemap.xml'), /^<\?xml[^>]*>\s*<urlset\b[^>]*>(?:\s*<url>[\s\S]*?<\/url>\s*)+<\/urlset>\s*$/);
for(const [file,[id,...terms]] of Object.entries(pages)){
 const html=read(file); const title=html.match(/<title>(.*?)<\/title>/s)?.[1];
 assert.ok(title&&!titles.has(title));titles.add(title);
 assert.equal((html.match(/<h1>/g)||[]).length,1,file);
 assert.ok(html.includes('content="index,follow,max-image-preview:large"'),file);
 assert.ok(html.includes('rel="canonical" href="'+base+file+'"'),file);
 assert.ok(html.includes('property="og:url" content="'+base+file+'"'),file);
 assert.equal((html.match(/<details>/g)||[]).length,3,file);
 assert.ok(html.includes('2026-10-02'),file);
 for(const term of terms)assert.ok(html.includes(term),file+': '+term);
 const schemas=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
 assert.ok(schemas[0]['@graph'].some(s=>s['@type']==='Article'&&s.mainEntityOfPage===base+file));
 assert.ok(schemas[0]['@graph'].some(s=>s['@type']==='BreadcrumbList'));
 assert.equal(getInquiryContext('?inquiry='+id).page,file);
 for(const m of html.matchAll(/(?:href|src)="([^"]+)"/g)){
   const u=new URL(m[1],base+file); if(u.origin!==new URL(base).origin)continue;
   let target=u.pathname.slice(1)||'index.html';if(target.endsWith('/'))target+='index.html';
   assert.ok(existsSync(new URL('../'+target,import.meta.url)),file+': '+target);
   if(u.hash)assert.ok(read(target).includes('id="'+u.hash.slice(1)+'"'),file+': '+u.hash);
 }
 for(const f of ['residential.html','insights.html','sitemap.xml','rss.xml','llms.txt'])assert.ok(read(f).includes(file),f+': missing '+file);
 assert.equal((read('sitemap.xml').match(new RegExp('<loc>'+base.replaceAll('.','\\.')+file.replaceAll('.','\\.')+'</loc>','g'))||[]).length,1);
 assert.ok(read('rss.xml').includes('<guid>'+base+file+'</guid>'));
 console.log('PASS: '+file+' — unique intent, metadata, schema, FAQs, local links, feeds and inquiry context');
}
assert.ok(read('index.html').includes('주택·아파트 인테리어 ↗'));
assert.ok(read('index.html').includes('https://mpmarketing.co.kr/'));
assert.ok(read('residential.html').includes('각 지역에 지점이나 상주 시공팀이 있다는 뜻은 아니며'));
assert.ok(read('residential-guides.css').includes('overflow-wrap:anywhere'));
console.log('PASS: residential search routes; no lead submitted, no ranking or indexing claim.');
