/**
 * Collision.js
 * 2.5D AABB Collision detection and resolution.
 */

import * as THREE from 'three';

export class BoundingBox2D {
  constructor(x, y, w, h) {
    this.x = x; // Center x
    this.y = y; // Center y
    this.w = w; // Width
    this.h = h; // Height
  }

  get minX() { return this.x - this.w / 2; }
  get maxX() { return this.x + this.w / 2; }
  get minY() { return this.y - this.h / 2; }
  get maxY() { return this.y + this.h / 2; }

  intersects(other) {
    return (
      this.minX < other.maxX &&
      this.maxX > other.minX &&
      this.minY < other.maxY &&
      this.maxY > other.minY
    );
  }
}

export class CollisionSystem {
  constructor() {
    this.colliders = []; // Static and dynamic solid platforms / blocks
    this.interactiveBlocks = []; // Mystery, breakable, and solid blocks
    this.movingPlatforms = [];
  }

  clear() {
    this.colliders = [];
    this.interactiveBlocks = [];
    this.movingPlatforms = [];
  }

  addCollider(collider) {
    // collider: { x, y, w, h, type, mesh, blockRef }
    this.colliders.push(collider);
  }

  addInteractiveBlock(block) {
    this.interactiveBlocks.push(block);
  }

  addMovingPlatform(platform) {
    this.movingPlatforms.push(platform);
  }

  /**
   * Resolves entity movement against colliders using vertical resolution followed by horizontal resolution.
   * entity: { pos, vel, width, height, isGrounded, wasGrounded, standingOnPlatform }
   */
  resolveMovement(entity, dt) {
    const halfW = entity.width / 2;
    const halfH = entity.height / 2;

    // Check if riding a moving platform
    if (entity.standingOnPlatform) {
      entity.pos.x += entity.standingOnPlatform.deltaX;
      entity.pos.y += entity.standingOnPlatform.deltaY;
    }

    const prevX = entity.pos.x;
    const prevY = entity.pos.y;
    const prevTop = prevY + halfH;
    const prevBottom = prevY - halfH;

    // --- VERTICAL PASS FIRST ---
    entity.pos.y += entity.vel.y * dt;
    let vBox = new BoundingBox2D(entity.pos.x, entity.pos.y, entity.width - 0.1, entity.height);

    let foundGround = false;
    entity.standingOnPlatform = null;

    for (let c of this.colliders) {
      const cBox = new BoundingBox2D(c.x, c.y, c.w, c.h);
      if (vBox.intersects(cBox)) {
        if (entity.vel.y <= 0) {
          // Landing on top of a surface — only if entity came from above the surface
          if (prevBottom >= cBox.maxY - 0.18) {
            entity.pos.y = cBox.maxY + halfH;
            entity.vel.y = 0;
            foundGround = true;

            if (c.isMovingPlatform) {
              entity.standingOnPlatform = c;
            }
            vBox.y = entity.pos.y;
          }
        } else if (entity.vel.y > 0) {
          // Bumping ceiling / bottom of block — ONLY if entity's head was truly below the bottom of the block
          const tolerance = Math.max(0.12, Math.abs(entity.vel.y * dt) + 0.04);
          if (prevTop <= cBox.minY + tolerance) {
            entity.pos.y = cBox.minY - halfH;
            entity.vel.y = 0;

            // Trigger hit on block if interactive
            if (c.blockRef && typeof c.blockRef.onHitFromBelow === 'function') {
              c.blockRef.onHitFromBelow(entity);
            }
            vBox.y = entity.pos.y;
          }
          // If prevTop was already above cBox.minY, this is a side-wall graze during upward movement,
          // so do NOT snap down to the underside! The horizontal pass handles wall repulsion.
        }
      }
    }

    entity.wasGrounded = entity.isGrounded;
    entity.isGrounded = foundGround;

    // --- HORIZONTAL PASS ---
    entity.pos.x += entity.vel.x * dt;

    // Lift foot margin so horizontal test doesn't snag on the ground the entity is walking on
    const footMargin = 0.24;
    let hBox = new BoundingBox2D(
      entity.pos.x,
      entity.pos.y + footMargin / 2,
      entity.width - 0.08,
      entity.height - footMargin
    );

    for (let c of this.colliders) {
      const cBox = new BoundingBox2D(c.x, c.y, c.w, c.h);
      if (hBox.intersects(cBox)) {
        if (entity.vel.x > 0) {
          // Hit from left
          entity.pos.x = cBox.minX - halfW;
          entity.vel.x = 0;
        } else if (entity.vel.x < 0) {
          // Hit from right
          entity.pos.x = cBox.maxX + halfW;
          entity.vel.x = 0;
        } else if (prevX < cBox.x) {
          entity.pos.x = cBox.minX - halfW;
          entity.vel.x = 0;
        } else {
          entity.pos.x = cBox.maxX + halfW;
          entity.vel.x = 0;
        }
        hBox.x = entity.pos.x;
      }
    }
  }

  /**
   * Check simple overlap between two 2D boxes
   */
  checkOverlap(boxA, boxB) {
    return (
      boxA.x - boxA.w / 2 < boxB.x + boxB.w / 2 &&
      boxA.x + boxA.w / 2 > boxB.x - boxB.w / 2 &&
      boxA.y - boxA.h / 2 < boxB.y + boxB.h / 2 &&
      boxA.y + boxA.h / 2 > boxB.y - boxB.h / 2
    );
  }
}

export const collision = new CollisionSystem();
