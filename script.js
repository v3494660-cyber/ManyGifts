document.addEventListener('DOMContentLoaded', () => {
  // ==== НАСТРОЙКИ ====
  // УКАЖИТЕ ВАШ РЕАЛЬНЫЙ АДРЕС ПОЛУЧАТЕЛЯ
  const RECIPIENT_ADDRESS = 'YOUR_TON_ADDRESS_HERE';
  // Опционально: URL вашего бэкенда для синка вкладов. Оставьте пустым, если не используете.
  const BACKEND_URL = ''; // например: 'https://api.example.com'
  // Опционально: TonAPI ключ. Если есть — добавьте, чтобы повысить лимиты.
  const TONAPI_KEY = '';

  const ONE_TON_NANO = '1000000000';

  // ==== TON CONNECT UI ====
  const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
    manifestUrl: 'https://www.wh27199.web1.maze-tech.ru/tonconnect-manifest.json',
    buttonRootId: 'ton-connect'
  });

  // ==== DOM ====
  const pages = document.querySelectorAll('.page');
  const navLinks = document.querySelectorAll('.bottom-nav a');
  const balanceEl = document.getElementById('balance');
  const investBtn = document.getElementById('investButton');
  const tgUsernameEl = document.getElementById('tg-username');
  const totalInvestedEl = document.getElementById('total-invested');
  const depositsListEl = document.getElementById('deposits-list');
  const emptyStateEl = document.getElementById('empty-state');

  // ==== ТЕЛЕГРАМ ПРОФИЛЬ ====
  try {
    const wa = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
    if (wa && typeof wa.ready === 'function') wa.ready();
    const user = wa?.initDataUnsafe?.user || {};
    const uname = user.username ? '@' + user.username : [user.first_name, user.last_name].filter(Boolean).join(' ');
    tgUsernameEl.textContent = uname || 'Не указан';
  } catch {
    tgUsernameEl.textContent = 'Не указан';
  }

  // ==== НАВИГАЦИЯ ====
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const pageId = link.getAttribute('data-page');
      pages.forEach(p => p.classList.remove('active'));
      navLinks.forEach(n => n.classList.remove('active'));
      document.getElementById(pageId)?.classList.add('active');
      link.classList.add('active');
    });
  });

  // ==== ХРАНИЛИЩЕ ВКЛАДОВ (LOCAL + OPTIONAL BACKEND) ====
  const keyFor = (address) => `deposits:${address}`;

  function loadLocalDeposits(address) {
    if (!address) return [];
    try {
      const raw = localStorage.getItem(keyFor(address));
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  function saveLocalDeposits(address, deposits) {
    try {
      localStorage.setItem(keyFor(address), JSON.stringify(deposits));
    } catch {}
  }

  async function syncFromBackend(address) {
    if (!BACKEND_URL || !address) return null;
    try {
      const res = await fetch(`${BACKEND_URL}/deposits?address=${encodeURIComponent(address)}`);
      if (!res.ok) throw new Error('Backend fetch failed');
      const json = await res.json();
      return Array.isArray(json.deposits) ? json.deposits : [];
    } catch (e) {
      console.warn('Backend sync failed:', e);
      return null;
    }
  }

  async function pushToBackend(address, deposit) {
    if (!BACKEND_URL || !address) return;
    try {
      await fetch(`${BACKEND_URL}/deposits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, deposit })
      });
    } catch (e) {
      console.warn('Backend push failed:', e);
    }
  }

  function formatDate(tsMs) {
    const d = new Date(tsMs);
    return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function ton(nano) {
    return Number(nano) / 1e9;
  }

  function renderDeposits(address) {
    const deposits = loadLocalDeposits(address);
    const hasDeposits = deposits.length > 0;

    depositsListEl.innerHTML = '';
    depositsListEl.hidden = !hasDeposits;
    emptyStateEl.hidden = hasDeposits;

    if (!hasDeposits) {
      updateTotalInvested(address);
      return;
    }

    deposits
      .sort((a, b) => b.createdAt - a.createdAt)
      .forEach(dep => {
        const item = document.createElement('div');
        item.className = 'deposit-item';

        const left = document.createElement('div');
        left.className = 'deposit-meta';
        left.innerHTML = `
          <span>Дата: ${formatDate(dep.createdAt)}</span>
          <span>Ставка: 144% APY</span>
        `;

        const right = document.createElement('div');
        right.className = 'deposit-amount';
        right.textContent = `${dep.amountTon.toFixed(2)} TON`;

        item.appendChild(left);
        item.appendChild(right);
        depositsListEl.appendChild(item);
      });

    updateTotalInvested(address);
  }

  function updateTotalInvested(address) {
    const deposits = loadLocalDeposits(address);
    const sum = deposits.reduce((acc, d) => acc + (Number(d.amountTon) || 0), 0);
    totalInvestedEl.textContent = `${sum.toFixed(2)} TON`;
  }

  // ==== БАЛАНС ====
  async function updateBalance(address) {
    if (!address) {
      balanceEl.textContent = 'Баланс: —';
      return;
    }
    try {
      const headers = TONAPI_KEY ? { Authorization: `Bearer ${TONAPI_KEY}` } : {};
      const res = await fetch(`https://tonapi.io/v2/accounts/${address}`, { headers });
      const data = await res.json();
      const nano = Number(data?.balance || 0);
      balanceEl.textContent = 'Баланс: ' + (nano / 1e9).toFixed(2) + ' TON';
    } catch (e) {
      console.warn('Не удалось получить баланс:', e);
      balanceEl.textContent = 'Баланс: —';
    }
  }

  // ==== ВЛОЖИТЬ 1 TON ====
  async function invest1Ton() {
    try {
      if (!tonConnectUI.account) {
        alert('Подключите кошелек TON через кнопку вверху.');
        return;
      }
      if (!RECIPIENT_ADDRESS || RECIPIENT_ADDRESS === 'YOUR_TON_ADDRESS_HERE') {
        alert('Укажите реальный адрес получателя в script.js (RECIPIENT_ADDRESS).');
        return;
      }

      const tx = {
        validUntil: Math.round(Date.now() / 1000) + 300,
        messages: [{ address: RECIPIENT_ADDRESS, amount: ONE_TON_NANO }]
      };

      await tonConnectUI.sendTransaction(tx);
      alert('Транзакция создана в вашем кошельке. Подтвердите перевод 1 TON.');

      // Сохраняем вклад локально (и опционально шлем на бэкенд)
      const address = tonConnectUI.account?.address;
      if (address) {
        const deposits = loadLocalDeposits(address);
        const deposit = {
          id: 'dep_' + Date.now(),
          createdAt: Date.now(),
          amountNano: Number(ONE_TON_NANO),
          amountTon: 1
        };
        deposits.push(deposit);
        saveLocalDeposits(address, deposits);
        renderDeposits(address);
        pushToBackend(address, deposit);
      }
    } catch (e) {
      console.error(e);
      alert('Ошибка при отправке транзакции: ' + (e?.message || e));
    }
  }

  investBtn?.addEventListener('click', invest1Ton);

  // ==== РЕАКЦИЯ НА ИЗМЕНЕНИЕ СТАТУСА TON CONNECT ====
  tonConnectUI.onStatusChange(async (wallet) => {
    const address = wallet?.account?.address;
    updateBalance(address);

    // При подключении — подтянем вклады (локально и, если есть, с бэкенда)
    if (address) {
      // локальные
      renderDeposits(address);
      // бэкенд
      const backendDeposits = await syncFromBackend(address);
      if (Array.isArray(backendDeposits)) {
        // Мержим простейшим образом: подменяем локальные бэкендовыми
        saveLocalDeposits(address, backendDeposits);
        renderDeposits(address);
      }
    } else {
      // если отключились
      depositsListEl.hidden = true;
      emptyStateEl.hidden = false;
      totalInvestedEl.textContent = '0 TON';
    }
  });

  // ==== ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ ====
  if (tonConnectUI.account?.address) {
    const address = tonConnectUI.account.address;
    updateBalance(address);
    renderDeposits(address);
  }
});










