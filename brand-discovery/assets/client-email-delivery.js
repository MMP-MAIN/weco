(function () {
  'use strict';

  var FORM_ENDPOINT = 'https://formsubmit.co/ajax/storm2119@gmail.com';
  var emailValue = '';

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
        nextOptions.body = JSON.stringify(mailBody);
      } catch (_) {}
    }

    return originalFetch(resource, nextOptions);
  };

  new MutationObserver(addEmailField).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
  document.addEventListener('DOMContentLoaded', addEmailField);
})();
