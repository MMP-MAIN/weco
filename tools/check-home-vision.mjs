import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const html = read('index.html');
const main = read('main.js');
const studio = read('studio-refresh.js');
const start = main.indexOf(';(() => {');
const end = main.indexOf('// ---- 인트로 리빌 종료 ----', start);
assert.ok(start >= 0 && end > start, 'The production introduction handler must exist.');
const introduction = main.slice(start, end);
const hero = html.match(/<section class="hero">([\s\S]*?)<\/section>/)?.[1];
assert.ok(hero, 'The homepage hero must exist.');
assert.match(hero, /사업과 브랜드, 공간의 다음 가능성을 기획합니다\./);
assert.match(hero, /브랜드를 키우고,<br\s*\/>장소의 가치를 새롭게\./);
assert.doesNotMatch(hero, /수익\s*보장|부동산\s*가격\s*상승/);
assert.match(hero, /data-studio-display aria-hidden="true"/);
assert.match(hero, /href="#contact"[^>]*data-conversion="project_inquiry"/);
assert.match(hero, /data-open-projects/);
assert.match(hero, /href="https:\/\/open\.kakao\.com\/o\/sBasXuKi"/);

function storage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)) };
}

function randomAt(value) {
  const math = Object.create(Math);
  math.random = () => value;
  return math;
}

// Execute production selection with a small DOM; no network, analytics, images or form submissions.
function korean({ isStudio = true, previous = -1, random = 0, term = '' } = {}) {
  const headline = { innerHTML: 'initial headline' };
  const promise = { innerHTML: 'initial promise' };
  const cta = { innerHTML: '상담 문의 <span>↗</span>', href: '#contact' };
  const session = storage({ wecoHeroVariant: String(previous) });
  const body = { classList: { contains: name => isStudio && name === 'studio-home' }, dataset: {} };
  const document = {
    body, referrer: '',
    getElementById: id => id === 'heroHeadline' ? headline : null,
    querySelector: selector => selector === '.hero-promise' ? promise
      : selector === '.hero-actions [data-conversion="project_inquiry"]' ? cta : null
  };
  const window = {};
  vm.runInNewContext(introduction, {
    document, window, sessionStorage: session, localStorage: storage(),
    URLSearchParams, location: { search: term ? `?utm_term=${encodeURIComponent(term)}` : '' },
    Math: randomAt(random)
  }, { timeout: 1000 });
  return { headline: headline.innerHTML, promise: promise.innerHTML, cta, body, window,
    selected: Number(session.getItem('wecoHeroVariant')) };
}

const original = [
  ['아이디어에 방향을,<br><strong>브랜드에 선택의 이유를.</strong>', '사업의 방향부터 브랜드·디자인·공간까지.'],
  ['무엇을 만들지보다,<br><strong>왜 필요한지부터.</strong>', '고객이 선택할 이유부터 정합니다.'],
  ['흩어진 생각을,<br><strong>하나의 브랜드로.</strong>', '기획과 디자인에 하나의 기준을 세웁니다.'],
  ['브랜드의 시작부터,<br><strong>다음 단계까지.</strong>', '창업과 리뉴얼의 다음 단계를 함께합니다.'],
  ['좋아 보이는 것을 넘어,<br><strong>이유가 있는 브랜드로.</strong>', '전략을 디자인과 고객 경험으로 연결합니다.']
];
const studioHeadlines = new Set();
for (let index = 0; index < 5; index += 1) {
  const random = (index + 0.5) / 5;
  const legacy = korean({ isStudio: false, random });
  assert.deepEqual([legacy.headline, legacy.promise], original[index], 'Other page styles retain their existing introduction.');
  const home = korean({ random });
  studioHeadlines.add(home.headline);
  assert.match(`${home.headline} ${home.promise}`, /브랜드|장소|공간|찾아/);
  assert.doesNotMatch(`${home.headline} ${home.promise}`, /수익\s*보장|부동산\s*가격\s*상승/);
  assert.equal(home.cta.innerHTML, '상담 문의 <span>↗</span>', 'General visits keep the main inquiry action.');
  assert.equal(home.cta.href, '#contact');
  assert.equal(home.body.dataset.landingSegment, 'general');
}
assert.equal(studioHeadlines.size, 5, 'All five homepage introductions remain reachable.');
assert.notDeepEqual([...studioHeadlines], original.map(([headline]) => headline), 'Studio pages receive the new vision; other pages do not.');
for (const isStudio of [true, false]) {
  for (let previous = 0; previous < 5; previous += 1) {
    for (const random of [0, 0.999]) {
      assert.notEqual(korean({ isStudio, previous, random }).selected, previous, 'A repeat visit must not select the immediately previous introduction.');
    }
  }
}

