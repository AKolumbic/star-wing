import * as THREE from 'three';
import { EnemyEntity } from './EnemyEntity';
import { EnemyType } from './EnemyTypes';
import { Raider } from './Raider';
import { Striker } from './Striker';
import { Bomber } from './Bomber';
import { TurretDrone } from './TurretDrone';
import { Sentinel } from './Sentinel';
import { CarrierPod } from './CarrierPod';

/**
 * Creates enemy instances by type.
 */
export function createEnemy(
  type: EnemyType,
  scene: THREE.Scene,
  position: THREE.Vector3
): EnemyEntity {
  switch (type) {
    case EnemyType.RAIDER:
      return new Raider(scene, position);
    case EnemyType.STRIKER:
      return new Striker(scene, position);
    case EnemyType.BOMBER:
      return new Bomber(scene, position);
    case EnemyType.TURRET_DRONE:
      return new TurretDrone(scene, position);
    case EnemyType.SENTINEL:
      return new Sentinel(scene, position);
    case EnemyType.CARRIER_POD:
      return new CarrierPod(scene, position);
    default:
      throw new Error(`Unknown enemy type: ${type}`);
  }
}
