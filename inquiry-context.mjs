// Only fixed, public guide identifiers are accepted. No free text or personal data in URLs.
export const INQUIRY_GUIDES = Object.freeze({
  'daegu-commercial': {topic:'대구 상가·식당 공간기획 상담',page:'daegu-commercial-interior.html',title:'대구 상가·식당 설비·견적 준비 안내',placeholder:'대구 내 지역·면적·업종·계약 전후와 가장 고민되는 점을 아는 만큼 알려주세요.'},
  'commercial-quote': {topic:'상가 인테리어 견적 준비 상담',page:'commercial-interior-quote-checklist.html',title:'상가 견적 포함·별도 항목 비교 안내',placeholder:'지역·면적·업종과 헷갈리는 견적 항목을 알려주세요. 견적서가 없다면 바꾸고 싶은 부분만 적어도 됩니다.'},
  'restaurant-cost': {topic:'식당 공간·주방 설비 견적 준비 상담',page:'restaurant-interior-cost.html',title:'식당 인테리어·주방 설비 비용 안내',placeholder:'지역·면적·대표 메뉴·유지할 장비와 공사에서 궁금한 점을 아는 만큼 알려주세요.'},
  'office': {topic:'사무실 인테리어·오피스 공간기획 상담',page:'office-branding-interior.html',title:'사무실 공간기획 안내',placeholder:'지역·면적·근무 인원·입주 일정과 가장 바꾸고 싶은 점을 알려주세요.'},
  'office-quote': {topic:'사무실 인테리어 비용·견적 상담',page:'office-interior-quote-guide.html',title:'사무실 견적·이전 준비 안내',placeholder:'지역·면적·공사 범위·유지할 가구와 이전 일정을 아는 만큼 알려주세요.'},
  'daegu-office': {topic:'대구 사무실 인테리어 상담',page:'daegu-office-interior.html',title:'대구 사무실 공간기획 안내',placeholder:'대구 내 지역·면적·근무 인원과 희망 입주일, 현재 고민을 알려주세요.'},
  'small-office': {topic:'소형 사무실 인테리어 상담',page:'small-office-interior-guide.html',title:'10평·15평·20평 사무실 배치 안내',placeholder:'지역·면적·동시 근무 인원·회의와 통화 빈도·유지할 가구를 아는 만큼 알려주세요.'},
  'house-remodeling': {
    topic: '주택·단독주택 리모델링 상담', page: 'house-remodeling-guide.html', title: '주택·구옥 인테리어 준비 안내',
    placeholder: '지역·집의 종류·대략적인 면적·거주 여부·바꾸고 싶은 부분을 알려주세요. 모르는 항목은 적지 않아도 됩니다.'
  },
  'small-apartment': {
    topic: '20평대 아파트 인테리어 상담', page: '20-pyeong-apartment-interior-guide.html', title: '20평·24평·25평 생활·수납 계획',
    placeholder: '지역·평형·입주 예정일·유지할 가구와 가장 불편한 공간을 알려주세요.'
  },
  'large-apartment': {
    topic: '40평대 아파트 인테리어 상담', page: '40-pyeong-apartment-interior-guide.html', title: '40평대 공간별 공사 범위 안내',
    placeholder: '지역·평형·방별 쓰임·유지할 부분과 희망 공사 시기를 아는 만큼 알려주세요.'
  },
  'partial-home': {
    topic: '주거 부분 인테리어 상담', page: 'partial-home-interior-guide.html', title: '주방·욕실·도배·바닥 부분공사 안내',
    placeholder: '지역·바꿀 공간·유지할 마감과 현재 거주 중인지 알려주세요. 예: 주방 가구와 거실 도배만 검토 중입니다.'
  },
  'water-damage': {
    topic: '누수복구 인테리어 상담',
    page: 'water-damage-restoration-interior.html',
    title: '천장·도배·바닥 누수복구 안내',
    placeholder: '지역·피해 위치·현재 누수 여부·원인 수리 여부를 아는 만큼 적어주세요. 예: 대구 아파트 거실 천장과 벽지 손상, 배관 수리는 완료했습니다.'
  },
  'apartment': {
  "topic": "주택·아파트 인테리어 기획·디자인 상담",
  "page": "residential.html",
  "title": "주택·아파트 인테리어 기획·디자인 상담 안내",
  "placeholder": "지역·평형·입주 예정일과 바꾸고 싶은 공간을 아는 만큼 적어주세요. 예: 32평 구축 아파트, 주방과 욕실을 바꾸고 싶습니다."
},
  'daegu-apartment': {
  "topic": "대구 아파트 인테리어 상담",
  "page": "daegu-apartment-interior.html",
  "title": "대구 아파트 인테리어 상담 안내",
  "placeholder": "지역·평형·입주 예정일과 바꾸고 싶은 공간을 아는 만큼 적어주세요. 예: 32평 구축 아파트, 주방과 욕실을 바꾸고 싶습니다."
},
  'apartment-planning': {
  "topic": "아파트 인테리어 준비 상담",
  "page": "apartment-interior-planning-checklist.html",
  "title": "아파트 인테리어 준비 상담 안내",
  "placeholder": "지역·평형·입주 예정일과 바꾸고 싶은 공간을 아는 만큼 적어주세요. 예: 32평 구축 아파트, 주방과 욕실을 바꾸고 싶습니다."
},
  'old-apartment': {
  "topic": "구축 아파트 리모델링 상담",
  "page": "old-apartment-remodeling-checklist.html",
  "title": "구축 아파트 리모델링 상담 안내",
  "placeholder": "지역·평형·입주 예정일과 바꾸고 싶은 공간을 아는 만큼 적어주세요. 예: 32평 구축 아파트, 주방과 욕실을 바꾸고 싶습니다."
},
  'apartment-cost': {
  "topic": "30평대 아파트 비용·견적 상담",
  "page": "30-pyeong-apartment-interior-guide.html",
  "title": "30평대 아파트 비용·견적 상담 안내",
  "placeholder": "지역·평형·입주 예정일과 바꾸고 싶은 공간을 아는 만큼 적어주세요. 예: 32평 구축 아파트, 주방과 욕실을 바꾸고 싶습니다."
},
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
