// ===== 위코컴퍼니 홈페이지 스크립트 =====
const PHONE = '010-6330-5226'

// 이미지가 없는 프로젝트는 깨진 썸네일 대신 작업 내용을 텍스트로 표시합니다.
document.addEventListener('error', (event) => {
  const image = event.target
  if (!(image instanceof HTMLImageElement)) return
  const card = image.closest('.proj-card')
  const frame = image.closest('.proj-img')
  if (!card || !frame || frame.classList.contains('missing-photo')) return
  const title = card.querySelector('.proj-meta h3')?.textContent?.trim() || '프로젝트'
  const category = card.querySelector('.proj-meta em')?.textContent?.trim() || 'WECO PROJECT'
  const scope = card.querySelector('.proj-meta p')?.textContent?.trim() || 'BRAND · SPACE · EXPERIENCE'
  frame.classList.add('missing-photo', 'proj-text-only')
  frame.insertAdjacentHTML('beforeend', `<span>${category}</span><strong>${title}</strong><p>${scope}</p>`)
}, true)

// 광고 유입은 소재와 같은 메시지를 유지하고, 일반 방문은 관점을 순환합니다.
;(() => {
  const headline = document.getElementById('heroHeadline')
  const promise = document.querySelector('.hero-promise')
  if (!headline || !promise) return

  const query = new URLSearchParams(location.search)
  let storedAttribution = {}
  try { storedAttribution = JSON.parse(sessionStorage.getItem('weco_attribution') || '{}') } catch (_) {}
  const source = String(query.get('utm_source') || storedAttribution.traffic_source || '').toLowerCase()
  const medium = String(query.get('utm_medium') || storedAttribution.traffic_medium || '').toLowerCase()
  const campaign = String(query.get('utm_campaign') || storedAttribution.campaign_name || '').toLowerCase()
  const isPaidSocial = /^(ig|fb|instagram|facebook|meta)$/.test(source) && /(paid|cpc|ppc|social)/.test(medium)
    || /(meta|instagram|facebook)/.test(campaign) && /(paid|cpc|conversion|traffic|lead)/.test(`${medium} ${campaign}`)

  const variants = [
    {
      headline: '아이디어를,<br><strong>손님이 찾는 브랜드로.</strong>',
      promise: '시장과 고객의 신호를 읽고 브랜드, 공간과 마케팅이<br>하나의 성장 방향으로 움직이게 합니다.'
    },
    {
      headline: '작은 가능성을,<br><strong>오래가는 브랜드로.</strong>',
      promise: '막연한 아이디어 안에서 선택받을 이유를 찾고<br>지속할 수 있는 브랜드의 기준을 세웁니다.'
    },
    {
      headline: '가게를 넘어,<br><strong>기억되는 브랜드로.</strong>',
      promise: '이름과 메뉴, 공간과 서비스가 같은 이야기를 전하도록<br>고객이 기억할 하나의 경험으로 연결합니다.'
    },
    {
      headline: '좋은 공간을,<br><strong>선택받는 경험으로.</strong>',
      promise: '보기 좋은 장면을 넘어 고객의 방문과 재방문으로 이어지는<br>브랜드 경험의 방향을 설계합니다.'
    },
    {
      headline: '막연한 창업을,<br><strong>선명한 브랜드로.</strong>',
      promise: '상권과 고객, 운영 조건을 함께 진단하고<br>지금 먼저 결정할 브랜드의 방향을 분명하게 만듭니다.'
    }
  ]

  let previous = -1
  try { previous = Number(localStorage.getItem('wecoHeroVariant')) } catch (_) {}
  const candidates = variants.map((_, i) => i).filter(i => i !== previous)
  const selected = isPaidSocial ? 4 : (candidates[Math.floor(Math.random() * candidates.length)] ?? 0)
  headline.innerHTML = variants[selected].headline
  promise.innerHTML = variants[selected].promise
  window.WECO_HERO_VARIANT = selected + 1
  window.WECO_LANDING_SEGMENT = isPaidSocial ? 'paid_social' : 'general'
  if (isPaidSocial) {
    const discoveryButton = document.querySelector('.hero-actions [data-conversion="brand_discovery"]')
    if (discoveryButton) discoveryButton.textContent = '무료 브랜드 분석'
    document.body.dataset.landingSegment = 'paid-social'
  }
  try { localStorage.setItem('wecoHeroVariant', String(selected)) } catch (_) {}
})()

// ---- 인트로 리빌 종료 ----
;(() => {
  const intro = document.getElementById('intro')
  if (!intro) return
  const fastEntry = matchMedia('(prefers-reduced-motion: reduce), (max-width: 768px), (pointer: coarse)').matches
  if (fastEntry) {
    intro.remove()
    document.documentElement.classList.add('no-intro'); return
  }
  try {
    if (sessionStorage.getItem('wecoIntroSeen')) {
      intro.remove()
      return
    }
    sessionStorage.setItem('wecoIntroSeen', '1')
  } catch (_) {}
  const close = () => { intro.classList.add('done'); setTimeout(() => intro.remove(), 650) }
  setTimeout(close, 1200)
  intro.addEventListener('click', close)
})()

// ---- 상단바 스크롤 효과 ----
const topbar = document.getElementById('topbar')
window.addEventListener('scroll', () => {
  topbar.classList.toggle('scrolled', window.scrollY > 10)
}, { passive: true })

// ---- 모바일 메뉴 ----
const menuToggle = document.getElementById('menuToggle')
const gnb = document.getElementById('gnb')
const setMenuOpen = (open) => {
  gnb.classList.toggle('open', open)
  menuToggle.setAttribute('aria-expanded', String(open))
  menuToggle.setAttribute('aria-label', open
    ? ({ en: 'Close menu', vi: 'Đóng menu' }[document.documentElement.lang] || '메뉴 닫기')
    : ({ en: 'Open menu', vi: 'Mở menu' }[document.documentElement.lang] || '메뉴 열기'))
  document.body.classList.toggle('menu-open', open)
}
menuToggle.addEventListener('click', () => setMenuOpen(!gnb.classList.contains('open')))
gnb.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenuOpen(false)))

