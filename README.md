# Super Jump World — 3D Platform Adventure

A high-quality, fully playable 3D platformer game inspired by classic Super Mario gameplay, built from scratch using **Three.js**, **HTML5/CSS3**, **Vanilla JavaScript (ES Modules)**, and the **Web Audio API**.

---

## 🌟 Highlights & Features

- **2.5D Platformer Perspective:** Full 3D world with responsive horizontal movement and vertical jumping, smooth camera easing, look-ahead tracking, and impact screen shake.
- **Cute Stylized Adventurer:** Original 3D character with expressive eyes, adventurer cap, overalls, gloves, and boots. Features procedural animations for idle breathing, running, jumping, falling, landing squash-and-stretch, hurt blink, and victory celebration.
- **Responsive Platforming Physics:**
  - Acceleration, deceleration, and ground friction.
  - Air control and terminal fall velocity.
  - Variable jump height depending on button hold duration.
  - Jump input buffering (140ms) and Coyote time (120ms).
  - Deterministic fixed timestep simulation (60Hz) preventing tunneling or falling through ground.
- **World 1-1: Sunny Meadows:**
  - Safe starter area, guiding coin arcs, elevated platforms, and mound challenges.
  - **Interactive Mystery Blocks:** Bounce up when hit from below, emit particles, play sounds, and dispense coins or Star Dash power-ups.
  - **Breakable Brick Blocks:** Shatter into 4 tumbling debris chunks when struck from below.
  - **Moving Platforms:** Horizontally and vertically oscillating platforms that carry the player.
  - **Original Cartoon Enemies:**
    - **Walker ("Sproutle"):** Acorn/mushroom patrolling creature that turns at edges and can be stomped from above.
    - **Hopper ("Bouncy"):** Bunny-eared creature that hops periodically and patrols.
  - **Star Dash Power-Up:** Grants speed boost (+60%), invulnerability to enemy attacks, and sparkling gold trail particles with a HUD timer meter.
  - **Mid-level Checkpoint:** Interactive flag pole that turns gold, plays a fanfare, and saves spawn position.
  - **Victory Goal Arch:** Goal castle arch and flagpole that triggers level complete celebration with confetti and score calculation.
- **Arcade HUD & Menus:**
  - Main Menu, Controls Modal, Pause Menu, Victory Screen, and Game Over Screen.
  - Real-time HUD showing lives, coins, world, score, countdown timer, and power-up meter.
  - Floating arcade score popups (`+100`, `+200`, `+1000`, `CHECKPOINT!`, `STAR DASH!`).
- **100% Procedural Web Audio API:**
  - Complete custom synthesizer for jump, double-tone coin chimes, stomp punch, hurt crunch, block bumps, block break noise, power-up arpeggios, checkpoint chime, victory fanfare, and an upbeat procedural background melody! Zero external audio files required.
- **Desktop & Mobile Support:**
  - Responsive layout, auto-detecting mobile touch controls (Left/Right virtual buttons, Jump and Sprint).

---

## 🎮 Controls

### Desktop Keyboard

| Key | Action |
|---|---|
| **A / Left Arrow** | Move left |
| **D / Right Arrow** | Move right |
| **Space / W / Up Arrow** | Jump (Hold longer for higher jump!) |
| **Shift / J / X** | Sprint / Speed Boost |
| **P / Escape** | Pause Game |
| **R** | Quick Restart Level |

### Mobile Touch

- **◀ / ▶**: Move Left and Right
- **▲**: Jump
- **⚡**: Sprint

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+) and npm

### Installation & Run

1. Clone or navigate to the project directory:
   ```bash
   cd 3d-platform
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

4. Run automated test suites:
   ```bash
   # Run full 37-assertion telemetry suite
   npm test

   # Run isolated Playwright spec tests
   npm run test:spec

   # Run all tests and verify production build
   npm run test:all

   # Run Three.js canvas pixel & render budget inspector
   npm run inspect:canvas
   ```

5. Build for production:
   ```bash
   npm run build
   npm run preview
   ```

---

## 📁 Project Architecture

```text
super-jump-world/
├── index.html                   # HTML structure, HUD, menus, modal templates
├── package.json                 # Dependencies and build scripts (Three.js & Vite)
├── src/
│   ├── main.js                  # Application entry point & audio unlocking
│   ├── core/
│   │   ├── Game.js              # Three.js engine, renderer, fixed timestep loop
│   │   ├── Input.js             # Keyboard and mobile touch manager, jump buffering
│   │   ├── Camera.js            # 2.5D camera with look-ahead, boundaries, screen shake
│   │   └── Audio.js             # Web Audio API sound & procedural music synthesizer
│   ├── entities/
│   │   ├── Player.js            # 3D character model, physics, state & animations
│   │   ├── Enemy.js             # Walker ("Sproutle") & Hopper ("Bouncy") enemies
│   │   ├── Coin.js              # Floating, rotating collectible golden coin
│   │   └── PowerUp.js           # Star Dash bouncing power-up entity
│   ├── world/
│   │   ├── Level.js             # World 1-1 layout, terrain, background scenery
│   │   ├── Platforms.js         # Mystery, breakable, and moving platforms, flags
│   │   └── Collision.js         # 2.5D AABB collision detection and resolution
│   ├── systems/
│   │   ├── Physics.js           # Physics tuning constants
│   │   ├── Particles.js         # Dust, sparkles, debris, confetti, and floating text
│   │   └── GameState.js         # State machine, scoring, health, and checkpointing
│   ├── ui/
│   │   ├── HUD.js               # In-game heads-up display
│   │   └── Menu.js              # Title screen, pause, victory, and game over overlays
│   └── styles/
│       └── main.css             # Arcade styling, responsive layout, animations
└── README.md
```

---

## 🏆 Scoring & Rewards

- **Coin:** +100 points (Every 100 coins awards an extra life!)
- **Breakable Block:** +50 points
- **Enemy Stomp:** +200 points
- **Hopper Stomp:** +300 points
- **Star Dash Power-Up:** +1000 points
- **Checkpoint:** +500 points
- **Level Completion Time Bonus:** 50 points per remaining second
