// ===== 위코컴퍼니 홈페이지 스크립트 =====
const PHONE = '010-8606-2119'

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

// 유입 맥락과 관심 업종에 맞춰 첫 화면의 메시지와 대표 장면을 조정합니다.
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
  const content = String(query.get('utm_content') || storedAttribution.campaign_content || '').toLowerCase()
  const term = String(query.get('utm_term') || storedAttribution.campaign_term || '').toLowerCase()
  const referrer = String(document.referrer || '').toLowerCase()
  const signal = `${source} ${medium} ${campaign} ${content} ${term} ${referrer}`
  const isPaidSocial = /^(ig|fb|instagram|facebook|meta)$/.test(source) && /(paid|cpc|ppc|social)/.test(medium)
    || /(meta|instagram|facebook)/.test(campaign) && /(paid|cpc|conversion|traffic|lead)/.test(`${medium} ${campaign}`)
  const isOrganicSearch = /(organic|google|naver|daum|bing)/.test(`${source} ${medium}`) || /(google|naver|daum|bing)\./.test(referrer)
  const isSocial = /(instagram|facebook|threads|tiktok|youtube|youtu\.be)/.test(signal)

  let visits = 0
  try {
    visits = Number(localStorage.getItem('wecoVisitCount') || 0)
    localStorage.setItem('wecoVisitCount', String(visits + 1))
  } catch (_) {}

  const industries = [
    ['salon', /(미용실|헤어|뷰티|salon|hair|beauty)/],
    ['clinic', /(병원|의원|클리닉|의료|보청기|clinic|hospital|medical)/],
    ['office', /(사무실|오피스|office|workplace)/],
    ['cafe', /(카페|커피|베이커리|cafe|coffee|bakery)/],
    ['fnb', /(식당|음식점|외식|고기집|육회|레스토랑|restaurant|food|fnb)/],
    ['interior', /(상가.?인테리어|인테리어|공간|interior|commercial.?space)/]
  ]
  const industry = industries.find(([, pattern]) => pattern.test(signal))?.[0] || ''

  const variants = [
    {
      headline: '아이디어에 방향을,<br><strong>브랜드에 선택의 이유를.</strong>',
      promise: '시장과 고객을 읽고 사업의 방향을 정리합니다.<br>브랜드 기획부터 디자인과 공간 경험까지 연결합니다.'
    },
    {
      headline: '무엇을 만들지보다,<br><strong>왜 필요한지부터.</strong>',
      promise: '누구를 위한 사업인지, 고객이 왜 선택해야 하는지.<br>브랜드를 시작하는 질문부터 함께 정리합니다.'
    },
    {
      headline: '흩어진 생각을,<br><strong>하나의 브랜드로.</strong>',
      promise: '사업의 방향과 콘셉트, 이름과 디자인이<br>같은 이야기를 전하도록 기준을 세웁니다.'
    },
    {
      headline: '시작하는 사업에도,<br><strong>다음 단계가 필요한 브랜드에도.</strong>',
      promise: '창업부터 리뉴얼까지 현재 조건을 살펴<br>먼저 풀어야 할 문제와 실행 순서를 정리합니다.'
    },
    {
      headline: '좋아 보이는 것을 넘어,<br><strong>이유가 있는 브랜드로.</strong>',
      promise: '시장 분석과 브랜드 기획, 디자인과 고객 경험을<br>하나의 방향으로 연결합니다.'
    }
  ]

  const personalized = {
    salon: { headline: '미용실의 감각을,<br><strong>다시 찾는 브랜드로.</strong>', promise: '공간의 첫인상부터 고객 경험과 재방문까지<br>하나의 브랜드 기준으로 연결합니다.', cta: '미용실 프로젝트 문의하기', image: 'images/buhair-07-detail-real-web.webp', imageAlt: '미용실 브랜드 공간의 재료와 디테일', imageCopy: '감각적인 공간을|다시 찾는 브랜드로 만듭니다.' },
    clinic: { headline: '신뢰가 필요한 공간을,<br><strong>선택받는 의료 브랜드로.</strong>', promise: '전문성과 안심이 공간과 고객 경험에서<br>일관되게 전달되도록 기준을 설계합니다.', cta: '의료 공간 프로젝트 문의하기' },
    office: { headline: '일하는 공간을,<br><strong>조직의 브랜드 경험으로.</strong>', promise: '업무 방식과 조직의 태도가 공간에서 자연스럽게<br>느껴지도록 오피스의 기준을 설계합니다.', cta: '오피스 프로젝트 문의하기', image: 'images/office-09-portfolio-real-web.webp', imageAlt: '업무 방식과 브랜드를 반영한 오피스 공간', imageCopy: '일하는 방식이|공간의 인상이 됩니다.' },
    cafe: { headline: '카페의 취향을,<br><strong>목적지가 되는 브랜드로.</strong>', promise: '메뉴와 공간, 고객이 기억할 장면을 연결해<br>다시 방문할 분명한 이유를 만듭니다.', cta: '카페 프로젝트 문의하기', image: 'images/concept-render/bakery-cafe-interior-web.webp', imageAlt: '브랜드 경험을 담은 베이커리 카페 공간', imageCopy: '머물고 싶은 장면을|찾아오는 이유로 만듭니다.' },
    fnb: { headline: '식당의 가능성을,<br><strong>다시 찾는 브랜드로.</strong>', promise: '상권과 고객, 메뉴와 운영 조건을 함께 읽고<br>선택과 재방문으로 이어질 기준을 세웁니다.', cta: '식당 프로젝트 문의하기' },
    interior: { headline: '상가 공간을,<br><strong>선택받는 브랜드 경험으로.</strong>', promise: '보기 좋은 인테리어를 넘어 고객이 발견하고<br>머물고 다시 찾을 공간의 이유를 설계합니다.', cta: '상가 인테리어 문의하기' },
    paid_social: { headline: '광고에서 본 가능성을,<br><strong>실행할 프로젝트로.</strong>', promise: '업종과 현재 단계를 간단히 알려주시면<br>무엇부터 결정해야 할지 먼저 정리해드립니다.', cta: '프로젝트 상담 문의하기' },
    organic_search: { headline: '찾고 있던 답을,<br><strong>실행할 브랜드 기준으로.</strong>', promise: '검색으로 흩어진 정보 대신 지금 상황에 필요한<br>결정의 순서와 프로젝트 방향을 정리합니다.', cta: '프로젝트 상담 문의하기' },
    social: { headline: '눈에 띈 장면을,<br><strong>방문할 이유가 있는 브랜드로.</strong>', promise: '좋아 보이는 이미지를 넘어 실제 고객 경험과<br>사업의 성장으로 이어질 기준을 만듭니다.', cta: '프로젝트 상담 문의하기' },
    returning: { headline: '다시 찾은 가능성을,<br><strong>실행할 다음 단계로.</strong>', promise: '고민하고 있는 브랜드와 공간의 현재 단계를<br>짧게 진단하고 먼저 결정할 일을 정리합니다.', cta: '프로젝트 상담 문의하기' }
  }

  const segment = industry || 'general'
  const config = personalized[segment]
  if (config) {
    headline.innerHTML = config.headline
    promise.innerHTML = config.promise
    const discoveryButton = document.querySelector('.hero-actions [data-conversion="project_inquiry"]')
    if (discoveryButton) discoveryButton.innerHTML = `${config.cta} <span>↗</span>`
    const note = document.querySelector('.hero-analysis-note')
    if (note) note.textContent = '업종과 현재 단계를 알려주시면, 무엇부터 시작해야 할지 먼저 정리해드립니다.'
    if (config.image) window.WECO_HERO_PERSONALIZED_IMAGE = config
  } else {
    let previous = -1
    try { previous = Number(sessionStorage.getItem('wecoHeroVariant')) } catch (_) {}
    const candidates = variants.map((_, index) => index).filter(index => index !== previous)
    const selected = candidates[Math.floor(Math.random() * candidates.length)] ?? 0
    headline.innerHTML = variants[selected].headline
    promise.innerHTML = variants[selected].promise
    try { sessionStorage.setItem('wecoHeroVariant', String(selected)) } catch (_) {}
  }
  window.WECO_HERO_VARIANT = segment
  window.WECO_LANDING_SEGMENT = segment
  window.WECO_IS_PAID_SOCIAL = isPaidSocial
  document.body.dataset.landingSegment = segment
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
  const personalizedImage = window.WECO_HERO_PERSONALIZED_IMAGE
  if (personalizedImage) {
    heroProjectSlides[0].src = personalizedImage.image
    heroProjectSlides[0].alt = personalizedImage.imageAlt
    heroProjectSlides[0].dataset.copy = personalizedImage.imageCopy
  }
  let heroProjectIndex = personalizedImage ? 0 : Math.floor(Math.random() * heroProjectSlides.length)
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
  ['images/apt21-01.jpg', 'APARTMENT 21', 'RESIDENTIAL · LIVING', 'residential'],
  ['images/apt21-03.jpg', 'APARTMENT 21', 'RESIDENTIAL · MATERIAL', 'residential'],
  ['images/apt21-09.jpg', 'APARTMENT 21', 'RESIDENTIAL · SPACE', 'residential'],
  ['images/apt21-12.jpg', 'APARTMENT 21', 'RESIDENTIAL · DETAIL', 'residential'],
  ['images/jewel-cover-polished.jpg', 'RETAIL SPACE', 'COMMERCIAL · RETAIL', 'commercial'],
  ['images/office-09-portfolio-real-web.webp', 'OFFICE PROJECT', 'COMMERCIAL · WORKPLACE', 'commercial'],
  ['images/buhair-07-detail-real-web.webp', 'BEAUTY SPACE', 'COMMERCIAL · DETAIL', 'commercial'],
  ['images/gasik-07-interior-real-web.webp', 'GASIK', 'BRAND EXPERIENCE · RESTAURANT', 'commercial']
].map(([src, title, meta, category]) => ({ src, title, meta, category }))

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
    const available = visionLibrary.filter(item => !visibleSources.has(item.src))
    const nextItems = [
      ...shuffled(available.filter(item => item.category === 'commercial')).slice(0, 2),
      ...shuffled(available.filter(item => item.category === 'residential')).slice(0, 2)
    ]
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
const primaryProjectGrid = projectView?.querySelector('.pv-scroll > .proj-grid')
const projectToggle = document.createElement('button')
projectToggle.type = 'button'
projectToggle.className = 'project-list-toggle'
projectToggle.textContent = '프로젝트 더 보기 +'
projectToggle.setAttribute('aria-expanded', 'false')
if (primaryProjectGrid) primaryProjectGrid.insertAdjacentElement('afterend', projectToggle)
projectToggle.addEventListener('click', () => {
  const expanded = projectView.classList.toggle('show-all-projects')
  projectToggle.textContent = expanded ? '대표 프로젝트만 보기 −' : '프로젝트 더 보기 +'
  projectToggle.setAttribute('aria-expanded', String(expanded))
  trackEvent('portfolio_expand', { expanded, page_language: document.documentElement.lang || 'ko' })
})
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
  trackEvent('portfolio_open', { page_language: document.documentElement.lang || 'ko' })
  projectView.classList.remove('show-all-projects')
  projectToggle.textContent = '프로젝트 더 보기 +'
  projectToggle.setAttribute('aria-expanded', 'false')
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
    const leadContext = getLeadContext()
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
        문의내용: form.message.value.trim() || '미입력',
        최초유입: leadContext.first_touch,
        최근유입: leadContext.last_touch,
        광고캠페인: leadContext.campaign,
        광고소재: leadContext.content,
        검색어_광고키워드: leadContext.term,
        광고클릭ID: leadContext.click_id,
        최초방문페이지: leadContext.first_landing,
        문의제출페이지: leadContext.submit_page,
        상담전본페이지: leadContext.pages_viewed,
        상담전본프로젝트: leadContext.projects_viewed,
        상담전체류시간: leadContext.time_to_lead,
        접속기기: leadContext.device
      })
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok && (data.success === 'true' || data.success === true)) {
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
    trackEvent('form_submit_error', {
      form_name: 'project_inquiry',
      error_type: err?.name || 'submit_error',
      page_language: document.documentElement.lang || 'ko'
    })
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
    campaign_term: query.get('utm_term'),
    click_id: query.get('fbclid') || query.get('gclid') || query.get('msclkid') || query.get('ttclid')
  }
  try {
    const stored = JSON.parse(sessionStorage.getItem('weco_attribution') || '{}')
    const inferredSource = document.referrer ? new URL(document.referrer).hostname : 'direct'
    const inferredMedium = inferredSource === 'direct' ? 'direct' : 'referral'
    const merged = Object.fromEntries(Object.entries(incoming).map(([key, value]) => [key, value || stored[key] || 'unknown']))
    if (merged.traffic_source === 'unknown') merged.traffic_source = inferredSource
    if (merged.traffic_medium === 'unknown') merged.traffic_medium = inferredMedium
    sessionStorage.setItem('weco_attribution', JSON.stringify(merged))
    return merged
  } catch (_) {
    return Object.fromEntries(Object.entries(incoming).map(([key, value]) => [key, value || 'unknown']))
  }
}

