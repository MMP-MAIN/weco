(() => {
  const enhance = () => {
    const panel = document.querySelector('.form-panel')
    if (!panel || panel.dataset.progressiveReady === 'true') return

    const fields = [...panel.querySelectorAll('.field')]
    const optionalFields = fields.filter((field) => {
      const label = field.querySelector(':scope > span')?.textContent?.trim() || ''
      return label && !label.includes('*')
    })
    if (!optionalFields.length) return

    optionalFields.forEach((field) => field.classList.add('weco-optional-field'))
    const toggle = document.createElement('button')
    toggle.type = 'button'
    toggle.className = 'weco-optional-toggle'
    toggle.innerHTML = `선택 질문 ${optionalFields.length}개 더 작성하기 <span aria-hidden="true">＋</span>`
    toggle.setAttribute('aria-expanded', 'false')
    toggle.addEventListener('click', () => {
      const open = panel.classList.toggle('weco-show-optionals')
      toggle.setAttribute('aria-expanded', String(open))
      toggle.innerHTML = open
        ? `선택 질문 접기 <span aria-hidden="true">−</span>`
        : `선택 질문 ${optionalFields.length}개 더 작성하기 <span aria-hidden="true">＋</span>`
    })
    panel.querySelector('.form-footer')?.before(toggle)
    panel.dataset.progressiveReady = 'true'
  }

  const observer = new MutationObserver(() => {
    const panel = document.querySelector('.form-panel')
    if (panel && panel.dataset.progressiveReady !== 'true') enhance()
  })
  observer.observe(document.documentElement, { childList: true, subtree: true })
  document.addEventListener('DOMContentLoaded', enhance)
})()
