(() => {
  const config = window.WECO_ADMIN_CONFIG || {}
  const property = `properties/${config.propertyId}`
  const scope = 'https://www.googleapis.com/auth/analytics.readonly'
  let tokenClient
  let accessToken = ''
  let days = 30

  const $ = id => document.getElementById(id)
  const fmt = new Intl.NumberFormat('ko-KR')
  const authBtn = $('authBtn')
  const loginBtn = $('loginBtn')
  const refreshBtn = $('refreshBtn')

  function setStatus(text, connected = false) {
    $('status').className = `status${connected ? ' connected' : ''}`
    $('status').innerHTML = `<i></i>${text}`
  }

  function waitForGoogle() {
    if (window.google?.accounts?.oauth2) return Promise.resolve()
    return new Promise((resolve, reject) => {
      let tries = 0
      const timer = setInterval(() => {
        if (window.google?.accounts?.oauth2) { clearInterval(timer); resolve() }
        if (++tries > 100) { clearInterval(timer); reject(new Error('Google 로그인 모듈을 불러오지 못했습니다.')) }
      }, 100)
    })
  }

  async function api(method, body) {
    const url = `https://analyticsdata.googleapis.com/v1beta/${property}:${method}`
    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error?.message || 'Analytics 데이터를 불러오지 못했습니다.')
    return data
  }

  const metric = (row, i = 0) => Number(row?.metricValues?.[i]?.value || 0)
  const dimension = (row, i = 0) => row?.dimensionValues?.[i]?.value || '–'

  async function loadDashboard() {
    setStatus('데이터 불러오는 중', true)
    const dateRanges = [{ startDate: `${days}daysAgo`, endDate: 'today' }]
    const [live, summary, trend, sources, pages, devices, inquiry] = await Promise.all([
      api('runRealtimeReport', { metrics: [{ name: 'activeUsers' }] }),
      api('runReport', { dateRanges, metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'userEngagementDuration' }] }),
      api('runReport', { dateRanges, dimensions: [{ name: 'date' }], metrics: [{ name: 'activeUsers' }], orderBys: [{ dimension: { dimensionName: 'date' } }] }),
      api('runReport', { dateRanges, dimensions: [{ name: 'sessionDefaultChannelGroup' }], metrics: [{ name: 'sessions' }], orderBys: [{ metric: { metricName: 'sessions' }, desc: true }], limit: 8 }),
      api('runReport', { dateRanges, dimensions: [{ name: 'pageTitle' }], metrics: [{ name: 'screenPageViews' }], orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }], limit: 8 }),
      api('runReport', { dateRanges, dimensions: [{ name: 'deviceCategory' }], metrics: [{ name: 'activeUsers' }], orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }] }),
      api('runReport', { dateRanges, dimensions: [{ name: 'eventName' }], metrics: [{ name: 'eventCount' }], dimensionFilter: { filter: { fieldName: 'eventName', inListFilter: { values: ['generate_lead'] } } } })
    ])

    const s = summary.rows?.[0]
    const users = metric(s, 0)
    $('liveUsers').textContent = fmt.format(metric(live.rows?.[0]))
    $('users').textContent = fmt.format(users)
    $('sessions').textContent = fmt.format(metric(s, 1))
    $('engagement').textContent = users ? `${Math.round(metric(s, 2) / users)}초` : '0초'
    $('inquiries').textContent = fmt.format((inquiry.rows || []).reduce((n, row) => n + metric(row), 0))
    renderTrend(trend.rows || [])
    renderBars(sources.rows || [])
    renderPages(pages.rows || [])
    renderDevices(devices.rows || [])
    $('setupPanel').hidden = true
    $('dashboard').hidden = false
    refreshBtn.hidden = false
    authBtn.textContent = '계정 다시 연결'
    setStatus('GA4 연결됨', true)
    $('updatedAt').textContent = `마지막 업데이트 ${new Date().toLocaleString('ko-KR')}`
    document.body.classList.remove('locked')
    document.body.classList.add('authenticated')
  }

  function renderTrend(rows) {
    const max = Math.max(...rows.map(r => metric(r)), 1)
    $('trendChart').innerHTML = rows.map(r => `<div class="col" style="height:${Math.max(3, metric(r) / max * 100)}%"><span>${dimension(r)} · ${fmt.format(metric(r))}명</span></div>`).join('') || '<p class="empty">표시할 데이터가 없습니다.</p>'
  }
  function renderBars(rows) {
    const max = Math.max(...rows.map(r => metric(r)), 1)
    $('sourceChart').innerHTML = rows.map(r => `<div class="bar-row"><span>${dimension(r)}</span><div class="bar-track"><div class="bar-fill" style="width:${metric(r) / max * 100}%"></div></div><strong>${fmt.format(metric(r))}</strong></div>`).join('') || '<p class="empty">표시할 데이터가 없습니다.</p>'
  }
  function renderPages(rows) {
    $('pageTable').innerHTML = rows.map(r => `<div class="table-row"><span>${dimension(r)}</span><span>${fmt.format(metric(r))}</span></div>`).join('') || '<p class="empty">표시할 데이터가 없습니다.</p>'
  }
  function renderDevices(rows) {
    const colors = ['#ed5b2a','#292721','#b9b2a5','#d7a78d']
    const total = rows.reduce((n, r) => n + metric(r), 0) || 1
    let angle = 0
    const stops = rows.map((r, i) => { const start = angle; angle += metric(r) / total * 360; return `${colors[i % colors.length]} ${start}deg ${angle}deg` })
    $('deviceDonut').style.background = `conic-gradient(${stops.join(',')})`
    $('deviceLegend').innerHTML = rows.map((r, i) => `<div><i style="background:${colors[i % colors.length]}"></i>${dimension(r)} ${Math.round(metric(r) / total * 100)}%</div>`).join('')
  }

  async function connect() {
    try {
      if (!config.googleClientId || config.googleClientId.startsWith('YOUR_')) throw new Error('Google OAuth 클라이언트 ID를 먼저 연결해야 합니다.')
      await waitForGoogle()
      tokenClient ||= google.accounts.oauth2.initTokenClient({
        client_id: config.googleClientId,
        scope,
        callback: async response => {
          if (response.error) return showError(response.error_description || response.error)
          accessToken = response.access_token
          try { await loadDashboard() } catch (error) { showError(error.message) }
        }
      })
      tokenClient.requestAccessToken({ prompt: accessToken ? '' : 'consent' })
    } catch (error) { showError(error.message) }
  }
  function showError(message) {
    setStatus('연결 필요')
    $('setupNote').className = 'setup-note error'
    $('setupNote').textContent = message
  }

  authBtn.addEventListener('click', connect)
  loginBtn.addEventListener('click', connect)
  refreshBtn.addEventListener('click', () => loadDashboard().catch(error => showError(error.message)))
  document.querySelectorAll('.range button').forEach(button => button.addEventListener('click', () => {
    document.querySelector('.range .on')?.classList.remove('on')
    button.classList.add('on')
    days = Number(button.dataset.days)
    if (accessToken) loadDashboard().catch(error => showError(error.message))
  }))
})()

