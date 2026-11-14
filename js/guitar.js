/**
 * HandConnect Virtual AR Finger Strings
 * Every finger works as an interactive vibrating guitar string with physical wave simulation.
 * Zero static strings on screen - strings are anchored directly to hand fingers.
 */

class GuitarString {
    constructor(index, name, baseFreq, tipIndex, baseIndex, thickness) {
        this.index = index;
        this.name = name;
        this.baseFreq = baseFreq;
        this.tipIndex = tipIndex;
        this.baseIndex = baseIndex;
        this.thickness = thickness;
        this.y = 0; // Fallback / layout vertical coordinate
        this.vibrationAmp = 0;
        this.vibrationFreq = 48;
        this.vibrationPhase = 0;
        this.lastPluckTime = 0;
        this.start = { x: 0, y: 0 };
        this.end = { x: 0, y: 0 };
        this.extended = { x: 0, y: 0 };
        this.isActive = false;
        this.noteLabel = name;
    }

    pluck(xRatio = 0.5, intensity = 1.0) {
        this.vibrationAmp = Math.min(26, 12 + intensity * 14);
        this.lastPluckTime = performance.now();
    }

    update(dt) {
        if (this.vibrationAmp > 0.05) {
            this.vibrationPhase += this.vibrationFreq * dt;
            this.vibrationAmp *= Math.pow(0.85, dt * 60);
        } else {
            this.vibrationAmp = 0;
        }
    }

    render(ctx, themeColor) {
        if (!this.isActive) return;

        ctx.save();

        const p1 = this.start;
        const p2 = this.extended;
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.hypot(dx, dy);

        if (len < 10) {
            ctx.restore();
            return;
        }

        // Perpendicular unit vector for standing wave transverse displacement
        const nx = -dy / len;
        const ny = dx / len;

        // Render vibrating standing wave along finger string
        ctx.beginPath();
        const segments = 24;
        ctx.moveTo(p1.x, p1.y);

        for (let i = 1; i <= segments; i++) {
            const ratio = i / segments;
            const baseX = p1.x + dx * ratio;
            const baseY = p1.y + dy * ratio;

            // Physical standing wave: sin(pi * ratio) * sin(phase) * amp
            const wave = Math.sin(Math.PI * ratio) * Math.sin(this.vibrationPhase) * this.vibrationAmp;
            ctx.lineTo(baseX + nx * wave, baseY + ny * wave);
        }

        const isVibrating = this.vibrationAmp > 1;
        ctx.strokeStyle = isVibrating ? '#ffffff' : themeColor;
        ctx.lineWidth = this.thickness + (isVibrating ? 1.8 : 0);
        ctx.shadowColor = isVibrating ? '#00ffcc' : themeColor;
        ctx.shadowBlur = isVibrating ? 18 : 6;
        ctx.stroke();

        // If vibrating intensely, render secondary harmonic aura
        if (this.vibrationAmp > 6) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            for (let i = 1; i <= segments; i++) {
                const ratio = i / segments;
                const baseX = p1.x + dx * ratio;
                const baseY = p1.y + dy * ratio;
                const secondHarmonic = Math.sin(Math.PI * 2 * ratio) * Math.cos(this.vibrationPhase * 1.5) * (this.vibrationAmp * 0.45);
                ctx.lineTo(baseX + nx * secondHarmonic, baseY + ny * secondHarmonic);
            }
            ctx.strokeStyle = 'rgba(0, 255, 204, 0.45)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Floating Note Badge near fingertip
        const badgeX = this.end.x + nx * 14;
        const badgeY = this.end.y + ny * 14;

        ctx.save();
        ctx.font = 'bold 11px monospace';
        const label = this.noteLabel;
        const textWidth = ctx.measureText(label).width;
        const padX = 6;
        const padY = 4;
        const bW = textWidth + padX * 2;
        const bH = 18;

        ctx.fillStyle = isVibrating ? 'rgba(0, 255, 204, 0.35)' : 'rgba(15, 23, 42, 0.7)';
        ctx.strokeStyle = isVibrating ? '#00ffcc' : 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(badgeX - bW / 2, badgeY - bH / 2, bW, bH, 4);
        } else {
            ctx.rect(badgeX - bW / 2, badgeY - bH / 2, bW, bH);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isVibrating ? '#ffffff' : 'rgba(255, 255, 255, 0.85)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, badgeX, badgeY);
        ctx.restore();

        // Expanding shock ring when recently plucked
        if (this.vibrationAmp > 14) {
            ctx.beginPath();
            ctx.arc(this.end.x, this.end.y, 10 + (26 - this.vibrationAmp) * 1.2, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 255, 204, 0.6)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        ctx.restore();
    }
}

class VirtualGuitar {
    constructor() {
        this.strings = [
            new GuitarString(0, 'E2', 82.41, 4, 2, 4.0),   // Thumb: Low E
            new GuitarString(1, 'A2', 110.0, 8, 5, 3.4),   // Index: A
            new GuitarString(2, 'D3', 146.83, 12, 9, 2.8), // Middle: D
            new GuitarString(3, 'G3', 196.0, 16, 13, 2.2), // Ring: G
            new GuitarString(4, 'B3', 246.94, 20, 17, 1.8),// Pinky: B
            new GuitarString(5, 'E4', 329.63, 20, 17, 1.4) // Pinky Treble: High E
        ];
        this.prevFingerPos = new Map(); // key: fingerKey, value: { x, y }
        this.fretOffset = 0;
        this.chordName = 'Open';
        this.enabled = true;
        this.activeHandCenter = null;
    }

