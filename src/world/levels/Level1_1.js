/**
 * Level1_1.js
 * World 1-1: "Sunny Meadows"
 * Level layout configuration and metadata.
 */

export const Level1_1 = {
  key: '1-1',
  name: 'Sunny Meadows',
  world: 1,
  level: 1,
  bounds: { minX: 4, maxX: 154 },
  spawn: { x: 2.0, y: 3.5, z: 0 },
  theme: {
    skyColor: 0x60a5fa,
    fogColor: 0x93c5fd,
    fogDensity: 0.008,
    ambientLight: { color: 0xffffff, groundColor: 0x81c784, intensity: 0.75 },
    sunLight: { color: 0xfffaed, intensity: 1.25 },
    materials: {
      platformTop: 0x4caf50,    // Grass green
      platformBody: 0x6d4c41,   // Dirt brown
      cloud: 0xffffff,
      hill: 0x388e3c,
      distantHill: 0x2e7d32,
      trunk: 0x5d4037,
      foliage: 0x66bb6a
    },
    biome: 'meadow'
  },
  scenery: {
    clouds: [
      { x: 10, y: 12, z: -8, scale: 1.4 },
      { x: 26, y: 14, z: -10, scale: 1.6 },
      { x: 42, y: 11, z: -7, scale: 1.2 },
      { x: 62, y: 13, z: -9, scale: 1.8 },
      { x: 80, y: 12, z: -8, scale: 1.5 },
      { x: 100, y: 15, z: -11, scale: 1.7 },
      { x: 122, y: 13, z: -7, scale: 1.3 },
      { x: 144, y: 14, z: -9, scale: 1.6 }
    ],
    hills: [
      { x: 8, y: -2, z: -14, r: 10, mat: 'hill' },
      { x: 25, y: -3, z: -20, r: 15, mat: 'distantHill' },
      { x: 45, y: -2, z: -15, r: 11, mat: 'hill' },
      { x: 68, y: -4, z: -22, r: 17, mat: 'distantHill' },
      { x: 92, y: -2, z: -14, r: 11, mat: 'hill' },
      { x: 115, y: -3, z: -18, r: 14, mat: 'distantHill' },
      { x: 138, y: -2, z: -14, r: 10, mat: 'hill' }
    ],
    trees: [
      { x: 4, y: 2.0, z: -2.4, s: 1.0 },
      { x: 12, y: 2.0, z: -2.4, s: 1.2 },
      { x: 22, y: 2.0, z: -2.5, s: 1.1 },
      { x: 38, y: 3.5, z: -2.4, s: 1.3 },
      { x: 55, y: 2.0, z: -2.4, s: 1.0 },
      { x: 74, y: 2.0, z: -2.5, s: 1.4 },
      { x: 88, y: 4.0, z: -2.5, s: 1.2 },
      { x: 110, y: 2.0, z: -2.4, s: 1.1 },
      { x: 135, y: 2.0, z: -2.5, s: 1.3 }
    ],
    hasFlowers: true
  },
  platforms: [
    { x: 9.5, y: 2.0, w: 31, h: 5.0 },
    { x: 29.0, y: 2.0, w: 6, h: 5.0 },
    { x: 38.0, y: 3.5, w: 8, h: 8.0 },
    { x: 58.0, y: 2.0, w: 26, h: 5.0 },
    { x: 99.0, y: 2.0, w: 24, h: 5.0 },
    { x: 117.0, y: 2.0, w: 8, h: 5.0 },
    { x: 132.0, y: 3.5, w: 7, h: 8.0 },
    { x: 152.0, y: 2.0, w: 16, h: 5.0 }
  ],
  floatingPlatforms: [
    { x: 52.0, y: 5.5, w: 3.5 },
    { x: 63.0, y: 6.2, w: 3.5 },
    { x: 94.0, y: 5.2, w: 3.0 },
    { x: 102.0, y: 7.0, w: 3.5 },
    { x: 137.0, y: 4.8, w: 2.0 },
    { x: 139.5, y: 6.0, w: 2.0 },
    { x: 142.0, y: 7.2, w: 2.0 }
  ],
  movingPlatforms: [
    { x: 79.0, y: 3.2, rangeX: 3.8, rangeY: 0, speed: 1.5 },
    { x: 124.0, y: 3.5, rangeX: 0, rangeY: 2.2, speed: 1.8 }
  ],
  blocks: [
    { type: 'mystery', x: 14.0, y: 5.2, reward: 'COIN' },
    { type: 'brick', x: 15.0, y: 5.2 },
    { type: 'mystery', x: 16.0, y: 5.2, reward: 'STAR' },
    { type: 'brick', x: 17.0, y: 5.2 },
    { type: 'mystery', x: 18.0, y: 5.2, reward: 'COIN' },
    { type: 'brick', x: 37.0, y: 7.2 },
    { type: 'mystery', x: 38.0, y: 7.2, reward: 'COIN' },
    { type: 'brick', x: 39.0, y: 7.2 },
    { type: 'mystery', x: 57.0, y: 5.8, reward: 'COIN' },
    { type: 'mystery', x: 59.0, y: 5.8, reward: 'COIN' },
    { type: 'brick', x: 98.0, y: 5.6 },
    { type: 'mystery', x: 99.0, y: 5.6, reward: 'STAR' },
    { type: 'brick', x: 100.0, y: 5.6 }
  ],
  coins: [
    { x: 7, y: 3.2 }, { x: 8, y: 3.8 }, { x: 9, y: 4.0 }, { x: 10, y: 3.8 }, { x: 11, y: 3.2 },
    { x: 14, y: 6.8 }, { x: 16, y: 6.8 }, { x: 18, y: 6.8 },
    { x: 26, y: 3.5 }, { x: 27, y: 4.2 }, { x: 28, y: 3.5 },
    { x: 37, y: 8.6 }, { x: 38, y: 8.8 }, { x: 39, y: 8.6 },
    { x: 51, y: 6.8 }, { x: 52, y: 6.8 }, { x: 53, y: 6.8 },
    { x: 62, y: 7.5 }, { x: 63, y: 7.5 }, { x: 64, y: 7.5 },
    { x: 77, y: 4.6 }, { x: 79, y: 4.6 }, { x: 81, y: 4.6 },
    { x: 93, y: 6.4 }, { x: 94, y: 6.4 }, { x: 95, y: 6.4 },
    { x: 101, y: 8.2 }, { x: 102, y: 8.2 }, { x: 103, y: 8.2 },
    { x: 124, y: 5.5 }, { x: 124, y: 7.0 },
    { x: 137, y: 6.0 }, { x: 139.5, y: 7.2 }, { x: 142, y: 8.4 },
    { x: 145, y: 3.2 }, { x: 147, y: 3.2 }, { x: 149, y: 3.2 }
  ],
  enemies: [
    { type: 'walker', x: 20.0, y: 2.8, patrolDistance: 3.5 },
    { type: 'walker', x: 38.0, y: 4.2, patrolDistance: 2.5 },
    { type: 'hopper', x: 50.0, y: 2.8, patrolDistance: 3.0 },
    { type: 'walker', x: 62.0, y: 2.8, patrolDistance: 4.0 },
    { type: 'walker', x: 96.0, y: 2.8, patrolDistance: 3.5 },
    { type: 'hopper', x: 105.0, y: 2.8, patrolDistance: 3.0 },
    { type: 'hopper', x: 132.0, y: 4.2, patrolDistance: 2.0 }
  ],
  checkpoint: { x: 89.0, y: 2.0 },
  goal: { x: 152.0, y: 2.0 }
};
