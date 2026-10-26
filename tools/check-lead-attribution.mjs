// Offline regression: no real lead submission and no analytics network traffic.
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import vm from 'node:vm';
const root = new URL('../', import.meta.url);
const read = name => readFileSync(new URL(name, root), 'utf8');
const code = read('lead-attribution.js');
const memory = () => { const values = new Map(); return {getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value)}; };
function browser({session = memory(), local = memory(), blocked = false} = {}) {
  let clock = Date.parse('2026-10-27T00:00:00Z');
  const listeners = {};
  return {
    session, local,
    advance: ms => { clock += ms; },
    page(path, referrer = '') {
      const location = new URL(path, 'https://wecocompany.com');
      const window = {addEventListener: (name, callback) => { listeners[name] = callback; }};
      for (const [key, value] of [['sessionStorage', session], ['localStorage', local]]) {
        Object.defineProperty(window, key, {get() { if (blocked) throw new Error('Storage denied'); return value; }});
      }
      class Clock extends Date { static now() { return clock; } }
      vm.runInNewContext(code, {window, location, document: {referrer}, URL, URLSearchParams, Date: Clock});
      return window.WECO_JOURNEY;
    }
  };
}

const search = browser();
search.page('/gyeongju-interior-space-branding.html', 'https://m.search.naver.com/search.naver?query=private-search');
search.advance(20000);
search.page('/bar-startup-interior-guide.html', 'https://wecocompany.com/gyeongju-interior-space-branding.html');
search.advance(109000);
const inquiry = search.page('/index.html#contact', 'https://wecocompany.com/bar-startup-interior-guide.html');
const context = inquiry.context();
assert.match(context.first_touch, /^naver \/ organic/);
assert.match(context.last_touch, /^naver \/ organic/);
assert.equal(context.first_landing, '/gyeongju-interior-space-branding.html');
assert.equal(context.session_landing, '/gyeongju-interior-space-branding.html');
assert.equal(context.pages_viewed, '/gyeongju-interior-space-branding.html → /bar-startup-interior-guide.html → /index.html');
assert.equal(context.time_to_lead, '129초');
assert.equal(context.source_evidence, 'external_referrer');
assert.doesNotMatch(JSON.stringify(context), /private-search|wecocompany.com \/ referral/);
console.log('PASS: NAVER → regional page → bar guide → inquiry preserves the real entry and elapsed journey');

const ad = browser();
ad.page('/bar-startup-interior-guide.html?utm_source=meta&utm_medium=paid_social&utm_campaign=region-a&utm_content=video-2&fbclid=fixture-click', 'https://l.instagram.com/');
const adInquiry = ad.page('/index.html#contact', 'https://wecocompany.com/bar-startup-interior-guide.html');
assert.equal(adInquiry.context().campaign, 'region-a');
assert.equal(adInquiry.context().content, 'video-2');
assert.equal(adInquiry.context().click_id, 'fixture-click');
assert.doesNotMatch(JSON.stringify(adInquiry.analytics()), /fixture-click|click_id|fbclid/);
assert.doesNotMatch(ad.session.getItem('weco_attribution'), /fixture-click/);
ad.advance(1000);
const newAd = ad.page('/?utm_source=google&utm_medium=cpc&utm_campaign=second', 'https://www.google.com/');
assert.equal(newAd.context().campaign, 'second');
assert.equal(newAd.context().content, 'unknown');
assert.equal(newAd.context().click_id, 'unknown');
assert.match(newAd.context().first_touch, /^meta \/ paid_social/);
assert.match(newAd.context().last_touch, /^google \/ cpc/);
console.log('PASS: UTM/ad creative survives internal navigation; new campaigns do not inherit old creative or click IDs');

const legacy = memory();
legacy.setItem('weco_attribution', JSON.stringify({traffic_source:'wecocompany.com',traffic_medium:'referral'}));
legacy.setItem('weco_journey_v2', '{broken');
const missing = browser({session: legacy}).page('/index.html', 'https://wecocompany.com/bar-startup-interior-guide.html');
assert.equal(missing.analytics().traffic_source, 'unknown');
assert.equal(missing.context().source_evidence, 'internal_entry_missing_source');
assert.equal(browser().page('/').analytics().traffic_source, 'direct');
assert.equal(browser().page('/?fbclid=shared-link').analytics().traffic_medium, 'social');
assert.equal(browser().page('/?gclid=search-ad').analytics().traffic_medium, 'cpc');
assert.equal(browser().page('/', 'https://m.blog.naver.com/a').analytics().traffic_medium, 'referral');
assert.equal(browser().page('/', 'https://chatgpt.com/').analytics().traffic_medium, 'ai-assistant');
console.log('PASS: internal/legacy referrals remain unknown; search, social, blog, AI and direct are distinguished');

const denied = browser({blocked: true}).page('/index.html', 'https://m.search.naver.com/');
assert.match(denied.context().last_touch, /^naver \/ organic/);
assert.equal(denied.analytics().traffic_source, 'naver');
const sensitive = browser().page('/?utm_source=person@example.com&utm_term=010-1234-5678&email=person@example.com', 'https://m.search.naver.com/?query=person@example.com');
assert.doesNotMatch(JSON.stringify(sensitive.context()), /example.com|010-1234|query=/);
assert.doesNotMatch(JSON.stringify(sensitive.analytics()), /example.com|010-1234/);
console.log('PASS: storage denial/corrupt records do not throw; free-text URL queries and accidental PII are omitted');

