import * as THREE from 'three';
import { Hazard } from './Hazard';
import { HazardType } from './HazardTypes';
import { Ship } from '../Ship';

/**
 * DebrisField — slow-moving hull fragments that block shots and deal contact damage.
 * Large area of effect, low damage, acts as cover/obstacle.
 */
export class DebrisField extends Hazard {
  private fragments: THREE.Mesh[] = [];
  private contactDamage: number = 10;

  constructor(scene: THREE.Scene, position: THREE.Vector3) {
    super(scene, position, 50, HazardType.DEBRIS_FIELD, true);

    this.driftSpeed = 40;
    this.model = this.createModel();
    this.scene.add(this.model);
    this.hitbox = new THREE.Sphere(this.position.clone(), 80);
  }

  protected createModel(): THREE.Object3D {
    const group = new THREE.Group();

    // Multiple irregular debris pieces
    const matDark = new THREE.MeshStandardMaterial({
      color: 0x555566,
      metalness: 0.5,
      roughness: 0.9,
      flatShading: true,
    });
    const matLight = new THREE.MeshStandardMaterial({
      color: 0x777788,
      metalness: 0.3,
      roughness: 0.8,
      flatShading: true,
    });

    for (let i = 0; i < 8; i++) {
      const size = 8 + Math.random() * 16;
      const geo = new THREE.BoxGeometry(
        size,
        size * (0.3 + Math.random() * 0.7),
        size * (0.3 + Math.random() * 0.7)
      );
      const mesh = new THREE.Mesh(geo, Math.random() > 0.5 ? matDark : matLight);
      mesh.position.set(
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 60
      );
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      group.add(mesh);
      this.fragments.push(mesh);
    }

    group.position.copy(this.position);
    return group;
  }

  update(deltaTime: number): boolean {
    if (!this.active) return false;

    // Slow drift toward player
    this.position.z += this.driftSpeed * deltaTime;

    if (this.model) {
      this.model.position.copy(this.position);
    }
    this.hitbox.center.copy(this.position);

    // Rotate fragments slowly
    for (const frag of this.fragments) {
      frag.rotation.x += 0.1 * deltaTime;
      frag.rotation.y += 0.15 * deltaTime;
    }

    // Remove if behind player
    if (this.position.z > 1200) {
      this.destroy();
      return false;
    }

    return true;
  }

  applyEffect(ship: Ship, _deltaTime: number): void {
    // Contact damage on overlap
    ship.takeDamage(this.contactDamage);
  }

  getContactDamage(): number {
    return this.contactDamage;
  }
}
