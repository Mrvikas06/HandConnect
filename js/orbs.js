/**
 * HandConnect Interactive Physics Orbs
 * Bouncing energy orbs that collide with hand skeletons and fingertips.
 */
class PhysicsOrb {
    constructor(x, y, radius = 18, color = '#00ffcc') {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 6;
        this.vy = -Math.random() * 5 - 2;
        this.radius = radius;
        this.color = color;
        this.gravity = 0.28;
        this.restitution = 0.82;
        this.trail = [];
        this.maxTrail = 10;
        this.lastBounceTime = 0;
    }

    update(width, height) {
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;

        // Screen boundary collisions
        if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.vx = -this.vx * this.restitution;
        } else if (this.x + this.radius > width) {
            this.x = width - this.radius;
            this.vx = -this.vx * this.restitution;
        }

        if (this.y + this.radius > height) {
            this.y = height - this.radius;
            this.vy = -this.vy * this.restitution;
            // Dampen horizontal velocity on floor
            this.vx *= 0.96;
        } else if (this.y - this.radius < 0) {
            this.y = this.radius;
            this.vy = -this.vy * this.restitution;
        }

        // Maintain tail
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrail) {
            this.trail.shift();
        }
    }

    checkHandCollision(handPoints, audioEngine, particleSystem) {
        const now = performance.now();
        for (let i = 0; i < handPoints.length; i++) {
            const pt = handPoints[i];
            const dx = this.x - pt.x;
            const dy = this.y - pt.y;
            const dist = Math.hypot(dx, dy);
            const minDist = this.radius + 14;

            if (dist < minDist && dist > 0) {
                // Collision normal
                const nx = dx / dist;
                const ny = dy / dist;

                // Push orb outside collision radius
                this.x = pt.x + nx * minDist;
                this.y = pt.y + ny * minDist;

                // Reflect and boost velocity
                const dot = this.vx * nx + this.vy * ny;
                this.vx = (this.vx - 2 * dot * nx) * 1.05 + (pt.vx || 0) * 0.4;
                this.vy = (this.vy - 2 * dot * ny) * 1.05 + (pt.vy || 0) * 0.4 - 2;

                // Cap max velocity
                const speed = Math.hypot(this.vx, this.vy);
                if (speed > 18) {
                    this.vx = (this.vx / speed) * 18;
                    this.vy = (this.vy / speed) * 18;
                }

                if (now - this.lastBounceTime > 90) {
                    this.lastBounceTime = now;
                    if (particleSystem) {
                        particleSystem.emit({ x: this.x, y: this.y }, this.color, 8);
                        particleSystem.emitShockwave({ x: this.x, y: this.y }, this.color);
                    }
                    if (audioEngine) {
                        audioEngine.playHarpNote(i);
                    }
                }
                break;
            }
        }
    }

    render(ctx) {
        // Draw trailing ghost path
        for (let t = 0; t < this.trail.length; t++) {
            const tr = this.trail[t];
            const alpha = (t / this.trail.length) * 0.35;
            ctx.beginPath();
            ctx.arc(tr.x, tr.y, this.radius * (0.4 + 0.6 * (t / this.trail.length)), 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.globalAlpha = alpha;
            ctx.fill();
        }

        // Draw main orb body
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.85;
        ctx.fill();

        // Core highlight
        ctx.beginPath();
        ctx.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.9;
        ctx.fill();

        ctx.globalAlpha = 1.0;
    }
}

class OrbManager {
    constructor(maxOrbs = 4) {
        this.orbs = [];
        this.maxOrbs = maxOrbs;
        this.enabled = true;
    }

    spawn(width, height, color = '#00ffcc') {
        if (this.orbs.length >= this.maxOrbs) return;
        const x = width * (0.25 + Math.random() * 0.5);
        const y = height * 0.2;
        this.orbs.push(new PhysicsOrb(x, y, 16 + Math.random() * 6, color));
    }

    reset(width, height, count = 3, color = '#00ffcc') {
        this.orbs = [];
        for (let i = 0; i < count; i++) {
            const x = width * (0.2 + (i + 0.5) * (0.6 / count));
            const y = height * 0.25;
            this.orbs.push(new PhysicsOrb(x, y, 18, color));
        }
    }

    update(width, height, hands, audioEngine, particleSystem) {
        if (!this.enabled || !this.orbs.length) return;

        // Collect interaction points from active hands
        const handPoints = [];
        if (hands && hands.length) {
            hands.forEach((hand) => {
                [0, 4, 8, 9, 12, 16, 20].forEach((idx) => {
                    if (hand[idx]) {
                        handPoints.push({
                            x: hand[idx].x * width,
                            y: hand[idx].y * height
                        });
                    }
                });
            });
        }

        this.orbs.forEach((orb) => {
            orb.update(width, height);
            if (handPoints.length) {
                orb.checkHandCollision(handPoints, audioEngine, particleSystem);
            }
        });
    }

    render(ctx) {
        if (!this.enabled) return;
        this.orbs.forEach((orb) => orb.render(ctx));
    }
}

if (typeof window !== 'undefined') {
    window.PhysicsOrb = PhysicsOrb;
    window.OrbManager = OrbManager;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PhysicsOrb, OrbManager };
}
