import * as THREE from 'three';
import { BossEntity } from './BossEntity';
import { EnemyWeapon } from '../../../weapons/EnemyWeapon';
import { WeaponCategory } from '../../../weapons/Weapon';

/**
 * Mortuary — Zone 3 boss. Destroyer hulk with 3 weak-point nodes.
 * Phase 1: All 3 nodes active, slow fire.
 * Phase 2 (2 nodes destroyed): Faster fire, more aggressive.
 * Phase 3 (1 node left): Enraged, rapid fire.
 */
export class Mortuary extends BossEntity {
  private nodeWeapons: EnemyWeapon[] = [];
  private rotationAngle: number = 0;

  constructor(scene: THREE.Scene, position: THREE.Vector3) {
    super(scene, position, 500, 800, 50, 'Mortuary', 'mortuary', 3);

    // Create 3 weapon nodes
    for (let i = 0; i < 3; i++) {
      this.nodeWeapons.push(
        new EnemyWeapon(scene, {
          damage: 15,
          speed: 500,
          fireInterval: 2.5,
          lifetime: 5,
          color: new THREE.Color(0x44ff44),
          scale: 0.9,
          category: WeaponCategory.ENERGY,
        })
      );
    }

    this.weapon = this.nodeWeapons[0];
    this.model = this.createModel();
    this.scene.add(this.model);
    this.hitbox = new THREE.Sphere(this.position.clone(), 50);
  }

  protected createModel(): THREE.Object3D {
    const group = new THREE.Group();

    // Massive hulk body
    const bodyGeo = new THREE.BoxGeometry(50, 30, 70);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x445544,
      metalness: 0.4,
      roughness: 0.8,
      flatShading: true,
    });
    group.add(new THREE.Mesh(bodyGeo, bodyMat));

    // Weak-point nodes (glowing spheres)
    const positions = [
      new THREE.Vector3(-20, 15, -10),
      new THREE.Vector3(20, 15, -10),
      new THREE.Vector3(0, -15, -20),
    ];

    for (const pos of positions) {
      const nodeGeo = new THREE.SphereGeometry(6, 8, 8);
      const nodeMat = new THREE.MeshBasicMaterial({
        color: 0x44ff44,
        transparent: true,
        opacity: 0.8,
      });
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      node.position.copy(pos);
      group.add(node);
    }

    // Damaged hull details
    for (let i = 0; i < 4; i++) {
      const debrisGeo = new THREE.BoxGeometry(8, 5, 12);
      const debrisMat = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.3,
        roughness: 0.9,
        flatShading: true,
      });
      const debris = new THREE.Mesh(debrisGeo, debrisMat);
      debris.position.set(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 50
      );
      debris.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        0
      );
      group.add(debris);
    }

    group.position.copy(this.position);
    return group;
  }

  protected onPhaseChange(newPhase: number): void {
    // Increase fire rate as nodes are "destroyed"
    const remaining = Math.max(1, 3 - newPhase);
    for (let i = 0; i < remaining; i++) {
      this.nodeWeapons[i] = new EnemyWeapon(this.scene, {
        damage: 18 + newPhase * 5,
        speed: 550 + newPhase * 50,
        fireInterval: 2.0 - newPhase * 0.5,
        lifetime: 5,
        color: new THREE.Color(0x88ff88),
        scale: 1.0,
        category: WeaponCategory.ENERGY,
      });
    }
  }

  protected updateBossAI(deltaTime: number): void {
    // Slow rotation
    this.rotationAngle += 0.2 * deltaTime;

    // Slow lateral drift
    this.position.x = Math.sin(this.rotationAngle) * 100;

    if (this.model) {
      this.model.position.copy(this.position);
      this.model.rotation.y = this.rotationAngle * 0.3;
    }

    // Fire from active nodes
    const activeNodes = Math.max(1, 3 - this.currentPhase);
    for (let i = 0; i < activeNodes && i < this.nodeWeapons.length; i++) {
      this.nodeWeapons[i].fire(this.position, this.playerPosition);
      this.nodeWeapons[i].update(deltaTime);
    }
  }

  getProjectiles() {
    const all = [];
    for (const w of this.nodeWeapons) {
      all.push(...w.getProjectiles());
    }
    return all;
  }

  dispose(): void {
    for (const w of this.nodeWeapons) {
      w.dispose();
    }
    super.dispose();
  }
}
