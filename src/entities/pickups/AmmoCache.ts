import * as THREE from 'three';
import { Pickup } from './Pickup';
import { PickupType } from './PickupTypes';
import { Ship } from '../Ship';

/**
 * AmmoCache — restores limited-ammo weapons (secondary weapons).
 */
export class AmmoCache extends Pickup {
  constructor(scene: THREE.Scene, position: THREE.Vector3) {
    super(scene, position, PickupType.AMMO_CACHE);
    this.model = this.createModel();
    this.scene.add(this.model);
    this.hitbox = new THREE.Sphere(this.position.clone(), 14);
  }

  protected createModel(): THREE.Object3D {
    const group = new THREE.Group();

    // Ammo crate
    const geo = new THREE.BoxGeometry(14, 10, 10);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xcc8833,
      metalness: 0.2,
      roughness: 0.8,
      flatShading: true,
      emissive: new THREE.Color(0x664400),
      emissiveIntensity: 0.2,
    });
    group.add(new THREE.Mesh(geo, mat));

    // Stripe
    const stripeGeo = new THREE.BoxGeometry(14.5, 2, 10.5);
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.y = 2;
    group.add(stripe);

    group.position.copy(this.position);
    return group;
  }

  applyPickup(ship: Ship): void {
    const ws = ship.getWeaponSystem();
    if (ws) {
      ws.restoreAmmo();
    }
  }
}
