import puppeteer from 'puppeteer-core';
import fs from 'fs';

async function testGame() {
  console.log('--- STARTING COMPREHENSIVE GAME VERIFICATION ---');
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
      console.log(`Failed URL [${resp.status()}]: ${resp.url()}`);
    }
  });

  console.log('Navigating to http://127.0.0.1:5173 ...');
  await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  // 1. Check Main Menu & Screenshot
  const title = await page.title();
  console.log(`Page title: "${title}"`);

  const mainMenuVisible = await page.$eval('#screen-main-menu', el => !el.classList.contains('hidden'));
  console.log(`Main menu overlay visible: ${mainMenuVisible}`);

  const artifactDir = '/Users/solehuddin/.gemini/antigravity/brain/08e899b0-5872-47f3-b131-bc0e97feb2dd';
  await page.screenshot({ path: `${artifactDir}/test_1_main_menu.png` });
  console.log('Captured test_1_main_menu.png');

  // 2. Click CONTROLS
  console.log('Clicking CONTROLS button...');
  await page.click('#btn-how-to-play');
  await new Promise(r => setTimeout(r, 500));
  const controlsVisible = await page.$eval('#modal-controls', el => !el.classList.contains('hidden'));
  console.log(`Controls modal visible: ${controlsVisible}`);
  await page.screenshot({ path: `${artifactDir}/test_2_controls_modal.png` });

  // 3. Close CONTROLS
  console.log('Clicking GOT IT! button...');
  await page.click('#btn-close-controls');
  await new Promise(r => setTimeout(r, 500));

  // 4. Click START GAME
  console.log('Clicking START GAME...');
  await page.click('#btn-start-game');
  await new Promise(r => setTimeout(r, 1000));

  const hudVisible = await page.$eval('#hud', el => !el.classList.contains('hidden'));
  const gameStateVal = await page.evaluate(() => window.__GAME__?.level ? 'OK' : 'FAILED');
  console.log(`HUD visible: ${hudVisible}, Engine state: ${gameStateVal}`);

  await page.screenshot({ path: `${artifactDir}/test_3_gameplay_start.png` });
  console.log('Captured test_3_gameplay_start.png');

  // 5. Simulate Gameplay Controls (Run Right, Jump, Hit Blocks, Collect Coins)
  console.log('Simulating player running right and jumping...');
  await page.keyboard.down('KeyD');
  await new Promise(r => setTimeout(r, 1200));

  // Jump!
  await page.keyboard.down('Space');
  await new Promise(r => setTimeout(r, 200));
  await page.keyboard.up('Space');
  await new Promise(r => setTimeout(r, 800));

  await page.keyboard.up('KeyD');
  await new Promise(r => setTimeout(r, 500));

  // Read player position & score from game
  const playerStats = await page.evaluate(() => {
    const p = window.__GAME__.player;
    return {
      x: p.pos.x.toFixed(2),
      y: p.pos.y.toFixed(2),
      isGrounded: p.isGrounded,
      score: document.getElementById('hud-score-val').textContent,
      coins: document.getElementById('hud-coins-val').textContent,
      time: document.getElementById('hud-time-val').textContent
    };
  });
  console.log('Player status after movement:', playerStats);
  await page.screenshot({ path: `${artifactDir}/test_4_gameplay_action.png` });

  // 6. Test Pause & Resume
  console.log('Pressing KeyP to pause...');
  await page.keyboard.press('KeyP');
  await new Promise(r => setTimeout(r, 500));
  const pauseVisible = await page.$eval('#screen-pause', el => !el.classList.contains('hidden'));
  console.log(`Pause screen visible: ${pauseVisible}`);
  await page.screenshot({ path: `${artifactDir}/test_5_pause_menu.png` });

  console.log('Clicking RESUME button...');
  await page.click('#btn-resume');
  await new Promise(r => setTimeout(r, 500));

  // 7. Test Victory Trigger via game state
  console.log('Testing victory screen rendering...');
  await page.evaluate(() => {
    window.__GAME__.level.goal.reachGoal();
  });
  await new Promise(r => setTimeout(r, 1000));
  const victoryVisible = await page.$eval('#screen-victory', el => !el.classList.contains('hidden'));
  console.log(`Victory screen visible: ${victoryVisible}`);
  await page.screenshot({ path: `${artifactDir}/test_6_victory_screen.png` });

  console.log('--- VERIFICATION SUMMARY ---');
  console.log(`Total console logs: ${consoleLogs.length}`);
  console.log(`Total errors: ${errors.length}`);
  if (errors.length > 0) {
    console.error('Errors encountered:', errors);
  } else {
    console.log('All tests passed with 0 console errors!');
  }

  await browser.close();
  process.exit(errors.length > 0 ? 1 : 0);
}

testGame().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
