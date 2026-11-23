/**
 * Game.js
 * Central game engine orchestrator: manages Three.js rendering, lighting,
 * fixed timestep physics loop, level loading, entity updates, and state transitions.
 */

import * as THREE from 'three';
import { GameCamera } from './Camera.js';
import { input } from './Input.js';
import { audio } from './Audio.js';
import { gameState, STATES } from '../systems/GameState.js';
import { ParticleSystem } from '../systems/Particles.js';
import { Level } from '../world/Level.js';
import { Player } from '../entities/Player.js';
import { HUD } from '../ui/HUD.js';
import { MenuManager } from '../ui/Menu.js';
import { getLevelData, getNextLevelKey } from '../world/levels/index.js';

export class Game {
  constructor() {
    this.container = document.getElementById('game-container');

    // 1. Scene & Renderer setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x60a5fa); // Bright cartoon sky blue
    this.scene.fog = new THREE.FogExp2(0x93c5fd, 0.008); // Gentle atmospheric distance fog

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.tabIndex = 0;
    this.container.appendChild(this.renderer.domElement);

    // 2. Camera setup
    this.gameCamera = new GameCamera(window.innerWidth / window.innerHeight);

    // 3. Lighting setup
    this.setupLighting();

    // 4. Particle System
    this.particles = new ParticleSystem(this.scene);

    // 5. Level & Player instantiation
    this.level = new Level(this.scene, this.particles, this.gameCamera);
    this.player = new Player(this.scene, this.particles, this.gameCamera);

    // Attach systems to game instance for easy access and testing
    this.gameState = gameState;
    this.input = input;
    this.audio = audio;

    // 6. UI systems
    this.hud = new HUD(this);
    this.menus = new MenuManager(this);

    // 7. Simulation loop timing
    this.fixedDelta = 1 / 60; // 60Hz fixed physics step
    this.accumulator = 0;
    this.lastTime = performance.now();
    this.maxSubSteps = 5;

    // Window events
    window.addEventListener('resize', () => this.onResize());

    // Build initial level & set camera
    this.initWorld();

    // Start render loop
    requestAnimationFrame((t) => this.loop(t));
  }

  setupLighting() {
    // Ambient / Hemisphere light: sky blue from top, soft meadow bounce from bottom
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x81c784, 0.75);
    this.hemiLight.position.set(0, 50, 0);
    this.scene.add(this.hemiLight);

    // Main warm directional sunlight with shadows
    this.sunLight = new THREE.DirectionalLight(0xfffaed, 1.25);
    this.sunLight.position.set(20, 35, 25);
    this.sunLight.castShadow = true;

    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 80;

    const d = 25;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;

    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);
  }

  initWorld(levelKey = null) {
    if (levelKey) {
      gameState.setLevelKey(levelKey);
    }
    const data = getLevelData(gameState.levelKey);
    this.level.build(data);

    if (data.theme?.ambientLight && this.hemiLight) {
      this.hemiLight.color.setHex(data.theme.ambientLight.color || 0xffffff);
      this.hemiLight.groundColor.setHex(data.theme.ambientLight.groundColor || 0x81c784);
      this.hemiLight.intensity = data.theme.ambientLight.intensity || 0.75;
    }
    if (data.theme?.sunLight && this.sunLight) {
      this.sunLight.color.setHex(data.theme.sunLight.color || 0xfffaed);
      this.sunLight.intensity = data.theme.sunLight.intensity || 1.25;
    }

    gameState.defaultSpawn = data.spawn || { x: 2.0, y: 3.5, z: 0 };
    if (!gameState.reachedCheckpoint) {
      gameState.checkpoint = { ...gameState.defaultSpawn };
    }

    this.player.reset(gameState.checkpoint);
    this.gameCamera.reset(this.player.pos);
  }

  loadLevel(levelKey) {
    gameState.setLevelKey(levelKey);
    this.initWorld(levelKey);
    gameState.setState(STATES.PLAYING);
    this.hud.show();
  }

  nextLevel() {
    const nextKey = getNextLevelKey(gameState.levelKey);
    if (nextKey) {
      this.loadLevel(nextKey);
    } else {
      this.returnToMenu();
    }
  }

  startGame() {
    gameState.resetAll();
    this.initWorld();
    gameState.setState(STATES.PLAYING);
    this.hud.show();
  }

  restartLevel() {
    this.initWorld();
    gameState.time = 300;
    gameState.powerUp.active = false;
    gameState.setState(STATES.PLAYING);
    this.hud.show();
  }

  returnToMenu() {
    audio.stopBGM();
    gameState.setState(STATES.MENU);
    this.hud.hide();
    this.initWorld();
  }

  togglePause() {
    if (gameState.currentState === STATES.PLAYING) {
      gameState.setState(STATES.PAUSED);
    } else if (gameState.currentState === STATES.PAUSED) {
      gameState.setState(STATES.PLAYING);
    }
  }

  onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.gameCamera.resize(w, h);
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  // --- Main Simulation & Render Loop ---

  loop(currentTime) {
    requestAnimationFrame((t) => this.loop(t));

    const rawDelta = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Clamp huge frame pauses (e.g. tab switches)
    const dt = Math.min(rawDelta, 0.1);

    // Global keyboard triggers
    if (input.wasPauseJustPressed()) {
      if (gameState.currentState === STATES.PLAYING || gameState.currentState === STATES.PAUSED) {
        this.togglePause();
      }
    }
    if (input.wasRestartJustPressed()) {
      if (gameState.currentState === STATES.PLAYING || gameState.currentState === STATES.PAUSED) {
        this.restartLevel();
      }
    }

    // Input timer updates
    input.update(dt);

    // Fixed timestep execution
    if (gameState.currentState === STATES.PLAYING) {
      this.accumulator += dt;
      let steps = 0;

      while (this.accumulator >= this.fixedDelta && steps < this.maxSubSteps) {
        this.fixedUpdate(this.fixedDelta);
        this.accumulator -= this.fixedDelta;
        steps++;
      }

      // Visual animations
      this.player.updateAnimations(dt);
    } else if (gameState.currentState === STATES.VICTORY) {
      this.player.playVictoryPose(dt);
    } else if (gameState.currentState === STATES.MENU) {
      // Gentle menu camera drift & idle breathing
      this.player.updateAnimations(dt);
      this.gameCamera.update(this.player.pos, 1, dt);
    }

    // Dynamic sunlight tracking player for optimal shadow coverage
    if (this.player && this.sunLight) {
      this.sunLight.position.x = this.player.pos.x + 15;
      this.sunLight.position.y = this.player.pos.y + 25;
      this.sunLight.target.position.set(this.player.pos.x, this.player.pos.y, 0);
      this.sunLight.target.updateMatrixWorld();
    }

    // Always update particles
    this.particles.update(dt);

    // Smooth camera tracking
    if (gameState.currentState === STATES.PLAYING || gameState.currentState === STATES.VICTORY) {
      this.gameCamera.update(this.player.pos, this.player.facingDir, dt);
    }

    // Post-frame input cleanup
    input.postUpdate();

    // Render 3D Scene
    this.renderer.render(this.scene, this.gameCamera.camera);
  }

  fixedUpdate(fixedDt) {
    // 1. Update Game State timer
    gameState.update(fixedDt);

    // 2. Update Player Physics & Collisions
    this.player.updatePhysics(fixedDt);

    // 3. Update Level Entities (Coins, Powerups, Enemies, Moving Platforms, Blocks)
    this.level.update(fixedDt, this.player);
  }
}
