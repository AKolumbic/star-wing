import * as THREE from "three";

/**
 * Scene class responsible for managing the 3D rendering environment.
 * Handles the starfield background, lighting, and all Three.js rendering functions.
 */
export class Scene {
  /** Three.js scene containing all 3D objects */
  private scene: THREE.Scene;

  /** Main camera for rendering the scene */
  private camera: THREE.PerspectiveCamera;

  /** WebGL renderer for drawing the scene */
  private renderer: THREE.WebGLRenderer;

  /** Current viewport width */
  private width: number;

  /** Current viewport height */
  private height: number;

  /** Star particles system */
  private stars: THREE.Points | null = null;

  /** Float32Array of star positions [x,y,z,x,y,z,...] */
  private starPositions: Float32Array | null = null;

  /** Individual speed of each star */
  private starSpeeds: Float32Array | null = null;

  /** Material for the starfield - cached for animation updates */
  private starMaterial: THREE.ShaderMaterial | null = null;

  /** Star count for performance tuning */
  private readonly STAR_COUNT = 1500;

  /** Maximum star field size */
  private readonly STAR_FIELD_SIZE = 2000;

  /**
   * Creates a new scene with a WebGL renderer.
   * @param canvas Optional canvas element to render on. If not provided, one will be created.
   */
  constructor(canvas?: HTMLCanvasElement) {
    // Store viewport dimensions
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Create scene with black background
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // Create perspective camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.width / this.height,
      0.1,
      this.STAR_FIELD_SIZE
    );
    this.camera.position.z = 100;

