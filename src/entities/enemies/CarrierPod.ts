import * as THREE from 'three';
import { EnemyEntity } from './EnemyEntity';
import { EnemyType } from './EnemyTypes';

/**
 * CarrierPod — miniboss that slowly drifts and spawns Raiders over time.
 * No weapon of its own; relies on spawned Raiders for offense.
 * High HP, high score value.
 *
 * Note: actual Raider spawning is handled by Scene.ts which checks
 * shouldSpawnRaider() each frame and creates the Raider instances.
 */
export class CarrierPod extends EnemyEntity {
  private spawnTimer: number = 0;
  private spawnInterval: number = 4; // seconds between Raider spawns
  private maxSpawns: number = 3;
  private spawnsRemaining: number = 3;
  private pendingSpawn: boolean = false;

  constructor(scene: THREE.Scene, position: THREE.Vector3) {
    super(scene, position, 100, 200, 35, EnemyType.CARRIER_POD);

    this.model = this.createModel();
    this.scene.add(this.model);
    this.hitbox = new THREE.Sphere(this.position.clone(), 30);
  }

  protected createModel(): THREE.Object3D {
    const group = new THREE.Group();

    // Elongated hull
    const hullGeo = new THREE.BoxGeometry(20, 18, 50);
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0x775533,
      metalness: 0.3,
      roughness: 0.8,
      flatShading: true,
    });
    group.add(new THREE.Mesh(hullGeo, hullMat));

    // Side hatches
    for (const side of [-1, 1]) {
      const hatchGeo = new THREE.BoxGeometry(4, 12, 16);
      const hatchMat = new THREE.MeshStandardMaterial({
        color: 0x994422,
        metalness: 0.2,
        roughness: 0.9,
        flatShading: true,
      });
      const hatch = new THREE.Mesh(hatchGeo, hatchMat);
      hatch.position.set(side * 12, 0, -5);
      group.add(hatch);
    }

    // Warning lights
    for (const side of [-1, 1]) {
      const lightGeo = new THREE.SphereGeometry(2, 6, 6);
      const lightMat = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.8,
      });
      const light = new THREE.Mesh(lightGeo, lightMat);
      light.position.set(side * 10, 10, -20);
      group.add(light);
    }

    group.position.copy(this.position);
    return group;
  }

  protected updateAI(deltaTime: number): void {
    // Slow drift
    this.velocity.z = 60 * deltaTime;
    this.velocity.x = Math.sin(performance.now() * 0.0002) * 20 * deltaTime;
    this.position.add(this.velocity);

    // Spawn timer
    if (this.spawnsRemaining > 0) {
      this.spawnTimer += deltaTime;
      if (this.spawnTimer >= this.spawnInterval) {
        this.spawnTimer = 0;
        this.spawnsRemaining--;
        this.pendingSpawn = true;
      }
    }

    // Rotate model slowly
    if (this.model) {
      this.model.rotation.y += 0.1 * deltaTime;
    }
  }

  /**
   * Whether this carrier has a pending Raider spawn.
   * Scene.ts checks this each frame and creates the Raider if true.
   */
  shouldSpawnRaider(): boolean {
    if (this.pendingSpawn) {
      this.pendingSpawn = false;
      return true;
    }
    return false;
  }

  /**
   * Gets the remaining number of Raiders this pod can spawn.
   */
  getSpawnsRemaining(): number {
    return this.spawnsRemaining;
  }
}