// ---- 히어로 모션 배경 (코드로 만든 흐르는 빛 — 영상 대체) ----
;(() => {
  const cv = document.getElementById('heroCanvas')
  if (!cv || !cv.getContext) return
  const ctx = cv.getContext('2d')
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  let W = 0, H = 0, dpr = 1
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 1.6)
    W = cv.clientWidth; H = cv.clientHeight
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
  resize(); window.addEventListener('resize', resize, { passive: true })

  // 천천히 떠다니는 부드러운 빛 (따뜻한 회백색, 흑백 톤 유지)
  const blobs = [
    { x: .26, y: .34, r: .58, a: .17, sx: .55, sy: .42, p: 0.0 },
    { x: .72, y: .58, r: .62, a: .13, sx: .48, sy: .66, p: 2.1 },
    { x: .52, y: .82, r: .52, a: .10, sx: .74, sy: .33, p: 4.0 },
    { x: .82, y: .20, r: .46, a: .09, sx: .40, sy: .58, p: 1.3 },
    { x: .12, y: .70, r: .44, a: .08, sx: .62, sy: .50, p: 3.2 }
  ]
  const draw = (t) => {
    const base = ctx.createLinearGradient(0, 0, 0, H)
    base.addColorStop(0, '#16130f'); base.addColorStop(1, '#090807')
    ctx.fillStyle = base; ctx.fillRect(0, 0, W, H)
    ctx.globalCompositeOperation = 'lighter'
    const m = Math.max(W, H)
    for (const b of blobs) {
      const cx = (b.x + Math.sin(t * 0.00007 * b.sx + b.p) * 0.13) * W
      const cy = (b.y + Math.cos(t * 0.00007 * b.sy + b.p) * 0.13) * H
      const rad = b.r * m
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad)
      g.addColorStop(0, 'rgba(243,239,230,' + b.a + ')')
      g.addColorStop(0.5, 'rgba(214,205,190,' + (b.a * 0.35) + ')')
      g.addColorStop(1, 'rgba(243,239,230,0)')
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
    }
    ctx.globalCompositeOperation = 'source-over'

    // === 도면 스케치 — 블루프린트 평면도가 펜으로 그려지는 모션 ===
    // 1) 은은한 모눈 그리드 (제도지)
    ctx.lineWidth = 1
    ctx.strokeStyle = 'rgba(243,239,230,0.05)'
    const gs = 44
    for (let gx = (W * 0.5) % gs; gx < W; gx += gs) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke() }
    for (let gy = (H * 0.5) % gs; gy < H; gy += gs) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke() }

    // 2) 아이소메트릭 3D 룸 (방 골조 + 가구) — 천천히 회전
    const ISO = 0.5, ISC = 0.866
    const u = Math.min(W * 0.045, H * 0.072)
    const Wd = 6.4, Dp = 5.2, Ht = 3.4
    const ang = Math.sin(t * 0.00005) * 0.52
    const rcx = Wd / 2, rcy = Dp / 2
    const iso = (x, y, z) => {
      const dx = x - rcx, dy = y - rcy
      const rx = rcx + dx * Math.cos(ang) - dy * Math.sin(ang)
      const ry = rcy + dx * Math.sin(ang) + dy * Math.cos(ang)
      return [(rx - ry) * ISC * u, (rx + ry) * ISO * u - z * u]
    }
    const box = (bx, by, bz, sx, sy, sz, kind, out) => {
      const p = (x, y, z) => iso(bx + x, by + y, bz + z)
      const c = [p(0,0,0),p(sx,0,0),p(sx,sy,0),p(0,sy,0),p(0,0,sz),p(sx,0,sz),p(sx,sy,sz),p(0,sy,sz)]
      const E = [[0,1],[1,2],[2,3],[3,0],[0,4],[1,5],[2,6],[3,7],[4,5],[5,6],[6,7],[7,4]]
      for (const [i, j] of E) out.push({ k: kind, a: c[i], b: c[j] })
    }
    const items = []
    box(0, 0, 0, Wd, Dp, Ht, 'l', items)             // 방 골조
    box(0.5, 1.0, 0, 1.1, 2.6, 0.8, 'f', items)      // 소파
    box(2.7, 1.8, 0, 2.3, 1.8, 0, 'f', items)        // 러그(바닥)
    box(3.0, 2.1, 0, 1.6, 1.0, 0.45, 'f', items)     // 테이블
    box(4.7, 0.4, 0, 1.5, 2.0, 0.55, 'f', items)     // 침대
    box(0.45, 4.1, 0, 3.6, 0.85, 1.0, 'f', items)    // 주방 카운터
    const cc = iso(rcx, rcy, Ht / 2)
    const ox = W * 0.5 - cc[0], oy = H * 0.52 - cc[1]
    for (const it of items) { it.a = [it.a[0] + ox, it.a[1] + oy]; it.b = [it.b[0] + ox, it.b[1] + oy] }
    const len = (it) => Math.hypot(it.b[0] - it.a[0], it.b[1] - it.a[1])
    let total = 0; for (const it of items) total += len(it)

    // 3) 그리는 진행 (그렸다 → 머물고 → 페이드 → 다시)
    const period = 11000
    const cyc = (t % period) / period
    const ease = (x) => 1 - Math.pow(1 - x, 3)
    const prog = ease(Math.min(1, cyc / 0.66))
    let alpha = 1
    if (cyc < 0.04) alpha = cyc / 0.04
    else if (cyc > 0.90) alpha = Math.max(0, (1 - cyc) / 0.10)
    let drawLen = prog * total, acc = 0
    ctx.lineWidth = 1.5
    for (const it of items) {
      const L = len(it); if (L < 0.001) continue
      let f = (drawLen - acc) / L; acc += L
      if (f <= 0) continue; if (f > 1) f = 1
      ctx.strokeStyle = 'rgba(243,239,230,' + (it.k === 'f' ? 0.38 : 0.44) * alpha + ')'
      ctx.beginPath()
      ctx.moveTo(it.a[0], it.a[1])
      ctx.lineTo(it.a[0] + (it.b[0] - it.a[0]) * f, it.a[1] + (it.b[1] - it.a[1]) * f)
      ctx.stroke()
    }
  }
  if (reduced) { draw(6000); return }
  const loop = (t) => {
    if (!document.body.classList.contains('motion-paused')) draw(t)
    requestAnimationFrame(loop)
  }
  requestAnimationFrame(loop)
})()