    layout(width, height) {
        // Fallback layout coordinates for unit tests and headless environments
        const topY = height * 0.44;
        const bottomY = height * 0.86;
        const spacing = (bottomY - topY) / (this.strings.length - 1);

        this.strings.forEach((str, idx) => {
            str.y = topY + idx * spacing;
            str.start = { x: 80, y: str.y };
            str.end = { x: width - 80, y: str.y };
            str.extended = { x: width - 40, y: str.y };
        });
    }

    updateChords(hands, gestureDetector) {
        if (!hands || !hands.length) {
            this.chordName = 'Open';
            this.fretOffset = 0;
            this.strings.forEach((str) => { str.noteLabel = str.name; });
            return;
        }

        // Two hands: left-most hand acts as fretting/chord controller
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
            // One hand: hand tilt / vertical angle shifts chord
            if (hands[0][0] && hands[0][9]) {
                const dy = hands[0][9].y - hands[0][0].y;
                const dx = hands[0][9].x - hands[0][0].x;
                const angle = Math.atan2(dy, dx);
                // Classify tilt into frets 0-7
                const fret = Math.max(0, Math.min(7, Math.floor(Math.abs(angle) * 3)));
                this.fretOffset = fret;
                this.chordName = fret === 0 ? 'Open' : `Fret ${fret}`;
            }
        }

        // Update note labels on strings
        this.strings.forEach((str) => {
            if (this.fretOffset === 0) {
                str.noteLabel = str.name;
            } else {
                str.noteLabel = `${str.name}+${this.fretOffset}`;
            }
        });
    }

    updateFingerCoordinates(hands, width, height) {
        if (!hands || !hands.length) {
            this.strings.forEach((str) => { str.isActive = false; });
            this.activeHandCenter = null;
            return;
        }

        // If two hands: hand with larger spread or left-most hand hosts the finger strings
        const stringHand = (hands.length >= 2)
            ? (hands[0][0].x < hands[1][0].x ? hands[0] : hands[1])
            : hands[0];

        this.activeHandCenter = { x: stringHand[9].x * width, y: stringHand[9].y * height };

        this.strings.forEach((str) => {
            const tipLandmark = stringHand[str.tipIndex];
            const baseLandmark = stringHand[str.baseIndex];
            if (!tipLandmark || !baseLandmark) {
                str.isActive = false;
                return;
            }

            const tip = { x: tipLandmark.x * width, y: tipLandmark.y * height };
            const base = { x: baseLandmark.x * width, y: baseLandmark.y * height };

            // Unit direction from base knuckle to fingertip
            const dx = tip.x - base.x;
            const dy = tip.y - base.y;
            const len = Math.hypot(dx, dy) || 1;
            const ux = dx / len;
            const uy = dy / len;

            str.start = base;
            str.end = tip;
            str.y = tip.y; // For sorting and layout compatibility

            if (str.index === 5) {
                // String 5 (High E) projects from Pinky as an extended high-octave acoustic beam
                str.start = tip;
                str.extended = { x: tip.x + ux * 90 + uy * 16, y: tip.y + uy * 90 - ux * 16 };
            } else {
                // Extended string projection beyond fingertip
                str.extended = { x: tip.x + ux * 75, y: tip.y + uy * 75 };
            }

            str.isActive = true;
        });
    }

