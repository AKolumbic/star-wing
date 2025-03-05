import * as THREE from "three";
import { Background } from "./Background";
import { Logger } from "../../utils/Logger";

/**
 * Parameters that can be customized for the hyperspace background.
 */
export interface HyperspaceParams {
  /** Number of streak lines */
  streakCount?: number;
  /** Maximum length of streaks */
  maxStreakLength?: number;
  /** Core color of streaks */
  coreColor?: number;
  /** Edge color of streaks */
  edgeColor?: number;
  /** Speed of streaks */
  speed?: number;
}

/**
 * Default parameters for the hyperspace effect.
 */
const DEFAULT_PARAMS: Required<HyperspaceParams> = {
  streakCount: 500,
  maxStreakLength: 100,
  coreColor: 0x00ffff, // Cyan core
  edgeColor: 0x0000ff, // Blue edges
  speed: 1.0,
};

/**
 * Hyperspace background implementation.
 * Creates a field of moving light streaks to simulate hyperspace travel.
 */
export class HyperspaceBackground implements Background {
  /** Hyperspace streaks object */
  private streaks: THREE.LineSegments | null = null;

  /** Line positions */
  private linePositions: Float32Array | null = null;

  /** Line colors */
  private lineColors: Float32Array | null = null;

  /** Start length of each streak */
  private streakLengths: Float32Array | null = null;

  /** Material for the hyperspace streaks */
  private streaksMaterial: THREE.LineBasicMaterial | null = null;

  /** Current configuration parameters */
  private params: Required<HyperspaceParams>;

  /** Flag indicating if the hyperspace has been initialized */
  private initialized: boolean = false;

  /** Animation time */
  private time: number = 0;

  /** Logger instance */
  private logger = Logger.getInstance();

  /**
   * Create a new hyperspace background.
   * @param params Optional parameters to customize the hyperspace effect
   */
  constructor(params: HyperspaceParams = {}) {
    // Merge provided params with defaults
    this.params = { ...DEFAULT_PARAMS };

    // Apply any provided parameters
    Object.entries(params).forEach(([key, value]) => {
      this.setParameter(key, value);
    });
  }