// 문의가 실제로 들어왔을 때 광고·검색·열람 흐름을 이메일에서도 확인할 수 있게 보존합니다.
const SESSION_STARTED_AT = Number(sessionStorage.getItem('weco_session_started_at')) || Date.now()
sessionStorage.setItem('weco_session_started_at', String(SESSION_STARTED_AT))

// 광고가 멈춰도 다시 찾아오는 방문이 남는지 측정합니다.
// 개인 식별자는 만들지 않고, 같은 브라우저의 방문 횟수와 첫 방문 시점만 저장합니다.
const getVisitProfile = () => {
  const today = new Date().toISOString().slice(0, 10)
  try {
    const firstVisit = localStorage.getItem('weco_first_visit_date') || today
    const lastCountedDate = localStorage.getItem('weco_last_counted_visit_date')
    let visitCount = Number(localStorage.getItem('weco_visit_count') || 0)
    if (lastCountedDate !== today) {
      visitCount += 1
      localStorage.setItem('weco_visit_count', String(visitCount))
      localStorage.setItem('weco_last_counted_visit_date', today)
    }
    localStorage.setItem('weco_first_visit_date', firstVisit)
    const daysSinceFirstVisit = Math.max(0, Math.floor((Date.parse(today) - Date.parse(firstVisit)) / 86400000))
    return {
      visitor_type: visitCount > 1 ? 'returning' : 'new',
      visit_number: visitCount || 1,
      days_since_first_visit: daysSinceFirstVisit
    }
  } catch (_) {
    return { visitor_type: 'unknown', visit_number: 1, days_since_first_visit: 0 }
  }
}

