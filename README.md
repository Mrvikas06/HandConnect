# 🖐️ HANDCONNECT

<div align="center">

```
    ╔═══════════════════════════════════════════════════════════════╗
    ║   ██╗  ██╗ █████╗ ███╗   ██╗██████╗                          ║
    ║   ██║  ██║██╔══██╗████╗  ██║██╔══██╗                         ║
    ║   ███████║███████║██╔██╗ ██║██║  ██║                         ║
    ║   ██╔══██║██╔══██║██║╚██╗██║██║  ██║                         ║
    ║   ██║  ██║██║  ██║██║ ╚████║██████╔╝                         ║
    ║   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝                         ║
    ║    ██████╗ ██████╗ ███╗   ██╗███╗   ██╗███████╗ ██████╗████████╗║
    ║   ██╔════╝██╔═══██╗████╗  ██║████╗  ██║██╔════╝██╔════╝╚══██╔══╝║
    ║   ██║     ██║   ██║██╔██╗ ██║██╔██╗ ██║█████╗  ██║        ██║   ║
    ║   ██║     ██║   ██║██║╚██╗██║██║╚██╗██║██╔══╝  ██║        ██║   ║
    ║   ╚██████╗╚██████╔╝██║ ╚████║██║ ╚████║███████╗╚██████╗   ██║   ║
    ║    ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═══╝╚══════╝ ╚═════╝   ╚═╝   ║
    ╚═══════════════════════════════════════════════════════════════╝
```

