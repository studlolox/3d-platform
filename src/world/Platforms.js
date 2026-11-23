/**
 * Platforms.js
 * Interactive blocks, moving platforms, checkpoints, and goal pole.
 */

import * as THREE from 'three';
import { audio } from '../core/Audio.js';
import { collision } from '../world/Collision.js';
import { gameState, STATES } from '../systems/GameState.js';
import { StarPowerUp } from '../entities/PowerUp.js';

export class MysteryBlock {
  constructor(scene, particles, camera, powerUpSpawner, x, y, rewardType = 'COIN') {
    this.scene = scene;
    this.particles = particles;
    this.camera = camera;
    this.powerUpSpawner = powerUpSpawner;
    this.x = x;
    this.y = y;
    this.initialY = y;
    this.rewardType = rewardType; // 'COIN' or 'STAR'
    this.isUsed = false;

    // Mesh
    this.mesh = new THREE.Group();
    this.mesh.position.set(x, y, 0);

    const boxGeo = new THREE.BoxGeometry(0.96, 0.96, 0.96);
    this.activeMat = new THREE.MeshLambertMaterial({
      color: 0xffb300,
      emissive: 0xff8f00,
      emissiveIntensity: 0.35
    });
    this.usedMat = new THREE.MeshLambertMaterial({ color: 0x8d6e63 });

    this.boxMesh = new THREE.Mesh(boxGeo, this.activeMat);
    this.boxMesh.castShadow = true;
    this.mesh.add(this.boxMesh);

    // Embossed '?' symbol using extruded text or cute geometric badge
    const badgeGeo = new THREE.BoxGeometry(0.5, 0.5, 0.04);
    const badgeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const badgeFront = new THREE.Mesh(badgeGeo, badgeMat);
    badgeFront.position.set(0, 0, 0.5);
    this.mesh.add(badgeFront);

    // Dot of the '?'
    const dotGeo = new THREE.BoxGeometry(0.12, 0.12, 0.06);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xe65100 });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.set(0, -0.14, 0.51);
    this.mesh.add(dot);

    const hookGeo = new THREE.BoxGeometry(0.24, 0.16, 0.06);
    const hook = new THREE.Mesh(hookGeo, dotMat);
    hook.position.set(0, 0.08, 0.51);
    this.mesh.add(hook);

    this.scene.add(this.mesh);

    // Register with collision system
    this.collider = {
      x: this.x,
      y: this.y,
      w: 1.0,
      h: 1.0,
      type: 'mystery_block',
      blockRef: this
    };
    collision.addCollider(this.collider);

    // Bump animation
    this.bumpProgress = 0;
    this.isBumping = false;
  }

  onHitFromBelow(player) {
    if (this.isUsed || this.isBumping) return;
    this.isUsed = true;
    this.isBumping = true;
    this.bumpProgress = 0;

    audio.playBlockHit();
    this.boxMesh.material = this.usedMat;

    // Spawn reward
    if (this.rewardType === 'STAR') {
      audio.playPowerUp();
      if (this.powerUpSpawner) {
        this.powerUpSpawner(this.x, this.y + 0.8);
      }
    } else {
      // Coin reward pops out
      audio.playCoin();
      gameState.addCoin();
      this.particles.spawnSparkles(this.x, this.y + 0.9, 0, 8, 0xffeb3b);
      this.particles.showFloatingText('+100', this.x, this.y + 1.2, this.camera.camera);
    }
  }

  update(dt) {
    if (this.isBumping) {
      this.bumpProgress += dt * 8.0;
      if (this.bumpProgress < Math.PI) {
        this.mesh.position.y = this.initialY + Math.sin(this.bumpProgress) * 0.28;
      } else {
        this.mesh.position.y = this.initialY;
        this.isBumping = false;
      }
    }
  }

  destroy() {
    this.scene.remove(this.mesh);
  }
}

