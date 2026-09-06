// Homepage-only studio motion and accessible full-screen navigation.
(() => {
  if (!document.body.classList.contains('studio-home')) return;
  const display = document.querySelector('[data-studio-display]');
  const verb = document.querySelector('[data-studio-verb]');
  const noun = document.querySelector('[data-studio-noun]');
  const control = document.querySelector('[data-studio-motion]');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const phrases = [['Redefining', 'Brands.'], ['Reimagining', 'Business.'], ['Connecting', 'Experiences.']];
  let current = 0, paused = false, visible = true, timer = 0, swapTimer = 0;
  // Change the first English message on each visit as well as the Korean introduction.
  try {
    const previous = Number(sessionStorage.getItem('wecoStudioPhrase') ?? -1);
    const candidates = phrases.map((_, index) => index).filter(index => index !== previous);
    current = candidates[Math.floor(Math.random() * candidates.length)];
    sessionStorage.setItem('wecoStudioPhrase', String(current));
  } catch (_) { current = 0; }
  if (verb && noun) [verb.textContent, noun.textContent] = phrases[current];
  function stop() {
    clearInterval(timer); clearTimeout(swapTimer);
    timer = 0; swapTimer = 0;
    display?.classList.remove('is-changing');
  }
  function mayRun() {
    return !paused && !motion.matches && visible && !document.hidden &&
      !document.body.classList.contains('menu-open') &&
      !document.querySelector('.project-view.open,.gallery-view.open,.lightbox.open');
  }
  function start() {
    stop();
    if (!display || !verb || !noun || !mayRun()) return;
    timer = window.setInterval(() => {
      if (!mayRun()) return;
      display.classList.add('is-changing');
      swapTimer = window.setTimeout(() => {
        current = (current + 1) % phrases.length;
        verb.textContent = phrases[current][0];
        noun.textContent = phrases[current][1];
        display.classList.remove('is-changing');
      }, 350);
    }, 4400);
  }
  function syncControl() {
    if (!control) return;
    control.hidden = motion.matches;
    control.setAttribute('aria-pressed', String(paused));
    control.textContent = paused ? '움직임 재생 ▷' : '움직임 멈춤 Ⅱ';
  }
  control?.addEventListener('click', () => { paused = !paused; syncControl(); start(); });
  motion.addEventListener('change', () => { syncControl(); start(); });
  document.addEventListener('visibilitychange', start);
  if ('IntersectionObserver' in window && display) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      start();
    }).observe(display);
  }
  window.addEventListener('pagehide', stop);
  window.addEventListener('pageshow', start);
  syncControl(); start();

  const menu = document.getElementById('gnb');
  const toggle = document.getElementById('menuToggle');
  if (!menu || !toggle) return;
  // A gallery or menu may close without a scroll; resume only when the hero is visible.
  new MutationObserver(records => {
    if (!records.some(record => record.target === menu ||
      record.target.matches('.project-view,.gallery-view,.lightbox'))) return;
    const menuOpen = menu.classList.contains('open');
    document.documentElement.classList.toggle('studio-menu-open', menuOpen);
    if (menuOpen) window.__lenis?.stop();
    else if (!document.querySelector('.project-view.open,.gallery-view.open,.lightbox.open')) window.__lenis?.start();
    start();
  }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });
  // Resume before an anchor's own smooth-scroll handler runs.
  menu.addEventListener('click', event => {
    if (event.target.closest('a[href]')) window.__lenis?.start();
  }, true);
  menu.querySelectorAll('a[href]').forEach(link => link.addEventListener('click', () => {
    const href = link.getAttribute('href');
    requestAnimationFrame(() => {
      if (href === '#scope' || href === '#contact') document.querySelector(href)?.focus({ preventScroll: true });
      else if (link.target === '_blank') toggle.focus();
    });
  }));
  toggle.addEventListener('click', () => {
    requestAnimationFrame(() => {
      if (menu.classList.contains('open')) menu.querySelector('a')?.focus();
      start();
    });
  });
  document.addEventListener('keydown', event => {
    if (!menu.classList.contains('open')) return;
    if (event.key === 'Escape') {
      event.preventDefault(); toggle.click(); toggle.focus(); return;
    }
    if (event.key !== 'Tab') return;
    const links = [...menu.querySelectorAll('a[href]')];
    const first = links[0], last = links[links.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); toggle.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); toggle.focus();
    } else if (document.activeElement === toggle) {
      event.preventDefault(); (event.shiftKey ? last : first)?.focus();
    }
  });
})();
