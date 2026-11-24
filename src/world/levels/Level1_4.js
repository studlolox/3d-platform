/**
 * Level1_4.js
 * World 1-4: "The Fortress Gate"
 * The World 1 Grand Finale!
 * Volcanic fortress castle with dark obsidian masonry, glowing lava pits,
 * flaming torches, elevator platforms, and the final fortress goal gate.
 */

export const Level1_4 = {
  key: '1-4',
  name: 'The Fortress Gate',
  world: 1,
  level: 4,
  bounds: { minX: 4, maxX: 158 },
  spawn: { x: 2.0, y: 3.5, z: 0 },
  theme: {
    skyColor: 0x180808,      // Dark volcanic crimson night
    fogColor: 0x301010,      // Fiery ember haze
    fogDensity: 0.010,
    ambientLight: { color: 0xff8a65, groundColor: 0x1f0b0b, intensity: 0.70 },
    sunLight: { color: 0xff5722, intensity: 1.30 },
    materials: {
      platformTop: 0x424242,  // Dark castle stone brick
      platformBody: 0x212121, // Volcanic obsidian rock
      fortressPillar: 0x2e2e2e,
      lava: 0xff3d00,         // Molten glowing lava
      torchFire: 0xffab00,    // Fiery orange torch flame
      ironBars: 0x607d8b,
      bannerRed: 0xb71c1c
    },
    biome: 'fortress'
  },
  scenery: {
    towers: [
      { x: 10, y: 9, z: -7.0, w: 4.5, h: 18 },
      { x: 28, y: 11, z: -8.0, w: 5.5, h: 22 },
      { x: 54, y: 12, z: -7.5, w: 6.0, h: 24 },
      { x: 88, y: 13, z: -8.0, w: 7.0, h: 26 },
      { x: 114, y: 12, z: -7.5, w: 5.5, h: 24 },
      { x: 136, y: 13, z: -8.0, w: 6.0, h: 25 },
      { x: 152, y: 14, z: -7.0, w: 6.5, h: 27 }
    ],
    torches: [
      { x: 4, y: 4.8, z: -2.0 },
      { x: 16, y: 4.8, z: -2.0 },
      { x: 26, y: 6.2, z: -2.0 },
      { x: 48, y: 6.5, z: -2.0 },
      { x: 60, y: 6.5, z: -2.0 },
      { x: 82, y: 6.5, z: -2.0 },
      { x: 94, y: 6.5, z: -2.0 },
      { x: 110, y: 9.8, z: -2.0 },
      { x: 132, y: 7.2, z: -2.0 },
      { x: 146, y: 7.2, z: -2.0 }
    ],
    lavaPools: [
      { x: 38, y: -0.6, z: 0, w: 18, d: 8 },
      { x: 74, y: -0.6, z: 0, w: 20, d: 8 },
      { x: 124, y: -0.6, z: 0, w: 22, d: 8 }
    ],
    banners: [
      { x: 10, y: 7.5, z: -4.5 },
      { x: 54, y: 8.5, z: -4.5 },
      { x: 88, y: 9.0, z: -4.5 },
      { x: 136, y: 9.0, z: -4.5 },
      { x: 152, y: 9.5, z: -4.5 }
    ]
  },
  platforms: [
    // 1. Starting Castle Ramparts
    { x: 10.0, y: 2.0, w: 20, h: 5.0 },
    // 2. Fortified Step
    { x: 26.0, y: 3.0, w: 7, h: 7.0 },
    // 3. Central Fortress Citadel
    { x: 54.0, y: 3.5, w: 14, h: 8.0 },
    // 4. Inner Sanctum & Checkpoint
    { x: 88.0, y: 3.5, w: 16, h: 8.0 },
    // 5. Pre-Gate Keep Courtyard
    { x: 136.0, y: 4.0, w: 10, h: 9.0 },
    // 6. Grand Fortress Gate Arch
    { x: 150.0, y: 4.0, w: 16, h: 9.0 }
  ],
  floatingPlatforms: [
    // Floating stone ledges over Lava Abyss 1
    { x: 35.0, y: 5.2, w: 3.0 },
    { x: 43.0, y: 6.5, w: 3.2 },
    // Upper Gauntlet ascending steps
    { x: 102.0, y: 5.5, w: 3.0 },
    { x: 110.0, y: 7.2, w: 3.0 },
    { x: 118.0, y: 8.8, w: 3.2 }
  ],
  movingPlatforms: [
    // Moving platforms across main lava pit
    { x: 67.0, y: 4.5, rangeX: 3.5, rangeY: 0, speed: 1.6 },
    { x: 75.0, y: 5.2, rangeX: 0, rangeY: 2.2, speed: 1.8 },
    // High lava elevator
    { x: 126.0, y: 6.5, rangeX: 2.5, rangeY: 2.2, speed: 1.7 }
  ],
  blocks: [
    // Zone 1
    { type: 'mystery', x: 12.0, y: 5.2, reward: 'COIN' },
    { type: 'brick', x: 13.0, y: 5.2 },
    { type: 'mystery', x: 14.0, y: 5.2, reward: 'STAR' },
    { type: 'brick', x: 15.0, y: 5.2 },
    // Citadel blocks
    { type: 'brick', x: 52.0, y: 7.0 },
    { type: 'mystery', x: 54.0, y: 7.0, reward: 'COIN' },
    { type: 'brick', x: 56.0, y: 7.0 },
    // Inner Sanctum blocks
    { type: 'mystery', x: 86.0, y: 7.2, reward: 'COIN' },
    { type: 'mystery', x: 88.0, y: 7.2, reward: 'STAR' },
    { type: 'brick', x: 90.0, y: 7.2 },
    // Pre-Gate blocks
    { type: 'mystery', x: 134.0, y: 7.8, reward: 'COIN' },
    { type: 'brick', x: 136.0, y: 7.8 }
  ],
  coins: [
    // Rampart coins
    { x: 6, y: 3.2 }, { x: 7, y: 3.8 }, { x: 8, y: 4.0 }, { x: 9, y: 3.8 },
    // Over first blocks
    { x: 12, y: 6.8 }, { x: 13, y: 6.8 }, { x: 14, y: 6.8 }, { x: 15, y: 6.8 },
    // Over lava ledges
    { x: 34, y: 6.4 }, { x: 35, y: 6.6 }, { x: 36, y: 6.4 },
    { x: 42, y: 7.8 }, { x: 43, y: 8.0 }, { x: 44, y: 7.8 },
    // Citadel reward
    { x: 52, y: 8.4 }, { x: 54, y: 8.6 }, { x: 56, y: 8.4 },
    // Moving platforms bridge
    { x: 66, y: 5.8 }, { x: 68, y: 5.8 }, { x: 75, y: 6.8 }, { x: 75, y: 8.2 },
    // Post-checkpoint
    { x: 86, y: 8.6 }, { x: 88, y: 8.6 }, { x: 90, y: 8.6 },
    // Upper gauntlet climb
    { x: 102, y: 6.8 }, { x: 110, y: 8.5 }, { x: 118, y: 10.2 },
    // Lava elevator
    { x: 126, y: 8.2 }, { x: 126, y: 9.8 },
    // Final victory corridor
    { x: 134, y: 9.2 }, { x: 136, y: 9.2 }, { x: 146, y: 5.2 }, { x: 148, y: 5.2 }
  ],
  enemies: [
    // Starting guard
    { type: 'walker', x: 18.0, y: 2.8, patrolDistance: 3.5 },
    // Fortified step hopper
    { type: 'hopper', x: 27.0, y: 3.8, patrolDistance: 2.0 },
    // Citadel pair
    { type: 'walker', x: 50.0, y: 4.2, patrolDistance: 3.0 },
    { type: 'hopper', x: 58.0, y: 4.2, patrolDistance: 2.5 },
    // Checkpoint guard
    { type: 'walker', x: 92.0, y: 4.2, patrolDistance: 3.5 },
    // Upper gauntlet hopper
    { type: 'hopper', x: 118.0, y: 9.2, patrolDistance: 2.0 },
    // Final Gatekeeper
    { type: 'hopper', x: 138.0, y: 4.8, patrolDistance: 2.5 }
  ],
  checkpoint: { x: 84.0, y: 3.5 },
  goal: { x: 152.0, y: 4.0 }
};