// ---- PROJECT 전용 오버레이 열기/닫기 ----
// 메인 비주얼: 접속할 때마다 다른 프로젝트에서 시작해 차분하게 교차 전환
const heroProjectSlides = [...document.querySelectorAll('.hero-project-slides img')]
const heroScene = document.querySelector('[data-hero-scene]')
const heroCopy = document.querySelector('[data-hero-copy]')
if (heroProjectSlides.length > 1) {
  let heroProjectIndex = Math.floor(Math.random() * heroProjectSlides.length)
  const showHeroProject = (index) => {
    heroProjectSlides.forEach((slide, slideIndex) => {
      const active = slideIndex === index
      slide.classList.toggle('is-active', active)
      slide.setAttribute('aria-hidden', String(!active))
    })
    const activeSlide = heroProjectSlides[index]
    if (heroScene) heroScene.textContent = activeSlide.dataset.scene || String(index + 1).padStart(2, '0')
    if (heroCopy) {
      const lines = (activeSlide.dataset.copy || '').split('|')
      heroCopy.replaceChildren(...lines.flatMap((line, lineIndex) => lineIndex ? [document.createElement('br'), document.createTextNode(line)] : [document.createTextNode(line)]))
    }
  }
  showHeroProject(heroProjectIndex)
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.setInterval(() => {
      heroProjectIndex = (heroProjectIndex + 1) % heroProjectSlides.length
      showHeroProject(heroProjectIndex)
    }, 5000)
  }
}

// SELECTED WORK: 넓은 이미지 풀에서 중복 없이 무작위 4장을 선택
const visionWorkCards = [...document.querySelectorAll('.vision-work')]
const visionLibrary = [
  ['images/mild-16-portfolio-real-web.webp', 'MILD HOUSE', 'BRAND EXPERIENCE · SPACE'],
  ['images/waribashi-07-interior-real-web.webp', 'WARIBASHI', 'HOSPITALITY · SPACE'],
  ['images/yohi-user-01-facade-web.webp', 'YOHI', 'BRAND · FACADE'],
  ['images/yohi-user-02-counter-web.webp', 'YOHI COUNTER', 'BRAND TOUCHPOINT'],
  ['images/yohi-user-03-detail-web.webp', 'YOHI DETAIL', 'MATERIAL · EXPERIENCE'],
  ['images/yohi-user-04-interior-web.webp', 'YOHI INTERIOR', 'SPACE · EXPERIENCE'],
  ['images/arrangement-05-web.webp', 'ARRANGEMENT', 'SPACE · OPERATION'],
  ['images/arrangement-08-bar-real-web.webp', 'ARRANGEMENT BAR', 'DETAIL · OPERATION'],
  ['images/woobok-08-partition-real-web.webp', 'WOOBOK', 'SPACE · DETAIL'],
  ['images/office-09-portfolio-real-web.webp', 'OFFICE PROJECT', 'WORKPLACE · SPACE'],
  ['images/gimijung-07-counter-real-web.webp', 'GIMIJUNG', 'MATERIAL · LIGHT'],
  ['images/inedit-08-material-real-web.webp', 'INEDIT', 'TEXTURE · IDENTITY'],
  ['images/buhair-07-detail-real-web.webp', 'BUHAIR', 'OBJECT · EXPERIENCE'],
  ['images/caveu-08-material-real-web.webp', 'CAVEU', 'MATERIAL · DETAIL'],
  ['images/gasik-07-interior-real-web.webp', 'GASIK', 'HOSPITALITY · SPACE'],
  ['images/brewery-07-material-real-web.webp', 'BREWERY', 'MATERIAL · EXPERIENCE'],
  ['images/nicekyou-interior-02.jpg', 'NICE KYOU', 'INTERIOR · HOSPITALITY'],
  ['images/mimi-07-interior-real-web.webp', 'MIMI', 'SPACE · BRAND EXPERIENCE'],
  ['images/concept-render/grill-dining-hero-web.webp', 'GRILL DINING', 'CONCEPT RENDER · F&B SPACE'],
  ['images/concept-render/grill-open-kitchen-web.webp', 'OPEN KITCHEN', 'CONCEPT RENDER · OPERATION'],
  ['images/concept-render/corner-bakery-facade-web.webp', 'CORNER BAKERY', 'CONCEPT RENDER · FACADE'],
  ['images/concept-render/corner-bakery-hero-web.webp', 'CORNER BAKERY', 'CONCEPT RENDER · SPACE'],
  ['images/concept-render/bakery-cafe-interior-web.webp', 'BAKERY CAFE', 'CONCEPT RENDER · EXPERIENCE'],
  ['images/concept-render/bakery-cafe-night-web.webp', 'BAKERY CAFE', 'CONCEPT RENDER · FACADE'],
  ['images/concept-render/soft-dining-hero-web.webp', 'SOFT DINING', 'CONCEPT RENDER · HOSPITALITY'],
  ['images/concept-render/soft-dining-kitchen-web.webp', 'SOFT DINING', 'CONCEPT RENDER · KITCHEN'],
  ['images/concept-render/espresso-bar-facade-web.webp', 'ESPRESSO BAR', 'CONCEPT RENDER · FACADE'],
  ['images/concept-render/espresso-bar-interior-web.webp', 'ESPRESSO BAR', 'CONCEPT RENDER · SPACE']
].map(([src, title, meta]) => ({ src, title, meta }))

