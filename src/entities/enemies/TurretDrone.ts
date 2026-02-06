import * as THREE from 'three';
import { EnemyEntity } from './EnemyEntity';
import { EnemyType } from './EnemyTypes';
import { EnemyWeapon } from '../../weapons/EnemyWeapon';
import { WeaponCategory } from '../../weapons/Weapon';

/**
 * TurretDrone — stationary/slow-drift enemy with area denial.
 * Rotates to track the player and fires steadily.
 */
export class TurretDrone extends EnemyEntity {
  private rotationAngle: number = 0;
  private rotationSpeed: number = 1.2; // rad/s — slow rotation

  constructor(scene: THREE.Scene, position: THREE.Vector3) {
    super(scene, position, 40, 60, 20, EnemyType.TURRET_DRONE);

    this.model = this.createModel();
    this.scene.add(this.model);
    this.hitbox = new THREE.Sphere(this.position.clone(), 20);

    this.weapon = new EnemyWeapon(scene, {
      damage: 10,
      speed: 500,
      fireInterval: 1.2,
      lifetime: 4,
      color: new THREE.Color(0xffff44),
      scale: 0.7,
      category: WeaponCategory.ENERGY,
    });
  }

  protected createModel(): THREE.Object3D {
    const group = new THREE.Group();

    // Disc body
    const bodyGeo = new THREE.CylinderGeometry(16, 16, 6, 8);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x888899,
      metalness: 0.6,
      roughness: 0.4,
      flatShading: true,
    });
    group.add(new THREE.Mesh(bodyGeo, bodyMat));

    // Barrel
    const barrelGeo = new THREE.CylinderGeometry(3, 3, 20, 6);
    barrelGeo.rotateX(Math.PI / 2);
    const barrelMat = new THREE.MeshStandardMaterial({
      color: 0x666677,
      metalness: 0.5,
      roughness: 0.5,
    });
    const barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.position.z = -12;
    group.add(barrel);

    // Sensor light
    const sensorGeo = new THREE.SphereGeometry(3, 6, 6);
    const sensorMat = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.9,
    });
    const sensor = new THREE.Mesh(sensorGeo, sensorMat);
    sensor.position.y = 4;
    group.add(sensor);

    group.position.copy(this.position);
    return group;
  }

  protected updateAI(deltaTime: number): void {
    // Very slow drift forward
    this.velocity.z = 40 * deltaTime;
    this.position.add(this.velocity);

    // Rotate to track player (clamped rotation speed)
    if (this.model) {
      const targetDir = new THREE.Vector3()
        .subVectors(this.playerPosition, this.position)
        .normalize();
      const targetAngle = Math.atan2(targetDir.x, -targetDir.z);
      const angleDiff = targetAngle - this.rotationAngle;

      // Clamp rotation per frame
      const maxRot = this.rotationSpeed * deltaTime;
      this.rotationAngle += Math.max(-maxRot, Math.min(maxRot, angleDiff));
      this.model.rotation.y = this.rotationAngle;
    }

    // Fire when player is roughly in front
    const toPlayer = new THREE.Vector3()
      .subVectors(this.playerPosition, this.position);
    if (toPlayer.length() < 1200 && this.weapon) {
      this.weapon.fire(this.position, this.playerPosition);
    }
  }
}
