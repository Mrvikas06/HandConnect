/**
 * HandConnect Neon Ribbon Light-Painting Trails
 * Renders smooth flowing ribbons following fingertip movement.
 */
class RibbonTrails {
    constructor(maxPoints = 28) {
        this.maxPoints = maxPoints;
        this.tracks = new Map(); // key: fingerId/handIndex, value: array of points
        this.enabled = true;
    }

    addPoint(trackId, x, y, color) {
        if (!this.tracks.has(trackId)) {
            this.tracks.set(trackId, []);
        }
        const pts = this.tracks.get(trackId);
        pts.push({
            x,
            y,
            color,
            life: 1.0,
            width: 4
        });
        if (pts.length > this.maxPoints) {
            pts.shift();
        }
    }

    update() {
        this.tracks.forEach((pts, trackId) => {
            for (let i = pts.length - 1; i >= 0; i--) {
                pts[i].life -= 0.035;
                if (pts[i].life <= 0) {
                    pts.splice(i, 1);
                }
            }
            if (!pts.length) {
                this.tracks.delete(trackId);
            }
        });
    }

    render(ctx) {
        if (!this.enabled) return;

        this.tracks.forEach((pts) => {
            if (pts.length < 2) return;

            for (let i = 1; i < pts.length; i++) {
                const prev = pts[i - 1];
                const curr = pts[i];
                const progress = i / pts.length;

                ctx.beginPath();
                ctx.moveTo(prev.x, prev.y);
                ctx.lineTo(curr.x, curr.y);
                ctx.strokeStyle = curr.color;
                ctx.lineWidth = Math.max(1, curr.width * progress * curr.life);
                ctx.globalAlpha = Math.max(0, curr.life * 0.85);
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.stroke();
            }
        });

        ctx.globalAlpha = 1.0;
    }

    clear() {
        this.tracks.clear();
    }
}

if (typeof window !== 'undefined') {
    window.RibbonTrails = RibbonTrails;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RibbonTrails };
}
