import * as THREE from 'three';
import { Hazard } from './Hazard';
import { HazardType } from './HazardTypes';
import { Ship } from '../Ship';

/**
 * ProximityMine — detonates when the player gets near.
 * Can be destroyed by shooting it. Explosion deals high damage.
 */
export class ProximityMine extends Hazard {
  private detonationRadius: number = 120;
  private blastDamage: number = 40;
  private armed: boolean = true;
  private detonated: boolean = false;
  private blinkTimer: number = 0;
  private lightMesh: THREE.Mesh | null = null;

  constructor(scene: THREE.Scene, position: THREE.Vector3) {
    super(scene, position, 10, HazardType.PROXIMITY_MINE, true);

    this.driftSpeed = 30;
    this.model = this.createModel();
    this.scene.add(this.model);
    this.hitbox = new THREE.Sphere(this.position.clone(), 12);
  }

  protected createModel(): THREE.Object3D {
    const group = new THREE.Group();

    // Spiky mine body
    const bodyGeo = new THREE.OctahedronGeometry(10, 0);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x884422,
      metalness: 0.4,
      roughness: 0.7,
      flatShading: true,
    });
    group.add(new THREE.Mesh(bodyGeo, bodyMat));

    // Spikes
    for (let i = 0; i < 6; i++) {
      const spikeGeo = new THREE.ConeGeometry(3, 8, 4);
      const spikeMat = new THREE.MeshStandardMaterial({
        color: 0x664422,
        metalness: 0.3,
        roughness: 0.8,
        flatShading: true,
      });
      const spike = new THREE.Mesh(spikeGeo, spikeMat);
      const angle = (i / 6) * Math.PI * 2;
      spike.position.set(Math.cos(angle) * 10, Math.sin(angle) * 10, 0);
      spike.lookAt(0, 0, 0);
      group.add(spike);
    }

    // Blinking warning light
    const lightGeo = new THREE.SphereGeometry(3, 6, 6);
    const lightMat = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.8,
    });
    this.lightMesh = new THREE.Mesh(lightGeo, lightMat);
    group.add(this.lightMesh);

    group.position.copy(this.position);
    return group;
  }

  update(deltaTime: number): boolean {
    if (!this.active) return false;

    this.position.z += this.driftSpeed * deltaTime;

    if (this.model) {
      this.model.position.copy(this.position);
      this.model.rotation.y += 0.5 * deltaTime;
    }
    this.hitbox.center.copy(this.position);

    // Blink warning light
    this.blinkTimer += deltaTime;
    if (this.lightMesh) {
      (this.lightMesh.material as THREE.MeshBasicMaterial).opacity =
        0.3 + Math.abs(Math.sin(this.blinkTimer * 4)) * 0.7;
    }

    if (this.position.z > 1200) {
      this.destroy();
      return false;
    }

    return true;
  }

  /**
   * Check if the player is within detonation range.
   */
  isInBlastRange(playerPos: THREE.Vector3): boolean {
    if (!this.armed || this.detonated) return false;
    return this.position.distanceTo(playerPos) < this.detonationRadius;
  }

  /**
   * Triggers the mine detonation.
   */
  detonate(): void {
    this.detonated = true;
    this.destroy();
  }

  applyEffect(ship: Ship, _deltaTime: number): void {
    if (this.armed && !this.detonated) {
      this.detonate();
      ship.takeDamage(this.blastDamage);
    }
  }

  getBlastDamage(): number {
    return this.blastDamage;
  }
}