if (visionWorkCards.length) {
  // 첫 방문에는 현재 보이는 4장만 요청합니다. 나머지는 해당 섹션이 화면에 보일 때 교체 시점에 불러옵니다.
  let visibleSources = new Set(visionWorkCards.map(card => card.querySelector('img')?.getAttribute('src')).filter(Boolean))
  let visionVisible = false
  const shuffled = items => {
    const copy = [...items]
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy
  }
  const refreshVisionGrid = (immediate = false) => {
    const candidates = shuffled(visionLibrary.filter(item => !visibleSources.has(item.src)))
    const nextItems = candidates.slice(0, visionWorkCards.length)
    visibleSources = new Set(nextItems.map(item => item.src))
    visionWorkCards.forEach((card, cardIndex) => {
      const item = nextItems[cardIndex]
      const image = card.querySelector('img')
      const update = () => {
        image.src = item.src
        image.alt = `${item.title} 위코 프로젝트`
        card.querySelector('b').textContent = item.title
        card.querySelector('em').textContent = item.meta
        image.classList.remove('is-swapping')
      }
      if (immediate) update()
      else window.setTimeout(() => {
        image.classList.add('is-swapping')
        window.setTimeout(update, 320)
      }, cardIndex * 180)
    })
  }
  const visionSection = document.querySelector('.selected-vision')
  if ('IntersectionObserver' in window && visionSection) {
    new IntersectionObserver(entries => { visionVisible = entries.some(entry => entry.isIntersecting) }, { rootMargin: '180px 0px', threshold: 0.01 }).observe(visionSection)
  } else {
    visionVisible = true
  }
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.setInterval(() => {
      if (document.visibilityState === 'visible' && visionVisible) refreshVisionGrid(false)
    }, 8000)
  }
}

const projectView = document.getElementById('projectView')
const closeProjectsButton = document.getElementById('closeProjects')
let projectTrigger = null
const shuffleProjectCards = () => {
  projectView?.querySelectorAll('.proj-grid').forEach(grid => {
    const cards = [...grid.querySelectorAll(':scope > .proj-card')]
    if (cards.length < 2) return
    const original = [...cards]
    for (let i = cards.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[cards[i], cards[j]] = [cards[j], cards[i]]
    }
    if (cards.every((card, index) => card === original[index])) {
      ;[cards[0], cards[1]] = [cards[1], cards[0]]
    }
    grid.append(...cards)
  })
}
const trapFocusWithin = (root, e) => {
  if (e.key !== 'Tab') return
  const focusable = [...root.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )].filter(el => {
    const style = getComputedStyle(el)
    return style.display !== 'none' && style.visibility !== 'hidden'
  })
  if (!focusable.length) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}
const openProjects = () => {
  trackEvent('PortfolioOpen', { page_language: document.documentElement.lang || 'ko' })
  projectTrigger = document.activeElement
  shuffleProjectCards()
  projectView.classList.add('open')
  projectView.setAttribute('aria-hidden', 'false')
  if (window.__lenis) window.__lenis.stop() // Lenis 정지 → 오버레이 네이티브 스크롤 복구
  document.documentElement.style.overflow = 'hidden' // html도 잠가야 뒤 본문이 안 밀림
  document.body.style.overflow = 'hidden'
  document.body.classList.add('motion-paused') // 오버레이 동안 히어로 캔버스 정지(부하 절감)
  // 첫 화면에 보이는 커버만 우선 로드하고 나머지는 네이티브 lazy loading 유지
  projectView.querySelectorAll('.proj-card .proj-img img').forEach((img, index) => {
    img.loading = index < 6 ? 'eager' : 'lazy'
    const s = img.getAttribute('src')
    if (index < 6 && s && !img.complete) img.setAttribute('src', s)
  })
  closeProjectsButton?.focus()
}
const closeProjects = () => {
  projectView.classList.remove('open')
  projectView.setAttribute('aria-hidden', 'true')
  document.documentElement.style.overflow = ''
  document.body.style.overflow = ''
  document.body.classList.remove('motion-paused')
  if (window.__lenis) window.__lenis.start()
  if (projectTrigger instanceof HTMLElement) projectTrigger.focus()
}
closeProjectsButton?.addEventListener('click', closeProjects)
// PROJECT 진입점: 섹션 버튼 + 내비/히어로의 #portfolio 링크
document.querySelectorAll('[data-open-projects], a[href="#portfolio"]').forEach(el => {
  el.addEventListener('click', (e) => { e.preventDefault(); e.stopImmediatePropagation(); setMenuOpen(false); openProjects() })
})
document.addEventListener('keydown', (e) => {
  if (e.key === 'Tab' && projectView.classList.contains('open') && !document.querySelector('.gallery-view.open, .lightbox.open')) {
    trapFocusWithin(projectView, e)
  }
  if (e.key === 'Escape' && projectView.classList.contains('open') && !document.querySelector('.gallery-view.open, .lightbox.open')) closeProjects()
})
// 오버레이 휠 → pv-scroll 직접 스크롤 (Lenis·이벤트 라우팅과 무관하게 보장)
projectView.addEventListener('wheel', (e) => {
  if (!projectView.classList.contains('open')) return
  const sc = projectView.querySelector('.pv-scroll')
  if (sc) { sc.scrollTop += e.deltaY; e.preventDefault() }
}, { passive: false })

// ---- 스크롤 리빌 모션 ----
const revealTargets = document.querySelectorAll(
  '.section-eyebrow, .section-title, .section-desc, .standard-grid article, ' +
  '.about-manifesto, .about-sub, .about-select, .about-points li, ' +
  '.bento-cell, .msg-big span, .chat .msg, .ask-cta, .contact-info, .contact-form'
)
revealTargets.forEach(el => el.classList.add('rv'))
let pending = [...revealTargets]
const reveal = () => {
  if (!pending.length) return
  const limit = window.innerHeight * 0.94
  pending = pending.filter(el => {
    if (el.getBoundingClientRect().top < limit) { el.classList.add('in'); return false }
    return true
  })
}
// ---- 플로팅 문의 버튼 (히어로 지나면 표시) ----
const quickFab = document.getElementById('quickFab')

