import * as THREE from 'three';
import { Hazard } from './Hazard';
import { HazardType } from './HazardTypes';
import { Ship } from '../Ship';

/**
 * GravityRift — applies a lateral pull force on the player.
 * Cannot be destroyed. Constrains movement, forces dodging.
 */
export class GravityRift extends Hazard {
  private pullForce: number = 150; // units/s
  private pullDirection: THREE.Vector3;
  private rotationTimer: number = 0;

  constructor(scene: THREE.Scene, position: THREE.Vector3) {
    super(scene, position, 999, HazardType.GRAVITY_RIFT, false);

    this.driftSpeed = 35;
    // Random lateral pull direction
    this.pullDirection = new THREE.Vector3(
      Math.random() > 0.5 ? 1 : -1,
      (Math.random() - 0.5) * 0.3,
      0
    ).normalize();

    this.model = this.createModel();
    this.scene.add(this.model);
    this.hitbox = new THREE.Sphere(this.position.clone(), 100);
  }

  protected createModel(): THREE.Object3D {
    const group = new THREE.Group();

    // Swirling torus to represent the rift
    const torusGeo = new THREE.TorusGeometry(60, 8, 8, 16);
    const torusMat = new THREE.MeshBasicMaterial({
      color: 0x8844ff,
      transparent: true,
      opacity: 0.2,
      wireframe: true,
    });
    group.add(new THREE.Mesh(torusGeo, torusMat));

    // Inner distortion sphere
    const innerGeo = new THREE.SphereGeometry(30, 8, 8);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x6633cc,
      transparent: true,
      opacity: 0.1,
    });
    group.add(new THREE.Mesh(innerGeo, innerMat));

    // Center point
    const centerGeo = new THREE.SphereGeometry(5, 6, 6);
    const centerMat = new THREE.MeshBasicMaterial({
      color: 0xaa66ff,
      transparent: true,
      opacity: 0.6,
    });
    group.add(new THREE.Mesh(centerGeo, centerMat));

    group.position.copy(this.position);
    return group;
  }

  update(deltaTime: number): boolean {
    if (!this.active) return false;

    this.position.z += this.driftSpeed * deltaTime;

    if (this.model) {
      this.model.position.copy(this.position);
      this.rotationTimer += deltaTime;
      this.model.rotation.z = this.rotationTimer * 0.3;
      this.model.rotation.x = Math.sin(this.rotationTimer * 0.5) * 0.2;
    }
    this.hitbox.center.copy(this.position);

    if (this.position.z > 1500) {
      this.destroy();
      return false;
    }

    return true;
  }

  applyEffect(ship: Ship, deltaTime: number): void {
    // Apply lateral pull force to the ship's velocity
    const pullVector = this.pullDirection.clone().multiplyScalar(this.pullForce * deltaTime);
    ship.getPosition().add(pullVector);
  }

  getPullDirection(): THREE.Vector3 {
    return this.pullDirection.clone();
  }
}
