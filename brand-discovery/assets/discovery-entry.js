/* Entry choice around the existing questionnaire. React owns every node inside #root. */
(() => {
  'use strict';

  const entry = document.getElementById('discovery-entry');
  const root = document.getElementById('root');
  const start = document.getElementById('discovery-detail-start');
  const status = document.getElementById('discovery-detail-status');
  if (!entry || !root || !start || !status) return;

  // Exact leaf-text updates avoid replacing/removing nodes owned by React.
  // Keep the compiled questionnaire, field validation and delivery code intact.
  const copy = new Map([
    ['무료 1차 진단으로 브랜드의 가능성과 다음 행동을 정리해보세요.', '상세 점검으로 브랜드의 가능성과 다음 행동을 정리해보세요.'],
    ['무료 1차 진단 결과를 확인할 정보를 남겨주세요.', '1차 점검 결과를 안내받을 정보를 남겨주세요.'],
    ['입력한 답을 바탕으로 즉시 정리한 무료 1차 진단입니다. 점수는 답변의 완성도와 근거 수준을 나타내며 사업 성공률을 의미하지 않습니다.', '입력한 답을 바탕으로 정리한 1차 점검입니다. 점수는 답변의 완성도와 근거 수준을 나타내며 사업 성공률을 의미하지 않습니다.'],
    ['SEOUL · KOREA', '위코컴퍼니 · KOREA'],
    ['← 분석 종료', '← 문의 방식 선택'],
  ]);
  let previousView = 'entry';
  let previousStep = '';

  function sync() {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const replacement = copy.get(node.nodeValue);
      if (replacement) node.nodeValue = replacement;
    }

    const legacyStart = root.querySelector('.hero button.primary');
    const survey = root.querySelector('.survey-layout');
    const complete = root.querySelector('.complete');
    const view = survey ? 'survey' : complete ? 'complete' : legacyStart ? 'entry' : previousView;
    const isEntry = view === 'entry';
    root.hidden = isEntry;
    entry.hidden = !isEntry;
    if (legacyStart) {
      start.disabled = false;
      status.textContent = '선택 질문과 자료 첨부는 필요한 만큼 작성할 수 있습니다.';
    }

    if (isEntry && previousView !== 'entry') {
      start.focus();
      previousStep = '';
    } else if (!isEntry) {
      const heading = (survey || complete)?.querySelector('h2, h1');
      const step = survey?.querySelector('.step-number')?.textContent || view;
      if (heading && (view !== previousView || step !== previousStep)) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
        heading.scrollIntoView({ block: 'start' });
        previousStep = step;
      }
    }
    previousView = view;
  }

  start.addEventListener('click', () => {
    const legacyStart = root.querySelector('.hero button.primary');
    if (!legacyStart || start.disabled) return;
    start.disabled = true;
    // Use the original event path: it records discovery_start and opens step 1.
    legacyStart.click();
  });

  new MutationObserver(sync).observe(root, { childList: true, characterData: true, subtree: true });
  sync();
  window.setTimeout(() => {
    if (start.disabled && previousView === 'entry') {
      status.textContent = '상세 점검을 불러오지 못했습니다. 새로고침하거나 간단히 문의하기를 이용해주세요.';
    }
  }, 12000);
})();
