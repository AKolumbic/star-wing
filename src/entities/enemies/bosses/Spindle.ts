import * as THREE from 'three';
import { BossEntity } from './BossEntity';
import { EnemyWeapon } from '../../../weapons/EnemyWeapon';
import { WeaponCategory } from '../../../weapons/Weapon';

/**
 * Spindle — Zone 4 boss. Fast frigate with rotating beam attack.
 * Phase 1: Single-direction strafing with cannon fire.
 * Phase 2: Adds burst fire pattern.
 */
export class Spindle extends BossEntity {
  private mainWeapon: EnemyWeapon;
  private beamAngle: number = 0;
  private beamSpeed: number = 1.5; // rad/s
  private movePhase: number = 0;

  constructor(scene: THREE.Scene, position: THREE.Vector3) {
    super(scene, position, 350, 700, 35, 'Spindle', 'spindle', 2);

    this.mainWeapon = new EnemyWeapon(scene, {
      damage: 10,
      speed: 750,
      fireInterval: 0.6,
      lifetime: 3,
      color: new THREE.Color(0xffaa00),
      scale: 0.7,
      category: WeaponCategory.ENERGY,
      burstCount: 2,
      burstDelay: 0.1,
    });

    this.weapon = this.mainWeapon;
    this.model = this.createModel();
    this.scene.add(this.model);
    this.hitbox = new THREE.Sphere(this.position.clone(), 35);
    this.approachSpeed = 250;
  }

  protected createModel(): THREE.Object3D {
    const group = new THREE.Group();

    // Sleek elongated hull
    const hullGeo = new THREE.ConeGeometry(18, 65, 5);
    hullGeo.rotateX(Math.PI / 2);
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0xddaa33,
      metalness: 0.6,
      roughness: 0.3,
      flatShading: true,
    });
    group.add(new THREE.Mesh(hullGeo, hullMat));

    // Fins
    for (const angle of [0, Math.PI * 0.66, Math.PI * 1.33]) {
      const finGeo = new THREE.BoxGeometry(2, 20, 30);
      const finMat = new THREE.MeshStandardMaterial({
        color: 0xbb8822,
        metalness: 0.5,
        roughness: 0.5,
        flatShading: true,
      });
      const fin = new THREE.Mesh(finGeo, finMat);
      fin.position.set(Math.cos(angle) * 15, Math.sin(angle) * 15, 10);
      fin.rotation.z = angle;
      group.add(fin);
    }

    group.position.copy(this.position);
    return group;
  }

  protected onPhaseChange(newPhase: number): void {
    this.beamSpeed = 2.5;
    this.mainWeapon = new EnemyWeapon(this.scene, {
      damage: 14,
      speed: 850,
      fireInterval: 0.4,
      lifetime: 3,
      color: new THREE.Color(0xffcc44),
      scale: 0.8,
      category: WeaponCategory.ENERGY,
      burstCount: 3,
      burstDelay: 0.08,
    });
    this.weapon = this.mainWeapon;
  }

  protected updateBossAI(deltaTime: number): void {
    this.movePhase += deltaTime;
    this.beamAngle += this.beamSpeed * deltaTime;

    // Fast figure-8 movement
    this.position.x = Math.sin(this.movePhase * 1.2) * 200;
    this.position.y = Math.sin(this.movePhase * 2.4) * 80;

    if (this.model) {
      this.model.position.copy(this.position);
      this.model.rotation.z = this.beamAngle;
    }

    // Fire in a rotating pattern
    this.mainWeapon.fire(this.position, this.playerPosition);
    this.mainWeapon.update(deltaTime);
  }

  getProjectiles() {
    return this.mainWeapon.getProjectiles();
  }

  dispose(): void {
    this.mainWeapon.dispose();
    super.dispose();
  }
}
