/**
 * Level1_2.js
 * World 1-2: "Underground Cavern"
 * Subterranean cave environment with lower ceilings, crystal stalactites,
 * moving elevator platforms over bottomless abyss, and hopping creature hazards.
 */

export const Level1_2 = {
  key: '1-2',
  name: 'Underground Cavern',
  world: 1,
  level: 2,
  bounds: { minX: 4, maxX: 148 },
  spawn: { x: 2.0, y: 3.5, z: 0 },
  theme: {
    skyColor: 0x111322,
    fogColor: 0x1a1d36,
    fogDensity: 0.012,
    ambientLight: { color: 0x7986cb, groundColor: 0x282a36, intensity: 0.65 },
    sunLight: { color: 0x80deea, intensity: 1.05 },
    materials: {
      platformTop: 0x455a64,    // Cool slate stone
      platformBody: 0x263238,   // Deep cavern bedrock
      rock: 0x37474f,
      crystal: 0x00e5ff,
      mushroomCap: 0xab47bc,
      mushroomStem: 0xd1c4e9
    },
    biome: 'cavern'
  },
  scenery: {
    stalactites: [
      { x: 8, y: 11, z: -4, h: 4.5, r: 0.9 },
      { x: 22, y: 12, z: -5, h: 5.5, r: 1.2 },
      { x: 36, y: 10.5, z: -4, h: 3.8, r: 0.8 },
      { x: 50, y: 11.5, z: -6, h: 5.0, r: 1.1 },
      { x: 72, y: 12, z: -5, h: 6.0, r: 1.3 },
      { x: 92, y: 11, z: -4, h: 4.2, r: 0.9 },
      { x: 112, y: 12.5, z: -6, h: 5.8, r: 1.2 },
      { x: 132, y: 11, z: -4, h: 4.0, r: 0.8 }
    ],
    crystals: [
      { x: 6, y: 2.3, z: -2.0, s: 1.0, color: 0x00e5ff },
      { x: 19, y: 2.3, z: -2.2, s: 1.2, color: 0x7c4dff },
      { x: 33, y: 3.8, z: -2.1, s: 1.1, color: 0x00e5ff },
      { x: 48, y: 2.3, z: -2.0, s: 1.3, color: 0x64ffda },
      { x: 62, y: 5.8, z: -2.2, s: 1.0, color: 0x7c4dff },
      { x: 84, y: 2.3, z: -2.0, s: 1.4, color: 0x00e5ff },
      { x: 104, y: 4.3, z: -2.2, s: 1.1, color: 0x64ffda },
      { x: 126, y: 2.3, z: -2.0, s: 1.3, color: 0x7c4dff }
    ],
    mushrooms: [
      { x: 12, y: 2.1, z: -1.8, s: 0.9 },
      { x: 27, y: 2.1, z: -1.9, s: 1.1 },
      { x: 44, y: 2.1, z: -1.8, s: 0.8 },
      { x: 88, y: 2.1, z: -1.9, s: 1.2 },
      { x: 118, y: 2.1, z: -1.8, s: 1.0 }
    ],
    caveBackdropPillars: [
      { x: 15, y: 6, z: -8, w: 2.5, h: 14 },
      { x: 42, y: 6, z: -10, w: 3.2, h: 15 },
      { x: 78, y: 6, z: -9, w: 2.8, h: 14 },
      { x: 110, y: 6, z: -11, w: 3.5, h: 16 },
      { x: 138, y: 6, z: -8, w: 2.4, h: 14 }
    ]
  },
  platforms: [
    // 1. Entrance cavern
    { x: 10.0, y: 2.0, w: 24, h: 5.0 },
    // 2. Stepping stone ledge
    { x: 28.0, y: 2.0, w: 6, h: 5.0 },
    { x: 36.0, y: 3.5, w: 7, h: 8.0 },
    // 3. Lower cavern tunnel
    { x: 49.0, y: 2.0, w: 14, h: 5.0 },
    // 4. Abyss landing
    { x: 84.0, y: 2.0, w: 20, h: 5.0 },
    // 5. High rock ridge
    { x: 102.0, y: 4.0, w: 8, h: 9.0 },
    { x: 118.0, y: 2.0, w: 12, h: 5.0 },
    // 6. Final cavern vault & arch
    { x: 140.0, y: 2.0, w: 18, h: 5.0 }
  ],
  floatingPlatforms: [
    // Floating slate ledges
    { x: 23.0, y: 5.2, w: 3.0 },
    { x: 42.0, y: 6.0, w: 3.2 },
    { x: 60.0, y: 5.5, w: 3.0 },
    // Stairway to ridge
    { x: 96.0, y: 5.2, w: 2.5 },
    { x: 109.0, y: 6.5, w: 2.5 },
    { x: 126.0, y: 5.0, w: 3.0 },
    { x: 130.0, y: 6.5, w: 2.2 }
  ],
  movingPlatforms: [
    // Moving platforms across cavern chasms
    { x: 68.0, y: 3.5, rangeX: 3.5, rangeY: 0, speed: 1.6 },
    { x: 76.0, y: 4.5, rangeX: 0, rangeY: 2.4, speed: 1.8 }
  ],
  blocks: [
    // Zone 1
    { type: 'mystery', x: 14.0, y: 5.2, reward: 'COIN' },
    { type: 'brick', x: 15.0, y: 5.2 },
    { type: 'brick', x: 16.0, y: 5.2 },
    { type: 'mystery', x: 17.0, y: 5.2, reward: 'STAR' },
    // Zone 2
    { type: 'brick', x: 35.0, y: 7.2 },
    { type: 'mystery', x: 36.0, y: 7.2, reward: 'COIN' },
    { type: 'brick', x: 37.0, y: 7.2 },
    // Zone 4
    { type: 'mystery', x: 82.0, y: 5.4, reward: 'COIN' },
    { type: 'mystery', x: 84.0, y: 5.4, reward: 'COIN' },
    { type: 'brick', x: 86.0, y: 5.4 },
    // High Ridge
    { type: 'mystery', x: 101.0, y: 8.2, reward: 'COIN' },
    { type: 'brick', x: 102.0, y: 8.2 },
    { type: 'mystery', x: 103.0, y: 8.2, reward: 'STAR' }
  ],
  coins: [
    // Safe starter arc in cavern
    { x: 7, y: 3.2 }, { x: 8, y: 3.8 }, { x: 9, y: 4.0 }, { x: 10, y: 3.8 },
    // Above first blocks
    { x: 14, y: 6.8 }, { x: 15, y: 6.8 }, { x: 16, y: 6.8 }, { x: 17, y: 6.8 },
    // Floating ledge coins
    { x: 22, y: 6.4 }, { x: 23, y: 6.6 }, { x: 24, y: 6.4 },
    // Above stepping mound
    { x: 35, y: 8.6 }, { x: 36, y: 8.8 }, { x: 37, y: 8.6 },
    // Lower cavern trail
    { x: 48, y: 3.2 }, { x: 50, y: 3.2 },
    // Moving platforms bridge
    { x: 67, y: 4.8 }, { x: 69, y: 4.8 }, { x: 76, y: 6.2 }, { x: 76, y: 7.6 },
    // Post-checkpoint
    { x: 83, y: 6.8 }, { x: 84, y: 6.8 }, { x: 85, y: 6.8 },
    // High ridge leap
    { x: 96, y: 6.4 }, { x: 101, y: 9.6 }, { x: 102, y: 9.8 }, { x: 103, y: 9.6 }, { x: 109, y: 7.8 },
    // Stairway to goal
    { x: 126, y: 6.2 }, { x: 130, y: 7.8 },
    { x: 136, y: 3.2 }, { x: 138, y: 3.2 }
  ],
  enemies: [
    // Cavern patrolling creatures
    { type: 'walker', x: 18.0, y: 2.8, patrolDistance: 3.0 },
    { type: 'hopper', x: 30.0, y: 2.8, patrolDistance: 2.5 },
    { type: 'walker', x: 48.0, y: 2.8, patrolDistance: 3.5 },
    // Abyss checkpoint guard
    { type: 'hopper', x: 88.0, y: 2.8, patrolDistance: 3.0 },
    { type: 'walker', x: 102.0, y: 4.8, patrolDistance: 2.0 },
    { type: 'hopper', x: 120.0, y: 2.8, patrolDistance: 3.0 }
  ],
  checkpoint: { x: 80.0, y: 2.0 },
  goal: { x: 142.0, y: 2.0 }
};
