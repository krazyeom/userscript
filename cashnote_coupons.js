// ==UserScript==
// @name         Cashnote Coupon Filter
// @description  Show only 모바일 교환권 coupons on the coupons page
// @match        https://market.cashnote.kr/*
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  const COUPONS_PATH = '/mypage/coupons';
  const FILTER_KEYWORD = '모바일 교환권';

  function isCouponsPage() {
    return window.location.pathname === COUPONS_PATH;
  }

  // ─── 1. Parse __NEXT_DATA__ to get matching coupon IDs ─────────────
  function getMatchingCouponNames() {
    const el = document.getElementById('__NEXT_DATA__');
    if (!el) return null;
    try {
      const data = JSON.parse(el.textContent);
      const queries =
        data?.props?.pageProps?.dehydratedState?.queries || [];
      const coupons = [];
      queries.forEach((q) => {
        const items = q?.state?.data;
        if (Array.isArray(items)) {
          items.forEach((c) => {
            if (c.name && c.name.includes(FILTER_KEYWORD)) {
              coupons.push(c.name);
            }
          });
        }
      });
      return coupons;
    } catch (e) {
      return null;
    }
  }

  // ─── 2. Filter rendered coupon cards ───────────────────────────────
  function filterCoupons() {
    // Find all coupon list items by looking at the rendered DOM
    // The coupons page renders a list; each coupon card contains its name text
    const allItems = document.querySelectorAll(
      'ul > li, [class*="coupon"], [class*="Coupon"]'
    );

    let hiddenCount = 0;
    let shownCount = 0;

    allItems.forEach((item) => {
      const text = item.textContent || '';
      if (text.includes('할인') || text.includes('쿠폰')) {
        // This looks like a coupon card
        if (text.includes(FILTER_KEYWORD)) {
          item.style.display = '';
          shownCount++;
        } else {
          item.style.display = 'none';
          hiddenCount++;
        }
      }
    });

    return { hiddenCount, shownCount };
  }

  // ─── 3. Add filter badge ──────────────────────────────────────────
  function addFilterBadge(shown, hidden) {
    if (document.getElementById('cn-filter-badge')) {
      const badge = document.getElementById('cn-filter-badge');
      badge.textContent = `🎫 모바일 교환권 ${shown}개 표시 (${hidden}개 숨김)`;
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

  function removeFilterUI() {
    const badge = document.getElementById('cn-filter-badge');
    if (badge) badge.remove();
  }

  // ─── 4. Main logic ────────────────────────────────────────────────
  function runFilter() {
    if (!isCouponsPage()) {
      removeFilterUI();
      return;
    }

    const result = filterCoupons();
    if (result.shownCount > 0 || result.hiddenCount > 0) {
      addFilterBadge(result.shownCount, result.hiddenCount);
    }
  }

  // ─── 5. SPA navigation detection ─────────────────────────────────
  const origPushState = history.pushState;
  const origReplaceState = history.replaceState;

  function onUrlChange() {
    // Small delay to let React render
    setTimeout(runFilter, 800);
  }

  history.pushState = function () {
    origPushState.apply(this, arguments);
    onUrlChange();
  };

  history.replaceState = function () {
    origReplaceState.apply(this, arguments);
    onUrlChange();
  };

  window.addEventListener('popstate', onUrlChange);

  // ─── 6. Polling for initial load and re-renders ───────────────────
  let pollTimer = null;

  function startPolling() {
    if (pollTimer) clearInterval(pollTimer);

    pollTimer = setInterval(() => {
      if (!isCouponsPage()) {
        clearInterval(pollTimer);
        removeFilterUI();
        return;
      }
      runFilter();
    }, 1000);

    // Stop after 60 seconds
    setTimeout(() => {
      if (pollTimer) clearInterval(pollTimer);
    }, 60000);
  }

  // ─── 7. Initial run ──────────────────────────────────────────────
  if (isCouponsPage()) {
    startPolling();
  }
})();
