// ==UserScript==
// @name         FirstPay Card Quick Select
// @namespace    https://pg.firstpay.co.kr/
// @version      1.2
// @include      https://pg.firstpay.co.kr/jsp/crdt/m/start.jsp*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const CARD_MAP = [
        {
            name: '비씨카드',
            selector: '#bcCard',
            background: '#d71920',
            color: '#ffffff'
        },
        {
            name: '롯데카드',
            selector: '#ltCard',
            background: '#005bac',
            color: '#ffffff'
        },
        {
            name: '신한카드',
            selector: '#shCard',
            background: '#0046ff',
            color: '#ffffff'
        },
        {
            name: '국민카드',
            selector: '#kbCard',
            background: '#ffcc00',
            color: '#000000'
        }
    ];

    function clickCard(cardSelector) {
        const openButton = document.querySelector('li#card_select_show.fr.select_card');

        if (openButton) {
            openButton.click();
            console.log('card select opened');
        }

        setTimeout(() => {
            const cardButton = document.querySelector(cardSelector);

            if (cardButton) {
                cardButton.click();
                console.log('card selected:', cardSelector);
            } else {
                console.log('card button not found:', cardSelector);
            }
        }, 300);
    }

    function createBottomOverlayToolbar() {
        const oldToolbar = document.getElementById('card-toolbar');

        if (oldToolbar) {
            oldToolbar.remove();
        }

        const toolbar = document.createElement('div');
        toolbar.id = 'card-toolbar';

        toolbar.style.position = 'fixed';
        toolbar.style.bottom = '0';
        toolbar.style.left = '0';
        toolbar.style.width = '100%';
        toolbar.style.zIndex = '2147483647';
        toolbar.style.display = 'flex';
        toolbar.style.padding = '10px';
        toolbar.style.boxSizing = 'border-box';
        toolbar.style.gap = '8px';
        toolbar.style.background = 'rgba(0,0,0,0.95)';
        toolbar.style.backdropFilter = 'blur(8px)';
        toolbar.style.borderTop = '2px solid #222';

        CARD_MAP.forEach(card => {
            const button = document.createElement('button');

            button.textContent = card.name;

            button.style.flex = '1';
            button.style.padding = '14px 8px';
            button.style.border = 'none';
            button.style.borderRadius = '12px';
            button.style.fontSize = '15px';
            button.style.fontWeight = 'bold';
            button.style.background = card.background;
            button.style.color = card.color;
            button.style.boxShadow = '0 2px 10px rgba(0,0,0,0.4)';

            button.addEventListener('click', () => {
                clickCard(card.selector);
            });

            toolbar.appendChild(button);
        });

        document.body.appendChild(toolbar);
    }

    function init() {
        createBottomOverlayToolbar();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();