import * as THREE from 'three';
import { BossEntity } from './BossEntity';
import { EnemyWeapon } from '../../../weapons/EnemyWeapon';
import { WeaponCategory } from '../../../weapons/Weapon';

/**
 * Apex — Zone 6 final boss. Multi-phase dreadnought with weak-point cycling.
 * Phase 1: Broadside cannon barrage.
 * Phase 2: Weak points exposed, faster attacks.
 * Phase 3: Enraged — all weapons, rapid fire, missile storms.
 */
export class Apex extends BossEntity {
  private broadsideLeft: EnemyWeapon;
  private broadsideRight: EnemyWeapon;
  private mainCannon: EnemyWeapon;
  private missileBay: EnemyWeapon;
  private moveTimer: number = 0;
  private enraged: boolean = false;

  constructor(scene: THREE.Scene, position: THREE.Vector3) {
    super(scene, position, 800, 2000, 80, 'Apex', 'apex', 3);

    this.broadsideLeft = new EnemyWeapon(scene, {
      damage: 12,
      speed: 550,
      fireInterval: 1.0,
      lifetime: 5,
      color: new THREE.Color(0xff2200),
      scale: 0.9,
      category: WeaponCategory.BALLISTIC,
    });

    this.broadsideRight = new EnemyWeapon(scene, {
      damage: 12,
      speed: 550,
      fireInterval: 1.0,
      lifetime: 5,
      color: new THREE.Color(0xff2200),
      scale: 0.9,
      category: WeaponCategory.BALLISTIC,
    });

    this.mainCannon = new EnemyWeapon(scene, {
      damage: 25,
      speed: 700,
      fireInterval: 3.0,
      lifetime: 6,
      color: new THREE.Color(0xff4400),
      scale: 1.4,
      category: WeaponCategory.ENERGY,
    });

    this.missileBay = new EnemyWeapon(scene, {
      damage: 20,
      speed: 350,
      fireInterval: 4.0,
      lifetime: 7,
      color: new THREE.Color(0xff6600),
      scale: 1.0,
      category: WeaponCategory.EXPLOSIVE,
      isHoming: true,
      burstCount: 3,
      burstDelay: 0.3,
    });

    this.weapon = this.mainCannon;
    this.model = this.createModel();
    this.scene.add(this.model);
    this.hitbox = new THREE.Sphere(this.position.clone(), 65);
  }

  protected createModel(): THREE.Object3D {
    const group = new THREE.Group();

    // Massive dreadnought hull
    const hullGeo = new THREE.BoxGeometry(60, 30, 100);
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0x442222,
      metalness: 0.6,
      roughness: 0.4,
      flatShading: true,
    });
    group.add(new THREE.Mesh(hullGeo, hullMat));

    // Armored prow
    const prowGeo = new THREE.ConeGeometry(25, 40, 4);
    prowGeo.rotateX(Math.PI / 2);
    const prowMat = new THREE.MeshStandardMaterial({
      color: 0x331111,
      metalness: 0.7,
      roughness: 0.3,
      flatShading: true,
    });
    const prow = new THREE.Mesh(prowGeo, prowMat);
    prow.position.z = -55;
    group.add(prow);

    // Side weapon bays
    for (const side of [-1, 1]) {
      const bayGeo = new THREE.BoxGeometry(10, 15, 50);
      const bayMat = new THREE.MeshStandardMaterial({
        color: 0x553333,
        metalness: 0.5,
        roughness: 0.5,
        flatShading: true,
      });
      const bay = new THREE.Mesh(bayGeo, bayMat);
      bay.position.set(side * 35, 0, 0);
      group.add(bay);
    }

    // Bridge/command tower
    const towerGeo = new THREE.BoxGeometry(20, 20, 25);
    const towerMat = new THREE.MeshStandardMaterial({
      color: 0x664444,
      metalness: 0.4,
      roughness: 0.6,
      flatShading: true,
    });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(0, 25, 10);
    group.add(tower);

    // Engine block
    const engineGeo = new THREE.BoxGeometry(40, 20, 10);
    const engineMat = new THREE.MeshBasicMaterial({
      color: 0xff3300,
      transparent: true,
      opacity: 0.6,
    });
    const engine = new THREE.Mesh(engineGeo, engineMat);
    engine.position.z = 55;
    group.add(engine);

    group.position.copy(this.position);
    return group;
  }

  protected onPhaseChange(newPhase: number): void {
    if (newPhase === 1) {
      // Expose weak points, faster side cannons
      this.broadsideLeft = new EnemyWeapon(this.scene, {
        damage: 15,
        speed: 650,
        fireInterval: 0.7,
        lifetime: 5,
        color: new THREE.Color(0xff4422),
        scale: 1.0,
        category: WeaponCategory.BALLISTIC,
      });
      this.broadsideRight = new EnemyWeapon(this.scene, {
        damage: 15,
        speed: 650,
        fireInterval: 0.7,
        lifetime: 5,
        color: new THREE.Color(0xff4422),
        scale: 1.0,
        category: WeaponCategory.BALLISTIC,
      });
    } else if (newPhase === 2) {
      // Enraged — everything fires faster
      this.enraged = true;
      this.mainCannon = new EnemyWeapon(this.scene, {
        damage: 30,
        speed: 800,
        fireInterval: 1.5,
        lifetime: 6,
        color: new THREE.Color(0xff6644),
        scale: 1.5,
        category: WeaponCategory.ENERGY,
      });
    }
  }

  protected updateBossAI(deltaTime: number): void {
    this.moveTimer += deltaTime;

    // Slow menacing movement
    this.position.x = Math.sin(this.moveTimer * 0.3) * 150;
    this.position.y = Math.sin(this.moveTimer * 0.6) * 40;

    if (this.model) {
      this.model.position.copy(this.position);
      this.model.lookAt(this.playerPosition);
    }

    // Fire weapons based on phase
    const leftPos = this.position.clone().add(new THREE.Vector3(-35, 0, 0));
    const rightPos = this.position.clone().add(new THREE.Vector3(35, 0, 0));

    this.broadsideLeft.fire(leftPos, this.playerPosition);
    this.broadsideRight.fire(rightPos, this.playerPosition);
    this.mainCannon.fire(this.position, this.playerPosition);

    if (this.currentPhase >= 1) {
      this.missileBay.fire(this.position, this.playerPosition);
    }

    this.broadsideLeft.update(deltaTime);
    this.broadsideRight.update(deltaTime);
    this.mainCannon.update(deltaTime);
    this.missileBay.update(deltaTime);
  }

  getProjectiles() {
    return [
      ...this.broadsideLeft.getProjectiles(),
      ...this.broadsideRight.getProjectiles(),
      ...this.mainCannon.getProjectiles(),
      ...this.missileBay.getProjectiles(),
    ];
  }

  dispose(): void {
    this.broadsideLeft.dispose();
    this.broadsideRight.dispose();
    this.mainCannon.dispose();
    this.missileBay.dispose();
    super.dispose();
  }
}
