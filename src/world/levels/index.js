/**
 * index.js
 * Central level registry for Super Jump World.
 */

import { Level1_1 } from './Level1_1.js';
import { Level1_2 } from './Level1_2.js';

export { Level1_1, Level1_2 };

export const LEVELS = {
  '1-1': Level1_1,
  '1-2': Level1_2
};

export const LEVEL_ORDER = ['1-1', '1-2'];

export function getLevelData(key) {
  return LEVELS[key] || Level1_1;
}

export function getNextLevelKey(currentKey) {
  const idx = LEVEL_ORDER.indexOf(currentKey);
  if (idx !== -1 && idx < LEVEL_ORDER.length - 1) {
    return LEVEL_ORDER[idx + 1];
  }
  return null; // All levels completed or unknown
}
