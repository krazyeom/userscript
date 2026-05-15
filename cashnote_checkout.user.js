// ==UserScript==
// @name         Cashnote Checkout Helper
// @description  Redirect checkout URL and provide phone number quick-fill buttons
// @match        https://market.cashnote.kr/*
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  // ─── 1. Phone-number presets (Managed in LocalStorage) ──────────────
  const STORAGE_KEY = 'cn_phone_presets';

  function getPhonePresets() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  function savePhonePresets(presets) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets.slice(0, 3)));
  }

  const CHECKOUT_PATH = '/e-coupon/checkout';

  // ─── 2. Helpers ────────────────────────────────────────────────────
  function findPhoneInput() {
    return document.querySelector('input[name="ordererPhoneNumber"]');
  }

  function setNativeValue(input, value) {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    ).set;
    nativeInputValueSetter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function isCheckoutPage() {
    return window.location.pathname.startsWith(CHECKOUT_PATH);
  }

  function cleanQueryString() {
    if (isCheckoutPage() && window.location.search !== '') {
      history.replaceState(
        null,
        '',
        'https://market.cashnote.kr' + CHECKOUT_PATH
      );
    }
  }

  // ─── 3. UI injection ──────────────────────────────────────────────
  let phoneChanged = false;
  let warningBar = null;

  function removeUI() {
    const nav = document.getElementById('cn-phone-nav');
    const bar = document.getElementById('cn-warning-bar');
    if (nav) nav.remove();
    if (bar) bar.remove();
    warningBar = null;
    phoneChanged = false;
  }

  function updateWarningBar() {
    if (!warningBar) return;
    warningBar.style.display = phoneChanged ? 'none' : 'flex';
  }

  function injectUI() {
    const phoneInput = findPhoneInput();
    if (!phoneInput) return;
    if (document.getElementById('cn-phone-nav')) return; // already injected

    const presets = getPhonePresets();

    // ── Navigation Bar ───────────────────────────────────────────────
    const nav = document.createElement('div');
    nav.id = 'cn-phone-nav';
    Object.assign(nav.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      zIndex: '999999',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 16px',
      background: 'linear-gradient(135deg, #1e1e2e, #2d2d44)',
      boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    });

    function renderButtons() {
      // Clear existing preset buttons (keep the nav)
      Array.from(nav.querySelectorAll('.preset-btn, .action-btn')).forEach(el => el.remove());

      const currentPresets = getPhonePresets();

      // ── Preset Buttons ──────────────────────────────────────────────
      currentPresets.forEach(({ label, value }) => {
        const btn = document.createElement('button');
        btn.className = 'preset-btn';
        btn.textContent = label;
        Object.assign(btn.style, {
          padding: '8px 18px',
          border: 'none',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: '#fff',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'transform 0.15s, box-shadow 0.15s',
          boxShadow: '0 2px 6px rgba(99,102,241,0.4)',
        });
        btn.addEventListener('mousedown', () => {
          btn.style.transform = 'scale(0.95)';
        });
        btn.addEventListener('mouseup', () => {
          btn.style.transform = 'scale(1)';
        });
        btn.addEventListener('click', () => {
          const input = findPhoneInput();
          if (input) {
            setNativeValue(input, value);
            input.focus();
            phoneChanged = true;
            updateWarningBar();
          }
        });
        nav.appendChild(btn);
      });

      // ── Add Button ─────────────────────────────────────────────────
      if (currentPresets.length < 3) {
        const addBtn = document.createElement('button');
        addBtn.className = 'action-btn';
        addBtn.textContent = '+ Add';
        Object.assign(addBtn.style, {
          padding: '8px 12px',
          border: '1px dashed #6366f1',
          borderRadius: '8px',
          background: 'transparent',
          color: '#a5b4fc',
          fontSize: '12px',
          fontWeight: '600',
          cursor: 'pointer',
        });
        addBtn.addEventListener('click', () => {
          const label = prompt('Enter label (e.g., 8984-9119):');
          if (!label) return;
          const value = prompt('Enter phone number (e.g., 010 8984 9119):');
          if (!value) return;
          
          const newPresets = [...getPhonePresets(), { label, value }];
          savePhonePresets(newPresets);
          renderButtons();
        });
        nav.appendChild(addBtn);
      }

      // ── Reset Button ───────────────────────────────────────────────
      if (currentPresets.length > 0) {
        const resetBtn = document.createElement('button');
        resetBtn.className = 'action-btn';
        resetBtn.textContent = 'Reset';
        Object.assign(resetBtn.style, {
          marginLeft: 'auto',
          padding: '4px 8px',
          border: 'none',
          background: 'transparent',
          color: '#ef4444',
          fontSize: '11px',
          cursor: 'pointer',
          opacity: '0.7',
        });
        resetBtn.addEventListener('click', () => {
          if (confirm('Clear all presets?')) {
            savePhonePresets([]);
            renderButtons();
          }
        });
        nav.appendChild(resetBtn);
      }
    }

    renderButtons();

    document.body.appendChild(nav);

    // ── Warning bar ─────────────────────────────────────────────────
    warningBar = document.createElement('div');
    warningBar.id = 'cn-warning-bar';
    Object.assign(warningBar.style, {
      position: 'fixed',
      bottom: '20px',
      left: '0',
      right: '0',
      zIndex: '999998',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px 16px',
      background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
      boxShadow: '0 -4px 12px rgba(0,0,0,0.3)',
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#fff',
      fontSize: '14px',
      fontWeight: '700',
      letterSpacing: '0.5px',
    });
    warningBar.textContent = '⚠️ Please change the phone number';

    document.body.appendChild(warningBar);
  }

  // ─── 4. SPA navigation detection ──────────────────────────────────
  // Monkey-patch pushState/replaceState so we detect React Router navigations
  const origPushState = history.pushState;
  const origReplaceState = history.replaceState;

  function onUrlChange() {
    if (isCheckoutPage()) {
      cleanQueryString();
      // Start polling for phone input on this new page
      startPolling();
    } else {
      // Left checkout page → remove UI
      removeUI();
    }
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

  // ─── 5. Polling for phone input ───────────────────────────────────
  let pollTimer = null;

  function startPolling() {
    if (pollTimer) clearInterval(pollTimer);

    function tryInject() {
      if (document.getElementById('cn-phone-nav')) return true;
      if (findPhoneInput()) {
        injectUI();
        return true;
      }
      return false;
    }

    if (!tryInject()) {
      pollTimer = setInterval(() => {
        if (tryInject()) clearInterval(pollTimer);
      }, 500);
      setTimeout(() => {
        if (pollTimer) clearInterval(pollTimer);
      }, 30000);
    }
  }

  // ─── 6. Initial run ───────────────────────────────────────────────
  if (isCheckoutPage()) {
    cleanQueryString();
    startPolling();
  }
})();
