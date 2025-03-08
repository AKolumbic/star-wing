import * as THREE from "three";
import { Logger } from "../utils/Logger";
import { Game } from "../core/Game";

/**
 * Represents an asteroid obstacle in the game.
 * Asteroids move toward the player and can damage the ship on collision.
 */
export class Asteroid {
  /** The 3D model of the asteroid */
  private model: THREE.Object3D;

  /** The mesh representing the asteroid's hitbox */
  private hitbox: THREE.Sphere;

  /** The asteroid's current position */
  private position: THREE.Vector3;

  /** The asteroid's current velocity */
  private velocity: THREE.Vector3;

  /** The asteroid's rotation speed on each axis */
  private rotationSpeed: THREE.Vector3;

  /** The asteroid's size (radius) */
  private size: number;

  /** The asteroid's damage amount on collision */
  private damage: number;

  /** Reference to the Three.js scene */
  private scene: THREE.Scene;

  /** Whether the asteroid is active/visible */
  private active: boolean = true;

  /** Reference to the Game instance */
  private game: Game | null = null;

  /** Logger instance */
  private logger = Logger.getInstance();

  /**
   * Creates a new Asteroid instance.
   * @param scene The THREE.Scene to add the asteroid to
   * @param position The starting position of the asteroid
   * @param direction The direction the asteroid will travel
   * @param speed The speed of the asteroid
   * @param size The size (radius) of the asteroid
   * @param damage The damage the asteroid deals on collision
   */
  constructor(
    scene: THREE.Scene,
    position: THREE.Vector3,
    direction: THREE.Vector3,
    speed: number = 200,
    size: number = 30,
    damage: number = 25
  ) {
    this.scene = scene;
    this.position = position.clone();
    this.velocity = direction.normalize().multiplyScalar(speed);
    this.size = size;
    this.damage = damage;

    // Create random rotation speeds
    this.rotationSpeed = new THREE.Vector3(
      Math.random() * 0.5 - 0.25,
      Math.random() * 0.5 - 0.25,
      Math.random() * 0.5 - 0.25
    );

    // Create the 3D model
    this.model = this.createModel();
    this.scene.add(this.model);

    // Create the hitbox
    this.hitbox = new THREE.Sphere(this.position.clone(), this.size * 0.8); // Slightly smaller than visual model

    this.logger.debug(
      `Asteroid created at position ${this.position.x.toFixed(
        2
      )}, ${this.position.y.toFixed(2)}, ${this.position.z.toFixed(2)}`
    );
  }

