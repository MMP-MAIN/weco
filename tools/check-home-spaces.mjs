import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { initResidentialTabs } from '../home-spaces.mjs';
import { getInquiryContext } from '../inquiry-context.mjs';

const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const html = read('index.html');
const gallery = html.match(/<section class="home-residential"[\s\S]*?<\/section>/)?.[0];
assert.ok(gallery);
assert.equal((html.match(/<h1\b/g) || []).length, 1, 'One visible primary heading.');
assert.equal((gallery.match(/role="tab" /g) || []).length, 5);
assert.equal((gallery.match(/role="tabpanel"/g) || []).length, 5);
assert.equal((gallery.match(/ tabindex="0" hidden/g) || []).length, 4);
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(ids.length, new Set(ids).size, 'New sections do not duplicate existing IDs.');
assert.ok(html.indexOf('id="companyHeadline"') < html.indexOf('id="scope"'), 'Company identity precedes service details.');
assert.ok(html.indexOf('id="scope"') < html.indexOf('id="company-case"'), 'Services precede their project evidence.');
assert.ok(html.indexOf('id="company-case"') < html.indexOf('id="company-spaces"'), 'A verified case precedes spatial service selection.');
assert.ok(html.indexOf('id="company-spaces"') < html.indexOf('id="studioWork"'));
assert.ok(html.indexOf('id="studioWork"') < html.indexOf('id="residential-design"'));
assert.ok(html.indexOf('id="residential-design"') < html.indexOf('id="weco-about"'));
for (const match of gallery.matchAll(/href="(index\.html\?inquiry=[^"]+)"/g)) {
  const url = new URL(match[1], 'https://wecocompany.com/');
  assert.ok(getInquiryContext(url.search), 'Consultation goes to an existing recognized topic.');
  assert.equal(url.hash, '#contact');
  assert.equal(url.searchParams.has('utm_source'), false, 'Internal navigation preserves acquisition.');
}
for (const match of html.matchAll(/(?:src|href)="((?:images\/residential-design\/|home-spaces\.)[^"?]+)(?:\?[^\"]*)?"/g)) {
  const path = new URL(`../${match[1]}`, import.meta.url);
  assert.ok(existsSync(path), match[1]);
  if (match[1].endsWith('.webp')) assert.ok(statSync(path).size < 100000, 'Responsive images stay below 100 KB.');
}

// Exercise the production tab controller with real events, without browsers or requests.
let focused = null;
const panels = Array.from({ length: 5 }, () => ({ hidden: false }));
const tabs = panels.map((_, index) => ({
  attrs: { 'aria-controls': `panel-${index}`, 'aria-selected': String(index === 1) },
  events: {},
  getAttribute(name) { return this.attrs[name]; },
  setAttribute(name, value) { this.attrs[name] = value; },
  addEventListener(name, handler) { this.events[name] = handler; },
  focus() { focused = index; }
}));
const root = {
  querySelector: () => ({ querySelectorAll: () => tabs }),
  getElementById: id => panels[Number(id.split('-')[1])]
};
initResidentialTabs(root);
const check = selected => {
  tabs.forEach((tab, index) => {
    assert.equal(tab.attrs['aria-selected'], String(index === selected));
    assert.equal(tab.tabIndex, index === selected ? 0 : -1);
    assert.equal(panels[index].hidden, index !== selected);
  });
};
check(1);
tabs.forEach((tab, index) => { tab.events.click(); check(index); });
for (const [from, key, expected] of [[4, 'ArrowRight', 0], [0, 'ArrowLeft', 4], [2, 'Home', 0], [1, 'End', 4]]) {
  let prevented = false;
  tabs[from].events.keydown({ key, preventDefault() { prevented = true; } });
  assert.ok(prevented); check(expected); assert.equal(focused, expected);
}
tabs[4].events.keydown({ key: 'Tab', preventDefault() { assert.fail('Native tab navigation is retained.'); } });
initResidentialTabs({ querySelector: () => null });
console.log('PASS: five residential styles, click and keyboard selection, one selected panel, recognized consultation contexts, responsive assets and existing page anchors.');
