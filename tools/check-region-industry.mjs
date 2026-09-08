// Read-only regression checks, not proof of search ranking or AI citations.
import {readFileSync, existsSync} from 'node:fs';
import assert from 'node:assert/strict';
const root = new URL('../', import.meta.url);
const read = f => readFileSync(new URL(f, root), 'utf8');
const plain = s => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const regions = [['포항','pohang'],['울산','ulsan'],['구미','gumi'],['경주','gyeongju']];
for (const [city, slug] of regions) {
  const file = slug+'-interior-space-branding.html', html = read(file);
  const url = 'https://wecocompany.com/'+file;
  assert.equal((html.match(/<h1\b/g)||[]).length, 1, file+': H1');
  assert.equal((html.match(/rel="canonical"/g)||[]).length, 1);
  assert.ok(html.includes('rel="canonical" href="'+url+'"'));
  assert.doesNotMatch(html, /noindex|주거|아파트|주택/);
  const data = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
  const article = data.find(x=>x['@type']==='Article');
  assert.equal(article.mainEntityOfPage,url);
  assert.equal(article.datePublished, slug==='gyeongju'?'2026-09-08':'2026-09-04');
  assert.equal(article.author['@id'],'https://wecocompany.com/#organization');
  const body = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)[1];
  const text = plain(body);
  for (const type of ['카페','고기집','식당','음식점','술집']) assert.ok(text.includes(city+' '+type+' 인테리어'), city+' '+type);
  for (const id of ['cafe','bbq','restaurant','bar']) {
    const section = body.match(new RegExp('<section id="'+id+'">([\\s\\S]*?)</section>'))?.[1];
    assert.ok(section && plain(section).length>130, file+': substantial '+id);
  }
  const visible = [...body.matchAll(/<details><summary>(.*?)<\/summary><p>(.*?)<\/p><\/details>/g)].map(m=>[m[1],m[2]]);
  assert.equal(visible.length,3);
  assert.deepEqual(data.find(x=>x['@type']==='FAQPage').mainEntity.map(x=>[x.name,x.acceptedAnswer.text]),visible);
  for (const m of html.matchAll(/href="([^"]+)"/g)) {
    const u = new URL(m[1],url); if(u.origin!=='https://wecocompany.com')continue;
    const f = u.pathname.slice(1)||'index.html'; assert.ok(existsSync(new URL(f,root)), f);
    if(u.hash)assert.ok(read(f).includes('id="'+u.hash.slice(1)+'"'),u.href);
  }
  for(const hub of ['index.html','industry-guides.html','yeongnam-interior-service-area.html'])assert.ok(read(hub).includes('href="'+file+'"'),hub+' link');
  assert.ok(read('llms.txt').includes(url));
  assert.equal(read('sitemap.xml').split('<loc>'+url+'</loc>').length-1,1);
  const items=[...read('rss.xml').matchAll(/<item>[\s\S]*?<\/item>/g)].map(m=>m[0]).filter(x=>x.includes('<guid>'+url+'</guid>'));
  assert.equal(items.length,1);
  assert.equal(plain(items[0].match(/<!\[CDATA\[([\s\S]*?)\]\]>/)[1]),plain(body.slice(body.indexOf('<article>'),body.lastIndexOf('</article>')+10)));
  console.log('PASS:',city,'5 search topics, 4 sections, FAQ, links, RSS, sitemap');
}