export class BreakableBlock {
  constructor(scene, particles, camera, x, y) {
    this.scene = scene;
    this.particles = particles;
    this.camera = camera;
    this.x = x;
    this.y = y;
    this.isBroken = false;

    // Mesh
    const boxGeo = new THREE.BoxGeometry(0.96, 0.96, 0.96);
    const brickMat = new THREE.MeshLambertMaterial({ color: 0xc65d21 });
    this.mesh = new THREE.Mesh(boxGeo, brickMat);
    this.mesh.position.set(x, y, 0);
    this.mesh.castShadow = true;
    this.scene.add(this.mesh);

    // Register with collision
    this.collider = {
      x: this.x,
      y: this.y,
      w: 1.0,
      h: 1.0,
      type: 'breakable_block',
      blockRef: this
    };
    collision.addCollider(this.collider);
  }

  onHitFromBelow(player) {
    if (this.isBroken) return;
    this.isBroken = true;

    audio.playBlockBreak();
    this.camera.addShake(0.3);
    this.particles.spawnBrickDebris(this.x, this.y, 0);
    this.particles.showFloatingText('+50', this.x, this.y + 0.6, this.camera.camera);
    gameState.addScore(50);

    // Remove collider
    const idx = collision.colliders.indexOf(this.collider);
    if (idx !== -1) {
      collision.colliders.splice(idx, 1);
    }

    this.scene.remove(this.mesh);
  }

  destroy() {
    this.scene.remove(this.mesh);
  }
}

