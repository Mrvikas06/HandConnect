/**
 * HandConnect Virtual AR Guitar Strings
 * 6-string interactive guitar with physical string vibration and strumming collision.
 */
class GuitarString {
    constructor(index, name, baseFreq, thickness) {
        this.index = index;
        this.name = name;
        this.baseFreq = baseFreq;
        this.thickness = thickness;
        this.y = 0;
        this.vibrationAmp = 0;
        this.vibrationFreq = 45;
        this.vibrationPhase = 0;
        this.pluckX = 0.5;
        this.lastPluckTime = 0;
    }

    pluck(xRatio = 0.5, intensity = 1.0) {
        this.vibrationAmp = Math.min(22, 10 + intensity * 12);
        this.pluckX = Math.max(0.1, Math.min(0.9, xRatio));
        this.lastPluckTime = performance.now();
    }

    update(dt) {
        if (this.vibrationAmp > 0.05) {
            this.vibrationPhase += this.vibrationFreq * dt;
            this.vibrationAmp *= Math.pow(0.88, dt * 60);
        } else {
            this.vibrationAmp = 0;
        }
    }

    render(ctx, width, themeColor) {
        ctx.save();
        ctx.beginPath();
        const segments = 40;
        const startX = 60;
        const endX = width - 60;
        const span = endX - startX;

        ctx.moveTo(startX, this.y);

        for (let i = 1; i <= segments; i++) {
            const ratio = i / segments;
            const x = startX + ratio * span;
            // Standing wave envelope: sin(pi * ratio) with triangular pluck harmonic
            const wave = Math.sin(Math.PI * ratio) * Math.sin(this.vibrationPhase) * this.vibrationAmp;
            ctx.lineTo(x, this.y + wave);
        }

        ctx.strokeStyle = this.vibrationAmp > 1 ? '#ffffff' : themeColor;
        ctx.lineWidth = this.thickness + (this.vibrationAmp > 1 ? 1.5 : 0);
        ctx.shadowColor = themeColor;
        ctx.shadowBlur = this.vibrationAmp > 1 ? 14 : 4;
        ctx.stroke();

        // String name label
        ctx.fillStyle = this.vibrationAmp > 1 ? '#00ffcc' : 'rgba(255, 255, 255, 0.6)';
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.name, startX - 16, this.y);

        ctx.restore();
    }
}

class VirtualGuitar {
    constructor() {
        this.strings = [
            new GuitarString(0, 'E2', 82.41, 4.2),  // Low E
            new GuitarString(1, 'A2', 110.0, 3.6),  // A
            new GuitarString(2, 'D3', 146.83, 3.0), // D
            new GuitarString(3, 'G3', 196.0, 2.4),  // G
            new GuitarString(4, 'B3', 246.94, 1.8), // B
            new GuitarString(5, 'E4', 329.63, 1.4)  // High E
        ];
        this.prevFingerY = new Map(); // key: fingerId, value: { x, y }
        this.fretOffset = 0;
        this.chordName = 'Open';
        this.enabled = true;
    }

    layout(width, height) {
        // Position the 6 strings in the lower half of screen (comfortable for hand strumming)
        const topY = height * 0.44;
        const bottomY = height * 0.86;
        const spacing = (bottomY - topY) / (this.strings.length - 1);

        this.strings.forEach((str, idx) => {
            str.y = topY + idx * spacing;
        });
    }

    updateChords(hands, gestureDetector) {
        if (!hands || !hands.length) {
            this.chordName = 'Open';
            this.fretOffset = 0;
            return;
        }

        // If two hands: left-most hand acts as fretting hand
        if (hands.length >= 2) {
            const leftHand = hands[0][0].x < hands[1][0].x ? hands[0] : hands[1];
            const pose = gestureDetector ? gestureDetector.classifyHandPose(leftHand) : 'Open Hand';

            switch (pose) {
                case 'Peace':
                    this.chordName = 'G Major';
                    this.fretOffset = 3;
                    break;
                case 'Pinch':
                    this.chordName = 'C Major';
                    this.fretOffset = 8;
                    break;
                case 'Pointing':
                    this.chordName = 'D Major';
                    this.fretOffset = 10;
                    break;
                case 'Rock On':
                    this.chordName = 'A Minor';
                    this.fretOffset = 5;
                    break;
                case 'Fist':
                    this.chordName = 'E Minor';
                    this.fretOffset = 7;
                    break;
                default:
                    this.chordName = 'Open';
                    this.fretOffset = 0;
            }
        } else {
            // One hand: horizontal position determines fret 0 to 7
            if (hands[0][8]) {
                const fret = Math.floor(Math.max(0, Math.min(1, hands[0][8].x)) * 8);
                this.fretOffset = fret;
                this.chordName = fret === 0 ? 'Open' : `Fret ${fret}`;
            }
        }
    }

