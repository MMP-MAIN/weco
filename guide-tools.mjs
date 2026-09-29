// Local-only guide discovery and a fixed-choice brief. No free text or answers leave the page.
export const QUOTE_ITEMS = Object.freeze([
  ['goal', '해결할 과제', '이번 프로젝트에서 결정할 문제를 한 문장으로 맞춰보세요.'],
  ['research', '조사 범위', '인터뷰·자료 조사·경쟁 검토 중 포함되는 방법과 범위를 물어보세요.'],
  ['deliverables', '최종 결과물', '전략 문서·네이밍·로고·적용물의 종류와 수량을 확인하세요.'],
  ['revisions', '수정과 승인', '시안 수, 수정 횟수, 추가 작업 기준과 승인 담당자를 확인하세요.'],
  ['files', '파일 인계', '편집 원본, 사용 가이드와 서체·이미지 사용 조건을 확인하세요.'],
  ['extras', '별도 비용', '제작·촬영·유료 소스·광고 집행·공사비의 포함 여부를 확인하세요.'],
  ['schedule', '일정과 지급', '중간 확인일, 납품일, 지급 시점과 변경 협의 방법을 확인하세요.'],
  ['handoff', '완료 후 지원', '납품 이후 지원 기간과 추가 적용·운영 업무를 구분하세요.']
]);
const normalize = text => String(text).normalize('NFKC').toLowerCase().replace(/\s+/g, '');
export function matchesGuide(text, query) {
  return String(query).trim().split(/\s+/).filter(Boolean).every(word => normalize(text).includes(normalize(word)));
}
export function summarizeQuote(answers = {}) {
  const missing = QUOTE_ITEMS.filter(([id]) => answers[id] !== 'confirmed');
  return {
    confirmed: QUOTE_ITEMS.length - missing.length,
    missing,
    text: ['브랜드 프로젝트 견적 비교 메모', '업체마다 같은 범위인지 각각 확인하세요. 확인 개수는 품질·가격 평가가 아닙니다.', '',
      ...QUOTE_ITEMS.map(([id, label, question]) => `${answers[id] === 'confirmed' ? '[확인]' : '[질문 필요]'} ${label}${answers[id] === 'confirmed' ? '' : `: ${question}`}`),
      '', '가이드: https://wecocompany.com/brand-consulting-guide.html#quote-check'].join('\n')
  };
}
export function setupGuideTools(doc, win) {
  const search = doc.querySelector('[data-guide-search]');
  if (search) {
    const cards = [...doc.querySelectorAll('.insight-grid .insight-card')];
    const status = doc.querySelector('[data-guide-count]');
    const empty = doc.querySelector('[data-guide-empty]');
    const refresh = () => {
      let count = 0;
      cards.forEach(card => { card.hidden = !matchesGuide(card.textContent, search.value); if (!card.hidden) count++; });
      status.textContent = `${count}개의 안내`;
      empty.hidden = count !== 0;
    };
    search.addEventListener('input', refresh);
    doc.querySelector('[data-guide-clear]').addEventListener('click', () => { search.value = ''; refresh(); search.focus(); });
    refresh();
  }
  const checker = doc.querySelector('[data-quote-check]');
  if (checker) {
    const output = doc.querySelector('[data-quote-summary]');
    const questions = doc.querySelector('[data-quote-questions]');
    const memo = doc.querySelector('[data-quote-memo]');
    const copyStatus = doc.querySelector('[data-copy-status]');
    const refresh = () => {
      const answers = Object.fromEntries(QUOTE_ITEMS.map(([id]) => [id, checker.querySelector(`[name="${id}"]`)?.value]));
      const result = summarizeQuote(answers);
      output.textContent = `${QUOTE_ITEMS.length}개 항목 중 ${result.confirmed}개 확인 · ${result.missing.length}개 추가 질문`;
      questions.replaceChildren(...result.missing.map(([,label,question]) => { const li=doc.createElement('li'); li.textContent=`${label}: ${question}`; return li; }));
      memo.value = result.text;
      copyStatus.textContent = '';
    };
    checker.addEventListener('change', refresh);
    doc.querySelector('[data-quote-reset]').addEventListener('click', () => {
      QUOTE_ITEMS.forEach(([id]) => { checker.querySelector(`[name="${id}"]`).value = 'unknown'; });
      refresh();
    });
    doc.querySelector('[data-quote-copy]').addEventListener('click', async () => {
      try { await win.navigator.clipboard.writeText(memo.value); copyStatus.textContent = '비교 메모를 복사했습니다. 원하는 곳에 직접 붙여넣으세요.'; }
      catch { memo.focus(); memo.select(); copyStatus.textContent = '자동 복사가 지원되지 않습니다. 선택된 메모를 직접 복사하세요.'; }
    });
    refresh();
  }
}
if (typeof document !== 'undefined') setupGuideTools(document, window);
