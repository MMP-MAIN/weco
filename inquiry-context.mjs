// Only fixed, public guide identifiers are accepted. No free text or personal data in URLs.
export const INQUIRY_GUIDES = Object.freeze({
  'brand-consulting': {
  "topic": "브랜드 기획·디자인 상담",
  "page": "brand-consulting-guide.html",
  "title": "브랜드 컨설팅·결과물 가이드",
  "placeholder": "예: 새로운 브랜드를 준비하고 있습니다. 현재 사업과 가장 해결하고 싶은 문제를 아는 만큼만 적어주세요."
},
  'space-consulting': {
  "topic": "공간 기획·브랜딩 상담",
  "page": "spatial-branding-guide.html",
  "title": "공간 컨설팅·브랜딩 가이드",
  "placeholder": "예: 운영 중인 매장의 공간을 바꾸려고 합니다. 이용 목적과 불편한 점, 유지하고 싶은 부분을 적어주세요."
},
  'brand-renewal': {
  "topic": "브랜드 리뉴얼 상담",
  "page": "brand-renewal-checklist.html",
  "title": "리브랜딩·브랜드 리뉴얼 가이드",
  "placeholder": "예: 이름은 유지하고 브랜드 이미지를 바꾸고 싶습니다. 현재 사업과 바꾸려는 이유만 적어주셔도 됩니다."
},
  'business-conversion': {
  "topic": "매장 업종변경 준비 상담",
  "page": "restaurant-business-conversion-guide.html",
  "title": "음식점 업종변경·시설 재사용 가이드",
  "placeholder": "예: 운영 중인 카페를 다른 업종으로 바꾸려고 합니다. 현재 업종과 바꾸고 싶은 방향, 가장 고민되는 점을 적어주세요."
},
  'salon-process': {
    topic: '미용실 현장·견적 준비 상담',
    page: 'hair-salon-interior-process-guide.html',
    title: '미용실 비용·공사 순서 가이드',
    placeholder: '예: 10평 미용실 오픈을 준비 중입니다. 기존 시설을 얼마나 쓸 수 있을지 궁금해요. 지역·면적·오픈 시기는 아는 만큼만 적어주세요.'
  },
  'daegu-salon': {
    topic: '대구 미용실 현장·견적 준비 상담',
    page: 'daegu-hair-salon-interior.html',
    title: '대구 미용실 인테리어·견적 준비 가이드',
    placeholder: '예: 대구에서 미용실을 리뉴얼하려고 합니다. 현재 매장 상태와 바꾸고 싶은 부분을 아는 만큼만 적어주세요.'
  },
  'cafe-startup': {
    topic: '카페 창업 준비 방향 상담',
    page: 'cafe-startup-interior.html',
    title: '카페 창업 비용·준비물 가이드',
    placeholder: '예: 카페 창업을 준비 중인데 메뉴와 공간 중 무엇부터 정할지 고민입니다. 점포 계약 여부·희망 지역·현재 고민만 적어주셔도 됩니다.'
  },
  'meat-startup': {
    topic: '고기집 창업 준비 방향 상담',
    page: 'meat-restaurant-startup-interior.html',
    title: '고기집 창업 비용·정육식당 준비 가이드',
    placeholder: '예: 고기집 창업을 준비하고 있습니다. 생각 중인 메뉴·점포 계약 여부·가장 궁금한 점을 아는 만큼만 적어주세요.'
  },
  'restaurant-startup': {
    topic: '식당 창업 준비 방향 상담',
    page: 'restaurant-startup-reality.html',
    title: '식당 창업 준비와 현실 가이드',
    placeholder: '예: 식당을 처음 준비하는데 메뉴·점포·예산의 순서를 정하고 싶습니다. 현재 준비 단계와 가장 고민되는 점만 적어주셔도 됩니다.'
  }
})

export function getInquiryContext(search = '') {
  const id = new URLSearchParams(search).get('inquiry')
  if (!Object.hasOwn(INQUIRY_GUIDES, id)) return null
  return { id, ...INQUIRY_GUIDES[id] }
}

export function inquiryEventParams(context) {
  return context ? { inquiry_topic: context.id, inquiry_guide: context.page } : {}
}

export function applyInquiryContext(doc, search) {
  const context = getInquiryContext(search)
  const note = doc.getElementById('inquiryContextNote')
  const message = doc.getElementById('inquiryMessage')
  if (!context || !note || !message) return null
  note.textContent = `${context.topic} · 읽은 글: ${context.title}`
  note.hidden = false
  // Keep the visitor's message untouched, including browser-restored input.
  message.placeholder = context.placeholder
  doc.getElementById('inquiryTopic').value = context.topic
  doc.getElementById('inquiryGuide').value = `https://wecocompany.com/${context.page}`
  return context
}
