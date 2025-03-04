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
  /** Hyperspace mode speed multiplier */
  hyperspaceSpeedMultiplier?: number;
  /** Hyperspace streak length multiplier */
  hyperspaceStreakMultiplier?: number;
  /** Hyperspace core color */
  hyperspaceColor?: number;
  /** Hyperspace edge/trail color */
  hyperspaceTrailColor?: number;
  /** Transition time to/from hyperspace in seconds */
  hyperspaceTransitionTime?: number;
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
  hyperspaceSpeedMultiplier: 5.0, // How much faster stars move in hyperspace
  hyperspaceStreakMultiplier: 8.0, // How much longer the streaks appear in hyperspace
  hyperspaceColor: 0x00ffff, // Cyan core color for hyperspace
  hyperspaceTrailColor: 0x0033aa, // Blue trail for hyperspace
  hyperspaceTransitionTime: 1.0, // Time in seconds to transition to/from hyperspace
};

/**
 * Starfield background implementation.
 * Creates a field of stars with depth-based rendering and movement.
 * Can transition into "hyperspace mode" with streaking star effects.
 */
export class StarfieldBackground implements Background {
  /** Star particles system */
  private stars: THREE.Points | null = null;

  /** Float32Array of star positions [x,y,z,x,y,z,...] */
  private starPositions: Float32Array | null = null;

  /** Individual speed of each star */
  private starSpeeds: Float32Array | null = null;

  /** Individual streak lengths for hyperspace mode */
  private streakLengths: Float32Array | null = null;

  /** Material for the starfield - cached for animation updates */
  private starMaterial: THREE.ShaderMaterial | null = null;

  /** Current configuration parameters */
  private params: Required<StarfieldParams>;

  /** Flag indicating if the starfield has been initialized */
  private initialized: boolean = false;

  /** Hyperspace mode status */
  private hyperspaceMode: boolean = false;

  /** Hyperspace transition progress (0.0 to 1.0) */
  private hyperspaceTransition: number = 0.0;

  /** Direction of transition (1 = entering hyperspace, -1 = exiting) */
  private transitionDirection: number = 0;

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

    // Allocate arrays for positions, speeds, and streak lengths
    this.starPositions = new Float32Array(this.params.starCount * 3);
    this.starSpeeds = new Float32Array(this.params.starCount);
    this.streakLengths = new Float32Array(this.params.starCount);

    // Initialize random star positions, speeds, and streak lengths
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

