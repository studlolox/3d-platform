/**
 * HUD.js
 * Manages the heads-up display during gameplay.
 */

import { gameState, STATES } from '../systems/GameState.js';
import { audio } from '../core/Audio.js';

export class HUD {
  constructor(game) {
    this.game = game;

    this.container = document.getElementById('hud');
    this.livesVal = document.getElementById('hud-lives-val');
    this.coinsVal = document.getElementById('hud-coins-val');
    this.scoreVal = document.getElementById('hud-score-val');
    this.timeVal = document.getElementById('hud-time-val');

    this.powerUpBar = document.getElementById('hud-powerup-bar');
    this.powerUpFill = document.getElementById('powerup-fill');

    this.btnPause = document.getElementById('btn-pause');
    this.btnSoundToggle = document.getElementById('btn-sound-toggle');

    this.initEvents();
    gameState.subscribe((data) => this.update(data));
  }

  initEvents() {
    if (this.btnPause) {
      this.btnPause.addEventListener('click', () => {
        audio.playUIClick();
        this.game.togglePause();
      });
    }

    if (this.btnSoundToggle) {
      this.btnSoundToggle.addEventListener('click', () => {
        const isMuted = audio.toggleMute();
        this.btnSoundToggle.textContent = isMuted ? '🔇' : '🔊';
      });
    }
  }

  show() {
    if (this.container) this.container.classList.remove('hidden');
  }

  hide() {
    if (this.container) this.container.classList.add('hidden');
  }

  update(data) {
    if (this.livesVal) this.livesVal.textContent = data.lives;
    if (this.coinsVal) this.coinsVal.textContent = String(data.coins).padStart(2, '0');
    if (this.scoreVal) this.scoreVal.textContent = String(data.score).padStart(6, '0');
    if (this.timeVal) this.timeVal.textContent = String(data.time).padStart(3, '0');

    // Power-up bar
    if (this.powerUpBar && this.powerUpFill) {
      if (data.powerUp.active && data.powerUp.timer > 0) {
        this.powerUpBar.classList.remove('hidden');
        const pct = (data.powerUp.timer / data.powerUp.duration) * 100;
        this.powerUpFill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
      } else {
        this.powerUpBar.classList.add('hidden');
      }
    }
  }
}
