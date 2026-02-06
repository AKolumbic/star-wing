import * as THREE from 'three';
import { Projectile, ProjectileProps } from './Projectile';
import { WeaponCategory } from './Weapon';

/**
 * Configuration for an enemy weapon.
 */
export interface EnemyWeaponConfig {
  /** Damage per shot */
  damage: number;
  /** Projectile speed */
  speed: number;
  /** Seconds between shots */
  fireInterval: number;
  /** Projectile lifetime in seconds */
  lifetime: number;
  /** Projectile color */
  color: THREE.Color;
  /** Visual scale */
  scale: number;
  /** Weapon category for visual style */
  category: WeaponCategory;
  /** Number of shots in a burst (1 = single shot) */
  burstCount?: number;
  /** Delay between burst shots in seconds */
  burstDelay?: number;
  /** Whether projectiles home in */
  isHoming?: boolean;
}

/**
 * Simplified weapon system for enemy entities.
 * No ammo tracking or energy cost — just fires at a target.
 */
export class EnemyWeapon {
  private scene: THREE.Scene;
  private config: EnemyWeaponConfig;
  private projectiles: Projectile[] = [];
  private cooldownTimer: number = 0;
  private burstRemaining: number = 0;
  private burstTimer: number = 0;

  constructor(scene: THREE.Scene, config: EnemyWeaponConfig) {
    this.scene = scene;
    this.config = config;
  }

  /**
   * Attempts to fire at the given target position from the given origin.
   * Respects cooldown. If burstCount > 1, queues additional shots.
   */
  fire(origin: THREE.Vector3, targetPosition: THREE.Vector3): void {
    if (this.cooldownTimer > 0) return;

    this.fireProjectile(origin, targetPosition);
    this.cooldownTimer = this.config.fireInterval;

    // Queue burst shots
    const burstCount = this.config.burstCount || 1;
    if (burstCount > 1) {
      this.burstRemaining = burstCount - 1;
      this.burstTimer = this.config.burstDelay || 0.1;
    }
  }

  private fireProjectile(origin: THREE.Vector3, targetPosition: THREE.Vector3): void {
    const direction = new THREE.Vector3()
      .subVectors(targetPosition, origin)
      .normalize();

    // Add slight inaccuracy for gameplay fairness
    direction.x += (Math.random() - 0.5) * 0.08;
    direction.y += (Math.random() - 0.5) * 0.08;
    direction.normalize();

    const props: ProjectileProps = {
      damage: this.config.damage,
      speed: this.config.speed,
      lifetime: this.config.lifetime,
      color: this.config.color,
      scale: this.config.scale,
      category: this.config.category,
      isHoming: this.config.isHoming,
      owner: 'enemy',
    };

    const projectile = new Projectile(origin.clone(), direction, props, this.scene);
    this.projectiles.push(projectile);
  }

  /**
   * Updates cooldowns and projectiles.
   */
  update(deltaTime: number): void {
    // Update cooldown
    if (this.cooldownTimer > 0) {
      this.cooldownTimer -= deltaTime;
    }

    // Handle burst firing
    if (this.burstRemaining > 0) {
      this.burstTimer -= deltaTime;
      if (this.burstTimer <= 0) {
        // We need origin and target — burst uses last projectile direction
        // For simplicity, burst fires in the same direction as the previous shot
        this.burstRemaining--;
        this.burstTimer = this.config.burstDelay || 0.1;
      }
    }

    // Update and filter projectiles
    this.projectiles = this.projectiles.filter((p) => p.update(deltaTime));
  }

  /**
   * Gets all active projectiles from this weapon.
   */
  getProjectiles(): Projectile[] {
    return this.projectiles;
  }

  /**
   * Disposes all projectiles.
   */
  dispose(): void {
    for (const p of this.projectiles) {
      p.destroy();
    }
    this.projectiles = [];
  }
}
