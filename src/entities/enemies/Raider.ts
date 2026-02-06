import * as THREE from 'three';
import { EnemyEntity } from './EnemyEntity';
import { EnemyType } from './EnemyTypes';
import { EnemyWeapon } from '../../weapons/EnemyWeapon';
import { WeaponCategory } from '../../weapons/Weapon';

/**
 * Raider — light fighter with fast strafe, swarm behavior, and zigzag movement.
 * Low HP, moderate fire rate, designed to overwhelm in numbers.
 */
export class Raider extends EnemyEntity {
  private zigzagTimer: number = 0;
  private zigzagDirection: number = 1;
  private approachSpeed: number = 300;
  private strafeSpeed: number = 200;

  constructor(scene: THREE.Scene, position: THREE.Vector3) {
    super(scene, position, 30, 50, 15, EnemyType.RAIDER);

    this.model = this.createModel();
    this.scene.add(this.model);
    this.hitbox = new THREE.Sphere(this.position.clone(), 18);

    this.weapon = new EnemyWeapon(scene, {
      damage: 8,
      speed: 600,
      fireInterval: 1.8,
      lifetime: 3,
      color: new THREE.Color(0xff4444),
      scale: 0.6,
      category: WeaponCategory.BALLISTIC,
    });
  }

  protected createModel(): THREE.Object3D {
    const group = new THREE.Group();

    // Angular fighter body
    const bodyGeo = new THREE.ConeGeometry(12, 30, 4);
    bodyGeo.rotateX(Math.PI / 2);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xcc3333,
      metalness: 0.4,
      roughness: 0.6,
      flatShading: true,
    });
    group.add(new THREE.Mesh(bodyGeo, bodyMat));

    // Small wings
    const wingGeo = new THREE.BoxGeometry(30, 2, 10);
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x991111,
      metalness: 0.3,
      roughness: 0.7,
      flatShading: true,
    });
    const wings = new THREE.Mesh(wingGeo, wingMat);
    wings.position.z = 5;
    group.add(wings);

    // Engine glow
    const engineGeo = new THREE.SphereGeometry(4, 6, 6);
    const engineMat = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0.8,
    });
    const engine = new THREE.Mesh(engineGeo, engineMat);
    engine.position.z = 15;
    group.add(engine);

    group.position.copy(this.position);
    return group;
  }

  protected updateAI(deltaTime: number): void {
    // Zigzag strafe
    this.zigzagTimer += deltaTime;
    if (this.zigzagTimer > 0.8) {
      this.zigzagTimer = 0;
      this.zigzagDirection *= -1;
    }

    // Move toward player
    const toPlayer = new THREE.Vector3()
      .subVectors(this.playerPosition, this.position);
    const distToPlayer = toPlayer.length();

    // Approach
    this.velocity.z = this.approachSpeed * deltaTime;

    // Strafe
    this.velocity.x = this.zigzagDirection * this.strafeSpeed * deltaTime;

    // Apply movement
    this.position.add(this.velocity);

    // Face the player roughly
    if (this.model && distToPlayer > 10) {
      this.model.lookAt(this.playerPosition);
    }

    // Fire when within range
    if (distToPlayer < 1200 && this.weapon) {
      this.weapon.fire(this.position, this.playerPosition);
    }
  }
}
