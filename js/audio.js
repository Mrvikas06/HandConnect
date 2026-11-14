/**
 * HandConnect Audio Engine
 * Real-time procedural audio synthesis using Web Audio API.
 */
class AudioEngine {
    constructor() {
        this.ctx = null;
        this.humOsc = null;
        this.humGain = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) {
                console.warn("Web Audio API is not supported in this browser.");
                return;
            }
            this.ctx = new AudioContextClass();
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }

            this.humOsc = this.ctx.createOscillator();
            this.humGain = this.ctx.createGain();
            this.humOsc.type = 'sine';
            this.humOsc.frequency.setValueAtTime(100, this.ctx.currentTime);
            this.humGain.gain.setValueAtTime(0, this.ctx.currentTime);

            this.humOsc.connect(this.humGain);
            this.humGain.connect(this.ctx.destination);
            this.humOsc.start();
            this.initialized = true;
        } catch (e) {
            console.warn("AudioContext failed to initialize:", e);
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
    }

    triggerZap() {
        if (!this.ctx) return;
        this.resume();

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gainNode = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);

            gainNode.gain.setValueAtTime(0.5, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

            osc.connect(gainNode);
            gainNode.connect(this.ctx.destination);

            osc.onended = () => {
                try {
                    osc.disconnect();
                    gainNode.disconnect();
                } catch (_) {}
            };

            osc.start(now);
            osc.stop(now + 0.15);
        } catch (err) {
            console.warn("Trigger zap error:", err);
        }
    }

    updateHum(activeHands) {
        if (!this.ctx || !this.humGain || !this.humOsc) return;
        if (this.ctx.state === 'suspended') return;

        if (activeHands.length < 2 || !activeHands[0][8] || !activeHands[1][8]) {
            this.humGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
            return;
        }

        const p1 = activeHands[0][8];
        const p2 = activeHands[1][8];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const clampedDist = Math.min(dist, 1);
        const targetFreq = 100 + (1 - clampedDist) * 300;
        const targetVolume = 0.05 + (1 - clampedDist) * 0.15;

        this.humOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);
        this.humGain.gain.setTargetAtTime(targetVolume, this.ctx.currentTime, 0.1);
    }
}

if (typeof window !== 'undefined') {
    window.AudioEngine = AudioEngine;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AudioEngine };
}
