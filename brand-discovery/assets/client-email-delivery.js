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

  function diagnosisMessage(payload) {
    var diagnosis = {};
    try {
      diagnosis = JSON.parse(payload['무료 1차 브랜드 진단'] || '{}');
    } catch (_) {}

    var projectId = payload['프로젝트 ID'] || '-';
    var brandName = payload['브랜드명'] || '고객 브랜드';
    var lines = [
      brandName + '님의 무료 브랜드 분석이 접수되었습니다.',
      '',
      '프로젝트 번호: ' + projectId,
      '',
      '[가장 강한 자산]',
      diagnosis.CORE || '제출한 내용을 바탕으로 확인 중입니다.',
      '',
      '[선택할 고객과 순간]',
      diagnosis.TARGET || '고객과 이용 순간을 구체화해보세요.',
      '',
      '[성장 방향]',
      diagnosis.TO_BE || '원하는 미래상을 하나의 방향으로 좁혀보세요.',
      '',
      '[지금 먼저 확인할 일]',
      diagnosis.CONFLICT || '시장과 운영 조건을 확인해 가능성을 구체화하세요.',
      '',
      '본 결과는 입력 내용을 바탕으로 한 무료 1차 진단이며 사업 성공을 보장하는 평가가 아닙니다.',
      'WECO COMPANY · https://wecocompany.com/'
    ];
    return lines.join('\n');
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
        mailBody._replyto = emailValue;
        mailBody._autoresponse = diagnosisMessage(mailBody);
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