    processStrumming(hands, width, height, audioEngine, particleSystem) {
        if (!this.enabled || !hands || !hands.length) return;

        // Update positions of the finger strings
        this.updateFingerCoordinates(hands, width, height);

        const now = performance.now();
        const currentFingerPos = new Map();

        // 1. Dual-hand Strumming: The other hand (strumHand) sweeps across the finger strings
        if (hands.length >= 2) {
            const strumHand = (hands[0][0].x > hands[1][0].x) ? hands[0] : hands[1];
            const strumTipIndices = [4, 8, 12, 16, 20];

            strumTipIndices.forEach((tipIdx) => {
                const pt = strumHand[tipIdx];
                if (!pt) return;

                const currX = pt.x * width;
                const currY = pt.y * height;
                const fingerKey = `strum_${tipIdx}`;
                currentFingerPos.set(fingerKey, { x: currX, y: currY });

                if (this.prevFingerPos.has(fingerKey)) {
                    const prev = this.prevFingerPos.get(fingerKey);
                    const speed = Math.hypot(currX - prev.x, currY - prev.y);

                    if (speed > 3) {
                        this.strings.forEach((str) => {
                            if (!str.isActive) return;
                            if (now - str.lastPluckTime < 80) return;

                            // Check collision: does the strum movement segment cross the finger string segment?
                            const hit = this.checkSegmentCollision(prev, { x: currX, y: currY }, str.start, str.extended);
                            const nearTip = Math.hypot(currX - str.end.x, currY - str.end.y) < 28;

                            if (hit || nearTip) {
                                const intensity = Math.min(1.5, Math.max(0.3, speed / 12));
                                str.pluck(0.5, intensity);

                                if (audioEngine) {
                                    audioEngine.playGuitarString(str.index, this.fretOffset, intensity);
                                }
                                if (particleSystem) {
                                    particleSystem.emit({ x: currX, y: currY }, '#00ffcc', 8);
                                    particleSystem.emitShockwave({ x: currX, y: currY }, '#ffffff');
                                }
                            }
                        });
                    }
                }
            });
        }

        // 2. Solo Finger Plucking / Tapping (Single Hand or individual finger flick)
        const primaryHand = hands[0];
        const fingerTipIndices = [4, 8, 12, 16, 20];

        fingerTipIndices.forEach((tipIdx, fIdx) => {
            const pt = primaryHand[tipIdx];
            if (!pt) return;

            const currX = pt.x * width;
            const currY = pt.y * height;
            const soloKey = `solo_${tipIdx}`;
            currentFingerPos.set(soloKey, { x: currX, y: currY });

            if (this.prevFingerPos.has(soloKey)) {
                const prev = this.prevFingerPos.get(soloKey);
                const deltaY = currY - prev.y;
                const speed = Math.hypot(currX - prev.x, currY - prev.y);

                // Quick tap downward or rapid flick triggers pluck
                if ((deltaY > 16 || speed > 22) && hands.length === 1) {
                    const str = this.strings[fIdx];
                    if (str && str.isActive && (now - str.lastPluckTime > 130)) {
                        const intensity = Math.min(1.5, speed / 18);
                        str.pluck(0.5, intensity);

                        if (audioEngine) {
                            audioEngine.playGuitarString(str.index, this.fretOffset, intensity);
                        }
                        if (particleSystem) {
                            particleSystem.emit({ x: currX, y: currY }, '#00ffcc', 7);
                        }
                    }
                }
            }
        });

        this.prevFingerPos = currentFingerPos;
    }

    checkSegmentCollision(p1, p2, p3, p4) {
        // Line segment intersection between p1->p2 (strum path) and p3->p4 (finger string)
        const ccw = (a, b, c) => (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
        return (ccw(p1, p3, p4) !== ccw(p2, p3, p4)) && (ccw(p1, p2, p3) !== ccw(p1, p2, p4));
    }

    update(dt) {
        this.strings.forEach((str) => str.update(dt));
    }

    render(ctx, width, height, themeColor) {
        if (!this.enabled) return;

        // Render each finger string directly on the hand
        this.strings.forEach((str) => {
            str.render(ctx, themeColor);
        });

        // If hands are active, render chord badge floating above palm
        if (this.activeHandCenter) {
            ctx.save();
            const badgeW = 150;
            const badgeH = 24;
            const bx = this.activeHandCenter.x - badgeW / 2;
            const by = this.activeHandCenter.y - 65;

            ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
            ctx.strokeStyle = 'rgba(0, 255, 204, 0.5)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(bx, by, badgeW, badgeH, 6);
            } else {
                ctx.rect(bx, by, badgeW, badgeH);
            }
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#00ffcc';
            ctx.font = 'bold 12px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`Guitar: ${this.chordName}`, this.activeHandCenter.x, by + badgeH / 2);
            ctx.restore();
        }
    }
}

if (typeof window !== 'undefined') {
    window.GuitarString = GuitarString;
    window.VirtualGuitar = VirtualGuitar;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GuitarString, VirtualGuitar };
}
