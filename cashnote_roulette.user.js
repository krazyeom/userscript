// ==UserScript==
// @name         Cashnote Roulette Helper
// @namespace    cashnote
// @version      1.1
// @match        https://market.cashnote.kr/mypage*
// @match        https://market.cashnote.kr/app*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    if (document.getElementById('cashnote-roulette-wrap')) return;

    const style = document.createElement('style');

    style.textContent = `
        #cashnote-roulette-log {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 200px;
            z-index: 999998;
            background: #000;
            color: #00ff00;
            border: none;
            resize: none;
            padding: 8px;
            box-sizing: border-box;
            font-size: 12px;
            font-family: monospace;
        }

        #cashnote-roulette-wrap {
            position: fixed;
            top: 200px;
            left: 0;
            width: 100%;
            height: 60px;
            z-index: 999999;
            background: #111;
            display: flex;
            flex-direction: column;
        }

        .cashnote-row {
            display: flex;
            width: 100%;
            height: 30px;
        }

        .cashnote-roulette-btn {
            flex: 1;
            border: none;
            font-size: 14px;
            font-weight: bold;
            color: white;
        }

        .cashnote-roulette-btn:active {
            opacity: 0.7;
        }

        .btn-30 {
            background: linear-gradient(90deg, #ff6b6b, #ff8787);
        }

        .btn-31 {
            background: linear-gradient(90deg, #4dabf7, #74c0fc);
        }

        .btn-all {
            background: linear-gradient(90deg, #51cf66, #94d82d);
            color: #000;
        }

        body {
            padding-top: 260px !important;
        }
    `;

    document.head.appendChild(style);

    const logBox = document.createElement('textarea');
    logBox.id = 'cashnote-roulette-log';
    logBox.readOnly = true;

    const wrap = document.createElement('div');
    wrap.id = 'cashnote-roulette-wrap';

    const row1 = document.createElement('div');
    row1.className = 'cashnote-row';

    const row2 = document.createElement('div');
    row2.className = 'cashnote-row';

    function addLog(text) {
        const now = new Date().toLocaleTimeString();

        logBox.value =
            `[${now}] ${text}\n` +
            logBox.value;
    }

    function getToken() {
        return localStorage.getItem('token');
    }

    async function requestApi(eventId) {
        try {
            const token = getToken();

            if (!token) {
                addLog('TOKEN 없음');
                return;
            }

            addLog(`${eventId} 광고 요청`);

            const buyResponse = await fetch(
                `https://market-api.cashnote.kr/api/market-place/v1/lottery-event/${eventId}/quota/buy/ad`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Accept': '*/*',
                        'Origin': 'https://market.cashnote.kr',
                        'Referer': 'https://market.cashnote.kr/',
                        'X-Market-Front-Page': `https://market.cashnote.kr/event/random-box/${eventId}?`,
                        'X-Client-Auth-Token': token
                    }
                }
            );

            addLog(`${eventId} 광고 완료 (${buyResponse.status})`);

            await new Promise(resolve => setTimeout(resolve, 1000));

            addLog(`${eventId} 룰렛 실행`);

            const runResponse = await fetch(
                `https://market-api.cashnote.kr/api/market-place/v1/lottery-event/${eventId}/run`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Accept': '*/*',
                        'Origin': 'https://market.cashnote.kr',
                        'Referer': 'https://market.cashnote.kr/',
                        'X-Market-Front-Page': `https://market.cashnote.kr/event/random-box/${eventId}?`,
                        'X-Client-Auth-Token': token
                    }
                }
            );

            const data = await runResponse.json();

            if (data?.prizeName || data?.prizeSubName) {
                addLog(
                    `${eventId} → ${data.prizeName || ''} ${data.prizeSubName || ''}`.trim()
                );
            } else {
                addLog(`${eventId} → ${JSON.stringify(data)}`);
            }

        } catch (err) {
            addLog(`${eventId} ERROR: ${err.message}`);
        }
    }

    function createButton(text, className, onClick) {
        const btn = document.createElement('button');

        btn.className = `cashnote-roulette-btn ${className}`;
        btn.textContent = text;
        btn.onclick = onClick;

        return btn;
    }

    const btn30 = createButton(
        '30',
        'btn-30',
        () => requestApi(30)
    );

    const btn31 = createButton(
        '31',
        'btn-31',
        () => requestApi(31)
    );

    const btnAll = createButton(
        '30 + 31',
        'btn-all',
        async () => {
            addLog('30 + 31 시작');

            await requestApi(30);

            await new Promise(resolve => setTimeout(resolve, 1000));

            await requestApi(31);

            addLog('30 + 31 완료');
        }
    );

    row1.appendChild(btn30);
    row1.appendChild(btn31);

    row2.appendChild(btnAll);

    wrap.appendChild(row1);
    wrap.appendChild(row2);

    document.body.appendChild(logBox);
    document.body.appendChild(wrap);

    addLog('Cashnote Roulette Ready');
})();