import * as THREE from 'three';
import { Hazard } from './Hazard';
import { HazardType } from './HazardTypes';
import { Ship } from '../Ship';

/**
 * RadiationCloud — area hazard that drains shields while the player is inside.
 * Cannot be destroyed. Large area of effect, continuous damage.
 */
export class RadiationCloud extends Hazard {
  private shieldDrainRate: number = 15; // per second
  private pulseTimer: number = 0;
  private cloudMesh: THREE.Mesh | null = null;

  constructor(scene: THREE.Scene, position: THREE.Vector3) {
    super(scene, position, 999, HazardType.RADIATION_CLOUD, false);

    this.driftSpeed = 25;
    this.model = this.createModel();
    this.scene.add(this.model);
    this.hitbox = new THREE.Sphere(this.position.clone(), 120);
  }

  protected createModel(): THREE.Object3D {
    const group = new THREE.Group();

    // Glowing green cloud
    const cloudGeo = new THREE.SphereGeometry(100, 12, 12);
    const cloudMat = new THREE.MeshBasicMaterial({
      color: 0x33ff33,
      transparent: true,
      opacity: 0.12,
      wireframe: false,
    });
    this.cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    group.add(this.cloudMesh);

    // Inner core
    const coreGeo = new THREE.SphereGeometry(40, 8, 8);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x44ff44,
      transparent: true,
      opacity: 0.2,
    });
    group.add(new THREE.Mesh(coreGeo, coreMat));

    // Warning particles (simple spheres)
    for (let i = 0; i < 5; i++) {
      const pGeo = new THREE.SphereGeometry(3, 4, 4);
      const pMat = new THREE.MeshBasicMaterial({
        color: 0x88ff88,
        transparent: true,
        opacity: 0.5,
      });
      const p = new THREE.Mesh(pGeo, pMat);
      p.position.set(
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 80
      );
      group.add(p);
    }

    group.position.copy(this.position);
    return group;
  }

  update(deltaTime: number): boolean {
    if (!this.active) return false;

    this.position.z += this.driftSpeed * deltaTime;

    if (this.model) {
      this.model.position.copy(this.position);
    }
    this.hitbox.center.copy(this.position);

    // Pulse effect
    this.pulseTimer += deltaTime;
    if (this.cloudMesh) {
      const scale = 1 + Math.sin(this.pulseTimer * 1.5) * 0.08;
      this.cloudMesh.scale.setScalar(scale);
      (this.cloudMesh.material as THREE.MeshBasicMaterial).opacity =
        0.08 + Math.sin(this.pulseTimer * 2) * 0.05;
    }

    if (this.position.z > 1500) {
      this.destroy();
      return false;
    }

    return true;
  }

  applyEffect(ship: Ship, deltaTime: number): void {
    // Drain shields continuously while inside the cloud
    ship.takeDamage(this.shieldDrainRate * deltaTime);
  }
}
