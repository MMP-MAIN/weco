import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const html = read('../brand-discovery/index.html');
const script = read('../brand-discovery/assets/discovery-entry.js');
const bundle = read('../brand-discovery/assets/index-DqdqLdJ6.js');

assert.match(html, /href="\/index\.html#contact">간단히 문의하기/);
assert.match(html, /9단계 · 약 15–20분/);
assert.match(html, /<div id="root" hidden><\/div>/);
assert.match(html, /<noscript><p class="discovery-fallback">/);
assert.doesNotMatch(html, /무료|SEOUL/);
assert.doesNotMatch(script, /(?:localStorage|sessionStorage|window\.fetch|innerHTML|replaceChildren)/);
assert.ok(html.indexOf('client-email-delivery.js') < html.indexOf('index-DqdqLdJ6.js'));
assert.match(html, /progressive-discovery\.js\?v=2/);

let sync;
let timeout;
let state = 'home';
let starts = 0;
let focusCount = 0;
let step = '01 / 09';
const heading = { setAttribute() {}, focus() { focusCount++; }, scrollIntoView() {} };
const legacyStart = { click() { starts++; state = 'survey'; } };
const survey = { querySelector(selector) { return selector === '.step-number' ? { textContent: step } : heading; } };
const complete = { querySelector() { return heading; } };
const entry = { hidden: false };
const start = {
  disabled: true,
  addEventListener(type, callback) { assert.equal(type, 'click'); this.click = callback; },
  focus() { this.focused = true; },
};
const status = { textContent: '' };
const originalText = [
  '무료 1차 진단으로 브랜드의 가능성과 다음 행동을 정리해보세요.',
  '무료 1차 진단 결과를 확인할 정보를 남겨주세요.',
  '입력한 답을 바탕으로 즉시 정리한 무료 1차 진단입니다. 점수는 답변의 완성도와 근거 수준을 나타내며 사업 성공률을 의미하지 않습니다.',
  'SEOUL · KOREA',
  '← 분석 종료',
  '전화번호 *',
];
for (const text of originalText) assert.ok(bundle.includes(text), `Legacy text changed: ${text}`);
const textNodes = originalText.map((nodeValue) => ({ nodeValue }));
const root = {
  hidden: true,
  querySelector(selector) {
    if (selector === '.hero button.primary') return state === 'home' ? legacyStart : null;
    if (selector === '.survey-layout') return state === 'survey' ? survey : null;
    if (selector === '.complete') return state === 'complete' ? complete : null;
    throw new Error(`Unexpected selector: ${selector}`);
  },
};
const elements = { 'discovery-entry': entry, root, 'discovery-detail-start': start, 'discovery-detail-status': status };
vm.runInNewContext(script, {
  document: {
    getElementById(id) { return elements[id]; },
    createTreeWalker(target) { assert.equal(target, root); let i = 0; return { nextNode: () => textNodes[i++] }; },
  },
  NodeFilter: { SHOW_TEXT: 4 },
  MutationObserver: class { constructor(callback) { sync = callback; } observe(target, options) { assert.equal(target, root); assert.equal(options.characterData, true); } },
  window: { setTimeout(callback) { timeout = callback; } },
});

assert.equal(start.disabled, false);
assert.equal(root.hidden, true);
assert.equal(entry.hidden, false);
assert.ok(textNodes.every((node) => !/무료|SEOUL/.test(node.nodeValue)));
assert.equal(textNodes.at(-1).nodeValue, '전화번호 *');
start.click();
start.click(); // A second fast click must not double-count discovery_start.
assert.equal(starts, 1);
sync();
assert.equal(root.hidden, false);
assert.equal(entry.hidden, true);
assert.equal(focusCount, 1);
sync(); // Typing or enhancement mutations must not move keyboard focus.
assert.equal(focusCount, 1);
step = '02 / 09';
sync();
assert.equal(focusCount, 2);
state = 'complete';
sync();
assert.equal(root.hidden, false);
assert.equal(focusCount, 3);
state = 'home';
sync();
assert.equal(root.hidden, true);
assert.equal(entry.hidden, false);
assert.equal(start.focused, true);
assert.equal(start.disabled, false);
start.disabled = true;
timeout();
assert.match(status.textContent, /간단히 문의하기/);

console.log('Discovery entry checks passed: metadata, fallback, original start, view transitions, stable typing focus, legacy copy and transport isolation.');
