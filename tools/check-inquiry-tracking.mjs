import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createInquiryTracking } from '../inquiry-tracking.mjs';

const handlers = {};
const controls = Object.fromEntries(['name', 'phone', 'message', 'budget', 'privacyConsent'].map(name => [name, { name, value: '', validity: {} }]));
const form = {
  elements: { namedItem: name => controls[name] },
  addEventListener: (name, callback) => { handlers[name] = callback; }
};
const events = [];
const tracking = createInquiryTracking(form, (event, params) => events.push({ event, params }), { form_name: 'project_inquiry' });
const fire = (event, name) => handlers[event]?.({ target: controls[name] });
assert.equal(handlers.focusin, undefined, 'focus alone is not actual input');
fire('input', 'name');
controls.name.value = '   ';
fire('input', 'name');
assert.equal(events.length, 0, 'empty or whitespace values do not count');
controls.name.value = '비공개 고객 이름';
fire('input', 'name');
fire('change', 'name');
controls.message.value = '비공개 상담 내용';
fire('input', 'message');
assert.equal(events.filter(x => x.event === 'inquiry_input_start').length, 1);

// A single submit can fail several required fields. It remains ONE attempt.
controls.phone.validity = { valueMissing: true };
controls.privacyConsent.validity = { valueMissing: true };
fire('invalid', 'phone');
fire('invalid', 'privacyConsent');
fire('invalid', 'phone');
assert.equal(events.filter(x => x.event === 'inquiry_submit_attempt').length, 1);
assert.equal(events.filter(x => x.event === 'inquiry_validation_error').length, 2);
assert.equal(tracking.params().attempt_number, 1);
await Promise.resolve();
controls.phone.value = '01012345678';
tracking.attempt();
assert.equal(events.filter(x => x.event === 'inquiry_submit_attempt').length, 2);
assert.equal(tracking.params().attempt_number, 2);
await Promise.resolve();
tracking.validationError('비공개 고객 이름', '비공개 상담 내용');
assert.equal(events.at(-1).params.field_name, 'other');
assert.equal(events.at(-1).params.error_type, 'invalid');
assert.doesNotMatch(JSON.stringify(events), /비공개|01012345678/);

handlers.reset();
for (const control of Object.values(controls)) control.value = '';
controls.phone.value = '01012345678'; // Autofill/change path after reset.
fire('change', 'phone');
assert.equal(events.filter(x => x.event === 'inquiry_input_start').length, 2);
assert.doesNotThrow(() => {
  const tracker = createInquiryTracking(form, () => { throw new Error('blocked analytics'); });
  tracker.attempt();
});

const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const css = read('studio-refresh.css');
const html = read('index.html');
assert.match(css, /#stickyBar \.sb-call\{background:#f7f7f5/);
assert.doesNotMatch(css, /#stickyBar \.sb-consult\{background:#f7f7f5/);
assert.match(css, /grid-template-columns:1\.3fr 1fr 1fr/);
assert.match(css, /\.inquiry-visible/);
assert.match(css, /#contact\{padding:24px 0 40px!important/);
assert.match(css, /\.composer textarea\{height:96px;min-height:96px/);
assert.match(html, /class="sb-call" data-conversion="project_inquiry">상담 문의/);
assert.match(html, /autocomplete="name" required/);
assert.match(html, /autocomplete="tel" inputmode="tel" required/);
assert.match(read('main.js'), /offset: href === '#contact' \? -88 : -40/);
console.log('PASS: input vs focus, autofill, native invalid fields, attempts/retries, deduplication, safe payloads, analytics failure isolation and mobile CTA rules. No live request sent.');