    processStrumming(hands, width, height, audioEngine, particleSystem) {
        if (!this.enabled || !hands || !hands.length) return;

        const now = performance.now();
        const currentFingerMap = new Map();

        // Strum hand: if 2 hands, use the rightmost hand; if 1 hand, use that hand
        const strumHand = (hands.length >= 2)
            ? (hands[0][0].x > hands[1][0].x ? hands[0] : hands[1])
            : hands[0];

        // Track all 5 fingertips of the strum hand
        const fingerIndices = [4, 8, 12, 16, 20];
        fingerIndices.forEach((tipIdx) => {
            const pt = strumHand[tipIdx];
            if (!pt) return;

            const currX = pt.x * width;
            const currY = pt.y * height;
            currentFingerMap.set(tipIdx, { x: currX, y: currY });

            if (this.prevFingerY.has(tipIdx)) {
                const prev = this.prevFingerY.get(tipIdx);
                const minY = Math.min(prev.y, currY);
                const maxY = Math.max(prev.y, currY);
                const deltaY = Math.abs(currY - prev.y);

                // Check collision across each guitar string
                this.strings.forEach((str) => {
                    if (str.y >= minY - 6 && str.y <= maxY + 6 && deltaY > 3) {
                        // Debounce string plucks
                        if (now - str.lastPluckTime > 80) {
                            const intensity = Math.min(1.5, deltaY / 15);
                            str.pluck(currX / width, intensity);

                            if (audioEngine) {
                                audioEngine.playGuitarString(str.index, this.fretOffset, intensity);
                            }

                            if (particleSystem) {
                                particleSystem.emit({ x: currX, y: str.y }, '#00ffcc', 6);
                            }
                        }
                    }
                });
            }
        });

        this.prevFingerY = currentFingerMap;
    }

    update(dt) {
        this.strings.forEach((str) => str.update(dt));
    }

    render(ctx, width, height, themeColor) {
        if (!this.enabled) return;

        ctx.save();

        // Draw Fretboard Backdrop
        const startX = 60;
        const endX = width - 60;
        const topY = this.strings[0].y - 30;
        const bottomY = this.strings[this.strings.length - 1].y + 30;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
        ctx.fillRect(startX, topY, endX - startX, bottomY - topY);

        // Vertical Fret Markers
        const totalFrets = 7;
        const fretSpan = (endX - startX) / totalFrets;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 2;

        for (let f = 1; f < totalFrets; f++) {
            const fx = startX + f * fretSpan;
            ctx.beginPath();
            ctx.moveTo(fx, topY);
            ctx.lineTo(fx, bottomY);
            ctx.stroke();

            ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`Fret ${f}`, fx, topY - 8);
        }

        // Active Chord Badge in top-center of guitar area
        ctx.fillStyle = 'rgba(0, 255, 204, 0.15)';
        ctx.strokeStyle = 'rgba(0, 255, 204, 0.4)';
        ctx.lineWidth = 1;
        const badgeX = width * 0.5 - 70;
        const badgeY = topY - 38;
        ctx.fillRect(badgeX, badgeY, 140, 24);
        ctx.strokeRect(badgeX, badgeY, 140, 24);

        ctx.fillStyle = '#00ffcc';
        ctx.font = 'bold 12px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Chord: ${this.chordName}`, width * 0.5, badgeY + 16);

        // Render Strings
        this.strings.forEach((str) => str.render(ctx, width, themeColor));

        ctx.restore();
    }
}

if (typeof window !== 'undefined') {
    window.GuitarString = GuitarString;
    window.VirtualGuitar = VirtualGuitar;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GuitarString, VirtualGuitar };
}