  /**
   * Initialize the hyperspace background.
   * @returns Promise that resolves when initialization is complete
   */
  async init(): Promise<void> {
    // Create buffers for line segments
    const geometry = new THREE.BufferGeometry();

    // Each streak is a line segment (2 points)
    this.linePositions = new Float32Array(this.params.streakCount * 6);
    this.lineColors = new Float32Array(this.params.streakCount * 6);
    this.streakLengths = new Float32Array(this.params.streakCount);

    // Create line material
    this.streaksMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      linewidth: 1, // Note: linewidth > 1 not supported in WebGL
    });

    // Initialize all streaks
    this.resetAllStreaks();

    // Set attributes
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(this.linePositions, 3)
    );
    geometry.setAttribute(
      "color",
      new THREE.BufferAttribute(this.lineColors, 3)
    );

    // Create mesh
    this.streaks = new THREE.LineSegments(geometry, this.streaksMaterial);

    this.initialized = true;
    return Promise.resolve();
  }

  /**
   * Reset positions and properties of all streaks.
   * @private
   */
  private resetAllStreaks(): void {
    if (!this.linePositions || !this.lineColors || !this.streakLengths) return;

    const coreColor = new THREE.Color(this.params.coreColor);
    const edgeColor = new THREE.Color(this.params.edgeColor);

    for (let i = 0; i < this.params.streakCount; i++) {
      const baseIdx = i * 6;

      // Initial start position of streak (origin point)
      const originX = (Math.random() - 0.5) * 100;
      const originY = (Math.random() - 0.5) * 100;
      const originZ = (Math.random() - 0.5) * 100;

      // Create random direction vectors pointing outward
      const dirX = originX * 2;
      const dirY = originY * 2;
      const dirZ = originZ * 2 + Math.random() * 200; // Bias toward Z

      // Normalize and scale by random length
      const len = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);
      this.streakLengths[i] = 10 + Math.random() * this.params.maxStreakLength;

      const normX = (dirX / len) * this.streakLengths[i];
      const normY = (dirY / len) * this.streakLengths[i];
      const normZ = (dirZ / len) * this.streakLengths[i];

      // Set start point (near center)
      this.linePositions[baseIdx] = originX;
      this.linePositions[baseIdx + 1] = originY;
      this.linePositions[baseIdx + 2] = originZ;

      // Set end point (extruded outward)
      this.linePositions[baseIdx + 3] = originX + normX;
      this.linePositions[baseIdx + 4] = originY + normY;
      this.linePositions[baseIdx + 5] = originZ + normZ;

      // Set core color (start of streak)
      this.lineColors[baseIdx] = coreColor.r;
      this.lineColors[baseIdx + 1] = coreColor.g;
      this.lineColors[baseIdx + 2] = coreColor.b;

      // Set edge color (end of streak)
      this.lineColors[baseIdx + 3] = edgeColor.r;
      this.lineColors[baseIdx + 4] = edgeColor.g;
      this.lineColors[baseIdx + 5] = edgeColor.b;
    }
  }

  /**
   * Adds the hyperspace background to the scene.
   * @param scene The scene to add the hyperspace background to
   */
  addToScene(scene: THREE.Scene): void {
    if (!this.initialized) {
      this.logger.warn("Cannot add uninitialized hyperspace to scene");
      return;
    }

    if (!this.streaks) {
      this.logger.warn("Cannot add uninitialized streaks to scene");
      return;
    }

    scene.add(this.streaks);
  }

  /**
   * Remove this background from the scene.
   * @param scene The THREE.Scene to remove this background from
   */
  removeFromScene(scene: THREE.Scene): void {
    if (this.streaks) {
      scene.remove(this.streaks);
    }
  }

  /**
   * Update the hyperspace background for animation.
   * @param deltaTime Time in seconds since the last update
   */
  update(deltaTime: number): void {
    if (!this.streaks || !this.linePositions || !this.streakLengths) {
      return;
    }

    // Update time
    this.time += deltaTime * this.params.speed;

    // Stretch streaks as they move outward
    for (let i = 0; i < this.params.streakCount; i++) {
      const baseIdx = i * 6;

      // Scale streak based on time
      const scaleFactor = 1.0 + this.time * (0.5 + Math.random());

      // Calculate direction vector
      const dirX =
        this.linePositions[baseIdx + 3] - this.linePositions[baseIdx];
      const dirY =
        this.linePositions[baseIdx + 4] - this.linePositions[baseIdx + 1];
      const dirZ =
        this.linePositions[baseIdx + 5] - this.linePositions[baseIdx + 2];

      // Move and stretch the end point
      this.linePositions[baseIdx + 3] =
        this.linePositions[baseIdx] + dirX * scaleFactor;
      this.linePositions[baseIdx + 4] =
        this.linePositions[baseIdx + 1] + dirY * scaleFactor;
      this.linePositions[baseIdx + 5] =
        this.linePositions[baseIdx + 2] + dirZ * scaleFactor;

      // Reset streak if it gets too long
      const curLength = Math.sqrt(
        dirX * dirX * scaleFactor * scaleFactor +
          dirY * dirY * scaleFactor * scaleFactor +
          dirZ * dirZ * scaleFactor * scaleFactor
      );

      if (curLength > this.streakLengths[i] * 10) {
        // Reset this streak
        const originX = (Math.random() - 0.5) * 50;
        const originY = (Math.random() - 0.5) * 50;
        const originZ = (Math.random() - 0.5) * 50;

        // Create random direction vectors pointing outward
        const newDirX = originX;
        const newDirY = originY;
        const newDirZ = originZ + Math.random() * 100; // Bias toward Z

        // Normalize and scale
        const len = Math.sqrt(
          newDirX * newDirX + newDirY * newDirY + newDirZ * newDirZ
        );
        this.streakLengths[i] =
          10 + Math.random() * this.params.maxStreakLength;

        const normX = (newDirX / len) * this.streakLengths[i];
        const normY = (newDirY / len) * this.streakLengths[i];
        const normZ = (newDirZ / len) * this.streakLengths[i];

        // Reset positions
        this.linePositions[baseIdx] = originX;
        this.linePositions[baseIdx + 1] = originY;
        this.linePositions[baseIdx + 2] = originZ;

        this.linePositions[baseIdx + 3] = originX + normX;
        this.linePositions[baseIdx + 4] = originY + normY;
        this.linePositions[baseIdx + 5] = originZ + normZ;
      }
    }

    // Mark for update
    this.streaks.geometry.attributes.position.needsUpdate = true;
  }

  /**
   * Clean up resources used by this background.
   */
  dispose(): void {
    if (this.streaks) {
      this.streaks.geometry.dispose();

      if (this.streaksMaterial) {
        this.streaksMaterial.dispose();
      }

      this.streaks = null;
      this.streaksMaterial = null;
      this.linePositions = null;
      this.lineColors = null;
      this.streakLengths = null;
    }

    this.initialized = false;
  }

  /**
   * Set a parameter value for this background.
   * @param key The parameter key
   * @param value The parameter value
   */
  setParameter(key: string, value: any): void {
    // Type safety check
    if (key in this.params) {
      (this.params as any)[key] = value;
    }
  }

  /**
   * Get a parameter value for this background.
   * @param key The parameter key
   * @returns The parameter value or undefined if not set
   */
  getParameter(key: string): any {
    if (key in this.params) {
      return (this.params as any)[key];
    }
    return undefined;
  }
}
