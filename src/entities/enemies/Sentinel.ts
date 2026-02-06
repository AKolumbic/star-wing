import * as THREE from 'three';
import { EnemyEntity } from './EnemyEntity';
import { EnemyType } from './EnemyTypes';
import { EnemyWeapon } from '../../weapons/EnemyWeapon';
import { WeaponCategory } from '../../weapons/Weapon';

/**
 * Sentinel — slow, heavily shielded enemy with shield regeneration.
 * Shield stops regenerating while taking damage (3s cooldown).
 */
export class Sentinel extends EnemyEntity {
  private shield: number;
  private maxShield: number;
  private shieldRegenRate: number = 8; // per second
  private shieldRegenCooldown: number = 3; // seconds after last hit
  private timeSinceLastHit: number = 999;
  private shieldMesh: THREE.Mesh | null = null;

  constructor(scene: THREE.Scene, position: THREE.Vector3) {
    super(scene, position, 80, 120, 25, EnemyType.SENTINEL);
    this.shield = 40;
    this.maxShield = 40;

    this.model = this.createModel();
    this.scene.add(this.model);
    this.hitbox = new THREE.Sphere(this.position.clone(), 22);

    this.weapon = new EnemyWeapon(scene, {
      damage: 12,
      speed: 550,
      fireInterval: 2.0,
      lifetime: 3.5,
      color: new THREE.Color(0x44aaff),
      scale: 0.8,
      category: WeaponCategory.ENERGY,
    });
  }

  protected createModel(): THREE.Object3D {
    const group = new THREE.Group();

    // Octahedral body
    const bodyGeo = new THREE.OctahedronGeometry(16, 0);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x3355aa,
      metalness: 0.5,
      roughness: 0.5,
      flatShading: true,
    });
    group.add(new THREE.Mesh(bodyGeo, bodyMat));

    // Shield sphere (visible)
    const shieldGeo = new THREE.SphereGeometry(22, 12, 12);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.2,
      wireframe: true,
    });
    this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    group.add(this.shieldMesh);

    group.position.copy(this.position);
    return group;
  }

  /**
   * Override takeDamage to absorb with shield first.
   */
  takeDamage(amount: number): boolean {
    this.timeSinceLastHit = 0;

    // Shield absorbs first
    if (this.shield > 0) {
      if (amount <= this.shield) {
        this.shield -= amount;
        return false;
      }
      amount -= this.shield;
      this.shield = 0;
    }

    return super.takeDamage(amount);
  }

  protected updateAI(deltaTime: number): void {
    this.timeSinceLastHit += deltaTime;

    // Slow advance
    this.velocity.z = 80 * deltaTime;
    this.velocity.x = Math.sin(performance.now() * 0.0003) * 30 * deltaTime;
    this.position.add(this.velocity);

    // Shield regeneration
    if (
      this.timeSinceLastHit >= this.shieldRegenCooldown &&
      this.shield < this.maxShield
    ) {
      this.shield = Math.min(
        this.maxShield,
        this.shield + this.shieldRegenRate * deltaTime
      );
    }

    // Update shield visual
    if (this.shieldMesh) {
      this.shieldMesh.visible = this.shield > 0;
      (this.shieldMesh.material as THREE.MeshBasicMaterial).opacity =
        0.1 + (this.shield / this.maxShield) * 0.25;
    }

    // Rotate slowly
    if (this.model) {
      this.model.rotation.y += 0.3 * deltaTime;
    }

    // Fire
    const dist = this.position.distanceTo(this.playerPosition);
    if (dist < 1200 && this.weapon) {
      this.weapon.fire(this.position, this.playerPosition);
    }
  }
}
