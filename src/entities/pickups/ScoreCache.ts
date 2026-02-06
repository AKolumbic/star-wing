import * as THREE from 'three';
import { Pickup } from './Pickup';
import { PickupType } from './PickupTypes';
import { Ship } from '../Ship';

/**
 * ScoreCache — bonus points, no combat impact.
 */
export class ScoreCache extends Pickup {
  private scoreValue: number;

  constructor(scene: THREE.Scene, position: THREE.Vector3) {
    super(scene, position, PickupType.SCORE_CACHE);
    this.scoreValue = 100 + Math.floor(Math.random() * 150);
    this.model = this.createModel();
    this.scene.add(this.model);
    this.hitbox = new THREE.Sphere(this.position.clone(), 14);
  }

  protected createModel(): THREE.Object3D {
    const group = new THREE.Group();

    // Shiny gem
    const geo = new THREE.IcosahedronGeometry(8, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffdd00,
      metalness: 0.8,
      roughness: 0.2,
      flatShading: true,
      emissive: new THREE.Color(0xffaa00),
      emissiveIntensity: 0.4,
    });
    group.add(new THREE.Mesh(geo, mat));

    // Outer glow
    const glowGeo = new THREE.SphereGeometry(12, 8, 8);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffff44,
      transparent: true,
      opacity: 0.15,
    });
    group.add(new THREE.Mesh(glowGeo, glowMat));

    group.position.copy(this.position);
    return group;
  }

  applyPickup(_ship: Ship): void {
    // Score is added by Scene.ts when collecting
    // This method is a no-op for ScoreCache
  }

  getScoreValue(): number {
    return this.scoreValue;
  }
}
