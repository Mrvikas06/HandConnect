/**
 * HandConnect Hand Tracker
 * Wraps MediaPipe Hands and Camera utilities with error handling and lifecycle management.
 */
class HandTracker {
    constructor(videoElement, options = {}, callbacks = {}) {
        this.videoElement = videoElement;
        this.options = Object.assign({
            maxNumHands: 2,
            modelComplexity: 0,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.4
        }, options);
        this.onResults = callbacks.onResults || (() => {});
        this.onError = callbacks.onError || (() => {});
        this.hands = null;
        this.camera = null;
        this.isRunning = false;
    }

    async start() {
        if (this.isRunning) return;

        if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            this.onError(new Error("Camera API is not supported in this environment. Please run over HTTPS or localhost."));
            return;
        }

        if (typeof Hands === 'undefined' || typeof Camera === 'undefined') {
            this.onError(new Error("MediaPipe library failed to load. Please verify your internet connection."));
            return;
        }

        try {
            this.hands = new Hands({
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
            });

            this.hands.setOptions(this.options);
            this.hands.onResults((results) => {
                this.onResults(results);
            });

            this.camera = new Camera(this.videoElement, {
                onFrame: async () => {
                    if (this.hands && this.isRunning) {
                        await this.hands.send({ image: this.videoElement });
                    }
                },
                width: 1280,
                height: 720,
                facingMode: 'user'
            });

            this.isRunning = true;
            await this.camera.start();
        } catch (err) {
            this.isRunning = false;
            this.onError(err);
        }
    }

    stop() {
        this.isRunning = false;
        if (this.camera && typeof this.camera.stop === 'function') {
            try { this.camera.stop(); } catch (_) {}
        }
        if (this.videoElement && this.videoElement.srcObject) {
            const stream = this.videoElement.srcObject;
            const tracks = stream.getTracks ? stream.getTracks() : [];
            tracks.forEach(track => track.stop());
            this.videoElement.srcObject = null;
        }
    }
}

if (typeof window !== 'undefined') {
    window.HandTracker = HandTracker;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HandTracker };
}
