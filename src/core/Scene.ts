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

  /** Flag to track first render for logging */
  private hasLoggedFirstRender: boolean = false;

  /** Flag for debug mode */
  private isDebugMode: boolean = false;

  /** Current debug configuration */
  private debugConfig: number = 0;

  /**
   * Creates a new scene with a WebGL renderer.
   * @param canvas Optional canvas element to render on. If not provided, one will be created.
   */
  constructor(canvas?: HTMLCanvasElement) {
    console.log("Scene constructor started");

    // Store viewport dimensions
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    console.log(`Viewport dimensions: ${this.width}x${this.height}`);

    // Create scene with black background
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    console.log("Scene created with black background");

    // Create perspective camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.width / this.height,
      0.1,
      this.STAR_FIELD_SIZE
    );

    // IMPORTANT: Avoid exact integer positioning which can cause pixel alignment issues
    this.camera.position.z = 100.1; // Add a small offset to avoid exact integer

    console.log(
      `Camera created with aspect ratio: ${this.width / this.height}`
    );
    console.log(
      `Camera position set to: x=${this.camera.position.x}, y=${this.camera.position.y}, z=${this.camera.position.z}`
    );

    // Create WebGL renderer with antialiasing
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: canvas || undefined,
      powerPreference: "high-performance", // Request high performance GPU
      // Try different alpha settings to see if it affects the white line
      alpha: false,
      precision: "highp", // Use high precision rendering
      logarithmicDepthBuffer: true, // This can help with precision issues
      stencil: false, // Disable stencil buffer if not needed
      premultipliedAlpha: false, // This can affect how transparency is rendered
    });
    console.log("WebGL renderer created");

    // Force clean rendering settings to fix horizontal line issue
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.autoClear = true;

    // Fix for sub-pixel rendering/alignment issues
    if (this.width % 2 !== 0 || this.height % 2 !== 0) {
      console.log("Adjusting renderer size to ensure even pixel dimensions");
      // Ensure even pixel dimensions (prevents half-pixel issues)
      this.width = Math.floor(this.width);
      this.height = Math.floor(this.height);
      // Make dimensions even
      this.width = this.width + (this.width % 2);
      this.height = this.height + (this.height % 2);
    }

    // Set up renderer with precise dimensions
    this.renderer.setSize(this.width, this.height, false); // false = no CSS sizing
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
    console.log(
      `Renderer size set to ${this.width}x${
        this.height
      }, pixel ratio: ${Math.min(window.devicePixelRatio, 2)}`
    );

    // Only append to body if no canvas was provided
    if (!canvas) {
      document.body.appendChild(this.renderer.domElement);
      console.log("Renderer canvas appended to document body");
    } else {
      console.log("Using existing canvas for renderer");
      // Log canvas computed styles to check for any unexpected properties
      const computedStyle = window.getComputedStyle(canvas);
      console.log("Canvas computed style:", {
        width: computedStyle.width,
        height: computedStyle.height,
        position: computedStyle.position,
        margin: computedStyle.margin,
        padding: computedStyle.padding,
        border: computedStyle.border,
        backgroundColor: computedStyle.backgroundColor,
      });
    }

    // Handle window resize
    window.addEventListener("resize", this.onWindowResize.bind(this));
    console.log("Window resize handler added");

    // Enable debug mode if URL has debug=true
    const urlParams = new URLSearchParams(window.location.search);
    this.isDebugMode = urlParams.get("debug") === "true";
    if (this.isDebugMode) {
      console.log("DEBUG MODE ENABLED: Testing starfield configurations");
      this.debugConfig = parseInt(urlParams.get("config") || "0", 10);
      console.log(`Using debug configuration #${this.debugConfig}`);
    }

    console.log("Scene constructor completed");
  }

  /**
   * Initializes the scene asynchronously.
   * Sets up lights, environment, and starfield.
   * @returns Promise that resolves when initialization is complete
   */
  async init(): Promise<void> {
    console.log("Scene initialization started");

    // Set up scene components sequentially
    this.setupLights();
    this.setupEnvironment();

    if (this.isDebugMode) {
      // In debug mode, use specific starfield configurations
      this.setupDebugStarfield(this.debugConfig);
    } else {
      // Normal starfield setup
      this.setupStarfield();
    }

    console.log("Scene initialization completed");
    return Promise.resolve();
  }

  /**
   * Creates the starfield background with shader-based particles.
   * @private
   */
  private setupStarfield(): void {
    console.log("Setting up starfield with", this.STAR_COUNT, "stars");

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

    // Get bounds of star positions to check for potential rendering issues
    let minX = Infinity,
      maxX = -Infinity;
    let minY = Infinity,
      maxY = -Infinity;
    for (let i = 0; i < this.starPositions.length; i += 3) {
      minX = Math.min(minX, this.starPositions[i]);
      maxX = Math.max(maxX, this.starPositions[i]);
      minY = Math.min(minY, this.starPositions[i + 1]);
      maxY = Math.max(maxY, this.starPositions[i + 1]);
    }
    console.log("Star position bounds:", { minX, maxX, minY, maxY });

    // Add position attribute to geometry
    starGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(this.starPositions, 3)
    );

    console.log("Star geometry created and positions set");

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

    console.log("Star material created with custom shaders");

    // Create stars mesh and add to scene
    this.stars = new THREE.Points(starGeometry, this.starMaterial);
    this.scene.add(this.stars);
    console.log("Stars added to scene");
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
    // Set background color
    this.scene.background = new THREE.Color(0x000000);
  }

  /**
   * Handles window resize events.
   * Updates camera and renderer dimensions to match new window size.
   * @private
   */
  private onWindowResize(): void {
    // Get new window dimensions
    let newWidth = window.innerWidth;
    let newHeight = window.innerHeight;

    // Fix for sub-pixel rendering/alignment issues
    if (newWidth % 2 !== 0 || newHeight % 2 !== 0) {
      // Ensure even pixel dimensions (prevents half-pixel issues)
      newWidth = Math.floor(newWidth);
      newHeight = Math.floor(newHeight);
      // Make dimensions even
      newWidth = newWidth + (newWidth % 2);
      newHeight = newHeight + (newHeight % 2);
    }

    // Update internal dimensions
    this.width = newWidth;
    this.height = newHeight;

    // Update camera aspect ratio
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    // Update renderer size with pixel-perfect settings
    this.renderer.setSize(this.width, this.height, false); // false = no CSS sizing

    // Force a render to update the view immediately
    this.render();

    console.log(`Window resized to ${this.width}x${this.height}`);
  }

  /**
   * Sets up different starfield configurations for debugging white line issue
   * @param config Configuration number to test
   */
  private setupDebugStarfield(config: number): void {
    console.log(`Setting up debug starfield configuration #${config}`);

    switch (config) {
      case 0:
        // No starfield - just black background
        console.log("DEBUG: Using empty scene (black background only)");
        break;

      case 1:
        // Simplified starfield with fixed stars (no shader)
        this.setupSimpleStarfield();
        break;

      case 2:
        // Regular starfield but with different blending mode
        this.setupStarfieldWithBlending(THREE.NormalBlending);
        break;

      case 3:
        // Regular starfield but with no transparency
        this.setupStarfieldNoTransparency();
        break;

      case 4:
        // Regular starfield but with limited positions
        this.setupStarfieldLimitedBounds();
        break;

      case 5:
        // Default starfield but with manual clear
        this.setupStarfield();
        this.renderer.autoClear = false;
        console.log("DEBUG: Using manual clearing mode");
        break;

      case 6:
        // Test for center line issue - draw a test pattern at the center
        this.setupCenterTestPattern();
        break;

      default:
        // Just use the normal starfield
        this.setupStarfield();
        break;
    }
  }

  /**
   * Creates a simplified starfield with basic material (no shaders)
   */
  private setupSimpleStarfield(): void {
    console.log("DEBUG: Setting up simplified starfield");

    // Create simple geometry
    const starGeometry = new THREE.BufferGeometry();
    const vertices = [];

    // Create fewer stars with fixed positions away from edges
    const count = 200;
    const edgeBuffer = 0.1; // Keep stars away from the edges
    const range = 1.0 - edgeBuffer * 2;

    for (let i = 0; i < count; i++) {
      // Create points that stay away from the edges of the viewport
      const x = (Math.random() * range - range / 2) * 100;
      const y = (Math.random() * range - range / 2) * 100;
      const z = Math.random() * -500;

      vertices.push(x, y, z);
    }

    starGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3)
    );

    // Use simple material instead of shader
    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 3,
      sizeAttenuation: true,
    });

    // Create and add to scene
    this.stars = new THREE.Points(starGeometry, material);
    this.scene.add(this.stars);

    console.log("DEBUG: Simple starfield created");
  }

  /**
   * Creates starfield with different blending mode
   */
  private setupStarfieldWithBlending(blendingMode: THREE.Blending): void {
    console.log(
      `DEBUG: Setting up starfield with blending mode ${blendingMode}`
    );

    // Create buffer geometry for stars
    const starGeometry = new THREE.BufferGeometry();

    // Allocate arrays for positions and speeds
    this.starPositions = new Float32Array(this.STAR_COUNT * 3);
    this.starSpeeds = new Float32Array(this.STAR_COUNT);

    // Initialize random star positions and speeds
    for (let i = 0; i < this.STAR_COUNT; i++) {
      const idx = i * 3;
      const halfSize = this.STAR_FIELD_SIZE / 2;

      this.starPositions[idx] = (Math.random() - 0.5) * this.STAR_FIELD_SIZE; // x
      this.starPositions[idx + 1] =
        (Math.random() - 0.5) * this.STAR_FIELD_SIZE; // y
      this.starPositions[idx + 2] =
        -halfSize + Math.random() * this.STAR_FIELD_SIZE; // z

      this.starSpeeds[i] = 50 + Math.random() * 150;
    }

    // Add position attribute to geometry
    starGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(this.starPositions, 3)
    );

    // Create star material with custom shader but different blending
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
      blending: blendingMode, // Use the provided blending mode
      depthWrite: false,
    });

    // Create stars mesh and add to scene
    this.stars = new THREE.Points(starGeometry, this.starMaterial);
    this.scene.add(this.stars);

    console.log("DEBUG: Starfield with custom blending created");
  }

  /**
   * Creates starfield with no transparency
   */
  private setupStarfieldNoTransparency(): void {
    console.log("DEBUG: Setting up starfield with no transparency");

    // Create buffer geometry for stars
    const starGeometry = new THREE.BufferGeometry();

    // Allocate arrays for positions and speeds
    this.starPositions = new Float32Array(this.STAR_COUNT * 3);
    this.starSpeeds = new Float32Array(this.STAR_COUNT);

    // Initialize random star positions and speeds
    for (let i = 0; i < this.STAR_COUNT; i++) {
      const idx = i * 3;
      const halfSize = this.STAR_FIELD_SIZE / 2;

      this.starPositions[idx] = (Math.random() - 0.5) * this.STAR_FIELD_SIZE; // x
      this.starPositions[idx + 1] =
        (Math.random() - 0.5) * this.STAR_FIELD_SIZE; // y
      this.starPositions[idx + 2] =
        -halfSize + Math.random() * this.STAR_FIELD_SIZE; // z

      this.starSpeeds[i] = 50 + Math.random() * 150;
    }

    // Add position attribute to geometry
    starGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(this.starPositions, 3)
    );

    // Non-transparent material
    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 3,
      sizeAttenuation: true,
      transparent: false,
      depthWrite: true,
    });

    // Create stars mesh and add to scene
    this.stars = new THREE.Points(starGeometry, material);
    this.scene.add(this.stars);

    console.log("DEBUG: Non-transparent starfield created");
  }

  /**
   * Creates starfield with positions limited away from view edges
   */
  private setupStarfieldLimitedBounds(): void {
    console.log("DEBUG: Setting up starfield with limited bounds");

    // Create buffer geometry for stars
    const starGeometry = new THREE.BufferGeometry();

    // Allocate arrays for positions and speeds
    this.starPositions = new Float32Array(this.STAR_COUNT * 3);
    this.starSpeeds = new Float32Array(this.STAR_COUNT);

    // Create a buffer zone at the edges of the view
    const edgeBuffer = 0.1; // 10% buffer from edges
    const limitedRange = 1.0 - edgeBuffer * 2;

    // Initialize random star positions and speeds
    for (let i = 0; i < this.STAR_COUNT; i++) {
      const idx = i * 3;
      const halfSize = this.STAR_FIELD_SIZE / 2;

      // Limit stars to stay away from the edges
      this.starPositions[idx] =
        (Math.random() * limitedRange - limitedRange / 2) *
        this.STAR_FIELD_SIZE;
      this.starPositions[idx + 1] =
        (Math.random() * limitedRange - limitedRange / 2) *
        this.STAR_FIELD_SIZE;
      this.starPositions[idx + 2] =
        -halfSize + Math.random() * this.STAR_FIELD_SIZE;

      this.starSpeeds[i] = 50 + Math.random() * 150;
    }

    // Add position attribute to geometry
    starGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(this.starPositions, 3)
    );

    // Regular star material
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
      depthWrite: false,
    });

    // Create stars mesh and add to scene
    this.stars = new THREE.Points(starGeometry, this.starMaterial);
    this.scene.add(this.stars);

    console.log("DEBUG: Limited bounds starfield created");
  }

  /**
   * Creates a test pattern specifically to debug the center line issue
   */
  private setupCenterTestPattern(): void {
    console.log("DEBUG: Setting up center test pattern");

    // Create a line exactly at the center to test alignment
    const material = new THREE.LineBasicMaterial({
      color: 0x00ff00, // Bright green for visibility
      linewidth: 1,
    });

    // Create a grid of lines around the center
    const gridSize = 20; // 20x20 grid
    const stepSize = 1; // 1 unit spacing

    // Create vertical lines
    for (let x = -gridSize / 2; x <= gridSize / 2; x += stepSize) {
      const geometry = new THREE.BufferGeometry();
      const points = [
        new THREE.Vector3(x, -gridSize / 2, 0),
        new THREE.Vector3(x, gridSize / 2, 0),
      ];
      geometry.setFromPoints(points);

      const line = new THREE.Line(geometry, material);
      this.scene.add(line);
    }

    // Create horizontal lines
    for (let y = -gridSize / 2; y <= gridSize / 2; y += stepSize) {
      const geometry = new THREE.BufferGeometry();
      const points = [
        new THREE.Vector3(-gridSize / 2, y, 0),
        new THREE.Vector3(gridSize / 2, y, 0),
      ];
      geometry.setFromPoints(points);

      // Use a different color for the exact center line
      const lineMaterial =
        y === 0
          ? new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 })
          : material;

      const line = new THREE.Line(geometry, lineMaterial);
      this.scene.add(line);
    }

    // Add a small sphere at the exact center point
    const sphereGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const centerSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    centerSphere.position.set(0, 0, 0);
    this.scene.add(centerSphere);

    // Position camera to look at the grid
    this.camera.position.z = 30;
    this.camera.lookAt(0, 0, 0);

    console.log("DEBUG: Center test pattern created");
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
    // First render - log renderer state
    if (!this.hasLoggedFirstRender) {
      console.log("First render call");
      console.log("Renderer state:", {
        autoClear: this.renderer.autoClear,
        clearColor: this.renderer.getClearColor(new THREE.Color()),
        clearAlpha: this.renderer.getClearAlpha(),
        renderSize: this.renderer.getSize(new THREE.Vector2()),
      });

      // Check if canvas matches the expected size
      const rendererCanvas = this.renderer.domElement;
      console.log("Renderer canvas size:", {
        clientWidth: rendererCanvas.clientWidth,
        clientHeight: rendererCanvas.clientHeight,
        width: rendererCanvas.width,
        height: rendererCanvas.height,
        style: rendererCanvas.style.cssText,
      });

      // Fix for potential pixel ratio issues
      this.width = Math.floor(rendererCanvas.clientWidth);
      this.height = Math.floor(rendererCanvas.clientHeight);

      // Ensure even dimensions
      this.width = this.width + (this.width % 2);
      this.height = this.height + (this.height % 2);

      console.log(
        `Adjusting renderer to exact dimensions: ${this.width}x${this.height}`
      );

      // Update renderer with precise dimensions
      this.renderer.setSize(this.width, this.height, false);

      this.hasLoggedFirstRender = true;
    }

    if (this.isDebugMode && this.debugConfig === 5) {
      // Manual clearing mode - explicitly clear before rendering
      this.renderer.clear();
    }

    // Ensure camera aspect ratio is correct
    if (this.camera.aspect !== this.width / this.height) {
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
    }

    // FIX FOR WHITE LINE: Viewport offset to avoid the center line issue
    // Adjust viewport to offset by 1 pixel, hiding the problematic center line
    const origViewport = this.renderer.getViewport(new THREE.Vector4());
    this.renderer.setViewport(0, 1, this.width, this.height - 1);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setViewport(origViewport); // Restore original viewport
  }

  /**
   * Disposes of scene resources to prevent memory leaks.
   * Call this when the scene is no longer needed.
   */
  dispose(): void {
    console.log("Disposing scene resources");

    // Dispose of star materials
    if (this.starMaterial) {
      console.log("Disposing star material");
      this.starMaterial.dispose();
    }

    // Clear all objects from the scene
    console.log("Clearing scene objects");
    while (this.scene.children.length > 0) {
      const object = this.scene.children[0];
      this.scene.remove(object);
    }

    // Dispose of the renderer
    if (this.renderer) {
      console.log("Disposing WebGL renderer");
      this.renderer.dispose();

      // Also dispose of renderer properties
      const gl = this.renderer.getContext();

      // Get all WebGL extensions and lose context to free GPU resources
      const extension = gl.getExtension("WEBGL_lose_context");
      if (extension) {
        console.log("Calling loseContext on WebGL context");
        extension.loseContext();
      }
    }

    // Remove resize handler
    window.removeEventListener("resize", this.onWindowResize.bind(this));

    console.log("Scene resources disposed");
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
