/**
 * Level1_3.js
 * World 1-3: "Treetop Canopy"
 * High-altitude arboreal level set among giant redwood tree boughs,
 * swaying wooden suspension bridges, sunset clouds, and high vertical platforming.
 */

export const Level1_3 = {
  key: '1-3',
  name: 'Treetop Canopy',
  world: 1,
  level: 3,
  bounds: { minX: 4, maxX: 158 },
  spawn: { x: 2.0, y: 4.5, z: 0 },
  theme: {
    skyColor: 0xff7043,      // Warm golden-sunset coral sky
    fogColor: 0xffa726,      // Amber twilight mist
    fogDensity: 0.007,
    ambientLight: { color: 0xffe0b2, groundColor: 0x3e2723, intensity: 0.85 },
    sunLight: { color: 0xfff8e1, intensity: 1.35 },
    materials: {
      platformTop: 0x2e7d32,  // Lush canopy moss/leaves
      platformBody: 0x4e342e, // Ancient redwood timber
      bark: 0x3e2723,         // Dark tree trunk bark
      canopyLeaves: 0x388e3c, // Emerald leaf clusters
      leafOrange: 0xf57c00,   // Autumn foliage accents
      sunsetCloud: 0xffecb3   // Warm illuminated clouds
    },
    biome: 'canopy'
  },
  scenery: {
    giantTrunks: [
      { x: 8, y: 5, z: -4.5, r: 2.2, h: 30 },
      { x: 25, y: 6, z: -6.0, r: 2.8, h: 32 },
      { x: 42, y: 8, z: -5.0, r: 3.2, h: 35 },
      { x: 64, y: 6, z: -6.5, r: 3.0, h: 34 },
      { x: 88, y: 8, z: -5.0, r: 3.5, h: 36 },
      { x: 112, y: 9, z: -6.0, r: 3.0, h: 35 },
      { x: 135, y: 8, z: -5.5, r: 2.8, h: 34 },
      { x: 152, y: 8, z: -4.5, r: 2.5, h: 32 }
    ],
    leafClusters: [
      { x: 8, y: 18, z: -4.0, rx: 5.5, ry: 4.0, rz: 4.5, mat: 'canopyLeaves' },
      { x: 25, y: 20, z: -5.5, rx: 6.5, ry: 5.0, rz: 5.5, mat: 'leafOrange' },
      { x: 42, y: 22, z: -4.5, rx: 7.0, ry: 5.5, rz: 6.0, mat: 'canopyLeaves' },
      { x: 64, y: 19, z: -6.0, rx: 6.5, ry: 4.8, rz: 5.5, mat: 'leafOrange' },
      { x: 88, y: 23, z: -4.5, rx: 7.5, ry: 5.8, rz: 6.5, mat: 'canopyLeaves' },
      { x: 112, y: 22, z: -5.5, rx: 6.8, ry: 5.2, rz: 6.0, mat: 'canopyLeaves' },
      { x: 135, y: 20, z: -5.0, rx: 6.2, ry: 4.8, rz: 5.5, mat: 'leafOrange' },
      { x: 152, y: 19, z: -4.0, rx: 5.8, ry: 4.5, rz: 5.0, mat: 'canopyLeaves' }
    ],
    sunsetClouds: [
      { x: 12, y: 14, z: -8, scale: 1.5 },
      { x: 38, y: 16, z: -10, scale: 1.8 },
      { x: 70, y: 15, z: -9, scale: 1.6 },
      { x: 102, y: 17, z: -11, scale: 2.0 },
      { x: 130, y: 15, z: -8, scale: 1.7 },
      { x: 150, y: 16, z: -10, scale: 1.5 }
    ]
  },
  platforms: [
    // 1. Starting redwood bough
    { x: 8.0, y: 3.0, w: 18, h: 6.0 },
    // 2. Mid trunk perch
    { x: 40.0, y: 6.5, w: 10, h: 10.0 },
    // 3. Central Great Bough & Checkpoint
    { x: 88.0, y: 7.0, w: 16, h: 11.0 },
    // 4. Pre-summit lookout
    { x: 136.0, y: 7.5, w: 12, h: 12.0 },
    // 5. Goal Summit Arch
    { x: 150.0, y: 7.5, w: 14, h: 12.0 }
  ],
  floatingPlatforms: [
    // Ascending boughs in zone 1
    { x: 21.0, y: 5.0, w: 3.5 },
    { x: 28.0, y: 6.8, w: 3.5 },
    // Canopy stepping bridges between trunk 2 and central bough
    { x: 49.0, y: 7.5, w: 3.0 },
    { x: 55.0, y: 6.8, w: 2.8 },
    { x: 61.0, y: 8.0, w: 3.2 },
    // High canopy steps leading up after checkpoint
    { x: 108.0, y: 8.8, w: 3.2 },
    { x: 116.0, y: 10.2, w: 3.0 },
    { x: 124.0, y: 9.4, w: 3.5 }
  ],
  movingPlatforms: [
    // Canopy gap crossings
    { x: 68.0, y: 7.5, rangeX: 3.5, rangeY: 0, speed: 1.6 },
    { x: 76.0, y: 7.8, rangeX: 0, rangeY: 2.0, speed: 1.8 },
    // High altitude moving bough
    { x: 100.0, y: 7.8, rangeX: 3.2, rangeY: 1.2, speed: 1.5 }
  ],
  blocks: [
    // Starting area bough blocks
    { type: 'mystery', x: 12.0, y: 6.2, reward: 'COIN' },
    { type: 'brick', x: 13.0, y: 6.2 },
    { type: 'mystery', x: 14.0, y: 6.2, reward: 'STAR' },
    { type: 'brick', x: 15.0, y: 6.2 },
    // Mid trunk blocks
    { type: 'brick', x: 38.0, y: 9.8 },
    { type: 'mystery', x: 39.0, y: 9.8, reward: 'COIN' },
    { type: 'brick', x: 40.0, y: 9.8 },
    // High central bough blocks
    { type: 'mystery', x: 86.0, y: 10.2, reward: 'COIN' },
    { type: 'mystery', x: 88.0, y: 10.2, reward: 'STAR' },
    { type: 'brick', x: 90.0, y: 10.2 },
    // Lookout blocks
    { type: 'mystery', x: 134.0, y: 10.8, reward: 'COIN' },
    { type: 'brick', x: 136.0, y: 10.8 }
  ],
  coins: [
    // Safe starter leap
    { x: 6, y: 4.2 }, { x: 7, y: 4.8 }, { x: 8, y: 5.0 }, { x: 9, y: 4.8 },
    // Over first blocks
    { x: 12, y: 7.8 }, { x: 13, y: 7.8 }, { x: 14, y: 7.8 }, { x: 15, y: 7.8 },
    // Ascending bough arcs
    { x: 20, y: 6.2 }, { x: 21, y: 6.4 }, { x: 22, y: 6.2 },
    { x: 27, y: 8.0 }, { x: 28, y: 8.2 }, { x: 29, y: 8.0 },
    // Mid trunk high reward
    { x: 38, y: 11.2 }, { x: 39, y: 11.4 }, { x: 40, y: 11.2 },
    // Stepping bridge trail
    { x: 49, y: 8.8 }, { x: 55, y: 8.2 }, { x: 61, y: 9.4 },
    // Moving platforms leap
    { x: 67, y: 8.8 }, { x: 69, y: 8.8 }, { x: 76, y: 9.4 }, { x: 76, y: 10.8 },
    // Central bough coins
    { x: 85, y: 8.5 }, { x: 86, y: 11.6 }, { x: 88, y: 11.6 }, { x: 90, y: 11.6 },
    // High climb coins
    { x: 100, y: 9.2 }, { x: 108, y: 10.2 }, { x: 116, y: 11.6 }, { x: 124, y: 10.8 },
    // Pre-goal sprint
    { x: 134, y: 12.2 }, { x: 136, y: 12.2 }, { x: 146, y: 8.8 }, { x: 148, y: 8.8 }
  ],
  enemies: [
    // Starting bough patrol
    { type: 'walker', x: 16.0, y: 3.8, patrolDistance: 3.5 },
    // Perch hopper
    { type: 'hopper', x: 41.0, y: 7.2, patrolDistance: 2.5 },
    // Central bough patrol pair
    { type: 'walker', x: 84.0, y: 7.8, patrolDistance: 3.0 },
    { type: 'hopper', x: 92.0, y: 7.8, patrolDistance: 2.5 },
    // High bough hopper
    { type: 'hopper', x: 124.0, y: 10.2, patrolDistance: 2.0 },
    // Lookout guard
    { type: 'walker', x: 137.0, y: 8.2, patrolDistance: 3.0 }
  ],
  checkpoint: { x: 84.0, y: 7.0 },
  goal: { x: 151.0, y: 7.5 }
};