**🖐️ Your hands are the controller. The world is your canvas.**

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-0097A7?style=for-the-badge&logo=google&logoColor=white)](https://mediapipe.dev/)
[![Web Audio API](https://img.shields.io/badge/Web_Audio-FF6F00?style=for-the-badge&logo=audio&logoColor=white)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-cyan.svg?style=for-the-badge)](#license)

### 🔗 [**Live Demo →** https://mrvikas06.github.io/HandConnect/](https://mrvikas06.github.io/HandConnect/)

</div>

---

## 🌌 What Is HandConnect?

**HandConnect** is a browser-based augmented reality experience that turns your hands into instruments of light. Using **Google MediaPipe** for real-time hand tracking, your fingers become neon torches connected by glowing strings, surrounded by particle storms and digital matrix rain.

> _No headset. No controllers. No installation. Just open a browser and move your hands._

---

## 🎬 The Experience

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   ✋  OPEN   ──►  String web connects fingertips    │
│   ✊  FIST   ──►  Strings disappear cleanly        │
│   🤏  PINCH  ──►  Electric zap + shockwave         │
│   🙌  BOTH   ──►  Cross-hand strings + mandala     │
│   💨  MOVE   ──►  Matrix rain speeds up            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## ⚡ Features

| Feature | Description |
|:--------|:------------|
| 🖐️ **Real-Time Hand Tracking** | Tracks up to 2 hands with 21 landmarks each via MediaPipe |
| 🕸️ **Fingertip String Web** | Glowing strings connect all 5 fingertips when hand is open |
| 🔗 **Cross-Hand Strings** | Matching fingertips link between two hands with themed colors |
| 🌀 **Mandala Geometry** | Rotating geometric star pattern from all 10 fingertips |
| 🎨 **5 Dynamic Themes** | Rainbow · Cyberpunk · Lava · Ocean · Galaxy |
| 🔊 **Reactive Audio** | Hum modulates with hand proximity, zap on pinch |
| 🎆 **Particle Physics** | Sparks with gravity, velocity, and fade from every fingertip |
| 🟢 **Matrix Rain** | Katakana rain that speeds up with hand movement |
| 📊 **Live HUD** | Real-time FPS, hand count, gesture, spread percentage |
| ⚡ **Optimized Rendering** | No shadowBlur, clean clearRect, particle cap — runs smooth |

---

## 🧬 Architecture

```
                    ┌──────────────────────┐
                    │    BROWSER CAMERA     │
                    └──────────┬───────────┘
                               │ video frames
                               ▼
                    ┌──────────────────────┐
                    │  MEDIAPIPE HANDS ML  │
                    │  (21 landmarks/hand) │
                    └──────────┬───────────┘
                               │ landmark data
                    ┌──────────┴───────────┐
                    │                      │
            ┌───────▼──────┐     ┌────────▼────────┐
            │  RENDER LOOP │     │  AUDIO ENGINE   │
            │  (60fps)     │     │  (Web Audio API) │
            └──┬───┬───┬───┘     └─────────────────┘
               │   │   │
     ┌─────────┘   │   └─────────┐
     ▼             ▼             ▼
 ┌────────┐  ┌──────────┐  ┌────────┐
 │BG Canvas│  │Main Canvas│ │Physics │
 │(Matrix) │  │(Skeleton) │ │Engine  │
 └─────────┘  │(Strings)  │ └────────┘
              └──────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- A modern browser (Chrome, Edge, or Firefox)
- A webcam
- Your two hands 🖐️🖐️

### Launch

```bash
# Clone this repo
git clone https://github.com/yourusername/handconnect.git

# Just open index.html — no build step, no dependencies
# Or use a local server (recommended for camera permissions)
npx serve .
```

> [!TIP]
> Using a local server (`npx serve .` or VS Code Live Server) is recommended for reliable webcam access.

---

## 🎨 Themes

| Theme | Vibe | Color Logic |
|:------|:-----|:------------|
| 🌈 **Rainbow** | Rave party | HSL hue rotation through full spectrum |
| 🤖 **Cyberpunk** | Blade Runner | Alternating `#ff003c` red and `#00f0ff` cyan |
| 🌋 **Lava** | Volcanic heat | Warm hues (0°–40°) with pulsing luminosity |
| 🌊 **Ocean** | Deep sea calm | Cool hues (180°+) with gentle shifts |
| 🌌 **Galaxy** | Cosmic wonder | Purple-violet (260°) with sine oscillation |

---

## 🕹️ Controls & Gestures

```
╭───────────────────────────────────────────╮
│              GESTURE GUIDE                │
├───────────────────────────────────────────┤
│                                           │
│  ✋ Open Hand    → String web appears     │
│  ✊ Closed Fist  → Strings disappear      │
│  🤏 Pinch       → Zap sound effect       │
│  🤲 Two Hands   → Cross-hand strings     │
│  💨 Fast Move   → Matrix rain speeds up  │
│                                           │
│  [Theme Bar]    → Click to switch themes  │
│                                           │
╰───────────────────────────────────────────╯
```

---

## 🛠️ Tech Stack

| Technology | Role |
|:-----------|:-----|
| **HTML5 Canvas** | Dual-canvas rendering (background + foreground) |
| **MediaPipe Hands** | Google's ML hand tracking (via CDN) |
| **Web Audio API** | Real-time audio synthesis |
| **CSS Glassmorphism** | Frosted glass UI with `backdrop-filter: blur()` |
| **Vanilla JS** | No frameworks — pure, dependency-free JavaScript |

---

## 🌟 What Makes This Unique

- 🚫 **No frameworks** — it's a single HTML file
- 🚫 **No npm install** — just open in browser
- 🚫 **No headset needed** — works with any webcam
- ✅ **Real ML hand tracking** — not simple motion detection
- ✅ **Interactive string web** — fingers connected by glowing threads
- ✅ **Cross-hand connections** — both hands linked by colored strings
- ✅ **Optimized rendering** — zero shadowBlur, particle caps, clean frames

---

## 📁 Project Structure

```
Handconnect/
│
├── index.html          ← The entire app — HTML + CSS + JS in one file
│                          (no build tools, no frameworks, pure vibes)
│
└── README.md           ← You are here ✨
```

---

## 🤝 Contributing

Contributions are welcome! Ideas:

- [ ] Add hand pose classification (peace sign, thumbs up, etc.)
- [ ] Create a recording mode to save sessions as video
- [ ] Add more themes with unique effects
- [ ] Implement WebRTC for multi-user shared AR

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

```
   ╔═══════════════════════════════════════╗
   ║                                       ║
   ║   Built with 🖐️ by vikas kr singh,   ║
   ║   tracked by 🤖 machine learning,     ║
   ║   connected by ✨ neon strings.       ║
   ║                                       ║
   ╚═══════════════════════════════════════╝
```

**If you liked this, drop a ⭐ — it makes the strings glow brighter.**

</div>
