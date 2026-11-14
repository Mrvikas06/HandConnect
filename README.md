# HandConnect

A browser-based augmented reality hand tracking interface, interactive physics playground, and procedural audiovisual synthesizer powered by MediaPipe and the Web Audio API.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Browser-informational.svg)](#prerequisites)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Hands_ML-00ffcc.svg)](https://mediapipe.dev/)
[![Web Audio API](https://img.shields.io/badge/Web_Audio-Synthesis-ff00cc.svg)](#technology-stack)
[![Tests](https://img.shields.io/badge/Tests-11_Passed-success.svg)](#testing)

HandConnect delivers zero-dependency, real-time hand skeleton tracking, interactive physics, and generative visualization directly in the browser. Using a standard webcam, the system detects 21 distinct 3D landmarks per hand at 60 FPS, synthesizing dynamic procedural audio, light-painting ribbon trails, gravity-driven energy orbs, and holographic geometry.

---

## Preview

![HandConnect User Interface and Hand Tracking Visualization](assets/preview.svg)

---

## Features

- Real-Time Multi-Hand Tracking: Tracks up to two hands simultaneously with 21 coordinates per hand using MediaPipe Hands ML.
- Interactive Visual Modes:
  - String Web: Interconnected geometric string lattice between fingertips with dual-hand rotating mandalas.
  - Energy Orbs: Bouncing physics spheres with gravity, momentum, restitution, and fingertip deflection.
  - Light Trails: Continuous neon light-painting ribbon meshes trailing active finger movements.
  - All Effects: Full combined audiovisual experience with all visual layers active.
- Advanced Gesture Recognition:
  - Pinch: Triggers expanding radial shockwaves and frequency-swept sawtooth audio zaps.
  - Pointing / Finger Gun: Projects continuous directional laser beams with projectile particle emission.
  - Peace Sign / Victory: Triggers celebratory celestial arpeggio chimes and starburst particle flares.
  - Thumbs Up: Triggers golden particle bursts and harmonized feedback tones.
  - Rock On: Synthesizes electric power chord overdrive and red flame energy bursts.
  - Dual-Hand Clap: Detects rapid palm collisions, triggering massive sub-bass sonic booms and double shockwaves.
  - Open Hand & Fist: Dynamically measures finger extension and spread percentages.
- Procedural Air Harp Synthesizer: Modulates musical notes across a pentatonic scale (C4, D4, E4, G4, A4, C5) as fingertips contact orbs or gesture.
- Proximity Hum Oscillator: Web Audio sine oscillator continuously modulates frequency and amplitude based on inter-hand distance.
- Velocity-Modulated Matrix Rain: Dual-canvas digital rain background accelerating in real-time with hand movement.
- High-Resolution Snapshot Capture: Composites webcam video, matrix background, and AR effects into a downloadable PNG photo.
- Seven Dynamic Themes: Rainbow, Cyberpunk, Lava, Ocean, Galaxy, Synthwave, and Supernova.
- Complete Hotkey Support: Instant mode switching, muting, theme cycling, orb spawning, and photo capture via keyboard.

---

## System Architecture

![HandConnect System Architecture Diagram](assets/architecture.svg)

The application follows an asynchronous client-side pipeline executing at 60 FPS without requiring build tools or bundlers:

1. Video Stream Pipeline: Captures webcam input via `navigator.mediaDevices.getUserMedia` using MediaPipe Camera utilities.
2. Machine Learning Inference: MediaPipe Hands ML processes frames and extracts 21 3D landmark vectors per detected hand.
3. Gesture Recognition Engine (`js/gestures.js`): Analyzes individual joint extension states, Euclidean distance ratios, hand velocity vectors, and multi-hand collision dynamics.
4. Procedural Audio Synthesizer (`js/audio.js`): Web Audio API oscillators synthesize proximity hums, zap sweeps, sub-bass impacts, laser bursts, and pentatonic tones.
5. Physics Simulator (`js/orbs.js`, `js/particles.js`, `js/trails.js`):
   - Computes gravity, wall reflections, and hand mesh collisions for energy orbs.
   - Updates life cycles and alpha curves for particles and radial shockwaves.
   - Smooths historical point queues for flowing neon ribbon meshes.
6. Dual-Layer Canvas Renderer:
   - Background Canvas (`js/matrix.js`): Renders Katakana digital rain with alpha-fading trail effects.
   - Foreground Canvas (`js/app.js`): Composites bone segments, string webs, orbs, lasers, trails, and mandalas.
7. Snapshot Compositor: Merges camera, background, and foreground canvases with timestamps into high-resolution PNG exports.

---

## Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| Hand Landmark Detection | MediaPipe Hands | Google client-side ML pipeline for hand landmark detection |
| Camera Stream Pipeline | MediaPipe Camera Utils | Frame acquisition and synchronization loop |
| Audio Synthesis | Web Audio API | Low-latency audio synthesis using native oscillators and gain nodes |
| Visual Rendering | HTML5 Canvas 2D API | Dual-buffered 2D canvas pipeline with destination-out blending |
| Core Language | Vanilla JavaScript (ES6+) | Dependency-free modular architecture |
| Styling & UI | CSS3 Glassmorphism | Hardware-accelerated frosted glass HUD with CSS custom properties |
| Unit Testing | Node.js Test Runner | Native test runner (`node --test`) with zero third-party dependencies |

---

## Project Structure

```text
HandConnect/
├── assets/
│   ├── architecture.svg       # Vector diagram of system architecture
│   └── preview.svg            # Vector preview of tracking and HUD
├── css/
│   └── style.css              # Application layout, HUD, and glassmorphism styling
├── js/
│   ├── app.js                 # Main application controller and render loop
│   ├── audio.js               # Procedural audio synthesis and air harp engine
│   ├── gestures.js            # Gesture recognition, bone calculation, and coordinate mapping
│   ├── matrix.js              # Background matrix rain canvas generator
│   ├── orbs.js                # Bouncing interactive energy physics orbs
│   ├── particles.js           # Particle emitters and radial shockwave simulator
│   ├── tracker.js             # MediaPipe camera wrapper and error handler
│   └── trails.js              # Neon ribbon light-painting trails
├── tests/
│   └── gestures.test.js       # Unit tests for geometry, gestures, and physics
├── index.html                 # Semantic entry point
├── LICENSE                    # MIT License
├── package.json               # Project metadata and test scripts
└── README.md                  # Project documentation
```

---

## Prerequisites

- Modern web browser with WebRTC and Web Audio support:
  - Google Chrome 80+
  - Microsoft Edge 80+
  - Mozilla Firefox 75+
  - Apple Safari 14+
- Built-in or external USB webcam.
- Camera access permissions enabled in the browser.

---

## Installation and Execution

HandConnect requires no package installations or build steps to run. However, browsers require a secure origin (HTTPS or `http://localhost`) to grant webcam access.

### Option 1: Local HTTP Server (Recommended)

Using Node.js:
```bash
# Clone the repository
git clone https://github.com/Mrvikas06/HandConnect.git
cd HandConnect

# Start local server
npm start
# Alternatively: npx serve . -l 3000
```
Open `http://localhost:3000` in your browser.

Using Python:
```bash
# Python 3
python -m http.server 8000
```
Open `http://localhost:8000` in your browser.

### Option 2: Live GitHub Pages

The application is deployed directly to GitHub Pages at:
[https://mrvikas06.github.io/HandConnect/](https://mrvikas06.github.io/HandConnect/)

---

## Gestures and Interactions Guide

| Gesture | Detection Criteria | Audio & Visual Response |
| :--- | :--- | :--- |
| Open Hand | Spread distance > 0.15 with extended fingers | Interconnected fingertip string web appears |
| Fist | All fingers curled toward palm | String lattice collapses cleanly, skeleton bones remain |
| Pinch | Thumb and index fingertip distance < 0.05 | Radial shockwave emitted, 800 Hz to 40 Hz sawtooth zap triggered |
| Pointing | Index extended, middle/ring/pinky curled | Projects directional laser beam with particle discharge |
| Peace Sign | Index and middle extended, ring/pinky curled | Synthesizes celestial arpeggio chime with starburst particles |
| Thumbs Up | Thumb extended upward, other fingers curled | Emits golden particle fountain and affirmative tone |
| Rock On | Index and pinky extended, middle/ring curled | Triggers electric power chord overdrive and red flame aura |
| Dual Clap | Rapid collision between both wrists/palms | Triggers sub-bass sonic boom impact and double shockwaves |
| Fast Move | Hand velocity vector > 0.05 | Matrix rain columns accelerate proportionally |

---

## Keyboard Shortcuts

| Shortcut | Function | Description |
| :--- | :--- | :--- |
| `1` | Mode: All | Enables all visual effects simultaneously |
| `2` | Mode: Web | Focuses on string lattice and cross-hand mandala |
| `3` | Mode: Orbs | Activates bouncing hand energy orb physics |
| `4` | Mode: Trails | Activates neon ribbon light painting trails |
| `Space` | Spawn Orb | Spawns a new interactive bouncing orb |
| `C` | Snapshot | Captures and downloads high-resolution photo |
| `M` | Mute | Toggles audio synthesizer output on/off |
| `T` | Theme | Cycles to the next color theme |

---

## Theme Presets

Themes can be changed through the bottom theme bar or by pressing `T`:

| Theme Name | Visual Tone | Mathematical Color Strategy |
| :--- | :--- | :--- |
| Rainbow | Spectrum cycle | `hsl((t * 100 + index * (360 / total)) % 360, 100%, 60%)` |
| Cyberpunk | Dual contrast | Alternating `#ff003c` (Crimson) and `#00f0ff` (Cyan) |
| Lava | Thermal pulse | Warm hue band (10 deg to 40 deg) with sine-modulated lightness |
| Ocean | Oceanic cool | Cyan and deep blue spectrum (180 deg to 280 deg) |
| Galaxy | Deep ultraviolet | Violet base (260 deg) with harmonic oscillation |
| Synthwave | Neon sunset | Retro magenta-to-orange gradient (310 deg to 370 deg) |
| Supernova | Solar flare | Radiant gold (45 deg) with high-intensity pulsing lightness |

---

## Testing

The project includes unit tests covering coordinate mapping, gesture classifiers, physics orb boundaries, ribbon trails, and theme generators.

Execute the test suite using Node.js:

```bash
npm test
```

Sample output:
```text
✔ Geometry: getDist calculates Euclidean distance correctly
✔ Geometry: mapToCanvas scales normalized coordinates to dimensions
✔ Gestures: FINGER_TIPS and HAND_CONNECTIONS are defined and valid
✔ GestureDetector: detects empty hands correctly
✔ GestureDetector: detects open hand and fist based on spread
✔ GestureDetector: detects pinch and midpoint
✔ ParticleSystem: manages particle and shockwave capacity and lifecycle
✔ GestureDetector: detects specialized gestures (Peace, Pointing, Rock On, Thumbs Up, Clap)
✔ Themes: all themes return valid color definitions
✔ PhysicsOrbs: updates position and manages orb capacities
✔ RibbonTrails: manages tracks and point lifecycles
ℹ tests 11
ℹ pass 11
ℹ fail 0
```

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for complete terms.
