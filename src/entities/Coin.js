/**
 * Coin.js
 * Floating, spinning collectible golden coin.
 */

import * as THREE from 'three';
import { audio } from '../core/Audio.js';
import { gameState } from '../systems/GameState.js';

export class Coin {
  constructor(scene, particles, camera, x, y, z = 0) {
    this.scene = scene;
    this.particles = particles;
    this.camera = camera;
    this.initialY = y;
    this.pos = new THREE.Vector3(x, y, z);
    this.radius = 0.45;
    this.isCollected = false;

    // Visual Coin Mesh
    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.pos);

    // Thick golden cylinder coin
    const coinGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.1, 16);
    const coinMat = new THREE.MeshLambertMaterial({
      color: 0xffd700,
      emissive: 0xffa000,
      emissiveIntensity: 0.25
    });
    this.coinMesh = new THREE.Mesh(coinGeo, coinMat);
    this.coinMesh.rotation.x = Math.PI / 2; // Face forward
    this.mesh.add(this.coinMesh);

    // Star imprint inside coin
    const starGeo = new THREE.OctahedronGeometry(0.18, 0);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xfff59d });
    const starMesh = new THREE.Mesh(starGeo, starMat);
    starMesh.scale.set(1, 1, 0.4);
    this.mesh.add(starMesh);

    this.scene.add(this.mesh);

    this.animTime = Math.random() * Math.PI * 2;
    this.collectAnim = 0;
  }

  update(dt, player) {
    if (this.isCollected) {
      if (this.collectAnim < 1.0) {
        this.collectAnim += dt * 4.0;
        this.mesh.position.y += dt * 5.0;
        this.mesh.scale.setScalar(Math.max(0, 1.0 - this.collectAnim));
        if (this.collectAnim >= 1.0) {
          this.scene.remove(this.mesh);
        }
      }
      return;
    }

    // Floating bob & spin
    this.animTime += dt * 3.5;
    this.mesh.rotation.y += dt * 3.2;
    this.mesh.position.y = this.initialY + Math.sin(this.animTime) * 0.12;
    this.pos.y = this.mesh.position.y;

    // Collision check with player
    if (player) {
      const dx = player.pos.x - this.pos.x;
      const dy = (player.pos.y + player.height / 2) - this.pos.y;
      const dist = Math.hypot(dx, dy);

      if (dist < this.radius + 0.45) {
        this.collect();
      }
    }
  }

  collect() {
    if (this.isCollected) return;
    this.isCollected = true;
    audio.playCoin();
    gameState.addCoin();
    this.particles.spawnSparkles(this.pos.x, this.pos.y, 0, 8, 0xffeb3b);
    this.particles.showFloatingText('+100', this.pos.x, this.pos.y + 0.5, this.camera.camera);
  }

  destroy() {
    this.scene.remove(this.mesh);
  }
}
