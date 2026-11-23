/**
 * Level.js
 * Parameterized Level Engine & Loader.
 * Dynamically builds themed environments, terrain, blocks, collectibles,
 * moving platforms, enemies, checkpoints, and goal arches from declarative level configs.
 */

import * as THREE from 'three';
import { collision } from './Collision.js';
import { MysteryBlock, BreakableBlock, MovingPlatform, CheckpointFlag, GoalFlag } from './Platforms.js';
import { Coin } from '../entities/Coin.js';
import { StarPowerUp } from '../entities/PowerUp.js';
import { WalkerEnemy, HopperEnemy } from '../entities/Enemy.js';
import { gameState } from '../systems/GameState.js';
import { getLevelData, Level1_1 } from './levels/index.js';

export class Level {
  constructor(scene, particles, camera) {
    this.scene = scene;
    this.particles = particles;
    this.camera = camera;

    // Active Level metadata
    this.currentLevelData = Level1_1;
    this.levelBounds = { minX: 4, maxX: 154 };

    // Entities in level
    this.coins = [];
    this.powerUps = [];
    this.enemies = [];
    this.blocks = [];
    this.movingPlatforms = [];
    this.checkpoint = null;
    this.goal = null;

    // Scenery groups
    this.sceneryGroup = new THREE.Group();
    this.scene.add(this.sceneryGroup);

    // Active theme materials cache
    this.materials = {};
  }

  build(levelInput = null) {
    this.clear();

    let data;
    if (typeof levelInput === 'string') {
      data = getLevelData(levelInput);
    } else if (levelInput && levelInput.key) {
      data = levelInput;
    } else if (gameState && gameState.levelKey) {
      data = getLevelData(gameState.levelKey);
    } else {
      data = Level1_1;
    }

    this.currentLevelData = data;
    this.levelBounds = data.bounds || { minX: 4, maxX: 154 };

    // 1. Camera Bounds
    this.camera.setBounds(this.levelBounds.minX, this.levelBounds.maxX, 3.5, 30);

    // 2. Setup Theme, Lighting & Materials
    this.applyTheme(data.theme);

    // 3. Build Scenery Backdrops
    this.buildScenery(data.scenery, data.theme?.biome);

    // 4. Build Terrain & Floating Platforms
    this.buildTerrain(data.platforms || [], data.floatingPlatforms || []);

    // 5. Build Moving Platforms
    this.buildMovingPlatforms(data.movingPlatforms || []);

    // 6. Build Interactive Blocks
    this.buildBlocks(data.blocks || []);

    // 7. Build Collectible Coins
    this.buildCoins(data.coins || []);

    // 8. Build Enemies
    this.buildEnemies(data.enemies || []);

    // 9. Build Checkpoint & Goal
    this.buildCheckpointsAndGoal(data.checkpoint, data.goal);
  }

  applyTheme(theme = {}) {
    const skyColor = theme.skyColor || 0x60a5fa;
    const fogColor = theme.fogColor || 0x93c5fd;
    const fogDensity = theme.fogDensity || 0.008;

    this.scene.background = new THREE.Color(skyColor);
    this.scene.fog = new THREE.FogExp2(fogColor, fogDensity);

    const m = theme.materials || {};
    this.materials = {
      platformTop: new THREE.MeshLambertMaterial({ color: m.platformTop || 0x4caf50 }),
      platformBody: new THREE.MeshLambertMaterial({ color: m.platformBody || 0x6d4c41 }),
      cloud: new THREE.MeshLambertMaterial({ color: m.cloud || 0xffffff, transparent: true, opacity: 0.88 }),
      hill: new THREE.MeshLambertMaterial({ color: m.hill || 0x388e3c }),
      distantHill: new THREE.MeshLambertMaterial({ color: m.distantHill || 0x2e7d32 }),
      trunk: new THREE.MeshLambertMaterial({ color: m.trunk || 0x5d4037 }),
      foliage: new THREE.MeshLambertMaterial({ color: m.foliage || 0x66bb6a }),
      rock: new THREE.MeshLambertMaterial({ color: m.rock || 0x37474f }),
      crystal: new THREE.MeshLambertMaterial({
        color: m.crystal || 0x00e5ff,
        emissive: m.crystal || 0x00e5ff,
        emissiveIntensity: 0.55
      }),
      mushroomCap: new THREE.MeshLambertMaterial({
        color: m.mushroomCap || 0xab47bc,
        emissive: 0x4a148c,
        emissiveIntensity: 0.35
      }),
      mushroomStem: new THREE.MeshLambertMaterial({ color: m.mushroomStem || 0xd1c4e9 }),
      flower1: new THREE.MeshBasicMaterial({ color: 0xffeb3b }),
      flower2: new THREE.MeshBasicMaterial({ color: 0xff4081 })
    };
  }