const VISIT_PROFILE = getVisitProfile()

const rememberLeadJourney = () => {
  const attribution = getTrafficAttribution()
  const touch = {
    source: attribution.traffic_source,
    medium: attribution.traffic_medium,
    campaign: attribution.campaign_name,
    content: attribution.campaign_content,
    term: attribution.campaign_term,
    click_id: attribution.click_id,
    landing: location.pathname + location.search,
    referrer: document.referrer || 'direct',
    at: new Date().toISOString()
  }
  try {
    if (!localStorage.getItem('weco_first_touch')) localStorage.setItem('weco_first_touch', JSON.stringify(touch))
    localStorage.setItem('weco_last_touch', JSON.stringify(touch))
    const pages = JSON.parse(sessionStorage.getItem('weco_pages_viewed') || '[]')
    const current = location.pathname || '/'
    if (!pages.includes(current)) pages.push(current)
    sessionStorage.setItem('weco_pages_viewed', JSON.stringify(pages.slice(-20)))
  } catch (_) {}
}

const getLeadContext = () => {
  const attribution = getTrafficAttribution()
  let first = {}
  let last = {}
  let pages = []
  let projects = []
  try {
    first = JSON.parse(localStorage.getItem('weco_first_touch') || '{}')
    last = JSON.parse(localStorage.getItem('weco_last_touch') || '{}')
    pages = JSON.parse(sessionStorage.getItem('weco_pages_viewed') || '[]')
    projects = JSON.parse(sessionStorage.getItem('weco_projects_viewed') || '[]')
  } catch (_) {}
  const touchLabel = touch => `${touch.source || 'unknown'} / ${touch.medium || 'unknown'}${touch.referrer ? ` / ${touch.referrer}` : ''}`
  const seconds = Math.max(0, Math.round((Date.now() - SESSION_STARTED_AT) / 1000))
  return {
    first_touch: touchLabel(first),
    last_touch: touchLabel(last),
    campaign: attribution.campaign_name || 'unknown',
    content: attribution.campaign_content || 'unknown',
    term: attribution.campaign_term || 'unknown',
    click_id: attribution.click_id || 'unknown',
    first_landing: first.landing || location.pathname,
    submit_page: location.pathname,
    pages_viewed: pages.join(' → ') || location.pathname,
    projects_viewed: projects.join(', ') || '없음',
    time_to_lead: `${seconds}초`,
    device: `${innerWidth < 768 ? '모바일' : innerWidth < 1100 ? '태블릿' : 'PC'} / ${navigator.platform || 'unknown'}`
  }
}

