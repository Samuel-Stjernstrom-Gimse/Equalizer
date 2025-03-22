import Particle from "./particle.js";

const appState = {
    fftSize: 128,
    fps: 20,
    particleCount: 25000,
    particleSize: 1
};

const fftSizes = [32, 64, 128, 256, 512, 1024];
const bucketBtn = document.querySelector('#bucket-btn');
let bucketIndex = 3;

bucketBtn.addEventListener('click', () => {
    bucketIndex = (bucketIndex + 1) % fftSizes.length;
    appState.fftSize = fftSizes[bucketIndex];

    console.log('Updated fftSize:', appState.fftSize);

    if (window.analyser) {
        window.analyser.fftSize = appState.fftSize;
        window.bufferLength = window.analyser.frequencyBinCount;
        window.dataArray = new Uint8Array(window.bufferLength);
        console.log('Analyser updated:', window.analyser.fftSize, 'New Buffer Length:', window.bufferLength);
    }
});

const particleCountSlider = document.querySelector('#particle-range');
let particles = [];

particleCountSlider.addEventListener('input', () => {
    appState.particleCount = particleCountSlider.valueAsNumber;
    console.log("Updated particle count:", appState.particleCount);
    regenerateParticles();
});

const canvas = document.querySelector('#eq-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

function regenerateParticles() {
    particles = Array.from({ length: appState.particleCount }, () => new Particle(appState.particleSize, ctx, canvas));
}

regenerateParticles();

async function getMicData() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();

        window.analyser = analyser;
        window.audioContext = audioContext;
        window.source = source;

        analyser.fftSize = appState.fftSize;
        window.bufferLength = analyser.frequencyBinCount;
        window.dataArray = new Uint8Array(window.bufferLength);

        source.connect(analyser);

        let prevBars = Array(window.bufferLength).fill({ height: 0 });

        function update() {
            analyser.getByteFrequencyData(window.dataArray);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const barWidth = canvas.width / window.bufferLength;
            let bars = [];

            window.dataArray.forEach((byte, i) => {
                const barHeight = (byte / 255) * canvas.height;
                const x = i * barWidth;
                bars.push({ x, width: barWidth, height: barHeight });

                ctx.fillStyle = `rgba(${byte * 1.3}, 120, ${byte * 0.7 + 140}, 1)`;
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            });

            particles.forEach((particle) => {
                particle.collision(bars, prevBars);
                particle.draw();
            });

            prevBars = bars.map(bar => ({ ...bar }));

            requestAnimationFrame(update);
        }

        update();
    } catch (err) {
        console.error("Microphone access error:", err);
    }
}

getMicData();
