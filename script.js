// Инициализация TonConnect UI
const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
    manifestUrl: 'https://ваша_ссылка/tonconnect-manifest.json', // !!! ОБЯЗАТЕЛЬНО ОБНОВИТЕ URL !!!
    buttonRootId: 'ton-connect'
});

// --- ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ---
let bonusBalance = 10.00; 
let depositBalance = 0.00; 
let totalDeposited = 0.00; 

let gameActive = false;
let multiplier = 1.00;
let betAmount = 0;
let betType = 'bonus'; 

let telegramUserData = {};
let walletAddress = 'Не подключен';

// --- ЭЛЕМЕНТЫ DOM ---
const bonusBalanceElement = document.getElementById('bonus-balance');
const depositBalanceElement = document.getElementById('deposit-balance');
const depositButton = document.getElementById('deposit-button');
const betTypeSelect = document.getElementById('bet-type');

const betAmountInput = document.getElementById('bet-amount');
const startButton = document.getElementById('start-button');
const cashoutButton = document.getElementById('cashout-button');
const rocketContainer = document.getElementById('game-container');
const rocketElement = document.getElementById('rocket');
const multiplierElement = document.getElementById('multiplier');

const nicknameElement = document.getElementById('nickname');
const telegramIdElement = document.getElementById('telegram-id');
const profileBonusBalanceElement = document.getElementById('profile-bonus-balance');
const profileDepositBalanceElement = document.getElementById('profile-deposit-balance');
const walletAddressElement = document.getElementById('wallet-address');
const totalDepositsElement = document.getElementById('total-deposits');
const depositModalButton = document.querySelector('.btn-deposit-option');


// --- ФУНКЦИИ ОБНОВЛЕНИЯ UI ---

function updateBalanceUI() {
    bonusBalanceElement.textContent = `${bonusBalance.toFixed(2)} TON`;
    depositBalanceElement.textContent = `${depositBalance.toFixed(2)} TON`;
    
    profileBonusBalanceElement.textContent = `${bonusBalance.toFixed(2)} TON`;
    profileDepositBalanceElement.textContent = `${depositBalance.toFixed(2)} TON`;
    totalDepositsElement.textContent = `${totalDeposited.toFixed(2)} TON`;

    const depositOption = betTypeSelect.querySelector('option[value="deposit"]');
    depositOption.disabled = depositBalance <= 0;
    
    if (!gameActive) {
         cashoutButton.style.display = 'none';
    }
    
    if (depositBalance <= 0 && bonusBalance <= 0) {
        startButton.disabled = true;
    } else {
        startButton.disabled = false;
    }
}

function updateMultiplierUI() {
    multiplierElement.textContent = `x${multiplier.toFixed(2)}`;
}

function moveRocket(distancePercentage) {
    rocketElement.style.transform = `translateY(-${distancePercentage}%) translateX(-50%)`;
}


// --- ЛОГИКА ИГРЫ ---

function startGame() {
    if (gameActive) return;

    betType = betTypeSelect.value;
    betAmount = parseFloat(betAmountInput.value);
    let currentBalance = (betType === 'bonus') ? bonusBalance : depositBalance;

    if (isNaN(betAmount) || betAmount <= 0.01 || betAmount > currentBalance || currentBalance <= 0) {
        window.Telegram.WebApp.showAlert(`Неверная ставка или нулевой баланс.`);
        return;
    }

    if (betType === 'bonus') {
        bonusBalance -= betAmount;
    } else {
        depositBalance -= betAmount;
    }
    updateBalanceUI();

    gameActive = true;
    startButton.disabled = true;
    startButton.textContent = 'В ИГРЕ...';
    cashoutButton.style.display = 'inline-block'; // Показываем кнопку
    
    // Сброс и активация анимаций
    multiplierElement.classList.remove('crashed');
    rocketContainer.classList.remove('crashed'); 
    rocketContainer.classList.add('flying'); 

    multiplier = 1.00;
    updateMultiplierUI();

    let rocketHeightPercent = 0;
    const baseGrowthRate = 0.01; 

    const intervalId = setInterval(() => {
        if (!gameActive) {
            clearInterval(intervalId);
            return;
        }

        multiplier += baseGrowthRate * (1 + (multiplier / 5)); 
        rocketHeightPercent = Math.min(95, rocketHeightPercent + (baseGrowthRate * 100));
        moveRocket(rocketHeightPercent);
        updateMultiplierUI();
    }, 100);

    const crashTime = Math.random() * (10000 - 3000) + 3000;

    const crashTimeout = setTimeout(() => {
        if (gameActive) {
            endGame(intervalId, null, false);
        }
    }, crashTime);

    const cashoutHandler = () => {
        if (!gameActive) return;
        endGame(intervalId, crashTimeout, true); 
        cashoutButton.removeEventListener('click', cashoutHandler);
    };

    cashoutButton.addEventListener('click', cashoutHandler);
}

/**
 * Завершает игру
 */
