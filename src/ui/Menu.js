/**
 * Menu.js
 * Manages Title screen, Controls modal, Pause overlay, Victory and Game Over screens.
 */

import { gameState, STATES } from '../systems/GameState.js';
import { audio } from '../core/Audio.js';

export class MenuManager {
  constructor(game) {
    this.game = game;

    // Screens
    this.mainMenu = document.getElementById('screen-main-menu');
    this.modalControls = document.getElementById('modal-controls');
    this.pauseMenu = document.getElementById('screen-pause');
    this.victoryMenu = document.getElementById('screen-victory');
    this.gameOverMenu = document.getElementById('screen-game-over');

    // Main Menu Buttons
    this.btnStartGame = document.getElementById('btn-start-game');
    this.btnHowToPlay = document.getElementById('btn-how-to-play');
    this.btnCloseControls = document.getElementById('btn-close-controls');
    this.menuSoundToggle = document.getElementById('menu-sound-toggle');
    this.soundStatusText = document.getElementById('sound-status-text');

    // Pause Buttons
    this.btnResume = document.getElementById('btn-resume');
    this.btnRestartPaused = document.getElementById('btn-restart-paused');
    this.btnMainMenuPaused = document.getElementById('btn-main-menu-paused');

    // Victory Buttons & Stats
    this.victoryTimeVal = document.getElementById('victory-time-val');
    this.victoryCoinsVal = document.getElementById('victory-coins-val');
    this.victoryScoreVal = document.getElementById('victory-score-val');
    this.btnVictoryReplay = document.getElementById('btn-victory-replay');
    this.btnVictoryMenu = document.getElementById('btn-victory-menu');

    // Game Over Buttons & Stats
    this.gameOverScoreVal = document.getElementById('gameover-score-val');
    this.btnGameOverRestart = document.getElementById('btn-gameover-restart');
    this.btnGameOverMenu = document.getElementById('btn-gameover-menu');

    this.initEvents();
    gameState.subscribe((data) => this.onStateChange(data));
  }

  initEvents() {
    // 1. Main Menu
    if (this.btnStartGame) {
      this.btnStartGame.addEventListener('click', () => {
        audio.playUIClick();
        audio.startBGM();
        this.game.startGame();
      });
    }

    if (this.btnHowToPlay) {
      this.btnHowToPlay.addEventListener('click', () => {
        audio.playUIClick();
        this.modalControls.classList.remove('hidden');
      });
    }

    if (this.btnCloseControls) {
      this.btnCloseControls.addEventListener('click', () => {
        audio.playUIClick();
        this.modalControls.classList.add('hidden');
      });
    }

    if (this.menuSoundToggle) {
      this.menuSoundToggle.addEventListener('click', () => {
        const isMuted = audio.toggleMute();
        if (this.soundStatusText) {
          this.soundStatusText.textContent = isMuted ? 'OFF' : 'ON';
        }
      });
    }

    // 2. Pause Menu
    if (this.btnResume) {
      this.btnResume.addEventListener('click', () => {
        audio.playUIClick();
        this.game.togglePause();
      });
    }

    if (this.btnRestartPaused) {
      this.btnRestartPaused.addEventListener('click', () => {
        audio.playUIClick();
        this.game.restartLevel();
      });
    }

    if (this.btnMainMenuPaused) {
      this.btnMainMenuPaused.addEventListener('click', () => {
        audio.playUIClick();
        this.game.returnToMenu();
      });
    }

    // 3. Victory Screen
    if (this.btnVictoryReplay) {
      this.btnVictoryReplay.addEventListener('click', () => {
        audio.playUIClick();
        this.game.restartLevel();
      });
    }

    if (this.btnVictoryMenu) {
      this.btnVictoryMenu.addEventListener('click', () => {
        audio.playUIClick();
        this.game.returnToMenu();
      });
    }

    // 4. Game Over Screen
    if (this.btnGameOverRestart) {
      this.btnGameOverRestart.addEventListener('click', () => {
        audio.playUIClick();
        this.game.restartLevel();
      });
    }

    if (this.btnGameOverMenu) {
      this.btnGameOverMenu.addEventListener('click', () => {
        audio.playUIClick();
        this.game.returnToMenu();
      });
    }
  }

  hideAllScreens() {
    this.mainMenu.classList.add('hidden');
    this.modalControls.classList.add('hidden');
    this.pauseMenu.classList.add('hidden');
    this.victoryMenu.classList.add('hidden');
    this.gameOverMenu.classList.add('hidden');
  }

  onStateChange(data) {
    if (data.state === STATES.MENU) {
      this.hideAllScreens();
      this.mainMenu.classList.remove('hidden');
    } else if (data.state === STATES.PLAYING) {
      this.hideAllScreens();
    } else if (data.state === STATES.PAUSED) {
      this.pauseMenu.classList.remove('hidden');
    } else if (data.state === STATES.VICTORY) {
      this.hideAllScreens();
      const timeBonus = data.time * 50;
      const totalScore = data.score + timeBonus;

      if (this.victoryTimeVal) this.victoryTimeVal.textContent = `+${timeBonus}`;
      if (this.victoryCoinsVal) this.victoryCoinsVal.textContent = data.coins;
      if (this.victoryScoreVal) this.victoryScoreVal.textContent = String(totalScore).padStart(6, '0');

      this.victoryMenu.classList.remove('hidden');
    } else if (data.state === STATES.GAME_OVER) {
      this.hideAllScreens();
      audio.playGameOver();
      if (this.gameOverScoreVal) {
        this.gameOverScoreVal.textContent = String(data.score).padStart(6, '0');
      }
      this.gameOverMenu.classList.remove('hidden');
    }
  }
}
