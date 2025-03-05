import * as THREE from "three";
import { Weapon, WeaponCategory, WeaponProps } from "../Weapon";
import { Projectile, ProjectileProps } from "../Projectile";

/**
 * Rapid-fire ballistic gun - high fire rate but lower damage per shot
 * Effective against small, agile enemies
 */
export class RapidFireGun extends Weapon {
  private projectiles: Projectile[] = [];

  /**
   * Creates a new RapidFireGun weapon
   * @param scene The scene to add projectiles to
   */
  constructor(scene: THREE.Scene) {
    const props: WeaponProps = {
      name: "Rapid Fire Gun",
      description:
        "High-velocity ballistic weapon with rapid rate of fire. Perfect for taking down swarms of light fighters.",
      damage: 5, // Lower damage than laser
      fireRate: 10, // 10 shots per second - very fast!
      cooldown: 0.1, // 1/10 second between shots
      range: 800, // Shorter range than laser
      category: WeaponCategory.BALLISTIC,
      energyCost: 0.5, // Less energy per shot
      projectileSpeed: 750, // Very fast projectile speed
      projectileColor: new THREE.Color(0xffaa22), // Orange-yellow
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
   * Creates and fires ballistic projectiles
   * @param position The position to fire from
   * @param direction The direction to fire in
   */
  protected onFire(position: THREE.Vector3, direction: THREE.Vector3): boolean {
    // Get upgrade level for modifications
    const upgradeLevel = this.props.upgradeLevel || 0;

    // Create projectile props
    const projectileProps: ProjectileProps = {
      damage: this.props.damage,
      speed: this.props.projectileSpeed || 500,
      lifetime: 1.2, // Shorter lifetime than laser
      color: this.props.projectileColor,
      category: WeaponCategory.BALLISTIC,
      scale: 0.7, // Smaller projectiles
    };

    // Base position slightly modified to fire from ship's gun positions
    const offsetRight = new THREE.Vector3(5, 0, 0);
    const offsetLeft = new THREE.Vector3(-5, 0, 0);

    // Create right-side projectile
    const projectileRight = new Projectile(
      position.clone().add(offsetRight),
      direction,
      projectileProps,
      this.scene
    );
    this.projectiles.push(projectileRight);

    // Create left-side projectile
    const projectileLeft = new Projectile(
      position.clone().add(offsetLeft),
      direction,
      projectileProps,
      this.scene
    );
    this.projectiles.push(projectileLeft);

    // Add spread shots if upgraded
    if (upgradeLevel >= 2) {
      // At level 2+, add additional angled shots
      const spreadAngle = 0.1; // About 5.7 degrees

      // Right spread
      const rightSpreadDir = direction.clone();
      rightSpreadDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), spreadAngle);
      const projectileRightSpread = new Projectile(
        position.clone().add(offsetRight),
        rightSpreadDir,
        projectileProps,
        this.scene
      );
      this.projectiles.push(projectileRightSpread);

      // Left spread
      const leftSpreadDir = direction.clone();
      leftSpreadDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), -spreadAngle);
      const projectileLeftSpread = new Projectile(
        position.clone().add(offsetLeft),
        leftSpreadDir,
        projectileProps,
        this.scene
      );
      this.projectiles.push(projectileLeftSpread);
    }

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
