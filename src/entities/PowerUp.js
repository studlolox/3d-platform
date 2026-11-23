/**
 * PowerUp.js
 * Collectible Star Dash power-up entity.
 */

import * as THREE from 'three';
import { audio } from '../core/Audio.js';
import { gameState } from '../systems/GameState.js';
import { collision } from '../world/Collision.js';

export class StarPowerUp {
  constructor(scene, particles, camera, x, y, z = 0) {
    this.scene = scene;
    this.particles = particles;
    this.camera = camera;

    this.pos = new THREE.Vector3(x, y, z);
    this.vel = new THREE.Vector3(2.0, 7.5, 0); // Emerge upward and move
    this.width = 0.7;
    this.height = 0.7;
    this.isGrounded = false;
    this.wasGrounded = false;
    this.isCollected = false;
    this.lifeTimer = 20.0; // Despawn after 20 seconds if not collected

    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.pos);

    // Create 3D Star
    const starShape = new THREE.Shape();
    const points = 5;
    const outerR = 0.42;
    const innerR = 0.20;

    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) starShape.moveTo(px, py);
      else starShape.lineTo(px, py);
    }
    starShape.closePath();

    const extrudeSettings = { depth: 0.18, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.04, bevelThickness: 0.04 };
    const starGeo = new THREE.ExtrudeGeometry(starShape, extrudeSettings);
    starGeo.center();

    const starMat = new THREE.MeshLambertMaterial({
      color: 0xffea00,
      emissive: 0xffb300,
      emissiveIntensity: 0.4
    });

    this.starMesh = new THREE.Mesh(starGeo, starMat);
    this.mesh.add(this.starMesh);

    // Cute eyes
    const eyeGeo = new THREE.SphereGeometry(0.04, 6, 6);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x212121 });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.08, 0.04, 0.14);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.08, 0.04, 0.14);
    this.mesh.add(eyeL, eyeR);

    this.scene.add(this.mesh);
  }

  update(dt, player) {
    if (this.isCollected) return;

    this.lifeTimer -= dt;
    if (this.lifeTimer <= 0) {
      this.destroy();
      return;
    }

    // Bounce physics
    this.vel.y += -25.0 * dt; // Gravity
    collision.resolveMovement(this, dt);

    if (this.isGrounded) {
      this.vel.y = 8.5; // Bounce continuously
      this.isGrounded = false;
    }

    this.starMesh.rotation.z += dt * 3.5;
    this.mesh.position.set(this.pos.x, this.pos.y, 0);

    // Collect check
    if (player) {
      const dx = player.pos.x - this.pos.x;
      const dy = (player.pos.y + player.height / 2) - this.pos.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 0.9) {
        this.collect();
      }
    }
  }

  collect() {
    if (this.isCollected) return;
    this.isCollected = true;
    audio.playPowerUp();
    gameState.activatePowerUp('STAR_DASH', 10);
    this.particles.spawnSparkles(this.pos.x, this.pos.y, 0, 16, 0xffea00);
    this.particles.showFloatingText('STAR DASH! ⭐', this.pos.x, this.pos.y + 0.8, this.camera.camera);
    this.destroy();
  }

  destroy() {
    this.scene.remove(this.mesh);
  }
}
