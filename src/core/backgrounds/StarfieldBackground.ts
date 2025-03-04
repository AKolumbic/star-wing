import * as THREE from "three";
import { Background } from "./Background";

/**
 * Parameters that can be customized for the starfield background.
 */
export interface StarfieldParams {
  /** Number of stars in the field */
  starCount?: number;
  /** Size of the starfield area */
  fieldSize?: number;
  /** Star color (hex color) */
  starColor?: number;
  /** Base star size */
  baseStarSize?: number;
  /** Minimum star speed */
  minSpeed?: number;
  /** Maximum star speed */
  maxSpeed?: number;
  /** Direction of star movement (normalized vector) */
  direction?: THREE.Vector3;
}

/**
 * Default parameters for the starfield.
 */
const DEFAULT_PARAMS: Required<StarfieldParams> = {
  starCount: 1500,
  fieldSize: 2000,
  starColor: 0xffffff,
  baseStarSize: 2.5,
  minSpeed: 50,
  maxSpeed: 200,
  direction: new THREE.Vector3(0, 0, 1), // Default direction is forward (positive Z)
};

/**
 * Starfield background implementation.
 * Creates a field of stars with depth-based rendering and movement.
 */
export class StarfieldBackground implements Background {
  /** Star particles system */
  private stars: THREE.Points | null = null;

  /** Float32Array of star positions [x,y,z,x,y,z,...] */
  private starPositions: Float32Array | null = null;

  /** Individual speed of each star */
  private starSpeeds: Float32Array | null = null;

  /** Material for the starfield - cached for animation updates */
  private starMaterial: THREE.ShaderMaterial | null = null;

  /** Current configuration parameters */
  private params: Required<StarfieldParams>;

  /** Flag indicating if the starfield has been initialized */
  private initialized: boolean = false;

  /**
   * Create a new starfield background.
   * @param params Optional parameters to customize the starfield
   */
  constructor(params: StarfieldParams = {}) {
    // Merge provided params with defaults
    this.params = { ...DEFAULT_PARAMS };

    // Apply any provided parameters
    Object.entries(params).forEach(([key, value]) => {
      this.setParameter(key, value);
    });
  }

  /**
   * Initialize the starfield.
   * @returns Promise that resolves when initialization is complete
   */
  async init(): Promise<void> {
    // Create buffer geometry for stars
    const starGeometry = new THREE.BufferGeometry();

    // Allocate arrays for positions and speeds
    this.starPositions = new Float32Array(this.params.starCount * 3);
    this.starSpeeds = new Float32Array(this.params.starCount);

    // Initialize random star positions and speeds
    for (let i = 0; i < this.params.starCount; i++) {
      const idx = i * 3;
      const halfSize = this.params.fieldSize / 2;

      // Position (x,y,z) with z spread throughout the field
      this.starPositions[idx] = (Math.random() - 0.5) * this.params.fieldSize; // x
      this.starPositions[idx + 1] =
        (Math.random() - 0.5) * this.params.fieldSize; // y
      this.starPositions[idx + 2] =
        (Math.random() - 0.5) * this.params.fieldSize; // z

      // Random speed between min and max
      this.starSpeeds[i] =
        this.params.minSpeed +
        Math.random() * (this.params.maxSpeed - this.params.minSpeed);
    }

    // Add position attribute to geometry
    starGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(this.starPositions, 3)
    );

