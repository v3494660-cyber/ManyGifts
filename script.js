const spinButton = document.getElementById('spinButton');
const resultDiv = document.getElementById('result');
const spinSound = document.getElementById('spinSound');
const winSound = document.getElementById('winSound');
const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');

const connectWalletButton = document.getElementById('connectWalletButton');
const walletAddressElement = document.getElementById('walletAddress');

// Параметры колеса
const prizes = ['Ничего', 'Lol Pop', 'Bow Tie', '2 Ton'];
const colors = ['gray', 'purple', 'yellow', 'green'];
const prizePercentages = [0.70, 0.20, 0.05, 0.05];
const numSlices = prizes.length;

// Углы
let rotationAngle = 0;
let spinSpeed = 0;
let animationFrameId;

// Физика вращения
const friction = 0.995; //трение(замедление)
const baseSpinSpeed = 5; //скорость вращения

// Определяем центральный угол для каждой зоны
const prizeAngles = prizePercentages.map((percentage, index) => {
    let angle = 0;
    for (let i = 0; i < index; i++) {
        angle += 2 * Math.PI * prizePercentages[i];
    }
    return angle + (2 * Math.PI * percentage) / 2;
});


// Функция для отрисовки сектора с тенью и подсветкой
function drawSlice(ctx, centerX, centerY, radius, startAngle, endAngle, color, prize) {
    // Тень
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle, false);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Подсветка
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle - 0.1, false);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Надпись
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(startAngle + (endAngle - startAngle) / 2);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'transparent'; // Убираем тень для текста
    ctx.fillText(prize, radius / 2, 0);
    ctx.restore();
}

// Рисуем колесо
function drawWheel() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Рисуем фон колеса
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 10, 0, 2 * Math.PI);
    ctx.fill();

    // Рисуем сектора
    let currentAngle = 0;
    for (let i = 0; i < numSlices; i++) {
        const angle = 2 * Math.PI * prizePercentages[i];
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;

        drawSlice(ctx, centerX, centerY, radius, startAngle, endAngle, colors[i], prizes[i]);
        currentAngle += angle;
    }

    // Рисуем центральный круг
    ctx.beginPath();
    ctx.arc(centerX, centerY, 50, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
}

// Функция для запуска вращения
function spinWheel() {
    // Проверка, что колесо не вращается
    if (animationFrameId) {
        return;
    }

    // Задаем случайную скорость вращения
    spinSpeed = baseSpinSpeed + Math.random() * 3;

    // Запускаем звук вращения
    spinSound.loop = true;
    spinSound.play();

    // Блокируем кнопку вращения
    spinButton.disabled = true;

    // Запускаем анимацию
    animate();
}

// Анимация вращения
function animate() {
    // Уменьшаем скорость вращения
    spinSpeed *= friction;

    // Вращаем колесо
    rotationAngle += spinSpeed;
    rotationAngle %= (2 * Math.PI);

    // Перерисовываем колесо
    drawWheel();
    canvas.style.transform = `rotate(${rotationAngle}rad)`;

    // Проверяем, закончено ли вращение
    if (spinSpeed < 0.02) {
        // Останавливаем анимацию
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;

        // Останавливаем звук вращения
        spinSound.pause();
        spinSound.currentTime = 0;

        // Воспроизводим звук выигрыша
        winSound.play();

        // Определяем выигрышную зону
        const winningPrize = determineWinningPrize();

        // Выводим результат
        resultDiv.innerText = 'Вы выиграли: ' + winningPrize;

        // Разблокируем кнопку вращения
        spinButton.disabled = false;

        return;
    }

    // Запускаем следующий кадр анимации
    animationFrameId = requestAnimationFrame(animate);
}

//Определение выигрышной зоны
function determineWinningPrize() {
    // Угол, на который указывает стрелка
    let arrowAngle = rotationAngle;

    // Инвертируем угол, т.к. колесо вращается против часовой стрелки
    arrowAngle = (2 * Math.PI) - arrowAngle;

    // Нормализуем угол
    arrowAngle %= (2 * Math.PI);

    // Находим ближайший угол зоны
    let closestAngle = prizeAngles[0];
    let closestIndex = 0;

    for (let i = 1; i < prizeAngles.length; i++) {
        if (Math.abs(arrowAngle - prizeAngles[i]) < Math.abs(arrowAngle - closestAngle)) {
            closestAngle = prizeAngles[i];
            closestIndex = i;
        }
    }

    return prizes[closestIndex];
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
//  ЛОГИКА ВКЛАДОК (полная переработка и отладка)
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const inventoryMessage = document.getElementById('inventory-message');

    // Функция для скрытия всех вкладок
    const hideAllTabs = () => {
        tabContents.forEach(tabContent => {
            tabContent.style.display = 'none';
        });
        tabButtons.forEach(tabButton => {
            tabButton.classList.remove('active');
        });
    };

    // Функция для отображения выбранной вкладки
    const showTab = (tabId) => {
        hideAllTabs();
        const tab = document.getElementById(tabId);
        const button = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
        if (tab) {
            tab.style.display = 'block';
            button.classList.add('active');

            // Если это вкладка инвентаря и инвентарь пуст
            if (tabId === 'inventory-tab' && !inventoryMessage.textContent.trim()) {
                inventoryMessage.textContent = 'Инвентарь пуст';
            }
        }
    };

    // Обработчики кликов на кнопки вкладок
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            showTab(tabId);
        });
    });

    // По умолчанию отображаем вкладку колеса
    showTab('wheel-tab');
});

// Остальной код (кнопки, кошелек и т.д.)
drawWheel();

spinButton.addEventListener('click', spinWheel);

connectWalletButton.addEventListener('click', async () => {
    alert("Функциональность подключения кошелька будет добавлена позже!");
});











