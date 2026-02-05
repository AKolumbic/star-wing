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

  /** Reusable Vector3 for movement calculations to avoid per-frame allocations */
  private static tempMovement: THREE.Vector3 = new THREE.Vector3();

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
   * Creates an irregular, jagged asteroid with realistic rocky geometry.
   * Uses vertex displacement and noise-like patterns for natural variation.
   * @returns The asteroid 3D model
   */
  private createModel(): THREE.Object3D {
    const asteroidGroup = new THREE.Group();

    // Choose asteroid type for variety (0-3)
    const asteroidType = Math.floor(Math.random() * 4);

    // Create base geometry with higher subdivision for more detail
    const detail = this.size > 35 ? 2 : 1;
    const baseGeometry = new THREE.IcosahedronGeometry(this.size, detail);

    // Apply jagged vertex displacement for irregular shape
    const positionAttribute = baseGeometry.getAttribute("position");
    const vertex = new THREE.Vector3();

    // Seed for consistent but random-looking displacement
    const seed = Math.random() * 1000;

    for (let i = 0; i < positionAttribute.count; i++) {
      vertex.fromBufferAttribute(positionAttribute, i);

      // Normalize to get direction from center
      const direction = vertex.clone().normalize();
      const originalLength = vertex.length();

      // Multi-octave noise-like displacement for natural rocky appearance
      let displacement = 0;

      // Large features (major bumps and indentations)
      displacement +=
        Math.sin(vertex.x * 0.3 + seed) *
        Math.cos(vertex.y * 0.4 + seed * 0.7) *
        Math.sin(vertex.z * 0.35 + seed * 1.3) *
        0.25;

      // Medium features (ridges and valleys)
      displacement +=
        Math.sin(vertex.x * 0.8 + seed * 2) *
        Math.sin(vertex.y * 0.9 + seed * 1.5) *
        Math.cos(vertex.z * 0.7 + seed * 0.8) *
        0.15;

      // Small features (surface roughness)
      displacement +=
        Math.sin(vertex.x * 2.5 + seed * 3) *
        Math.cos(vertex.y * 2.2 + seed * 2.5) *
        0.08;

      // Add some random spikes for jagged appearance
      if (Math.random() < 0.15) {
        displacement += (Math.random() - 0.3) * 0.2;
      }

      // Apply type-specific modifications
      switch (asteroidType) {
        case 0: // Elongated asteroid
          displacement += Math.abs(direction.y) * 0.2 - 0.1;
          break;
        case 1: // Flattened asteroid
          displacement -= Math.abs(direction.y) * 0.15;
          break;
        case 2: // Heavily cratered
          const craterNoise =
            Math.sin(vertex.x * 1.5) *
            Math.sin(vertex.y * 1.5) *
            Math.sin(vertex.z * 1.5);
          if (craterNoise > 0.3) {
            displacement -= 0.15;
          }
          break;
        case 3: // Jagged/spiky
          displacement *= 1.5;
          break;
      }

      // Apply displacement
      const newLength = originalLength * (1 + displacement);
      vertex.copy(direction.multiplyScalar(newLength));

      positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    // Recompute normals for proper lighting
    baseGeometry.computeVertexNormals();

    // Create varied color palette for asteroids
    const colorVariation = Math.random();
    let baseColor: number;
    let darkColor: number;

    if (colorVariation < 0.3) {
      // Iron-rich (reddish-brown)
      baseColor = 0x8b6b5c;
      darkColor = 0x5c4033;
    } else if (colorVariation < 0.6) {
      // Carbon-rich (dark gray)
      baseColor = 0x5a5a5a;
      darkColor = 0x3a3a3a;
    } else if (colorVariation < 0.85) {
      // Silicate (gray-tan)
      baseColor = 0x9a8b7a;
      darkColor = 0x6a5b4a;
    } else {
      // Metallic (silvery)
      baseColor = 0x8899aa;
      darkColor = 0x556677;
    }

    const baseMaterial = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: 0.85 + Math.random() * 0.1,
      metalness: colorVariation > 0.85 ? 0.4 : 0.1,
      flatShading: true,
    });

    const baseAsteroid = new THREE.Mesh(baseGeometry, baseMaterial);
    asteroidGroup.add(baseAsteroid);

    // Add protruding rock formations for larger asteroids
    if (this.size > 25) {
      const rockCount = Math.floor(Math.random() * 4) + 2;
      for (let i = 0; i < rockCount; i++) {
        const rockSize = this.size * (Math.random() * 0.3 + 0.15);
        const rockGeometry = new THREE.IcosahedronGeometry(rockSize, 1);

        // Displace rock vertices too
        const rockPositions = rockGeometry.getAttribute("position");
        for (let j = 0; j < rockPositions.count; j++) {
          vertex.fromBufferAttribute(rockPositions, j);
          const dir = vertex.clone().normalize();
          const len = vertex.length();
          const disp = 1 + (Math.random() - 0.5) * 0.3;
          vertex.copy(dir.multiplyScalar(len * disp));
          rockPositions.setXYZ(j, vertex.x, vertex.y, vertex.z);
        }
        rockGeometry.computeVertexNormals();

        const rockMaterial = new THREE.MeshStandardMaterial({
          color: darkColor,
          roughness: 0.9,
          metalness: 0.05,
          flatShading: true,
        });

        const rock = new THREE.Mesh(rockGeometry, rockMaterial);

        // Position on surface pointing outward
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const surfacePos = new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta),
          Math.sin(phi) * Math.sin(theta),
          Math.cos(phi)
        );
        rock.position.copy(surfacePos.multiplyScalar(this.size * 0.7));
        rock.lookAt(surfacePos.multiplyScalar(2));
        rock.rotateX(Math.random() * 0.5);

        asteroidGroup.add(rock);
      }
    }

    // Add deep cracks/crevices as dark lines
    const crackCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < crackCount; i++) {
      const crackGeometry = new THREE.BufferGeometry();
      const crackPoints: number[] = [];

      // Create a jagged crack line
      const startTheta = Math.random() * Math.PI * 2;
      const startPhi = Math.random() * Math.PI;
      let theta = startTheta;
      let phi = startPhi;

      for (let j = 0; j < 8; j++) {
        const r = this.size * 1.02; // Just above surface
        crackPoints.push(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi)
        );

        theta += (Math.random() - 0.5) * 0.4;
        phi += (Math.random() - 0.5) * 0.3;
      }

      crackGeometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(crackPoints, 3)
      );

      const crackMaterial = new THREE.LineBasicMaterial({
        color: 0x222222,
        linewidth: 2,
      });

      const crack = new THREE.Line(crackGeometry, crackMaterial);
      asteroidGroup.add(crack);
    }

    // Add subtle glow/dust effect for larger asteroids
    if (this.size > 30 && Math.random() < 0.4) {
      const dustGeometry = new THREE.BufferGeometry();
      const dustCount = 20;
      const dustPositions = new Float32Array(dustCount * 3);

      for (let i = 0; i < dustCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = this.size * (1.1 + Math.random() * 0.3);
        dustPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        dustPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        dustPositions[i * 3 + 2] = r * Math.cos(phi);
      }

      dustGeometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(dustPositions, 3)
      );

      const dustMaterial = new THREE.PointsMaterial({
        color: 0x888888,
        size: 1.5,
        transparent: true,
        opacity: 0.4,
      });

      const dust = new THREE.Points(dustGeometry, dustMaterial);
      asteroidGroup.add(dust);
    }

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

    // Update position using static temp vector to avoid per-frame allocation
    Asteroid.tempMovement.copy(this.velocity).multiplyScalar(deltaTime);
    this.position.add(Asteroid.tempMovement);
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
   * Gets a copy of the asteroid's position.
   * Use getPositionRef() for read-only access without allocation.
   * @returns A clone of the asteroid's position
   */
  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  /**
   * Gets a direct reference to the asteroid's position (read-only, do not modify).
   * Avoids allocation - use when you only need to read position values.
   * @returns Direct reference to the asteroid's position
   */
  getPositionRef(): THREE.Vector3 {
    return this.position;
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
