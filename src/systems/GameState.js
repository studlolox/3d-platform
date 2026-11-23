/**
 * GameState.js
 * Explicit state machine for game loop, player health, score, checkpointing, and powerups.
 */

export const STATES = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  DYING: 'DYING',
  RESPAWNING: 'RESPAWNING',
  VICTORY: 'VICTORY',
  GAME_OVER: 'GAME_OVER'
};

export class GameStateManager {
  constructor() {
    this.currentState = STATES.MENU;
    this.previousState = STATES.MENU;

    // World & Level progression
    this.currentWorld = 1;
    this.currentLevel = 1;
    this.levelKey = '1-1';

    // Player stats
    this.initialLives = 3;
    this.lives = this.initialLives;
    this.score = 0;
    this.coins = 0;
    this.time = 300; // 300 seconds limit
    this.timeElapsed = 0;

    // Power-up state
    this.powerUp = {
      active: false,
      type: null,
      timer: 0,
      duration: 10
    };

    // Checkpoint
    this.defaultSpawn = { x: 2.0, y: 3.5, z: 0 };
    this.checkpoint = { ...this.defaultSpawn };
    this.reachedCheckpoint = false;

    // Listeners for UI updates
    this.listeners = [];
  }

  subscribe(listener) {
    this.listeners.push(listener);
    this.notify();
  }

  notify() {
    const data = {
      state: this.currentState,
      world: this.currentWorld,
      level: this.currentLevel,
      levelKey: this.levelKey,
      lives: this.lives,
      score: this.score,
      coins: this.coins,
      time: Math.max(0, Math.ceil(this.time)),
      powerUp: { ...this.powerUp },
      reachedCheckpoint: this.reachedCheckpoint
    };
    for (let cb of this.listeners) {
      cb(data);
    }
  }

  setState(newState) {
    if (this.currentState === newState) return;
    this.previousState = this.currentState;
    this.currentState = newState;
    this.notify();
  }

  setLevel(world, level) {
    this.currentWorld = world;
    this.currentLevel = level;
    this.levelKey = `${world}-${level}`;
    this.resetLevel();
    this.notify();
  }

  setLevelKey(key) {
    const parts = key.split('-');
    if (parts.length === 2) {
      this.currentWorld = parseInt(parts[0], 10) || 1;
      this.currentLevel = parseInt(parts[1], 10) || 1;
    }
    this.levelKey = key;
    this.resetLevel();
    this.notify();
  }

  resetLevel() {
    this.time = 300;
    this.powerUp.active = false;
    this.powerUp.timer = 0;
    this.powerUp.type = null;
    this.checkpoint = { ...this.defaultSpawn };
    this.reachedCheckpoint = false;
  }

  resetAll() {
    this.currentWorld = 1;
    this.currentLevel = 1;
    this.levelKey = '1-1';
    this.lives = this.initialLives;
    this.score = 0;
    this.coins = 0;
    this.resetLevel();
  }

  addScore(pts) {
    this.score += pts;
    this.notify();
  }

  addCoin() {
    this.coins++;
    this.addScore(100);
    // 100 coins awards an extra 1-Up!
    if (this.coins % 100 === 0) {
      this.lives++;
    }
    this.notify();
  }

  takeDamage() {
    // If powered up with Star Dash, ignore damage
    if (this.powerUp.active && this.powerUp.type === 'STAR_DASH') {
      return false;
    }

    this.lives--;
    this.notify();

    if (this.lives <= 0) {
      return 'GAME_OVER';
    } else {
      return 'RESPAWN';
    }
  }

  setCheckpoint(x, y, z = 0) {
    this.checkpoint = { x, y, z };
    this.reachedCheckpoint = true;
    this.addScore(500);
    this.notify();
  }

  activatePowerUp(type = 'STAR_DASH', duration = 10) {
    this.powerUp.active = true;
    this.powerUp.type = type;
    this.powerUp.duration = duration;
    this.powerUp.timer = duration;
    this.addScore(1000);
    this.notify();
  }

  update(dt) {
    if (this.currentState === STATES.PLAYING) {
      // Countdown timer
      this.time -= dt;
      this.timeElapsed += dt;

      if (this.time <= 0) {
        this.time = 0;
        this.takeDamage();
        if (this.lives <= 0) {
          this.setState(STATES.GAME_OVER);
        } else {
          this.setState(STATES.DYING);
        }
      }

      // Power-up countdown
      if (this.powerUp.active) {
        this.powerUp.timer -= dt;
        if (this.powerUp.timer <= 0) {
          this.powerUp.active = false;
          this.powerUp.timer = 0;
          this.powerUp.type = null;
        }
        this.notify();
      }
    }
  }
}

export const gameState = new GameStateManager();