const expiring = browser();
expiring.page('/first.html', 'https://m.search.naver.com/');
expiring.advance(31 * 60 * 1000);
const fresh = expiring.page('/second.html');
assert.equal(fresh.context().session_landing, '/second.html');
assert.equal(fresh.context().pages_viewed, '/second.html');
assert.match(fresh.context().first_touch, /^naver/);
expiring.advance(31 * 24 * 60 * 60 * 1000);
assert.match(expiring.page('/third.html', 'https://www.google.com/').context().first_touch, /^google/);
console.log('PASS: inactive sessions reset at 30 minutes; first-touch retention expires after 30 days');

const sitemap = [...read('sitemap.xml').matchAll(/<loc>(.*?)<\/loc>/g)].map(m => new URL(m[1]).pathname);
const tracked = [...readdirSync(root).filter(f => f.endsWith('.html')).map(f => f), 'brand-discovery/index.html']
  .filter(file => /insight-tracking\.js|analytics-init\.js|G-45Q0B2B2XR/.test(read(file)));
for (const path of sitemap) {
  const file = path.endsWith('/') ? path.slice(1) + 'index.html' : path.slice(1);
  assert.ok(tracked.includes(file), file + ': public entry covered');
}
for (const file of tracked) {
  const html = read(file);
  assert.equal((html.match(/lead-attribution\.js\?v=1/g) || []).length, 1, file);
  const trackerAt = html.indexOf('lead-attribution.js?v=1');
  for (const marker of ['insight-tracking.js', 'analytics-init.js', 'G-45Q0B2B2XR']) {
    if (html.includes(marker)) assert.ok(trackerAt < html.indexOf(marker), file + ': capture before other tracking');
  }
  assert.ok(html.indexOf('charset') < 1024, file + ': charset remains early');
  const src = html.match(/src="([^"]*lead-attribution\.js\?v=1)"/)[1];
  assert.doesNotThrow(() => readFileSync(new URL(src.split('?')[0], new URL(file, root))), file + ': relative script resolves');
}
const main = read('main.js');
assert.doesNotMatch(main, /const SESSION_STARTED_AT|rememberLeadJourney|const inferredSource/);
assert.ok(main.includes('window.WECO_JOURNEY?.context()'));
for (const field of ['이번방문시작페이지','유입판단근거','외부유입참조']) assert.ok(main.includes(field + ': leadContext.'));
assert.ok(read('insight-tracking.js').includes('window.WECO_JOURNEY.analytics()'));
console.log('PASS: all ' + tracked.length + ' tracked HTML entries (including all sitemap URLs) load shared capture before analytics; email uses its context');

// Execute the production context + submit handler together against a local transport stub.
let handler, payload;
const events = [];
const form = {
  name: {value: 'Offline Fixture'}, phone: {value: '01000000000'}, budget: {value: ''}, message: {value: 'Offline inquiry'},
  addEventListener: (_, callback) => { handler = callback; }, setAttribute() {}, removeAttribute() {}, reset() {}
};
const submitBtn = {disabled: false, classList: {add() {}, remove() {}}, querySelector: () => ({textContent: '문의 보내기'})};
const sandbox = {
  form, submitBtn, window: {WECO_JOURNEY: inquiry},
  sessionStorage: {getItem() { throw new Error('Storage denied'); }},
  location: new URL('https://wecocompany.com/index.html'), navigator: {platform: 'fixture'}, innerWidth: 390,
  inquiryTracking: {attempt() {}, params: () => ({attempt_number: 1})},
  typeCards: null, selectedType: '', inquiryContext: null, inquiryEventParams: () => ({}),
  INQUIRY_ENDPOINT: 'mock-only', FORM_MSG: {ok: 'ok', err: 'err'}, setStatus() {}, applyInquiryContext() {},
  document: {documentElement: {lang: 'ko'}}, trackEvent: (name, params) => events.push({name, params}),
  fetch: async (endpoint, options) => {
    assert.equal(endpoint, 'mock-only'); payload = JSON.parse(options.body);
    return {ok: true, json: async () => ({success: true})};
  }, AbortController, setTimeout, clearTimeout, console: {error() {}}
};
vm.runInNewContext(main.slice(main.indexOf('const getLeadContext ='), main.indexOf('const trackEvent =')), sandbox);
vm.runInNewContext(main.slice(main.indexOf("form.addEventListener('submit'"), main.indexOf('// Keep mobile keyboard')), sandbox);
await handler({preventDefault() {}});
assert.equal(payload.이번방문시작페이지, '/gyeongju-interior-space-branding.html');
assert.match(payload.최초유입, /^naver \/ organic/);
assert.equal(payload.유입판단근거, 'external_referrer');
assert.equal(payload.상담전본페이지, context.pages_viewed);
assert.equal(payload.상담전체류시간, '129초');
assert.equal(events.filter(item => item.name === 'generate_lead').length, 1);
assert.doesNotMatch(JSON.stringify(events), /01000000000|Offline Fixture|Offline inquiry/);
console.log('PASS: real submit handler includes the entry/journey in the email payload and succeeds with blocked storage; no live email or personal data sent to analytics');