rememberLeadJourney()
const trackEvent = (name, params = {}) => {
  const enriched = {
    hero_variant: window.WECO_HERO_VARIANT || 1,
    landing_segment: window.WECO_LANDING_SEGMENT || 'general',
    landing_path: location.pathname,
    ...VISIT_PROFILE,
    ...getTrafficAttribution(),
    ...params
  }
  if (typeof window.fbq === 'function') window.fbq('trackCustom', name, enriched)
  if (typeof window.gtag === 'function') window.gtag('event', name, enriched)
}

trackEvent('landing_view', {
  page_language: document.documentElement.lang || 'ko',
  is_paid_social: Boolean(window.WECO_IS_PAID_SOCIAL)
})

if (VISIT_PROFILE.visitor_type === 'returning') {
  trackEvent('return_visit', {
    page_language: document.documentElement.lang || 'ko'
  })
}

document.addEventListener('click', (event) => {
  const pageLanguage = document.documentElement.lang || 'ko'
  const link = event.target.closest('a')
  const conversionTarget = event.target.closest('[data-conversion]')
  const conversionHref = conversionTarget?.closest('a')?.getAttribute('href') || ''
  if (conversionTarget && !['#contact'].includes(conversionHref)) {
    trackEvent('primary_cta_click', {
      page_language: pageLanguage,
      cta_name: conversionTarget.dataset.conversion || 'unknown',
      cta_location: conversionTarget.closest('.sticky-bar') ? 'sticky_mobile'
        : conversionTarget.closest('.hero-actions') ? 'hero'
          : conversionTarget.closest('.marketing-bridge') ? 'hero_marketing'
            : 'page'
    })
  }
  if (link) {
    const href = link.getAttribute('href') || ''
    const linkParams = { page_language: pageLanguage, link_text: (link.textContent || '').trim().slice(0, 100) }
    if (href.startsWith('tel:')) {
      trackEvent('contact_cta_click', { ...linkParams, contact_method: 'phone' })
      trackEvent('phone_click', linkParams)
    }
    else if (href.startsWith('mailto:')) trackEvent('contact_cta_click', { ...linkParams, contact_method: 'email' })
    else if (href.includes('open.kakao.com/o/sBasXuKi')) {
      trackEvent('contact_cta_click', { ...linkParams, contact_method: 'kakao_openchat' })
      trackEvent('kakao_openchat_click', linkParams)
    }
    else if (/WECO_PORTFOLIO_2026\.pdf(?:$|[?#])/i.test(href)) trackEvent('portfolio_download', linkParams)
    else if (href === '#contact') trackEvent('contact_cta_click', { ...linkParams, contact_method: 'inquiry_form' })
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
    const projectName = project.querySelector('.proj-meta h3')?.textContent?.trim() || 'unknown'
    try {
      const projects = JSON.parse(sessionStorage.getItem('weco_projects_viewed') || '[]')
      if (!projects.includes(projectName)) projects.push(projectName)
      sessionStorage.setItem('weco_projects_viewed', JSON.stringify(projects.slice(-20)))
    } catch (_) {}
    trackEvent('project_view', {
      page_language: pageLanguage,
      project_name: projectName
    })
    trackEvent('project_click', {
      page_language: pageLanguage,
      project_name: projectName
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
        if (depth === 50) trackEvent('scroll_50', { page_language: document.documentElement.lang || 'ko' })
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
    trackEvent('engaged_30s', { page_language: document.documentElement.lang || 'ko' })
  }, 30000)

  let highIntentVisitSent = false
  setTimeout(() => {
    if (highIntentVisitSent || document.visibilityState !== 'visible') return
    highIntentVisitSent = true
    trackEvent('high_intent_visit_60s', { page_language: document.documentElement.lang || 'ko' })
  }, 60000)

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