export class MovingPlatform {
  constructor(scene, x, y, rangeX = 4.0, rangeY = 0, speed = 1.6) {
    this.scene = scene;
    this.startX = x;
    this.startY = y;
    this.rangeX = rangeX;
    this.rangeY = rangeY;
    this.speed = speed;
    this.time = Math.random() * Math.PI;

    this.w = 2.4;
    this.h = 0.55;

    // Mesh
    this.mesh = new THREE.Group();
    this.mesh.position.set(x, y, 0);

    const platGeo = new THREE.BoxGeometry(this.w, this.h, 1.2);
    const platMat = new THREE.MeshLambertMaterial({ color: 0xffb74d });
    const topMat = new THREE.MeshLambertMaterial({ color: 0xffcc80 });

    const mesh = new THREE.Mesh(platGeo, platMat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.mesh.add(mesh);

    // Little wooden planks details
    const stripeGeo = new THREE.BoxGeometry(0.1, this.h + 0.02, 1.22);
    const stripeMat = new THREE.MeshLambertMaterial({ color: 0xd88d35 });
    const s1 = new THREE.Mesh(stripeGeo, stripeMat);
    s1.position.x = -0.6;
    const s2 = new THREE.Mesh(stripeGeo, stripeMat);
    s2.position.x = 0.6;
    this.mesh.add(s1, s2);

    this.scene.add(this.mesh);

    // Moving platform collider
    this.collider = {
      x: this.startX,
      y: this.startY,
      w: this.w,
      h: this.h,
      deltaX: 0,
      deltaY: 0,
      isMovingPlatform: true
    };
    collision.addCollider(this.collider);
  }

  update(dt) {
    this.time += dt * this.speed;

    const prevX = this.mesh.position.x;
    const prevY = this.mesh.position.y;

    const newX = this.startX + Math.sin(this.time) * this.rangeX;
    const newY = this.startY + Math.cos(this.time) * this.rangeY;

    this.mesh.position.set(newX, newY, 0);

    // Compute frame delta for rider
    this.collider.deltaX = newX - prevX;
    this.collider.deltaY = newY - prevY;
    this.collider.x = newX;
    this.collider.y = newY;
  }

  destroy() {
    this.scene.remove(this.mesh);
  }
}

export class CheckpointFlag {
  constructor(scene, particles, camera, x, y) {
    this.scene = scene;
    this.particles = particles;
    this.camera = camera;
    this.x = x;
    this.y = y;
    this.isActivated = false;

    this.mesh = new THREE.Group();
    this.mesh.position.set(x, y, 0);

    // Base
    const baseGeo = new THREE.CylinderGeometry(0.5, 0.6, 0.4, 12);
    const baseMat = new THREE.MeshLambertMaterial({ color: 0x455a64 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.2;
    this.mesh.add(base);

    // Pole
    const poleGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8);
    const poleMat = new THREE.MeshLambertMaterial({ color: 0xcfd8dc });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 1.8;
    this.mesh.add(pole);

    // Rotating Star / Pennant on top
    this.starGroup = new THREE.Group();
    this.starGroup.position.set(0, 3.2, 0);

    const starGeo = new THREE.OctahedronGeometry(0.35, 0);
    this.starMat = new THREE.MeshLambertMaterial({ color: 0xef5350 }); // Red initially
    this.starMesh = new THREE.Mesh(starGeo, this.starMat);
    this.starGroup.add(this.starMesh);

    this.mesh.add(this.starGroup);
    this.scene.add(this.mesh);
  }

  update(dt, player) {
    this.starGroup.rotation.y += dt * (this.isActivated ? 5.0 : 2.0);

    if (!this.isActivated && player) {
      const dx = player.pos.x - this.x;
      const dy = player.pos.y - this.y;
      if (Math.hypot(dx, dy) < 1.4) {
        this.activate();
      }
    }
  }

  activate() {
    this.isActivated = true;
    this.starMat.color.setHex(0xffea00); // Turns shining gold
    this.starMat.emissive = new THREE.Color(0xffb300);
    this.starMat.emissiveIntensity = 0.5;

    audio.playCheckpoint();
    gameState.setCheckpoint(this.x, this.y + 0.6, 0);
    this.particles.spawnSparkles(this.x, this.y + 3.2, 0, 16, 0xffea00);
    this.particles.showFloatingText('CHECKPOINT! 🚩', this.x, this.y + 3.6, this.camera.camera);
  }

  destroy() {
    this.scene.remove(this.mesh);
  }
}

export class GoalFlag {
  constructor(scene, particles, camera, x, y) {
    this.scene = scene;
    this.particles = particles;
    this.camera = camera;
    this.x = x;
    this.y = y;
    this.isReached = false;

    this.mesh = new THREE.Group();
    this.mesh.position.set(x, y, 0);

    // Castle/Arch Gateway Base
    const archMat = new THREE.MeshLambertMaterial({ color: 0x78909c });
    const pillarGeo = new THREE.BoxGeometry(0.8, 4.0, 0.8);

    const pillarL = new THREE.Mesh(pillarGeo, archMat);
    pillarL.position.set(-1.4, 2.0, 0);
    const pillarR = new THREE.Mesh(pillarGeo, archMat);
    pillarR.position.set(1.4, 2.0, 0);

    const archTopGeo = new THREE.BoxGeometry(3.6, 0.8, 1.0);
    const archTop = new THREE.Mesh(archTopGeo, archMat);
    archTop.position.set(0, 4.4, 0);

    this.mesh.add(pillarL, pillarR, archTop);

    // Grand golden flagpole in middle
    const poleGeo = new THREE.CylinderGeometry(0.1, 0.1, 5.5, 12);
    const poleMat = new THREE.MeshLambertMaterial({ color: 0xffd54f });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(0, 4.2, 0);
    this.mesh.add(pole);

    // Flag banner
    const bannerGeo = new THREE.PlaneGeometry(1.4, 0.9);
    const bannerMat = new THREE.MeshLambertMaterial({ color: 0x00e676, side: THREE.DoubleSide });
    this.banner = new THREE.Mesh(bannerGeo, bannerMat);
    this.banner.position.set(0.7, 6.2, 0);
    this.mesh.add(this.banner);

    // Glowing Golden Crown Star
    const starGeo = new THREE.OctahedronGeometry(0.5, 0);
    const starMat = new THREE.MeshLambertMaterial({
      color: 0xffd700,
      emissive: 0xffa000,
      emissiveIntensity: 0.6
    });
    this.star = new THREE.Mesh(starGeo, starMat);
    this.star.position.set(0, 7.0, 0);
    this.mesh.add(this.star);

    this.scene.add(this.mesh);
  }

  update(dt, player) {
    this.star.rotation.y += dt * 3.0;

    if (!this.isReached && player) {
      const dx = player.pos.x - this.x;
      const dy = player.pos.y - this.y;
      if (Math.hypot(dx, dy) < 2.0) {
        this.reachGoal();
      }
    }
  }

  reachGoal() {
    this.isReached = true;
    audio.playVictory();
    gameState.setState(STATES.VICTORY);

    this.particles.spawnConfetti(this.x, this.y + 4.0, 0, 50);
    this.particles.showFloatingText('COURSE CLEAR! 🏆', this.x, this.y + 5.5, this.camera.camera);
  }

  destroy() {
    this.scene.remove(this.mesh);
  }
}
