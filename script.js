const spinButton = document.getElementById('spinButton');
const resultDiv = document.getElementById('result');
const spinSound = document.getElementById('spinSound');
const winSound = document.getElementById('winSound');
const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const arrow = document.querySelector('.arrow');

let spinning = false;
const prizes = ['Ничего', 'Boost', 'Bow Tie', 'Lol Pop'];
const colors = ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12'];
const numSlices = prizes.length;
let rotation = 0;
let animFrameId;

// Radius to move the text offset from the center
const textRadiusOffset = 30;
const fontSize = 20;

function drawRoulette() {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(centerX, centerY) - 50;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Improved drawing for better visuals
  for (let i = 0; i < numSlices; i++) {
        const startAngle = i * (2 * Math.PI / numSlices);
        const endAngle = (i + 1) * (2 * Math.PI / numSlices);

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.fillStyle = colors[i];
        ctx.fill();
        ctx.closePath();

        // Enhanced Outline
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)'; // Darker outline
        ctx.lineWidth = 3; // Thicker outline
        ctx.stroke();
        ctx.closePath();

    // Text rendering
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(startAngle + (Math.PI / numSlices));
    ctx.fillStyle = 'white';
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'black';
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.shadowBlur = 3;
    ctx.fillText(prizes[i], radius / 2 + textRadiusOffset, 7);
    ctx.restore();
  }
}

function spinRoulette() {
    if (spinning) return;
    spinning = true;
    spinButton.disabled = true;

    spinSound.loop = true;
    spinSound.play();

    let rotations = 5 + Math.random() * 3;
    let endAngle = Math.random() * (2 * Math.PI);

    const animationDuration = 5000;
    let startTime = null;

    function animate(currentTime) {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / animationDuration, 1);

        rotation = rotations * 2 * Math.PI * progress + endAngle * progress;
        rotation = rotation % (2 * Math.PI);
        canvas.style.transform = `rotate(${rotation}rad)`;

        if (progress < 1) {
            animFrameId = requestAnimationFrame(animate);
        } else {
            spinning = false;
            spinButton.disabled = false;
            spinSound.pause();
            spinSound.currentTime = 0;
            winSound.play();

            // Determine outcome
            // Determine outcome (accounting for the arrow at the bottom)
            let winningSlice = Math.floor((rotation / (2 * Math.PI)) * numSlices) % numSlices;
            winningSlice = (numSlices - winningSlice) % numSlices; // Adjust to arrow being at the bottom

            const prize = prizes[winningSlice];
            resultDiv.innerText = 'Вы выиграли: ' + prize;
        }
    }

    if (animFrameId) {
        cancelAnimationFrame(animFrameId);
    }
    startTime = null;
    animFrameId = requestAnimationFrame(animate);
}

// Tab navigation
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', function(event) {
        event.preventDefault();
        const tabId = this.getAttribute('data-tab');

        // Deactivate existing tab and content
        document.querySelector('.tab-button.active').classList.remove('active');
        document.querySelector('.tab-content.active').classList.remove('active');

        // Activate new tab and content
        this.classList.add('active');
        document.getElementById(tabId).classList.add('active');

        // Re-initialize specific components if necessary
        if (tabId === 'wheel') {
            // Re-draw roulette if the wheel tab is activated again
            drawRoulette();
        }
    });
});

// Ensure the wheel tab is active on page load
document.querySelector('.tab-button[data-tab="wheel"]').classList.add('active');
document.getElementById('wheel').classList.add('active');

// Initial draw (if wheel is the default tab)
drawRoulette();

spinButton.addEventListener('click', spinRoulette);











