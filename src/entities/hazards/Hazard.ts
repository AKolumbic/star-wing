import * as THREE from 'three';
import { Entity } from '../Entity';
import { HazardType } from './HazardTypes';

/**
 * Abstract base class for all environmental hazards.
 * Hazards are non-scoring obstacles that modify gameplay conditions.
 */
export abstract class Hazard extends Entity {
  /** The hazard type identifier */
  protected hazardType: HazardType;

  /** Whether this hazard can be destroyed by player weapons */
  protected destructible: boolean;

  /** Drift speed (most hazards move slowly toward the player) */
  protected driftSpeed: number = 50;

  constructor(
    scene: THREE.Scene,
    position: THREE.Vector3,
    health: number,
    hazardType: HazardType,
    destructible: boolean = false
  ) {
    super(scene, position, health);
    this.hazardType = hazardType;
    this.destructible = destructible;
  }

  /**
   * Subclasses implement their effect when the player is inside/nearby.
   * Called by Scene.ts when ship sphere overlaps hazard area.
   * @param ship Reference to the player ship for applying effects
   * @param deltaTime Frame delta
   */
  abstract applyEffect(ship: import('../Ship').Ship, deltaTime: number): void;

  /**
   * Creates the visual model for this hazard.
   */
  protected abstract createModel(): THREE.Object3D;

  getHazardType(): HazardType {
    return this.hazardType;
  }

  isDestructible(): boolean {
    return this.destructible;
  }
}
