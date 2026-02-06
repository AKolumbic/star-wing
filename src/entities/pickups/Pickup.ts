import * as THREE from 'three';
import { Entity } from '../Entity';
import { PickupType } from './PickupTypes';

/**
 * Abstract base class for all pickups.
 * Pickups drift toward the player and are collected on contact.
 * Features a "magnet" pull effect when the player is nearby.
 */
export abstract class Pickup extends Entity {
  /** The pickup type identifier */
  protected pickupType: PickupType;

  /** Drift speed toward the player */
  protected driftSpeed: number = 60;

  /** Magnet pull radius — pickup moves toward player within this distance */
  protected magnetRadius: number = 200;

  /** Magnet pull speed (overrides drift when active) */
  protected magnetSpeed: number = 400;

  /** Time before pickup despawns (seconds) */
  protected lifetime: number = 15;

  /** Timer tracking how long the pickup has existed */
  protected aliveTime: number = 0;

  /** Bobbing animation offset */
  protected bobTimer: number = 0;

  /** Reference to player position for magnet behavior */
  protected playerPosition: THREE.Vector3 = new THREE.Vector3();

  constructor(
    scene: THREE.Scene,
    position: THREE.Vector3,
    pickupType: PickupType
  ) {
    super(scene, position, 1);
    this.pickupType = pickupType;
  }

  /**
   * Subclasses implement the effect applied when collected.
   * @param ship The player ship
   */
  abstract applyPickup(ship: import('../Ship').Ship): void;

  /**
   * Creates the visual model for this pickup.
   */
  protected abstract createModel(): THREE.Object3D;

  /**
   * Updates position, magnet pull, bobbing animation, and lifetime.
   */
  update(deltaTime: number): boolean {
    if (!this.active) return false;

    this.aliveTime += deltaTime;
    this.bobTimer += deltaTime;

    // Lifetime expiry
    if (this.aliveTime >= this.lifetime) {
      this.destroy();
      return false;
    }

    const toPlayer = new THREE.Vector3()
      .subVectors(this.playerPosition, this.position);
    const dist = toPlayer.length();

    if (dist < this.magnetRadius && dist > 5) {
      // Magnet pull toward player
      toPlayer.normalize().multiplyScalar(this.magnetSpeed * deltaTime);
      this.position.add(toPlayer);
    } else {
      // Slow drift toward player's z
      this.position.z += this.driftSpeed * deltaTime;
    }

    // Bobbing effect
    if (this.model) {
      this.model.position.copy(this.position);
      this.model.position.y += Math.sin(this.bobTimer * 3) * 4;
      this.model.rotation.y += 1.5 * deltaTime;
    }

    this.hitbox.center.copy(this.position);

    // Remove if behind player
    if (this.position.z > 1000) {
      this.destroy();
      return false;
    }

    return true;
  }

  setPlayerPosition(pos: THREE.Vector3): void {
    this.playerPosition.copy(pos);
  }

  getPickupType(): PickupType {
    return this.pickupType;
  }
}
