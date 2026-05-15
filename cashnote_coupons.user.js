// ==UserScript==
// @name         Cashnote Coupon Filter
// @description  Show only 모바일 교환권 coupons on the coupons page
// @match        https://market.cashnote.kr/mypage/coupons
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
    // Get coupon data from __NEXT_DATA__ to know exact names
    const el = document.getElementById('__NEXT_DATA__');
    if (!el) return { hiddenCount: 0, shownCount: 0 };

    let allCoupons = [];
    try {
      const data = JSON.parse(el.textContent);
      const queries =
        data?.props?.pageProps?.dehydratedState?.queries || [];
      queries.forEach((q) => {
        const items = q?.state?.data;
        if (Array.isArray(items)) {
          items.forEach((c) => {
            if (c.name) allCoupons.push(c.name);
          });
        }
      });
    } catch (e) {
      return { hiddenCount: 0, shownCount: 0 };
    }

    if (allCoupons.length === 0) return { hiddenCount: 0, shownCount: 0 };

    // Find all li elements in the page
    let hiddenCount = 0;
    let shownCount = 0;
    const processedLis = new Set();

    allCoupons.forEach((couponName) => {
      // Find DOM elements containing this exact coupon name
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null
      );

      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node.textContent.includes(couponName)) {
          // Walk up to the closest li
          const li = node.parentElement?.closest('li');
          if (li && !processedLis.has(li)) {
            processedLis.add(li);
            if (couponName.includes(FILTER_KEYWORD)) {
              li.style.display = '';
              shownCount++;
            } else {
              li.style.display = 'none';
              hiddenCount++;
            }
          }
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
