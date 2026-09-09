#!/usr/bin/env node
// Read-only checks for the first organic/AI search content increment.
// These checks do not assert search-engine indexing, rankings or AI citations.
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve, sep } from 'node:path';

const args = process.argv.slice(2);
const rootFlag = args.indexOf('--root');
const rootArg = rootFlag >= 0 ? args[rootFlag + 1] : args.find((arg) => !arg.startsWith('--'));
if (!rootArg || (rootFlag >= 0 && rootArg.startsWith('--')) || args.includes('--help')) {
  console.log('Usage: node check-organic-ai.mjs --root /path/to/site');
  console.log('   or: node check-organic-ai.mjs /path/to/site');
  process.exit(args.includes('--help') ? 0 : 2);
}
const root = resolve(rootArg);
const origin = 'https://wecocompany.com';
const guideFile = 'brand-consulting-guide.html';
const guideUrl = `${origin}/${guideFile}`;
const companyId = `${origin}/#organization`;
const read = (file) => readFileSync(resolve(root, file), 'utf8');
const failures = [];
let passed = 0;

function check(label, fn) {
  try {
    fn();
    passed += 1;
    console.log(`PASS: ${label}`);
  } catch (error) {
    failures.push(label);
    console.error(`FAIL: ${label}\n  ${error.message}`);
  }
}