function endGame(intervalId, crashTimeout, success) {
    if (!gameActive) return;

    if (crashTimeout) clearTimeout(crashTimeout);
    clearInterval(intervalId);

    gameActive = false;
    startButton.disabled = false;
    startButton.textContent = 'Старт';
    cashoutButton.style.display = 'none';
    
    rocketContainer.classList.remove('flying');

    if (success) {
        const currentPayout = betAmount * multiplier;
        depositBalance += currentPayout; 
        updateBalanceUI();
        window.Telegram.WebApp.showAlert(`Вы забрали x${multiplier.toFixed(2)}! Выигрыш: ${currentPayout.toFixed(2)} TON.`);

    } else {
        // Краш анимация
        rocketContainer.classList.add('crashed');
        multiplierElement.classList.add('crashed'); 
        
        setTimeout(() => {
             rocketElement.style.transform = 'translateY(0) translateX(-50%)';
             rocketContainer.classList.remove('crashed');
        }, 500); 
        
        window.Telegram.WebApp.showAlert(`💥 ВЗРЫВ! Ракета взорвалась на x${multiplier.toFixed(2)}.`);
    }
}


// --- ЛОГИКА ДЕПОЗИТА TON CONNECT ---

const DEPOSIT_RECIPIENT_ADDRESS = 'UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJHkk'; 

async function sendDepositTransaction(amountTon) {
    if (!tonConnectUI.connected) {
        window.Telegram.WebApp.showAlert('Сначала подключите кошелек TON.');
        tonConnectUI.openModal();
        return;
    }
    
    const amountNano = amountTon * 1e9; 

    const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 360,
        messages: [{ address: DEPOSIT_RECIPIENT_ADDRESS, amount: amountNano.toString() }]
    };

    try {
        window.Telegram.WebApp.showLoader();
        await tonConnectUI.sendTransaction(transaction);
        window.Telegram.WebApp.hideLoader();
        
        // ИМИТАЦИЯ ЗАЧИСЛЕНИЯ
        depositBalance += amountTon;
        totalDeposited += amountTon;
        updateBalanceUI();
        window.Telegram.WebApp.showAlert(`✅ Успешно! Вам зачислен ${amountTon} TON (имитация).`);
        
    } catch (error) {
        window.Telegram.WebApp.hideLoader();
        window.Telegram.WebApp.showAlert('❌ Транзакция отменена или не удалась.');
    }
}


// --- ТОН И TELEGRAM API ---

async function updateProfileInfo() {
    try {
        if (window.Telegram && window.Telegram.WebApp && Telegram.WebApp.initDataUnsafe) {
            telegramUserData = Telegram.WebApp.initDataUnsafe.user || {};
            const username = telegramUserData.username;
            const firstName = telegramUserData.first_name;

            nicknameElement.textContent = username 
                ? `@${username}` 
                : (firstName || 'Не указан');
            
            telegramIdElement.textContent = telegramUserData.id || 'N/A';
        } else {
            nicknameElement.textContent = 'Браузерный режим';
            telegramIdElement.textContent = 'N/A (Браузер)';
        }
        walletAddressElement.textContent = walletAddress;
        updateBalanceUI();
    } catch (error) {
        console.error('Ошибка при получении данных профиля:', error);
    }
}

tonConnectUI.onStatusChange(async (wallet) => {
    if (wallet && wallet.account) {
        const addr = wallet.account.address;
        walletAddress = `${addr.substring(0, 4)}...${addr.substring(addr.length - 4)}`;
    } else {
        walletAddress = 'Не подключен';
    }
    updateProfileInfo(); 
});


// --- ИНИЦИАЛИЗАЦИЯ И ОБРАБОТЧИКИ ---

document.addEventListener('DOMContentLoaded', async function () {
    
    if (window.Telegram && window.Telegram.WebApp) {
        Telegram.WebApp.ready();
        Telegram.WebApp.setBackgroundColor('#121212');
        Telegram.WebApp.setHeaderColor('#121212');
        Telegram.WebApp.expand();
    } else {
        window.Telegram = { WebApp: { showAlert: alert, ready: () => {}, showLoader: () => {}, hideLoader: () => {} } };
    }
    
    await updateProfileInfo();
    
    // Навигация
    const navLinks = document.querySelectorAll('.bottom-nav a');
    const pages = document.querySelectorAll('.page');
    
    function navigateTo(pageId) {
        window.scrollTo(0, 0); 

        pages.forEach(page => page.classList.remove('active'));
        navLinks.forEach(link => link.classList.remove('active'));

        document.getElementById(pageId).classList.add('active');
        document.querySelector(`.bottom-nav a[data-page="${pageId}"]`).classList.add('active');
        
        if (pageId === 'profile-page') {
            updateProfileInfo();
        }
    }

    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            navigateTo(this.getAttribute('data-page'));
        });
    });

    // Обработчики
    startButton.addEventListener('click', startGame);
    
    // Кнопка "+" в верхнем баре
    depositButton.addEventListener('click', () => { navigateTo('profile-page'); });
    
    // Кнопка депозита в профиле
    depositModalButton.addEventListener('click', () => {
        const amount = parseFloat(depositModalButton.getAttribute('data-amount'));
        sendDepositTransaction(amount);
    });
    
    // Обработчик выбора типа ставки
    betTypeSelect.addEventListener('change', () => {
        betType = betTypeSelect.value;
        const maxBet = (betType === 'bonus') ? bonusBalance : depositBalance;
        betAmountInput.max = maxBet.toFixed(2);
    });

    navigateTo('game-page'); 
    updateBalanceUI();
});











