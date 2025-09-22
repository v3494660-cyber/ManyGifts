document.addEventListener('DOMContentLoaded', async () => {
    // Theme Toggle
    function applyTheme(themeName) {
        document.body.className = themeName;
        localStorage.setItem('theme', themeName);
    }

    // Wheel functionality (Dummy data for now)
    const wheelCanvas = document.getElementById('wheelCanvas');
    const spinButton = document.getElementById('spinButton');
    const resultElement = document.getElementById('result');
    const ctx = wheelCanvas.getContext('2d');

    const prizes = ['Lol Pop', 'Toy Bears', '2 Ton', 'Boost'];
    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'];
    let spinTimeout;

    // Draw Wheel
    const drawWheel = () => {
        const radius = wheelCanvas.width / 2;
        const arc = 2 * Math.PI / prizes.length;

        for (let i = 0; i < prizes.length; i++) {
            ctx.beginPath();
            ctx.arc(radius, radius, radius, i * arc, (i + 1) * arc);
            ctx.fillStyle = colors[i % colors.length];
            ctx.lineTo(radius, radius);
            ctx.fill();

            ctx.save();
            ctx.fillStyle = 'white';
            ctx.font = '16px sans-serif';
            ctx.translate(radius, radius);
            ctx.rotate(i * arc + arc / 2);
            ctx.fillText(prizes[i], radius / 2, 10);
            ctx.restore();
        }
    };

    // Spin Wheel
    const spinWheel = () => {
        spinButton.disabled = true;
        const rand = Math.floor(Math.random() * prizes.length);
        const deg = 360 * 50 + rand * (360 / prizes.length);
        wheelCanvas.style.transition = 'transform 5s cubic-bezier(0.25, 0.1, 0.25, 1)';
        wheelCanvas.style.transform = `rotate(${deg}deg)`;

        clearTimeout(spinTimeout)
        spinTimeout = setTimeout(() => {
            wheelCanvas.style.transition = 'none';
            const actualDeg = deg % 360;
            const prizeIndex = prizes.length - 1 - Math.floor(actualDeg / (360 / prizes.length));

            resultElement.textContent = `Вы выиграли: ${prizes[prizeIndex]}`;
            spinButton.disabled = false;
        }, 5000);
    };

    drawWheel();
    spinButton.addEventListener('click', spinWheel);

    // Tabs
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Deactivate all tabs
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.style.display = 'none');

            // Activate selected tab
            button.classList.add('active');
            document.getElementById(button.dataset.tab).style.display = 'block';
        });
    });

    // Toggle Dark Theme
    document.body.classList.toggle('dark-theme');


    // Ton Connect integration
    const connectWalletButton = document.getElementById('connectWalletButton');
    const walletAddressElement = document.getElementById('walletAddress');
    const connector = new TonConnectUI({ manifestUrl: 'manifest.json' });


    connector.onStatusChange(async wallet => {
        if (wallet) {
            walletAddressElement.textContent = `Wallet: ${wallet.account.address}`;
            connectWalletButton.textContent = 'Отключить кошелек';
        } else {
            walletAddressElement.textContent = '';
            connectWalletButton.textContent = 'Подключить кошелек';
        }
    });

    connectWalletButton.addEventListener('click', async () => {
        if (connector.account) {
            await connector.disconnect();
        } else {
            await connector.openWallet();
        }
    });











