const test = require('node:test');
const assert = require('node:assert');

const {
    getDist,
    mapToCanvas,
    GestureDetector,
    FINGER_TIPS,
    HAND_CONNECTIONS_DEFAULT
} = require('../js/gestures.js');

const { ParticleSystem } = require('../js/particles.js');
const { themes } = require('../js/app.js');

test('Geometry: getDist calculates Euclidean distance correctly', () => {
    assert.strictEqual(getDist({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
    assert.strictEqual(getDist({ x: 1, y: 1 }, { x: 1, y: 1 }), 0);
    assert.strictEqual(getDist(null, { x: 1, y: 1 }), 0);
    assert.strictEqual(getDist({ x: 1, y: 1 }, null), 0);
});

test('Geometry: mapToCanvas scales normalized coordinates to dimensions', () => {
    const pt = { x: 0.5, y: 0.25 };
    const mapped = mapToCanvas(pt, 1920, 1080);
    assert.strictEqual(mapped.x, 960);
    assert.strictEqual(mapped.y, 270);
    assert.deepStrictEqual(mapToCanvas(null, 100, 100), { x: 0, y: 0 });
});

test('Gestures: FINGER_TIPS and HAND_CONNECTIONS are defined and valid', () => {
    assert.deepStrictEqual(FINGER_TIPS, [4, 8, 12, 16, 20]);
    assert.strictEqual(HAND_CONNECTIONS_DEFAULT.length, 21);
});

test('GestureDetector: detects empty hands correctly', () => {
    const detector = new GestureDetector();
    const result = detector.detect([]);
    assert.strictEqual(result.gesture, 'None');
    assert.strictEqual(result.spreadPct, 0);
    assert.strictEqual(result.isPinching, false);
});

test('GestureDetector: detects open hand and fist based on spread', () => {
    const detector = new GestureDetector();

    // Open hand: landmarks 8 and 20 far apart
    const openHand = Array(21).fill(null).map((_, i) => ({ x: 0, y: 0 }));
    openHand[4] = { x: 0.1, y: 0.5 };
    openHand[8] = { x: 0.2, y: 0.2 };
    openHand[20] = { x: 0.6, y: 0.2 }; // distance = 0.4 -> 0.4 * 300 > 50

    const openResult = detector.detect([openHand]);
    assert.strictEqual(openResult.gesture, 'Open Hand');
    assert.strictEqual(openResult.spreadPct, 100);

    // Fist: landmarks 8 and 20 close together
    const fistHand = Array(21).fill(null).map((_, i) => ({ x: 0, y: 0 }));
    fistHand[4] = { x: 0.1, y: 0.5 };
    fistHand[8] = { x: 0.2, y: 0.2 };
    fistHand[20] = { x: 0.25, y: 0.2 }; // distance = 0.05 -> 0.05 * 300 = 15 < 50

    const fistResult = detector.detect([fistHand]);
    assert.strictEqual(fistResult.gesture, 'Fist');
    assert.strictEqual(fistResult.spreadPct, 15);
});

test('GestureDetector: detects pinch and midpoint', () => {
    const detector = new GestureDetector();

    const pinchHand = Array(21).fill(null).map((_, i) => ({ x: 0, y: 0 }));
    pinchHand[4] = { x: 0.5, y: 0.5 };
    pinchHand[8] = { x: 0.52, y: 0.5 }; // distance = 0.02 < 0.05
    pinchHand[20] = { x: 0.8, y: 0.5 };

    const result = detector.detect([pinchHand]);
    assert.strictEqual(result.isPinching, true);
    assert.strictEqual(result.newPinch, true);
    assert.strictEqual(result.gesture, 'PINCH !');
    assert.strictEqual(result.midpoint.x, 0.51);
    assert.strictEqual(result.midpoint.y, 0.5);

    // Consecutive frame: isPinching remains true, but newPinch is false
    const consecutive = detector.detect([pinchHand]);
    assert.strictEqual(consecutive.isPinching, true);
    assert.strictEqual(consecutive.newPinch, false);
});

test('ParticleSystem: manages particle and shockwave capacity and lifecycle', () => {
    const ps = new ParticleSystem(10, 5);

    for (let i = 0; i < 20; i++) {
        ps.emit({ x: 10, y: 10 }, '#ff0000', 2);
    }
    assert.ok(ps.particles.length <= 10, 'Particles capped at max');

    for (let i = 0; i < 10; i++) {
        ps.emitShockwave({ x: 50, y: 50 }, '#00ffff');
    }
    assert.ok(ps.ripples.length <= 5, 'Ripples capped at max');

    ps.clear();
    assert.strictEqual(ps.particles.length, 0);
    assert.strictEqual(ps.ripples.length, 0);
});

test('Themes: all themes return valid color definitions', () => {
    const themeNames = ['Rainbow', 'Cyberpunk', 'Lava', 'Ocean', 'Galaxy'];
    themeNames.forEach((name) => {
        assert.ok(themes[name], `Theme ${name} exists`);
        const color = themes[name](1.5, 0, 5);
        assert.ok(typeof color === 'string' && color.length > 0, `Theme ${name} returns valid color string`);
    });
});
