import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

// Checks first-party company information, not search ranking or AI citations.
const root = fileURLToPath(new URL('../', import.meta.url));
const origin = 'https://wecocompany.com';
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const pages = ['index.html', 'en.html', 'vi.html', 'industry-guides.html'];
const published = [...pages, 'llms.txt', 'rss.xml', 'sitemap.xml'];
const documents = new Map(published.map((path) => [path, read(path)]));
const structured = (html) => [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
  .map((match) => JSON.parse(match[1]));
const schema = new Map(pages.map((path) => [path, structured(documents.get(path))]));
const organization = (path) => schema.get(path).find((item) => item['@type'] === 'ProfessionalService');

assert.equal(read('CNAME').trim(), 'wecocompany.com');
for (const path of pages) {
  const html = documents.get(path);
  const expected = path === 'index.html' ? `${origin}/` : `${origin}/${path}`;
  assert.equal(html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/)?.[1], expected, `${path}: canonical`);
  assert.ok(html.includes('https://mpmarketing.co.kr/'), `${path}: external marketing link`);
  assert.ok(schema.get(path).length, `${path}: parseable structured information`);
  assert.doesNotMatch(html, /6330-5226|weco\.kr|weco\.co\.kr/, `${path}: obsolete company information`);
}

const primary = organization('index.html');
for (const path of ['index.html', 'en.html', 'vi.html']) {
  const org = organization(path);
  assert.ok(org, `${path}: company record`);
  assert.equal(org['@id'], `${origin}/#organization`, `${path}: company identity`);
  assert.equal(org.url, `${origin}/`, `${path}: official company URL`);
  assert.equal(org.telephone, '+82-10-8606-2119', `${path}: telephone`);
  assert.equal(org.image, `${origin}/images/og-card-v4.jpg`, `${path}: official image`);
  assert.deepEqual(org.address, primary.address, `${path}: address`);
  assert.equal(org.email, primary.email, `${path}: email`);
  assert.deepEqual(org.sameAs, primary.sameAs, `${path}: official profiles`);
  assert.equal(org.hasOfferCatalog.itemListElement.length, 4, `${path}: four WECO service areas`);
  assert.doesNotMatch(JSON.stringify(org.hasOfferCatalog), /marketing|마케팅/i, `${path}: marketing stays external`);
}
for (const path of ['en.html', 'vi.html']) {
  const page = schema.get(path).find((item) => item['@type'] === 'WebPage');
  assert.equal(page?.url, `${origin}/${path}`);
  assert.equal(page?.isPartOf?.['@id'], `${origin}/#website`);
  assert.equal(page?.about?.['@id'], `${origin}/#organization`);
}

const llms = documents.get('llms.txt');
assert.ok(llms.includes(`${origin}/#scope`));
assert.ok(llms.includes('010-8606-2119'));
assert.ok(llms.includes('https://mpmarketing.co.kr/'));
assert.doesNotMatch(llms, /주거|아파트|residential|apartment/, 'company guide must not promote residential services');
for (const match of llms.matchAll(/https:\/\/wecocompany\.com\/([^\s#]*)/g)) {
  const path = match[1] || 'index.html';
  assert.ok(existsSync(resolve(root, decodeURIComponent(path))), `company guide target: ${path}`);
}

const urls = [...documents.get('sitemap.xml').matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
assert.ok(urls.length > 0);
assert.equal(new Set(urls).size, urls.length, 'sitemap URLs must be unique');
for (const url of urls) {
  assert.equal(new URL(url).origin, origin, `sitemap domain: ${url}`);
  const path = decodeURIComponent(new URL(url).pathname).slice(1) || 'index.html';
  assert.ok(existsSync(resolve(root, path)), `sitemap target: ${path}`);
}
for (const match of documents.get('rss.xml').matchAll(/<(?:link|guid)>(.*?)<\/(?:link|guid)>/g)) {
  assert.equal(new URL(match[1]).origin, origin, 'RSS domain');
}
console.log(`PASS: company identity, contact, services and official-domain references (${pages.length} pages; ${urls.length} sitemap URLs).`);

if (process.argv.includes('--live')) {
  await Promise.all(published.map(async (path) => {
    const url = path === 'index.html' ? `${origin}/` : `${origin}/${path}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(20000), redirect: 'error', headers: { 'Cache-Control': 'no-cache' } });
    assert.equal(response.status, 200, `live status: ${url}`);
    assert.equal(await response.text(), documents.get(path), `live content differs: ${url}`);
    console.log(`LIVE MATCH: ${url}`);
  }));
}
