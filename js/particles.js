/**
 * HandConnect Particle and Shockwave Physics System
 */
class ParticleSystem {
    constructor(maxParticles = 100, maxRipples = 25) {
        this.particles = [];
        this.ripples = [];
        this.maxParticles = maxParticles;
        this.maxRipples = maxRipples;
    }

    emit(pos, color, count = 3) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: pos.x,
                y: pos.y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 1.0,
                color: color,
                size: Math.random() * 3 + 1
            });
        }
        if (this.particles.length > this.maxParticles) {
            this.particles.splice(0, this.particles.length - this.maxParticles);
        }
    }

    emitShockwave(pos, color) {
        this.ripples.push({
            x: pos.x,
            y: pos.y,
            radius: 0,
            maxRadius: 150 + Math.random() * 100,
            life: 1.0,
            color: color
        });
        if (this.ripples.length > this.maxRipples) {
            this.ripples.splice(0, this.ripples.length - this.maxRipples);
        }
    }

    updateAndRender(ctx) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
            p.vy += 0.1;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            } else {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = Math.max(0, p.life);
                ctx.fill();
            }
        }

        for (let i = this.ripples.length - 1; i >= 0; i--) {
            const r = this.ripples[i];
            r.radius += (r.maxRadius - r.radius) * 0.12 + 1.5;
            r.life -= 0.025;

            if (r.life <= 0) {
                this.ripples.splice(i, 1);
            } else {
                ctx.beginPath();
                ctx.arc(r.x, r.y, Math.max(0, r.radius), 0, Math.PI * 2);
                ctx.strokeStyle = r.color;
                ctx.lineWidth = Math.max(1, 3 * r.life);
                ctx.globalAlpha = Math.max(0, r.life * 0.85);
                ctx.stroke();
            }
        }

        ctx.globalAlpha = 1.0;
    }

    clear() {
        this.particles.length = 0;
        this.ripples.length = 0;
    }
}

if (typeof window !== 'undefined') {
    window.ParticleSystem = ParticleSystem;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ParticleSystem };
}
