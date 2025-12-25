// Инициализация TON Connect
const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
  manifestUrl: 'https://www.wh27199.web1.maze-tech.ru/tonconnect-manifest.json',
  buttonRootId: null  // отключаем стандартную кнопку, реализуем свою
});

// Обработка "О нас"
const aboutDiv = document.getElementById('aboutUs');
aboutDiv.addEventListener('click', () => {
  aboutDiv.classList.toggle('open');
});

// Переключение вкладок
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// В начале подгружаем данные Telegram WebApp
window.onload = () => {
  const webApp = window.Telegram?.WebApp;
  if (webApp) {
    const data = webApp.initDataUnsafe;
    document.getElementById('tgUsername').innerText = data?.username || 'Неизвестно';
  } else {
    document.getElementById('tgUsername').innerText = 'Неизвестно';
  }
};

// Оставляем стандартную кнопку "Connect Wallet" рабочей внутри TON Connect
const connectBtn = document.getElementById('connectBtn');

connectBtn.addEventListener('click', async () => {
  try {
    await tonConnectUI.toggleConnect();
  } catch (e) {
    alert('Ошибка при подключении кошелька');
    console.error(e);
  }
});

// После подключения показываем активность
tonConnectUI.on('connect', () => {
  connectBtn.innerText = 'Кошелек подключен';
  // Можно получить адрес
  // const address = tonConnectUI.account?.address;
 window.location.reload();
});

// Т.к. у вас в стиле было "время не дождался" — добавим проверку
if (!tonConnectUI.account) {
  connectBtn.innerText = 'Connect Wallet';
}

// Обработка кнопки "Вложить 1 TON"
document.getElementById('investBtn').addEventListener('click', async () => {
  if (!tonConnectUI.account) {
    alert('Пожалуйста, подключите кошелек');
    return;
  }
  const amountNano = 1e9; // 1 TON
  const transaction = {
    validUntil: Math.floor(Date.now() / 1000) + 300,
    messages: [{
      address: 'UQApR3StsZJSGEFspLUoD_5Aj9R28WLVq94Mqzrv1P8OKs5Z',
      amount: amountNano.toString()
    }]
  };
  try {
    await tonConnectUI.sendTransaction(transaction);
    alert('Транзакция отправлена!');
    // Тут можно отправлять данные на сервер
    // await recordDeposit(amountNano, 'user_id');
    // Обновлять вывод суммы и дохода по API
    // Пока оставим статикой
    document.getElementById('totalDeposit').innerText = (parseInt(document.getElementById('totalDeposit').innerText)*1e9 + amountNano)/1e9;
    // пересчитываем ожидаемый доход
    const incomeTON = (amountNano / 1e9) * 144/100;
    document.getElementById('expectedIncome').innerText = `Ваш ожидаемый доход - ${incomeTON.toFixed(2)} TON`;
  } catch (e) {
    alert('Ошибка при транзакции');
    console.error(e);
  }
});