  // --- Scenery Builders ---

  buildScenery(scenery = {}, biome = 'meadow') {
    if (biome === 'cavern') {
      this.buildCavernScenery(scenery);
    } else {
      this.buildMeadowScenery(scenery);
    }
  }

  buildMeadowScenery(scenery) {
    // Clouds
    const clouds = scenery.clouds || [];
    clouds.forEach(cp => {
      const cloud = new THREE.Group();
      cloud.position.set(cp.x, cp.y, cp.z);

      const s1 = new THREE.Mesh(new THREE.SphereGeometry(1.2 * cp.scale, 8, 8), this.materials.cloud);
      const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.9 * cp.scale, 8, 8), this.materials.cloud);
      s2.position.set(-1.0 * cp.scale, -0.2 * cp.scale, 0);
      const s3 = new THREE.Mesh(new THREE.SphereGeometry(0.85 * cp.scale, 8, 8), this.materials.cloud);
      s3.position.set(1.0 * cp.scale, -0.2 * cp.scale, 0);

      cloud.add(s1, s2, s3);
      this.sceneryGroup.add(cloud);
    });

    // Rolling Hills
    const hills = scenery.hills || [];
    hills.forEach(h => {
      const geo = new THREE.SphereGeometry(h.r, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
      geo.scale(1, 1, 0.35);
      const mat = h.mat === 'distantHill' ? this.materials.distantHill : this.materials.hill;
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(h.x, h.y, h.z);
      this.sceneryGroup.add(mesh);
    });

    // Trees
    const trees = scenery.trees || [];
    trees.forEach(t => {
      const tree = new THREE.Group();
      tree.position.set(t.x, t.y, t.z);

      const trunkGeo = new THREE.CylinderGeometry(0.25 * t.s, 0.35 * t.s, 1.8 * t.s, 8);
      const trunk = new THREE.Mesh(trunkGeo, this.materials.trunk);
      trunk.position.y = 0.9 * t.s;
      tree.add(trunk);

      const folGeo = new THREE.SphereGeometry(1.1 * t.s, 10, 8);
      const fol = new THREE.Mesh(folGeo, this.materials.foliage);
      fol.position.y = 2.1 * t.s;
      tree.add(fol);

      this.sceneryGroup.add(tree);
    });

    // Flowers
    if (scenery.hasFlowers) {
      for (let x = 2; x < (this.levelBounds.maxX - 5); x += 3.5) {
        if (Math.random() < 0.6) {
          const flower = new THREE.Group();
          flower.position.set(x + (Math.random() - 0.5) * 1.5, 2.05, 0.5);

          const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.25, 4), this.materials.platformTop);
          stem.position.y = 0.12;

          const petalMat = Math.random() < 0.5 ? this.materials.flower1 : this.materials.flower2;
          const petals = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), petalMat);
          petals.position.y = 0.26;

          flower.add(stem, petals);
          this.sceneryGroup.add(flower);
        }
      }
    }
  }

  buildCavernScenery(scenery) {
    // Stalactites hanging from cave ceiling
    const stalactites = scenery.stalactites || [];
    stalactites.forEach(st => {
      const coneGeo = new THREE.ConeGeometry(st.r, st.h, 7);
      const mesh = new THREE.Mesh(coneGeo, this.materials.rock);
      mesh.rotation.x = Math.PI; // Point downwards
      mesh.position.set(st.x, st.y, st.z);
      this.sceneryGroup.add(mesh);
    });

    // Glowing Crystals on ground ledges
    const crystals = scenery.crystals || [];
    crystals.forEach(cr => {
      const crGroup = new THREE.Group();
      crGroup.position.set(cr.x, cr.y, cr.z);

      const cGeo = new THREE.OctahedronGeometry(0.35 * cr.s, 0);
      cGeo.scale(0.6, 1.8, 0.6);
      const cMat = new THREE.MeshLambertMaterial({
        color: cr.color || 0x00e5ff,
        emissive: cr.color || 0x00e5ff,
        emissiveIntensity: 0.65
      });
      const cMesh = new THREE.Mesh(cGeo, cMat);
      cMesh.rotation.z = (Math.random() - 0.5) * 0.4;
      crGroup.add(cMesh);

      this.sceneryGroup.add(crGroup);
    });

    // Luminescent cavern mushrooms
    const mushrooms = scenery.mushrooms || [];
    mushrooms.forEach(m => {
      const mGroup = new THREE.Group();
      mGroup.position.set(m.x, m.y, m.z);

      const stemGeo = new THREE.CylinderGeometry(0.08 * m.s, 0.12 * m.s, 0.5 * m.s, 6);
      const stem = new THREE.Mesh(stemGeo, this.materials.mushroomStem);
      stem.position.y = 0.25 * m.s;
      mGroup.add(stem);

      const capGeo = new THREE.SphereGeometry(0.35 * m.s, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.55);
      const cap = new THREE.Mesh(capGeo, this.materials.mushroomCap);
      cap.position.y = 0.5 * m.s;
      mGroup.add(cap);

      this.sceneryGroup.add(mGroup);
    });

    // Background cavern stone pillars
    const pillars = scenery.caveBackdropPillars || [];
    pillars.forEach(p => {
      const pGeo = new THREE.BoxGeometry(p.w, p.h, 2.0);
      const mesh = new THREE.Mesh(pGeo, this.materials.rock);
      mesh.position.set(p.x, p.y, p.z);
      this.sceneryGroup.add(mesh);
    });
  }

  // --- Terrain Platforms ---

  buildTerrain(platforms, floatingPlatforms) {
    platforms.forEach(p => {
      this.createPlatform(p.x, p.y, p.w, p.h || 4.0, p.d || 3.0);
    });

    floatingPlatforms.forEach(fp => {
      this.createFloatingPlatform(fp.x, fp.y, fp.w || 3.0);
    });
  }

  createPlatform(x, y, w, h = 4.0, d = 3.0) {
    const group = new THREE.Group();
    group.position.set(x, y - h / 2, 0);

    const bodyGeo = new THREE.BoxGeometry(w, h - 0.35, d);
    const bodyMesh = new THREE.Mesh(bodyGeo, this.materials.platformBody);
    bodyMesh.position.y = -0.175;
    bodyMesh.receiveShadow = true;
    group.add(bodyMesh);

    const topGeo = new THREE.BoxGeometry(w + 0.08, 0.4, d + 0.08);
    const topMesh = new THREE.Mesh(topGeo, this.materials.platformTop);
    topMesh.position.y = (h - 0.35) / 2 + 0.05;
    topMesh.receiveShadow = true;
    group.add(topMesh);

    this.sceneryGroup.add(group);

    collision.addCollider({
      x: x,
      y: y - h / 2,
      w: w,
      h: h,
      type: 'solid_ground'
    });
  }

  createFloatingPlatform(x, y, w = 3.0) {
    const group = new THREE.Group();
    group.position.set(x, y, 0);

    const geo = new THREE.BoxGeometry(w, 0.7, 2.2);
    const mesh = new THREE.Mesh(geo, this.materials.platformBody);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    const topGeo = new THREE.BoxGeometry(w + 0.06, 0.25, 2.26);
    const topMesh = new THREE.Mesh(topGeo, this.materials.platformTop);
    topMesh.position.y = 0.28;
    group.add(topMesh);

    this.sceneryGroup.add(group);

    collision.addCollider({
      x: x,
      y: y,
      w: w,
      h: 0.7,
      type: 'floating_platform'
    });
  }

  // --- Moving Platforms ---

  buildMovingPlatforms(movingPlats) {
    movingPlats.forEach(mp => {
      const plat = new MovingPlatform(
        this.scene,
        mp.x,
        mp.y,
        mp.rangeX || 0,
        mp.rangeY || 0,
        mp.speed || 1.5
      );
      this.movingPlatforms.push(plat);
    });
  }

  // --- Interactive Blocks ---

  buildBlocks(blocks) {
    const spawnStarPowerUp = (x, y) => {
      const p = new StarPowerUp(this.scene, this.particles, this.camera, x, y, 0);
      this.powerUps.push(p);
    };

    blocks.forEach(b => {
      if (b.type === 'mystery') {
        const callback = b.reward === 'STAR' ? spawnStarPowerUp : null;
        this.blocks.push(new MysteryBlock(
          this.scene,
          this.particles,
          this.camera,
          callback,
          b.x,
          b.y,
          b.reward || 'COIN'
        ));
      } else if (b.type === 'brick') {
        this.blocks.push(new BreakableBlock(
          this.scene,
          this.particles,
          this.camera,
          b.x,
          b.y
        ));
      }
    });
  }

  // --- Collectibles ---

  buildCoins(coins) {
    coins.forEach(c => {
      this.coins.push(new Coin(this.scene, this.particles, this.camera, c.x, c.y, 0));
    });
  }

  // --- Enemies ---

  buildEnemies(enemies) {
    enemies.forEach(e => {
      if (e.type === 'walker') {
        this.enemies.push(new WalkerEnemy(
          this.scene,
          this.particles,
          this.camera,
          e.x,
          e.y,
          e.patrolDistance || 3.0
        ));
      } else if (e.type === 'hopper') {
        this.enemies.push(new HopperEnemy(
          this.scene,
          this.particles,
          this.camera,
          e.x,
          e.y,
          e.patrolDistance || 3.0
        ));
      }
    });
  }

  // --- Checkpoint & Goal ---

  buildCheckpointsAndGoal(checkpointData, goalData) {
    if (checkpointData) {
      this.checkpoint = new CheckpointFlag(
        this.scene,
        this.particles,
        this.camera,
        checkpointData.x,
        checkpointData.y
      );
    }
    if (goalData) {
      this.goal = new GoalFlag(
        this.scene,
        this.particles,
        this.camera,
        goalData.x,
        goalData.y
      );
    }
  }

  update(dt, player) {
    for (let b of this.blocks) {
      if (typeof b.update === 'function') b.update(dt);
    }

    for (let mp of this.movingPlatforms) {
      mp.update(dt);
    }

    for (let c of this.coins) {
      c.update(dt, player);
    }

    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const p = this.powerUps[i];
      p.update(dt, player);
      if (p.isCollected || p.lifeTimer <= 0) {
        this.powerUps.splice(i, 1);
      }
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(dt, player);
      if (e.isDead && e.deathTimer > 0.45) {
        this.enemies.splice(i, 1);
      }
    }

    if (this.checkpoint) this.checkpoint.update(dt, player);
    if (this.goal) this.goal.update(dt, player);
  }

  clear() {
    collision.clear();

    for (let c of this.coins) c.destroy();
    this.coins = [];

    for (let p of this.powerUps) p.destroy();
    this.powerUps = [];

    for (let e of this.enemies) e.destroy();
    this.enemies = [];

    for (let b of this.blocks) b.destroy();
    this.blocks = [];

    for (let mp of this.movingPlatforms) mp.destroy();
    this.movingPlatforms = [];

    if (this.checkpoint) {
      this.checkpoint.destroy();
      this.checkpoint = null;
    }

    if (this.goal) {
      this.goal.destroy();
      this.goal = null;
    }

    while (this.sceneryGroup.children.length > 0) {
      const obj = this.sceneryGroup.children[0];
      this.sceneryGroup.remove(obj);
    }
  }
}
