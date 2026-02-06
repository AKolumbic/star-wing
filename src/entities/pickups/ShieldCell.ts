import * as THREE from 'three';
import { Pickup } from './Pickup';
import { PickupType } from './PickupTypes';
import { Ship } from '../Ship';

/**
 * ShieldCell — restores 15-25 shield on collection.
 */
export class ShieldCell extends Pickup {
  private restoreAmount: number;

  constructor(scene: THREE.Scene, position: THREE.Vector3) {
    super(scene, position, PickupType.SHIELD_CELL);
    this.restoreAmount = 15 + Math.floor(Math.random() * 11);
    this.model = this.createModel();
    this.scene.add(this.model);
    this.hitbox = new THREE.Sphere(this.position.clone(), 14);
  }

  protected createModel(): THREE.Object3D {
    const group = new THREE.Group();

    const geo = new THREE.OctahedronGeometry(10, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x4488ff,
      metalness: 0.5,
      roughness: 0.3,
      flatShading: true,
      emissive: new THREE.Color(0x2244aa),
      emissiveIntensity: 0.4,
    });
    group.add(new THREE.Mesh(geo, mat));

    // Inner glow
    const glowGeo = new THREE.SphereGeometry(6, 8, 8);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x66aaff,
      transparent: true,
      opacity: 0.4,
    });
    group.add(new THREE.Mesh(glowGeo, glowMat));

    group.position.copy(this.position);
    return group;
  }

  applyPickup(ship: Ship): void {
    ship.restoreShield(this.restoreAmount);
  }
}
