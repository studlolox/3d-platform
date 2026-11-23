/**
 * Camera.js
 * 2.5D perspective camera controller with look-ahead easing, screen shake, and boundary clamping.
 */

import * as THREE from 'three';

export class GameCamera {
  constructor(aspect = window.innerWidth / window.innerHeight) {
    this.camera = new THREE.PerspectiveCamera(48, aspect, 0.1, 300);

    // Camera offset relative to player
    this.offset = new THREE.Vector3(0, 3.8, 14.5);
    this.lookOffset = new THREE.Vector3(0, 1.4, 0);

    // Target position for smooth following
    this.targetPos = new THREE.Vector3();
    this.currentPos = new THREE.Vector3();
    this.lookTarget = new THREE.Vector3();

    // Look-ahead
    this.lookAhead = 1.2;
    this.currentLookAhead = 0;

    // Shake
    this.shakeIntensity = 0;
    this.shakeDecay = 5.0; // Per second decay

    // Bounds
    this.bounds = {
      minX: 4,
      maxX: 160,
      minY: 3.5,
      maxY: 30
    };

    // Smooth damping factors
    this.followSpeedX = 6.0;
    this.followSpeedY = 4.5;
  }

  setBounds(minX, maxX, minY = 3.5, maxY = 30) {
    this.bounds.minX = minX;
    this.bounds.maxX = maxX;
    this.bounds.minY = minY;
    this.bounds.maxY = maxY;
  }

  reset(playerPos) {
    this.targetPos.set(playerPos.x, Math.max(playerPos.y, this.bounds.minY), 0);
    this.currentPos.copy(this.targetPos).add(this.offset);
    this.camera.position.copy(this.currentPos);
    this.lookTarget.copy(this.targetPos).add(this.lookOffset);
    this.camera.lookAt(this.lookTarget);
    this.shakeIntensity = 0;
  }

  addShake(amount = 0.4) {
    this.shakeIntensity = Math.min(this.shakeIntensity + amount, 1.2);
  }

  update(playerPos, playerFacingDir, dt) {
    if (!playerPos) return;

    // Smooth look-ahead based on facing direction
    const targetAhead = playerFacingDir * this.lookAhead;
    this.currentLookAhead += (targetAhead - this.currentLookAhead) * Math.min(dt * 4.0, 1.0);

    // Compute target focus point
    let desiredX = playerPos.x + this.currentLookAhead;
    let desiredY = Math.max(playerPos.y, this.bounds.minY);

    // Clamp within level boundaries
    desiredX = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, desiredX));
    desiredY = Math.max(this.bounds.minY, Math.min(this.bounds.maxY, desiredY));

    // Smooth lerp
    this.targetPos.x += (desiredX - this.targetPos.x) * Math.min(dt * this.followSpeedX, 1.0);
    this.targetPos.y += (desiredY - this.targetPos.y) * Math.min(dt * this.followSpeedY, 1.0);

    // Apply offset
    this.currentPos.x = this.targetPos.x + this.offset.x;
    this.currentPos.y = this.targetPos.y + this.offset.y;
    this.currentPos.z = this.targetPos.z + this.offset.z;

    // Screen Shake
    if (this.shakeIntensity > 0.001) {
      const shakeX = (Math.random() - 0.5) * 2 * this.shakeIntensity;
      const shakeY = (Math.random() - 0.5) * 2 * this.shakeIntensity;
      this.camera.position.set(
        this.currentPos.x + shakeX,
        this.currentPos.y + shakeY,
        this.currentPos.z
      );
      this.shakeIntensity = Math.max(0, this.shakeIntensity - this.shakeDecay * dt);
    } else {
      this.camera.position.copy(this.currentPos);
    }

    // Look at target
    this.lookTarget.set(
      this.targetPos.x,
      this.targetPos.y + this.lookOffset.y,
      0
    );
    this.camera.lookAt(this.lookTarget);
  }

  resize(width, height) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
}
