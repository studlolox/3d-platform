/**
 * Enemy.js
 * Original cartoon enemy types: Walker ("Sproutle") & Hopper ("Bouncy").
 */

import * as THREE from 'three';
import { audio } from '../core/Audio.js';
import { collision } from '../world/Collision.js';
import { gameState } from '../systems/GameState.js';

export class WalkerEnemy {
  constructor(scene, particles, camera, x, y, patrolDistance = 5.0) {
    this.scene = scene;
    this.particles = particles;
    this.camera = camera;

    this.pos = new THREE.Vector3(x, y, 0);
    this.vel = new THREE.Vector3(-1.8, 0, 0);
    this.width = 0.8;
    this.height = 0.8;
    this.isGrounded = false;
    this.wasGrounded = false;

    this.minX = x - patrolDistance;
    this.maxX = x + patrolDistance;
    this.facingDir = -1;

    this.isDead = false;
    this.deathTimer = 0;

    // 3D Model
    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.pos);

    // Cute acorn/mushroom cap
    const capGeo = new THREE.SphereGeometry(0.42, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.65);
    const capMat = new THREE.MeshLambertMaterial({ color: 0x8d4925 }); // Acorn brown
    this.cap = new THREE.Mesh(capGeo, capMat);
    this.cap.position.y = 0.22;
    this.cap.castShadow = true;
    this.mesh.add(this.cap);

    // Underbody / Face
    const bodyGeo = new THREE.SphereGeometry(0.34, 12, 10);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0xffe0b2 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.12;
    this.mesh.add(body);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.06, 6, 6);
    eyeGeo.scale(0.8, 1.4, 0.5);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x212121 });

    this.eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    this.eyeL.position.set(-0.12, 0.16, 0.3);
    this.eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    this.eyeR.position.set(0.12, 0.16, 0.3);
    this.mesh.add(this.eyeL, this.eyeR);

    // Little feet
    const footGeo = new THREE.SphereGeometry(0.12, 8, 6);
    footGeo.scale(1.2, 0.6, 1.4);
    const footMat = new THREE.MeshLambertMaterial({ color: 0x5d4037 });
    this.footL = new THREE.Mesh(footGeo, footMat);
    this.footL.position.set(-0.18, -0.32, 0);
    this.footR = new THREE.Mesh(footGeo, footMat);
    this.footR.position.set(0.18, -0.32, 0);
    this.mesh.add(this.footL, this.footR);

    this.scene.add(this.mesh);

    this.animTime = Math.random() * Math.PI;
  }

  update(dt, player) {
    if (this.isDead) {
      this.deathTimer += dt;
      if (this.deathTimer > 0.45) {
        this.destroy();
      }
      return;
    }

    // Patrol logic
    this.vel.y += -28.0 * dt; // Gravity
    collision.resolveMovement(this, dt);

    // Reverse at patrol bounds or walls
    if (this.pos.x <= this.minX && this.vel.x < 0) {
      this.vel.x = Math.abs(this.vel.x);
      this.facingDir = 1;
    } else if (this.pos.x >= this.maxX && this.vel.x > 0) {
      this.vel.x = -Math.abs(this.vel.x);
      this.facingDir = -1;
    }

    // Foot waddle animation
    this.animTime += dt * 8.0;
    this.footL.position.y = -0.32 + Math.sin(this.animTime) * 0.06;
    this.footR.position.y = -0.32 - Math.sin(this.animTime) * 0.06;
    this.mesh.rotation.y = this.facingDir > 0 ? Math.PI / 2 : -Math.PI / 2;

    this.mesh.position.set(this.pos.x, this.pos.y, 0);

    // Player Interaction
    if (player && !player.isInvulnerable) {
      const boxA = { x: player.pos.x, y: player.pos.y, w: player.width, h: player.height };
      const boxB = { x: this.pos.x, y: this.pos.y, w: this.width, h: this.height };

      if (collision.checkOverlap(boxA, boxB)) {
        const isStarDash = gameState.powerUp.active && gameState.powerUp.type === 'STAR_DASH';

        // Check if player jumped on top of enemy (stomp)
        const playerBottom = player.pos.y - player.height / 2;
        const enemyTop = this.pos.y + this.height / 2 - 0.2;

        if (isStarDash) {
          // Instant defeat by Star Dash
          this.stompDefeat();
        } else if (player.vel.y < 0 && playerBottom >= enemyTop) {
          // Stomp!
          player.bounceFromEnemy();
          this.stompDefeat();
        } else {
          // Player hurt
          player.triggerHurt();
        }
      }
    }
  }

  stompDefeat() {
    if (this.isDead) return;
    this.isDead = true;
    this.deathTimer = 0;

    // Squash flat animation
    this.mesh.scale.set(1.4, 0.18, 1.4);
    this.mesh.position.y = this.pos.y - 0.25;

    gameState.addScore(200);
    this.particles.spawnStompPoof(this.pos.x, this.pos.y, 0);
    this.particles.showFloatingText('+200', this.pos.x, this.pos.y + 0.6, this.camera.camera);
  }

  destroy() {
    this.scene.remove(this.mesh);
  }
}

