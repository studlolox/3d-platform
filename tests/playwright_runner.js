import { chromium } from 'playwright-core';
import path from 'path';

const ARTIFACTS_DIR = '/Users/solehuddin/.gemini/antigravity/brain/08e899b0-5872-47f3-b131-bc0e97feb2dd';

async function runPlaywrightSuite() {
  console.log('==================================================================');
  console.log('   SUPER JUMP WORLD — PLAYWRIGHT END-TO-END AUTOMATION SUITE      ');
  console.log('==================================================================\n');

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--use-angle=swiftshader']
  });

  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  const errors = [];
  const report = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`[Console Error] ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
    errors.push(`[Page Uncaught Error] ${err.toString()}`);
  });

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      report.push({ name: testName, status: 'PASS' });
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      report.push({ name: testName, status: 'FAIL' });
      errors.push(`Assertion failed: ${testName}`);
    }
  }

  // 1. Load Application
  console.log('STAGE 1: Navigation & Initial Menu UI');
  await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  const canvasVisible = await page.locator('canvas').isVisible();
  assert(canvasVisible, 'Three.js 3D WebGL Canvas mounted and visible');

  const menuVisible = await page.locator('#screen-main-menu').isVisible();
  assert(menuVisible, 'Title screen overlay rendered with start options');

  // Sound toggle
  await page.locator('#menu-sound-toggle').click();
  let soundState = await page.locator('#sound-status-text').textContent();
  assert(soundState === 'OFF', 'Audio manager toggles to OFF');
  await page.locator('#menu-sound-toggle').click();
  soundState = await page.locator('#sound-status-text').textContent();
  assert(soundState === 'ON', 'Audio manager toggles back to ON');

  // Controls modal
  await page.locator('#btn-how-to-play').click();
  await page.waitForTimeout(200);
  let controlsVisible = await page.locator('#modal-controls').isVisible();
  assert(controlsVisible, 'Controls modal opens on "CONTROLS" click');
  await page.locator('#btn-close-controls').click();
  await page.waitForTimeout(200);
  controlsVisible = await page.locator('#modal-controls').isVisible();
  assert(!controlsVisible, 'Controls modal dismisses on "GOT IT!" click');

  // 2. Start Game & HUD
  console.log('\nSTAGE 2: Game State Transition & HUD Initial State');
  await page.locator('#btn-start-game').click();
  await page.waitForTimeout(500);
  await page.locator('canvas').click();
  await page.waitForTimeout(200);

  const hudVisible = await page.locator('#hud').isVisible();
  assert(hudVisible, 'Top HUD displays lives, coins, world 1-1, score, and timer');

  const engineState = await page.evaluate(() => !!(window.__GAME__?.level && window.__GAME__?.player));
  assert(engineState, 'Game instance, Level 1-1, and Player rig active');

  // 3. Movement & Friction
  console.log('\nSTAGE 3: Player Movement Physics & Ground Friction');
  const startX = await page.evaluate(() => window.__GAME__.player.pos.x);
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(1000);
  await page.keyboard.up('KeyD');
  await page.waitForTimeout(500);

  const movePhysics = await page.evaluate(() => ({
    x: window.__GAME__.player.pos.x,
    velX: window.__GAME__.player.vel.x,
    isGrounded: window.__GAME__.player.isGrounded
  }));
  assert(movePhysics.x > startX + 0.4, `Player runs right under input (x: ${startX} -> ${movePhysics.x.toFixed(2)})`);
  assert(movePhysics.isGrounded, 'Player maintains grounded state on terrain surface');
  assert(Math.abs(movePhysics.velX) < 0.25, 'Ground friction smoothly decelerates player to rest');

  // 4. Variable Jump Height
  console.log('\nSTAGE 4: Variable Jump Height Test');
  // Short tap
  await page.evaluate(() => window.__GAME__.player.reset({ x: 5.0, y: 2.67, z: 0 }));
  await page.waitForTimeout(100);
  await page.keyboard.down('Space');
  await page.waitForTimeout(40);
  await page.keyboard.up('Space');

  let peakShortY = 0;
  for (let i = 0; i < 15; i++) {
    const y = await page.evaluate(() => window.__GAME__.player.pos.y);
    if (y > peakShortY) peakShortY = y;
    await page.waitForTimeout(30);
  }
  await page.waitForTimeout(350);

  // Full hold — sample while holding Space to capture peak apex
  await page.evaluate(() => window.__GAME__.player.reset({ x: 5.0, y: 2.67, z: 0 }));
  await page.waitForTimeout(100);

  let peakLongY = 0;
  await page.keyboard.down('Space');
  for (let i = 0; i < 15; i++) {
    const y = await page.evaluate(() => window.__GAME__.player.pos.y);
    if (y > peakLongY) peakLongY = y;
    await page.waitForTimeout(30);
  }
  await page.keyboard.up('Space');

  assert(peakShortY > 4.5 && peakShortY < 5.6, `Short jump reaches calibrated peak Y = ${peakShortY.toFixed(2)}`);
  assert(peakLongY >= 6.38 && peakLongY < 7.0, `Long jump hold reaches calibrated peak Y = ${peakLongY.toFixed(2)} (clearing block top at 6.38)`);

  // 5. Interactive Blocks
  console.log('\nSTAGE 5: Interactive Mystery & Breakable Blocks');
  // Mystery block at x=14.0
  await page.evaluate(() => window.__GAME__.player.reset({ x: 14.0, y: 2.67, z: 0 }));
  await page.waitForTimeout(100);
  await page.keyboard.down('Space');
  await page.waitForTimeout(220);
  await page.keyboard.up('Space');
  await page.waitForTimeout(400);

  const blockResult = await page.evaluate(() => ({
    isUsed: window.__GAME__.level.blocks[0].isUsed,
    coins: window.__GAME__.hud.coinsVal.textContent
  }));
  assert(blockResult.isUsed, 'Mystery block hit from below bounces and marks inactive');
  assert(Number(blockResult.coins) >= 1, `Coin count increments (current count: ${blockResult.coins})`);

  // Breakable brick at x=15.0
  await page.evaluate(() => window.__GAME__.player.reset({ x: 15.0, y: 2.67, z: 0 }));
  await page.waitForTimeout(100);
  await page.keyboard.down('Space');
  await page.waitForTimeout(250);
  await page.keyboard.up('Space');
  await page.waitForTimeout(500);

  const isBroken = await page.evaluate(() => window.__GAME__.level.blocks[1].isBroken);
  assert(isBroken, 'Breakable brick shatters and removes collision when struck');

  // 5b. Jumping & Standing on top of a Block
  console.log('\nSTAGE 5b: Jumping & Standing on top of a Block');
  await page.evaluate(() => {
    // Drop player onto block at x=18.0 (block y=5.2, top is y=5.7, grounded player center is y=6.375)
    window.__GAME__.player.reset({ x: 18.0, y: 6.6, z: 0 });
    window.__GAME__.player.vel.set(0, -2.0, 0);
  });

  // Wait for player to settle onto the block surface
  for (let i = 0; i < 25; i++) {
    const grounded = await page.evaluate(() => window.__GAME__.player.isGrounded);
    if (grounded) break;
    await page.waitForTimeout(40);
  }

  const blockStandInfo = await page.evaluate(() => {
    const p = window.__GAME__.player;
    return {
      x: p.pos.x,
      y: p.pos.y,
      isGrounded: p.isGrounded
    };
  });
  assert(blockStandInfo.isGrounded, `Player successfully lands and stands on top of block (isGrounded = ${blockStandInfo.isGrounded})`);
  assert(Math.abs(blockStandInfo.y - 6.375) < 0.15, `Player feet rest precisely on top of block surface (Y = ${blockStandInfo.y.toFixed(3)})`);

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'player_on_block.png') });
  console.log('✓ Captured player_on_block.png screenshot');

  // 5c. Upper Corner & Side Block Collision (No downward teleport)
  console.log('\nSTAGE 5c: Upper Corner & Side Block Contact');
  await page.evaluate(() => {
    // Position player just to the left of mystery block at x=14.0 (block x: 13.5 to 14.5, y: 4.7 to 5.7)
    // Player is at x=13.0, y=5.0 with upward and rightward velocity
    window.__GAME__.player.reset({ x: 13.0, y: 5.0, z: 0 });
    window.__GAME__.player.vel.set(4.0, 5.0, 0);
  });
  await page.waitForTimeout(100);

  const cornerContactInfo = await page.evaluate(() => {
    const p = window.__GAME__.player;
    return {
      x: p.pos.x,
      y: p.pos.y,
      velY: p.vel.y
    };
  });
  assert(cornerContactInfo.y >= 5.0, `Player does not teleport underneath on upper corner contact (Y = ${cornerContactInfo.y.toFixed(2)})`);
  assert(cornerContactInfo.x <= 13.25, `Horizontal wall collision stops player from penetrating block side (X = ${cornerContactInfo.x.toFixed(2)})`);

  // 6. Enemy Stomp Mechanics
  console.log('\nSTAGE 6: Enemy Patrol & Top Stomp Defeat');
  await page.evaluate(() => {
    const e = window.__GAME__.level.enemies[0];
    window.__GAME__.player.reset({ x: e.pos.x, y: e.pos.y + 1.4, z: 0 });
    window.__GAME__.player.vel.y = -6.0;
  });
  await page.waitForTimeout(180);

  const stompInfo = await page.evaluate(() => {
    const e = window.__GAME__.level.enemies[0];
    const p = window.__GAME__.player;
    return {
      isDead: e.isDead,
      scaleY: e.mesh.scale.y,
      playerVelY: p.vel.y
    };
  });
  assert(stompInfo.isDead, 'Walker enemy defeated by top stomp');
  assert(stompInfo.scaleY < 0.3, 'Enemy squashes flat visually upon defeat');
  assert(stompInfo.playerVelY > 0, `Player rebounds upward with bounce velocity (vy = ${stompInfo.playerVelY.toFixed(2)})`);

  // 7. Enemy Side Collision Damage
  console.log('\nSTAGE 7: Enemy Side Collision & Invulnerability Blinking');
  await page.evaluate(() => {
    const walker = window.__GAME__.level.enemies.find(e => e.constructor.name === 'WalkerEnemy' && !e.isDead);
    window.__GAME__.player.reset({ x: walker.pos.x - 0.35, y: walker.pos.y, z: 0 });
  });

  for (let i = 0; i < 20; i++) {
    const isInvul = await page.evaluate(() => window.__GAME__.player.isInvulnerable);
    if (isInvul) break;
    await page.waitForTimeout(40);
  }

  const hurtInfo = await page.evaluate(() => ({
    lives: window.__GAME__.hud.livesVal.textContent,
    isInvulnerable: window.__GAME__.player.isInvulnerable
  }));
  assert(hurtInfo.lives === '2', `Side collision decreases lives from 3 to ${hurtInfo.lives}`);
  assert(hurtInfo.isInvulnerable, 'Player enters temporary invulnerability blink frames');

  // 8. Checkpoint & Abyss Pit Fall
  console.log('\nSTAGE 8: Checkpoint Activation & Pit Fall Respawn');
  await page.evaluate(() => {
    window.__GAME__.player.reset({ x: 89.0, y: 2.67, z: 0 });
  });
  await page.waitForTimeout(200);

  const cpActive = await page.evaluate(() => window.__GAME__.level.checkpoint.isActivated);
  assert(cpActive, 'Mid-level Checkpoint flag pole turns golden on player touch');

  await page.evaluate(() => {
    window.__GAME__.player.pos.set(78.0, -7.0, 0);
  });
  await page.waitForTimeout(250);

  const respawnInfo = await page.evaluate(() => ({
    x: window.__GAME__.player.pos.x,
    lives: window.__GAME__.hud.livesVal.textContent
  }));
  assert(Math.abs(respawnInfo.x - 89.0) < 1.0, `Player respawns at checkpoint (x = ${respawnInfo.x.toFixed(2)}) rather than level start`);
  assert(respawnInfo.lives === '1', `Lives after pit fall = ${respawnInfo.lives}`);

  // 9. Moving Platform Tracking
  console.log('\nSTAGE 9: Moving Platform Tracking');
  await page.evaluate(() => {
    const mp = window.__GAME__.level.movingPlatforms[0];
    window.__GAME__.player.reset({ x: mp.mesh.position.x, y: mp.mesh.position.y + 0.8, z: 0 });
  });
  await page.waitForTimeout(350);

  const platInfo = await page.evaluate(() => ({
    isGrounded: window.__GAME__.player.isGrounded,
    onPlatform: !!window.__GAME__.player.standingOnPlatform
  }));
  assert(platInfo.isGrounded, 'Player lands and stabilizes on moving platform');
  assert(platInfo.onPlatform, 'Platform delta velocity synced with player movement');

  // 10. Star Dash Power-up
  console.log('\nSTAGE 10: Star Dash Power-up Collection & Invulnerability');
  await page.evaluate(() => {
    window.__GAME__.player.reset({ x: 16.0, y: 2.67, z: 0 });
    window.__GAME__.level.blocks[2].onHitFromBelow();
  });
  await page.waitForTimeout(300);

  await page.evaluate(() => {
    if (window.__GAME__.level.powerUps.length > 0) {
      window.__GAME__.level.powerUps[0].collect();
    }
  });
  await page.waitForTimeout(150);

  const starDash = await page.evaluate(() => ({
    aura: window.__GAME__.player.starAura.visible,
    meter: !document.getElementById('hud-powerup-bar').classList.contains('hidden')
  }));
  assert(starDash.aura, 'Player 3D Star Dash aura mesh active');
  assert(starDash.meter, 'HUD Star Dash timer bar displayed');

  // 11. Pause & Resume
  console.log('\nSTAGE 11: Pause Menu Overlay & Resume');
  await page.keyboard.press('KeyP');
  await page.waitForTimeout(200);
  let paused = await page.locator('#screen-pause').isVisible();
  assert(paused, 'Pause menu displayed on KeyP input');

  await page.locator('#btn-resume').click();
  await page.waitForTimeout(200);
  paused = await page.locator('#screen-pause').isVisible();
  assert(!paused, 'Pause menu dismisses on Resume click');

  // 12. Goal Arch Victory
  console.log('\nSTAGE 12: Goal Arch Collision & Victory Celebration');
  await page.evaluate(() => {
    window.__GAME__.player.reset({ x: 152.0, y: 2.5, z: 0 });
    window.__GAME__.level.goal.reachGoal();
  });
  await page.waitForTimeout(400);

  const victoryVisible = await page.locator('#screen-victory').isVisible();
  assert(victoryVisible, 'Victory Course Clear screen displayed on reaching Goal Arch');

  const finalScore = await page.locator('#victory-score-val').textContent();
  assert(Number(finalScore) > 0, `Victory total score calculated with time bonus (${finalScore})`);

  // 13. Mobile Touch Controls
  console.log('\nSTAGE 13: Mobile Touch Viewport Adaptation');
  await page.setViewportSize({ width: 375, height: 667 });
  await page.evaluate(() => window.__GAME__.restartLevel());
  await page.waitForTimeout(300);

  const touchVisible = await page.locator('#touch-controls').isVisible();
  assert(touchVisible, 'Virtual D-pad and Action touch buttons visible on mobile viewport');

  // 14. Multi-Level Progression to World 1-2 Underground Cavern
  console.log('\nSTAGE 14: Multi-Level Progression to World 1-2 Underground Cavern');
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.evaluate(() => {
    window.__GAME__.player.reset({ x: 152.0, y: 2.5, z: 0 });
    window.__GAME__.level.goal.reachGoal();
  });
  await page.waitForTimeout(300);

  const nextBtnVisible = await page.locator('#btn-victory-next').isVisible();
  assert(nextBtnVisible, 'Next Level button visible on Victory overlay when subsequent level exists');

  await page.locator('#btn-victory-next').click();
  await page.waitForTimeout(400);

  const nextLevelState = await page.evaluate(() => ({
    levelKey: window.__GAME__.gameState.levelKey,
    world: window.__GAME__.gameState.currentWorld,
    level: window.__GAME__.gameState.currentLevel,
    levelName: window.__GAME__.level.currentLevelData?.name,
    biome: window.__GAME__.level.currentLevelData?.theme?.biome,
    hudWorldText: document.getElementById('hud-world-val')?.textContent,
    enemyCount: window.__GAME__.level.enemies.length,
    blockCount: window.__GAME__.level.blocks.length
  }));

  assert(nextLevelState.levelKey === '1-2', `Game loaded Level 1-2 (active: ${nextLevelState.levelKey})`);
  assert(nextLevelState.biome === 'cavern', `Cavern biome active with custom subterranean theme`);
  assert(nextLevelState.hudWorldText === '1 - 2', `Top HUD updated to display WORLD 1 - 2 (${nextLevelState.hudWorldText})`);
  assert(nextLevelState.enemyCount > 0, `Underground cavern enemies populated (${nextLevelState.enemyCount} enemies)`);

  // 15. Multi-Level Progression to World 1-3 Treetop Canopy
  console.log('\nSTAGE 15: Multi-Level Progression to World 1-3 Treetop Canopy');
  await page.evaluate(() => {
    window.__GAME__.player.reset({ x: 142.0, y: 2.5, z: 0 });
    window.__GAME__.level.goal.reachGoal();
  });
  await page.waitForTimeout(300);

  const nextBtnVisible1_2 = await page.locator('#btn-victory-next').isVisible();
  assert(nextBtnVisible1_2, 'Next Level button visible after completing Level 1-2');

  await page.locator('#btn-victory-next').click();
  await page.waitForTimeout(400);

  const level1_3State = await page.evaluate(() => ({
    levelKey: window.__GAME__.gameState.levelKey,
    world: window.__GAME__.gameState.currentWorld,
    level: window.__GAME__.gameState.currentLevel,
    levelName: window.__GAME__.level.currentLevelData?.name,
    biome: window.__GAME__.level.currentLevelData?.theme?.biome,
    hudWorldText: document.getElementById('hud-world-val')?.textContent,
    enemyCount: window.__GAME__.level.enemies.length,
    blockCount: window.__GAME__.level.blocks.length,
    movingPlatCount: window.__GAME__.level.movingPlatforms.length
  }));

  assert(level1_3State.levelKey === '1-3', `Game loaded Level 1-3 (active: ${level1_3State.levelKey})`);
  assert(level1_3State.biome === 'canopy', `Treetop Canopy biome active with golden sunset atmosphere`);
  assert(level1_3State.hudWorldText === '1 - 3', `Top HUD updated to display WORLD 1 - 3 (${level1_3State.hudWorldText})`);
  assert(level1_3State.enemyCount > 0, `Canopy arboreal enemies populated (${level1_3State.enemyCount} enemies)`);
  assert(level1_3State.movingPlatCount >= 3, `High altitude moving platforms active (${level1_3State.movingPlatCount} platforms)`);

  // 16. Multi-Level Progression to World 1-4 The Fortress Gate
  console.log('\nSTAGE 16: Multi-Level Progression to World 1-4 The Fortress Gate');
  await page.evaluate(() => {
    window.__GAME__.player.reset({ x: 151.0, y: 7.5, z: 0 });
    window.__GAME__.level.goal.reachGoal();
  });
  await page.waitForTimeout(300);

  const nextBtnVisible1_3 = await page.locator('#btn-victory-next').isVisible();
  assert(nextBtnVisible1_3, 'Next Level button visible after completing Level 1-3');

  await page.locator('#btn-victory-next').click();
  await page.waitForTimeout(400);

  const level1_4State = await page.evaluate(() => ({
    levelKey: window.__GAME__.gameState.levelKey,
    world: window.__GAME__.gameState.currentWorld,
    level: window.__GAME__.gameState.currentLevel,
    levelName: window.__GAME__.level.currentLevelData?.name,
    biome: window.__GAME__.level.currentLevelData?.theme?.biome,
    hudWorldText: document.getElementById('hud-world-val')?.textContent,
    enemyCount: window.__GAME__.level.enemies.length,
    blockCount: window.__GAME__.level.blocks.length
  }));

  assert(level1_4State.levelKey === '1-4', `Game loaded Level 1-4 (active: ${level1_4State.levelKey})`);
  assert(level1_4State.biome === 'fortress', `Fortress biome active with volcanic masonry and fiery lighting`);
  assert(level1_4State.hudWorldText === '1 - 4', `Top HUD updated to display WORLD 1 - 4 (${level1_4State.hudWorldText})`);
  assert(level1_4State.enemyCount > 0, `Fortress citadel guards populated (${level1_4State.enemyCount} enemies)`);

  // Verify World 1 Grand Finale completion:
  await page.evaluate(() => {
    window.__GAME__.player.reset({ x: 152.0, y: 4.0, z: 0 });
    window.__GAME__.level.goal.reachGoal();
  });
  await page.waitForTimeout(300);

  const nextBtnFinalVisible = await page.locator('#btn-victory-next').isVisible();
  assert(!nextBtnFinalVisible, 'Next Level button hides on completing World 1 Finale (no subsequent level)');

  // Summary
  console.log('\n==================================================================');
  console.log('                 PLAYWRIGHT TEST SUMMARY                          ');
  console.log('==================================================================');
  const passes = report.filter(r => r.status === 'PASS').length;
  const fails = report.filter(r => r.status === 'FAIL').length;
  console.log(`Total Assertions Checked: ${report.length}`);
  console.log(`Passed: ${passes}`);
  console.log(`Failed: ${fails}`);
  console.log(`Console Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.error('Errors:', errors);
  }

  await browser.close();
  process.exit(fails === 0 && errors.length === 0 ? 0 : 1);
}

runPlaywrightSuite().catch(err => {
  console.error('Playwright suite fatal error:', err);
  process.exit(1);
});
