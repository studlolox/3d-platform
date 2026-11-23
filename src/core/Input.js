/**
 * Input.js
 * Handles keyboard & mobile touch input with jump buffering and held duration tracking.
 */

export class InputManager {
  constructor() {
    this.keys = {
      left: false,
      right: false,
      jump: false,
      sprint: false,
      pause: false,
      restart: false
    };

    // Edge triggers (just pressed this frame)
    this.justPressed = {
      jump: false,
      pause: false,
      restart: false
    };

    // Jump mechanics
    this.jumpBufferTime = 0.14; // 140ms buffer window
    this.jumpBufferTimer = 0;
    this.jumpHeldDuration = 0;
    this.jumpPressed = false;

    // Mobile touch tracking
    this.touchState = {
      left: false,
      right: false,
      jump: false,
      sprint: false
    };

    this.initKeyboard();
    this.initTouch();
  }

  initKeyboard() {
    window.addEventListener('keydown', (e) => {
      // Prevent browser scroll for game controls
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code) || [' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }

      const code = e.code;
      const key = e.key ? e.key.toLowerCase() : '';

      if (code === 'KeyA' || code === 'ArrowLeft' || key === 'a' || key === 'arrowleft') {
        this.keys.left = true;
      } else if (code === 'KeyD' || code === 'ArrowRight' || key === 'd' || key === 'arrowright') {
        this.keys.right = true;
      } else if (code === 'Space' || code === 'KeyW' || code === 'ArrowUp' || key === ' ' || key === 'w' || key === 'arrowup') {
        if (!this.keys.jump) {
          this.justPressed.jump = true;
          this.jumpBufferTimer = this.jumpBufferTime;
          this.jumpHeldDuration = 0;
        }
        this.keys.jump = true;
      } else if (code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyJ' || code === 'KeyX' || key === 'shift' || key === 'j' || key === 'x') {
        this.keys.sprint = true;
      } else if (code === 'Escape' || code === 'KeyP' || key === 'escape' || key === 'p') {
        this.justPressed.pause = true;
        this.keys.pause = true;
      } else if (code === 'KeyR' || key === 'r') {
        this.justPressed.restart = true;
        this.keys.restart = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      const code = e.code;
      const key = e.key ? e.key.toLowerCase() : '';

      if (code === 'KeyA' || code === 'ArrowLeft' || key === 'a' || key === 'arrowleft') {
        this.keys.left = false;
      } else if (code === 'KeyD' || code === 'ArrowRight' || key === 'd' || key === 'arrowright') {
        this.keys.right = false;
      } else if (code === 'Space' || code === 'KeyW' || code === 'ArrowUp' || key === ' ' || key === 'w' || key === 'arrowup') {
        this.keys.jump = false;
        this.jumpHeldDuration = 0;
      } else if (code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyJ' || code === 'KeyX' || key === 'shift' || key === 'j' || key === 'x') {
        this.keys.sprint = false;
      } else if (code === 'Escape' || code === 'KeyP' || key === 'escape' || key === 'p') {
        this.keys.pause = false;
      } else if (code === 'KeyR' || key === 'r') {
        this.keys.restart = false;
      }
    });
  }

  initTouch() {
    const setupTouchBtn = (id, action) => {
      const el = document.getElementById(id);
      if (!el) return;

      const start = (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.classList.add('active');
        this.touchState[action] = true;
        if (action === 'jump') {
          this.justPressed.jump = true;
          this.jumpBufferTimer = this.jumpBufferTime;
          this.jumpHeldDuration = 0;
        }
      };

      const end = (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.classList.remove('active');
        this.touchState[action] = false;
        if (action === 'jump') {
          this.jumpHeldDuration = 0;
        }
      };

      el.addEventListener('touchstart', start, { passive: false });
      el.addEventListener('touchend', end, { passive: false });
      el.addEventListener('touchcancel', end, { passive: false });
      el.addEventListener('mousedown', start);
      el.addEventListener('mouseup', end);
      el.addEventListener('mouseleave', end);
    };

    // Setup virtual buttons when DOM is loaded
    if (document.readyState === 'loading') {
      window.addEventListener('DOMContentLoaded', () => {
        setupTouchBtn('touch-left', 'left');
        setupTouchBtn('touch-right', 'right');
        setupTouchBtn('touch-jump', 'jump');
        setupTouchBtn('touch-sprint', 'sprint');
      });
    } else {
      setupTouchBtn('touch-left', 'left');
      setupTouchBtn('touch-right', 'right');
      setupTouchBtn('touch-jump', 'jump');
      setupTouchBtn('touch-sprint', 'sprint');
    }

    // Auto-detect touch device
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      const touchContainer = document.getElementById('touch-controls');
      if (touchContainer) touchContainer.classList.remove('hidden');
    }
  }

  update(dt) {
    // Jump buffering decay
    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer -= dt;
      if (this.jumpBufferTimer < 0) this.jumpBufferTimer = 0;
    }

    // Jump held timer
    if (this.isJumpHeld()) {
      this.jumpHeldDuration += dt;
    } else {
      this.jumpHeldDuration = 0;
    }
  }

  postUpdate() {
    // Clear single-frame triggers
    this.justPressed.jump = false;
    this.justPressed.pause = false;
    this.justPressed.restart = false;
  }

  isLeft() {
    return this.keys.left || this.touchState.left;
  }

  isRight() {
    return this.keys.right || this.touchState.right;
  }

  isJumpHeld() {
    return this.keys.jump || this.touchState.jump;
  }

  hasBufferedJump() {
    return this.jumpBufferTimer > 0;
  }

  consumeBufferedJump() {
    this.jumpBufferTimer = 0;
  }

  isSprint() {
    return this.keys.sprint || this.touchState.sprint;
  }

  wasPauseJustPressed() {
    return this.justPressed.pause;
  }

  wasRestartJustPressed() {
    return this.justPressed.restart;
  }
}

export const input = new InputManager();
