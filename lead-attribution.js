(function () {
  'use strict';
  if (window.WECO_JOURNEY) return;

  // Capture the entry on every public page, before an internal link hides its referrer.
  // No network requests, visitor IDs, form values or search-query extraction here.
  var SESSION_KEY = 'weco_journey_v2';
  var FIRST_KEY = 'weco_first_touch_v2';
  var SESSION_TTL = 30 * 60 * 1000;
  var FIRST_TTL = 30 * 24 * 60 * 60 * 1000;
  var now = Date.now();
  function read(area, key) {
    try { return JSON.parse(window[area].getItem(key) || 'null'); } catch (_) { return null; }
  }
  function write(area, key, value) {
    try { window[area].setItem(key, JSON.stringify(value)); } catch (_) {}
  }
  function clean(value) {
    var text = String(value || '').trim().replace(/[\r\n\t<>]/g, '').slice(0, 160);
    // Campaign labels must never become an accidental email/phone transport.
    return /@|(?:\+?82[- .]?)?0?1[016789][- .]?\d{3,4}[- .]?\d{4}/.test(text) ? '' : text;
  }
  function url(value) {
    try { var parsed = new URL(value, location.href); return /^https?:$/.test(parsed.protocol) ? parsed : null; } catch (_) { return null; }
  }
  function path(value) {
    var parsed = url(value);
    return parsed ? clean(parsed.pathname).slice(0, 240) || '/' : '/';
  }
  function own(host) {
    return host === location.hostname || host === 'wecocompany.com' || host === 'www.wecocompany.com';
  }
  var ref = document.referrer ? url(document.referrer) : null;
  var external = Boolean(ref && !own(ref.hostname));
  // Referrer queries can contain search words or personal data: retain only host/path.
  var referrer = external ? ref.origin + path(ref.href) : '';
  var query = new URLSearchParams(location.search);
  var campaign = {
    source: clean(query.get('utm_source')),
    medium: clean(query.get('utm_medium')),
    campaign: clean(query.get('utm_campaign')),
    content: clean(query.get('utm_content')),
    term: clean(query.get('utm_term'))
  };
  var clickType = ['gclid', 'msclkid', 'fbclid', 'ttclid'].find(function (key) { return !!query.get(key); });
  var clickId = clickType ? clean(query.get(clickType)) : '';
  function inferred() {
    var host = ref ? ref.hostname.toLowerCase() : '';
    if (external) {
      if (/^(?:m\.)?search\.naver\.com$/.test(host)) return ['naver', 'organic'];
      if (/^(?:(?:www|m)\.)?google\.[a-z.]+$/.test(host)) return ['google', 'organic'];
      if (/^(?:www\.)?bing\.com$/.test(host)) return ['bing', 'organic'];
      if (/(^|\.)(instagram\.com|facebook\.com|tiktok\.com)$/.test(host)) return [host.includes('instagram') ? 'instagram' : host.includes('facebook') ? 'facebook' : 'tiktok', 'social'];
      if (/(^|\.)(chatgpt\.com|perplexity\.ai|claude\.ai)$/.test(host) || host === 'gemini.google.com') return [host, 'ai-assistant'];
      return [host, 'referral'];
    }
    return ref ? ['unknown', 'unknown'] : ['direct', 'direct'];
  }
  var inferredTraffic = inferred();
  var explicit = Boolean(campaign.source || campaign.medium || clickType);
  var source = campaign.source || inferredTraffic[0];
  var medium = campaign.medium || inferredTraffic[1];
  var evidence = external ? 'external_referrer' : ref ? 'internal_entry_missing_source' : 'no_referrer';
  if (campaign.source || campaign.medium) {
    // An omitted UTM medium must not be guessed as paid or copied from a prior campaign.
    medium = campaign.medium || 'unknown';
    source = campaign.source || (external ? inferredTraffic[0] : 'unknown');
    evidence = 'utm';
  } else if (clickType) {
    source = {gclid: 'google', msclkid: 'bing', fbclid: 'facebook', ttclid: 'tiktok'}[clickType];
    // Facebook/TikTok click IDs also occur on ordinary shared links, not just ads.
    medium = /^(gclid|msclkid)$/.test(clickType) ? 'cpc' : 'social';
    evidence = 'click_id_only';
  }
  var touch = {
    source: source, medium: medium,
    campaign: campaign.campaign || 'unknown', content: campaign.content || 'unknown',
    term: campaign.term || 'unknown', click_id: clickId || 'unknown',
    landing: path(location.href), referrer: referrer, evidence: evidence, at: now
  };
  var state = read('sessionStorage', SESSION_KEY);
  function validTouch(item) {
    return item && ['source', 'medium', 'campaign', 'content', 'term', 'click_id', 'landing', 'referrer', 'evidence']
      .every(function (key) { return typeof item[key] === 'string'; }) && Number.isFinite(item.at);
  }
  var valid = state && state.version === 2 && Array.isArray(state.pages) && state.pages.every(function (item) { return typeof item === 'string'; }) && validTouch(state.touch) && typeof state.entry === 'string' &&
    Number.isFinite(state.startedAt) && Number.isFinite(state.lastAt) && now >= state.lastAt && now - state.lastAt < SESSION_TTL;
  if (!valid) state = {version: 2, startedAt: now, lastAt: now, entry: touch.landing, touch: touch, pages: []};
  // Same-site navigation is never a new acquisition, even if its URL repeats a UTM.
  if (valid && (!ref || external) && (explicit || external)) state.touch = touch;
  if (!state.pages.includes(touch.landing)) state.pages.push(touch.landing);
  state.pages = state.pages.slice(-20);
  state.lastAt = now;
  var first = read('localStorage', FIRST_KEY);
  if (!validTouch(first) || now < first.at || now - first.at >= FIRST_TTL ||
      (first.source === 'unknown' && state.touch.source !== 'unknown')) {
    first = state.touch;
    write('localStorage', FIRST_KEY, first);
  }
  function analytics() {
    return {
      traffic_source: state.touch.source, traffic_medium: state.touch.medium,
      campaign_name: state.touch.campaign, campaign_content: state.touch.content,
      campaign_term: state.touch.term, attribution_basis: state.touch.evidence,
      entry_path: state.entry
    };
  }
  function persist() {
    state.lastAt = Date.now();
    write('sessionStorage', SESSION_KEY, state);
    // Compatibility with existing first-screen personalization, without click identifiers.
    write('sessionStorage', 'weco_attribution', analytics());
  }
  function label(item) {
    return item.source + ' / ' + item.medium + (item.referrer ? ' / ' + item.referrer : '');
  }
  window.WECO_JOURNEY = {
    analytics: analytics,
    context: function () {
      persist();
      return {
        first_touch: label(first), last_touch: label(state.touch),
        campaign: state.touch.campaign, content: state.touch.content, term: state.touch.term,
        click_id: state.touch.click_id,
        first_landing: first.landing, session_landing: state.entry,
        submit_page: path(location.href), pages_viewed: state.pages.join(' → '),
        source_evidence: state.touch.evidence, external_referrer: state.touch.referrer || '없음',
        time_to_lead: Math.max(0, Math.round((Date.now() - state.startedAt) / 1000)) + '초'
      };
    }
  };
  persist();
  // Refresh activity without tracking keystrokes, pointer positions or field contents.
  ['click', 'scroll', 'pagehide'].forEach(function (name) {
    window.addEventListener(name, function () {
      if (name === 'pagehide' || Date.now() - state.lastAt >= 15000) persist();
    }, {passive: true});
  });
})();