const industries = [
  ['salon', '미용실', '미용실의 감각을,<br><strong>다시 찾는 브랜드로.</strong>', '취향을 담은 공간과 브랜드를 만듭니다.', '미용실 프로젝트 문의하기'],
  ['clinic', '병원', '신뢰가 필요한 공간을,<br><strong>선택받는 의료 브랜드로.</strong>', '신뢰를 전하는 브랜드와 공간을 만듭니다.', '의료 공간 프로젝트 문의하기'],
  ['office', '사무실', '일하는 공간을,<br><strong>조직의 브랜드 경험으로.</strong>', '일하는 방식을 공간에 담습니다.', '오피스 프로젝트 문의하기'],
  ['cafe', '카페', '카페의 취향을,<br><strong>목적지가 되는 브랜드로.</strong>', '카페의 취향을 브랜드와 공간에 담습니다.', '카페 프로젝트 문의하기'],
  ['fnb', '식당', '식당의 가능성을,<br><strong>다시 찾는 브랜드로.</strong>', '상권과 메뉴, 운영에 맞는 방향을 잡습니다.', '식당 프로젝트 문의하기'],
  ['interior', '상가인테리어', '상가 공간을,<br><strong>선택받는 브랜드 경험으로.</strong>', '사업에 맞는 브랜드와 공간을 설계합니다.', '상가 인테리어 문의하기']
];
for (const isStudio of [true, false]) {
  for (const [segment, term, headline, promise, cta] of industries) {
    const result = korean({ isStudio, term });
    assert.deepEqual([result.headline, result.promise, result.cta.innerHTML], [headline, promise, `${cta} <span>↗</span>`], `${segment}: retain the industry-specific message and CTA.`);
    assert.equal(result.cta.href, '#contact');
    assert.equal(result.body.dataset.landingSegment, segment);
  }
}

function english({ previous = -1, random = 0, isStudio = true, reduced = true } = {}) {
  const verb = { textContent: 'initial' }, noun = { textContent: 'initial' };
  const session = storage({ wecoStudioPhrase: String(previous) });
  let intervals = 0;
  const document = {
    hidden: false,
    body: { classList: { contains: name => isStudio && name === 'studio-home' } },
    querySelector: selector => ({
      '[data-studio-display]': { classList: { remove() {} } },
      '[data-studio-verb]': verb, '[data-studio-noun]': noun
    })[selector] ?? null,
    getElementById: () => null,
    addEventListener() {}
  };
  const window = {
    matchMedia: () => ({ matches: reduced, addEventListener() {} }),
    addEventListener() {}, setInterval: () => { intervals += 1; return intervals; }
  };
  vm.runInNewContext(studio, { document, window, sessionStorage: session, Math: randomAt(random), clearInterval() {}, clearTimeout() {} }, { timeout: 1000 });
  return { text: `${verb.textContent} ${noun.textContent}`, selected: Number(session.getItem('wecoStudioPhrase')), intervals };
}

const phrases = ['Growing Brands.', 'Reimagining Places.', 'Creating Value.'];
for (let index = 0; index < phrases.length; index += 1) {
  const result = english({ random: (index + 0.5) / phrases.length });
  assert.equal(result.text, phrases[index]);
  assert.equal(result.intervals, 0, 'Reduced-motion visitors receive a static phrase.');
  for (const random of [0, 0.999]) {
    assert.notEqual(english({ previous: index, random }).selected, index, 'The first English phrase changes between visits.');
  }
}
assert.equal(english({ reduced: false }).intervals, 1, 'Regular visitors retain the phrase animation.');
assert.deepEqual(english({ isStudio: false }), { text: 'initial initial', selected: -1, intervals: 0 }, 'Studio motion does not affect other pages.');

console.log('PASS: homepage vision, both introduction sets, repeat-visit variety, six industry CTAs, English phrases and reduced-motion behavior.');
