(function () {
  'use strict';

  var measurementId = 'G-45Q0B2B2XR';
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };

  window.gtag('js', new Date());
  window.gtag('set', 'linker', {
    domains: ['wecocompany.com', 'mpmarketing.co.kr']
  });
  window.gtag('config', measurementId, {
    send_page_view: true,
    page_location: window.location.href,
    page_hostname: window.location.hostname
  });
})();
