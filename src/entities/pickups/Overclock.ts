import * as THREE from 'three';
import { Pickup } from './Pickup';
import { PickupType } from './PickupTypes';
import { Ship } from '../Ship';

/**
 * Overclock — 8-second fire rate boost (0.5x cooldown multiplier).
 */
export class Overclock extends Pickup {
  private duration: number = 8;

  constructor(scene: THREE.Scene, position: THREE.Vector3) {
    super(scene, position, PickupType.OVERCLOCK);
    this.model = this.createModel();
    this.scene.add(this.model);
    this.hitbox = new THREE.Sphere(this.position.clone(), 14);
  }

  protected createModel(): THREE.Object3D {
    const group = new THREE.Group();

    // Lightning bolt shape (simplified as a diamond)
    const geo = new THREE.OctahedronGeometry(10, 0);
    geo.scale(1, 1.5, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      metalness: 0.6,
      roughness: 0.3,
      flatShading: true,
      emissive: new THREE.Color(0xff6600),
      emissiveIntensity: 0.5,
    });
    group.add(new THREE.Mesh(geo, mat));

    // Spark particles
    for (let i = 0; i < 3; i++) {
      const sparkGeo = new THREE.SphereGeometry(2, 4, 4);
      const sparkMat = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.6,
      });
      const spark = new THREE.Mesh(sparkGeo, sparkMat);
      spark.position.set(
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 16
      );
      group.add(spark);
    }

    group.position.copy(this.position);
    return group;
  }

  applyPickup(ship: Ship): void {
    const ws = ship.getWeaponSystem();
    if (ws) {
      ws.applyOverclock(this.duration);
    }
  }
}
