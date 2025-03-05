import * as THREE from "three";
import { Weapon, WeaponCategory, WeaponProps } from "../Weapon";
import { Projectile, ProjectileProps } from "../Projectile";

/**
 * Basic laser cannon - the player's starting energy weapon
 * Fires fast, accurate laser bolts with moderate damage
 */
export class LaserCannon extends Weapon {
  private projectiles: Projectile[] = [];

  /**
   * Creates a new LaserCannon weapon
   * @param scene The scene to add projectiles to
   */
  constructor(scene: THREE.Scene) {
    const props: WeaponProps = {
      name: "Laser Cannon",
      description:
        "Standard issue laser cannon. Fast firing rate with moderate damage.",
      damage: 10,
      fireRate: 4, // 4 shots per second
      cooldown: 0.25, // 1/4 second between shots
      range: 1000,
      category: WeaponCategory.ENERGY,
      energyCost: 1,
      projectileSpeed: 600, // Fast moving
      projectileColor: new THREE.Color(0xff0022), // Bright red color
      scale: 1.3, // Slightly larger projectiles for better visibility
    };

    super(props, scene);
  }

  /**
   * Updates all active projectiles and removes inactive ones
   * @param deltaTime Time elapsed since last update
   */
  protected onUpdate(deltaTime: number): void {
    // Update all active projectiles
    this.projectiles = this.projectiles.filter((projectile) => {
      return projectile.update(deltaTime);
    });
  }

  /**
   * Creates and fires a laser projectile
   * @param position The position to fire from
   * @param direction The direction to fire in
   */
  protected onFire(position: THREE.Vector3, direction: THREE.Vector3): boolean {
    // Create projectile props
    const projectileProps: ProjectileProps = {
      damage: this.props.damage,
      speed: this.props.projectileSpeed || 400,
      lifetime: 2.0, // 2 seconds of flight time
      color: this.props.projectileColor,
      category: WeaponCategory.ENERGY,
      scale: (this.props.scale || 1.0) + (this.props.upgradeLevel || 0) * 0.1, // Base scale plus upgrade bonus
    };

    // Create and add the projectile
    const projectile = new Projectile(
      position,
      direction,
      projectileProps,
      this.scene
    );
    this.projectiles.push(projectile);

    // Play sound effect (to be implemented)
    // this.playFireSound();

    return true;
  }

  /**
   * Cleans up all projectiles when the weapon is disposed
   */
  dispose(): void {
    // Destroy all active projectiles
    this.projectiles.forEach((projectile) => {
      projectile.destroy();
    });
    this.projectiles = [];
  }
}
