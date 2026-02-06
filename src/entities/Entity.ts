import * as THREE from 'three';
import { Logger } from '../utils/Logger';

/**
 * Abstract base class for all game entities in Star Wing.
 * Provides shared state (position, velocity, hitbox, health) and lifecycle
 * methods (update, destroy, dispose) that subclasses build upon.
 */
export abstract class Entity {
  /** The entity's current position in world space */
  protected position: THREE.Vector3;

  /** The entity's current velocity */
  protected velocity: THREE.Vector3;

  /** Sphere hitbox used for collision detection */
  protected hitbox: THREE.Sphere;

  /** The 3D model representing this entity */
  protected model: THREE.Object3D | null = null;

  /** Reference to the Three.js scene this entity lives in */
  protected scene: THREE.Scene;

  /** Whether the entity is active (alive and participating in gameplay) */
  protected active: boolean = true;

  /** Current health points */
  protected health: number;

  /** Maximum health points */
  protected maxHealth: number;

  /** Logger instance */
  protected logger = Logger.getInstance();

  /**
   * Creates a new Entity.
   * @param scene The THREE.Scene to add this entity to
   * @param position The initial world-space position
   * @param health Initial (and max) health value
   */
  constructor(scene: THREE.Scene, position: THREE.Vector3, health: number = 1) {
    this.scene = scene;
    this.position = position.clone();
    this.velocity = new THREE.Vector3();
    this.hitbox = new THREE.Sphere(this.position.clone(), 0);
    this.health = health;
    this.maxHealth = health;
  }

  /**
   * Per-frame update. Subclasses implement movement, AI, animation, etc.
   * @param deltaTime Seconds since the previous frame
   * @returns true if the entity is still active, false if it should be removed
   */
  abstract update(deltaTime: number): boolean;

  /**
   * Applies damage to this entity, reducing health.
   * Calls destroy() when health reaches zero.
   * @param amount Raw damage to apply
   * @returns true if the entity was destroyed, false if still alive
   */
  takeDamage(amount: number): boolean {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.destroy();
      return true;
    }
    return false;
  }

  /**
   * Gets the collision sphere for this entity.
   */
  getHitbox(): THREE.Sphere {
    return this.hitbox;
  }

  /**
   * Gets a clone of the entity's position (safe to modify).
   */
  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  /**
   * Gets a direct reference to the entity's position (read-only by convention).
   * Avoids allocation — use when you only need to read position values.
   */
  getPositionRef(): THREE.Vector3 {
    return this.position;
  }

  /**
   * Whether this entity is still active in the game world.
   */
  isActive(): boolean {
    return this.active;
  }

  /**
   * Gets the entity's current health.
   */
  getHealth(): number {
    return this.health;
  }

  /**
   * Gets the entity's maximum health.
   */
  getMaxHealth(): number {
    return this.maxHealth;
  }

  /**
   * Removes the entity from the scene and marks it inactive.
   * Subclasses should call super.destroy() and add their own cleanup
   * (sound effects, score awards, etc.).
   */
  destroy(): void {
    if (!this.active) return;
    this.active = false;
    if (this.model) {
      this.scene.remove(this.model);
    }
  }

  /**
   * Full resource cleanup — geometry, materials, textures.
   * Call when the entity is permanently removed (game reset, zone transition).
   */
  dispose(): void {
    this.destroy();
    if (this.model) {
      this.model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) {
            child.geometry.dispose();
          }
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((m) => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
    }
  }
}
