const INQUIRY_ENDPOINT = 'https://formsubmit.co/ajax/storm2119@gmail.com'

export function getLeadContext() {
  let projects = []
  try {
    const storedProjects = JSON.parse(sessionStorage.getItem('weco_projects_viewed') || '[]')
    if (Array.isArray(storedProjects)) projects = storedProjects.filter(item => typeof item === 'string').slice(-20)
  } catch (_) {}
  return {
    first_touch: 'unknown', last_touch: 'unknown', campaign: 'unknown', content: 'unknown',
    term: 'unknown', click_id: 'unknown', first_landing: location.pathname,
    session_landing: location.pathname, source_evidence: 'tracking_unavailable',
    external_referrer: 'unknown', submit_page: location.pathname,
    pages_viewed: location.pathname, time_to_lead: '측정 불가',
    ...window.WECO_JOURNEY?.context(),
    projects_viewed: projects.join(', ') || '없음',
    device: `${innerWidth < 768 ? '모바일' : innerWidth < 1100 ? '태블릿' : 'PC'} / ${navigator.platform || 'unknown'}`
  }
}

export function inquiryPayload({ name, phone, budget, message, preferredWork, context, leadContext, quick = false }) {
  return {
    _subject: '[위코컴퍼니] 새 프로젝트 문의',
    _template: 'table',
    _captcha: 'false',
    이름: name,
    연락처: phone,
    ...(preferredWork ? { 희망업무: preferredWork } : {}),
    개인정보동의: '동의',
    프로젝트예상총예산: budget || '미입력',
    문의내용: message || '미입력',
    ...(quick ? { 접수경로: '하단 빠른 상담' } : {}),
    ...(context ? {
      상담주제: context.topic,
      상담연결글: `https://wecocompany.com/${context.page}`
    } : {}),
    최초유입: leadContext.first_touch,
    최근유입: leadContext.last_touch,
    광고캠페인: leadContext.campaign,
    광고소재: leadContext.content,
    검색어_광고키워드: leadContext.term,
    광고클릭ID: leadContext.click_id,
    최초방문페이지: leadContext.first_landing,
    이번방문시작페이지: leadContext.session_landing,
    유입판단근거: leadContext.source_evidence,
    외부유입참조: leadContext.external_referrer,
    문의제출페이지: leadContext.submit_page,
    상담전본페이지: leadContext.pages_viewed,
    상담전본프로젝트: leadContext.projects_viewed,
    상담전체류시간: leadContext.time_to_lead,
    접속기기: leadContext.device
  }
}

export async function sendInquiry(payload, signal, request = fetch) {
  const response = await request(INQUIRY_ENDPOINT, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload)
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || (data.success !== true && data.success !== 'true')) {
    throw new Error('Inquiry rejected by form service')
  }
}
