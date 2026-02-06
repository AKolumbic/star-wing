import * as THREE from 'three';
import { Hazard } from './Hazard';
import { HazardType } from './HazardTypes';
import { DebrisField } from './DebrisField';
import { ProximityMine } from './ProximityMine';
import { RadiationCloud } from './RadiationCloud';
import { GravityRift } from './GravityRift';

/**
 * Creates hazard instances by type.
 */
export function createHazard(
  type: HazardType,
  scene: THREE.Scene,
  position: THREE.Vector3
): Hazard {
  switch (type) {
    case HazardType.DEBRIS_FIELD:
      return new DebrisField(scene, position);
    case HazardType.PROXIMITY_MINE:
      return new ProximityMine(scene, position);
    case HazardType.RADIATION_CLOUD:
      return new RadiationCloud(scene, position);
    case HazardType.GRAVITY_RIFT:
      return new GravityRift(scene, position);
    default:
      throw new Error(`Unknown hazard type: ${type}`);
  }
}
