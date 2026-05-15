// ==UserScript==
// @name         Cashnote Coupon Filter
// @description  Show only 모바일 교환권 coupons on the coupons page
// @match        https://market.cashnote.kr/mypage/coupons
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  const FILTER_KEYWORD = '모바일 교환권';

  // ─── 1. Filter coupon cards by DOM structure ──────────────────────
  function filterCoupons() {
    // Each coupon card is a div[role="presentation"]
    const cards = document.querySelectorAll('div[role="presentation"]');
    let hiddenCount = 0;
    let shownCount = 0;

    cards.forEach((card) => {
      // The coupon name is in a <p> with these classes
      const nameEl = card.querySelector(
        'p.typo-paragraph100-regular'
      );
      if (!nameEl) return; // not a coupon card

      const name = nameEl.textContent || '';
      if (name.includes(FILTER_KEYWORD)) {
        card.style.display = '';
        shownCount++;
      } else {
        card.style.display = 'none';
        hiddenCount++;
      }
    });

    return { hiddenCount, shownCount };
  }

  // ─── 2. Filter badge ─────────────────────────────────────────────
  function addFilterBadge(shown, hidden) {
    const existing = document.getElementById('cn-filter-badge');
    if (existing) {
      existing.textContent = `🎫 모바일 교환권 ${shown}개 표시 (${hidden}개 숨김)`;
      return;
    }

    const badge = document.createElement('div');
    badge.id = 'cn-filter-badge';
    Object.assign(badge.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      zIndex: '999999',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '10px 16px',
      background: 'linear-gradient(135deg, #059669, #10b981)',
      boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#fff',
      fontSize: '14px',
      fontWeight: '600',
    });
    badge.textContent = `🎫 모바일 교환권 ${shown}개 표시 (${hidden}개 숨김)`;
    document.body.appendChild(badge);
  }

  // ─── 3. Run filter ───────────────────────────────────────────────
  function runFilter() {
    const result = filterCoupons();
    if (result.shownCount > 0 || result.hiddenCount > 0) {
      addFilterBadge(result.shownCount, result.hiddenCount);
    }
  }

  // ─── 4. Poll until cards appear, then filter ─────────────────────
  const poll = setInterval(() => {
    const cards = document.querySelectorAll('div[role="presentation"]');
    if (cards.length > 0) {
      clearInterval(poll);
      runFilter();
    }
  }, 500);

  setTimeout(() => clearInterval(poll), 30000);
})();
