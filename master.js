import Particle from "./particle.js";
const appState = {
    fftSize: 128,
    fps: 20,
    particleCount: 20000,
    particleSize: 1
};

const fftSizes = [32, 64, 128, 256, 512, 1024];

const bucketBtn = document.querySelector('#bucket-btn');
let bucketIndex = 0;

bucketBtn.addEventListener('click', () => {
    bucketIndex = (bucketIndex + 1) % fftSizes.length; // Cycle through fftSizes
    appState.fftSize = fftSizes[bucketIndex];

    console.log('Updated fftSize:', appState.fftSize);

    if (window.analyser) {
        window.analyser.fftSize = appState.fftSize;
        window.bufferLength = window.analyser.frequencyBinCount;
        window.dataArray = new Uint8Array(window.bufferLength);

        console.log('Analyser updated:', window.analyser.fftSize, 'New Buffer Length:', window.bufferLength);
    }
});

const canvas = document.querySelector('#eq-canvas');
const ctx = canvas.getContext('2d');

/**
 * Resizes the canvas for high-DPI displays.
 */
function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Create square particles
const particles = Array.from({ length: appState.particleCount }, () => new Particle(appState.particleSize, ctx, canvas));

/**
 * Captures microphone input and visualizes the audio frequencies.
 */
async function getMicData() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();

        window.analyser = analyser; // Store globally to update later
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

                ctx.fillStyle = `rgba(${byte * 1.3},120,  ${byte * 0.7 + 140}, 1)`;
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            });

            // Update and draw particles
            particles.forEach((particle) => {
                particle.collision(bars, prevBars);
                particle.draw();
            });

            prevBars = bars.map(bar => ({ ...bar })); // Save previous frame

            requestAnimationFrame(update);
        }

        update();
    } catch (err) {
        console.error("Microphone access error:", err);
    }
}

getMicData();