    // Create WebGL renderer with antialiasing
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: canvas || undefined,
      powerPreference: "high-performance", // Request high performance GPU
    });

    // Set up renderer
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance

    // Only append to body if no canvas was provided
    if (!canvas) {
      document.body.appendChild(this.renderer.domElement);
    }

    // Handle window resize
    window.addEventListener("resize", this.onWindowResize.bind(this));
  }

  /**
   * Initializes the scene asynchronously.
   * Sets up lights, environment, and starfield.
   * @returns Promise that resolves when initialization is complete
   */
  async init(): Promise<void> {
    // Set up scene components sequentially
    this.setupLights();
    this.setupEnvironment();
    this.setupStarfield();

    return Promise.resolve();
  }

  /**
   * Creates the starfield background with shader-based particles.
   * @private
   */
  private setupStarfield(): void {
    // Create buffer geometry for stars
    const starGeometry = new THREE.BufferGeometry();

    // Allocate arrays for positions and speeds
    this.starPositions = new Float32Array(this.STAR_COUNT * 3);
    this.starSpeeds = new Float32Array(this.STAR_COUNT);

    // Initialize random star positions and speeds
    for (let i = 0; i < this.STAR_COUNT; i++) {
      const idx = i * 3;
      const halfSize = this.STAR_FIELD_SIZE / 2;

      // Position (x,y,z) with negative Z (coming toward the camera)
      this.starPositions[idx] = (Math.random() - 0.5) * this.STAR_FIELD_SIZE; // x
      this.starPositions[idx + 1] =
        (Math.random() - 0.5) * this.STAR_FIELD_SIZE; // y
      this.starPositions[idx + 2] =
        -halfSize + Math.random() * this.STAR_FIELD_SIZE; // z

      // Random speed between 50 and 200 units per second
      this.starSpeeds[i] = 50 + Math.random() * 150;
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
        color: { value: new THREE.Color(0xffffff) },
      },
      vertexShader: `
        varying vec3 vPosition;
        void main() {
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          
          // Adjust star size based on Z position for depth effect
          float size = 3.0;
          // Stars closer to camera appear larger
          if (position.z > 0.0) {
            size = 3.0 + (2.0 * (position.z / 1000.0));
          }
          gl_PointSize = size;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float time;
        varying vec3 vPosition;
        void main() {
          // Create a circular point shape
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          if (dist > 0.5) discard; // Discard pixels outside circle
          
          // Fade based on depth (z position)
          float fadeIn = smoothstep(-1000.0, 0.0, vPosition.z);
          // Maintain a minimum opacity of 0.4 and fade up to 0.9
          float opacity = 0.4 + (0.5 * fadeIn);
          
          // Apply a subtle twinkle effect
          opacity *= 0.8 + 0.2 * sin(time * 0.01 + vPosition.x * 0.1 + vPosition.y * 0.1);
          
          gl_FragColor = vec4(color, opacity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false, // Improves rendering of transparent particles
    });

    // Create stars mesh and add to scene
    this.stars = new THREE.Points(starGeometry, this.starMaterial);
    this.scene.add(this.stars);
  }

  /**
   * Sets up scene lighting.
   * @private
   */
  private setupLights(): void {
    // Add ambient light for basic illumination
    const ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(ambientLight);

    // Add directional light for shadows and highlights
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);
  }

  /**
   * Sets up the 3D environment elements.
   * Currently just adds a grid helper for reference.
   * @private
   */
  private setupEnvironment(): void {
    // Add grid for reference (will be replaced with game environment)
    const gridHelper = new THREE.GridHelper(10, 10);
    this.scene.add(gridHelper);
  }

  /**
   * Handles window resize events to maintain correct aspect ratio.
   * Updates camera and renderer to match new window dimensions.
   * @private
   */
  private onWindowResize(): void {
    // Update dimensions
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Update camera aspect ratio
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    // Update renderer size
    this.renderer.setSize(this.width, this.height);
  }

  /**
   * Updates the scene for the current frame.
   * Animates star positions to create the flying through space effect.
   * @param deltaTime Time elapsed since the last frame in seconds
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

    // Update star positions with varying speeds
    for (let i = 0; i < positions.length; i += 3) {
      const starIndex = i / 3;

      // Move star forward (positive Z direction)
      positions[i + 2] += deltaTime * this.starSpeeds[starIndex];

      // Reset stars that have moved too far
      const halfSize = this.STAR_FIELD_SIZE / 2;
      if (positions[i + 2] > halfSize) {
        // Move star back to the far plane with new X and Y coordinates
        positions[i + 2] -= this.STAR_FIELD_SIZE;
        positions[i] = (Math.random() - 0.5) * this.STAR_FIELD_SIZE;
        positions[i + 1] = (Math.random() - 0.5) * this.STAR_FIELD_SIZE;

        // Assign new random speed
        this.starSpeeds[starIndex] = 50 + Math.random() * 150;
      }
    }

    // Mark positions for update
    this.stars.geometry.attributes.position.needsUpdate = true;
  }

  /**
   * Renders the current frame.
   * Invokes the WebGL renderer to draw the current scene state.
   */
  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Cleans up resources used by the scene.
   * Removes event listeners and disposes of Three.js objects.
   */
  dispose(): void {
    // Remove event listeners
    window.removeEventListener("resize", this.onWindowResize);

    // Dispose of Three.js objects to prevent memory leaks
    if (this.stars) {
      this.scene.remove(this.stars);
      this.stars.geometry.dispose();
      if (this.stars.material instanceof THREE.Material) {
        this.stars.material.dispose();
      } else if (Array.isArray(this.stars.material)) {
        this.stars.material.forEach((material) => material.dispose());
      }
      this.stars = null;
    }

    this.starPositions = null;
    this.starSpeeds = null;
    this.starMaterial = null;

    // Dispose of renderer
    this.renderer.dispose();

    // Remove renderer from DOM if we added it
    const rendererElement = this.renderer.domElement;
    if (rendererElement.parentElement) {
      rendererElement.parentElement.removeChild(rendererElement);
    }
  }

  /**
   * Gets the Three.js scene object.
   * @returns The current Three.js scene
   */
  getScene(): THREE.Scene {
    return this.scene;
  }

  /**
   * Gets the Three.js camera object.
   * @returns The current Three.js camera
   */
  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }
}
