/**
 * Player.js
 * Stylized 3D playable character with responsive physics, variable jump height,
 * coyote time, jump buffering, squash-and-stretch, and procedural animations.
 */

import * as THREE from 'three';
import { input } from '../core/Input.js';
import { audio } from '../core/Audio.js';
import { collision } from '../world/Collision.js';
import { gameState, STATES } from '../systems/GameState.js';

export class Player {
  constructor(scene, particles, camera) {
    this.scene = scene;
    this.particles = particles;
    this.gameCamera = camera;

    // Dimensions for 2.5D AABB
    this.width = 0.82;
    this.height = 1.35;
    this.depth = 0.82;

    // Physics parameters
    this.pos = new THREE.Vector3(2.0, 3.5, 0);
    this.vel = new THREE.Vector3(0, 0, 0);

    this.walkSpeed = 6.2;
    this.sprintSpeed = 9.4;
    this.starSpeed = 11.2;

    this.accelGround = 36.0;
    this.decelGround = 30.0;
    this.accelAir = 20.0;
    this.decelAir = 12.0;

    this.gravity = -30.0;
    this.maxFallSpeed = -18.0;

    // Jump tuning — classic platformer curve: tap hop (Y≈5.0), full leap (Y≈6.55) to land cleanly on blocks (Y=6.38)
    this.jumpImpulse = 11.8;
    this.jumpHoldBoost = 21.0; // Sustained boost during hold
    this.maxJumpHoldTime = 0.22; // Maximum hold time for peak jump height

    // Coyote time & ground state
    this.isGrounded = false;
    this.wasGrounded = false;
    this.coyoteTime = 0.12;
    this.coyoteTimer = 0;
    this.jumpHoldTimer = 0;
    this.isJumping = false;
    this.standingOnPlatform = null;

    // Visual & Animation state
    this.facingDir = 1; // 1 for right, -1 for left
    this.runAngle = Math.PI * 0.35; // 3/4 camera-facing perspective (~63 deg) for clear facial visibility
    this.targetRotationY = this.runAngle;
    this.animTime = 0;
    this.squashStretch = new THREE.Vector3(1, 1, 1);

    // Invulnerability / Hurt
    this.isInvulnerable = false;
    this.invulnerableTimer = 0;
    this.invulnerableDuration = 2.0;

    // Star Dash effect
    this.starTrailTimer = 0;

    // 3D Model Hierarchy
    this.mesh = new THREE.Group();
    this.createModel();
    // Offset modelRoot so that the bottom of the character's boots aligns exactly with the bottom of the collision box (-height / 2)
    this.modelRoot.position.y = -this.height / 2;
    this.scene.add(this.mesh);
  }

