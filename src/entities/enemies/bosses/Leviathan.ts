import * as THREE from 'three';
import { BossEntity } from './BossEntity';
import { EnemyWeapon } from '../../../weapons/EnemyWeapon';
import { WeaponCategory } from '../../../weapons/Weapon';

/**
 * Leviathan — Zone 5 boss. Armored cruiser with shield phases.
 * Phase 1: Shield active, deflects shots. Slow cannon fire.
 * Phase 2: Shield drops periodically, more aggressive fire.
 * Phase 3: No shield, rapid fire, missile salvos.
 */
export class Leviathan extends BossEntity {
  private mainCannon: EnemyWeapon;
  private missileLauncher: EnemyWeapon;
  private shieldActive: boolean = true;
  private shieldTimer: number = 0;
  private shieldDuration: number = 5; // seconds shield stays up
  private shieldDownDuration: number = 3; // seconds shield is down
  private shieldMesh: THREE.Mesh | null = null;
  private driftTimer: number = 0;

  constructor(scene: THREE.Scene, position: THREE.Vector3) {
    super(scene, position, 600, 1000, 60, 'Leviathan', 'leviathan', 3);

    this.mainCannon = new EnemyWeapon(scene, {
      damage: 18,
      speed: 500,
      fireInterval: 2.0,
      lifetime: 5,
      color: new THREE.Color(0x4488ff),
      scale: 1.0,
      category: WeaponCategory.ENERGY,
    });

    this.missileLauncher = new EnemyWeapon(scene, {
      damage: 30,
      speed: 300,
      fireInterval: 5.0,
      lifetime: 6,
      color: new THREE.Color(0xff4444),
      scale: 1.2,
      category: WeaponCategory.EXPLOSIVE,
      isHoming: true,
    });

    this.weapon = this.mainCannon;
    this.model = this.createModel();
    this.scene.add(this.model);
    this.hitbox = new THREE.Sphere(this.position.clone(), 55);
  }

  protected createModel(): THREE.Object3D {
    const group = new THREE.Group();

    // Massive armored hull
    const hullGeo = new THREE.BoxGeometry(45, 25, 80);
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0x334466,
      metalness: 0.6,
      roughness: 0.4,
      flatShading: true,
    });
    group.add(new THREE.Mesh(hullGeo, hullMat));

    // Armor plates
    for (const side of [-1, 1]) {
      const plateGeo = new THREE.BoxGeometry(5, 20, 60);
      const plateMat = new THREE.MeshStandardMaterial({
        color: 0x223344,
        metalness: 0.7,
        roughness: 0.3,
        flatShading: true,
      });
      const plate = new THREE.Mesh(plateGeo, plateMat);
      plate.position.x = side * 25;
      group.add(plate);
    }

    // Shield bubble
    const shieldGeo = new THREE.SphereGeometry(55, 16, 16);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.15,
      wireframe: true,
    });
    this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    group.add(this.shieldMesh);

    // Bridge tower
    const bridgeGeo = new THREE.BoxGeometry(15, 12, 20);
    const bridgeMat = new THREE.MeshStandardMaterial({
      color: 0x445577,
      metalness: 0.5,
      roughness: 0.5,
      flatShading: true,
    });
    const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
    bridge.position.y = 18;
    group.add(bridge);

    group.position.copy(this.position);
    return group;
  }

  /**
   * Override takeDamage to deflect when shield is up (phases 0-1).
   */
  takeDamage(amount: number): boolean {
    if (this.shieldActive && this.currentPhase < 2) {
      // Shield deflects damage
      return false;
    }
    return super.takeDamage(amount);
  }

  protected onPhaseChange(newPhase: number): void {
    if (newPhase === 1) {
      // Shield starts cycling on/off
      this.shieldDuration = 3;
      this.shieldDownDuration = 4;
    } else if (newPhase === 2) {
      // Shield permanently down, rapid fire
      this.shieldActive = false;
      this.mainCannon = new EnemyWeapon(this.scene, {
        damage: 22,
        speed: 650,
        fireInterval: 0.8,
        lifetime: 5,
        color: new THREE.Color(0x66aaff),
        scale: 1.1,
        category: WeaponCategory.ENERGY,
      });
    }
  }

  protected updateBossAI(deltaTime: number): void {
    this.driftTimer += deltaTime;

    // Slow menacing drift
    this.position.x = Math.sin(this.driftTimer * 0.5) * 120;

    if (this.model) {
      this.model.position.copy(this.position);
      this.model.lookAt(this.playerPosition);
    }

    // Shield cycling (phase 1)
    if (this.currentPhase === 1) {
      this.shieldTimer += deltaTime;
      if (this.shieldActive && this.shieldTimer > this.shieldDuration) {
        this.shieldActive = false;
        this.shieldTimer = 0;
      } else if (!this.shieldActive && this.shieldTimer > this.shieldDownDuration) {
        this.shieldActive = true;
        this.shieldTimer = 0;
      }
    }

    // Update shield visual
    if (this.shieldMesh) {
      this.shieldMesh.visible = this.shieldActive;
      if (this.shieldActive) {
        (this.shieldMesh.material as THREE.MeshBasicMaterial).opacity =
          0.1 + Math.sin(this.driftTimer * 3) * 0.05;
      }
    }

    // Fire weapons
    this.mainCannon.fire(this.position, this.playerPosition);
    this.mainCannon.update(deltaTime);

    if (this.currentPhase >= 1) {
      this.missileLauncher.fire(this.position, this.playerPosition);
      this.missileLauncher.update(deltaTime);
    }
  }

  getProjectiles() {
    return [
      ...this.mainCannon.getProjectiles(),
      ...this.missileLauncher.getProjectiles(),
    ];
  }

  dispose(): void {
    this.mainCannon.dispose();
    this.missileLauncher.dispose();
    super.dispose();
  }
}
