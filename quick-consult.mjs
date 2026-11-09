import { getInquiryContext, inquiryEventParams } from './inquiry-context.mjs?v=11'
import { createInquiryTracking } from './inquiry-tracking.mjs?v=1'
import { getLeadContext, inquiryPayload, sendInquiry } from './inquiry-delivery.mjs?v=1'

const bar = document.getElementById('quick-consult')
const form = bar.querySelector('form')
const inquiryId = form.dataset.inquiry
const context = inquiryId ? getInquiryContext(`?inquiry=${inquiryId}`) : null
const submit = form.querySelector('button[type="submit"]')
const status = form.querySelector('[role="status"]')
const nameInput = form.elements.namedItem('name')
const phoneInput = form.elements.namedItem('phone')
const consent = form.elements.namedItem('privacyConsent')
const fields = [nameInput, phoneInput, consent]
const root = document.documentElement
const emit = (event, params) => {
  window.gtag?.('event', event, params)
  window.fbq?.('trackCustom', event, params)
}
const tracking = createInquiryTracking(form, emit, {
  form_name: 'quick_consult',
  ...inquiryEventParams(context),
  page_language: root.lang || 'ko'
})

function showStatus(message, state) {
  status.textContent = message
  status.dataset.state = state
}

function syncSpace() {
  root.style.setProperty('--quick-consult-height', `${bar.offsetHeight}px`)
}

const viewport = window.visualViewport
function syncKeyboard() {
  const editing = [nameInput, phoneInput].includes(document.activeElement)
  const inset = editing && viewport
    ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
    : 0
  bar.style.setProperty('--quick-consult-keyboard', `${inset}px`)
}

form.addEventListener('focusin', syncKeyboard)
form.addEventListener('focusout', () => requestAnimationFrame(syncKeyboard))
viewport?.addEventListener('resize', syncKeyboard)
viewport?.addEventListener('scroll', syncKeyboard)
window.addEventListener('resize', syncSpace)
if (typeof ResizeObserver === 'function') new ResizeObserver(syncSpace).observe(bar)

form.addEventListener('submit', async event => {
  event.preventDefault()
  if (submit.disabled) return
  tracking.attempt()
  const name = nameInput.value.trim()
  const phone = phoneInput.value.trim()
  const digitCount = phone.replace(/\D/g, '').length
  if (!name) {
    tracking.validationError('name', 'value_missing')
    showStatus('이름을 입력해 주세요.', 'error')
    nameInput.focus()
    return
  }
  if (!/^\+?[0-9 ()-]+$/.test(phone) || digitCount < 7 || digitCount > 15) {
    tracking.validationError('phone', 'pattern_mismatch')
    showStatus('연락받을 전화번호를 확인해 주세요.', 'error')
    phoneInput.focus()
    return
  }
  if (!consent.checked) {
    tracking.validationError('privacyConsent', 'value_missing')
    consent.reportValidity()
    return
  }

  submit.disabled = true
  fields.forEach(field => { field.disabled = true })
  submit.textContent = '전송 중'
  form.setAttribute('aria-busy', 'true')
  showStatus('', '')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20000)
  try {
    await sendInquiry(inquiryPayload({
      name, phone, context, leadContext: getLeadContext(), quick: true
    }), controller.signal)
    try {
      emit('generate_lead', { ...tracking.params(), lead_status: 'accepted_by_form_service' })
    } catch (_) { /* The inquiry is already accepted. */ }
    form.reset()
    showStatus('상담 요청이 접수됐어요. 남겨주신 번호로 안내드릴게요.', 'success')
  } catch (error) {
    showStatus('접수를 확인하지 못했어요. 입력값은 남아 있으니 다시 시도하기 전에 접수 여부를 확인해 주세요.', 'error')
    try {
      emit('form_submit_error', {
        ...tracking.params(),
        error_type: error?.name === 'AbortError' ? 'timeout' : error?.name === 'TypeError' ? 'network_error' : 'response_error'
      })
    } catch (_) { /* Tracking cannot prevent a retry. */ }
  } finally {
    clearTimeout(timer)
    fields.forEach(field => { field.disabled = false })
    submit.disabled = false
    submit.textContent = '보내기'
    form.removeAttribute('aria-busy')
    syncSpace()
  }
})

if (!form.hasAttribute('data-inquiry') || context) {
  bar.hidden = false
  syncSpace()
}
