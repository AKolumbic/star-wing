import * as THREE from 'three';
import { Pickup } from './Pickup';
import { PickupType } from './PickupTypes';
import { Ship } from '../Ship';

/**
 * HullPatch — restores 10-20 health on collection.
 */
export class HullPatch extends Pickup {
  private restoreAmount: number;

  constructor(scene: THREE.Scene, position: THREE.Vector3) {
    super(scene, position, PickupType.HULL_PATCH);
    this.restoreAmount = 10 + Math.floor(Math.random() * 11);
    this.model = this.createModel();
    this.scene.add(this.model);
    this.hitbox = new THREE.Sphere(this.position.clone(), 14);
  }

  protected createModel(): THREE.Object3D {
    const group = new THREE.Group();

    const geo = new THREE.BoxGeometry(12, 12, 12);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x44ff44,
      metalness: 0.3,
      roughness: 0.5,
      flatShading: true,
      emissive: new THREE.Color(0x22aa22),
      emissiveIntensity: 0.3,
    });
    group.add(new THREE.Mesh(geo, mat));

    // Cross symbol
    const crossH = new THREE.BoxGeometry(14, 3, 3);
    const crossV = new THREE.BoxGeometry(3, 14, 3);
    const crossMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    group.add(new THREE.Mesh(crossH, crossMat));
    group.add(new THREE.Mesh(crossV, crossMat));

    group.position.copy(this.position);
    return group;
  }

  applyPickup(ship: Ship): void {
    ship.heal(this.restoreAmount);
  }
}
