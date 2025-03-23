import Particle from "./particle.js";

/**
 * Global application state
 * @type {Object}
 * @property {number} fftSize - Size of the FFT (Fast Fourier Transform) window
 * @property {number} fps - Frames per second for rendering
 * @property {number} particleCount - Number of particles in the animation
 * @property {number} particleSize - Size of each particle
 */
const appState = {
    fftSize: 512,
    fps: 20,
    particleCount: 2500,
    particleSize: 1,
    smoothing: 0.2
};

const smoothingInput = document.getElementById("smoothing");

smoothingInput.addEventListener("input", () => {
    appState.smoothing = smoothingInput.value / 100;
})

const particleSizeSlider = document.querySelector('#particle-size');

/**
 * Updates particle size based on slider input
 */
particleSizeSlider.addEventListener('input', () => {
    appState.particleSize = particleSizeSlider.valueAsNumber;
    console.log("Updated particle size:", appState.particleSize);
    regenerateParticles();
});

/**
 * Array of color themes based on audio byte values
 * @type {Array<Function>}
 */
const themes = [
    (byte) => `rgba(${byte * 1.3}, 120, ${byte * 0.7 + 140}, 1)`,  // 1. Default Blue
    (byte) => `rgba(${byte}, ${byte * 0.8}, 255, 1)`,  // 2. Light Blue
    (byte) => `rgba(255, ${byte * 0.8}, ${byte * 0.5}, 1)`,  // 3. Warm Orange
    (byte) => `rgba(${byte * 0.5}, 255, ${byte * 0.8}, 1)`,  // 4. Greenish
    (byte) => `rgba(${byte * 0.9}, ${byte * 0.5}, 255, 1)`,  // 5. Purple
    (byte) => `rgba(${byte * 0.7}, ${byte * 1.2}, ${byte * 0.5}, 1)`,  // 6. Earth Tones
    (byte) => `rgba(255, 255, ${byte}, 1)`,  // 7. Yellow Tint
    (byte) => `rgba(${byte * 1.2}, ${byte * 0.5}, ${byte * 0.8}, 1)`,  // 8. Pinkish
    (byte) => `rgba(${byte * 0.8}, ${byte * 1.5}, 100, 1)`,  // 9. Neon Green
    (byte) => `rgba(255, ${byte}, ${byte * 0.5}, 1)`,  // 10. Sunset

    // 🌟 New 20 Themes Below 🌟

    (byte) => `rgba(${byte * 1.1}, ${byte * 0.6}, ${byte * 1.4}, 1)`,  // 11. Electric Purple
    (byte) => `rgba(${byte * 1.2}, ${byte * 0.9}, ${byte * 0.3}, 1)`,  // 12. Gold Shine
    (byte) => `rgba(${byte * 1.4}, ${byte * 0.4}, ${byte * 1.2}, 1)`,  // 13. Dark Magenta
    (byte) => `rgba(0, ${byte * 1.5}, ${byte * 0.6}, 1)`,  // 14. Teal Ocean
    (byte) => `rgba(${byte * 0.8}, ${byte * 0.3}, ${byte * 1.5}, 1)`,  // 15. Cyberpunk Pink
    (byte) => `rgba(${byte * 1.6}, ${byte * 0.5}, ${byte * 0.2}, 1)`,  // 16. Deep Red
    (byte) => `rgba(${byte * 1.3}, ${byte * 0.9}, 255, 1)`,  // 17. Frost Blue
    (byte) => `rgba(100, ${byte * 1.4}, ${byte * 0.9}, 1)`,  // 18. Pastel Peach
    (byte) => `rgba(${byte * 0.2}, ${byte * 1.3}, 255, 1)`,  // 19. Aqua
    (byte) => `rgba(255, ${byte * 0.6}, ${byte * 1.5}, 1)`,  // 20. Rose Quartz

    (byte) => `rgba(${byte * 0.9}, ${byte * 1.2}, 80, 1)`,  // 21. Greenish Gold
    (byte) => `rgba(255, ${byte * 0.4}, ${byte * 1.3}, 1)`,  // 22. Deep Pink
    (byte) => `rgba(${byte * 0.3}, ${byte * 1.2}, ${byte * 0.9}, 1)`,  // 23. Cool Mint
    (byte) => `rgba(${byte * 1.4}, ${byte * 0.7}, ${byte * 1.1}, 1)`,  // 24. Cosmic Lavender
    (byte) => `rgba(255, ${byte * 1.3}, ${byte * 0.6}, 1)`,  // 25. Soft Apricot
    (byte) => `rgba(${byte * 1.5}, ${byte * 0.8}, 200, 1)`,  // 26. Bright Coral
    (byte) => `rgba(${byte * 0.5}, 255, ${byte * 0.7}, 1)`,  // 27. Nature Green
    (byte) => `rgba(${byte * 0.7}, ${byte * 1.6}, 150, 1)`,  // 28. Lime Punch
    (byte) => `rgba(${byte * 1.3}, ${byte * 1.4}, 255, 1)`,  // 29. Arctic Blue
    (byte) => `rgba(${byte * 0.2}, ${byte * 1.5}, ${byte * 1.3}, 1)`,  // 30. Turquoise Dream
];

