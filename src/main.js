/**
 * main.js
 * Entry point for Super Jump World.
 */

import { Game } from './core/Game.js';
import { audio } from './core/Audio.js';

function initGame() {
  // Initialize game engine
  const game = new Game();

  // Pre-initialize Web Audio on user first touch/click anywhere on page
  const unlockAudio = () => {
    audio.ensureContext();
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };

  window.addEventListener('click', unlockAudio);
  window.addEventListener('keydown', unlockAudio);
  window.addEventListener('touchstart', unlockAudio);

  // Expose game instance for debugging/testing
  window.__GAME__ = game;
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
