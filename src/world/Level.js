/**
 * Level.js
 * Builds the complete "World 1-1: Sunny Meadows" level,
 * including terrain platforms, interactive blocks, collectibles, enemies,
 * checkpoints, goal, and stylized background scenery.
 */

import * as THREE from 'three';
import { collision } from './Collision.js';
import { MysteryBlock, BreakableBlock, MovingPlatform, CheckpointFlag, GoalFlag } from './Platforms.js';
import { Coin } from '../entities/Coin.js';
import { StarPowerUp } from '../entities/PowerUp.js';
import { WalkerEnemy, HopperEnemy } from '../entities/Enemy.js';

export class Level {
  constructor(scene, particles, camera) {
    this.scene = scene;
    this.particles = particles;
    this.camera = camera;

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

    this.levelBounds = { minX: 4, maxX: 154 };

    // Shared materials for platforms & terrain
    this.grassMat = new THREE.MeshLambertMaterial({ color: 0x4caf50 }); // Vibrant meadow green
    this.dirtMat = new THREE.MeshLambertMaterial({ color: 0x6d4c41 });  // Warm earthy brown
    this.cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.88 });
    this.hillMat = new THREE.MeshLambertMaterial({ color: 0x388e3c });
    this.distantHillMat = new THREE.MeshLambertMaterial({ color: 0x2e7d32 });
    this.trunkMat = new THREE.MeshLambertMaterial({ color: 0x5d4037 });
    this.foliageMat = new THREE.MeshLambertMaterial({ color: 0x66bb6a });
    this.flowerMat1 = new THREE.MeshBasicMaterial({ color: 0xffeb3b });
    this.flowerMat2 = new THREE.MeshBasicMaterial({ color: 0xff4081 });
  }

  build() {
    this.clear();
    this.camera.setBounds(this.levelBounds.minX, this.levelBounds.maxX, 3.5, 30);

    // 1. Decorative Environment & Scenery
    this.buildSkyAndClouds();
    this.buildRollingHills();
    this.buildFoliageAndDecorations();

    // 2. Terrain Platforms & Level Layout
    this.buildTerrain();

    // 3. Interactive Blocks
    this.buildBlocks();

    // 4. Collectibles (Coins)
    this.buildCoins();

    // 5. Enemies
    this.buildEnemies();

    // 6. Checkpoint & Goal
    this.buildCheckpointsAndGoal();
  }

  // --- Scenery ---

  buildSkyAndClouds() {
    // Stylized fluffy 3D clouds floating at background depth (Z = -6 to -14)
    const cloudPositions = [
      { x: 10, y: 12, z: -8, scale: 1.4 },
      { x: 26, y: 14, z: -10, scale: 1.6 },
      { x: 42, y: 11, z: -7, scale: 1.2 },
      { x: 62, y: 13, z: -9, scale: 1.8 },
      { x: 80, y: 12, z: -8, scale: 1.5 },
      { x: 100, y: 15, z: -11, scale: 1.7 },
      { x: 122, y: 13, z: -7, scale: 1.3 },
      { x: 144, y: 14, z: -9, scale: 1.6 }
    ];

    cloudPositions.forEach(cp => {
      const cloud = new THREE.Group();
      cloud.position.set(cp.x, cp.y, cp.z);

      // Multiple overlapping puffy spheres
      const s1 = new THREE.Mesh(new THREE.SphereGeometry(1.2 * cp.scale, 8, 8), this.cloudMat);
      const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.9 * cp.scale, 8, 8), this.cloudMat);
      s2.position.set(-1.0 * cp.scale, -0.2 * cp.scale, 0);
      const s3 = new THREE.Mesh(new THREE.SphereGeometry(0.85 * cp.scale, 8, 8), this.cloudMat);
      s3.position.set(1.0 * cp.scale, -0.2 * cp.scale, 0);

      cloud.add(s1, s2, s3);
      this.sceneryGroup.add(cloud);
    });
  }

  buildRollingHills() {
    // Smooth rounded hills pushed safely into the background (Z <= -12) with Z-flattening so they never intersect the runway
    const hills = [
      { x: 8, y: -2, z: -14, r: 10, mat: this.hillMat },
      { x: 25, y: -3, z: -20, r: 15, mat: this.distantHillMat },
      { x: 45, y: -2, z: -15, r: 11, mat: this.hillMat },
      { x: 68, y: -4, z: -22, r: 17, mat: this.distantHillMat },
      { x: 92, y: -2, z: -14, r: 11, mat: this.hillMat },
      { x: 115, y: -3, z: -18, r: 14, mat: this.distantHillMat },
      { x: 138, y: -2, z: -14, r: 10, mat: this.hillMat }
    ];

    hills.forEach(h => {
      // Create hemisphere and flatten depth (Z) by 0.35 so it serves as a backdrop silhouette
      const geo = new THREE.SphereGeometry(h.r, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
      geo.scale(1, 1, 0.35); // Flatten in Z to prevent any foreground clipping
      const mesh = new THREE.Mesh(geo, h.mat);
      mesh.position.set(h.x, h.y, h.z);
      this.sceneryGroup.add(mesh);
    });
  }

  buildFoliageAndDecorations() {
    // Cute stylized trees (round puffed foliage on brown trunks) set safely behind runway (Z = -2.4)
    const trees = [
      { x: 4, y: 2.0, z: -2.4, s: 1.0 },
      { x: 12, y: 2.0, z: -2.4, s: 1.2 },
      { x: 22, y: 2.0, z: -2.5, s: 1.1 },
      { x: 38, y: 3.5, z: -2.4, s: 1.3 },
      { x: 55, y: 2.0, z: -2.4, s: 1.0 },
      { x: 74, y: 2.0, z: -2.5, s: 1.4 },
      { x: 88, y: 4.0, z: -2.5, s: 1.2 },
      { x: 110, y: 2.0, z: -2.4, s: 1.1 },
      { x: 135, y: 2.0, z: -2.5, s: 1.3 }
    ];

    trees.forEach(t => {
      const tree = new THREE.Group();
      tree.position.set(t.x, t.y, t.z);

      const trunkGeo = new THREE.CylinderGeometry(0.25 * t.s, 0.35 * t.s, 1.8 * t.s, 8);
      const trunk = new THREE.Mesh(trunkGeo, this.trunkMat);
      trunk.position.y = 0.9 * t.s;
      tree.add(trunk);

      // Puffy green foliage sphere
      const folGeo = new THREE.SphereGeometry(1.1 * t.s, 10, 8);
      const fol = new THREE.Mesh(folGeo, this.foliageMat);
      fol.position.y = 2.1 * t.s;
      tree.add(fol);

      this.sceneryGroup.add(tree);
    });

    // Decorative flowers along the ground
    for (let x = 2; x < 145; x += 3.5) {
      if (Math.random() < 0.6) {
        const flower = new THREE.Group();
        flower.position.set(x + (Math.random() - 0.5) * 1.5, 2.05, 0.5);

        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.25, 4), this.grassMat);
        stem.position.y = 0.12;

        const petalMat = Math.random() < 0.5 ? this.flowerMat1 : this.flowerMat2;
        const petals = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), petalMat);
        petals.position.y = 0.26;

        flower.add(stem, petals);
        this.sceneryGroup.add(flower);
      }
    }
  }

  // --- Terrain Creation Helper ---

  createPlatform(x, y, w, h = 4.0, d = 3.0) {
    const group = new THREE.Group();
    group.position.set(x, y - h / 2, 0);

    // Earth/Dirt body
    const dirtGeo = new THREE.BoxGeometry(w, h - 0.35, d);
    const dirtMesh = new THREE.Mesh(dirtGeo, this.dirtMat);
    dirtMesh.position.y = -0.175;
    dirtMesh.receiveShadow = true;
    group.add(dirtMesh);

    // Lush green grass top layer
    const grassGeo = new THREE.BoxGeometry(w + 0.08, 0.4, d + 0.08);
    const grassMesh = new THREE.Mesh(grassGeo, this.grassMat);
    grassMesh.position.y = (h - 0.35) / 2 + 0.05;
    grassMesh.receiveShadow = true;
    group.add(grassMesh);

    this.sceneryGroup.add(group);

    // Register solid collider
    const collider = {
      x: x,
      y: y - h / 2,
      w: w,
      h: h,
      type: 'solid_ground'
    };
    collision.addCollider(collider);
  }

  // --- Level Layout ---

  buildTerrain() {
    // 1. Zone 1: Starting Meadow (x: -5 to 24)
    this.createPlatform(9.5, 2.0, 31, 5.0);

    // 2. Zone 2: First Small Gap & Stepping Stones (x: 27 to 34)
    this.createPlatform(29.0, 2.0, 6, 5.0);
    this.createPlatform(38.0, 3.5, 8, 8.0); // Elevated mound

    // 3. Zone 3: Valley & Second Meadow (x: 46 to 70)
    this.createPlatform(58.0, 2.0, 26, 5.0);

    // 4. Elevated floating stone platforms in Valley
    this.createFloatingPlatform(52.0, 5.5, 3.5);
    this.createFloatingPlatform(63.0, 6.2, 3.5);

    // 5. Zone 4: Pit with Moving Platform (x: 74 to 86)
    // Moving platform crossing the canyon
    const mp1 = new MovingPlatform(this.scene, 79.0, 3.2, 3.8, 0, 1.5);
    this.movingPlatforms.push(mp1);

    // 6. Zone 5: Checkpoint Meadow (x: 88 to 110)
    this.createPlatform(99.0, 2.0, 24, 5.0);

    // Elevated steps leading up
    this.createFloatingPlatform(94.0, 5.2, 3.0);
    this.createFloatingPlatform(102.0, 7.0, 3.5);

    // 7. Zone 6: Final Gauntlet & Sky Stairs (x: 114 to 142)
    this.createPlatform(117.0, 2.0, 8, 5.0);
    
    // Vertical moving platform over final chasm
    const mp2 = new MovingPlatform(this.scene, 124.0, 3.5, 0, 2.2, 1.8);
    this.movingPlatforms.push(mp2);

    this.createPlatform(132.0, 3.5, 7, 8.0);

    // Grand staircase to goal
    this.createFloatingPlatform(137.0, 4.8, 2.0);
    this.createFloatingPlatform(139.5, 6.0, 2.0);
    this.createFloatingPlatform(142.0, 7.2, 2.0);

    // 8. Zone 7: Goal Castle Meadow (x: 147 to 160)
    this.createPlatform(152.0, 2.0, 16, 5.0);
  }

  createFloatingPlatform(x, y, w = 3.0) {
    const group = new THREE.Group();
    group.position.set(x, y, 0);

    const geo = new THREE.BoxGeometry(w, 0.7, 2.2);
    const mesh = new THREE.Mesh(geo, this.dirtMat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    const topGeo = new THREE.BoxGeometry(w + 0.06, 0.25, 2.26);
    const topMesh = new THREE.Mesh(topGeo, this.grassMat);
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

  // --- Interactive Blocks ---

  buildBlocks() {
    const spawnStarPowerUp = (x, y) => {
      const p = new StarPowerUp(this.scene, this.particles, this.camera, x, y, 0);
      this.powerUps.push(p);
    };

    // Zone 1: Introductory Blocks (Mystery + Brick)
    this.blocks.push(new MysteryBlock(this.scene, this.particles, this.camera, null, 14.0, 5.2, 'COIN'));
    this.blocks.push(new BreakableBlock(this.scene, this.particles, this.camera, 15.0, 5.2));
    this.blocks.push(new MysteryBlock(this.scene, this.particles, this.camera, spawnStarPowerUp, 16.0, 5.2, 'STAR'));
    this.blocks.push(new BreakableBlock(this.scene, this.particles, this.camera, 17.0, 5.2));
    this.blocks.push(new MysteryBlock(this.scene, this.particles, this.camera, null, 18.0, 5.2, 'COIN'));

    // Zone 2: Elevated Blocks on Mound
    this.blocks.push(new BreakableBlock(this.scene, this.particles, this.camera, 37.0, 7.2));
    this.blocks.push(new MysteryBlock(this.scene, this.particles, this.camera, null, 38.0, 7.2, 'COIN'));
    this.blocks.push(new BreakableBlock(this.scene, this.particles, this.camera, 39.0, 7.2));

    // Zone 3: Valley High Mystery Blocks
    this.blocks.push(new MysteryBlock(this.scene, this.particles, this.camera, null, 57.0, 5.8, 'COIN'));
    this.blocks.push(new MysteryBlock(this.scene, this.particles, this.camera, null, 59.0, 5.8, 'COIN'));

    // Zone 5: Checkpoint area hidden star block
    this.blocks.push(new BreakableBlock(this.scene, this.particles, this.camera, 98.0, 5.6));
    this.blocks.push(new MysteryBlock(this.scene, this.particles, this.camera, spawnStarPowerUp, 99.0, 5.6, 'STAR'));
    this.blocks.push(new BreakableBlock(this.scene, this.particles, this.camera, 100.0, 5.6));
  }

  // --- Collectible Coins ---

  buildCoins() {
    // Guiding coins along arcs and platforms
    const coinCoords = [
      // Safe starter arc
      { x: 7, y: 3.2 }, { x: 8, y: 3.8 }, { x: 9, y: 4.0 }, { x: 10, y: 3.8 }, { x: 11, y: 3.2 },
      // Above first blocks
      { x: 14, y: 6.8 }, { x: 16, y: 6.8 }, { x: 18, y: 6.8 },
      // Jump over first small gap
      { x: 26, y: 3.5 }, { x: 27, y: 4.2 }, { x: 28, y: 3.5 },
      // Mound coins
      { x: 37, y: 8.6 }, { x: 38, y: 8.8 }, { x: 39, y: 8.6 },
      // Floating platform coins
      { x: 51, y: 6.8 }, { x: 52, y: 6.8 }, { x: 53, y: 6.8 },
      { x: 62, y: 7.5 }, { x: 63, y: 7.5 }, { x: 64, y: 7.5 },
      // Moving platform 1 track
      { x: 77, y: 4.6 }, { x: 79, y: 4.6 }, { x: 81, y: 4.6 },
      // Mid-level elevated platforms
      { x: 93, y: 6.4 }, { x: 94, y: 6.4 }, { x: 95, y: 6.4 },
      { x: 101, y: 8.2 }, { x: 102, y: 8.2 }, { x: 103, y: 8.2 },
      // Moving platform 2 vertical leap
      { x: 124, y: 5.5 }, { x: 124, y: 7.0 },
      // Final staircase reward trail
      { x: 137, y: 6.0 }, { x: 139.5, y: 7.2 }, { x: 142, y: 8.4 },
      // Pre-goal victory run
      { x: 145, y: 3.2 }, { x: 147, y: 3.2 }, { x: 149, y: 3.2 }
    ];

    coinCoords.forEach(c => {
      this.coins.push(new Coin(this.scene, this.particles, this.camera, c.x, c.y, 0));
    });
  }

  // --- Enemies ---

  buildEnemies() {
    // 1. First gentle Walker near start
    this.enemies.push(new WalkerEnemy(this.scene, this.particles, this.camera, 20.0, 2.8, 3.5));

    // 2. Walker on elevated mound
    this.enemies.push(new WalkerEnemy(this.scene, this.particles, this.camera, 38.0, 4.2, 2.5));

    // 3. First Hopper enemy in the Valley
    this.enemies.push(new HopperEnemy(this.scene, this.particles, this.camera, 50.0, 2.8, 3.0));

    // 4. Walker patrol in middle valley
    this.enemies.push(new WalkerEnemy(this.scene, this.particles, this.camera, 62.0, 2.8, 4.0));

    // 5. Dual enemies after checkpoint: Walker + Hopper
    this.enemies.push(new WalkerEnemy(this.scene, this.particles, this.camera, 96.0, 2.8, 3.5));
    this.enemies.push(new HopperEnemy(this.scene, this.particles, this.camera, 105.0, 2.8, 3.0));

    // 6. Gauntlet Hopper before final jump
    this.enemies.push(new HopperEnemy(this.scene, this.particles, this.camera, 132.0, 4.2, 2.0));
  }

  // --- Checkpoint & Goal ---

  buildCheckpointsAndGoal() {
    // Checkpoint situated right after the first moving platform challenge (x = 89)
    this.checkpoint = new CheckpointFlag(this.scene, this.particles, this.camera, 89.0, 2.0);

    // Final Goal at end of level (x = 152)
    this.goal = new GoalFlag(this.scene, this.particles, this.camera, 152.0, 2.0);
  }

  update(dt, player) {
    // Update interactive blocks
    for (let b of this.blocks) {
      if (typeof b.update === 'function') {
        b.update(dt);
      }
    }

    // Update moving platforms
    for (let mp of this.movingPlatforms) {
      mp.update(dt);
    }

    // Update coins
    for (let c of this.coins) {
      c.update(dt, player);
    }

    // Update power-ups
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const p = this.powerUps[i];
      p.update(dt, player);
      if (p.isCollected || p.lifeTimer <= 0) {
        this.powerUps.splice(i, 1);
      }
    }

    // Update enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(dt, player);
      if (e.isDead && e.deathTimer > 0.45) {
        this.enemies.splice(i, 1);
      }
    }

    // Update checkpoint & goal
    if (this.checkpoint) this.checkpoint.update(dt, player);
    if (this.goal) this.goal.update(dt, player);
  }

  clear() {
    // Remove all dynamically spawned objects & colliders
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

    // Remove scenery
    while (this.sceneryGroup.children.length > 0) {
      const obj = this.sceneryGroup.children[0];
      this.sceneryGroup.remove(obj);
    }
  }
}