const fftSizes = [32, 64, 128, 256, 512, 1024];
const bucketBtn = document.querySelector('#bucket-btn');
let bucketIndex = 4;

/**
 * Switches FFT size and resets audio processing
 */
bucketBtn.addEventListener('click', () => {
    bucketIndex = (bucketIndex + 1) % fftSizes.length;
    appState.fftSize = fftSizes[bucketIndex];

    console.log('Updated fftSize:', appState.fftSize);

    if (window.analyser) {
        window.analyser.fftSize = appState.fftSize;
        window.bufferLength = window.analyser.frequencyBinCount;
        window.dataArray = new Uint8Array(window.bufferLength);

        // ✅ Reset prevBars to avoid undefined errors
        prevBars = Array.from({ length: window.bufferLength }, () => ({ height: 0 }));

        console.log('Analyser updated:', window.analyser.fftSize, 'New Buffer Length:', window.bufferLength);
    }

    bucketBtn.textContent = `Bucket Size: ${fftSizes[bucketIndex]}`;
});

/**
 * Current theme index
 * @type {number}
 */
let themeIndex = 0;
const themeBtn = document.querySelector('#theme-btn');

/**
 * Switches to the next color theme
 */
themeBtn.addEventListener('click', () => {
    themeIndex = (themeIndex + 1) % themes.length;
    themeBtn.textContent = `Theme ${themeIndex}`;
    console.log(`Switched to theme ${themeIndex}`);
});

const particleCountSlider = document.querySelector('#particle-range');
let particles = [];

/**
 * Updates particle count and regenerates particles
 */
particleCountSlider.addEventListener('input', () => {
    appState.particleCount = particleCountSlider.valueAsNumber;
    console.log("Updated particle count:", appState.particleCount);
    regenerateParticles();
});

const canvas = document.querySelector('#eq-canvas');
const ctx = canvas.getContext('2d');

/**
 * Resizes the canvas based on window size
 */
function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

/**
 * Regenerates particles for visualization
 */
function regenerateParticles() {
    particles = Array.from({ length: appState.particleCount }, () => new Particle(appState.particleSize, ctx, canvas));
}

regenerateParticles();

/**
 * Stores previous bar heights for smoothing effect
 * @type {Array<{height: number}>}
 */
let prevBars = [];

/**
 * Requests microphone access and starts audio visualization
 * @async
 */
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

        prevBars = Array.from({ length: window.bufferLength }, () => ({ height: 0 }));



        /**
         * Updates the visualization on each frame
         */
        function update() {
            const SMOOTHING_FACTOR = appState.smoothing;

            analyser.getByteFrequencyData(window.dataArray);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const barWidth = canvas.width / window.bufferLength;
            let bars = [];

            window.dataArray.forEach((byte, i) => {
                const targetHeight = (byte / 255) * canvas.height;

                const smoothedHeight = prevBars[i].height + (targetHeight - prevBars[i].height) * SMOOTHING_FACTOR;

                const x = i * barWidth;

                bars.push({ x, width: barWidth, height: smoothedHeight });

                ctx.fillStyle = themes[themeIndex](byte);
                ctx.fillRect(x, canvas.height - smoothedHeight, barWidth, smoothedHeight);
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