    // Create star material with custom shader for depth-based opacity
    this.starMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(this.params.starColor) },
        baseSize: { value: this.params.baseStarSize },
      },
      vertexShader: `
        uniform float baseSize;
        varying vec3 vPosition;
        
        void main() {
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          
          // Adjust star size based on Z position for depth effect
          float size = baseSize;
          
          // Stars closer to camera appear larger
          float sizeFactor = 1.0 + abs(position.z / 1000.0);
          gl_PointSize = baseSize * sizeFactor;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float time;
        varying vec3 vPosition;
        
        void main() {
          // Create a circular point shape with soft edge
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          
          // Discard pixels outside circle
          if (dist > 0.5) discard;
          
          // Calculate the opacity based on distance from center
          float opacity = 1.0 - smoothstep(0.3, 0.5, dist);
          
          // Add depth-based fading
          float depthFactor = smoothstep(-1000.0, 0.0, vPosition.z);
          opacity *= 0.4 + (0.6 * depthFactor);
          
          // Apply a subtle twinkle effect
          float twinkle = 0.8 + 0.2 * sin(time * 0.01 + vPosition.x * 0.1 + vPosition.y * 0.1);
          opacity *= twinkle;
          
          gl_FragColor = vec4(color, opacity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false, // Improves rendering of transparent particles
    });

    // Create stars mesh
    this.stars = new THREE.Points(starGeometry, this.starMaterial);

    this.initialized = true;
    return Promise.resolve();
  }

  /**
   * Add this starfield to the scene.
   * @param scene The THREE.Scene to add this background to
   */
  addToScene(scene: THREE.Scene): void {
    if (!this.initialized || !this.stars) {
      console.warn("Cannot add uninitialized starfield to scene");
      return;
    }

    scene.add(this.stars);
  }

  /**
   * Remove this starfield from the scene.
   * @param scene The THREE.Scene to remove this background from
   */
  removeFromScene(scene: THREE.Scene): void {
    if (this.stars) {
      scene.remove(this.stars);
    }
  }

  /**
   * Update the starfield for animation.
   * @param deltaTime Time in seconds since the last update
   */
  update(deltaTime: number): void {
    if (!this.stars || !this.starPositions || !this.starSpeeds) {
      return;
    }

    // Access star position data and material
    const positions = this.stars.geometry.attributes.position
      .array as Float32Array;

    // Update time uniform for shader animations
    if (this.starMaterial) {
      this.starMaterial.uniforms.time.value += deltaTime;
    }

    // Get normalized direction vector (default is positive Z)
    const direction = this.params.direction.clone().normalize();

    // Update star positions with varying speeds
    for (let i = 0; i < this.params.starCount; i++) {
      const idx = i * 3;

      // Move star in the specified direction
      positions[idx] += direction.x * deltaTime * this.starSpeeds[i];
      positions[idx + 1] += direction.y * deltaTime * this.starSpeeds[i];
      positions[idx + 2] += direction.z * deltaTime * this.starSpeeds[i];

      // Check if the star has moved outside the field in any direction
      const halfSize = this.params.fieldSize / 2;
      const x = positions[idx];
      const y = positions[idx + 1];
      const z = positions[idx + 2];

      let resetStar = false;

      // Check if star is outside the field in the main direction of movement
      if (direction.x > 0 && x > halfSize) resetStar = true;
      if (direction.x < 0 && x < -halfSize) resetStar = true;
      if (direction.y > 0 && y > halfSize) resetStar = true;
      if (direction.y < 0 && y < -halfSize) resetStar = true;
      if (direction.z > 0 && z > halfSize) resetStar = true;
      if (direction.z < 0 && z < -halfSize) resetStar = true;

      // Reset star to opposite side if it went out of bounds
      if (resetStar) {
        // Reset position opposite to the direction of movement
        positions[idx] = (Math.random() - 0.5) * this.params.fieldSize; // Random X
        if (Math.abs(direction.x) > 0.5) {
          positions[idx] = direction.x > 0 ? -halfSize : halfSize;
        }

        positions[idx + 1] = (Math.random() - 0.5) * this.params.fieldSize; // Random Y
        if (Math.abs(direction.y) > 0.5) {
          positions[idx + 1] = direction.y > 0 ? -halfSize : halfSize;
        }

        positions[idx + 2] = (Math.random() - 0.5) * this.params.fieldSize; // Random Z
        if (Math.abs(direction.z) > 0.5) {
          positions[idx + 2] = direction.z > 0 ? -halfSize : halfSize;
        }

        // Assign new random speed
        this.starSpeeds[i] =
          this.params.minSpeed +
          Math.random() * (this.params.maxSpeed - this.params.minSpeed);
      }
    }

    // Mark positions for update
    this.stars.geometry.attributes.position.needsUpdate = true;
  }

  /**
   * Clean up resources used by this background.
   */
  dispose(): void {
    if (this.stars) {
      this.stars.geometry.dispose();

      if (this.starMaterial) {
        this.starMaterial.dispose();
      }

      this.stars = null;
      this.starMaterial = null;
      this.starPositions = null;
      this.starSpeeds = null;
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
