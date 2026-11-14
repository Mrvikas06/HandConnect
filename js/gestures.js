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
    }

    reset() {
        this.lastPinchState = [false, false];
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
                gesture: 'None'
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

        let spreadPct = 0;
        let gesture = 'None';

        if (hands[0] && hands[0][8] && hands[0][20]) {
            const spread = getDist(hands[0][8], hands[0][20]);
            spreadPct = Math.min(Math.round(spread * 300), 100);
            if (anyPinching) {
                gesture = 'PINCH !';
            } else {
                gesture = spreadPct > 50 ? 'Open Hand' : 'Fist';
            }
        }

        return {
            isPinching: anyPinching,
            newPinch,
            midpoint,
            pinchHandIndex,
            spreadPct,
            gesture
        };
    }
}

if (typeof window !== 'undefined') {
    window.FINGER_TIPS = FINGER_TIPS;
    window.HAND_CONNECTIONS_DEFAULT = HAND_CONNECTIONS_DEFAULT;
    window.getDist = getDist;
    window.mapToCanvas = mapToCanvas;
    window.drawHandBones = drawHandBones;
    window.GestureDetector = GestureDetector;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        FINGER_TIPS,
        HAND_CONNECTIONS_DEFAULT,
        getDist,
        mapToCanvas,
        drawHandBones,
        GestureDetector
    };
}
