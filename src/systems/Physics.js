/**
 * Physics.js
 * Central physics constants and tuning configuration.
 */

export const PHYSICS_CONFIG = {
  fixedTimestep: 1 / 60,
  gravity: -30.0,
  maxFallSpeed: -18.0,

  // Player movement
  walkSpeed: 6.2,
  sprintSpeed: 9.4,
  starSpeed: 11.2,

  accelGround: 36.0,
  decelGround: 30.0,
  accelAir: 20.0,
  decelAir: 12.0,

  // Jump tuning
  jumpImpulse: 11.8,
  jumpHoldBoost: 21.0,
  maxJumpHoldTime: 0.22,
  coyoteTime: 0.12,
  jumpBufferTime: 0.14
};
