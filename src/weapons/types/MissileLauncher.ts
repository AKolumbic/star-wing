import * as THREE from "three";
import { Weapon, WeaponCategory, WeaponProps } from "../Weapon";
import { Projectile, ProjectileProps } from "../Projectile";

/**
 * Missile Launcher - explosive secondary weapon
 * Slower fire rate but high damage with area effect
 */
export class MissileLauncher extends Weapon {
  private projectiles: Projectile[] = [];

  /**
   * Creates a new MissileLauncher weapon
   * @param scene The scene to add projectiles to
   */
  constructor(scene: THREE.Scene) {
    const props: WeaponProps = {
      name: "Missile Launcher",
      description:
        "Launches explosive missiles that deal high damage in a blast radius. Effective against larger targets.",
      damage: 30, // High damage
      fireRate: 1, // 1 shot per second - slow
      cooldown: 1.0, // Full second between shots
      range: 1200, // Long range
      category: WeaponCategory.EXPLOSIVE,
      energyCost: 5, // High energy cost
      projectileSpeed: 350, // Slower than bullets or lasers
      projectileColor: new THREE.Color(0xff3300), // Red-orange
      ammo: 10, // Limited ammo
      maxAmmo: 10,
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
   * Creates and fires a missile projectile
   * @param position The position to fire from
   * @param direction The direction to fire in
   */
  protected onFire(position: THREE.Vector3, direction: THREE.Vector3): boolean {
    // Get upgrade level for modifications
    const upgradeLevel = this.props.upgradeLevel || 0;

    // Calculate blast radius based on upgrade level
    const baseBlastRadius = 50;
    const blastRadius = baseBlastRadius * (1 + upgradeLevel * 0.25); // 25% increase per level

    // Create projectile props
    const projectileProps: ProjectileProps = {
      damage: this.props.damage,
      speed: this.props.projectileSpeed || 350,
      lifetime: 3.0, // Longer lifetime
      color: this.props.projectileColor,
      category: WeaponCategory.EXPLOSIVE,
      blastRadius: blastRadius,
      isHoming: true, // Missiles have tracking capability
      scale: 1.2, // Larger projectile
    };

    // Fire from slightly below ship to avoid self-collision
    const spawnPosition = position.clone().add(new THREE.Vector3(0, -5, 0));

    // Create and add the projectile
    const projectile = new Projectile(
      spawnPosition,
      direction,
      projectileProps,
      this.scene
    );
    this.projectiles.push(projectile);

    // At higher upgrade levels, fire multiple missiles
    if (upgradeLevel >= 2 && this.props.ammo && this.props.ammo > 1) {
      // Apply a slight delay and offset
      setTimeout(() => {
        // Make sure we still have ammo (second check)
        if (this.props.ammo && this.props.ammo > 0) {
          // Reduce ammo (manually since we're not using the main fire method)
          this.props.ammo--;

          // Launch second missile slightly off-center
          const offsetPosition = spawnPosition
            .clone()
            .add(new THREE.Vector3(8, 0, 0));
          const secondMissile = new Projectile(
            offsetPosition,
            direction,
            projectileProps,
            this.scene
          );
          this.projectiles.push(secondMissile);
        }
      }, 200); // 200ms delay
    }

    // Play sound effect (to be implemented)
    // this.playFireSound();

    return true;
  }

  /**
   * Handles the explosion effect when a missile hits a target
   * @param position Position of the explosion
   * @param radius Radius of the explosion
   */
  createExplosion(position: THREE.Vector3, radius: number): void {
    // This would normally create an explosion effect and damage
    // any enemies caught in the blast radius

    // For now, just create a simple particle system for visual effect
    const particleCount = 30;
    const particles = new THREE.Group();

    // Create simple particle geometries
    for (let i = 0; i < particleCount; i++) {
      const particle = new THREE.Mesh(
        new THREE.SphereGeometry(2, 4, 4),
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(0xff5500),
          transparent: true,
          opacity: 0.8,
        })
      );

      // Random position within explosion radius
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = Math.random() * radius * 0.8;

      particle.position.x = position.x + r * Math.sin(phi) * Math.cos(theta);
      particle.position.y = position.y + r * Math.sin(phi) * Math.sin(theta);
      particle.position.z = position.z + r * Math.cos(phi);

      particles.add(particle);
    }

    // Add to scene
    this.scene.add(particles);

    // Remove after short delay
    setTimeout(() => {
      this.scene.remove(particles);

      // Dispose of geometries and materials
      particles.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((material) => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
    }, 1000); // 1 second
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
