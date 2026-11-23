/**
 * Particles.js
 * 3D particle effects and floating in-game text notifications.
 */

import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.floatingTextContainer = document.getElementById('floating-text-container');

    // Shared reusable geometries and materials
    this.dustGeo = new THREE.SphereGeometry(0.12, 5, 5);
    this.dustMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 });

    this.sparkleGeo = new THREE.OctahedronGeometry(0.14, 0);
    this.sparkleMat = new THREE.MeshBasicMaterial({ color: 0xffeb3b });

    this.starMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });

    this.brickDebrisGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    this.brickDebrisMat = new THREE.MeshLambertMaterial({ color: 0xb75329 });

    this.confettiColors = [0xff1744, 0x00e676, 0x2979ff, 0xffea00, 0xd500f9, 0xff9100];
  }

  // --- Particle Spawners ---

  spawnDust(x, y, z = 0, count = 4, spread = 0.3) {
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.dustGeo, this.dustMat.clone());
      mesh.position.set(
        x + (Math.random() - 0.5) * spread,
        y + 0.05,
        z + (Math.random() - 0.5) * 0.2
      );
      mesh.scale.setScalar(0.6 + Math.random() * 0.6);
      this.scene.add(mesh);

      this.particles.push({
        mesh,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 1.5,
          0.8 + Math.random() * 1.2,
          (Math.random() - 0.5) * 0.5
        ),
        rotVel: new THREE.Vector3(),
        life: 0.35 + Math.random() * 0.2,
        maxLife: 0.5,
        type: 'dust'
      });
    }
  }

  spawnSparkles(x, y, z = 0, count = 8, color = 0xffeb3b) {
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: color });
      const mesh = new THREE.Mesh(this.sparkleGeo, mat);
      mesh.position.set(x, y, z);
      this.scene.add(mesh);

      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 1.8 + Math.random() * 2.2;

      this.particles.push({
        mesh,
        vel: new THREE.Vector3(
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          (Math.random() - 0.5) * 0.8
        ),
        rotVel: new THREE.Vector3(Math.random() * 8, Math.random() * 8, Math.random() * 8),
        life: 0.45 + Math.random() * 0.2,
        maxLife: 0.6,
        type: 'sparkle'
      });
    }
  }

  spawnBrickDebris(x, y, z = 0) {
    // 4 chunks flying into corners
    const directions = [
      { x: -2.2, y: 5.5 },
      { x: 2.2, y: 5.5 },
      { x: -1.6, y: 3.5 },
      { x: 1.6, y: 3.5 }
    ];

    directions.forEach(dir => {
      const mesh = new THREE.Mesh(this.brickDebrisGeo, this.brickDebrisMat);
      mesh.position.set(x + (Math.random() - 0.5) * 0.3, y + (Math.random() - 0.5) * 0.3, z);
      this.scene.add(mesh);

      this.particles.push({
        mesh,
        vel: new THREE.Vector3(
          dir.x + (Math.random() - 0.5) * 0.8,
          dir.y + (Math.random() - 0.5) * 0.8,
          (Math.random() - 0.5) * 1.5
        ),
        rotVel: new THREE.Vector3(Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5),
        gravity: -24,
        life: 0.8,
        maxLife: 0.8,
        type: 'debris'
      });
    });
  }

  spawnStompPoof(x, y, z = 0) {
    this.spawnDust(x, y, z, 6, 0.6);
    this.spawnSparkles(x, y, z, 6, 0xffd54f);
  }

  spawnConfetti(x, y, z = 0, count = 35) {
    const geo = new THREE.PlaneGeometry(0.2, 0.14);
    for (let i = 0; i < count; i++) {
      const color = this.confettiColors[Math.floor(Math.random() * this.confettiColors.length)];
      const mat = new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        x + (Math.random() - 0.5) * 4.0,
        y + 2 + Math.random() * 4.0,
        z + (Math.random() - 0.5) * 2.5
      );
      this.scene.add(mesh);

      this.particles.push({
        mesh,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 2.5,
          1.5 + Math.random() * 3.0,
          (Math.random() - 0.5) * 1.5
        ),
        rotVel: new THREE.Vector3(Math.random() * 8, Math.random() * 8, Math.random() * 8),
        gravity: -6.0,
        life: 2.2 + Math.random() * 1.0,
        maxLife: 3.2,
        type: 'confetti'
      });
    }
  }

  // --- Floating UI Text ---

  showFloatingText(text, worldX, worldY, camera) {
    if (!this.floatingTextContainer || !camera) return;

    // Project 3D coordinate to screen 2D
    const pos = new THREE.Vector3(worldX, worldY, 0);
    pos.project(camera);

    const screenX = (pos.x * 0.5 + 0.5) * window.innerWidth;
    const screenY = (-(pos.y * 0.5) + 0.5) * window.innerHeight;

    const el = document.createElement('div');
    el.className = 'floating-score';
    el.textContent = text;
    el.style.left = `${screenX}px`;
    el.style.top = `${screenY}px`;

    this.floatingTextContainer.appendChild(el);

    setTimeout(() => {
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    }, 850);
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        if (p.mesh.geometry && p.mesh.geometry !== this.dustGeo && p.mesh.geometry !== this.sparkleGeo && p.mesh.geometry !== this.brickDebrisGeo) {
          p.mesh.geometry.dispose();
        }
        if (p.mesh.material && p.mesh.material !== this.dustMat && p.mesh.material !== this.sparkleMat && p.mesh.material !== this.brickDebrisMat) {
          p.mesh.material.dispose();
        }
        this.particles.splice(i, 1);
        continue;
      }

      // Physics update
      if (p.gravity) {
        p.vel.y += p.gravity * dt;
      }
      p.mesh.position.addScaledVector(p.vel, dt);

      if (p.rotVel) {
        p.mesh.rotation.x += p.rotVel.x * dt;
        p.mesh.rotation.y += p.rotVel.y * dt;
        p.mesh.rotation.z += p.rotVel.z * dt;
      }

      // Fade / shrink
      const progress = p.life / p.maxLife;
      if (p.type === 'dust') {
        p.mesh.scale.setScalar(progress * 0.8);
      } else if (p.type === 'sparkle') {
        p.mesh.scale.setScalar(progress);
      }
    }
  }

  clear() {
    for (let p of this.particles) {
      this.scene.remove(p.mesh);
    }
    this.particles = [];
    if (this.floatingTextContainer) {
      this.floatingTextContainer.innerHTML = '';
    }
  }
}
