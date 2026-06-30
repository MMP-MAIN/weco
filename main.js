// ===== 클로드 인테리어 홈페이지 스크립트 =====
import { firebaseConfig } from './firebase-config.js'

const PHONE = '010-6330-5226' // 실제 번호로 교체

// ---- 인트로 리빌 종료 ----
;(() => {
  const intro = document.getElementById('intro')
  if (!intro) return
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('no-intro'); return
  }
  const close = () => { intro.classList.add('done'); setTimeout(() => intro.remove(), 900) }
  setTimeout(close, 2100)
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
menuToggle.addEventListener('click', () => gnb.classList.toggle('open'))
gnb.querySelectorAll('a').forEach(a => a.addEventListener('click', () => gnb.classList.remove('open')))

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

// ---- 시공사례 필터 ----
const filterTabs = document.getElementById('filterTabs')
if (filterTabs) {
  const works = document.querySelectorAll('#portfolioGrid .work')
  filterTabs.addEventListener('click', (e) => {
    const btn = e.target.closest('button')
    if (!btn) return
    filterTabs.querySelectorAll('button').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    const f = btn.dataset.filter
    works.forEach(w => w.classList.toggle('hidden', f !== 'all' && w.dataset.cat !== f))
  })
}

// ---- PROJECT 전용 오버레이 열기/닫기 ----
const projectView = document.getElementById('projectView')
const openProjects = () => {
  projectView.classList.add('open')
  if (window.__lenis) window.__lenis.stop() // Lenis 정지 → 오버레이 네이티브 스크롤 복구
  document.body.style.overflow = 'hidden'
  document.body.classList.add('motion-paused') // 오버레이 동안 히어로 캔버스 정지(부하 절감)
  // 커버 이미지 강제 로드 (오버레이 안에서 lazy 로딩이 안 걸리는 문제 방지)
  projectView.querySelectorAll('.proj-card .proj-img img').forEach((img) => {
    img.loading = 'eager'
    const s = img.getAttribute('src')
    if (s && !img.complete) img.setAttribute('src', s)
  })
}
const closeProjects = () => { projectView.classList.remove('open'); document.body.style.overflow = ''; if (window.__lenis) window.__lenis.start() }
document.getElementById('closeProjects')?.addEventListener('click', closeProjects)
// PROJECT 진입점: 섹션 버튼 + 내비/히어로의 #portfolio 링크
document.querySelectorAll('[data-open-projects], a[href="#portfolio"]').forEach(el => {
  el.addEventListener('click', (e) => { e.preventDefault(); e.stopImmediatePropagation(); gnb.classList.remove('open'); openProjects() })
})
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && projectView.classList.contains('open') && !document.querySelector('.lightbox.open')) closeProjects()
})

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
// ---- 카운트업 숫자 ----
const counters = [...document.querySelectorAll('[data-count]')]
let countersDone = false
const runCounters = () => {
  countersDone = true
  counters.forEach(el => {
    const target = parseInt(el.dataset.count, 10)
    const t0 = Date.now(), dur = 1400
    const iv = setInterval(() => {
      const p = Math.min(1, (Date.now() - t0) / dur)
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)))
      if (p >= 1) clearInterval(iv)
    }, 30)
  })
}

const marqueeEl = document.querySelector('.marquee')
const tick = () => {
  reveal()
  if (!countersDone && counters.length &&
      counters[0].getBoundingClientRect().top < window.innerHeight * 0.92) runCounters()
  quickFab.classList.toggle('show', window.scrollY > window.innerHeight * 0.7)
  // 화면 밖 무한 애니메이션 정지 (GPU 절약)
  const pastHero = window.scrollY > window.innerHeight * 1.1
  document.body.classList.toggle('motion-paused', pastHero)
  const hv = document.querySelector('#heroVideo video')
  if (hv && hv.src) { pastHero ? hv.pause() : (document.getElementById('heroVideo').classList.contains('playing') && hv.play().catch(() => {})) }
  if (marqueeEl) {
    const r = marqueeEl.getBoundingClientRect()
    marqueeEl.classList.toggle('paused', r.bottom < 0 || r.top > window.innerHeight)
  }
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

// 유형 선택 (상가/아파트/브랜딩)
const typeCards = document.getElementById('typeCards')
let selectedType = '상가'
typeCards?.addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return
  typeCards.querySelectorAll('button').forEach(x => x.classList.remove('active'))
  b.classList.add('active'); selectedType = b.dataset.value
})

// 견적문의 → FormSubmit.co (계정 불필요, 이메일로 수신)
const INQUIRY_ENDPOINT = 'https://formsubmit.co/ajax/storm2119@gmail.com'

