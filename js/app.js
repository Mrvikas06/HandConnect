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
        this.currentMode = 'all'; // 'all', 'web', 'orbs', 'trails'

        this.audioEngine = typeof AudioEngine !== 'undefined' ? new AudioEngine() : null;
        this.particleSystem = typeof ParticleSystem !== 'undefined' ? new ParticleSystem(120, 30) : null;
        this.matrixRain = (typeof MatrixRain !== 'undefined' && this.bgCanvas) ? new MatrixRain(this.bgCanvas, 16) : null;
        this.gestureDetector = typeof GestureDetector !== 'undefined' ? new GestureDetector() : null;
        this.orbManager = typeof OrbManager !== 'undefined' ? new OrbManager(5) : null;
        this.ribbonTrails = typeof RibbonTrails !== 'undefined' ? new RibbonTrails(26) : null;
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

        // Theme selection
        document.querySelectorAll('.theme-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.theme-btn').forEach((b) => b.classList.remove('active'));
                const target = e.currentTarget;
                target.classList.add('active');
                this.setTheme(target.getAttribute('data-theme') || 'Rainbow');
            });
        });

        // Mode selection
        document.querySelectorAll('#modeGroup .control-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('#modeGroup .control-btn').forEach((b) => b.classList.remove('active'));
                const target = e.currentTarget;
                target.classList.add('active');
                this.setMode(target.getAttribute('data-mode') || 'all');
            });
        });

        // Action buttons
        const btnSpawn = document.getElementById('btnSpawnOrb');
        if (btnSpawn) {
            btnSpawn.addEventListener('click', () => {
                if (this.orbManager) {
                    const col = themes[this.currentTheme](this.time, 1, 1);
                    this.orbManager.spawn(this.width, this.height, col);
                }
            });
        }

        const btnSnapshot = document.getElementById('btnSnapshot');
        if (btnSnapshot) {
            btnSnapshot.addEventListener('click', () => this.captureSnapshot());
        }

        const btnMute = document.getElementById('btnMute');
        if (btnMute) {
            btnMute.addEventListener('click', () => {
                if (this.audioEngine) {
                    const isMuted = this.audioEngine.toggleMute();
                    btnMute.innerText = isMuted ? 'Unmute' : 'Mute';
                }
            });
        }

        // Global keyboard hotkeys
        window.addEventListener('keydown', (e) => {
            if (!this.appStarted) return;
            const key = e.key.toLowerCase();

            if (key === '1') this.setMode('all');
            else if (key === '2') this.setMode('web');
            else if (key === '3') this.setMode('orbs');
            else if (key === '4') this.setMode('trails');
            else if (key === 'm') {
                if (btnMute) btnMute.click();
            } else if (key === 'c') {
                this.captureSnapshot();
            } else if (key === 't') {
                this.cycleNextTheme();
            } else if (e.code === 'Space') {
                e.preventDefault();
                if (btnSpawn) btnSpawn.click();
            }
        });

        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.start());
        }
    }

    setMode(mode) {
        this.currentMode = mode;
        document.querySelectorAll('#modeGroup .control-btn').forEach((b) => {
            if (b.getAttribute('data-mode') === mode) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });
    }

    setTheme(themeName) {
        if (!themes[themeName]) return;
        this.currentTheme = themeName;
        document.documentElement.style.setProperty('--accent', themes[this.currentTheme](0, 1, 1));
        document.querySelectorAll('.theme-btn').forEach((b) => {
            if (b.getAttribute('data-theme') === themeName) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });
    }

    cycleNextTheme() {
        const themeList = Object.keys(themes);
        const currentIndex = themeList.indexOf(this.currentTheme);
        const nextTheme = themeList[(currentIndex + 1) % themeList.length];
        this.setTheme(nextTheme);
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
        const controls = document.getElementById('controls');
        const themesBar = document.getElementById('themes');

        if (overlay) overlay.classList.add('hidden');
        if (hud) hud.classList.remove('hidden');
        if (controls) controls.classList.remove('hidden');
        if (themesBar) themesBar.classList.remove('hidden');

        if (this.audioEngine) this.audioEngine.init();
        if (this.orbManager) {
            this.orbManager.reset(this.width, this.height, 3, themes[this.currentTheme](0, 1, 1));
        }

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
                    if (this.audioEngine) {
                        this.audioEngine.updateHum(this.currentHands);
                    }
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
        if (!this.gestureDetector) return;
        const res = this.gestureDetector.detect(this.currentHands);
        if (this.uiGesture) this.uiGesture.innerText = res.gesture;
        if (this.uiSpread) this.uiSpread.innerText = `${res.spreadPct}%`;

        const themeCol = themes[this.currentTheme](this.time, 1, 1);

        // Pinch reaction
        if (res.newPinch && res.midpoint) {
            const mapped = mapToCanvas(res.midpoint, this.width, this.height);
            if (this.particleSystem) {
                this.particleSystem.emitShockwave(mapped, themeCol);
            }
            if (this.audioEngine) {
                this.audioEngine.triggerZap();
            }
        }

        // Clap reaction
        if (res.isClapping) {
            if (this.particleSystem) {
                this.particleSystem.emitShockwave({ x: this.width * 0.5, y: this.height * 0.5 }, '#ffffff');
                this.particleSystem.emitShockwave({ x: this.width * 0.5, y: this.height * 0.5 }, themeCol);
            }
            if (this.audioEngine) {
                this.audioEngine.triggerClap();
            }
        }

        // Gesture state change reactions
        if (res.newGesture) {
            if (res.gesture === 'Peace') {
                if (this.audioEngine) this.audioEngine.triggerChime();
                if (this.particleSystem && this.currentHands[0]) {
                    const tip = mapToCanvas(this.currentHands[0][8], this.width, this.height);
                    this.particleSystem.emit(tip, '#38bdf8', 12);
                }
            } else if (res.gesture === 'Thumbs Up') {
                if (this.audioEngine) this.audioEngine.triggerChime();
                if (this.particleSystem && this.currentHands[0]) {
                    const tip = mapToCanvas(this.currentHands[0][4], this.width, this.height);
                    this.particleSystem.emit(tip, '#fbbf24', 16);
                }
            } else if (res.gesture === 'Rock On') {
                if (this.audioEngine) this.audioEngine.triggerHorns();
                if (this.particleSystem && this.currentHands[0]) {
                    const tip = mapToCanvas(this.currentHands[0][8], this.width, this.height);
                    this.particleSystem.emit(tip, '#f43f5e', 14);
                }
            }
        }

        // Continuous pointing laser
        if (res.gesture === 'Pointing' && res.pointingRay) {
            const origin = mapToCanvas(res.pointingRay.origin, this.width, this.height);
            const target = {
                x: origin.x + res.pointingRay.dir.x * 240,
                y: origin.y + res.pointingRay.dir.y * 240
            };
            this.ctx.beginPath();
            this.ctx.moveTo(origin.x, origin.y);
            this.ctx.lineTo(target.x, target.y);
            this.ctx.strokeStyle = themeCol;
            this.ctx.lineWidth = 3;
            this.ctx.stroke();

            if (Math.random() > 0.6) {
                if (this.particleSystem) {
                    this.particleSystem.emit(target, themeCol, 2);
                }
                if (this.audioEngine && Math.random() > 0.8) {
                    this.audioEngine.triggerLaser();
                }
            }
        }
    }

    captureSnapshot() {
        const flash = document.getElementById('snapshotFlash');
        if (flash) {
            flash.classList.add('flash');
            setTimeout(() => flash.classList.remove('flash'), 100);
        }

        const snapCanvas = document.createElement('canvas');
        snapCanvas.width = this.width;
        snapCanvas.height = this.height;
        const sctx = snapCanvas.getContext('2d');

        // Draw camera video feed (mirrored)
        if (this.videoElement && this.videoElement.readyState >= 2) {
            sctx.save();
            sctx.translate(this.width, 0);
            sctx.scale(-1, 1);
            sctx.drawImage(this.videoElement, 0, 0, this.width, this.height);
            sctx.restore();
        } else {
            sctx.fillStyle = '#050510';
            sctx.fillRect(0, 0, this.width, this.height);
        }

        // Draw background canvas (matrix rain)
        if (this.bgCanvas) {
            sctx.save();
            sctx.translate(this.width, 0);
            sctx.scale(-1, 1);
            sctx.drawImage(this.bgCanvas, 0, 0);
            sctx.restore();
        }

        // Draw main foreground AR canvas
        if (this.mainCanvas) {
            sctx.save();
            sctx.translate(this.width, 0);
            sctx.scale(-1, 1);
            sctx.drawImage(this.mainCanvas, 0, 0);
            sctx.restore();
        }

        // Watermark and date
        sctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        sctx.font = '16px -apple-system, BlinkMacSystemFont, sans-serif';
        sctx.fillText('HandConnect AR', 30, this.height - 30);
        sctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        sctx.font = '12px monospace';
        sctx.fillText(new Date().toLocaleString(), 30, this.height - 14);

        // Download PNG
        const link = document.createElement('a');
        link.download = `handconnect-snapshot-${Date.now()}.png`;
        link.href = snapCanvas.toDataURL('image/png');
        link.click();
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
        if (this.matrixRain) {
            this.matrixRain.render(themeColor, this.handVelocities);
        }

        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.globalCompositeOperation = 'screen';

        // Update physics particles & shockwaves
        if (this.particleSystem) {
            this.particleSystem.updateAndRender(this.ctx);
        }

        // Render Ribbon Trails
        if (this.ribbonTrails && (this.currentMode === 'all' || this.currentMode === 'trails')) {
            this.ribbonTrails.update();
            this.ribbonTrails.render(this.ctx);
        }

        // Render Physics Orbs
        if (this.orbManager && (this.currentMode === 'all' || this.currentMode === 'orbs')) {
            this.orbManager.update(this.width, this.height, this.currentHands, this.audioEngine, this.particleSystem);
            this.orbManager.render(this.ctx);
        }

        // Render Hands and Skeleton
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

                    // Emit to ribbon trails
                    if (this.ribbonTrails && (this.currentMode === 'all' || this.currentMode === 'trails')) {
                        this.ribbonTrails.addPoint(handIndex * 10 + idx, pt.x, pt.y, tipCol);
                    }

                    if (Math.random() > 0.8 && this.particleSystem) {
                        this.particleSystem.emit(pt, tipCol, 1);
                    }
                });

                // String Web
                if (this.currentMode === 'all' || this.currentMode === 'web') {
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
                }
            });

            // Dual hand cross-connectors and mandala
            if (this.currentHands.length >= 2 && (this.currentMode === 'all' || this.currentMode === 'web')) {
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
