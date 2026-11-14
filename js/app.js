/**
 * HandConnect Main Application Controller
 */
const themes = {
    'Rainbow': (t, index, total) => `hsl(${(t * 100 + index * (360 / total)) % 360}, 100%, 60%)`,
    'Cyberpunk': (t, index) => (index % 2 === 0 ? '#ff003c' : '#00f0ff'),
    'Lava': (t, index) => `hsl(${(10 + (index * 10)) % 40}, 100%, ${50 + Math.sin(t) * 10}%)`,
    'Ocean': (t, index) => `hsl(${180 + (index * 20)}, 100%, 60%)`,
    'Galaxy': (t, index) => `hsl(${260 + Math.sin(t * 2 + index) * 40}, 100%, 65%)`,
    'Synthwave': (t, index) => `hsl(${(310 + (index * 25) + Math.sin(t * 2) * 20) % 360}, 100%, 60%)`,
    'Supernova': (t, index) => `hsl(${(45 + Math.sin(t * 3 + index) * 20)}, 100%, ${70 + Math.sin(t * 2) * 20}%)`
};

class HandConnectApp {
    constructor() {
        this.videoElement = document.querySelector('.input_video');
        this.bgCanvas = document.getElementById('bgCanvas');
        this.mainCanvas = document.getElementById('mainCanvas');
        this.ctx = this.mainCanvas ? this.mainCanvas.getContext('2d') : null;

        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.time = 0;
        this.lastTime = performance.now();
        this.framesThisSecond = 0;
        this.lastFpsTime = performance.now();

        this.currentHands = [];
        this.handVelocities = 0;
        this.currentTheme = 'Rainbow';

        this.audioEngine = new AudioEngine();
        this.particleSystem = new ParticleSystem(100, 25);
        this.matrixRain = new MatrixRain(this.bgCanvas, 16);
        this.gestureDetector = new GestureDetector();
        this.tracker = null;

        this.uiHands = document.getElementById('ui-hands');
        this.uiFps = document.getElementById('ui-fps');
        this.uiGesture = document.getElementById('ui-gesture');
        this.uiSpread = document.getElementById('ui-spread');

        this.appStarted = false;
        this.animationId = null;

        this.init();
    }

    init() {
        this.initEntryParticles();
        this.setupEventListeners();
        this.resize();
    }