const setStatus = (msg, ok) => {
  formStatus.textContent = msg
  formStatus.className = `form-status ${ok ? 'ok' : 'err'}`
}

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  const name = form.name.value.trim()
  const phone = form.phone.value.trim()

  if (!name || !phone) {
    setStatus('이름과 연락처를 입력해주세요.', false)
    return
  }

  submitBtn.disabled = true
  submitBtn.classList.add('sending')
  try {
    const res = await fetch(INQUIRY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        _subject: '[위코컴퍼니] 새 견적문의',
        _template: 'table',
        _captcha: 'false',
        이름: name,
        연락처: phone,
        유형: selectedType,
        예산: form.budget.value.trim() || '미입력',
        문의내용: form.message.value.trim() || '미입력'
      })
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok && (data.success === 'true' || data.success === true)) {
      form.reset()
      setStatus('의뢰서가 접수되었습니다. 검토 후 진행 가능 여부와 함께 연락드리겠습니다.', true)
    } else {
      throw new Error(data.message || 'submit failed')
    }
  } catch (err) {
    console.error(err)
    setStatus(`접수 중 오류가 발생했습니다. 전화(${PHONE})로 문의해주세요.`, false)
  } finally {
    submitBtn.disabled = false
    submitBtn.classList.remove('sending')
  }
})

// ===== 프리미엄 모션 (CDN 로드 실패 시 기본 동작 유지) =====
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches

// ---- Lenis 부드러운 관성 스크롤 ----
;(async () => {
  if (REDUCED) return
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
  if (REDUCED) return
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
      .from('.hero-en .spark', { scale: 0, rotation: -120, opacity: 0, duration: .7, ease: 'back.out(2.2)' }, '-=.45')
      .from('.hero-promise', { y: 22, opacity: 0, duration: .8 }, '-=.55')
      .from('.hero-actions .btn', { y: 18, opacity: 0, duration: .6, stagger: .12 }, '-=.5')
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
    return {
      photos: list.length ? list : (thumb ? [big(thumb.src)] : []),
      title: w.querySelector('.proj-meta h3')?.textContent || '',
      meta: w.querySelector('.proj-meta p')?.textContent || '',
      trigger: w.querySelector('.proj-img')
    }
  }).filter(i => i.photos.length)
  if (!items.length) return

  // 3열 그리드 갤러리
  const gv = document.createElement('div')
  gv.className = 'gallery-view'
  gv.innerHTML = `<div class="gv-bar container"><span class="gv-title"></span><button class="gv-close" aria-label="닫기">&times;</button></div><div class="gv-scroll" data-lenis-prevent><div class="gv-grid"></div></div>`
  document.body.appendChild(gv)
  const gvTitle = gv.querySelector('.gv-title')
  const gvGrid = gv.querySelector('.gv-grid')
  let curItem = 0

  // 확대 라이트박스
  const lb = document.createElement('div')
  lb.className = 'lightbox'
  lb.innerHTML = `<button class="lb-close" aria-label="닫기">&times;</button><button class="lb-prev" aria-label="이전">&#8249;</button><figure><img alt="" /><figcaption><strong></strong><b class="lb-count"></b></figcaption></figure><button class="lb-next" aria-label="다음">&#8250;</button>`
  document.body.appendChild(lb)
  const lbImg = lb.querySelector('img'), lbTitle = lb.querySelector('strong'), lbCount = lb.querySelector('.lb-count')
  let curPhoto = 0
  const renderLB = () => {
    const it = items[curItem]
    lbImg.src = it.photos[curPhoto]; lbImg.alt = it.title
    lbTitle.textContent = it.title
    lbCount.textContent = `${curPhoto + 1} / ${it.photos.length}`
  }
  const moveLB = (d) => { const n = items[curItem].photos.length; curPhoto = (curPhoto + d + n) % n; renderLB() }
  const openLB = (idx) => { curPhoto = idx; renderLB(); lb.classList.add('open') }
  const closeLB = () => lb.classList.remove('open')

  const openGallery = (i) => {
    curItem = i
    const it = items[i]
    gvTitle.textContent = it.title
    gvGrid.innerHTML = ''
    it.photos.forEach((src, idx) => {
      const im = document.createElement('img')
      im.loading = 'lazy'; im.src = src; im.alt = `${it.title} ${idx + 1}`
      im.addEventListener('click', () => openLB(idx))
      gvGrid.appendChild(im)
    })
    gv.querySelector('.gv-scroll').scrollTop = 0
    gv.classList.add('open'); document.body.style.overflow = 'hidden'
  }
  const closeGallery = () => {
    gv.classList.remove('open')
    document.body.style.overflow = projectView.classList.contains('open') ? 'hidden' : ''
  }

  items.forEach((it, i) => it.trigger.addEventListener('click', (e) => { e.preventDefault(); openGallery(i) }))
  gv.querySelector('.gv-close').addEventListener('click', closeGallery)
  lb.querySelector('.lb-close').addEventListener('click', closeLB)
  lb.querySelector('.lb-prev').addEventListener('click', () => moveLB(-1))
  lb.querySelector('.lb-next').addEventListener('click', () => moveLB(1))
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLB() })
  document.addEventListener('keydown', (e) => {
    if (lb.classList.contains('open')) {
      if (e.key === 'Escape') closeLB()
      if (e.key === 'ArrowLeft') moveLB(-1)
      if (e.key === 'ArrowRight') moveLB(1)
    } else if (gv.classList.contains('open') && e.key === 'Escape') closeGallery()
  })
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