      // Random streak length for hyperspace mode
      this.streakLengths[i] = 0.5 + Math.random() * 0.5; // Normalized value 0.5-1.0
    }

    // Add position attribute to geometry
    starGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(this.starPositions, 3)
    );

    // Create star material with custom shader for depth-based opacity and streaking
    this.starMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(this.params.starColor) },
        baseSize: { value: this.params.baseStarSize },
        hyperspaceMode: { value: 0.0 }, // 0.0 = normal, 1.0 = hyperspace
        hyperspaceColor: {
          value: new THREE.Color(this.params.hyperspaceColor),
        },
        hyperspaceTrailColor: {
          value: new THREE.Color(this.params.hyperspaceTrailColor),
        },
      },
      vertexShader: `
        uniform float baseSize;
        uniform float hyperspaceMode;
        
        attribute float streakFactor;
        
        varying vec3 vPosition;
        varying float vHyperspaceEffect;
        
        void main() {
          vPosition = position;
          vHyperspaceEffect = hyperspaceMode;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          
          // Adjust star size based on Z position for depth effect
          float size = baseSize;
          
          // Stars closer to camera appear larger
          float sizeFactor = 1.0 + abs(position.z / 1000.0);
          
          // In hyperspace mode, make stars slightly larger for streaking effect
          size *= 1.0 + hyperspaceMode * 0.5;
          
          gl_PointSize = size * sizeFactor;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform vec3 hyperspaceColor;
        uniform vec3 hyperspaceTrailColor;
        uniform float time;
        uniform float hyperspaceMode;
        
        varying vec3 vPosition;
        varying float vHyperspaceEffect;
        
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
          
          // Apply a subtle twinkle effect in normal mode
          float twinkle = 0.8 + 0.2 * sin(time * 0.01 + vPosition.x * 0.1 + vPosition.y * 0.1);
          
          // In hyperspace mode, create a streaking effect by making points oval
          // and varying color based on horizontal position
          vec3 finalColor = color;
          
          if (hyperspaceMode > 0.0) {
            // Elongate points in the direction of travel (Z-axis)
            // This creates the streaking effect by modifying the shape based on x position
            float streakDistortion = gl_PointCoord.y - 0.5;
            
            // Mix between regular color and hyperspace colors based on transition
            finalColor = mix(color, hyperspaceColor, hyperspaceMode);
            
            // Create trail effect by using a gradient of colors
            if (gl_PointCoord.y > 0.5) {
              finalColor = mix(hyperspaceColor, hyperspaceTrailColor, (gl_PointCoord.y - 0.5) * 2.0);
            }
            
            // Make stars brighter in hyperspace
            opacity *= 1.0 + hyperspaceMode * 0.5;
          } else {
            // In normal mode, use the twinkle effect
            opacity *= twinkle;
          }
          
          gl_FragColor = vec4(finalColor, opacity);
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
   * Set hyperspace mode on or off.
   * @param enabled Whether hyperspace mode should be enabled
   */
  setHyperspaceMode(enabled: boolean): void {
    if (this.hyperspaceMode === enabled) return;

    // Set transition direction: 1 = entering hyperspace, -1 = exiting
    this.transitionDirection = enabled ? 1 : -1;

    // If we're instantly switching (no transition), set the value directly
    if (this.params.hyperspaceTransitionTime <= 0) {
      this.hyperspaceMode = enabled;
      this.hyperspaceTransition = enabled ? 1.0 : 0.0;

      // Update the shader uniform
      if (this.starMaterial) {
        this.starMaterial.uniforms.hyperspaceMode.value =
          this.hyperspaceTransition;
      }
    }
  }

  /**
   * Get the current hyperspace mode status.
   * @returns True if in hyperspace mode, false otherwise
   */
  getHyperspaceMode(): boolean {
    return this.hyperspaceMode;
  }

  /**
   * Get the current hyperspace transition progress.
   * @returns Value between 0 (normal) and 1 (hyperspace)
   */
  getHyperspaceTransition(): number {
    return this.hyperspaceTransition;
  }

  /**
   * Update the starfield for animation.
   * @param deltaTime Time in seconds since the last update
   */
  update(deltaTime: number): void {
    if (!this.stars || !this.starPositions || !this.starSpeeds) {
      return;
    }

    // Handle hyperspace mode transition if in progress
    if (this.transitionDirection !== 0) {
      // Calculate how much to change the transition value
      const transitionStep = deltaTime / this.params.hyperspaceTransitionTime;

      // Update transition value
      this.hyperspaceTransition += transitionStep * this.transitionDirection;

      // Clamp between 0 and 1
      this.hyperspaceTransition = Math.max(
        0,
        Math.min(1, this.hyperspaceTransition)
      );

      // Update shader uniform
      if (this.starMaterial) {
        this.starMaterial.uniforms.hyperspaceMode.value =
          this.hyperspaceTransition;
      }

      // Check if transition is complete
      if (this.hyperspaceTransition <= 0 || this.hyperspaceTransition >= 1) {
        this.hyperspaceMode = this.hyperspaceTransition >= 1;
        this.transitionDirection = 0; // Stop transition
      }
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

    // Calculate effective speed based on hyperspace transition
    const speedMultiplier =
      1.0 +
      (this.params.hyperspaceSpeedMultiplier - 1.0) * this.hyperspaceTransition;

    // Update star positions with varying speeds
    for (let i = 0; i < this.params.starCount; i++) {
      const idx = i * 3;

      // Calculate effective speed for this star with hyperspace adjustment
      const effectiveSpeed = this.starSpeeds[i] * speedMultiplier;

      // Move star in the specified direction
      positions[idx] += direction.x * deltaTime * effectiveSpeed;
      positions[idx + 1] += direction.y * deltaTime * effectiveSpeed;
      positions[idx + 2] += direction.z * deltaTime * effectiveSpeed;

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

        // Assign a new random speed
        this.starSpeeds[i] =
          this.params.minSpeed +
          Math.random() * (this.params.maxSpeed - this.params.minSpeed);

        // Assign a new random streak length
        if (this.streakLengths) {
          this.streakLengths[i] = 0.5 + Math.random() * 0.5;
        }
      }
    }

    // Flag attributes as needing an update
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
    }

    this.starPositions = null;
    this.starSpeeds = null;
    this.streakLengths = null;
    this.initialized = false;
  }

  /**
   * Set a parameter for this background.
   * @param key The parameter name
   * @param value The parameter value
   */
  setParameter(key: string, value: any): void {
    if (key in this.params) {
      (this.params as any)[key] = value;
    }
  }

  /**
   * Get a parameter value.
   * @param key The parameter name
   * @returns The parameter value or undefined if not found
   */
  getParameter(key: string): any {
    return (this.params as any)[key];
  }
}