export class HopperEnemy {
  constructor(scene, particles, camera, x, y, patrolDistance = 4.0) {
    this.scene = scene;
    this.particles = particles;
    this.camera = camera;

    this.pos = new THREE.Vector3(x, y, 0);
    this.vel = new THREE.Vector3(-1.4, 0, 0);
    this.width = 0.8;
    this.height = 0.85;
    this.isGrounded = false;
    this.wasGrounded = false;

    this.minX = x - patrolDistance;
    this.maxX = x + patrolDistance;
    this.facingDir = -1;

    this.hopCooldown = 1.2 + Math.random() * 0.8;
    this.hopTimer = this.hopCooldown;

    this.isDead = false;
    this.deathTimer = 0;

    // 3D Model (Cute round bouncy creature with bunny ears)
    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.pos);

    const bodyGeo = new THREE.SphereGeometry(0.38, 12, 10);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0xab47bc }); // Cute purple
    this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    this.bodyMesh.position.y = 0.18;
    this.bodyMesh.castShadow = true;
    this.mesh.add(this.bodyMesh);

    // Cute bunny ears
    const earGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.42, 8);
    const earMat = new THREE.MeshLambertMaterial({ color: 0xce93d8 });
    this.earL = new THREE.Mesh(earGeo, earMat);
    this.earL.position.set(-0.14, 0.62, 0);
    this.earL.rotation.z = 0.2;
    this.earR = new THREE.Mesh(earGeo, earMat);
    this.earR.position.set(0.14, 0.62, 0);
    this.earR.rotation.z = -0.2;
    this.mesh.add(this.earL, this.earR);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.06, 6, 6);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x212121 });

    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.12, 0.25, 0.32);
    const pupilL = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), pupilMat);
    pupilL.position.set(-0.12, 0.25, 0.36);

    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.12, 0.25, 0.32);
    const pupilR = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), pupilMat);
    pupilR.position.set(0.12, 0.25, 0.36);

    this.mesh.add(eyeL, pupilL, eyeR, pupilR);
    this.scene.add(this.mesh);
  }

  update(dt, player) {
    if (this.isDead) {
      this.deathTimer += dt;
      if (this.deathTimer > 0.45) {
        this.destroy();
      }
      return;
    }

    // Hopping timer
    this.hopTimer -= dt;
    if (this.isGrounded && this.hopTimer <= 0) {
      this.vel.y = 8.5; // Jump up!
      this.hopTimer = this.hopCooldown;
      this.particles.spawnDust(this.pos.x, this.pos.y - this.height / 2, 0, 3, 0.2);
    }

    // Gravity & Movement
    this.vel.y += -28.0 * dt;
    collision.resolveMovement(this, dt);

    // Reverse patrol direction
    if (this.pos.x <= this.minX && this.vel.x < 0) {
      this.vel.x = Math.abs(this.vel.x);
      this.facingDir = 1;
    } else if (this.pos.x >= this.maxX && this.vel.x > 0) {
      this.vel.x = -Math.abs(this.vel.x);
      this.facingDir = -1;
    }

    this.mesh.rotation.y = this.facingDir > 0 ? Math.PI / 2 : -Math.PI / 2;
    this.mesh.position.set(this.pos.x, this.pos.y, 0);

    // Player Interaction
    if (player && !player.isInvulnerable) {
      const boxA = { x: player.pos.x, y: player.pos.y, w: player.width, h: player.height };
      const boxB = { x: this.pos.x, y: this.pos.y, w: this.width, h: this.height };

      if (collision.checkOverlap(boxA, boxB)) {
        const isStarDash = gameState.powerUp.active && gameState.powerUp.type === 'STAR_DASH';
        const playerBottom = player.pos.y - player.height / 2;
        const enemyTop = this.pos.y + this.height / 2 - 0.2;

        if (isStarDash) {
          this.stompDefeat();
        } else if (player.vel.y < 0 && playerBottom >= enemyTop) {
          player.bounceFromEnemy();
          this.stompDefeat();
        } else {
          player.triggerHurt();
        }
      }
    }
  }

  stompDefeat() {
    if (this.isDead) return;
    this.isDead = true;
    this.deathTimer = 0;

    this.mesh.scale.set(1.4, 0.18, 1.4);
    this.mesh.position.y = this.pos.y - 0.25;

    gameState.addScore(300);
    this.particles.spawnStompPoof(this.pos.x, this.pos.y, 0);
    this.particles.showFloatingText('+300', this.pos.x, this.pos.y + 0.6, this.camera.camera);
  }

  destroy() {
    this.scene.remove(this.mesh);
  }
}