  createModel() {
    // Stylized Cute Adventurer (Round head, cap with visor, bright overalls, boots, gloves)
    this.modelRoot = new THREE.Group();
    this.mesh.add(this.modelRoot);

    // Shared stylized materials
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xffd5b8 });
    const capMat = new THREE.MeshLambertMaterial({ color: 0xef5350 }); // Bright cherry red
    const visorMat = new THREE.MeshLambertMaterial({ color: 0xb71c1c });
    const shirtMat = new THREE.MeshLambertMaterial({ color: 0xef5350 });
    const overallsMat = new THREE.MeshLambertMaterial({ color: 0x1e88e5 }); // Vibrant cobalt blue
    const gloveMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const bootMat = new THREE.MeshLambertMaterial({ color: 0x6d4c41 }); // Warm brown leather
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const eyePupilMat = new THREE.MeshBasicMaterial({ color: 0x1565c0 });
    const cheekMat = new THREE.MeshBasicMaterial({ color: 0xff8a80, transparent: true, opacity: 0.6 });

    // --- BODY & OVERALLS ---
    this.bodyGroup = new THREE.Group();
    this.bodyGroup.position.set(0, 0.48, 0);
    this.modelRoot.add(this.bodyGroup);

    // Torso
    const torsoGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.42, 12);
    this.torsoMesh = new THREE.Mesh(torsoGeo, overallsMat);
    this.torsoMesh.castShadow = true;
    this.bodyGroup.add(this.torsoMesh);

    // Shirt upper collar
    const collarGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.1, 12);
    const collarMesh = new THREE.Mesh(collarGeo, shirtMat);
    collarMesh.position.y = 0.18;
    this.bodyGroup.add(collarMesh);

    // Yellow overall buttons
    const btnGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.04, 8);
    const btnMat = new THREE.MeshBasicMaterial({ color: 0xffeb3b });
    const btnL = new THREE.Mesh(btnGeo, btnMat);
    btnL.rotation.x = Math.PI / 2;
    btnL.position.set(-0.1, 0.1, 0.25);
    const btnR = btnL.clone();
    btnR.position.x = 0.1;
    this.bodyGroup.add(btnL, btnR);

    // --- HEAD ---
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.88, 0);
    this.modelRoot.add(this.headGroup);

    // Oversized round cute head
    const headGeo = new THREE.SphereGeometry(0.35, 16, 14);
    this.headMesh = new THREE.Mesh(headGeo, skinMat);
    this.headMesh.castShadow = true;
    this.headGroup.add(this.headMesh);

    // Cute cap — vibrant red dome
    const capGeo = new THREE.SphereGeometry(0.37, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58);
    const capMesh = new THREE.Mesh(capGeo, capMat);
    capMesh.position.set(0, 0.04, -0.02);
    this.headGroup.add(capMesh);

    // Cute dark chestnut hair at the back of the head (-Z)
    const hairMat = new THREE.MeshLambertMaterial({ color: 0x4e342e });
    const hairGeo = new THREE.SphereGeometry(0.22, 10, 8);
    hairGeo.scale(1.2, 0.9, 0.8);
    const hairMesh = new THREE.Mesh(hairGeo, hairMat);
    hairMesh.position.set(0, -0.06, -0.22);
    this.headGroup.add(hairMesh);

    // Cap visor (brim) — extends forward along +Z over the eyes
    const visorGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.04, 12, 1, false, 0, Math.PI);
    const visorMesh = new THREE.Mesh(visorGeo, visorMat);
    visorMesh.rotation.y = -Math.PI / 2;
    visorMesh.position.set(0, 0.06, 0.20);
    this.headGroup.add(visorMesh);

    // Expressive cartoon eyes — positioned cleanly on the front face (+Z)
    const eyeGeo = new THREE.SphereGeometry(0.08, 10, 10);
    eyeGeo.scale(1, 1.25, 0.6);

    const pupilGeo = new THREE.SphereGeometry(0.045, 8, 8);
    pupilGeo.scale(1, 1.15, 0.6);

    // Left Eye
    const eyeL = new THREE.Mesh(eyeGeo, eyeWhiteMat);
    eyeL.position.set(-0.11, 0.02, 0.32);
    const pupilL = new THREE.Mesh(pupilGeo, eyePupilMat);
    pupilL.position.set(-0.11, 0.02, 0.35);
    this.headGroup.add(eyeL, pupilL);

    // Right Eye
    const eyeR = new THREE.Mesh(eyeGeo, eyeWhiteMat);
    eyeR.position.set(0.11, 0.02, 0.32);
    const pupilR = new THREE.Mesh(pupilGeo, eyePupilMat);
    pupilR.position.set(0.11, 0.02, 0.35);
    this.headGroup.add(eyeR, pupilR);

    // Rosy cheeks
    const cheekGeo = new THREE.SphereGeometry(0.06, 8, 6);
    cheekGeo.scale(1.2, 0.6, 0.3);
    const cheekL = new THREE.Mesh(cheekGeo, cheekMat);
    cheekL.position.set(-0.20, -0.08, 0.28);
    const cheekR = new THREE.Mesh(cheekGeo, cheekMat);
    cheekR.position.set(0.20, -0.08, 0.28);
    this.headGroup.add(cheekL, cheekR);

    // --- ARMS ---
    const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.26, 8);
    const handGeo = new THREE.SphereGeometry(0.1, 8, 8);

    // Left Arm
    this.armL = new THREE.Group();
    this.armL.position.set(-0.32, 0.64, 0);
    const armLMesh = new THREE.Mesh(armGeo, shirtMat);
    armLMesh.position.y = -0.12;
    const handLMesh = new THREE.Mesh(handGeo, gloveMat);
    handLMesh.position.y = -0.25;
    this.armL.add(armLMesh, handLMesh);
    this.modelRoot.add(this.armL);

    // Right Arm
    this.armR = new THREE.Group();
    this.armR.position.set(0.32, 0.64, 0);
    const armRMesh = new THREE.Mesh(armGeo, shirtMat);
    armRMesh.position.y = -0.12;
    const handRMesh = new THREE.Mesh(handGeo, gloveMat);
    handRMesh.position.y = -0.25;
    this.armR.add(armRMesh, handRMesh);
    this.modelRoot.add(this.armR);

    // --- LEGS ---
    const legGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.24, 8);
    const bootGeo = new THREE.BoxGeometry(0.2, 0.16, 0.28);

    // Left Leg
    this.legL = new THREE.Group();
    this.legL.position.set(-0.15, 0.32, 0);
    const legLMesh = new THREE.Mesh(legGeo, overallsMat);
    legLMesh.position.y = -0.1;
    const bootLMesh = new THREE.Mesh(bootGeo, bootMat);
    bootLMesh.position.set(0, -0.24, 0.04);
    this.legL.add(legLMesh, bootLMesh);
    this.modelRoot.add(this.legL);

    // Right Leg
    this.legR = new THREE.Group();
    this.legR.position.set(0.15, 0.32, 0);
    const legRMesh = new THREE.Mesh(legGeo, overallsMat);
    legRMesh.position.y = -0.1;
    const bootRMesh = new THREE.Mesh(bootGeo, bootMat);
    bootRMesh.position.set(0, -0.24, 0.04);
    this.legR.add(legRMesh, bootRMesh);
    this.modelRoot.add(this.legR);

    // --- STAR DASH AURA (Hidden by default) ---
    this.starAura = new THREE.Group();
    const starRingGeo = new THREE.TorusGeometry(0.65, 0.06, 8, 24);
    const starRingMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
    this.starRingMesh = new THREE.Mesh(starRingGeo, starRingMat);
    this.starRingMesh.rotation.x = Math.PI / 2;
    this.starRingMesh.position.y = 0.6;
    this.starAura.add(this.starRingMesh);
    this.starAura.visible = false;
    this.mesh.add(this.starAura);
  }

  reset(spawnPos = { x: 2.0, y: 3.5, z: 0 }) {
    this.pos.set(spawnPos.x, spawnPos.y, spawnPos.z);
    this.vel.set(0, 0, 0);
    this.facingDir = 1;
    this.targetRotationY = this.runAngle;
    this.modelRoot.rotation.y = this.targetRotationY;
    this.squashStretch.set(1, 1, 1);
    this.isJumping = false;
    this.isGrounded = false;
    this.standingOnPlatform = null;
    this.mesh.position.copy(this.pos);
    this.mesh.visible = true;
    this.isInvulnerable = false;
    this.invulnerableTimer = 0;
  }

  triggerHurt() {
    if (this.isInvulnerable) return false;

    const result = gameState.takeDamage();
    if (result === false) return false; // Star dash protected

    audio.playHurt();
    this.gameCamera.addShake(0.5);
    this.particles.spawnSparkles(this.pos.x, this.pos.y + 0.6, 0, 10, 0xff5252);

    if (result === 'GAME_OVER') {
      gameState.setState(STATES.GAME_OVER);
    } else {
      // Temporary knockback and invulnerability blink
      this.vel.y = 8.0;
      this.vel.x = -this.facingDir * 4.0;
      this.isInvulnerable = true;
      this.invulnerableTimer = this.invulnerableDuration;
    }
    return true;
  }

  bounceFromEnemy() {
    this.vel.y = 12.0;
    this.isJumping = true;
    this.jumpHoldTimer = 0.1;
    audio.playStomp();
    this.gameCamera.addShake(0.25);
    this.squashStretch.set(1.25, 0.75, 1.25);
  }

  updatePhysics(dt) {
    // 1. Horizontal Input & Acceleration
    const moveLeft = input.isLeft();
    const moveRight = input.isRight();
    const isSprinting = input.isSprint();
    const isStarDash = gameState.powerUp.active && gameState.powerUp.type === 'STAR_DASH';

    let targetSpeed = this.walkSpeed;
    if (isStarDash) {
      targetSpeed = this.starSpeed;
    } else if (isSprinting) {
      targetSpeed = this.sprintSpeed;
    }

    let inputX = 0;
    if (moveLeft && !moveRight) {
      inputX = -1;
      this.facingDir = -1;
      this.targetRotationY = -this.runAngle;
    } else if (moveRight && !moveLeft) {
      inputX = 1;
      this.facingDir = 1;
      this.targetRotationY = this.runAngle;
    }

    const accel = this.isGrounded ? this.accelGround : this.accelAir;
    const decel = this.isGrounded ? this.decelGround : this.decelAir;

    if (inputX !== 0) {
      // Accelerating
      const targetVelX = inputX * targetSpeed;
      if (Math.sign(this.vel.x) !== inputX && Math.abs(this.vel.x) > 1.0) {
        // Quick turn friction
        this.vel.x += inputX * decel * 1.5 * dt;
        if (this.isGrounded) {
          this.particles.spawnDust(this.pos.x, this.pos.y - this.height / 2, 0, 1, 0.1);
        }
      } else {
        this.vel.x += (targetVelX - this.vel.x) * Math.min(accel * dt, 1.0);
      }
    } else {
      // Decelerating / friction
      if (Math.abs(this.vel.x) > 0.05) {
        const sign = Math.sign(this.vel.x);
        this.vel.x -= sign * decel * dt;
        if (Math.sign(this.vel.x) !== sign) {
          this.vel.x = 0;
        }
      } else {
        this.vel.x = 0;
      }
    }

    // 2. Coyote Time Management
    if (this.isGrounded) {
      this.coyoteTimer = this.coyoteTime;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    }

    // 3. Jump Initiation (with Jump Buffering & Coyote Time)
    const wantsJump = input.hasBufferedJump() || input.justPressed.jump;

    if (wantsJump && (this.isGrounded || this.coyoteTimer > 0)) {
      this.vel.y = this.jumpImpulse;
      this.isGrounded = false;
      this.coyoteTimer = 0;
      this.isJumping = true;
      this.jumpHoldTimer = 0;
      input.consumeBufferedJump();

      audio.playJump();
      this.particles.spawnDust(this.pos.x, this.pos.y - this.height / 2, 0, 5, 0.4);

      // Jump stretch animation
      this.squashStretch.set(0.8, 1.3, 0.8);
    }

    // 4. Variable Jump Height (Hold button for higher jump)
    if (this.isJumping && input.isJumpHeld()) {
      if (this.jumpHoldTimer < this.maxJumpHoldTime) {
        this.vel.y += this.jumpHoldBoost * dt;
        this.jumpHoldTimer += dt;
      } else {
        this.isJumping = false;
      }
    }

    if (!input.isJumpHeld()) {
      this.isJumping = false;
    }

    // 5. Gravity
    this.vel.y += this.gravity * dt;
    if (this.vel.y < this.maxFallSpeed) {
      this.vel.y = this.maxFallSpeed;
    }

    // 6. Collision Resolution (AABB passes)
    collision.resolveMovement(this, dt);

    // 7. Landing squash & stretch detection
    if (!this.wasGrounded && this.isGrounded) {
      // Just landed!
      this.squashStretch.set(1.3, 0.7, 1.3);
      this.particles.spawnDust(this.pos.x, this.pos.y - this.height / 2, 0, 4, 0.35);
      this.isJumping = false;
    }

    // 8. Pit fall check (fell into abyss)
    if (this.pos.y < -6.0) {
      this.triggerHurt();
      // Respawn at checkpoint
      this.pos.set(gameState.checkpoint.x, gameState.checkpoint.y, gameState.checkpoint.z);
      this.vel.set(0, 0, 0);
      this.isInvulnerable = true;
      this.invulnerableTimer = this.invulnerableDuration;
    }

    // 9. Invulnerability blink timer
    if (this.isInvulnerable) {
      this.invulnerableTimer -= dt;
      if (this.invulnerableTimer <= 0) {
        this.isInvulnerable = false;
        this.modelRoot.visible = true;
      } else {
        // Fast blink
        this.modelRoot.visible = Math.floor(this.invulnerableTimer * 15) % 2 === 0;
      }
    } else {
      this.modelRoot.visible = true;
    }

    // 10. Star Dash Particle Trail & Aura
    this.starAura.visible = isStarDash;
    if (isStarDash) {
      this.starRingMesh.rotation.z += dt * 6.0;
      this.starTrailTimer += dt;
      if (this.starTrailTimer > 0.08) {
        this.starTrailTimer = 0;
        this.particles.spawnSparkles(this.pos.x, this.pos.y + 0.5, 0, 2, 0xffeb3b);
      }
    }
  }

  updateAnimations(dt) {
    // Smooth model rotation towards facing direction
    let diff = this.targetRotationY - this.modelRoot.rotation.y;
    // Normalize diff to -PI .. PI
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    this.modelRoot.rotation.y += diff * Math.min(dt * 15.0, 1.0);

    // Squash & stretch recovery towards (1, 1, 1)
    this.squashStretch.x += (1.0 - this.squashStretch.x) * Math.min(dt * 12.0, 1.0);
    this.squashStretch.y += (1.0 - this.squashStretch.y) * Math.min(dt * 12.0, 1.0);
    this.squashStretch.z += (1.0 - this.squashStretch.z) * Math.min(dt * 12.0, 1.0);
    this.modelRoot.scale.copy(this.squashStretch);

    // Procedural animation cycles
    const horizontalSpeed = Math.abs(this.vel.x);

    if (this.isGrounded) {
      if (horizontalSpeed > 0.4) {
        // RUNNING ANIMATION
        const runFreq = horizontalSpeed * 2.2;
        this.animTime += dt * runFreq;

        const legAngle = Math.sin(this.animTime) * 0.65;
        this.legL.rotation.x = legAngle;
        this.legR.rotation.x = -legAngle;

        this.armL.rotation.x = -legAngle * 0.8;
        this.armR.rotation.x = legAngle * 0.8;

        // Torso & head bob
        this.bodyGroup.position.y = 0.48 + Math.abs(Math.sin(this.animTime * 2)) * 0.06;
        this.headGroup.position.y = 0.88 + Math.abs(Math.sin(this.animTime * 2)) * 0.06;

        // Footstep dust
        if (Math.abs(Math.sin(this.animTime)) > 0.95 && Math.random() < 0.25) {
          this.particles.spawnDust(this.pos.x, this.pos.y - this.height / 2, 0, 1, 0.15);
        }
      } else {
        // IDLE BREATHING
        this.animTime += dt * 3.0;

        this.legL.rotation.x = 0;
        this.legR.rotation.x = 0;
        this.armL.rotation.x = Math.sin(this.animTime) * 0.08;
        this.armR.rotation.x = -Math.sin(this.animTime) * 0.08;

        const breathe = Math.sin(this.animTime) * 0.03;
        this.bodyGroup.position.y = 0.48 + breathe;
        this.headGroup.position.y = 0.88 + breathe * 1.5;
      }
    } else {
      // AIRBORNE ANIMATION (Jumping / Falling)
      if (this.vel.y > 0) {
        // Upward jump pose: arms raised high, legs slightly bent
        this.armL.rotation.x = -Math.PI * 0.75;
        this.armR.rotation.x = -Math.PI * 0.75;
        this.legL.rotation.x = 0.4;
        this.legR.rotation.x = -0.2;
      } else {
        // Falling pose: arms spreading, legs reaching down
        this.armL.rotation.x = -Math.PI * 0.3;
        this.armR.rotation.x = -Math.PI * 0.3;
        this.legL.rotation.x = -0.2;
        this.legR.rotation.x = 0.2;
      }
    }

    // Sync 3D mesh position
    this.mesh.position.set(this.pos.x, this.pos.y, 0);
  }

  playVictoryPose(dt) {
    this.animTime += dt * 8.0;
    this.mesh.rotation.y += dt * 4.0;
    this.armL.rotation.x = -Math.PI * 0.85;
    this.armR.rotation.x = -Math.PI * 0.85;
    this.bodyGroup.position.y = 0.48 + Math.abs(Math.sin(this.animTime)) * 0.15;
    this.headGroup.position.y = 0.88 + Math.abs(Math.sin(this.animTime)) * 0.2;
  }
}