// scroll 이벤트 + 보조 타이머 이중화 (이벤트가 누락되는 환경 대비)
const tick = () => {
  reveal()
  if (quickFab) quickFab.classList.toggle('show', window.scrollY > window.innerHeight * 0.7)
  // 화면 밖 무한 애니메이션 정지 (GPU 절약)
  const pastHero = window.scrollY > window.innerHeight * 1.1
  document.body.classList.toggle('motion-paused', pastHero)
  const hv = document.querySelector('#heroVideo video')
  if (hv && hv.src) { pastHero ? hv.pause() : (document.getElementById('heroVideo').classList.contains('playing') && hv.play().catch(() => {})) }
}
window.addEventListener('scroll', tick, { passive: true })
window.addEventListener('resize', tick, { passive: true })
window.addEventListener('load', tick)
setInterval(tick, 500)
tick()

// ===== 의뢰 폼 =====
const form = document.getElementById('inquiryForm')
const submitBtn = document.getElementById('submitBtn')
const formStatus = document.getElementById('formStatus')

// 프로젝트 유형 선택
const typeCards = document.getElementById('typeCards')
let selectedType = typeCards?.querySelector('.active')?.dataset.value || ''
typeCards?.addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return
  typeCards.querySelectorAll('button').forEach(x => {
    x.classList.remove('active')
    x.setAttribute('aria-pressed', 'false')
  })
  b.classList.add('active')
  b.setAttribute('aria-pressed', 'true')
  selectedType = b.dataset.value
  if (preferredWork) preferredWork.value = selectedType
})


// 폼 메시지 다국어 (페이지 lang 기준)
const FORM_MSG = ({
  en: { need: 'Please enter your name and phone number.',
        ok: 'Your request has been received. We will get back to you shortly.',
        err: `Something went wrong. Please call ${PHONE}.` },
  vi: { need: 'Vui lòng nhập họ tên và số điện thoại.',
        ok: 'Yêu cầu của bạn đã được gửi. Chúng tôi sẽ liên hệ lại sớm.',
        err: `Có lỗi xảy ra. Vui lòng gọi ${PHONE}.` }
})[document.documentElement.lang] || {
  need: '이름과 연락처를 입력해주세요.',
  ok: '의뢰서가 접수되었습니다. 검토 후 진행 가능 여부와 함께 연락드리겠습니다.',
  err: `접수 중 오류가 발생했습니다. 전화(${PHONE})로 문의해주세요.`
}

// 프로젝트 문의 → FormSubmit.co (계정 불필요, 이메일로 수신)
const INQUIRY_ENDPOINT = 'https://formsubmit.co/ajax/storm2119@gmail.com'
const preferredWork = document.getElementById('preferredWork')

const setStatus = (msg, ok) => {
  formStatus.textContent = msg
  formStatus.className = `form-status ${ok ? 'ok' : 'err'}`
}

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  const name = form.name.value.trim()
  const phone = form.phone.value.trim()

  if (!name || !phone) {
    setStatus(FORM_MSG.need, false)
    return
  }

  submitBtn.disabled = true
  submitBtn.classList.add('sending')
  try {
    const res = await fetch(INQUIRY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        _subject: '[위코컴퍼니] 새 프로젝트 문의',
        _template: 'table',
        _captcha: 'false',
        이름: name,
        연락처: phone,
        희망업무: selectedType,
        개인정보동의: '동의',
        프로젝트예상총예산: form.budget.value.trim() || '미입력',
        문의내용: form.message.value.trim() || '미입력'
      })
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok && (data.success === 'true' || data.success === true)) {
      if (typeof window.fbq === 'function') window.fbq('track', 'Lead')
      trackEvent('generate_lead', {
        form_name: 'project_inquiry',
        lead_type: selectedType || 'unspecified',
        page_language: document.documentElement.lang || 'ko'
      })
      form.reset()
      setStatus(FORM_MSG.ok, true)
    } else {
      throw new Error(data.message || 'submit failed')
    }
  } catch (err) {
    console.error(err)
    setStatus(FORM_MSG.err, false)
  } finally {
    submitBtn.disabled = false
    submitBtn.classList.remove('sending')
  }
})

// 주요 광고 전환 행동 추적 (개인정보·유입 식별값은 외부로 전송하지 않음)
const getTrafficAttribution = () => {
  const query = new URLSearchParams(location.search)
  const incoming = {
    traffic_source: query.get('utm_source'),
    traffic_medium: query.get('utm_medium'),
    campaign_name: query.get('utm_campaign'),
    campaign_content: query.get('utm_content'),
    campaign_term: query.get('utm_term')
  }
  try {
    const stored = JSON.parse(sessionStorage.getItem('weco_attribution') || '{}')
    const merged = Object.fromEntries(Object.entries(incoming).map(([key, value]) => [key, value || stored[key] || 'unknown']))
    if (Object.values(incoming).some(Boolean)) sessionStorage.setItem('weco_attribution', JSON.stringify(merged))
    return merged
  } catch (_) {
    return Object.fromEntries(Object.entries(incoming).map(([key, value]) => [key, value || 'unknown']))
  }
}
const trackEvent = (name, params = {}) => {
  const enriched = {
    hero_variant: window.WECO_HERO_VARIANT || 1,
    landing_segment: window.WECO_LANDING_SEGMENT || 'general',
    landing_path: location.pathname,
    ...getTrafficAttribution(),
    ...params
  }
  if (typeof window.fbq === 'function') window.fbq('trackCustom', name, enriched)
  if (typeof window.gtag === 'function') window.gtag('event', name, enriched)
}

