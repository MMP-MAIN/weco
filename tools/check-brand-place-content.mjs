// Read-only local checks. These do not prove indexing, ranking, conversion or browser rendering.
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const origin = 'https://wecocompany.com';
const publicationDate = '2026-09-15';
const files = [
  'spatial-branding-guide.html',
  'commercial-remodeling-planning-guide.html',
  'local-branding-guide.html',
];
const read = file => readFileSync(resolve(root, file), 'utf8');
const decode = text => text.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (entity, name) => {
  if (name.startsWith('#')) return String.fromCodePoint(name[1].toLowerCase() === 'x' ? parseInt(name.slice(2), 16) : Number(name.slice(1)));
  return ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' })[name.toLowerCase()] ?? entity;
});
const plain = html => decode(html.replace(/<!--[\s\S]*?-->|<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const attributes = tag => Object.fromEntries([...tag.replace(/^<\/?[\w:-]+/, '').replace(/\/?>$/, '').matchAll(/([^\s=<>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)].map(m => [m[1].toLowerCase(), decode(m[2] ?? m[3] ?? m[4] ?? '')]));
const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map(m => attributes(m[0]));
const one = (items, label) => { assert.equal(items.length, 1, `${label}: exactly one`); return items[0]; };

// The new guides use explicitly closed semantic HTML. Track nesting so framework
// <article> cards do not truncate the outer article or hide malformed content.
function parse(html, label) {
  const nodes = [], stack = [];
  const voidTags = new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
  for (const match of html.matchAll(/<!--[\s\S]*?-->|<![^>]*>|<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>|<\/?[a-z][^>]*>/gi)) {
    const token = match[0];
    if (token.startsWith('<!')) continue;
    const tag = token.match(/^<\/?([\w:-]+)/)[1].toLowerCase();
    if (token.startsWith('</')) {
      const node = stack.pop();
      assert.equal(node?.tag, tag, `${label}: balanced </${tag}>`);
      node.end = match.index;
      node.after = match.index + token.length;
      continue;
    }
    const opening = token.slice(0, token.indexOf('>') + 1);
    const node = { tag, attrs: attributes(opening), parent: stack.at(-1), start: match.index,
      contentStart: match.index + opening.length, end: match.index + opening.length, after: match.index + opening.length };
    nodes.push(node);
    if (tag === 'script' || tag === 'style') {
      node.end = match.index + token.toLowerCase().lastIndexOf(`</${tag}`);
      node.after = match.index + token.length;
    } else if (!voidTags.has(tag) && !/\/\s*>$/.test(token)) stack.push(node);
  }
  assert.equal(stack.length, 0, `${label}: no unclosed elements`);
  return nodes;
}
const descendants = (nodes, node) => nodes.filter(item => item.start > node.start && item.after <= node.after);
const inner = (html, node) => html.slice(node.contentStart, node.end);
const isType = (node, type) => [].concat(node?.['@type'] ?? []).includes(type);
const schemaNodes = data => Array.isArray(data) ? data.flatMap(schemaNodes) : data && typeof data === 'object' ? [data, ...schemaNodes(data['@graph'])] : [];
const hasClass = (node, name) => (node.attrs.class ?? '').split(/\s+/).includes(name);
const hiddenStyle = /(?:^|;)\s*(?:display\s*:\s*none|visibility\s*:\s*(?:hidden|collapse)|content-visibility\s*:\s*hidden|opacity\s*:\s*0(?:\.0*)?(?![\d.]))\s*(?:!important\s*)?(?:;|$)/i;
const archivedResidential = /(?:^|\/)(?:residential|apartment-interior-planning-checklist|daegu-apartment-interior|old-apartment-remodeling-checklist|30-pyeong-apartment-interior-guide)\.html$/i;
const residentialOffer = /(?:주거|주택|아파트|빌라)\s*(?:인테리어|리모델링|설계|시공|상담|서비스)|RESIDENTIAL/i;
let internalTargets = 0;

function checkTarget(raw, base, label, fragment = true) {
  assert.ok(raw?.trim() && raw !== '#', `${label}: a real destination`);
  const url = new URL(decode(raw), base);
  assert.ok(!['javascript:', 'vbscript:'].includes(url.protocol), `${label}: ordinary navigable URL`);
  if (url.origin !== origin) return url;
  let file = decodeURIComponent(url.pathname).replace(/^\//, '') || 'index.html';
  if (file.endsWith('/')) file += 'index.html';
  const path = resolve(root, file);
  assert.ok(path.startsWith(root.endsWith(sep) ? root : root + sep), `${label}: within repository`);
  assert.ok(existsSync(path) && statSync(path).isFile(), `${label}: existing ${file}`);
  if (fragment && url.hash) {
    const id = decodeURIComponent(url.hash.slice(1));
    const target = read(file);
    const ids = [...target.matchAll(/\b(?:id|name)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(m => decode(m[1] ?? m[2]));
    assert.ok(ids.includes(id), `${label}: existing #${id} in ${file}`);
  }
  internalTargets += 1;
  return url;
}

const hub = read('insights.html');
const hubLinks = tags(hub, 'a').map(a => new URL(a.href, `${origin}/insights.html`).href);
const sitemapEntries = [...read('sitemap.xml').matchAll(/<url\b[^>]*>([\s\S]*?)<\/url>/g)].map(m => m[1]);
const rssItems = [...read('rss.xml').matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/g)].map(m => m[1]);
const xmlValue = (xml, tag) => decode(xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`))?.[1]?.trim() ?? '');
const llmsUrls = read('llms.txt').match(/https:\/\/[^\s)<>]+/g) ?? [];
const unique = { title: new Set(), description: new Set(), h1: new Set() };

for (const file of files) {
  assert.ok(existsSync(resolve(root, file)), `${file}: published source exists`);
  const html = read(file), url = `${origin}/${file}`, nodes = parse(html, file);
  assert.match(html, /^\s*<!doctype html>/i, `${file}: standard HTML document`);
  assert.equal(one(nodes.filter(n => n.tag === 'html'), `${file}: html`).attrs.lang, 'ko');
  const head = one(nodes.filter(n => n.tag === 'head'), `${file}: head`);
  const main = one(nodes.filter(n => n.tag === 'main'), `${file}: main`);
  const article = one(nodes.filter(n => n.tag === 'article' && n.parent === main), `${file}: main article`);
  const content = descendants(nodes, article);
  const body = one(content.filter(n => hasClass(n, 'article-body')), `${file}: static article body`);
  const h1 = one(nodes.filter(n => n.tag === 'h1'), `${file}: H1`);
  assert.ok(content.includes(h1), `${file}: H1 is in the article`);
  const title = plain(inner(html, one(nodes.filter(n => n.tag === 'title' && n.parent === head), `${file}: title`)));
  const description = one(tags(inner(html, head), 'meta').filter(m => m.name === 'description'), `${file}: description`).content;
  for (const [key, value] of Object.entries({ title, description, h1: plain(inner(html, h1)) })) {
    assert.ok(value?.trim(), `${file}: nonempty ${key}`);
    assert.ok(!unique[key].has(value), `${file}: distinct ${key} across new guides`);
    unique[key].add(value);
    assert.doesNotMatch(value, residentialOffer, `${file}: no residential service positioning`);
  }
  const canonical = one(tags(inner(html, head), 'link').filter(l => l.rel === 'canonical'), `${file}: canonical`);
  assert.equal(canonical.href, url, `${file}: self canonical`);
  const robots = one(tags(inner(html, head), 'meta').filter(m => m.name === 'robots'), `${file}: robots`).content;
  assert.match(robots, /(?:^|,)\s*index(?:,|$)/i, `${file}: indexable`);
  assert.match(robots, /(?:^|,)\s*follow(?:,|$)/i, `${file}: follow links`);
  assert.doesNotMatch(robots, /noindex|nofollow|none/i);
  assert.equal(one(tags(html, 'meta').filter(m => m.property === 'og:url'), `${file}: OG URL`).content, url);

  const ids = nodes.filter(n => 'id' in n.attrs).map(n => n.attrs.id);
  assert.equal(new Set(ids).size, ids.length, `${file}: unique HTML IDs`);
  const sections = descendants(nodes, body).filter(n => n.tag === 'section');
  assert.ok(sections.some(n => n.attrs.id !== 'faq'), `${file}: real explanatory sections`);
  for (const section of sections) {
    const children = descendants(nodes, section);
    assert.ok(children.some(n => n.tag === 'h2' && plain(inner(html, n))), `${file}: section heading`);
    assert.ok(children.some(n => n.tag === 'p' && plain(inner(html, n))), `${file}: static section prose`);
  }
  const text = plain(inner(html, article));
  assert.doesNotMatch(text, /lorem ipsum|TODO|내용 준비 중|본문 준비 중/i, `${file}: no placeholder article`);
  const meaningful = content.filter(n => /^(?:h[1-6]|p|li|summary)$/.test(n.tag));
  const protectedNodes = new Set();
  for (const node of meaningful) {
    for (let current = node; current; current = current.parent) {
      protectedNodes.add(current);
      assert.ok(!('hidden' in current.attrs) && current.attrs['aria-hidden'] !== 'true', `${file}: visible ${node.tag} content`);
      assert.ok(!['template', 'noscript'].includes(current.tag), `${file}: content is standard static HTML`);
      assert.doesNotMatch(current.attrs.style ?? '', hiddenStyle, `${file}: no inline-hidden prose`);
      assert.ok(!(current.attrs.class ?? '').split(/\s+/).some(c => /^(?:hidden|sr-only|visually-hidden)$/.test(c)), `${file}: no hidden-only prose`);
    }
  }
  // Catch direct shared/inline CSS hiding of article text; rendering remains a separate QA step.
  const cssSources = nodes.filter(n => n.tag === 'style').map(n => inner(html, n));
  for (const link of tags(html, 'link').filter(l => l.rel === 'stylesheet')) {
    const cssUrl = new URL(link.href, url);
    if (cssUrl.origin === origin) cssSources.push(read(decodeURIComponent(cssUrl.pathname).slice(1)));
  }
  for (const css of cssSources) for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!hiddenStyle.test(rule[2])) continue;
    for (const node of protectedNodes) {
      const tokens = [node.tag, ...(node.attrs.id ? [`#${node.attrs.id}`] : []), ...(node.attrs.class ?? '').split(/\s+/).filter(Boolean).map(c => `.${c}`)];
      for (const token of tokens) {
        const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        assert.ok(!new RegExp(`(?:^|[\\s,>+~])${escaped}(?=$|[\\s,.#:\\[>+~])`).test(rule[1]), `${file}: CSS must not hide ${token} article content`);
      }
    }
  }

  const links = nodes.filter(n => n.tag === 'a');
  const destinations = links.map(link => {
    const target = checkTarget(link.attrs.href, url, `${file}: ${link.attrs.href}`);
    assert.ok(target.origin !== origin || !archivedResidential.test(target.pathname), `${file}: no archived residential promotion`);
    assert.doesNotMatch(plain(inner(html, link)), residentialOffer, `${file}: no residential service link`);
    return target.href;
  });
  for (const target of ['index.html#weco-about', 'index.html#contact']) {
    assert.ok(destinations.includes(`${origin}/${target}`), `${file}: company introduction and inquiry routes`);
  }
  assert.ok(destinations.includes('https://mpmarketing.co.kr/'), `${file}: external marketing destination`);
  for (const node of nodes) {
    for (const attr of ['src', 'poster']) if (node.attrs[attr]) checkTarget(node.attrs[attr], url, `${file}: ${attr}`, false);
    if (node.attrs.srcset) for (const candidate of node.attrs.srcset.split(',')) checkTarget(candidate.trim().split(/\s+/)[0], url, `${file}: srcset`, false);
    if (node.tag === 'link' && node.attrs.href) checkTarget(node.attrs.href, url, `${file}: resource link`, false);
    if (node.tag === 'img') assert.ok('alt' in node.attrs, `${file}: image alternative text attribute`);
  }

  const data = nodes.filter(n => n.tag === 'script' && n.attrs.type === 'application/ld+json').flatMap(n => {
    const value = JSON.parse(inner(html, n));
    assert.ok(value && typeof value === 'object', `${file}: JSON-LD object`);
    return schemaNodes(value);
  });
  const articleData = one(data.filter(n => isType(n, 'Article')), `${file}: Article schema`);
  assert.equal(articleData.mainEntityOfPage?.['@id'] ?? articleData.mainEntityOfPage, url);
  assert.equal(articleData.datePublished, publicationDate, `${file}: publication date`);
  assert.match(articleData.dateModified, /^\d{4}-\d{2}-\d{2}$/, `${file}: modification date`);
  assert.ok(articleData.dateModified >= articleData.datePublished, `${file}: modification follows publication`);
  assert.equal(articleData.description, description, `${file}: schema description matches metadata`);
  assert.ok(articleData.headline && title.includes(articleData.headline), `${file}: schema headline matches title`);
  assert.equal(articleData.inLanguage, 'ko-KR');
  for (const role of ['author', 'publisher']) assert.equal(articleData[role]?.['@id'], `${origin}/#organization`, `${file}: ${role} organization`);
  assert.ok(content.some(n => n.tag === 'time' && n.attrs.datetime === articleData.dateModified), `${file}: visible current date`);
  const breadcrumbs = one(data.filter(n => isType(n, 'BreadcrumbList')), `${file}: BreadcrumbList schema`).itemListElement;
  assert.ok(Array.isArray(breadcrumbs) && breadcrumbs.length >= 2, `${file}: breadcrumb trail`);
  assert.deepEqual(breadcrumbs.map(n => n.position), breadcrumbs.map((_, i) => i + 1), `${file}: sequential breadcrumb positions`);
  assert.equal(breadcrumbs.at(-1).item?.['@id'] ?? breadcrumbs.at(-1).item, url, `${file}: breadcrumb current page`);
  assert.equal(breadcrumbs[0].item?.['@id'] ?? breadcrumbs[0].item, `${origin}/`, `${file}: breadcrumb home`);
  for (const crumb of breadcrumbs) {
    assert.ok(crumb.name?.trim() && isType(crumb, 'ListItem'), `${file}: named breadcrumb item`);
    checkTarget(crumb.item?.['@id'] ?? crumb.item, url, `${file}: breadcrumb target`);
  }

  const faq = one(content.filter(n => n.attrs.id === 'faq'), `${file}: visible FAQ section`);
  const questions = descendants(nodes, faq).filter(n => n.tag === 'details').map(detail => {
    const children = descendants(nodes, detail);
    const summary = one(children.filter(n => n.tag === 'summary'), `${file}: FAQ question`);
    const answer = plain(html.slice(summary.after, detail.end));
    assert.ok(plain(inner(html, summary)) && answer, `${file}: real FAQ question and answer`);
    assert.ok(children.some(n => n.tag === 'p'), `${file}: FAQ answer is static prose`);
    return [plain(inner(html, summary)), answer];
  });
  assert.ok(questions.length >= 4, `${file}: at least four visible FAQs`);
  assert.equal(new Set(questions.map(([question]) => question)).size, questions.length, `${file}: distinct FAQ questions`);
  const faqSchemas = data.filter(n => isType(n, 'FAQPage'));
  if (faqSchemas.length) {
    const schema = one(faqSchemas, `${file}: optional FAQPage schema`);
    assert.deepEqual(schema.mainEntity.map(n => [plain(n.name), plain(n.acceptedAnswer.text)]), questions, `${file}: schema FAQs match visible copy`);
  }

  const schemaImages = [].concat(articleData.image ?? []).map(img => typeof img === 'string' ? img : img.url ?? img.contentUrl);
  assert.ok(schemaImages.length, `${file}: article image reference`);
  const metaImages = tags(html, 'meta').filter(m => m.property === 'og:image' || m.name === 'twitter:image').map(m => m.content);
  assert.ok(metaImages.length, `${file}: social image reference`);
  for (const image of [...schemaImages, ...metaImages]) {
    assert.equal(new URL(image, url).origin, origin, `${file}: locally verifiable editorial image`);
    checkTarget(image, url, `${file}: image exists`, false);
  }

  assert.ok(hubLinks.includes(url), `${file}: insights discovery link`);
  assert.ok(llmsUrls.includes(url), `${file}: llms discovery link`);
  const sitemap = one(sitemapEntries.filter(entry => xmlValue(entry, 'loc') === url), `${file}: sitemap registration`);
  assert.equal(xmlValue(sitemap, 'lastmod'), articleData.dateModified, `${file}: sitemap date matches article`);
  const item = one(rssItems.filter(entry => xmlValue(entry, 'guid') === url), `${file}: RSS registration`);
  assert.equal(xmlValue(item, 'link'), url, `${file}: RSS canonical link`);
  // Summary-only RSS is valid. If a full article is included, it must not drift from the page.
  assert.ok(plain(xmlValue(item, 'title')), `${file}: RSS headline`);
  assert.ok(plain(xmlValue(item, 'description')), `${file}: RSS description`);
  const pubDate = new Date(xmlValue(item, 'pubDate'));
  assert.ok(Number.isFinite(pubDate.getTime()), `${file}: valid RSS publication date`);
  assert.equal(new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(pubDate), articleData.datePublished, `${file}: RSS Korean publication day`);
  const encoded = item.match(/<content:encoded>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/content:encoded>/)?.[1];
  if (/<content:encoded\b/.test(item)) {
    assert.ok(encoded, `${file}: valid RSS full article block`);
    assert.equal(plain(encoded), text, `${file}: RSS and visible article agree`);
  }
  console.log(`PASS: ${file} — metadata, semantic article, ${questions.length} FAQs, links, assets and discovery feeds.`);
}
console.log(`PASS: ${files.length} distinct brand/place guides; ${internalTargets} local references checked. No network requests or file changes.`);