  /**
   * Creates the asteroid 3D model with a rocky texture.
   * @returns The asteroid 3D model
   */
  private createModel(): THREE.Object3D {
    // Create a group to hold all parts of the asteroid
    const asteroidGroup = new THREE.Group();

    // Create a random, lumpy asteroid shape using multiple spheres
    const baseGeometry = new THREE.IcosahedronGeometry(this.size, 1);
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true,
    });

    const baseAsteroid = new THREE.Mesh(baseGeometry, baseMaterial);
    asteroidGroup.add(baseAsteroid);

    // Add some smaller lumps to create an irregular shape
    const lumpCount = Math.floor(Math.random() * 5) + 3;
    for (let i = 0; i < lumpCount; i++) {
      const lumpSize = this.size * (Math.random() * 0.4 + 0.1);
      const lumpGeometry = new THREE.IcosahedronGeometry(lumpSize, 1);
      const lump = new THREE.Mesh(lumpGeometry, baseMaterial);

      // Position lumps on the surface of the base asteroid
      const angle1 = Math.random() * Math.PI * 2;
      const angle2 = Math.random() * Math.PI * 2;
      const positionOnSphere = new THREE.Vector3(
        Math.sin(angle1) * Math.cos(angle2),
        Math.sin(angle1) * Math.sin(angle2),
        Math.cos(angle1)
      );
      lump.position.copy(positionOnSphere.multiplyScalar(this.size * 0.6));
      asteroidGroup.add(lump);
    }

    // Add some surface details (craters)
    const craterCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < craterCount; i++) {
      const craterSize = this.size * (Math.random() * 0.3 + 0.1);
      const craterGeometry = new THREE.CircleGeometry(craterSize, 8);
      const craterMaterial = new THREE.MeshStandardMaterial({
        color: 0x666666,
        roughness: 0.95,
        metalness: 0.05,
        side: THREE.DoubleSide,
      });
      const crater = new THREE.Mesh(craterGeometry, craterMaterial);

      // Position craters on the surface of the base asteroid
      const angle1 = Math.random() * Math.PI * 2;
      const angle2 = Math.random() * Math.PI * 2;
      const positionOnSphere = new THREE.Vector3(
        Math.sin(angle1) * Math.cos(angle2),
        Math.sin(angle1) * Math.sin(angle2),
        Math.cos(angle1)
      );
      crater.position.copy(positionOnSphere.multiplyScalar(this.size * 0.9));
      crater.lookAt(0, 0, 0);
      asteroidGroup.add(crater);
    }

    // Position the model at the asteroid's position
    asteroidGroup.position.copy(this.position);

    return asteroidGroup;
  }

  /**
   * Updates the asteroid position and rotation.
   * @param deltaTime Time elapsed since the last frame in seconds
   * @returns Whether the asteroid is still active
   */
  update(deltaTime: number): boolean {
    if (!this.active) return false;

    // Update position
    const movement = this.velocity.clone().multiplyScalar(deltaTime);
    this.position.add(movement);
    this.model.position.copy(this.position);

    // Update hitbox position
    this.hitbox.center.copy(this.position);

    // Apply rotation
    this.model.rotation.x += this.rotationSpeed.x * deltaTime;
    this.model.rotation.y += this.rotationSpeed.y * deltaTime;
    this.model.rotation.z += this.rotationSpeed.z * deltaTime;

    // Check if asteroid has moved too far (for cleanup)
    if (this.position.z > 1000) {
      this.destroy();
      return false;
    }

    return true;
  }

  /**
   * Gets the asteroid's hitbox for collision detection.
   * @returns The asteroid's hitbox sphere
   */
  getHitbox(): THREE.Sphere {
    return this.hitbox;
  }

  /**
   * Gets the asteroid's position.
   * @returns The asteroid's position
   */
  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  /**
   * Gets the damage amount this asteroid deals on collision.
   * @returns The damage amount
   */
  getDamage(): number {
    return this.damage;
  }

  /**
   * Gets the size (radius) of the asteroid.
   * @returns The asteroid's size
   */
  getSize(): number {
    return this.size;
  }

  /**
   * Gets whether the asteroid is active.
   * @returns Whether the asteroid is active
   */
  isActive(): boolean {
    return this.active;
  }

  /**
   * Sets the game reference
   * @param game The Game instance
   */
  setGame(game: Game): void {
    this.game = game;
  }

  /**
   * Handles collision with the player ship.
   * @returns The damage amount
   */
  handleCollision(): number {
    // Destroy the asteroid on collision
    this.destroy();
    return this.damage;
  }

  /**
   * Destroys the asteroid, removing it from the scene.
   */
  destroy(): void {
    if (!this.active) return;

    this.active = false;
    this.scene.remove(this.model);

    // Play destruction sound if game reference is available
    if (this.game) {
      try {
        // Use a different intensity based on asteroid size
        const intensity =
          this.size > 40 ? "heavy" : this.size < 20 ? "light" : "medium";
        this.game.getAudioManager().playAsteroidCollisionSound(intensity);
        this.logger.debug("Playing asteroid destruction sound");
      } catch (error) {
        this.logger.warn("Failed to play asteroid destruction sound:", error);
      }
    }

    this.logger.debug(
      `Asteroid destroyed at position ${this.position.x.toFixed(
        2
      )}, ${this.position.y.toFixed(2)}, ${this.position.z.toFixed(2)}`
    );
  }

  /**
   * Completely cleans up all asteroid resources.
   * Should be called when removing the asteroid permanently (e.g., during game reset).
   */
  dispose(): void {
    // First destroy the asteroid to remove it from the scene
    this.destroy();

    // Then dispose of geometry and materials
    if (this.model) {
      this.model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) {
            child.geometry.dispose();
          }
          if (child.material) {
            // Handle both single and array of materials
            if (Array.isArray(child.material)) {
              child.material.forEach((material) => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
    }
  }
}