;(() => {
  const config = window.WECO_ADMIN_CONFIG || {}
  const $ = id => document.getElementById(id)
  const button = $('metaAuthBtn')
  const number = new Intl.NumberFormat('ko-KR')
  const won = new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 })

  function metaStatus(message, error = false) {
    $('metaStatus').textContent = message
    $('metaStatus').className = `meta-status${error ? ' error' : ''}`
  }
  function loadSdk() {
    if (window.FB) return Promise.resolve()
    return new Promise((resolve, reject) => {
      window.fbAsyncInit = () => {
        FB.init({ appId: config.metaAppId, cookie: true, xfbml: false, version: 'v23.0' })
        resolve()
      }
      const script = document.createElement('script')
      script.src = 'https://connect.facebook.net/ko_KR/sdk.js'
      script.async = true
      script.defer = true
      script.onerror = () => reject(new Error('Meta 로그인 모듈을 불러오지 못했습니다.'))
      document.head.appendChild(script)
    })
  }
  const actionCount = (actions = [], names) => actions
    .filter(item => names.includes(item.action_type))
    .reduce((sum, item) => sum + Number(item.value || 0), 0)

  function queryInsights() {
    const days = Number(document.querySelector('.range .on')?.dataset.days || 30)
    const until = new Date()
    const since = new Date(until)
    since.setDate(since.getDate() - days)
    const date = value => value.toISOString().slice(0, 10)
    const account = String(config.metaAdAccountId).replace(/^act_/, '')
    FB.api(`/act_${account}/insights`, 'GET', {
      fields: 'campaign_name,spend,impressions,clicks,actions',
      level: 'campaign',
      time_range: JSON.stringify({ since: date(since), until: date(until) }),
      limit: 100
    }, response => {
      if (response.error) return metaStatus(response.error.message, true)
      const rows = response.data || []
      const totals = rows.reduce((sum, row) => {
        sum.spend += Number(row.spend || 0)
        sum.impressions += Number(row.impressions || 0)
        sum.clicks += Number(row.clicks || 0)
        sum.leads += actionCount(row.actions, ['lead', 'onsite_conversion.lead_grouped', 'offsite_conversion.fb_pixel_lead'])
        return sum
      }, { spend: 0, impressions: 0, clicks: 0, leads: 0 })
      $('metaSpend').textContent = won.format(totals.spend)
      $('metaImpressions').textContent = number.format(totals.impressions)
      $('metaClicks').textContent = number.format(totals.clicks)
      $('metaLeads').textContent = number.format(totals.leads)
      $('metaCpl').textContent = totals.leads ? won.format(totals.spend / totals.leads) : '–'
      $('metaCampaignTable').innerHTML = '<div class="table-row"><span>캠페인</span><span>광고비</span><span>노출</span><span>클릭</span><span>문의</span></div>' + rows.map(row => {
        const leads = actionCount(row.actions, ['lead', 'onsite_conversion.lead_grouped', 'offsite_conversion.fb_pixel_lead'])
        return `<div class="table-row"><span>${row.campaign_name || '이름 없음'}</span><span>${won.format(Number(row.spend || 0))}</span><span>${number.format(Number(row.impressions || 0))}</span><span>${number.format(Number(row.clicks || 0))}</span><span>${number.format(leads)}</span></div>`
      }).join('')
      button.textContent = 'Meta 다시 연결'
      metaStatus('Meta 광고 연결됨')
    })
  }
  async function connectMeta() {
    try {
      if (!config.metaAppId || config.metaAppId.startsWith('YOUR_') || !config.metaAdAccountId || config.metaAdAccountId.startsWith('YOUR_')) throw new Error('Meta 앱과 광고 계정 연결이 필요합니다.')
      await loadSdk()
      FB.login(response => {
        if (!response.authResponse) return metaStatus('Meta 로그인이 취소되었습니다.', true)
        metaStatus('광고 데이터 불러오는 중')
        queryInsights()
      }, { scope: 'ads_read' })
    } catch (error) { metaStatus(error.message, true) }
  }
  button.addEventListener('click', connectMeta)
})()
