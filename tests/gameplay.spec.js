import { test, expect } from '@playwright/test';

test.describe('Super Jump World — Playwright Automated Suite', () => {
  let consoleErrors = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', err => {
      consoleErrors.push(err.toString());
    });
    await page.goto('/');
    await page.waitForTimeout(500);
  });

  test.afterEach(async () => {
    expect(consoleErrors).toEqual([]);
  });

  test('1. Main Menu, WebGL Canvas, Sound Toggle, and Controls Modal', async ({ page }) => {
    // Canvas exists
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Main Menu exists
    const mainMenu = page.locator('#screen-main-menu');
    await expect(mainMenu).toBeVisible();

    // Sound toggle
    const soundToggle = page.locator('#menu-sound-toggle');
    const soundStatus = page.locator('#sound-status-text');
    await soundToggle.click();
    await expect(soundStatus).toHaveText('OFF');
    await soundToggle.click();
    await expect(soundStatus).toHaveText('ON');

    // Controls modal
    const howToPlayBtn = page.locator('#btn-how-to-play');
    const controlsModal = page.locator('#modal-controls');
    await howToPlayBtn.click();
    await expect(controlsModal).toBeVisible();

    const gotItBtn = page.locator('#btn-close-controls');
    await gotItBtn.click();
    await expect(controlsModal).toBeHidden();
  });

  test('2. Start Game, HUD Display, and Player Instantiation', async ({ page }) => {
    await page.click('#btn-start-game');
    await page.waitForTimeout(400);

    const hud = page.locator('#hud');
    await expect(hud).toBeVisible();

    const isInitialized = await page.evaluate(() => {
      return !!(window.__GAME__?.level && window.__GAME__?.player);
    });
    expect(isInitialized).toBe(true);

    // Initial HUD values
    await expect(page.locator('#hud-lives-val')).toHaveText('3');
    await expect(page.locator('#hud-coins-val')).toHaveText('00');
    await expect(page.locator('#hud-score-val')).toHaveText('000000');
  });

  test('3. Player Horizontal Movement, Acceleration & Ground Friction', async ({ page }) => {
    await page.click('#btn-start-game');
    await page.waitForTimeout(300);

    const startX = await page.evaluate(() => window.__GAME__.player.pos.x);

    // Run right
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(700);
    await page.keyboard.up('KeyD');
    await page.waitForTimeout(350);

    const moved = await page.evaluate(() => ({
      x: window.__GAME__.player.pos.x,
      velX: window.__GAME__.player.vel.x,
      isGrounded: window.__GAME__.player.isGrounded
    }));

    expect(moved.x).toBeGreaterThan(startX + 1.5);
    expect(moved.isGrounded).toBe(true);
    expect(Math.abs(moved.velX)).toBeLessThan(0.1);
  });

  test('4. Variable Jump Height (Short tap vs Long hold)', async ({ page }) => {
    await page.click('#btn-start-game');
    await page.waitForTimeout(300);

    // Short jump
    await page.evaluate(() => window.__GAME__.player.reset({ x: 5.0, y: 2.67, z: 0 }));
    await page.waitForTimeout(50);
    await page.keyboard.down('Space');
    await page.waitForTimeout(40);
    await page.keyboard.up('Space');

    let peakShortY = 0;
    for (let i = 0; i < 15; i++) {
      const y = await page.evaluate(() => window.__GAME__.player.pos.y);
      if (y > peakShortY) peakShortY = y;
      await page.waitForTimeout(30);
    }
    await page.waitForTimeout(300);

    // Long hold jump
    await page.evaluate(() => window.__GAME__.player.reset({ x: 5.0, y: 2.67, z: 0 }));
    await page.waitForTimeout(50);

    let peakLongY = 0;
    await page.keyboard.down('Space');
    for (let i = 0; i < 15; i++) {
      const y = await page.evaluate(() => window.__GAME__.player.pos.y);
      if (y > peakLongY) peakLongY = y;
      await page.waitForTimeout(30);
    }
    await page.keyboard.up('Space');

    expect(peakShortY).toBeGreaterThan(4.5);
    expect(peakLongY).toBeGreaterThan(peakShortY + 0.3);
    expect(peakLongY).toBeLessThan(7.0);
  });

  test('5. Mystery Block Activation, Coin Reward, and Breakable Block Shatter', async ({ page }) => {
    await page.click('#btn-start-game');
    await page.waitForTimeout(300);

    // Test Mystery Block at x=14.0
    await page.evaluate(() => window.__GAME__.player.reset({ x: 14.0, y: 2.67, z: 0 }));
    await page.waitForTimeout(100);

    await page.keyboard.down('Space');
    await page.waitForTimeout(220);
    await page.keyboard.up('Space');
    await page.waitForTimeout(400);

    const blockStatus = await page.evaluate(() => ({
      isUsed: window.__GAME__.level.blocks[0].isUsed,
      coins: window.__GAME__.hud.coinsVal.textContent
    }));
    expect(blockStatus.isUsed).toBe(true);
    expect(blockStatus.coins).toBe('01');

    // Test Breakable Block at x=15.0
    await page.evaluate(() => window.__GAME__.player.reset({ x: 15.0, y: 2.67, z: 0 }));
    await page.waitForTimeout(100);

    await page.keyboard.down('Space');
    await page.waitForTimeout(220);
    await page.keyboard.up('Space');
    await page.waitForTimeout(400);

    const isBroken = await page.evaluate(() => window.__GAME__.level.blocks[1].isBroken);
    expect(isBroken).toBe(true);
  });

  test('5b. Player can jump and land on top of blocks', async ({ page }) => {
    await page.click('#btn-start-game');
    await page.waitForTimeout(300);

    // Drop player onto block at x=18.0 (y=5.2, top=5.7, resting y=6.375)
    await page.evaluate(() => {
      window.__GAME__.player.reset({ x: 18.0, y: 7.2, z: 0 });
      window.__GAME__.player.vel.set(0, -3.0, 0);
    });
    await page.waitForTimeout(350);

    const onBlock = await page.evaluate(() => {
      const p = window.__GAME__.player;
      return {
        y: p.pos.y,
        isGrounded: p.isGrounded
      };
    });

    expect(onBlock.isGrounded).toBe(true);
    expect(onBlock.y).toBeCloseTo(6.375, 1);
  });

  test('5c. Touching block upper corner or side does not teleport downward', async ({ page }) => {
    await page.click('#btn-start-game');
    await page.waitForTimeout(300);

    // Launch player diagonally into the upper left side of block at x=14.0, y=5.2
    await page.evaluate(() => {
      window.__GAME__.player.reset({ x: 13.0, y: 5.0, z: 0 });
      window.__GAME__.player.vel.set(4.0, 5.0, 0);
    });
    await page.waitForTimeout(100);

    const pos = await page.evaluate(() => ({
      x: window.__GAME__.player.pos.x,
      y: window.__GAME__.player.pos.y
    }));

    // Must maintain upward elevation without snapping down to underside (Y=4.025)
    expect(pos.y).toBeGreaterThanOrEqual(5.0);
    expect(pos.x).toBeLessThanOrEqual(13.25);
  });

  test('6. Enemy Patrol and Top Stomp Defeat with Rebound', async ({ page }) => {
    await page.click('#btn-start-game');
    await page.waitForTimeout(300);

    // Stomp onto walker enemy from above
    await page.evaluate(() => {
      const e = window.__GAME__.level.enemies[0];
      window.__GAME__.player.reset({ x: e.pos.x, y: e.pos.y + 1.6, z: 0 });
      window.__GAME__.player.vel.y = -6.0;
    });
    await page.waitForTimeout(350);

    const stompResult = await page.evaluate(() => {
      const e = window.__GAME__.level.enemies[0];
      const p = window.__GAME__.player;
      return {
        isDead: e.isDead,
        scaleY: e.mesh.scale.y,
        playerVelY: p.vel.y
      };
    });

    expect(stompResult.isDead).toBe(true);
    expect(stompResult.scaleY).toBeLessThan(0.3);
    expect(stompResult.playerVelY).toBeGreaterThan(0);
  });

  test('7. Enemy Side Collision Damage and Invulnerability', async ({ page }) => {
    await page.click('#btn-start-game');
    await page.waitForTimeout(400);

    await page.evaluate(() => {
      const walker = window.__GAME__.level.enemies.find(e => e.constructor.name === 'WalkerEnemy' && !e.isDead);
      window.__GAME__.player.reset({ x: walker.pos.x - 0.35, y: walker.pos.y, z: 0 });
    });

    for (let i = 0; i < 20; i++) {
      const isInvul = await page.evaluate(() => !!window.__GAME__?.player?.isInvulnerable);
      if (isInvul) break;
      await page.waitForTimeout(40);
    }

    const hurtResult = await page.evaluate(() => ({
      lives: window.__GAME__?.hud?.livesVal?.textContent,
      isInvulnerable: !!window.__GAME__?.player?.isInvulnerable
    }));

    expect(hurtResult.lives).toBe('2');
    expect(hurtResult.isInvulnerable).toBe(true);
  });

  test('8. Checkpoint Flag Activation and Abyss Pit Respawn', async ({ page }) => {
    await page.click('#btn-start-game');
    await page.waitForTimeout(300);

    // Touch Checkpoint at x=89.0
    await page.evaluate(() => {
      window.__GAME__.player.reset({ x: 89.0, y: 2.67, z: 0 });
    });
    await page.waitForTimeout(200);

    const isActivated = await page.evaluate(() => window.__GAME__.level.checkpoint.isActivated);
    expect(isActivated).toBe(true);

    // Drop into abyss pit
    await page.evaluate(() => {
      window.__GAME__.player.pos.set(78.0, -7.0, 0);
    });
    await page.waitForTimeout(250);

    const respawn = await page.evaluate(() => ({
      x: window.__GAME__.player.pos.x,
      lives: window.__GAME__.hud.livesVal.textContent
    }));

    expect(Math.abs(respawn.x - 89.0)).toBeLessThan(1.0);
    expect(respawn.lives).toBe('2');
  });

  test('9. Moving Platform Surface Tracking', async ({ page }) => {
    await page.click('#btn-start-game');
    await page.waitForTimeout(300);

    await page.evaluate(() => {
      const mp = window.__GAME__.level.movingPlatforms[0];
      window.__GAME__.player.reset({ x: mp.mesh.position.x, y: mp.mesh.position.y + 0.8, z: 0 });
    });
    await page.waitForTimeout(350);

    const platformTracking = await page.evaluate(() => {
      const p = window.__GAME__.player;
      return {
        isGrounded: p.isGrounded,
        hasPlatform: !!p.standingOnPlatform
      };
    });

    expect(platformTracking.isGrounded).toBe(true);
    expect(platformTracking.hasPlatform).toBe(true);
  });

  test('10. Star Dash Power-Up Collection, Aura, and HUD Meter', async ({ page }) => {
    await page.click('#btn-start-game');
    await page.waitForTimeout(300);

    // Hit star block at x=16.0
    await page.evaluate(() => {
      window.__GAME__.player.reset({ x: 16.0, y: 2.67, z: 0 });
      window.__GAME__.level.blocks[2].onHitFromBelow();
    });
    await page.waitForTimeout(300);

    // Collect power-up
    await page.evaluate(() => {
      if (window.__GAME__.level.powerUps.length > 0) {
        window.__GAME__.level.powerUps[0].collect();
      }
    });
    await page.waitForTimeout(150);

    const starDashState = await page.evaluate(() => ({
      auraVisible: window.__GAME__.player.starAura.visible,
      hudMeterVisible: !document.getElementById('hud-powerup-bar').classList.contains('hidden')
    }));

    expect(starDashState.auraVisible).toBe(true);
    expect(starDashState.hudMeterVisible).toBe(true);
  });

  test('11. Pause Menu & Resume Toggle', async ({ page }) => {
    await page.click('#btn-start-game');
    await page.waitForTimeout(300);

    const pauseMenu = page.locator('#screen-pause');
    await page.keyboard.press('KeyP');
    await expect(pauseMenu).toBeVisible();

    const resumeBtn = page.locator('#btn-resume');
    await resumeBtn.click();
    await expect(pauseMenu).toBeHidden();
  });

  test('12. Goal Arch Course Clear and Victory Screen', async ({ page }) => {
    await page.click('#btn-start-game');
    await page.waitForTimeout(300);

    await page.evaluate(() => {
      window.__GAME__.player.reset({ x: 152.0, y: 2.5, z: 0 });
      window.__GAME__.level.goal.reachGoal();
    });
    await page.waitForTimeout(400);

    const victoryScreen = page.locator('#screen-victory');
    await expect(victoryScreen).toBeVisible();

    const scoreVal = await page.locator('#victory-score-val').textContent();
    expect(Number(scoreVal)).toBeGreaterThan(0);
  });

  test('13. Mobile Touch Controls Viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.evaluate(() => {
      window.__GAME__.restartLevel();
    });
    await page.waitForTimeout(300);

    const touchControls = page.locator('#touch-controls');
    await expect(touchControls).toBeVisible();
  });

  test('14. Multi-Level Progression to World 1-2 Underground Cavern', async ({ page }) => {
    await page.click('#btn-start-game');
    await page.waitForTimeout(300);

    // Trigger goal arch in Level 1-1
    await page.evaluate(() => {
      window.__GAME__.player.reset({ x: 152.0, y: 2.5, z: 0 });
      window.__GAME__.level.goal.reachGoal();
    });
    await page.waitForTimeout(400);

    const nextBtn = page.locator('#btn-victory-next');
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();
    await page.waitForTimeout(400);

    const hudWorld = page.locator('#hud-world-val');
    await expect(hudWorld).toHaveText('1 - 2');

    const levelData = await page.evaluate(() => ({
      key: window.__GAME__.gameState.levelKey,
      biome: window.__GAME__.level.currentLevelData?.theme?.biome,
      enemies: window.__GAME__.level.enemies.length
    }));

    expect(levelData.key).toBe('1-2');
    expect(levelData.biome).toBe('cavern');
    expect(levelData.enemies).toBeGreaterThan(0);
  });
});
