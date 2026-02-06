import * as THREE from "three";
import { WeaponCategory } from "./Weapon";

/**
 * Interface for projectile properties
 */
export interface ProjectileProps {
  damage: number;
  speed: number;
  lifetime: number; // How long the projectile lives in seconds
  color?: THREE.Color; // Optional color
  scale?: number; // Optional scale factor
  category: WeaponCategory; // The type of weapon that fired this projectile
  blastRadius?: number; // For explosive projectiles
  isHoming?: boolean; // Whether the projectile should home in on targets
  isPierce?: boolean; // Whether the projectile can pierce through targets
  isBounce?: boolean; // Whether the projectile can bounce off obstacles
}

/**
 * Represents a projectile fired by a weapon
 */
export class Projectile {
  private mesh: THREE.Object3D;
  private velocity: THREE.Vector3;
  private position: THREE.Vector3;
  private scene: THREE.Scene;
  private timeAlive: number = 0;
  private isActive: boolean = true;
  private props: ProjectileProps;
  private hitbox: THREE.Sphere;

  // Reusable Vector3 for movement calculations to avoid allocations in update loop
  private static readonly tempMovement: THREE.Vector3 = new THREE.Vector3();

  /**
   * Creates a new projectile
   * @param position The starting position
   * @param direction The direction to travel
   * @param props The projectile properties
   * @param scene The scene to add the projectile to
   */
  constructor(
    position: THREE.Vector3,
    direction: THREE.Vector3,
    props: ProjectileProps,
    scene: THREE.Scene
  ) {
    this.position = position.clone();
    this.velocity = direction.normalize().multiplyScalar(props.speed);
    this.props = props;
    this.scene = scene;

    // Create a hitbox for collision detection
    this.hitbox = new THREE.Sphere(this.position.clone(), 5); // Default radius of 5 units

    // Create the visual representation based on the weapon category
    this.mesh = this.createMesh();

    // Add to scene
    this.scene.add(this.mesh);
  }

  /**
   * Creates a mesh based on the weapon category
   */
  private createMesh(): THREE.Object3D {
    let geometry: THREE.BufferGeometry;
    let material: THREE.Material;
    let mesh: THREE.Object3D;

    const color = this.props.color || new THREE.Color(0xffffff);
    const scale = this.props.scale || 1.0;

    switch (this.props.category) {
      case WeaponCategory.BALLISTIC:
        // Small, fast projectile
        geometry = new THREE.SphereGeometry(3 * scale, 8, 8);
        material = new THREE.MeshBasicMaterial({ color: color });
        mesh = new THREE.Mesh(geometry, material);
        mesh.scale.z = 1.5; // Elongate slightly
        break;

      case WeaponCategory.ENERGY:
        // Energy beam - glowing effect
        geometry = new THREE.CylinderGeometry(
          2 * scale,
          2 * scale,
          15 * scale,
          6
        );
        geometry.rotateX(Math.PI / 2); // Rotate to point forward

        // Add glow effect with emissive material
        material = new THREE.MeshPhongMaterial({
          color: color,
          emissive: color,
          emissiveIntensity: 2.5, // Increased glow intensity for better visibility
          transparent: true,
          opacity: 0.9, // Higher opacity for better visibility
        });
        mesh = new THREE.Mesh(geometry, material);

        // Add a trail effect for better visibility
        const trailGeometry = new THREE.CylinderGeometry(
          3.5 * scale, // Slightly wider than the main beam
          1.5 * scale, // Tapered end
          20 * scale, // Longer than the main beam
          6
        );
        trailGeometry.rotateX(Math.PI / 2);

        const trailMaterial = new THREE.MeshPhongMaterial({
          color: color,
          emissive: color,
          emissiveIntensity: 1.2,
          transparent: true,
          opacity: 0.5, // More transparent than the main beam
        });

        const trail = new THREE.Mesh(trailGeometry, trailMaterial);
        trail.position.z = 5 * scale; // Position behind the main beam
        mesh.add(trail); // Add trail as child of the main projectile

        // Add a point light for extra glow
        const light = new THREE.PointLight(color, 1, 30);
        light.position.set(0, 0, 0);
        mesh.add(light);
        break;

      case WeaponCategory.EXPLOSIVE:
        // Chunky missile or bomb
        geometry = new THREE.ConeGeometry(4 * scale, 16 * scale, 8);
        geometry.rotateX(Math.PI / 2); // Rotate to point forward
        material = new THREE.MeshPhongMaterial({ color: color });
        mesh = new THREE.Mesh(geometry, material);

        // Add engine effect at back
        const engineGlow = new THREE.Mesh(
          new THREE.SphereGeometry(3 * scale, 8, 8),
          new THREE.MeshBasicMaterial({
            color: 0xff7700,
            transparent: true,
            opacity: 0.8,
          })
        );
        engineGlow.position.z = 8 * scale;
        mesh.add(engineGlow);
        break;

      case WeaponCategory.SPECIAL:
        // Unique, exotic appearance
        geometry = new THREE.IcosahedronGeometry(5 * scale, 0);
        material = new THREE.MeshPhongMaterial({
          color: color,
          wireframe: true,
          emissive: color,
          emissiveIntensity: 0.5,
        });
        mesh = new THREE.Mesh(geometry, material);

        // Add an inner glow with a second mesh
        const innerMesh = new THREE.Mesh(
          new THREE.IcosahedronGeometry(3 * scale, 0),
          new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.7,
          })
        );
        mesh.add(innerMesh);
        break;

