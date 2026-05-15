// ==UserScript==
// @name         FirstPay Terms Auto Agree
// @namespace    https://pg.firstpay.co.kr/
// @version      1.3
// @match        https://pg.firstpay.co.kr/jsp/crdt/m/terms.jsp*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    function run() {
        const agreeCheckbox = document.getElementById('all_agree');

        if (agreeCheckbox && !agreeCheckbox.checked) {
            agreeCheckbox.click();
            console.log('all_agree checked');
        }

        const nextButton = document.querySelector('#submit_wrap #next a');

        if (nextButton) {
            nextButton.click();
            console.log('next button clicked');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
})();