document.addEventListener('click', (event) => {
  const pageLanguage = document.documentElement.lang || 'ko'
  const link = event.target.closest('a')
  if (link) {
    const href = link.getAttribute('href') || ''
    const linkParams = { page_language: pageLanguage, link_text: (link.textContent || '').trim().slice(0, 100) }
    if (href.startsWith('tel:')) {
      trackEvent('phone_click', linkParams)
      if (typeof window.fbq === 'function') window.fbq('track', 'Contact')
    }
    else if (href.startsWith('mailto:')) trackEvent('email_click', linkParams)
    else if (href.includes('open.kakao.com/o/sBasXuKi')) {
      trackEvent('kakao_openchat_click', linkParams)
      if (typeof window.fbq === 'function') window.fbq('track', 'Contact', { contact_method: 'kakao_openchat' })
    }
    else if (/WECO_PORTFOLIO_2026\.pdf(?:$|[?#])/i.test(href)) trackEvent('portfolio_download', linkParams)
    else if (href === '#contact') trackEvent('contact_cta_click', linkParams)
    else if (href.includes('/brand-discovery') || href.includes('brand-discovery.html')) {
      trackEvent('brand_discovery_click', linkParams)
      if (typeof window.fbq === 'function') window.fbq('track', 'ViewContent', { content_name: 'brand_discovery' })
    }
    else if (href.includes('mpmarketing.co.kr')) {
      trackEvent('marketing_site_click', linkParams)
      if (typeof window.fbq === 'function') window.fbq('track', 'ViewContent', { content_name: 'mp_marketing' })
    }
    else if (href === '#portfolio') trackEvent('portfolio_open', linkParams)
    else if (/^insights\.html(?:$|[?#])/i.test(href)) trackEvent('insights_click', linkParams)
    else if (/^startup-guide\.html(?:$|[?#])/i.test(href)) trackEvent('startup_guide_click', linkParams)
    else if (/^project-[a-z0-9-]+\.html(?:$|[?#])/i.test(href)) {
      trackEvent('project_detail_click', { ...linkParams, project_path: href.split(/[?#]/)[0] })
      if (typeof window.fbq === 'function') window.fbq('track', 'ViewContent', { content_name: href.split(/[?#]/)[0], content_category: 'project_case' })
    }
  }

  if (event.target.closest('[data-open-projects]')) {
    trackEvent('portfolio_open', { page_language: pageLanguage, link_text: 'project_view' })
  }

  const project = event.target.closest('.proj-card')
  if (project) {
    trackEvent('project_view', {
      page_language: pageLanguage,
      project_name: project.querySelector('.proj-meta h3')?.textContent?.trim() || 'unknown'
    })
  }
})

// 광고 유입 이후 실제 관심도를 단계별로 측정합니다.
;(() => {
  const sentDepths = new Set()
  const reportDepth = () => {
    const max = Math.max(document.documentElement.scrollHeight - innerHeight, 1)
    const percent = Math.round(scrollY / max * 100)
    ;[25, 50, 75, 90].forEach(depth => {
      if (percent >= depth && !sentDepths.has(depth)) {
        sentDepths.add(depth)
        trackEvent('scroll_depth', { depth, page_language: document.documentElement.lang || 'ko' })
      }
    })
  }
  addEventListener('scroll', reportDepth, { passive: true })

  const inquiryForm = document.getElementById('inquiryForm')
  inquiryForm?.addEventListener('focusin', () => {
    if (inquiryForm.dataset.started) return
    inquiryForm.dataset.started = 'true'
    trackEvent('form_start', { form_name: 'project_inquiry', page_language: document.documentElement.lang || 'ko' })
  })

  // 광고 클릭 수와 실제 관심 방문을 분리해 볼 수 있도록 10초 체류를 별도 기록합니다.
  let qualifiedVisitSent = false
  setTimeout(() => {
    if (qualifiedVisitSent || document.visibilityState !== 'visible') return
    qualifiedVisitSent = true
    trackEvent('qualified_visit_10s', { page_language: document.documentElement.lang || 'ko' })
  }, 10000)

  let engagedVisitSent = false
  setTimeout(() => {
    if (engagedVisitSent || document.visibilityState !== 'visible') return
    engagedVisitSent = true
    trackEvent('engaged_visit_30s', { page_language: document.documentElement.lang || 'ko' })
  }, 30000)

  // 한 페이지 안에서도 방문자가 실제로 도달한 구간을 경로처럼 확인할 수 있게 합니다.
  if ('IntersectionObserver' in window) {
    const sectionEvents = [
      ['.hero', 'view_hero', 'hero'],
      ['.friction-section', 'view_problem', 'problem'],
      ['.discovery-cta', 'view_brand_diagnosis', 'brand_diagnosis'],
      ['#intelligence', 'view_intelligence', 'intelligence'],
      ['#audience', 'view_audience', 'audience'],
      ['#scope', 'view_services', 'services'],
      ['#process', 'view_process', 'process'],
      ['#contact', 'view_contact', 'contact']
    ]
    const viewedSections = new Set()
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        const config = sectionEvents.find(([selector]) => entry.target.matches(selector))
        if (!config || viewedSections.has(config[1])) return
        viewedSections.add(config[1])
        trackEvent(config[1], {
          section_name: config[2],
          page_language: document.documentElement.lang || 'ko'
        })
        sectionObserver.unobserve(entry.target)
      })
    }, { threshold: 0.15 })

    sectionEvents.forEach(([selector]) => {
      const section = document.querySelector(selector)
      if (section) sectionObserver.observe(section)
    })
  }
})()

// ===== 프리미엄 모션 (CDN 로드 실패 시 기본 동작 유지) =====
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches
const LIGHTWEIGHT = REDUCED || matchMedia('(pointer: coarse)').matches || Boolean(navigator.connection?.saveData)

// ---- Lenis 부드러운 관성 스크롤 ----
;(async () => {
  if (LIGHTWEIGHT) return
  try {
    const { default: Lenis } = await import('https://cdn.jsdelivr.net/npm/lenis@1.3.4/+esm')
    const lenis = new Lenis({ autoRaf: true, duration: 1.15 })
    window.__lenis = lenis // 오버레이에서 정지/재개 위해 노출
    document.documentElement.style.scrollBehavior = 'auto'
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      const href = a.getAttribute('href')
      if (href.length < 2) return
      a.addEventListener('click', (e) => {
        const target = document.querySelector(href)
        if (target) { e.preventDefault(); lenis.scrollTo(target, { offset: -40 }) }
      })
    })
  } catch (e) { /* CDN 실패 시 네이티브 스크롤 유지 */ }
})()

// ---- GSAP 히어로 인트로 (글자 스태거) ----
;(async () => {
  if (LIGHTWEIGHT) return
  try {
    const { gsap } = await import('https://cdn.jsdelivr.net/npm/gsap@3.13.0/+esm')
    const heroEn = document.querySelector('.hero-en')
    const splitChars = (el) => {
      ;[...el.childNodes].forEach(node => {
        if (node.nodeType === 3) {
          const frag = document.createDocumentFragment()
          // \uB2E8\uC5B4 \uB2E8\uC704\uB85C \uBB36\uC5B4 \uB2E8\uC5B4 \uC911\uAC04 \uC904\uBC14\uAFC8 \uBC29\uC9C0 (\uACF5\uBC31\uC5D0\uC11C\uB9CC \uC904\uBC14\uAFC8)
          node.textContent.split(/(\s+)/).forEach(part => {
            if (part === '') return
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return }
            const word = document.createElement('span')
            word.className = 'word'
            part.split('').forEach(ch => {
              const s = document.createElement('span')
              s.className = 'ch'
              s.textContent = ch
              word.appendChild(s)
            })
            frag.appendChild(word)
          })
          el.replaceChild(frag, node)
        } else if (node.nodeType === 1 && !node.classList.contains('spark')) {
          splitChars(node)
        }
      })
    }
    splitChars(heroEn)
    const intro = gsap.timeline({ defaults: { ease: 'power4.out' } })
      .from('.hero-eyebrow', { y: 18, opacity: 0, duration: .8 })
      .from('.hero-en .ch', { yPercent: 115, opacity: 0, duration: 1, stagger: .035 }, '-=.4')
    if (heroEn.querySelector('.spark')) {
      intro.from('.hero-en .spark', { scale: 0, rotation: -120, opacity: 0, duration: .7, ease: 'back.out(2.2)' }, '-=.45')
    }
    intro.from('.hero-promise', { y: 22, opacity: 0, duration: .8 }, '-=.55')
    intro.eventCallback('onComplete', () => intro.kill())
    // rAF가 멈추는 환경(백그라운드 탭 등)에서도 히어로가 반드시 보이도록 보장
    setTimeout(() => { if (intro.progress() < 1) intro.progress(1) }, 3500)
  } catch (e) { /* CDN 실패 시 정적 히어로 유지 */ }
})()

// ---- 프로젝트 갤러리 (3열 그리드 → 탭 확대) ----
;(() => {
  const big = (src) => src.replace('w=640', 'w=1600').replace('w=720', 'w=1600').replace('q=55', 'q=75')
  const items = [...document.querySelectorAll('.proj-card:not(.proj-soon)')].map(w => {
    const thumb = w.querySelector('.proj-img img')
    const list = (w.dataset.photos || '').split('|').filter(Boolean)
    const labels = (w.dataset.shotLabels || '').split('|').filter(Boolean)
    return {
      photos: list.length ? list : (thumb ? [big(thumb.src)] : []),
      shotLabels: labels,
      title: w.querySelector('.proj-meta h3')?.textContent || '',
      meta: w.querySelector('.proj-meta p')?.textContent || '',
      trigger: w
    }
  }).filter(i => i.photos.length)
  if (!items.length) return

  // 3열 그리드 갤러리
  const gv = document.createElement('div')
  gv.className = 'gallery-view'
  gv.setAttribute('role', 'dialog')
  gv.setAttribute('aria-modal', 'true')
  gv.setAttribute('aria-hidden', 'true')
  gv.setAttribute('aria-labelledby', 'galleryViewTitle')
  gv.innerHTML = `<div class="gv-bar container"><span class="gv-title" id="galleryViewTitle"></span><button class="gv-close" type="button" aria-label="닫기">&times;</button></div><div class="gv-scroll" data-lenis-prevent><div class="gv-grid"></div></div>`
  document.body.appendChild(gv)
  const gvTitle = gv.querySelector('.gv-title')
  const gvGrid = gv.querySelector('.gv-grid')
  let curItem = 0

  // 확대 라이트박스
  const lb = document.createElement('div')
  lb.className = 'lightbox'
  lb.setAttribute('role', 'dialog')
  lb.setAttribute('aria-modal', 'true')
  lb.setAttribute('aria-hidden', 'true')
  lb.setAttribute('aria-labelledby', 'lightboxTitle')
  lb.innerHTML = `<button class="lb-close" type="button" aria-label="닫기">&times;</button><button class="lb-prev" type="button" aria-label="이전">&#8249;</button><figure><img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" alt="" /><figcaption><strong id="lightboxTitle"></strong><b class="lb-count"></b></figcaption></figure><button class="lb-next" type="button" aria-label="다음">&#8250;</button>`
  document.body.appendChild(lb)
  const lbImg = lb.querySelector('img'), lbTitle = lb.querySelector('strong'), lbCount = lb.querySelector('.lb-count')
  let curPhoto = 0
  let galleryTrigger = null
  let lightboxTrigger = null
  const lang = document.documentElement.lang
  const photoLabel = (title, count) => lang === 'en'
    ? `View ${title}, ${count} photos`
    : lang === 'vi'
      ? `Xem ${title}, ${count} ảnh`
      : `${title} 사진 ${count}장 보기`
  const zoomLabel = (title, index) => lang === 'en'
    ? `Enlarge ${title} photo ${index}`
    : lang === 'vi'
      ? `Phóng to ảnh ${index} của ${title}`
      : `${title} ${index}번 사진 확대 보기`
  const updatePortfolioUrl = (index) => {
    const url = new URL(window.location.href)
    if (index === null) url.searchParams.delete('portfolio')
    else url.searchParams.set('portfolio', String(index + 1))
    history.replaceState({}, '', url)
  }
  const renderLB = () => {
    const it = items[curItem]
    lbImg.src = it.photos[curPhoto]; lbImg.alt = it.title
    lbTitle.textContent = it.title
    lbCount.textContent = `${curPhoto + 1} / ${it.photos.length}`
  }
  const moveLB = (d) => { const n = items[curItem].photos.length; curPhoto = (curPhoto + d + n) % n; renderLB() }
  const openLB = (idx, trigger) => {
    lightboxTrigger = trigger || document.activeElement
    curPhoto = idx
    renderLB()
    lb.classList.add('open')
    lb.setAttribute('aria-hidden', 'false')
    lb.querySelector('.lb-close').focus()
  }
  const closeLB = () => {
    lb.classList.remove('open')
    lb.setAttribute('aria-hidden', 'true')
    if (lightboxTrigger instanceof HTMLElement) lightboxTrigger.focus()
  }

  const openGallery = (i, syncUrl = true) => {
    curItem = i
    const it = items[i]
    galleryTrigger = it.trigger
    gvTitle.textContent = it.title
    gvGrid.innerHTML = ''
    it.photos.forEach((src, idx) => {
      const shot = it.shotLabels[idx] || (idx === 0 ? 'FACADE' : idx >= it.photos.length - 2 ? 'DETAIL' : 'INTERIOR')
      const figure = document.createElement('figure')
      figure.className = 'gv-shot'
      const im = document.createElement('img')
      im.loading = 'lazy'
      im.src = src
      im.alt = `${it.title} ${idx + 1}`
      im.tabIndex = 0
      im.setAttribute('role', 'button')
      im.setAttribute('aria-label', zoomLabel(it.title, idx + 1))
      im.addEventListener('click', () => openLB(idx, im))
      im.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          openLB(idx, im)
        }
      })
      const caption = document.createElement('figcaption')
      caption.innerHTML = `<span>${String(idx + 1).padStart(2, '0')}</span>${shot}`
      figure.append(im, caption)
      gvGrid.appendChild(figure)
    })
    gv.querySelector('.gv-scroll').scrollTop = 0
    gv.classList.add('open')
    gv.setAttribute('aria-hidden', 'false')
    document.body.style.overflow = 'hidden'
    if (syncUrl) updatePortfolioUrl(i)
    gv.querySelector('.gv-close').focus()
  }
  const closeGallery = () => {
    gv.classList.remove('open')
    gv.setAttribute('aria-hidden', 'true')
    document.body.style.overflow = projectView.classList.contains('open') ? 'hidden' : ''
    updatePortfolioUrl(null)
    if (galleryTrigger instanceof HTMLElement) galleryTrigger.focus()
  }

  items.forEach((it, i) => {
    it.trigger.tabIndex = 0
    it.trigger.setAttribute('role', 'button')
    it.trigger.setAttribute('aria-label', photoLabel(it.title, it.photos.length))
    it.trigger.addEventListener('click', (e) => { e.preventDefault(); openGallery(i) })
    it.trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        openGallery(i)
      }
    })
  })
  gv.querySelector('.gv-close').addEventListener('click', closeGallery)
  lb.querySelector('.lb-close').addEventListener('click', closeLB)
  lb.querySelector('.lb-prev').addEventListener('click', () => moveLB(-1))
  lb.querySelector('.lb-next').addEventListener('click', () => moveLB(1))
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLB() })
  document.addEventListener('keydown', (e) => {
    if (lb.classList.contains('open')) {
      trapFocusWithin(lb, e)
      if (e.key === 'Escape') closeLB()
      if (e.key === 'ArrowLeft') moveLB(-1)
      if (e.key === 'ArrowRight') moveLB(1)
    } else if (gv.classList.contains('open')) {
      trapFocusWithin(gv, e)
      if (e.key === 'Escape') closeGallery()
    }
  })

  const requestedPortfolio = Number(new URLSearchParams(window.location.search).get('portfolio'))
  if (Number.isInteger(requestedPortfolio) && requestedPortfolio >= 1 && requestedPortfolio <= items.length) {
    openProjects()
    openGallery(requestedPortfolio - 1, false)
  }
})()

// ---- 커스텀 커서 (데스크톱 전용) ----
;(() => {
  if (REDUCED || !matchMedia('(pointer: fine)').matches) return

  const dot = document.createElement('div')
  dot.className = 'cursor cursor-dot'
  const ring = document.createElement('div')
  ring.className = 'cursor cursor-ring'
  ring.innerHTML = '<span>VIEW</span>'
  document.body.append(ring, dot)
  document.documentElement.classList.add('has-cursor')

  let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my
  addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY }, { passive: true })
  const loop = () => {
    rx += (mx - rx) * 0.16
    ry += (my - ry) * 0.16
    dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`
    ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`
    requestAnimationFrame(loop)
  }
  loop()

  // 프로젝트 사진 위: VIEW 모드
  document.querySelectorAll('.proj-card .proj-img').forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('view'))
    el.addEventListener('mouseleave', () => ring.classList.remove('view'))
  })
  // 링크·버튼 위: 확장 모드
  document.querySelectorAll('a, button').forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('grow'))
    el.addEventListener('mouseleave', () => ring.classList.remove('grow'))
  })
  // 큰 버튼: 마그네틱 (커서 쪽으로 살짝 끌림)
  document.querySelectorAll('.hero-actions .btn, #submitBtn').forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect()
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px,${(e.clientY - r.top - r.height / 2) * .18}px)`
    })
    el.addEventListener('mouseleave', () => { el.style.transform = '' })
  })
})()

// ---- 히어로 배경 영상 (데스크톱 전용, 실패 시 사진 유지) ----
;(() => {
  const wrap = document.getElementById('heroVideo')
  if (!wrap) return
  const video = wrap.querySelector('video')
  if (!video) return
  const isMobile = matchMedia('(max-width: 768px), (pointer: coarse)').matches
  if (REDUCED || isMobile) { video.remove(); return }
  const hd = innerWidth >= 1280
  video.src = `https://videos.pexels.com/video-files/7578554/7578554-${hd ? 'hd_1920_1080_30fps' : 'hd_1280_720_30fps'}.mp4`
  video.addEventListener('canplay', () => {
    wrap.classList.add('playing')
    video.play().catch(() => {})
  }, { once: true })
  video.addEventListener('error', () => video.remove())
  video.load()
})()
