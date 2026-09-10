(() => {
  const panels = new WeakMap()

  const enhance = () => {
    const panel = document.querySelector('.form-panel')
    if (!panel) return

    const fields = [...panel.querySelectorAll('.field')]
    const labels = fields.map((field) => field.querySelector(':scope > span')?.textContent?.trim() || '')
    const required = fields.map((field, index) => labels[index].includes('*') || !!field.querySelector('[required]'))
    const step = document.querySelector('.step-number')?.textContent?.trim() || ''
    const footer = panel.querySelector('.form-footer')
    const previous = panels.get(panel)
    const sameStep = previous?.step === step
    const sameQuestions = sameStep && previous.fields.length === fields.length &&
      fields.every((field, index) => previous.fields[index] === field && previous.labels[index] === labels[index] && previous.required[index] === required[index])

    // React reuses .form-panel across steps. Only question-set changes need rebuilding;
    // input edits and our own mutations must preserve the open state and keyboard focus.
    if (sameQuestions && previous.footer === footer && (!previous.toggle || panel.contains(previous.toggle))) return

    previous?.fields.forEach((field) => field.classList.remove('weco-optional-field'))
    const optionalFields = fields.filter((field, index) => labels[index] && !required[index])
    const state = {
      step, fields, labels, required, footer,
      open: sameStep ? previous.open : false,
      toggle: sameStep ? previous.toggle : null,
    }
    if (!sameStep) previous?.toggle?.remove()
    panels.set(panel, state)
    panel.classList.toggle('weco-show-optionals', state.open)
    optionalFields.forEach((field) => field.classList.add('weco-optional-field'))

    if (!optionalFields.length || !footer) {
      state.toggle?.remove()
      state.toggle = null
      panel.dataset.progressiveReady = 'true'
      return
    }

    const updateToggle = () => {
      const current = panels.get(panel)
      const count = current.fields.filter((field, index) => current.labels[index] && !current.required[index]).length
      current.toggle.setAttribute('aria-expanded', String(current.open))
      current.toggle.textContent = current.open ? '선택 질문 접기 −' : `선택 질문 ${count}개 더 작성하기 ＋`
    }
    if (!state.toggle) {
      const toggle = document.createElement('button')
      toggle.type = 'button'
      toggle.className = 'weco-optional-toggle'
      toggle.addEventListener('click', () => {
        const current = panels.get(panel)
        current.open = !current.open
        panel.classList.toggle('weco-show-optionals', current.open)
        updateToggle()
      })
      state.toggle = toggle
    }
    // Move only the enhancer-owned button; never wrap/remove React's form elements.
    footer.before(state.toggle)
    updateToggle()
    panel.dataset.progressiveReady = 'true'
  }

  const observer = new MutationObserver(enhance)
  observer.observe(document.documentElement, { childList: true, characterData: true, subtree: true })
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhance)
  } else {
    enhance()
  }
})()
