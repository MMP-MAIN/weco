import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

// Exercise the production route handlers without loading images, analytics, or submitting forms.
const source = readFileSync(new URL('../main.js', import.meta.url), 'utf8')
const controls = source.slice(source.indexOf('const updateProjectLocation ='), source.indexOf("closeProjectsButton?.addEventListener('click', closeProjects)"))
const closeLayers = source.slice(source.indexOf('  const closeLB ='), source.indexOf('  const openGallery ='))
  + source.slice(source.indexOf('  const closeGallery ='), source.indexOf("  if (document.querySelector('[data-project-inquiry]'))"))
const routing = source.slice(source.indexOf('  const syncProjectLocation ='), source.indexOf('  syncProjectLocation()') + '  syncProjectLocation()'.length)
assert.ok(controls && closeLayers && routing, 'Production project route handlers must exist')

class Element {
  constructor() {
    this.classes = new Set()
    this.classList = {
      add: (...names) => names.forEach(name => this.classes.add(name)),
      remove: (...names) => names.forEach(name => this.classes.delete(name)),
      contains: name => this.classes.has(name)
    }
    this.style = {}
    this.attributes = {}
    this.focusCount = 0
    this.scrollCount = 0
  }
  setAttribute(name, value) { this.attributes[name] = value }
  querySelectorAll() { return [] }
  focus() { this.focusCount += 1 }
  scrollIntoView() { this.scrollCount += 1 }
}

function fixture(href) {
  let current = new URL(href)
  const listeners = {}
  const writes = []
  const actions = []
  const contact = new Element()
  const trigger = new Element()
  const projectView = new Element()
  const gv = new Element()
  const lb = new Element()
  const document = {
    documentElement: Object.assign(new Element(), { lang: 'ko' }),
    body: new Element(),
    activeElement: trigger,
    getElementById: id => id === 'contact' ? contact : null
  }
  const window = {
    get location() { return current },
    addEventListener: (name, handler) => { listeners[name] = handler }
  }
  const history = { state: { preserved: true } }
  for (const method of ['replaceState', 'pushState']) {
    history[method] = (state, title, url) => {
      assert.equal(state, history.state, 'Keep unrelated history state')
      writes.push({ method, url: String(url) })
      current = new URL(url)
    }
  }
  const context = vm.createContext({
    URL, URLSearchParams, HTMLElement: Element, window, history, document,
    projectView, projectToggle: new Element(), closeProjectsButton: new Element(),
    projectTrigger: null, galleryTrigger: trigger, lightboxTrigger: trigger,
    gv, lb, curItem: 0, items: [{}, {}, {}],
    trackEvent: name => actions.push(name),
    shuffleProjectCards: () => actions.push('shuffle'),
    setMenuOpen: () => {},
    openGallery: (index, syncUrl) => {
      actions.push(['openGallery', index, syncUrl])
      context.curItem = index
      gv.classList.add('open')
    }
  })
  vm.runInContext(`${controls}\n${closeLayers}\n${routing}`, context)
  return {
    context, contact, trigger, projectView, gv, lb, document, writes, actions,
    get url() { return current },
    run: code => vm.runInContext(code, context),
    navigate: (url, event = 'popstate') => {
      current = new URL(url, current)
      listeners[event]()
    }
  }
}

// This is the broken link used by project detail pages.
const detailReturn = fixture('https://wecocompany.com/index.html#portfolio')
assert.ok(detailReturn.projectView.classList.contains('open'))
assert.equal(detailReturn.projectView.attributes['aria-hidden'], 'false')
assert.equal(detailReturn.document.body.style.overflow, 'hidden')
assert.equal(detailReturn.writes.length, 0, 'Initial link must not rewrite history')

