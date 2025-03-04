import * as THREE from "three";
import {
  BackgroundManager,
  BackgroundType,
} from "./backgrounds/BackgroundManager";
import { StarfieldBackground } from "./backgrounds/StarfieldBackground";
import { Ship } from "../entities/Ship";
import { Input } from "./Input";
import { Logger } from "../utils/Logger";
import { UIUtils } from "../utils/UIUtils";

/**
 * Scene class responsible for managing the 3D rendering environment.
 * Completely rebuilt with minimal implementation to eliminate rendering artifacts.
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

  /** Background manager for handling different background modes */
  private backgroundManager: BackgroundManager;

  /** Current animation frame request ID */
  private animationFrameId: number | null = null;

  /** Game canvas element */
  private canvas: HTMLCanvasElement;

  /** Last timestamp for animation frame */
  private lastTime: number = 0;

  /** Camera default position */
  private readonly CAMERA_DEFAULT_POSITION = new THREE.Vector3(0, 50, 600);
  /** Camera default target position */
  private readonly CAMERA_DEFAULT_TARGET = new THREE.Vector3(0, 0, -300);

  /** Player's ship */
  private playerShip: Ship | null = null;

  /** Input system reference */
  private input: Input | null = null;

  /** Whether the game is currently active/playable */
  private gameActive: boolean = false;

  /** Current player score */
  private score: number = 0;

  /** Current zone (level) */
  private currentZone: number = 1;

  /** Current wave within the zone */
  private currentWave: number = 1;

  /** Total waves in the current zone */
  private totalWaves: number = 8;

  /** Logger instance */
  private logger = Logger.getInstance();

  /** Debug controls container */
  private debugControlsContainer: HTMLElement | null = null;

  /** Whether dev mode is enabled */
  private devMode: boolean = false;

  /**
   * Creates a new scene with a WebGL renderer.
   * @param canvas Optional canvas element to render on. If not provided, one will be created.
   * @param devMode Whether to enable dev mode
   */
  constructor(canvas?: HTMLCanvasElement, devMode: boolean = false) {
    // Store viewport dimensions
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Create a new scene with solid black background
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // Create a better perspective camera with wider field of view
    this.camera = new THREE.PerspectiveCamera(
      85, // Field of view (increased for more dramatic perspective)
      this.width / this.height, // Aspect ratio
      0.1, // Near plane
      10000 // Far plane
    );

    // Position camera at an angle to better show the ship's details
    this.camera.position.copy(this.CAMERA_DEFAULT_POSITION);
    this.camera.lookAt(this.CAMERA_DEFAULT_TARGET);

    // Create WebGL renderer with careful attention to settings
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas || undefined,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
      precision: "highp",
      preserveDrawingBuffer: false,
      premultipliedAlpha: true,
      logarithmicDepthBuffer: false,
    });

    // Initialize canvas property
    this.canvas = canvas || this.renderer.domElement;

    // Set pixel ratio explicitly to 1 to avoid high-DPI rendering issues
    this.renderer.setPixelRatio(1);

    // Set size exactly matching viewport dimensions
    this.renderer.setSize(this.width, this.height, true);

    // Ensure we're not generating artifacts with scissor or viewport settings
    this.renderer.setScissorTest(false);
    this.renderer.setViewport(0, 0, this.width, this.height);

    // Clear any previous settings to be safe
    this.renderer.autoClear = true;
    this.renderer.setClearColor(0x000000, 1);

    // Only append to body if no canvas was provided
    if (!canvas && document.body) {
      document.body.appendChild(this.renderer.domElement);
    }

    // Create the background manager
    this.backgroundManager = new BackgroundManager(this.scene);

    // Handle window resize
    window.addEventListener("resize", this.onWindowResize.bind(this));

    // Store dev mode flag
    this.devMode = devMode;

    this.setupBasicLighting();
    this.setupBackgrounds();
  }

  /**
   * Initializes the scene asynchronously.
   * Sets up lighting and registers background types.
   * @returns Promise that resolves when initialization is complete
   */
  async init(): Promise<void> {
    this.logger.info("Scene: Initializing");

    // Setup backgrounds
    this.setupBackgrounds();

    // Setup basic lighting
    this.setupBasicLighting();

    // Set the default background (starfield)
    try {
      this.logger.info("Scene: Setting initial starfield background");
      await this.backgroundManager.setBackground(BackgroundType.STARFIELD);
      this.logger.info("Scene: Starfield background initialized successfully");
    } catch (error) {
      this.logger.error("Scene: Error setting starfield background", error);
    }

    // Rest of initialization
    this.setupEventListeners();

    this.logger.info("Scene initialized successfully");

    return Promise.resolve();
  }

  /**
   * Sets up the background manager and registers available backgrounds.
   * @private
   */
  private setupBackgrounds(): void {
    this.logger.info("Scene: Setting up background manager");

    // Create the starfield background with improved parameters
    const starfieldBackground = new StarfieldBackground({
      starCount: 1500, // Default star count (1500)
      fieldSize: 3000, // Slightly larger field size for more depth
      starColor: 0xffffff, // Default star color
      baseStarSize: 2.5, // Default star size
      minSpeed: 50, // Default minimum speed
      maxSpeed: 200, // Default maximum speed
      hyperspaceSpeedMultiplier: 8.0, // More dramatic hyperspace effect
      hyperspaceStreakMultiplier: 8.0, // Default streaks in hyperspace
      hyperspaceColor: 0x00ffff, // Default cyan core for hyperspace
      hyperspaceTrailColor: 0x0033aa, // Default blue trails for hyperspace
      hyperspaceTransitionTime: 0.8, // Slightly faster transition to hyperspace
    });

    // Register the starfield background
    this.backgroundManager.registerBackground(
      BackgroundType.STARFIELD,
      starfieldBackground
    );

    this.logger.info("Scene: Background manager setup complete");
  }

  /**
   * Sets up enhanced scene lighting for better ship model rendering.
   * @private
   */
  private setupBasicLighting(): void {
    // Add better ambient light for base illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);

    // Main directional light from the front-top
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
    mainLight.position.set(0, 200, 400).normalize();
    this.scene.add(mainLight);

    // Blue rim light from below to highlight ship details
    const rimLight = new THREE.DirectionalLight(0x0088ff, 0.7);
    rimLight.position.set(0, -100, 50).normalize();
    this.scene.add(rimLight);

    // Subtle red fill light from the left side
    const fillLight = new THREE.DirectionalLight(0xff3333, 0.3);
    fillLight.position.set(-200, 50, 100).normalize();
    this.scene.add(fillLight);

    // Optional: Add a point light to simulate engine glow
    const engineGlow = new THREE.PointLight(0x00ffff, 0.8, 500);
    engineGlow.position.set(0, 0, -350);
    this.scene.add(engineGlow);
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
    this.renderer.setSize(this.width, this.height, true);
    this.renderer.setViewport(0, 0, this.width, this.height);
  }

  /**
   * Updates the scene for the current frame.
   * @param deltaTime Time elapsed since the last frame in seconds
   */
  update(deltaTime: number): void {
    // Handle game updates when active
    if (this.gameActive && this.playerShip) {
      // Update the player ship with delta time
      this.playerShip.update(deltaTime);

      // Update the score based on time (1 point per second)
      if (Math.random() < 0.05) {
        // Approximately once every ~20 frames
        this.logger.debug(
          `Game active, ship at position: ${this.playerShip
            .getPosition()
            .x.toFixed(2)}, ${this.playerShip
            .getPosition()
            .y.toFixed(2)}, ${this.playerShip.getPosition().z.toFixed(2)}`
        );
      }
    } else if (this.gameActive && !this.playerShip) {
      this.logger.warn("Scene: No player ship found in update");
    }

    // Update background
    this.backgroundManager.update(deltaTime);
  }

  /**
   * Renders the current frame.
   * Carefully clears the scene before rendering to avoid artifacts.
   */
  render(): void {
    // Force clear the entire buffer before rendering
    this.renderer.clear(true, true, true);
    // Render the scene normally
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Cleans up resources used by the scene.
   * Removes event listeners and disposes of Three.js objects.
   */
  dispose(): void {
    // Remove event listeners
    window.removeEventListener("resize", this.onWindowResize.bind(this));

    // Clean up the background manager
    this.backgroundManager.dispose();

    // Clean up the player ship
    if (this.playerShip) {
      this.playerShip.dispose();
      this.playerShip = null;
    }

    // Clear all objects from scene
    while (this.scene.children.length > 0) {
      const object = this.scene.children[0];
      this.scene.remove(object);

      // Dispose of geometries and materials
      if (object instanceof THREE.Mesh) {
        if (object.geometry) object.geometry.dispose();

        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      }
    }

    // Dispose of renderer
    this.renderer.dispose();

    // Remove renderer from DOM if we added it
    const rendererElement = this.renderer.domElement;
    if (rendererElement && rendererElement.parentElement) {
      rendererElement.parentElement.removeChild(rendererElement);
    }

    // Remove debug controls if they exist
    this.removeDebugControls();
  }

  /**
   * Sets the current background type.
   * @param type The background type to set
   * @param params Optional parameters for the background
   */
  async setBackground(
    type: BackgroundType,
    params?: Record<string, any>
  ): Promise<void> {
    return this.backgroundManager.setBackground(type, params);
  }

  /**
   * Transitions to a new background type with an animation.
   * @param type The background type to transition to
   * @param duration Duration of the transition in seconds
   * @param params Optional parameters for the new background
   */
  async transitionToBackground(
    type: BackgroundType,
    duration: number = 1.0,
    params?: Record<string, any>
  ): Promise<void> {
    return this.backgroundManager.transitionTo(type, duration, params);
  }

  /**
   * Transitions to or from hyperspace mode.
   * @param enable Whether to enable hyperspace mode
   * @param duration Duration of the transition in seconds
   * @returns Promise that resolves when the transition is complete
   */
  transitionHyperspace(enable: boolean, duration: number = 1.0): Promise<void> {
    // Initiate the hyperspace transition
    this.backgroundManager.transitionHyperspace(enable, duration);

    // Return a promise that resolves after the transition duration
    return new Promise<void>((resolve) => {
      setTimeout(() => resolve(), duration * 1000);
    });
  }

  /**
   * Gets the current background type.
   * @returns The current background type
   */
  getCurrentBackgroundType(): BackgroundType {
    return this.backgroundManager.getCurrentBackgroundType();
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

  /**
   * Sets the input system for player controls.
   * @param input The input system
   */
  setInput(input: Input): void {
    this.input = input;
  }

  /**
   * Initializes and loads the player ship.
   * @returns Promise that resolves when the ship is loaded
   */
  async initPlayerShip(): Promise<void> {
    if (!this.input) {
      throw new Error(
        "Input system must be set before initializing player ship"
      );
    }

    // Create the ship with our scene and input system, passing devMode flag
    this.playerShip = new Ship(this.scene, this.input, this.devMode);

    // Load the ship model (async)
    await this.playerShip.load();

    // If in dev mode, add boundary controls after ship is created
    if (this.devMode && this.playerShip) {
      this.setupDebugControls();
    }

    return Promise.resolve();
  }

  /**
   * Starts the ship entry animation after text crawl.
   * @param onComplete Optional callback for when entry is complete
   */
  startShipEntry(onComplete?: () => void): void {
    if (!this.playerShip) {
      this.logger.error("Cannot start ship entry - ship not initialized");
      return;
    }

    this.logger.info("🛸 SCENE: Starting ship entry animation");

    // Log ship information
    this.logger.info("🛸 SCENE: Ship object initialized:", !!this.playerShip);

    // Set game to active state
    this.gameActive = true;
    this.logger.info("🛸 SCENE: Game set to active state");

    // Create a wrapped callback to ensure game state is properly set
    const wrappedCallback = () => {
      this.logger.info("🛸 SCENE: Ship entry animation complete");
      if (onComplete) {
        this.logger.info("🛸 SCENE: Executing provided callback");
        onComplete();
      }
    };

    // Start the entry animation
    this.playerShip.enterScene(wrappedCallback);
  }

  /**
   * Skips the ship entry animation and positions the ship immediately.
   * Used in development mode to bypass animation and get straight to gameplay.
   */
  skipShipEntry(): void {
    if (!this.playerShip) {
      this.logger.error("Cannot skip ship entry - ship not initialized");
      return;
    }

    this.logger.info("🛸 SCENE: Skipping ship entry animation (dev mode)");

    // Immediately position the ship at the end position
    this.playerShip.setPlayerControlled(true);

    // Set game to active state
    this.gameActive = true;
    this.logger.info("🛸 SCENE: Game set to active state (dev mode)");
  }

  /**
   * Sets whether the game is active (player can control ship).
   * @param active Whether the game is active
   */
  setGameActive(active: boolean): void {
    this.gameActive = active;

    if (this.playerShip) {
      // Pass skipCallback as true to avoid recursive callbacks
      this.playerShip.setPlayerControlled(active, true);
    }
  }

  /**
   * Gets the player's ship.
   * @returns The player's ship
   */
  getPlayerShip(): Ship | null {
    return this.playerShip;
  }

  /**
   * Gets the current score.
   * @returns Current score
   */
  getScore(): number {
    return this.score;
  }

  /**
   * Sets the current score.
   * @param value New score value
   */
  setScore(value: number): void {
    this.score = value;
  }

  /**
   * Adds to the current score.
   * @param points Points to add to the score
   */
  addScore(points: number): void {
    this.score += points;
  }

  /**
   * Gets the current zone (level).
   * @returns Current zone number
   */
  getCurrentZone(): number {
    return this.currentZone;
  }

  /**
   * Sets the current zone (level).
   * @param zone Zone number
   */
  setCurrentZone(zone: number): void {
    this.currentZone = zone;
  }

  /**
   * Gets the current wave within the zone.
   * @returns Current wave number
   */
  getCurrentWave(): number {
    return this.currentWave;
  }

  /**
   * Sets the current wave within the zone.
   * @param wave Wave number
   */
  setCurrentWave(wave: number): void {
    this.currentWave = wave;
  }

  /**
   * Gets the total waves in the current zone.
   * @returns Total waves in the zone
   */
  getTotalWaves(): number {
    return this.totalWaves;
  }

  /**
   * Sets the total waves in the current zone.
   * @param total Total number of waves
   */
  setTotalWaves(total: number): void {
    this.totalWaves = total;
  }

  /**
   * Sets up debug controls when in dev mode.
   * @private
   */
  private setupDebugControls(): void {
    if (!this.playerShip) return;

    // Remove any existing controls
    if (this.debugControlsContainer) {
      document.body.removeChild(this.debugControlsContainer);
      this.debugControlsContainer = null;
    }

    // Create new controls
    this.debugControlsContainer = UIUtils.createShipBoundaryControls(
      this.playerShip
    );
    document.body.appendChild(this.debugControlsContainer);

    this.logger.info("Debug boundary controls added to scene");
  }

  /**
   * Removes debug controls from the DOM.
   * @private
   */
  private removeDebugControls(): void {
    if (
      this.debugControlsContainer &&
      document.body.contains(this.debugControlsContainer)
    ) {
      document.body.removeChild(this.debugControlsContainer);
      this.debugControlsContainer = null;
      this.logger.info("Debug boundary controls removed");
    }
  }

  /**
   * Sets up event listeners for the scene.
   * @private
   */
  private setupEventListeners(): void {
    // Handle window resize
    window.addEventListener("resize", this.onWindowResize.bind(this));

    this.logger.info("Scene: Event listeners set up");
  }
}
