// Emit only fixed field identifiers and states, never values or validation messages.
export function createInquiryTracking(form, emit, baseParams = {}) {
  const textFields = new Set(['name', 'phone', 'message', 'budget'])
  const fields = new Set([...textFields, 'privacyConsent'])
  const errors = new Set(['value_missing', 'type_mismatch', 'pattern_mismatch', 'invalid'])
  let started = false
  let attemptNumber = 0
  let validationCycle = false
  const seenErrors = new Set()
  const params = () => ({ ...baseParams, attempt_number: attemptNumber })
  const send = (event, extra = {}) => {
    try { emit(event, { ...params(), ...extra }) } catch (_) { /* Tracking must not block an inquiry. */ }
  }
  const inputStarted = () => {
    if (started) return
    const hasInput = [...textFields].some(name => String(form.elements.namedItem(name)?.value || '').trim())
    if (!hasInput) return
    started = true
    send('inquiry_input_start')
  }
  const attempt = () => {
    inputStarted() // Also covers browser-restored/autofilled values on submit.
    if (!validationCycle) {
      validationCycle = true
      attemptNumber++
      seenErrors.clear()
      send('inquiry_submit_attempt')
      queueMicrotask(() => { validationCycle = false })
    }
  }
  const validationError = (field, reason) => {
    attempt()
    const safeField = fields.has(field) ? field : 'other'
    const safeReason = errors.has(reason) ? reason : 'invalid'
    const key = `${safeField}:${safeReason}`
    if (seenErrors.has(key)) return
    seenErrors.add(key)
    send('inquiry_validation_error', { field_name: safeField, error_type: safeReason })
  }
  const onInput = event => { if (textFields.has(event.target?.name)) inputStarted() }
  form.addEventListener('input', onInput)
  form.addEventListener('change', onInput)
  form.addEventListener('invalid', event => {
    const validity = event.target?.validity || {}
    const reason = validity.valueMissing ? 'value_missing'
      : validity.typeMismatch ? 'type_mismatch'
        : validity.patternMismatch ? 'pattern_mismatch' : 'invalid'
    validationError(event.target?.name, reason)
  }, true) // Native required-field failures occur before the submit event.
  form.addEventListener('reset', () => { started = false })
  return { attempt, validationError, params }
}
