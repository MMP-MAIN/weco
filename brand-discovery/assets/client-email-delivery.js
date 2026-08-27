(function () {
  'use strict';

  var FORM_ENDPOINT = 'https://formsubmit.co/ajax/storm2119@gmail.com';
  var MAX_FILE_COUNT = 5;
  var MAX_TOTAL_BYTES = 9 * 1024 * 1024;
  var emailValue = '';

  function trackSubmitError(reason, extra) {
    var params = Object.assign({ form_name: 'brand_discovery', error_reason: reason }, extra || {});
    if (typeof window.gtag === 'function') window.gtag('event', 'discovery_submit_error', params);
    if (typeof window.fbq === 'function') window.fbq('trackCustom', 'DiscoverySubmitError', params);
  }

  function showFileError(message) {
    var zone = document.querySelector('.upload-zone');
    if (!zone) return;
    var error = document.querySelector('[data-file-error]');
    if (!error) {
      error = document.createElement('div');
      error.className = 'validation-error';
      error.setAttribute('data-file-error', 'true');
      zone.insertAdjacentElement('afterend', error);
    }
    error.textContent = '! ' + message;
  }

  function clearFileError() {
    document.querySelector('[data-file-error]')?.remove();
  }

  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
  }

  function addEmailField() {
    var contactCard = document.querySelector('.contact-card');
    if (!contactCard || contactCard.querySelector('[data-client-email]')) return;

    var twoColumn = contactCard.querySelector('.two');
    if (!twoColumn) return;

    var field = document.createElement('label');
    field.className = 'field';
    field.setAttribute('data-client-email', 'true');
    field.innerHTML = '<span>결과 받을 이메일 *</span>' +
      '<input type="email" inputmode="email" autocomplete="email" ' +
      'placeholder="name@example.com" aria-label="결과 받을 이메일" required>';

    twoColumn.insertAdjacentElement('afterend', field);
    var input = field.querySelector('input');
    input.value = emailValue;
    input.addEventListener('input', function () {
      emailValue = input.value.trim();
      input.setCustomValidity('');
    });
  }

  document.addEventListener('click', function (event) {
    var button = event.target.closest && event.target.closest('button.submit');
    if (!button) return;
    var input = document.querySelector('[data-client-email] input');
    emailValue = input ? input.value.trim() : emailValue;
    if (validEmail(emailValue)) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    if (input) {
      input.setCustomValidity('결과를 받을 이메일을 정확히 입력해주세요.');
      input.reportValidity();
      input.focus();
    }
  }, true);

  document.addEventListener('change', function (event) {
    var input = event.target;
    if (!(input instanceof HTMLInputElement) || input.type !== 'file') return;
    var files = Array.from(input.files || []);
    var total = files.reduce(function (sum, file) { return sum + file.size; }, 0);
    if (files.length > MAX_FILE_COUNT || total > MAX_TOTAL_BYTES) {
      event.stopImmediatePropagation();
      input.value = '';
      var message = files.length > MAX_FILE_COUNT
        ? '첨부파일은 최대 5개까지 올릴 수 있습니다.'
        : '첨부파일 전체 용량은 9MB 이하로 줄여주세요.';
      showFileError(message);
      trackSubmitError('attachment_limit', { file_count: files.length, total_mb: Math.round(total / 1048576) });
      return;
    }
    clearFileError();
  }, true);

  var originalFetch = window.fetch.bind(window);
  window.fetch = function (resource, options) {
    var url = typeof resource === 'string' ? resource : (resource && resource.url) || '';
    var nextOptions = options ? Object.assign({}, options) : {};

    if (url.indexOf('/api/projects') !== -1 && nextOptions.method === 'POST' && typeof nextOptions.body === 'string') {
      try {
        var projectBody = JSON.parse(nextOptions.body);
        projectBody.rawAnswers = Object.assign({}, projectBody.rawAnswers, { email: emailValue });
        nextOptions.body = JSON.stringify(projectBody);
      } catch (_) {}
    }

    if (url === FORM_ENDPOINT && typeof nextOptions.body === 'string') {
      try {
        var mailBody = JSON.parse(nextOptions.body);
        mailBody['고객 이메일'] = emailValue;
        mailBody._replyto = emailValue;
        nextOptions.body = JSON.stringify(mailBody);
      } catch (_) {}
    }

    if (url === FORM_ENDPOINT && nextOptions.body instanceof FormData) {
      var formData = nextOptions.body;
      formData.set('고객 이메일', emailValue);
      formData.set('_replyto', emailValue);
      var files = Array.from(formData.values()).filter(function (value) { return value instanceof File; });
      var totalBytes = files.reduce(function (sum, file) { return sum + file.size; }, 0);
      sessionStorage.setItem('weco_discovery_pending', JSON.stringify({
        at: new Date().toISOString(),
        email: emailValue,
        fileCount: files.length,
        totalBytes: totalBytes
      }));

      return originalFetch(resource, nextOptions).then(function (response) {
        if (response.ok) {
          sessionStorage.removeItem('weco_discovery_pending');
          return response;
        }
        if (!files.length) {
          trackSubmitError('formsubmit_http', { status: response.status });
          return response;
        }
        trackSubmitError('attachment_submit_http', { status: response.status, file_count: files.length });
        var textOnly = new FormData();
        formData.forEach(function (value, key) {
          if (!(value instanceof File)) textOnly.append(key, value);
        });
        textOnly.append('첨부파일 상태', '첨부 전송 문제로 설문 원문을 우선 접수했습니다. 고객에게 파일을 별도로 요청해주세요.');
        return originalFetch(resource, Object.assign({}, nextOptions, { body: textOnly }));
      }).catch(function (error) {
        trackSubmitError('network', { file_count: files.length });
        throw error;
      });
    }

    return originalFetch(resource, nextOptions);
  };

  new MutationObserver(addEmailField).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
  document.addEventListener('DOMContentLoaded', addEmailField);
})();
