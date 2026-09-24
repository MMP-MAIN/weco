import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { INQUIRY_GUIDES, getInquiryContext, applyInquiryContext, inquiryEventParams } from '../inquiry-context.mjs';

const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const home = read('index.html');
const main = read('main.js');
for (const [id, guide] of Object.entries(INQUIRY_GUIDES)) {
  const html = read(guide.page);
  const links = [...html.matchAll(/href="(index\.html\?inquiry=[^"]+)"/g)];
  assert.equal(links.length, 2, `${guide.page}: header and final CTA`);
  for (const [, href] of links) {
    const url = new URL(href, 'https://wecocompany.com/');
    assert.equal(url.hash, '#contact');
    assert.equal(getInquiryContext(url.search).id, id);
    assert.equal(url.searchParams.has('utm_source'), false, 'internal links must not overwrite acquisition');
  }
  const elements = {
    inquiryContextNote: { textContent: '', hidden: true },
    inquiryMessage: { value: '이미 작성한 고객 문의', placeholder: '' },
    inquiryTopic: { value: '' }, inquiryGuide: { value: '' }
  };
  const doc = { getElementById: key => elements[key] };
  const context = applyInquiryContext(doc, `?inquiry=${id}`);
  assert.equal(elements.inquiryMessage.value, '이미 작성한 고객 문의');
  assert.equal(elements.inquiryMessage.placeholder, guide.placeholder);
  assert.equal(elements.inquiryContextNote.hidden, false);
  assert.equal(elements.inquiryTopic.value, guide.topic);
  assert.equal(elements.inquiryGuide.value, `https://wecocompany.com/${guide.page}`);
  assert.deepEqual(inquiryEventParams(context), { inquiry_topic: id, inquiry_guide: guide.page });
}
for (const search of ['', '?inquiry=unknown', '?inquiry=__proto__', '?inquiry=constructor', '?inquiry=%3Cscript%3E']) {
  assert.equal(getInquiryContext(search), null, search);
  assert.equal(applyInquiryContext({ getElementById: () => null }, search), null);
}
assert.deepEqual(inquiryEventParams(null), {});
assert.match(home, /id="inquiryContextNote" hidden/);
assert.doesNotMatch(home, /name="(?:message|budget|상담주제|상담연결글)"[^>]*required/);
assert.match(home, /rel="canonical" href="https:\/\/wecocompany.com\/"/);

// Execute the actual submit handler with mocked transport: never send a test lead.
const submitCode = main.slice(main.indexOf("form.addEventListener('submit'"), main.indexOf('// Keep mobile keyboard'));
assert.ok(submitCode.length > 1000);
for (const outcome of ['success', 'failure', 'network', 'timeout', 'whitespace', 'busy']) {
  let handler, payload, resetCount = 0;
  const events = [];
  const form = {
    name: { value: outcome === 'whitespace' ? '   ' : '테스트 이름' }, phone: { value: '01000000000' },
    message: { value: '고객이 직접 쓴 문의' }, budget: { value: '' },
    addEventListener: (_, fn) => { handler = fn; }, setAttribute() {}, removeAttribute() {},
    reset() { resetCount++; }
  };
  const label = { textContent: '문의 보내기' };
  const submitBtn = { disabled: outcome === 'busy', classList: { add() {}, remove() {} }, querySelector: () => label };
  const context = getInquiryContext('?inquiry=cafe-startup');
  const sandbox = {
    form, submitBtn, inquiryContext: context, inquiryEventParams, selectedType: '', typeCards: null,
    inquiryTracking: { attempt() {}, validationError() {}, params: () => ({ attempt_number: 1 }) },
    FORM_MSG: { need: 'need', ok: 'ok', err: 'err' }, INQUIRY_ENDPOINT: 'mock-only',
    getLeadContext: () => ({ first_touch: 'naver / organic' }),
    fetch: async (_, opts) => {
      payload = JSON.parse(opts.body);
      if (outcome === 'network') throw new TypeError('network unavailable');
      if (outcome === 'timeout') throw Object.assign(new Error('timeout'), { name: 'AbortError' });
      return { ok: outcome === 'success', json: async () => ({ success: outcome === 'success' }) };
    },
    trackEvent: (name, params) => events.push({ name, params }), setStatus() {},
    applyInquiryContext() {}, document: { documentElement: { lang: 'ko' } }, location: { search: '' },
    AbortController, setTimeout, clearTimeout, console: { error() {} }
  };
  vm.runInNewContext(submitCode, sandbox);
  await handler({ preventDefault() {} });
  if (outcome === 'whitespace' || outcome === 'busy') {
    assert.equal(payload, undefined, `${outcome}: no request sent`);
    assert.equal(resetCount, 0);
    assert.equal(events.some(e => e.name === 'generate_lead'), false);
    continue;
  }
  assert.equal(payload.문의내용, '고객이 직접 쓴 문의');
  assert.equal(payload.상담주제, context.topic);
  assert.equal(payload.상담연결글, 'https://wecocompany.com/cafe-startup-interior.html');
  assert.equal(payload.최초유입, 'naver / organic');
  assert.equal(submitBtn.disabled, false);
  assert.equal(label.textContent, '문의 보내기');
  assert.equal(resetCount, outcome === 'success' ? 1 : 0);
  assert.equal(events.some(e => e.name === 'generate_lead'), outcome === 'success');
  if (outcome === 'success') assert.equal(events[0].params.inquiry_topic, 'cafe-startup');
  else {
    assert.equal(events[0].name, 'form_submit_error');
    assert.equal(events[0].params.error_type, outcome === 'timeout' ? 'timeout' : outcome === 'network' ? 'network_error' : 'response_error');
    assert.equal(form.message.value, '고객이 직접 쓴 문의', 'retain message on failed submission');
  }
  assert.ok(!JSON.stringify(events).includes('01000000000'), 'no phone in analytics');
  assert.ok(!JSON.stringify(events).includes('고객이 직접 쓴 문의'), 'no message in analytics');
}
console.log('PASS: 9 contextual guide routes, safe URL allowlist, preserved input/attribution, submit success/failure and analytics privacy (mocked, no email sent).');
