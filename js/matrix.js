/**
 * HandConnect Matrix Digital Rain Background
 */
class MatrixRain {
    constructor(canvas, fontSize = 16) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.fontSize = fontSize;
        this.columns = [];
        this.width = canvas.width;
        this.height = canvas.height;
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx.font = `${this.fontSize}px monospace`;
        const totalColumns = Math.floor(width / this.fontSize);
        this.columns = new Array(totalColumns).fill(1).map(() => Math.random() * (height / this.fontSize));
    }

    render(color, handVelocity = 0) {
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.fillStyle = `rgba(0, 0, 0, ${0.15 + Math.min(handVelocity * 10, 0.5)})`;
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.globalCompositeOperation = 'source-over';

        this.ctx.fillStyle = color;

        const speedMultiplier = 1 + (handVelocity * 100);

        for (let i = 0; i < this.columns.length; i++) {
            if (Math.random() > 0.95) {
                const char = String.fromCharCode(0x30A0 + Math.random() * 96);
                this.ctx.fillText(char, i * this.fontSize, this.columns[i] * this.fontSize);
            }
            this.columns[i] += Math.random() * speedMultiplier;
            if (this.columns[i] * this.fontSize > this.height && Math.random() > 0.9) {
                this.columns[i] = 0;
            }
        }
    }
}

if (typeof window !== 'undefined') {
    window.MatrixRain = MatrixRain;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MatrixRain };
}
