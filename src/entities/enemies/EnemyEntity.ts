import * as THREE from 'three';
import { Entity } from '../Entity';
import { EnemyWeapon } from '../../weapons/EnemyWeapon';
import { Projectile } from '../../weapons/Projectile';
import { EnemyType } from './EnemyTypes';

/**
 * Abstract base class for all enemy entities.
 * Extends Entity with scoring, contact damage, AI behavior, and weapons.
 */
export abstract class EnemyEntity extends Entity {
  /** Points awarded to the player when this enemy is destroyed */
  protected scoreValue: number;

  /** Damage dealt if the enemy collides with the player ship */
  protected contactDamage: number;

  /** Optional weapon for ranged attacks */
  protected weapon: EnemyWeapon | null = null;

  /** Reference to the player's position (updated externally each frame) */
  protected playerPosition: THREE.Vector3 = new THREE.Vector3();

  /** The type enum value for this enemy */
  protected enemyType: EnemyType;

  /** Reusable vector for movement calculations */
  protected static tempMove: THREE.Vector3 = new THREE.Vector3();

  constructor(
    scene: THREE.Scene,
    position: THREE.Vector3,
    health: number,
    scoreValue: number,
    contactDamage: number,
    enemyType: EnemyType
  ) {
    super(scene, position, health);
    this.scoreValue = scoreValue;
    this.contactDamage = contactDamage;
    this.enemyType = enemyType;
  }

  /**
   * Subclasses implement their unique AI behavior here.
   * Called every frame from update().
   */
  protected abstract updateAI(deltaTime: number): void;

  /**
   * Creates the procedural 3D model for this enemy type.
   * Called during construction.
   */
  protected abstract createModel(): THREE.Object3D;

  /**
   * Per-frame update: runs AI, weapon, and movement.
   */
  update(deltaTime: number): boolean {
    if (!this.active) return false;

    this.updateAI(deltaTime);

    if (this.weapon) {
      this.weapon.update(deltaTime);
    }

    // Update hitbox
    this.hitbox.center.copy(this.position);

    // Update model position
    if (this.model) {
      this.model.position.copy(this.position);
    }

    // Remove if too far behind the player
    if (this.position.z > 1200) {
      this.destroy();
      return false;
    }

    return true;
  }

  /**
   * Sets the player position reference for AI targeting.
   */
  setPlayerPosition(pos: THREE.Vector3): void {
    this.playerPosition.copy(pos);
  }

  /**
   * Gets the score value awarded when this enemy is destroyed.
   */
  getScoreValue(): number {
    return this.scoreValue;
  }

  /**
   * Gets the contact damage dealt on collision with the player.
   */
  getContactDamage(): number {
    return this.contactDamage;
  }

  /**
   * Gets this enemy's type.
   */
  getEnemyType(): EnemyType {
    return this.enemyType;
  }

  /**
   * Gets all active projectiles from this enemy's weapon.
   */
  getProjectiles(): Projectile[] {
    if (!this.weapon) return [];
    return this.weapon.getProjectiles();
  }

  /**
   * Override destroy to also dispose weapon projectiles.
   */
  destroy(): void {
    if (!this.active) return;
    if (this.weapon) {
      this.weapon.dispose();
    }
    super.destroy();
  }

  dispose(): void {
    if (this.weapon) {
      this.weapon.dispose();
    }
    super.dispose();
  }
}
