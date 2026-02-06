import * as THREE from 'three';
import { BossEntity } from './BossEntity';
import { Razorback } from './Razorback';
import { Mortuary } from './Mortuary';
import { Spindle } from './Spindle';
import { Leviathan } from './Leviathan';
import { Apex } from './Apex';

/**
 * Creates boss instances by ID.
 */
export function createBoss(
  bossId: string,
  scene: THREE.Scene,
  position: THREE.Vector3
): BossEntity {
  switch (bossId) {
    case 'razorback':
      return new Razorback(scene, position);
    case 'mortuary':
      return new Mortuary(scene, position);
    case 'spindle':
      return new Spindle(scene, position);
    case 'leviathan':
      return new Leviathan(scene, position);
    case 'apex':
      return new Apex(scene, position);
    default:
      throw new Error(`Unknown boss ID: ${bossId}`);
  }
}
