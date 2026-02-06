import * as THREE from 'three';
import { EnemyEntity } from './EnemyEntity';
import { EnemyType } from './EnemyTypes';
import { EnemyWeapon } from '../../weapons/EnemyWeapon';
import { WeaponCategory } from '../../weapons/Weapon';

/**
 * Bomber — slow, heavy enemy that launches slow homing missiles.
 * High HP, slow movement, high-damage projectiles.
 */
export class Bomber extends EnemyEntity {
  private driftSpeed: number = 120;

  constructor(scene: THREE.Scene, position: THREE.Vector3) {
    super(scene, position, 60, 100, 30, EnemyType.BOMBER);

    this.model = this.createModel();
    this.scene.add(this.model);
    this.hitbox = new THREE.Sphere(this.position.clone(), 25);

    this.weapon = new EnemyWeapon(scene, {
      damage: 25,
      speed: 350,
      fireInterval: 4.0,
      lifetime: 5,
      color: new THREE.Color(0xff2200),
      scale: 1.2,
      category: WeaponCategory.EXPLOSIVE,
      isHoming: true,
    });
  }

  protected createModel(): THREE.Object3D {
    const group = new THREE.Group();

    // Bulky body
    const bodyGeo = new THREE.BoxGeometry(22, 16, 35);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x556644,
      metalness: 0.3,
      roughness: 0.8,
      flatShading: true,
    });
    group.add(new THREE.Mesh(bodyGeo, bodyMat));

    // Side pods (missile bays)
    for (const side of [-1, 1]) {
      const podGeo = new THREE.CylinderGeometry(6, 6, 20, 6);
      podGeo.rotateX(Math.PI / 2);
      const podMat = new THREE.MeshStandardMaterial({
        color: 0x445533,
        metalness: 0.2,
        roughness: 0.9,
        flatShading: true,
      });
      const pod = new THREE.Mesh(podGeo, podMat);
      pod.position.set(side * 18, 0, 0);
      group.add(pod);
    }

    // Engine block
    const engineGeo = new THREE.BoxGeometry(18, 10, 6);
    const engineMat = new THREE.MeshBasicMaterial({
      color: 0xff4400,
      transparent: true,
      opacity: 0.7,
    });
    const engine = new THREE.Mesh(engineGeo, engineMat);
    engine.position.z = 20;
    group.add(engine);

    group.position.copy(this.position);
    return group;
  }

  protected updateAI(deltaTime: number): void {
    // Slow approach toward player
    const toPlayer = new THREE.Vector3()
      .subVectors(this.playerPosition, this.position);
    const dist = toPlayer.length();

    this.velocity.z = this.driftSpeed * deltaTime;

    // Slight lateral drift
    this.velocity.x = Math.sin(performance.now() * 0.0005) * 50 * deltaTime;

    this.position.add(this.velocity);

    if (this.model) {
      this.model.lookAt(this.playerPosition);
    }

    // Fire missiles when in range
    if (dist < 1400 && this.weapon) {
      this.weapon.fire(this.position, this.playerPosition);
    }
  }
}
