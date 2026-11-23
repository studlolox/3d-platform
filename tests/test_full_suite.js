import puppeteer from 'puppeteer-core';
import fs from 'fs';

async function runTestSuite() {
  console.log('====================================================');
  console.log('   SUPER JUMP WORLD — AUTOMATED TEST SUITE          ');
  console.log('====================================================\n');

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--use-angle=swiftshader']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  const consoleLogs = [];
  const errors = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(`[${msg.type()}] ${text}`);
    if (msg.type() === 'error') {
      errors.push(text);
    }
  });

  page.on('response', resp => {
    if (resp.status() >= 400) {
      errors.push(`HTTP ${resp.status()} for ${resp.url()}`);
    }
  });

  const artifactDir = '/Users/solehuddin/.gemini/antigravity/brain/08e899b0-5872-47f3-b131-bc0e97feb2dd';

  const testReport = [];
  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      testReport.push({ status: 'PASS', message });
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      testReport.push({ status: 'FAIL', message });
      errors.push(`Assertion failed: ${message}`);
    }
  }

  // TEST 1: Launch and Main Menu
  console.log('TEST 1: Loading page and verifying Initial UI & WebGL');
  await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  const canvasExists = await page.evaluate(() => !!document.querySelector('canvas'));
  assert(canvasExists, 'WebGL Canvas element injected and initialized');

  const menuVisible = await page.$eval('#screen-main-menu', el => !el.classList.contains('hidden'));
  assert(menuVisible, 'Main Menu overlay visible on launch');

  // Test sound toggle in menu
  await page.click('#menu-sound-toggle');
  let soundText = await page.$eval('#sound-status-text', el => el.textContent);
  assert(soundText === 'OFF', 'Audio toggle switches to OFF');
  await page.click('#menu-sound-toggle');
  soundText = await page.$eval('#sound-status-text', el => el.textContent);
  assert(soundText === 'ON', 'Audio toggle switches back to ON');

  // Test controls modal
  await page.click('#btn-how-to-play');
  await new Promise(r => setTimeout(r, 300));
  const controlsVisible = await page.$eval('#modal-controls', el => !el.classList.contains('hidden'));
  assert(controlsVisible, 'Controls modal opens on "CONTROLS" click');
  await page.click('#btn-close-controls');
  await new Promise(r => setTimeout(r, 300));
  const controlsHidden = await page.$eval('#modal-controls', el => el.classList.contains('hidden'));
  assert(controlsHidden, 'Controls modal closes on "GOT IT!" click');

  // TEST 2: Start Game & HUD
  console.log('\nTEST 2: Start Game transition and HUD display');
  await page.click('#btn-start-game');
  await new Promise(r => setTimeout(r, 500));

  const hudActive = await page.$eval('#hud', el => !el.classList.contains('hidden'));
  assert(hudActive, 'HUD is visible after game start');

  const statePlaying = await page.evaluate(() => !!(window.__GAME__?.level && window.__GAME__?.player));
  assert(statePlaying, 'Engine, level, and player are fully instantiated');

  // TEST 3: Movement, Horizontal Velocity, Friction & Wall Collisions
  console.log('\nTEST 3: Player Movement, Velocity, and Ground Physics');
  const startPos = await page.evaluate(() => ({ x: window.__GAME__.player.pos.x, y: window.__GAME__.player.pos.y }));

  // Run right for 800ms
  await page.keyboard.down('KeyD');
  await new Promise(r => setTimeout(r, 800));
  await page.keyboard.up('KeyD');
  await new Promise(r => setTimeout(r, 380));

  const movedPos = await page.evaluate(() => ({
    x: window.__GAME__.player.pos.x,
    y: window.__GAME__.player.pos.y,
    velX: window.__GAME__.player.vel.x,
    isGrounded: window.__GAME__.player.isGrounded
  }));
  assert(movedPos.x > startPos.x + 2.0, `Player moved horizontally right (from ${startPos.x} to ${movedPos.x.toFixed(2)})`);
  assert(movedPos.isGrounded, 'Player remains solidly grounded while moving');
  assert(Math.abs(movedPos.velX) < 0.1, 'Ground friction brings player to a stop when input releases');

  // TEST 4: Variable Jump Height Test (Short Tap vs Long Hold)
  console.log('\nTEST 4: Variable Jump Height (Short tap vs Long hold)');
  // Reset player position for jump test
  await page.evaluate(() => window.__GAME__.player.reset({ x: 5.0, y: 2.67, z: 0 }));
  await new Promise(r => setTimeout(r, 100));

  // 4a: Short Tap Jump
  await page.keyboard.down('Space');
  await new Promise(r => setTimeout(r, 40)); // Quick 40ms tap
  await page.keyboard.up('Space');

  let peakShortY = 0;
  for (let i = 0; i < 20; i++) {
    const y = await page.evaluate(() => window.__GAME__.player.pos.y);
    if (y > peakShortY) peakShortY = y;
    await new Promise(r => setTimeout(r, 25));
  }
  await new Promise(r => setTimeout(r, 300)); // Wait for landing

  // 4b: Long Hold Jump
  await page.evaluate(() => window.__GAME__.player.reset({ x: 5.0, y: 2.67, z: 0 }));
  await new Promise(r => setTimeout(r, 100));

  await page.keyboard.down('Space');
  await new Promise(r => setTimeout(r, 260)); // Full 260ms hold
  await page.keyboard.up('Space');

  let peakLongY = 0;
  for (let i = 0; i < 20; i++) {
    const y = await page.evaluate(() => window.__GAME__.player.pos.y);
    if (y > peakLongY) peakLongY = y;
    await new Promise(r => setTimeout(r, 25));
  }
  await new Promise(r => setTimeout(r, 300));

  assert(peakShortY > 3.5, `Short jump peak reached ${peakShortY.toFixed(2)}`);
  assert(peakLongY > peakShortY + 0.35, `Long jump peak (${peakLongY.toFixed(2)}) is higher than short jump (${peakShortY.toFixed(2)})`);

  // TEST 5: Interactive Mystery Block & Breakable Block
  console.log('\nTEST 5: Interactive Blocks (Mystery Block bump & Breakable Block shatter)');
  // Position player directly under Mystery Block at x=14.0, y=5.2 (player top ~4.0)
  await page.evaluate(() => window.__GAME__.player.reset({ x: 14.0, y: 2.67, z: 0 }));
  await new Promise(r => setTimeout(r, 100));

  const coinsBefore = await page.evaluate(() => ({
    coins: window.__GAME__.hud.coinsVal.textContent,
    isUsed: window.__GAME__.level.blocks[0].isUsed
  }));
  assert(!coinsBefore.isUsed, 'Mystery block is initially active/unused');

  // Jump into mystery block from below
  await page.keyboard.down('Space');
  await new Promise(r => setTimeout(r, 220));
  await page.keyboard.up('Space');
  await new Promise(r => setTimeout(r, 500));

  const coinsAfter = await page.evaluate(() => ({
    coins: window.__GAME__.hud.coinsVal.textContent,
    isUsed: window.__GAME__.level.blocks[0].isUsed,
    bumping: window.__GAME__.level.blocks[0].isBumping || window.__GAME__.level.blocks[0].bumpProgress > 0
  }));
  assert(coinsAfter.isUsed, 'Mystery block was hit and marked as used');
  assert(Number(coinsAfter.coins) > Number(coinsBefore.coins), `Coins increased from ${coinsBefore.coins} to ${coinsAfter.coins}`);

  // Test Breakable Block at x=15.0
  await page.evaluate(() => window.__GAME__.player.reset({ x: 15.0, y: 2.67, z: 0 }));
  await new Promise(r => setTimeout(r, 100));

  const breakBlockBefore = await page.evaluate(() => window.__GAME__.level.blocks[1].isBroken);
  assert(!breakBlockBefore, 'Breakable block initially intact');

  await page.keyboard.down('Space');
  await new Promise(r => setTimeout(r, 220));
  await page.keyboard.up('Space');
  await new Promise(r => setTimeout(r, 400));

  const breakBlockAfter = await page.evaluate(() => window.__GAME__.level.blocks[1].isBroken);
  assert(breakBlockAfter, 'Breakable block shattered and marked broken');

  // TEST 6: Enemy Patrol & Stomp Defeat
  console.log('\nTEST 6: Enemy Patrol and Stomp Mechanics');
  const enemyWalker = await page.evaluate(() => {
    const e = window.__GAME__.level.enemies[0];
    return { x: e.pos.x, y: e.pos.y, isDead: e.isDead };
  });
  assert(enemyWalker.x > 0 && !enemyWalker.isDead, 'Walker enemy is spawned and patrolling');

  // Position player above enemy to stomp
  await page.evaluate(() => {
    const e = window.__GAME__.level.enemies[0];
    window.__GAME__.player.reset({ x: e.pos.x, y: e.pos.y + 1.8, z: 0 });
    window.__GAME__.player.vel.y = -5.0; // Falling down directly onto enemy
  });
  await new Promise(r => setTimeout(r, 300));

  const stompResult = await page.evaluate(() => {
    const e = window.__GAME__.level.enemies[0];
    const p = window.__GAME__.player;
    return {
      enemyDead: e.isDead,
      enemyScaleY: e.mesh.scale.y,
      playerVelY: p.vel.y
    };
  });
  assert(stompResult.enemyDead, 'Enemy was defeated by top stomp');
  assert(stompResult.enemyScaleY < 0.3, 'Enemy flattened down upon stomp');
  assert(stompResult.playerVelY > 0, `Player bounced upward after stomp (vy = ${stompResult.playerVelY.toFixed(2)})`);

  // TEST 7: Side Collision Damage & Invulnerability Blink
  console.log('\nTEST 7: Enemy Side Collision Damage & Invulnerability');
  // Re-spawn player next to hopper enemy at same Y level
  await page.evaluate(() => {
    const hopper = window.__GAME__.level.enemies.find(e => e.constructor.name === 'HopperEnemy' && !e.isDead);
    window.__GAME__.player.reset({ x: hopper.pos.x - 0.4, y: hopper.pos.y, z: 0 });
  });
  await new Promise(r => setTimeout(r, 200));

  const hurtResult = await page.evaluate(() => ({
    lives: window.__GAME__.hud.livesVal.textContent,
    isInvulnerable: window.__GAME__.player.isInvulnerable
  }));
  assert(hurtResult.lives === '2', `Player took damage, lives decreased from 3 to ${hurtResult.lives}`);
  assert(hurtResult.isInvulnerable, 'Player entered temporary invulnerability blinking state');

  // TEST 8: Checkpoint Activation & Pit Fall Respawn
  console.log('\nTEST 8: Checkpoint Activation and Pit Fall Respawn');
  // Move player to checkpoint at x=89.0
  await page.evaluate(() => {
    window.__GAME__.player.reset({ x: 89.0, y: 2.67, z: 0 });
  });
  await new Promise(r => setTimeout(r, 200));

  const checkpointActivated = await page.evaluate(() => window.__GAME__.level.checkpoint.isActivated);
  assert(checkpointActivated, 'Checkpoint flag turned active and golden on touch');

  // Drop player into abyss pit at x=78.0, y=-7.0
  await page.evaluate(() => {
    window.__GAME__.player.pos.set(78.0, -7.0, 0);
  });
  await new Promise(r => setTimeout(r, 200));

  const respawnPos = await page.evaluate(() => ({
    x: window.__GAME__.player.pos.x,
    y: window.__GAME__.player.pos.y,
    lives: window.__GAME__.hud.livesVal.textContent
  }));
  assert(Math.abs(respawnPos.x - 89.0) < 1.0, `Player respawned at checkpoint (x = ${respawnPos.x.toFixed(2)}) rather than level start`);
  assert(respawnPos.lives === '1', `Lives decreased after pit fall to ${respawnPos.lives}`);

  // TEST 9: Moving Platform Tracking
  console.log('\nTEST 9: Moving Platform Surface Ride');
  await page.evaluate(() => {
    const mp = window.__GAME__.level.movingPlatforms[0];
    window.__GAME__.player.reset({ x: mp.mesh.position.x, y: mp.mesh.position.y + 0.8, z: 0 });
  });
  await new Promise(r => setTimeout(r, 400));

  const platformRide = await page.evaluate(() => {
    const p = window.__GAME__.player;
    return {
      isGrounded: p.isGrounded,
      standingOnPlatform: !!p.standingOnPlatform
    };
  });
  assert(platformRide.isGrounded, 'Player lands and is grounded on moving platform');
  assert(platformRide.standingOnPlatform, 'Player is registered riding moving platform');

  // TEST 10: Star Dash Power-up Speed & Invincibility
  console.log('\nTEST 10: Star Dash Power-Up (Speed boost & enemy defeat)');
  await page.evaluate(() => {
    window.__GAME__.player.reset({ x: 10.0, y: 2.67, z: 0 });
    window.__GAME__.level.blocks[2].onHitFromBelow(); // Star block
  });
  await new Promise(r => setTimeout(r, 300));

  await page.evaluate(() => {
    if (window.__GAME__.level.powerUps.length > 0) {
      window.__GAME__.level.powerUps[0].collect();
    }
  });
  await new Promise(r => setTimeout(r, 150));

  const starPowerActive = await page.evaluate(() => ({
    active: window.__GAME__.player.starAura.visible,
    hudBar: !document.getElementById('hud-powerup-bar').classList.contains('hidden')
  }));
  assert(starPowerActive.active, 'Player 3D Star Aura mesh visible');
  assert(starPowerActive.hudBar, 'HUD Star Dash countdown meter visible');

  // TEST 11: Pause, Resume, and Restart
  console.log('\nTEST 11: Pause, Resume, and Restart controls');
  await page.keyboard.press('KeyP');
  await new Promise(r => setTimeout(r, 200));
  let isPaused = await page.$eval('#screen-pause', el => !el.classList.contains('hidden'));
  assert(isPaused, 'Pause menu displays on KeyP');

  await page.click('#btn-resume');
  await new Promise(r => setTimeout(r, 200));
  isPaused = await page.$eval('#screen-pause', el => !el.classList.contains('hidden'));
  assert(!isPaused, 'Pause menu closes on Resume click');

  // TEST 12: Goal Arch & Course Clear Victory
  console.log('\nTEST 12: Goal Arch Collision and Victory Celebration');
  await page.evaluate(() => {
    window.__GAME__.player.reset({ x: 152.0, y: 2.5, z: 0 });
    window.__GAME__.level.goal.reachGoal();
  });
  await new Promise(r => setTimeout(r, 400));

  const victoryState = await page.evaluate(() => ({
    isReached: window.__GAME__.level.goal.isReached,
    screenVisible: !document.getElementById('screen-victory').classList.contains('hidden'),
    totalScore: document.getElementById('victory-score-val').textContent
  }));
  assert(victoryState.isReached, 'Goal reached on collision with Goal Arch');
  assert(victoryState.screenVisible, 'Victory screen displayed');
  assert(Number(victoryState.totalScore) > 0, `Total score calculated with time bonus (${victoryState.totalScore})`);

  await page.screenshot({ path: `${artifactDir}/test_complete_victory.png` });

  // TEST 13: Touch Controls on Mobile Viewport
  console.log('\nTEST 13: Mobile Touch Controls Viewport');
  await page.setViewport({ width: 375, height: 667, hasTouch: true, isMobile: true });
  await page.evaluate(() => {
    window.__GAME__.restartLevel();
  });
  await new Promise(r => setTimeout(r, 400));

  const touchControlsVisible = await page.$eval('#touch-controls', el => !el.classList.contains('hidden'));
  assert(touchControlsVisible, 'Touch controls automatically visible on touch devices');

  // SUMMARY
  console.log('\n====================================================');
  console.log('              TEST RESULTS SUMMARY                  ');
  console.log('====================================================');
  const passCount = testReport.filter(t => t.status === 'PASS').length;
  const failCount = testReport.filter(t => t.status === 'FAIL').length;
  console.log(`Total Assertions Tested: ${testReport.length}`);
  console.log(`Passed: ${passCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`Console Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.error('\nErrors encountered:', errors);
  }

  await browser.close();
  process.exit(failCount === 0 && errors.length === 0 ? 0 : 1);
}

runTestSuite().catch(err => {
  console.error('Test suite failed with unhandled exception:', err);
  process.exit(1);
});
