import * as THREE from 'three';
import { Pickup } from './Pickup';
import { PickupType } from './PickupTypes';
import { ShieldCell } from './ShieldCell';
import { HullPatch } from './HullPatch';
import { Overclock } from './Overclock';
import { AmmoCache } from './AmmoCache';
import { ScoreCache } from './ScoreCache';

/**
 * Creates pickup instances by type.
 */
export function createPickup(
  type: PickupType,
  scene: THREE.Scene,
  position: THREE.Vector3
): Pickup {
  switch (type) {
    case PickupType.SHIELD_CELL:
      return new ShieldCell(scene, position);
    case PickupType.HULL_PATCH:
      return new HullPatch(scene, position);
    case PickupType.OVERCLOCK:
      return new Overclock(scene, position);
    case PickupType.AMMO_CACHE:
      return new AmmoCache(scene, position);
    case PickupType.SCORE_CACHE:
      return new ScoreCache(scene, position);
    default:
      throw new Error(`Unknown pickup type: ${type}`);
  }
}
