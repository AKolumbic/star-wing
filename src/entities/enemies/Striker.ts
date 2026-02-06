import * as THREE from 'three';
import { EnemyEntity } from './EnemyEntity';
import { EnemyType } from './EnemyTypes';
import { EnemyWeapon } from '../../weapons/EnemyWeapon';
import { WeaponCategory } from '../../weapons/Weapon';

/**
 * Striker — interceptor with very fast pass, burst fire, and disengage.
 * Low HP but high accuracy and speed.
 */
export class Striker extends EnemyEntity {
  private phase: 'approach' | 'attack' | 'disengage' = 'approach';
  private phaseTimer: number = 0;
  private moveSpeed: number = 450;

  constructor(scene: THREE.Scene, position: THREE.Vector3) {
    super(scene, position, 20, 75, 20, EnemyType.STRIKER);

    this.model = this.createModel();
    this.scene.add(this.model);
    this.hitbox = new THREE.Sphere(this.position.clone(), 15);

    this.weapon = new EnemyWeapon(scene, {
      damage: 12,
      speed: 800,
      fireInterval: 2.5,
      lifetime: 2.5,
      color: new THREE.Color(0xff8800),
      scale: 0.5,
      category: WeaponCategory.ENERGY,
      burstCount: 3,
      burstDelay: 0.12,
    });
  }

  protected createModel(): THREE.Object3D {
    const group = new THREE.Group();

    // Sleek dart shape
    const bodyGeo = new THREE.ConeGeometry(8, 35, 3);
    bodyGeo.rotateX(Math.PI / 2);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xff7700,
      metalness: 0.5,
      roughness: 0.4,
      flatShading: true,
    });
    group.add(new THREE.Mesh(bodyGeo, bodyMat));

    // Swept wings
    const wingGeo = new THREE.BoxGeometry(25, 1.5, 12);
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0xcc5500,
      metalness: 0.4,
      roughness: 0.6,
      flatShading: true,
    });
    const wings = new THREE.Mesh(wingGeo, wingMat);
    wings.position.z = 8;
    group.add(wings);

    group.position.copy(this.position);
    return group;
  }

  protected updateAI(deltaTime: number): void {
    this.phaseTimer += deltaTime;

    const toPlayer = new THREE.Vector3()
      .subVectors(this.playerPosition, this.position);
    const dist = toPlayer.length();

    switch (this.phase) {
      case 'approach':
        // Rush toward player
        this.velocity.set(0, 0, this.moveSpeed * deltaTime);
        this.position.add(this.velocity);

        if (dist < 800) {
          this.phase = 'attack';
          this.phaseTimer = 0;
        }
        break;

      case 'attack':
        // Strafe and fire
        this.velocity.x = Math.sin(this.phaseTimer * 4) * 250 * deltaTime;
        this.velocity.z = 100 * deltaTime;
        this.position.add(this.velocity);

        if (this.weapon) {
          this.weapon.fire(this.position, this.playerPosition);
        }

        if (this.phaseTimer > 2.0) {
          this.phase = 'disengage';
          this.phaseTimer = 0;
        }
        break;

      case 'disengage':
        // Fly past and loop back
        this.velocity.set(0, 80 * deltaTime, this.moveSpeed * 0.8 * deltaTime);
        this.position.add(this.velocity);

        if (this.phaseTimer > 3.0) {
          this.phase = 'approach';
          this.phaseTimer = 0;
        }
        break;
    }

    if (this.model) {
      this.model.lookAt(this.playerPosition);
    }
  }
}