const numbered = fixture('https://wecocompany.com/index.html?utm_source=naver&portfolio=2')
assert.ok(numbered.projectView.classList.contains('open'))
assert.deepEqual(numbered.actions.find(action => Array.isArray(action)), ['openGallery', 1, false])
assert.equal(numbered.writes.length, 0)
numbered.lb.classList.add('open')
numbered.navigate('?utm_source=naver&portfolio=3#portfolio')
assert.equal(numbered.context.curItem, 2)
assert.ok(!numbered.lb.classList.contains('open'), 'Changing projects closes the old photo')
numbered.navigate('?utm_source=naver#portfolio')
assert.ok(numbered.projectView.classList.contains('open'))
assert.ok(!numbered.gv.classList.contains('open'))
const focusBeforeClose = numbered.trigger.focusCount
numbered.navigate('?utm_source=naver')
assert.ok(!numbered.projectView.classList.contains('open'))
assert.equal(numbered.document.body.style.overflow, '')
assert.equal(numbered.trigger.focusCount, focusBeforeClose + 1)
numbered.navigate('?utm_source=naver#portfolio')
assert.ok(numbered.projectView.classList.contains('open'), 'Forward restores the project list')
const shuffleCount = numbered.actions.filter(action => action === 'shuffle').length
numbered.navigate('?utm_source=naver#portfolio', 'hashchange')
assert.equal(numbered.actions.filter(action => action === 'shuffle').length, shuffleCount, 'Paired popstate/hashchange must not reset the open list')
assert.equal(numbered.writes.length, 0, 'Restoring history must not create more entries')

numbered.navigate('?utm_source=naver&portfolio=3#portfolio')
numbered.lb.classList.add('open')
numbered.navigate('?utm_source=naver#contact', 'hashchange')
assert.ok(!numbered.projectView.classList.contains('open'))
assert.ok(!numbered.gv.classList.contains('open'))
assert.ok(!numbered.lb.classList.contains('open'))
assert.equal(numbered.contact.focusCount, 1)
assert.equal(numbered.contact.scrollCount, 1)
assert.equal(numbered.document.documentElement.style.overflow, '')

for (const value of ['0', '-1', '1.5', '99', 'not-a-number']) {
  const invalid = fixture(`https://wecocompany.com/index.html?portfolio=${value}`)
  assert.ok(!invalid.projectView.classList.contains('open'), `Invalid gallery ${value} stays closed`)
  invalid.navigate(`#portfolio`, 'hashchange')
  assert.ok(invalid.projectView.classList.contains('open'), 'List hash remains usable with an invalid gallery index')
  assert.ok(!invalid.gv.classList.contains('open'))
}

const interactions = fixture('https://wecocompany.com/index.html?utm_source=naver#about')
interactions.run('openProjects()')
assert.equal(interactions.url.hash, '#portfolio')
assert.equal(interactions.url.searchParams.get('utm_source'), 'naver')
assert.equal(interactions.writes[0].method, 'pushState')
interactions.run("updateProjectLocation(1, '#portfolio')")
assert.equal(interactions.url.searchParams.get('portfolio'), '2')
interactions.gv.classList.add('open')
interactions.lb.classList.add('open')
interactions.run('closeGallery()')
assert.equal(interactions.url.hash, '#portfolio')
assert.equal(interactions.url.searchParams.has('portfolio'), false)
assert.ok(!interactions.gv.classList.contains('open'))
assert.ok(!interactions.lb.classList.contains('open'))
assert.equal(interactions.document.body.style.overflow, 'hidden')
interactions.run('closeProjects()')
assert.equal(interactions.url.hash, '')
assert.equal(interactions.url.searchParams.has('portfolio'), false)
assert.equal(interactions.writes.at(-1).method, 'replaceState')
assert.ok(!interactions.projectView.classList.contains('open'))
interactions.run("updateProjectLocation(null, '#contact')")
assert.equal(interactions.url.hash, '#contact')
assert.equal(interactions.url.searchParams.get('utm_source'), 'naver')

console.log('Project routing passed: detail return, numbered links, hash changes, back/forward, nested overlays, inquiry focus, invalid indices, and URL preservation.')
