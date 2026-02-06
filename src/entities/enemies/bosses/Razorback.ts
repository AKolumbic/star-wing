import * as THREE from 'three';
import { BossEntity } from './BossEntity';
import { EnemyWeapon } from '../../../weapons/EnemyWeapon';
import { WeaponCategory } from '../../../weapons/Weapon';

/**
 * Razorback — Zone 2 boss. Light corvette with two side cannons.
 * Phase 1: Alternating cannon fire.
 * Phase 2: Both cannons fire simultaneously, faster rate.
 */
export class Razorback extends BossEntity {
  private leftCannon: EnemyWeapon;
  private rightCannon: EnemyWeapon;
  private strafeTimer: number = 0;
  private strafeDir: number = 1;

  constructor(scene: THREE.Scene, position: THREE.Vector3) {
    super(scene, position, 300, 500, 40, 'Razorback', 'razorback', 2);

    this.leftCannon = new EnemyWeapon(scene, {
      damage: 12,
      speed: 600,
      fireInterval: 1.5,
      lifetime: 4,
      color: new THREE.Color(0xff3333),
      scale: 0.8,
      category: WeaponCategory.BALLISTIC,
    });

    this.rightCannon = new EnemyWeapon(scene, {
      damage: 12,
      speed: 600,
      fireInterval: 1.5,
      lifetime: 4,
      color: new THREE.Color(0xff3333),
      scale: 0.8,
      category: WeaponCategory.BALLISTIC,
    });

    this.weapon = this.leftCannon;
    this.model = this.createModel();
    this.scene.add(this.model);
    this.hitbox = new THREE.Sphere(this.position.clone(), 40);
  }

  protected createModel(): THREE.Object3D {
    const group = new THREE.Group();

    // Main hull
    const hullGeo = new THREE.BoxGeometry(30, 15, 60);
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0x993333,
      metalness: 0.5,
      roughness: 0.5,
      flatShading: true,
    });
    group.add(new THREE.Mesh(hullGeo, hullMat));

    // Side cannons
    for (const side of [-1, 1]) {
      const cannonGeo = new THREE.CylinderGeometry(4, 4, 35, 6);
      cannonGeo.rotateX(Math.PI / 2);
      const cannonMat = new THREE.MeshStandardMaterial({
        color: 0x662222,
        metalness: 0.6,
        roughness: 0.4,
      });
      const cannon = new THREE.Mesh(cannonGeo, cannonMat);
      cannon.position.set(side * 20, 0, -10);
      group.add(cannon);
    }

    // Bridge
    const bridgeGeo = new THREE.BoxGeometry(12, 8, 15);
    const bridgeMat = new THREE.MeshStandardMaterial({
      color: 0xaa4444,
      metalness: 0.4,
      roughness: 0.6,
      flatShading: true,
    });
    const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
    bridge.position.y = 12;
    group.add(bridge);

    group.position.copy(this.position);
    return group;
  }

  protected onPhaseChange(newPhase: number): void {
    // Phase 2: faster fire rate
    this.leftCannon = new EnemyWeapon(this.scene, {
      damage: 15,
      speed: 700,
      fireInterval: 0.8,
      lifetime: 4,
      color: new THREE.Color(0xff5555),
      scale: 0.9,
      category: WeaponCategory.BALLISTIC,
    });
    this.rightCannon = new EnemyWeapon(this.scene, {
      damage: 15,
      speed: 700,
      fireInterval: 0.8,
      lifetime: 4,
      color: new THREE.Color(0xff5555),
      scale: 0.9,
      category: WeaponCategory.BALLISTIC,
    });
  }

  protected updateBossAI(deltaTime: number): void {
    // Strafe pattern
    this.strafeTimer += deltaTime;
    if (this.strafeTimer > 2) {
      this.strafeTimer = 0;
      this.strafeDir *= -1;
    }

    this.position.x += this.strafeDir * 120 * deltaTime;

    if (this.model) {
      this.model.position.copy(this.position);
      this.model.lookAt(this.playerPosition);
    }

    // Fire cannons
    const leftPos = this.position.clone().add(new THREE.Vector3(-20, 0, 0));
    const rightPos = this.position.clone().add(new THREE.Vector3(20, 0, 0));

    if (this.currentPhase === 0) {
      // Alternate cannons
      if (Math.sin(this.strafeTimer * 3) > 0) {
        this.leftCannon.fire(leftPos, this.playerPosition);
      } else {
        this.rightCannon.fire(rightPos, this.playerPosition);
      }
    } else {
      // Both fire simultaneously
      this.leftCannon.fire(leftPos, this.playerPosition);
      this.rightCannon.fire(rightPos, this.playerPosition);
    }

    this.leftCannon.update(deltaTime);
    this.rightCannon.update(deltaTime);
  }

  getProjectiles() {
    return [
      ...this.leftCannon.getProjectiles(),
      ...this.rightCannon.getProjectiles(),
    ];
  }

  dispose(): void {
    this.leftCannon.dispose();
    this.rightCannon.dispose();
    super.dispose();
  }
}