function decode(value = '') {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', middot: '·', hellip: '…' };
  return String(value).replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (whole, code) => {
    if (code[0] !== '#') return named[code.toLowerCase()] ?? whole;
    const num = /^#x/i.test(code) ? parseInt(code.slice(2), 16) : Number(code.slice(1));
    return Number.isInteger(num) && num >= 0 && num <= 0x10ffff ? String.fromCodePoint(num) : whole;
  });
}
function text(html = '') {
  return decode(String(html).replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ').trim();
}
function attrs(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)]
    .map((m) => [m[1].toLowerCase(), decode(m[2] ?? m[3] ?? m[4])]));
}
function tags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map((m) => attrs(m[0]));
}
function jsonLd(html) {
  const result = [];
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (attrs(match[1]).type !== 'application/ld+json') continue;
    const parsed = JSON.parse(match[2]);
    for (const item of Array.isArray(parsed) ? parsed : [parsed]) result.push(...(item['@graph'] || [item]));
  }
  return result;
}
const isType = (item, type) => [item?.['@type']].flat().includes(type);
function pagePath(url) {
  const pathname = decodeURIComponent(url.pathname);
  let path = resolve(root, `.${pathname}`);
  assert.ok(path === root || path.startsWith(`${root}${sep}`), `path outside site root: ${url}`);
  if (existsSync(path) && statSync(path).isDirectory()) path = resolve(path, 'index.html');
  return path;
}
function internalHrefs(html, from) {
  return [...html.matchAll(/<[a-z][\w:-]*\b[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')[^>]*>/gi)]
    .map((m) => new URL(decode(m[1] ?? m[2]), from))
    .filter((url) => url.origin === origin);
}

let guide = '';
let records = [];
check('new guide exists and structured JSON parses', () => {
  guide = read(guideFile);
  assert.ok(guide.trim(), 'new guide is empty');
  records = jsonLd(guide);
  assert.ok(records.length, 'no JSON-LD records');
});

check('canonical, indexable robots, one non-empty H1', () => {
  const canonicals = tags(guide, 'link').filter((tag) => tag.rel?.split(/\s+/).includes('canonical'));
  assert.equal(canonicals.length, 1, 'exactly one canonical expected');
  assert.equal(canonicals[0].href, guideUrl);
  const robots = tags(guide, 'meta').filter((tag) => tag.name?.toLowerCase() === 'robots');
  assert.equal(robots.length, 1, 'exactly one robots meta expected');
  assert.doesNotMatch(robots[0].content || '', /(?:^|[,\s])(?:noindex|none)(?:$|[,\s])/i);
  assert.match(robots[0].content || '', /(?:^|[,\s])index(?:$|[,\s])/i);
  const h1 = [...guide.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
  assert.equal(h1.length, 1, 'exactly one H1 expected');
  assert.ok(text(h1[0][1]), 'H1 is empty');
});

check('Article, BreadcrumbList and FAQPage describe the published guide', () => {
  const articles = records.filter((item) => isType(item, 'Article'));
  const breadcrumbs = records.filter((item) => isType(item, 'BreadcrumbList'));
  const faqs = records.filter((item) => isType(item, 'FAQPage'));
  assert.equal(articles.length, 1, 'exactly one Article expected');
  assert.equal(breadcrumbs.length, 1, 'exactly one BreadcrumbList expected');
  assert.equal(faqs.length, 1, 'exactly one FAQPage expected');
  const article = articles[0];
  assert.ok(article.headline, 'Article headline missing');
  const page = article.mainEntityOfPage;
  assert.equal(typeof page === 'string' ? page : page?.['@id'] || page?.url, guideUrl, 'Article mainEntityOfPage');
  assert.match(article.datePublished || '', /^\d{4}-\d{2}-\d{2}(?:T.*)?$/, 'Article datePublished');
  assert.match(article.dateModified || '', /^\d{4}-\d{2}-\d{2}(?:T.*)?$/, 'Article dateModified');
  const crumbs = breadcrumbs[0].itemListElement;
  assert.ok(Array.isArray(crumbs) && crumbs.length >= 2, 'breadcrumb trail missing');
  crumbs.forEach((crumb, index) => assert.equal(crumb.position, index + 1, 'breadcrumb positions'));
  const last = crumbs.at(-1).item;
  assert.equal(typeof last === 'string' ? last : last?.['@id'] || last?.url, guideUrl, 'breadcrumb final URL');
});

check('FAQ structured questions and answers match visible details exactly', () => {
  const faq = records.find((item) => isType(item, 'FAQPage'));
  assert.ok(Array.isArray(faq?.mainEntity) && faq.mainEntity.length > 0, 'FAQ questions missing');
  const visible = [...guide.matchAll(/<details\b[^>]*>([\s\S]*?)<\/details>/gi)].map((match) => {
    const summary = match[1].match(/<summary\b[^>]*>([\s\S]*?)<\/summary>/i);
    assert.ok(summary, 'details without summary');
    return { question: text(summary[1]), answer: text(match[1].replace(summary[0], '')) };
  });
  assert.equal(visible.length, faq.mainEntity.length, 'visible and structured FAQ counts differ');
  const byQuestion = new Map(visible.map((row) => [row.question, row.answer]));
  assert.equal(byQuestion.size, visible.length, 'duplicate visible FAQ questions');
  const structuredQuestions = new Set();
  for (const row of faq.mainEntity) {
    assert.ok(isType(row, 'Question'), 'FAQ mainEntity must contain Question');
    const question = text(row.name);
    assert.ok(!structuredQuestions.has(question), `duplicate structured FAQ: ${question}`);
    structuredQuestions.add(question);
    assert.ok(byQuestion.has(question), `structured question not visible: ${question}`);
    const answers = [row.acceptedAnswer].flat().filter(Boolean);
    assert.equal(answers.length, 1, `one accepted answer expected: ${question}`);
    assert.ok(isType(answers[0], 'Answer'), `acceptedAnswer type: ${question}`);
    assert.equal(text(answers[0].text), byQuestion.get(question), `answer mismatch: ${question}`);
    assert.ok(byQuestion.get(question), `empty answer: ${question}`);
  }
});

check('new guide internal href files and fragments resolve', () => {
  const links = internalHrefs(guide, guideUrl);
  assert.ok(links.length > 0, 'no internal links');
  for (const url of links) {
    const target = pagePath(url);
    assert.ok(existsSync(target) && statSync(target).isFile(), `missing internal target: ${url}`);
    if (!url.hash) continue;
    const hash = decodeURIComponent(url.hash.slice(1));
    assert.notEqual(hash, 'portfolio', `new guide must not use legacy portfolio hash: ${url}`);
    const targetHtml = readFileSync(target, 'utf8');
    const targets = [...targetHtml.matchAll(/<[a-z][\w:-]*\b[^>]*>/gi)].map((m) => attrs(m[0]));
    assert.ok(targets.some((tag) => tag.id === hash || tag.name === hash), `missing fragment: ${url}`);
  }
});

check('company author and publisher use the shared official @id', () => {
  const article = records.find((item) => isType(item, 'Article'));
  assert.ok(article, 'Article missing');
  for (const role of ['author', 'publisher']) {
    const refs = [article[role]].flat().filter(Boolean);
    assert.ok(refs.length, `Article ${role} missing`);
    for (const ref of refs) assert.equal(ref['@id'], companyId, `Article ${role} @id`);
  }
  const mainOrg = jsonLd(read('index.html')).find((item) => isType(item, 'ProfessionalService') || isType(item, 'Organization'));
  assert.equal(mainOrg?.['@id'], companyId, 'homepage company @id');
  const walk = (item) => {
    if (!item || typeof item !== 'object') return;
    if (isType(item, 'Organization') || isType(item, 'ProfessionalService')) {
      assert.equal(item['@id'], companyId, 'guide organization @id');
    }
    for (const child of Object.values(item)) {
      if (Array.isArray(child)) child.forEach(walk);
      else if (child && typeof child === 'object') walk(child);
    }
  };
  records.forEach(walk);
});

for (const file of ['index.html', 'insights.html', 'industry-guides.html', 'brand-renewal-checklist.html', 'fnb-branding-vs-interior.html', 'project-direction-guide.html']) {
  check(`visible new-guide link from ${file}`, () => {
    const html = read(file);
    const links = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)];
    assert.ok(links.some((match) => {
      const href = attrs(match[1]).href;
      return href && new URL(href, `${origin}/${file}`).href.split('#')[0] === guideUrl && text(match[2]);
    }), `no named anchor to ${guideUrl}`);
  });
}

check('RSS contains one new guide item with a full-text content:encoded body', () => {
  const rss = read('rss.xml');
  assert.match(rss, /xmlns:content\s*=\s*["']http:\/\/purl\.org\/rss\/1\.0\/modules\/content\/["']/);
  const matches = [...rss.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map((m) => m[1])
    .filter((item) => decode(item.match(/<guid\b[^>]*>([\s\S]*?)<\/guid>/i)?.[1]?.trim()) === guideUrl);
  assert.equal(matches.length, 1, 'exactly one matching RSS guid expected');
  assert.equal(decode(matches[0].match(/<link\b[^>]*>([\s\S]*?)<\/link>/i)?.[1]?.trim()), guideUrl);
  const encoded = matches[0].match(/<content:encoded\b[^>]*>([\s\S]*?)<\/content:encoded>/i)?.[1];
  assert.ok(encoded, 'new item has no content:encoded');
  const body = decode(encoded.trim().replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, '$1'));
  assert.ok(text(body).length >= 100, 'content:encoded must contain a substantive body, not just a title/link');
});

check('sitemap contains the new canonical URL once and has no duplicate URLs', () => {
  const urls = [...read('sitemap.xml').matchAll(/<loc\b[^>]*>([\s\S]*?)<\/loc>/gi)].map((m) => decode(m[1].trim()));
  assert.equal(urls.length, new Set(urls).size, 'duplicate sitemap URLs');
  assert.equal(urls.filter((url) => url === guideUrl).length, 1, 'new guide canonical missing or duplicated');
});

check('llms guide links to the new canonical URL', () => {
  const urls = [...read('llms.txt').matchAll(/https?:\/\/[^\s<>\])]+/g)].map((m) => m[0]);
  assert.ok(urls.includes(guideUrl), `llms.txt does not link to ${guideUrl}`);
});


for (const file of ['brand-consulting-guide.html', 'brand-renewal-checklist.html', 'project-direction-guide.html', 'bar-startup-interior-guide.html', 'restaurant-marketing-guide.html', 'fnb-branding-vs-interior.html']) {
  check(`${file}: canonical, FAQ parity, references and complete RSS`, () => {
    const html = read(file), url = origin + '/' + file;
    assert.equal(tags(html, 'link').find(t => t.rel === 'canonical')?.href, url);
    assert.equal([...html.matchAll(/<h1\b/gi)].length, 1);
    const data = jsonLd(html);
    assert.equal(data.filter(x => isType(x, 'Article')).length, 1);
    assert.equal(data.find(x => isType(x, 'Article')).mainEntityOfPage, url);
    assert.equal(data.find(x => isType(x, 'Article')).datePublished, ['brand-renewal-checklist.html', 'project-direction-guide.html', 'fnb-branding-vs-interior.html'].includes(file) ? '2026-08-22' : '2026-09-07');
    const visible = [...html.matchAll(/<details\b[^>]*>([\s\S]*?)<\/details>/gi)].map(m => {
      const summary = m[1].match(/<summary[^>]*>([\s\S]*?)<\/summary>/i);
      return [text(summary[1]), text(m[1].replace(summary[0], ''))];
    });
    const structured = data.find(x => isType(x, 'FAQPage')).mainEntity.map(x => [text(x.name), text(x.acceptedAnswer.text)]);
    assert.deepEqual(structured, visible);
    assert.ok(visible.length >= (file === 'fnb-branding-vs-interior.html' ? 3 : 6));
    for (const link of internalHrefs(html, url)) {
      assert.ok(existsSync(pagePath(link)), 'missing target: ' + link);
      if (link.hash) assert.ok(readFileSync(pagePath(link), 'utf8').includes('id="' + decodeURIComponent(link.hash.slice(1)) + '"'), 'missing fragment: ' + link);
    }
    const items = [...read('rss.xml').matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/g)].map(m => m[1]).filter(i => i.includes('<guid>' + url + '</guid>'));
    assert.equal(items.length, 1);
    const encoded = items[0].match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/)?.[1];
    assert.ok(encoded, 'full RSS body missing');
    const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)[1];
    assert.equal(text(encoded), text(main.slice(main.indexOf('<article>'), main.lastIndexOf('</article>') + 10)));
    assert.ok(read('sitemap.xml').includes('<loc>' + url + '</loc>'));
    assert.ok(read('llms.txt').includes(url));
  });
}

console.log(`\n${passed} passed; ${failures.length} failed. Read-only content checks; not proof of indexing or AI citation.`);
if (failures.length) process.exitCode = 1;