      default:
        // Default fallback
        geometry = new THREE.BoxGeometry(5 * scale, 5 * scale, 10 * scale);
        material = new THREE.MeshBasicMaterial({ color: color });
        mesh = new THREE.Mesh(geometry, material);
    }

    // Set initial position
    mesh.position.copy(this.position);

    return mesh;
  }

  /**
   * Updates the projectile position and lifetime
   * @param deltaTime Time elapsed since last update
   * @returns Whether the projectile is still active
   */
  update(deltaTime: number): boolean {
    if (!this.isActive) return false;

    // Update lifetime
    this.timeAlive += deltaTime;
    if (this.timeAlive >= this.props.lifetime) {
      this.destroy();
      return false;
    }

    // Update position using reusable temp vector to avoid allocation
    Projectile.tempMovement.copy(this.velocity).multiplyScalar(deltaTime);
    this.position.add(Projectile.tempMovement);
    this.mesh.position.copy(this.position);

    // Update hitbox position
    this.hitbox.center.copy(this.position);

    // Special behavior for homing projectiles
    if (this.props.isHoming) {
      // This would normally find the closest enemy and adjust velocity
      // For now, we'll just add a simple wobble
      const wobble = Math.sin(this.timeAlive * 10) * 0.1;
      this.mesh.rotation.y = wobble;
    }

    // Add subtle rotation for visual interest
    this.mesh.rotation.x += deltaTime * 0.5;
    this.mesh.rotation.z += deltaTime * 0.3;

    return true;
  }

  /**
   * Handles collision with an enemy or obstacle
   * @returns The damage to apply
   */
  handleCollision(): number {
    if (!this.isActive) return 0;

    // For non-piercing projectiles, destroy on impact
    if (!this.props.isPierce) {
      this.destroy();
    }

    return this.props.damage;
  }

  /**
   * Gets the hitbox for collision detection
   */
  getHitbox(): THREE.Sphere {
    return this.hitbox;
  }

  /**
   * Gets whether the projectile is active
   */
  getIsActive(): boolean {
    return this.isActive;
  }

  /**
   * Gets the position of the projectile
   */
  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  /**
   * Gets the blast radius (if an explosive)
   */
  getBlastRadius(): number | undefined {
    return this.props.blastRadius;
  }

  /**
   * Destroys the projectile, removing it from the scene
   */
  destroy(): void {
    if (!this.isActive) return;

    this.isActive = false;
    this.scene.remove(this.mesh);

    // Clean up geometries and materials
    if (this.mesh instanceof THREE.Mesh) {
      if (this.mesh.geometry) {
        this.mesh.geometry.dispose();
      }

      if (this.mesh.material) {
        if (Array.isArray(this.mesh.material)) {
          this.mesh.material.forEach((material) => material.dispose());
        } else {
          this.mesh.material.dispose();
        }
      }
    }

    // Clean up any children (like lights)
    while (this.mesh.children.length > 0) {
      const child = this.mesh.children[0];
      this.mesh.remove(child);

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
    }
  }
}
