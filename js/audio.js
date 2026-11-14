/**
 * HandConnect Audio Engine
 * Real-time procedural audio synthesis using Web Audio API.
 */
class AudioEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.humOsc = null;
        this.humGain = null;
        this.initialized = false;
        this.isMuted = false;
        this.pentatonicScale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
        this.lastToneTime = 0;
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

            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);

            this.humOsc = this.ctx.createOscillator();
            this.humGain = this.ctx.createGain();
            this.humOsc.type = 'sine';
            this.humOsc.frequency.setValueAtTime(100, this.ctx.currentTime);
            this.humGain.gain.setValueAtTime(0, this.ctx.currentTime);

            this.humOsc.connect(this.humGain);
            this.humGain.connect(this.masterGain);
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

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime, 0.05);
        }
        return this.isMuted;
    }

    playTone(frequency, type = 'sine', duration = 0.25, volume = 0.15) {
        if (!this.ctx || this.isMuted) return;
        this.resume();

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gainNode = this.ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(frequency, now);

            gainNode.gain.setValueAtTime(volume, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

            osc.connect(gainNode);
            gainNode.connect(this.masterGain);

            osc.onended = () => {
                try {
                    osc.disconnect();
                    gainNode.disconnect();
                } catch (_) {}
            };

            osc.start(now);
            osc.stop(now + duration);
        } catch (e) {
            console.warn("Play tone error:", e);
        }
    }

    playHarpNote(fingerIndex) {
        const now = performance.now();
        if (now - this.lastToneTime < 70) return; // Debounce rapid triggers
        this.lastToneTime = now;

        const freq = this.pentatonicScale[fingerIndex % this.pentatonicScale.length];
        this.playTone(freq, 'triangle', 0.35, 0.12);
    }

    triggerZap() {
        if (!this.ctx || this.isMuted) return;
        this.resume();

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gainNode = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);

            gainNode.gain.setValueAtTime(0.4, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

            osc.connect(gainNode);
            gainNode.connect(this.masterGain);

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

    triggerLaser() {
        if (!this.ctx || this.isMuted) return;
        this.resume();

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(1400, now);
            osc.frequency.exponentialRampToValueAtTime(200, now + 0.18);

            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.onended = () => {
                try {
                    osc.disconnect();
                    gain.disconnect();
                } catch (_) {}
            };

            osc.start(now);
            osc.stop(now + 0.2);
        } catch (e) {
            console.warn("Trigger laser error:", e);
        }
    }

    triggerClap() {
        if (!this.ctx || this.isMuted) return;
        this.resume();

        try {
            const now = this.ctx.currentTime;
            // Sub bass impact
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

            gain.gain.setValueAtTime(0.6, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.onended = () => {
                try {
                    osc.disconnect();
                    gain.disconnect();
                } catch (_) {}
            };

            osc.start(now);
            osc.stop(now + 0.4);
        } catch (e) {
            console.warn("Trigger clap error:", e);
        }
    }

    triggerChime() {
        if (!this.ctx || this.isMuted) return;
        // Major arpeggio
        const chord = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        chord.forEach((freq, idx) => {
            setTimeout(() => {
                this.playTone(freq, 'sine', 0.4, 0.1);
            }, idx * 60);
        });
    }

    triggerHorns() {
        if (!this.ctx || this.isMuted) return;
        // Power chord: Root + Fifth + Octave
        const powerChord = [146.83, 220.0, 293.66]; // D3, A3, D4
        powerChord.forEach((freq) => {
            this.playTone(freq, 'sawtooth', 0.4, 0.12);
        });
    }

    updateHum(activeHands) {
        if (!this.ctx || !this.humGain || !this.humOsc || this.isMuted) return;
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
