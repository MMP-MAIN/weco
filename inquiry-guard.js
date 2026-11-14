(function () {
  'use strict';
  if (window.WECO_FORM_GUARD) return;

  // Browser-side friction only. This does not authenticate requests or replace
  // a server-verified challenge / IP rate limit at the form delivery service.
  var key = 'weco_inquiry_accepted_at_v1';
  var cooldown = 60000;
  var lastAccepted = 0;
  var busy = false;
  var guards = new WeakMap();
  function acceptedAt() {
    var value = lastAccepted;
    try {
      var stored = Number(localStorage.getItem(key)) || 0;
      if (stored > 0 && stored <= Date.now() && Date.now() - stored < cooldown) value = Math.max(value, stored);
      else localStorage.removeItem(key);
    } catch (_) {}
    return value > 0 && value <= Date.now() ? value : 0;
  }
  function attach(container) {
    if (!container) return null;
    if (guards.has(container)) return guards.get(container);
    var trap = container.querySelector('input[name="_honey"]');
    if (!trap) {
      var label = document.createElement('label');
      label.hidden = true;
      label.style.display = 'none';
      label.setAttribute('aria-hidden', 'true');
      label.textContent = '이 칸은 비워 두세요.';
      trap = document.createElement('input');
      trap.type = 'text';
      trap.name = '_honey';
      trap.tabIndex = -1;
      trap.autocomplete = 'off';
      trap.setAttribute('data-lpignore', 'true');
      label.appendChild(trap);
      container.appendChild(label);
    }
    var guard = {
      honeypot: function () { return String(trap.value || '').trim(); },
      check: function () {
        if (guard.honeypot()) return { allowed: false, code: 'honeypot', message: '접수를 진행하지 못했습니다. 페이지를 새로 열어 다시 시도해 주세요.' };
        if (busy) return { allowed: false, code: 'busy', message: '문의가 전송 중입니다. 잠시 기다려 주세요.' };
        var previous = acceptedAt();
        if (previous && Date.now() - previous < cooldown) return { allowed: false, code: 'cooldown', message: '조금 전 문의가 접수됐습니다. 추가 문의는 잠시 후 다시 보내 주세요.' };
        return { allowed: true };
      },
      begin: function () { var result = guard.check(); if (result.allowed) busy = true; return result; },
      accepted: function () {
        lastAccepted = Date.now();
        // A timestamp only: no name, phone, message, file or fingerprint.
        try { localStorage.setItem(key, String(lastAccepted)); } catch (_) {}
      },
      release: function () { busy = false; }
    };
    guards.set(container, guard);
    return guard;
  }
  window.WECO_FORM_GUARD = { attach: attach };
})();
