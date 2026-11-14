/**
 * HandConnect Gesture and Geometry Engine
 */
const FINGER_TIPS = [4, 8, 12, 16, 20];

const HAND_CONNECTIONS_DEFAULT = [
    [0, 1], [1, 2], [2, 3], [3, 4],
    [0, 5], [5, 6], [6, 7], [7, 8],
    [5, 9], [9, 10], [10, 11], [11, 12],
    [9, 13], [13, 14], [14, 15], [15, 16],
    [13, 17], [0, 17], [17, 18], [18, 19], [19, 20]
];

function getDist(p1, p2) {
    if (!p1 || !p2) return 0;
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

function mapToCanvas(point, width, height) {
    if (!point) return { x: 0, y: 0 };
    return { x: point.x * width, y: point.y * height };
}

function isFingerExtended(hand, tipIndex, pipIndex) {
    if (!hand || !hand[tipIndex] || !hand[pipIndex] || !hand[0]) return false;
    return getDist(hand[tipIndex], hand[0]) > getDist(hand[pipIndex], hand[0]) * 1.15;
}

function drawHandBones(context, landmarks, color, width, height) {
    if (typeof drawConnectors === 'function' && typeof HAND_CONNECTIONS !== 'undefined') {
        drawConnectors(context, landmarks, HAND_CONNECTIONS, { color: color, lineWidth: 2 });
        return;
    }
    const connections = (typeof HAND_CONNECTIONS !== 'undefined') ? HAND_CONNECTIONS : HAND_CONNECTIONS_DEFAULT;
    context.strokeStyle = color;
    context.lineWidth = 2;
    for (let i = 0; i < connections.length; i++) {
        const p1 = landmarks[connections[i][0]];
        const p2 = landmarks[connections[i][1]];
        if (p1 && p2) {
            context.beginPath();
            context.moveTo(p1.x * width, p1.y * height);
            context.lineTo(p2.x * width, p2.y * height);
            context.stroke();
        }
    }
}

class GestureDetector {
    constructor() {
        this.lastPinchState = [false, false];
        this.lastHandDistance = null;
        this.lastGesture = 'None';
    }

    reset() {
        this.lastPinchState = [false, false];
        this.lastHandDistance = null;
        this.lastGesture = 'None';
    }

    classifyHandPose(hand) {
        if (!hand || hand.length < 21) return 'None';

        const indexExt = isFingerExtended(hand, 8, 6);
        const midExt = isFingerExtended(hand, 12, 10);
        const ringExt = isFingerExtended(hand, 16, 14);
        const pinkyExt = isFingerExtended(hand, 20, 18);

        // Thumbs Up check: Thumb tip higher than thumb base, all other fingers curled
        const thumbUp = hand[4] && hand[2] && (hand[4].y < hand[2].y - 0.08);
        if (thumbUp && !indexExt && !midExt && !ringExt && !pinkyExt) {
            return 'Thumbs Up';
        }

        // Peace / Victory: Index and Middle extended, Ring and Pinky folded
        if (indexExt && midExt && !ringExt && !pinkyExt) {
            return 'Peace';
        }

        // Pointing / Finger Gun: Index extended, Middle, Ring, Pinky folded
        if (indexExt && !midExt && !ringExt && !pinkyExt) {
            return 'Pointing';
        }

        // Rock On: Index and Pinky extended, Middle and Ring folded
        if (indexExt && !midExt && !ringExt && pinkyExt) {
            return 'Rock On';
        }

        // Open Hand vs Fist
        const spread = getDist(hand[8], hand[20]);
        if (indexExt && midExt && ringExt && pinkyExt && spread > 0.15) {
            return 'Open Hand';
        }

        if (!indexExt && !midExt && !ringExt && !pinkyExt) {
            return 'Fist';
        }

        return spread > 0.12 ? 'Open Hand' : 'Neutral';
    }

    detect(hands) {
        if (!hands || !hands.length) {
            this.reset();
            return {
                isPinching: false,
                newPinch: false,
                midpoint: null,
                pinchHandIndex: -1,
                spreadPct: 0,
                gesture: 'None',
                newGesture: false,
                isClapping: false,
                pointingRay: null
            };
        }

        let newPinch = false;
        let midpoint = null;
        let pinchHandIndex = -1;
        let anyPinching = false;

        hands.forEach((hand, idx) => {
            if (!hand || !hand[4] || !hand[8]) return;
            const thumb = hand[4];
            const index = hand[8];
            const dist = getDist(thumb, index);
            const isPinching = dist < 0.05;

            if (isPinching) {
                anyPinching = true;
                if (!this.lastPinchState[idx]) {
                    newPinch = true;
                    pinchHandIndex = idx;
                    midpoint = {
                        x: (thumb.x + index.x) / 2,
                        y: (thumb.y + index.y) / 2
                    };
                }
            }
            this.lastPinchState[idx] = isPinching;
        });

        // Clap detection: 2 hands rapidly approaching each other
        let isClapping = false;
        if (hands.length >= 2 && hands[0][0] && hands[1][0]) {
            const currentDist = getDist(hands[0][0], hands[1][0]);
            if (this.lastHandDistance !== null) {
                const delta = this.lastHandDistance - currentDist;
                if (currentDist < 0.16 && delta > 0.04) {
                    isClapping = true;
                }
            }
            this.lastHandDistance = currentDist;
        } else {
            this.lastHandDistance = null;
        }

        let spreadPct = 0;
        let gesture = 'None';
        let pointingRay = null;

        if (hands[0] && hands[0][8] && hands[0][20]) {
            const spread = getDist(hands[0][8], hands[0][20]);
            spreadPct = Math.min(Math.round(spread * 300), 100);

            if (isClapping) {
                gesture = 'CLAP !';
            } else if (anyPinching) {
                gesture = 'PINCH !';
            } else {
                gesture = this.classifyHandPose(hands[0]);
            }

            // If pointing, compute ray from index base (5) through tip (8)
            if (gesture === 'Pointing' && hands[0][5] && hands[0][8]) {
                const base = hands[0][5];
                const tip = hands[0][8];
                const dx = tip.x - base.x;
                const dy = tip.y - base.y;
                const len = Math.hypot(dx, dy) || 1;
                pointingRay = {
                    origin: tip,
                    dir: { x: dx / len, y: dy / len }
                };
            }
        }

        const newGesture = gesture !== this.lastGesture && gesture !== 'None' && gesture !== 'Neutral';
        this.lastGesture = gesture;

        return {
            isPinching: anyPinching,
            newPinch,
            midpoint,
            pinchHandIndex,
            spreadPct,
            gesture,
            newGesture,
            isClapping,
            pointingRay
        };
    }
}

if (typeof window !== 'undefined') {
    window.FINGER_TIPS = FINGER_TIPS;
    window.HAND_CONNECTIONS_DEFAULT = HAND_CONNECTIONS_DEFAULT;
    window.getDist = getDist;
    window.mapToCanvas = mapToCanvas;
    window.isFingerExtended = isFingerExtended;
    window.drawHandBones = drawHandBones;
    window.GestureDetector = GestureDetector;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        FINGER_TIPS,
        HAND_CONNECTIONS_DEFAULT,
        getDist,
        mapToCanvas,
        isFingerExtended,
        drawHandBones,
        GestureDetector
    };
}
