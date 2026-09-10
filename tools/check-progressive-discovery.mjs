import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const script = readFileSync(new URL('../brand-discovery/assets/progressive-discovery.js', import.meta.url), 'utf8');
function classList() {
  const values = new Set();
  return {
    add: (value) => values.add(value),
    remove: (value) => values.delete(value),
    contains: (value) => values.has(value),
    toggle(value, force) { const next = force ?? !values.has(value); next ? values.add(value) : values.delete(value); return next; },
  };
}
function field(text, isRequired = false) {
  const label = { textContent: text };
  return {
    label, classList: classList(), required: isRequired,
    querySelector(selector) {
      return selector === ':scope > span' ? label : selector === '[required]' && this.required ? {} : null;
    },
  };
}
let step = '01 / 09';
let observer;
let writes = 0;
let insertions = 0;
const initialOptional = field('브랜드 소개');
const initialRequired = field('브랜드명 *');
const panel = {
  dataset: {}, classList: classList(), fields: [initialRequired, initialOptional], buttons: [],
  querySelectorAll(selector) { assert.equal(selector, '.field'); return this.fields; },
  querySelector(selector) { assert.equal(selector, '.form-footer'); return footer; },
  contains(button) { return this.buttons.includes(button); },
};
const footer = {
  before(button) {
    insertions++;
    panel.buttons = panel.buttons.filter((item) => item !== button);
    panel.buttons.push(button);
  },
};
vm.runInNewContext(script, {
  document: {
    readyState: 'complete', documentElement: {},
    querySelector(selector) { return selector === '.form-panel' ? panel : { textContent: step }; },
    createElement(tag) {
      assert.equal(tag, 'button');
      return {
        attributes: {}, value: '',
        set textContent(value) { writes++; this.value = value; },
        get textContent() { return this.value; },
        addEventListener(type, callback) { assert.equal(type, 'click'); this.click = callback; },
        setAttribute(key, value) { this.attributes[key] = value; },
        remove() { panel.buttons = panel.buttons.filter((button) => button !== this); },
      };
    },
  },
  MutationObserver: class { constructor(callback) { observer = callback; } observe() {} },
});

assert.equal(panel.buttons.length, 1);
const firstToggle = panel.buttons[0];
assert.match(firstToggle.textContent, /선택 질문 1개/);
assert.equal(initialRequired.classList.contains('weco-optional-field'), false);
assert.equal(initialOptional.classList.contains('weco-optional-field'), true);
firstToggle.click();
assert.equal(firstToggle.attributes['aria-expanded'], 'true');
const beforeTyping = { writes, insertions };
observer();
observer(); // Input/option mutations must not recreate the toggle or reset its state.
assert.deepEqual({ writes, insertions }, beforeTyping);
assert.equal(panel.buttons[0], firstToggle);
assert.equal(panel.classList.contains('weco-show-optionals'), true);

const conditional = field('참고 사이트');
panel.fields.push(conditional);
observer();
assert.equal(panel.buttons[0], firstToggle);
assert.equal(firstToggle.attributes['aria-expanded'], 'true');
assert.equal(conditional.classList.contains('weco-optional-field'), true);
firstToggle.click();
assert.match(firstToggle.textContent, /선택 질문 2개/);

// The same React panel and a reused field node now represent the next step.
step = '02 / 09';
initialOptional.label.textContent = '고객의 변화 *';
panel.fields = [initialOptional, field('희망 사항'), field('결과 이메일', true)];
observer();
assert.equal(panel.buttons.length, 1);
assert.notEqual(panel.buttons[0], firstToggle);
assert.match(panel.buttons[0].textContent, /선택 질문 1개/);
assert.equal(panel.buttons[0].attributes['aria-expanded'], 'false');
assert.equal(panel.classList.contains('weco-show-optionals'), false);
assert.equal(initialOptional.classList.contains('weco-optional-field'), false);
assert.equal(panel.fields[2].classList.contains('weco-optional-field'), false);

// Late-mounted required email and a detached owned toggle can both be reconciled.
panel.fields.push(field('추가 정보'));
observer();
const secondToggle = panel.buttons[0];
assert.match(secondToggle.textContent, /선택 질문 2개/);
panel.buttons = [];
observer();
assert.equal(panel.buttons[0], secondToggle);

step = '03 / 09';
const formerOptional = panel.fields[1];
panel.fields = [field('대표 상품 *')];
observer();
assert.equal(panel.buttons.length, 0);
assert.equal(formerOptional.classList.contains('weco-optional-field'), false);
assert.equal(panel.fields.length, 1); // React-owned fields are never removed.

console.log('Progressive discovery checks passed: reused panels/fields, conditional questions, required email, stable open state, typing, detached toggle and required-only steps.');
