(function () {
  'use strict';

  if (window.__wecoWebVitalsStarted) return;
  window.__wecoWebVitalsStarted = true;

  var script = document.createElement('script');
  script.defer = true;
  script.src = 'vendor/web-vitals/web-vitals.attribution.iife.js?v=6.2.1';
  script.onload = function () {
    if (!window.webVitals || typeof window.gtag !== 'function') return;

    function sendMetric(metric) {
      var attribution = metric.attribution || {};
      var target = attribution.largestShiftTarget || attribution.interactionTarget || attribution.target || '';
      var value = metric.name === 'CLS' ? Math.round(metric.value * 1000) : Math.round(metric.value);

      window.gtag('event', 'web_vital', {
        metric_name: metric.name,
        metric_value: value,
        metric_raw_value: Number(metric.value.toFixed(3)),
        metric_delta: Number(metric.delta.toFixed(3)),
        metric_id: metric.id,
        metric_rating: metric.rating,
        navigation_type: metric.navigationType || 'navigate',
        debug_target: String(target).slice(0, 100),
        page_path: window.location.pathname,
        non_interaction: true
      });
    }

    window.webVitals.onCLS(sendMetric);
    window.webVitals.onINP(sendMetric);
    window.webVitals.onLCP(sendMetric);
    window.webVitals.onFCP(sendMetric);
    window.webVitals.onTTFB(sendMetric);
  };
  document.head.appendChild(script);
})();