    initEntryParticles() {
        const epc = document.getElementById('entryParticles');
        if (!epc) return;
        const ectx = epc.getContext('2d');
        let ew = (epc.width = window.innerWidth);
        let eh = (epc.height = window.innerHeight);
        const dots = [];
        let animId;

        for (let i = 0; i < 60; i++) {
            dots.push({
                x: Math.random() * ew,
                y: Math.random() * eh,
                vx: (Math.random() - 0.5) * 0.6,
                vy: (Math.random() - 0.5) * 0.6,
                r: Math.random() * 1.5 + 0.5,
                a: Math.random() * 0.4 + 0.1
            });
        }

        const drawEntry = () => {
            ectx.clearRect(0, 0, ew, eh);
            dots.forEach((d) => {
                d.x += d.vx;
                d.y += d.vy;
                if (d.x < 0) d.x = ew;
                if (d.x > ew) d.x = 0;
                if (d.y < 0) d.y = eh;
                if (d.y > eh) d.y = 0;
                ectx.beginPath();
                ectx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
                ectx.fillStyle = `rgba(255, 255, 255, ${d.a})`;
                ectx.fill();
            });

            for (let i = 0; i < dots.length; i++) {
                for (let j = i + 1; j < dots.length; j++) {
                    const dx = dots[i].x - dots[j].x;
                    const dy = dots[i].y - dots[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 120) {
                        ectx.beginPath();
                        ectx.moveTo(dots[i].x, dots[i].y);
                        ectx.lineTo(dots[j].x, dots[j].y);
                        ectx.strokeStyle = `rgba(255, 255, 255, ${0.06 * (1 - dist / 120)})`;
                        ectx.stroke();
                    }
                }
            }
            animId = requestAnimationFrame(drawEntry);
        };

        drawEntry();

        const handleEntryResize = () => {
            ew = epc.width = window.innerWidth;
            eh = epc.height = window.innerHeight;
        };
        window.addEventListener('resize', handleEntryResize);

        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                cancelAnimationFrame(animId);
                window.removeEventListener('resize', handleEntryResize);
            }, { once: true });
        }
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.resize());

        document.querySelectorAll('.theme-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.theme-btn').forEach((b) => b.classList.remove('active'));
                const target = e.currentTarget;
                target.classList.add('active');
                this.currentTheme = target.getAttribute('data-theme') || 'Rainbow';
                document.documentElement.style.setProperty('--accent', themes[this.currentTheme](0, 1, 1));
            });
        });

        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.start());
        }
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        if (this.mainCanvas) {
            this.mainCanvas.width = this.width;
            this.mainCanvas.height = this.height;
        }
        if (this.matrixRain) {
            this.matrixRain.resize(this.width, this.height);
        }
    }

    showError(msg) {
        const banner = document.getElementById('errorBanner');
        if (banner) {
            banner.textContent = msg;
            banner.classList.remove('hidden');
        }
    }

    start() {
        if (this.appStarted) return;
        this.appStarted = true;

        const overlay = document.getElementById('startOverlay');
        const hud = document.getElementById('hud');
        const themesBar = document.getElementById('themes');

        if (overlay) overlay.classList.add('hidden');
        if (hud) hud.classList.remove('hidden');
        if (themesBar) themesBar.classList.remove('hidden');

        this.audioEngine.init();
        this.initTracker();
        this.renderLoop(performance.now());
    }

    initTracker() {
        this.tracker = new HandTracker(
            this.videoElement,
            {
                maxNumHands: 2,
                modelComplexity: 0,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.4
            },
            {
                onResults: (results) => {
                    if (this.uiHands) {
                        this.uiHands.innerText = results.multiHandLandmarks ? results.multiHandLandmarks.length : 0;
                    }

                    let targetVel = 0;
                    if (this.currentHands.length > 0 && results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                        const oldP = this.currentHands[0][8];
                        const newP = results.multiHandLandmarks[0][8];
                        if (oldP && newP) {
                            targetVel = getDist(oldP, newP);
                        }
                    }
                    this.handVelocities += (targetVel - this.handVelocities) * 0.25;

                    this.currentHands = results.multiHandLandmarks || [];
                    this.audioEngine.updateHum(this.currentHands);
                },
                onError: (err) => {
                    console.error("Tracker error:", err);
                    this.showError(err.message || "Failed to start camera or tracking.");
                }
            }
        );

        this.tracker.start();
    }

    updateGestures() {
        const res = this.gestureDetector.detect(this.currentHands);
        if (this.uiGesture) this.uiGesture.innerText = res.gesture;
        if (this.uiSpread) this.uiSpread.innerText = `${res.spreadPct}%`;

        if (res.newPinch && res.midpoint) {
            const mapped = mapToCanvas(res.midpoint, this.width, this.height);
            this.particleSystem.emitShockwave(mapped, themes[this.currentTheme](this.time, 1, 1));
            this.audioEngine.triggerZap();
        }
    }

    renderLoop(timestamp) {
        this.animationId = requestAnimationFrame((ts) => this.renderLoop(ts));

        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;
        this.time += dt;

        this.framesThisSecond++;
        if (timestamp > this.lastFpsTime + 1000) {
            if (this.uiFps) this.uiFps.innerText = this.framesThisSecond;
            this.framesThisSecond = 0;
            this.lastFpsTime = timestamp;
        }

        const themeColor = themes[this.currentTheme](this.time, 1, 1);
        this.matrixRain.render(themeColor, this.handVelocities);

        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.globalCompositeOperation = 'screen';

        this.particleSystem.updateAndRender(this.ctx);

        if (this.currentHands.length > 0) {
            this.currentHands.forEach((hand, handIndex) => {
                const glowColor = themes[this.currentTheme](this.time, handIndex, 2);

                drawHandBones(this.ctx, hand, glowColor, this.width, this.height);

                FINGER_TIPS.forEach((tipIndex, idx) => {
                    const pt = mapToCanvas(hand[tipIndex], this.width, this.height);
                    const tipCol = themes[this.currentTheme](this.time, idx, FINGER_TIPS.length);

                    this.ctx.beginPath();
                    this.ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
                    this.ctx.fillStyle = '#fff';
                    this.ctx.fill();

                    if (Math.random() > 0.8) {
                        this.particleSystem.emit(pt, tipCol, 1);
                    }
                });

                const spread = getDist(hand[8], hand[20]);
                if (spread > 0.08) {
                    const tips = FINGER_TIPS.map((t) => mapToCanvas(hand[t], this.width, this.height));
                    for (let a = 0; a < tips.length; a++) {
                        for (let b = a + 1; b < tips.length; b++) {
                            this.ctx.beginPath();
                            this.ctx.moveTo(tips[a].x, tips[a].y);
                            this.ctx.lineTo(tips[b].x, tips[b].y);
                            this.ctx.strokeStyle = themes[this.currentTheme](this.time, a + b, 10);
                            this.ctx.lineWidth = 1.5;
                            this.ctx.globalAlpha = 0.6;
                            this.ctx.stroke();
                        }
                    }
                    this.ctx.globalAlpha = 1;
                }
            });

            if (this.currentHands.length >= 2) {
                const h1 = this.currentHands[0];
                const h2 = this.currentHands[1];

                FINGER_TIPS.forEach((tipIndex, idx) => {
                    const pt1 = mapToCanvas(h1[tipIndex], this.width, this.height);
                    const pt2 = mapToCanvas(h2[tipIndex], this.width, this.height);
                    const col = themes[this.currentTheme](this.time, idx, FINGER_TIPS.length);

                    this.ctx.beginPath();
                    this.ctx.moveTo(pt1.x, pt1.y);
                    this.ctx.lineTo(pt2.x, pt2.y);
                    this.ctx.strokeStyle = col;
                    this.ctx.lineWidth = 2;
                    this.ctx.globalAlpha = 0.7;
                    this.ctx.stroke();
                });
                this.ctx.globalAlpha = 1;

                if (h1 && h2) {
                    const allTips = FINGER_TIPS.map((t) => mapToCanvas(h1[t], this.width, this.height)).concat(
                        FINGER_TIPS.map((t) => mapToCanvas(h2[t], this.width, this.height))
                    );

                    this.ctx.save();
                    const cx = allTips.reduce((sum, p) => sum + p.x, 0) / 10;
                    const cy = allTips.reduce((sum, p) => sum + p.y, 0) / 10;

                    this.ctx.translate(cx, cy);
                    this.ctx.rotate(this.time * 0.5);

                    this.ctx.beginPath();
                    for (let i = 0; i < 10; i++) {
                        const t1 = { x: allTips[i].x - cx, y: allTips[i].y - cy };
                        const t2 = { x: allTips[(i + 3) % 10].x - cx, y: allTips[(i + 3) % 10].y - cy };
                        this.ctx.moveTo(t1.x, t1.y);
                        this.ctx.lineTo(t2.x, t2.y);
                    }
                    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                    this.ctx.restore();
                }
            }
        }

        this.updateGestures();

        this.ctx.globalCompositeOperation = 'source-over';
    }
}

if (typeof window !== 'undefined') {
    window.HandConnectApp = HandConnectApp;
    window.themes = themes;
    window.addEventListener('DOMContentLoaded', () => {
        window.app = new HandConnectApp();
    });
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HandConnectApp, themes };
}
