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
import { Game } from "./Game";
// import { UISystem } from "./systems/UISystem";
import { Asteroid } from '../entities/Asteroid';
import { ZoneConfig } from './levels/ZoneConfig';
import { MAX_ZONE_ID, ZONE_CONFIGS } from './levels/ZoneConfigs';
import { RunState } from './RunState';
import { WaveManager, SpawnInstruction } from './WaveManager';
import { EnemyEntity } from '../entities/enemies/EnemyEntity';
import { CarrierPod } from '../entities/enemies/CarrierPod';
import { Raider } from '../entities/enemies/Raider';
import { createEnemy } from '../entities/enemies/EnemyFactory';
import { Projectile } from '../weapons/Projectile';
import { Hazard } from '../entities/hazards/Hazard';
import { ProximityMine } from '../entities/hazards/ProximityMine';
import { createHazard } from '../entities/hazards/HazardFactory';
import { Pickup } from '../entities/pickups/Pickup';
import { ScoreCache } from '../entities/pickups/ScoreCache';
import { createPickup } from '../entities/pickups/PickupFactory';
import { PickupType } from '../entities/pickups/PickupTypes';
import { BossEntity } from '../entities/enemies/bosses/BossEntity';
import { createBoss } from '../entities/enemies/bosses/BossFactory';

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

  /** Current animation frame request ID - reserved for animation management */
  private animationFrameId: number | null = null;

  /**
   * Canvas element reference - initialized in constructor,
   * used when disposing scene
   */
  private canvas: HTMLCanvasElement;

  /**
   * Last timestamp for animation frame - used for delta time calculation
   * in the animation loop
   */
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

  /** Whether the player's ship has been destroyed but entities should keep moving */
  private shipDestroyed: boolean = false;

  /** Current player score */
  private score: number = 0;

  /** Current zone (level) */
  private currentZone: number = 1;

  /** Current wave within the zone */
  private currentWave: number = 1;

  /** Total waves in the current zone */
  private totalWaves: number = 8;

  /** Active zone configuration */
  private activeZoneConfig: ZoneConfig | null = null;

  /** Score at the start of the current zone */
  private zoneScoreStart: number = 0;

  /** Flag to prevent repeated zone completion triggers */
  private zoneCompletionInProgress: boolean = false;

  /** Logger instance */
  private logger = Logger.getInstance();

  /** Debug controls container */
  private debugControlsContainer: HTMLElement | null = null;

  /** Whether dev mode is enabled */
  private devMode: boolean = false;

  /** Reference to the Game instance */
  private game: Game | null = null;

  /** Run state tracking upgrades and computed stats */
  private runState: RunState = new RunState();

  /** Wave-based spawn manager */
  private waveManager: WaveManager = new WaveManager();

  /** Last time an asteroid was spawned (in milliseconds) */
  private lastAsteroidSpawnTime: number = 0;

  /** Minimum time between asteroid spawns (in milliseconds) */
  private asteroidSpawnInterval: number = 3250; // Reduced from 5000 (by 35%)

  /** Collection of active asteroids in the scene */
  private asteroids: Asteroid[] = [];

  /** Collection of active enemies in the scene */
  private enemies: EnemyEntity[] = [];

  /** Collection of active hazards in the scene */
  private hazards: Hazard[] = [];

  /** Collection of active pickups in the scene */
  private pickups: Pickup[] = [];

  /** Current active boss (null if no boss fight) */
  private activeBoss: BossEntity | null = null;

  /** Maximum number of asteroids allowed at once */
  private maxAsteroids: number = 20;

  /** Maximum horizontal distance from center (full width = 2800) */
  private horizontalLimit: number = 1400;

  /** Maximum vertical distance from center (full height = 1400) */
  private verticalLimit: number = 700;

  /** Lateral flow direction for drift patterns (1 or -1) */
  private lateralFlowDirection: number = 1;

  /** Timestamp (ms) for the next lateral flow switch */
  private nextFlowSwitchTime: number = 0;

  /** Surge pattern active flag */
  private surgeActive: boolean = false;

  /** Timestamp (ms) for the next surge toggle */
  private nextSurgeToggleTime: number = 0;

  /** Duration for the current surge window (ms) */
  private surgeDurationMs: number = 0;

  /** @deprecated Collision now uses Ship.getHitbox() directly */
  private shipBoundingSphere: THREE.Sphere = new THREE.Sphere(
    new THREE.Vector3(),
    30
  );

  /** Reusable Vector3 for drift pattern calculations to avoid per-frame allocations */
  private tempDriftVector: THREE.Vector3 = new THREE.Vector3();

  /** Reusable Vector3 for spawn position calculations */
  private tempSpawnPosition: THREE.Vector3 = new THREE.Vector3();

  /** Reusable Vector3 for target position calculations */
  private tempTargetPosition: THREE.Vector3 = new THREE.Vector3();

  /** Reusable Vector3 for direction calculations */
  private tempDirection: THREE.Vector3 = new THREE.Vector3();

  /** Reusable axis vector for spiral rotation */
  private static readonly SPIRAL_AXIS: THREE.Vector3 = new THREE.Vector3(0, 0, 1);

  /** Bound resize handler for proper event listener cleanup */
  private boundOnWindowResize: () => void;

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

    // Bind the resize handler once and store it for proper cleanup
    this.boundOnWindowResize = this.onWindowResize.bind(this);
    window.addEventListener("resize", this.boundOnWindowResize);

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

      // Update asteroids
      this.updateAsteroids(deltaTime);

      // Update enemies (includes boss)
      this.updateEnemies(deltaTime);

      // Check if boss was destroyed
      if (this.activeBoss && !this.activeBoss.isActive()) {
        this.activeBoss = null;
      }

      // Update hazards
      this.updateHazards(deltaTime);

      // Update pickups
      this.updatePickups(deltaTime);

      // Check for collisions between ship, asteroids, enemies, hazards, and projectiles
      this.checkCollisions(deltaTime);

      // Update zone progression (waves and completion)
      this.updateZoneProgress();

      // Only continue spawning if the game is still active
      if (this.gameActive) {
        // Update drift/surge patterns
        this.updateZoneFlow();

        // Wave-based spawning
        const instruction = this.waveManager.update(deltaTime);
        if (instruction) {
          this.spawnFromInstruction(instruction);
        }

        // Update HUD wave display from wave manager
        this.currentWave = this.waveManager.getCurrentWave();
      }

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
    } else if (this.shipDestroyed) {
      // When ship is destroyed but entities should continue moving
      this.updateAsteroids(deltaTime);

      // Update weapon projectiles if the player ship still exists
      if (this.playerShip) {
        const weaponSystem = this.playerShip.getWeaponSystem();
        if (weaponSystem) {
          weaponSystem.updateProjectilesOnly(deltaTime);
        }
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
    // Stop the animation loop if it's running
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Remove event listeners using the stored bound reference
    window.removeEventListener("resize", this.boundOnWindowResize);

    // Clean up the background manager
    this.backgroundManager.dispose();

    // Clean up the player ship
    this.cleanupPlayerShip();

    // Clean up asteroids
    this.asteroids.forEach((asteroid) => {
      asteroid.dispose();
    });
    this.asteroids = [];

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

    // Reset game state
    this.gameActive = false;
    this.score = 0;
    this.currentWave = 1;

    this.logger.info("Scene successfully disposed");
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

    this.logger.info("Scene: Initializing player ship");

    if (!this.activeZoneConfig || this.score !== 0 || this.currentZone !== 1) {
      this.logger.info("Scene: Initializing run state for Zone 1");
      this.initializeRunState();
    }

    // Create the ship with our scene and input system, passing devMode flag
    this.playerShip = new Ship(this.scene, this.input, this.devMode);

    // Load the ship model (async)
    await this.playerShip.load();

    // Initialize ship systems
    await this.playerShip.initialize();

    // Connect to game instance for audio and UI access
    if (this.game && this.playerShip) {
      this.logger.info("Scene: Connecting ship to game services");

      // Get and pass the weapon system to the game for audio access
      const weaponSystem = this.playerShip.getWeaponSystem();
      if (weaponSystem) {
        weaponSystem.setGame(this.game);
        this.logger.info("Scene: Weapon system connected to game for audio");
      } else {
        this.logger.warn(
          "Scene: Could not connect weapon system to game - weaponSystem is null"
        );
      }

      // Connect weapon system to UI system if available
      const uiSystem = this.game.getUISystem();
      if (uiSystem) {
        this.playerShip.setUISystem(uiSystem);
        this.logger.info("Scene: Ship connected to UI system");
      }
    } else {
      this.logger.warn(
        "Scene: Could not connect ship to game services - game or ship is null"
      );
    }

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
   * Applies score multipliers from upgrades.
   * @param points Points to add to the score
   */
  addScore(points: number): void {
    // Apply score multiplier from upgrades
    const multiplier = this.runState.getEffectiveScoreMultiplier();
    const adjustedPoints = Math.floor(points * multiplier);
    this.score += adjustedPoints;
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
   * Resumes gameplay after a zone-complete pause.
   */
  resumeAfterZoneComplete(): void {
    this.logger.info("Resuming gameplay after zone completion");
    this.setGameActive(true);
  }

  /**
   * Gets the config for a given zone ID.
   * @param zoneId Zone number
   * @returns Zone configuration
   */
  private getZoneConfig(zoneId: number): ZoneConfig {
    const config = ZONE_CONFIGS.find((zone) => zone.id === zoneId);
    return config || ZONE_CONFIGS[0];
  }

  /**
   * Initializes a new run state for zone 1.
   */
  private initializeRunState(): void {
    this.score = 0;
    this.zoneScoreStart = 0;
    this.zoneCompletionInProgress = false;
    this.clearAllAsteroids();
    this.applyZoneConfig(this.getZoneConfig(1), true);

    // Reset roguelite run state for new game
    this.runState.reset();

    // Reset ship stats if ship exists
    if (this.playerShip) {
      this.playerShip.resetStats();
    }
  }

  /**
   * Applies zone configuration and resets zone-specific timers.
   * @param config Zone configuration
   * @param resetScoreStart Whether to reset the zone score baseline
   */
  private applyZoneConfig(config: ZoneConfig, resetScoreStart: boolean): void {
    this.activeZoneConfig = config;
    this.currentZone = config.id;
    this.totalWaves = config.waveCount;
    this.currentWave = 1;
    this.maxAsteroids = config.maxAsteroids;
    this.horizontalLimit = config.playfield.horizontalLimit;
    this.verticalLimit = config.playfield.verticalLimit;
    this.asteroidSpawnInterval = config.spawnIntervalMs.start;
    this.lastAsteroidSpawnTime = 0;
    this.zoneCompletionInProgress = false;

    if (this.playerShip) {
      this.playerShip.setBoundaryLimits(
        this.horizontalLimit,
        this.verticalLimit
      );
    }

    if (resetScoreStart) {
      this.zoneScoreStart = this.score;
    }

    // Initialize wave manager with zone config and combat log callback
    const uiSystem = this.game ? this.game.getUISystem() : null;
    this.waveManager.initialize(config, (message: string) => {
      if (uiSystem) {
        uiSystem.addCombatLogMessage(message, 'wave-announcement');
      }
      this.logger.info(`WaveManager: ${message}`);
    });

    this.configureZoneFlow(config);
    this.applyZoneBackground(config);
  }

  /**
   * Updates wave progression and triggers zone completion when appropriate.
   */
  private updateZoneProgress(): void {
    if (!this.activeZoneConfig || this.zoneCompletionInProgress) return;

    // Zone completion is driven by wave manager
    if (this.waveManager.isZoneComplete()) {
      this.zoneCompletionInProgress = true;
      this.completeCurrentZone();
    }
  }

  /**
   * Returns the score earned within the current zone.
   * @returns Zone score (score since zone start)
   */
  private getZoneScore(): number {
    return Math.max(0, this.score - this.zoneScoreStart);
  }

  /**
   * Updates zone flow timers for drift/surge patterns.
   */
  private updateZoneFlow(): void {
    if (!this.activeZoneConfig) return;

    const now = performance.now();
    const driftPattern = this.activeZoneConfig.driftPattern;

    if (driftPattern === "lateral") {
      if (now >= this.nextFlowSwitchTime) {
        this.lateralFlowDirection *= -1;
        this.nextFlowSwitchTime = now + this.randomRange(18000, 22000);
      }
    }

    if (driftPattern === "surge") {
      if (!this.surgeActive && now >= this.nextSurgeToggleTime) {
        this.surgeActive = true;
        this.surgeDurationMs = this.randomRange(3200, 5200);
        this.nextSurgeToggleTime = now + this.surgeDurationMs;
      } else if (this.surgeActive && now >= this.nextSurgeToggleTime) {
        this.surgeActive = false;
        this.nextSurgeToggleTime = now + this.randomRange(12000, 15000);
      }
    }
  }

  /**
   * Configures flow state for the active zone.
   * @param config Zone configuration
   */
  private configureZoneFlow(config: ZoneConfig): void {
    const now = performance.now();
    this.lateralFlowDirection = Math.random() < 0.5 ? -1 : 1;
    this.nextFlowSwitchTime = now + this.randomRange(18000, 22000);

    this.surgeActive = false;
    this.surgeDurationMs = this.randomRange(3200, 5200);
    this.nextSurgeToggleTime = now + this.randomRange(12000, 15000);

    if (config.driftPattern === "none") {
      this.surgeActive = false;
    }
  }

  /**
   * Applies background parameters for the active zone.
   * @param config Zone configuration
   */
  private applyZoneBackground(config: ZoneConfig): void {
    if (!config.background) return;

    const params: Record<string, number> = {};
    if (config.background.starColor !== undefined) {
      params.starColor = config.background.starColor;
    }
    if (config.background.minSpeed !== undefined) {
      params.minSpeed = config.background.minSpeed;
    }
    if (config.background.maxSpeed !== undefined) {
      params.maxSpeed = config.background.maxSpeed;
    }

    if (Object.keys(params).length === 0) return;

    this.backgroundManager
      .setBackground(BackgroundType.STARFIELD, params)
      .catch((error) => {
        this.logger.warn("Failed to apply zone background params:", error);
      });
  }

  /**
   * Returns the current spawn interval based on zone progress.
   * @returns Spawn interval in milliseconds
   */
  private getSpawnIntervalForZone(): number {
    if (!this.activeZoneConfig) return this.asteroidSpawnInterval;

    const { start, min } = this.activeZoneConfig.spawnIntervalMs;
    const progress = Math.min(1, (this.currentWave - 1) / this.totalWaves);
    const interval = start - (start - min) * progress;
    return Math.max(min, interval);
  }

  /**
   * Returns a random number in the range [min, max].
   * @param min Minimum value
   * @param max Maximum value
   * @returns Random number
   */
  private randomRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  /**
   * Applies zone-specific drift patterns to a direction vector.
   * Uses reusable temp vectors to avoid per-frame allocations.
   * @param direction Direction vector to modify
   */
  private applyDriftPattern(direction: THREE.Vector3): void {
    if (!this.activeZoneConfig) return;

    switch (this.activeZoneConfig.driftPattern) {
      case "lateral": {
        // Reuse temp vector for lateral drift
        this.tempDriftVector.set(this.lateralFlowDirection * 0.35, 0, 0);
        direction.add(this.tempDriftVector).normalize();
        break;
      }
      case "spiral": {
        const angle = (performance.now() * 0.0007) % (Math.PI * 2);
        direction.applyAxisAngle(Scene.SPIRAL_AXIS, angle);
        this.tempDriftVector.set(Math.sin(angle) * 0.15, 0, 0);
        direction.add(this.tempDriftVector).normalize();
        break;
      }
      case "surge": {
        if (this.surgeActive) {
          this.tempDriftVector.set(0, this.randomRange(-0.2, 0.2), 0);
          direction.add(this.tempDriftVector).normalize();
        }
        break;
      }
      default:
        break;
    }
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
   * Note: Resize listener is already added in constructor, this is for additional listeners only.
   * @private
   */
  private setupEventListeners(): void {
    // Resize listener is already added in constructor using boundOnWindowResize
    // Add any additional event listeners here if needed
    this.logger.info("Scene: Event listeners set up");
  }

  /**
   * Sets the game instance reference
   * @param game The Game instance
   */
  setGame(game: Game): void {
    this.game = game;
  }

  /**
   * Updates all active asteroids in the scene.
   * @param deltaTime Time elapsed since the last frame in seconds
   */
  private updateAsteroids(deltaTime: number): void {
    const prevCount = this.asteroids.length;
    this.asteroids = this.asteroids.filter((asteroid) => {
      return asteroid.update(deltaTime);
    });
    // Notify wave manager for asteroids that left the field (went off-screen)
    const removed = prevCount - this.asteroids.length;
    for (let i = 0; i < removed; i++) {
      this.waveManager.onEntityDestroyed();
    }
  }

  /**
   * Dispatches a spawn instruction from the WaveManager to the appropriate
   * entity creation method.
   */
  private spawnFromInstruction(instruction: SpawnInstruction): void {
    if (this.shipDestroyed) return;

    switch (instruction.type) {
      case 'asteroid':
        this.spawnAsteroid(instruction.radius);
        break;
      case 'enemy':
        if (instruction.enemyType) {
          this.spawnEnemy(instruction.enemyType);
        }
        break;
      case 'hazard':
        if (instruction.hazardType) {
          this.spawnHazard(instruction.hazardType);
        }
        break;
      case 'pickup':
        if (instruction.pickupType) {
          this.spawnPickup(instruction.pickupType);
        }
        break;
      case 'boss':
        if (instruction.bossId) {
          this.spawnBoss(instruction.bossId);
        }
        break;
    }
  }

  /**
   * Spawns a new asteroid at a random position outside the player's view.
   * Uses reusable temp vectors to minimize allocations.
   * @param overrideRadius Optional radius from wave manager (overrides zone config randomization)
   */
  private spawnAsteroid(overrideRadius?: number): void {
    if (!this.playerShip) return;

    const config = this.activeZoneConfig;
    const playerPos = this.playerShip.getPosition();

    // Generate random position at the edge of the starfield, ahead of the player
    // (asteroid will move toward the player)
    const spawnDistance = 1500; // Far enough to not be immediately visible
    const spawnWidth = this.horizontalLimit * 1.5;
    const spawnHeight = this.verticalLimit * 1.5;

    // Reuse temp vectors for spawn calculations
    this.tempSpawnPosition.set(
      playerPos.x + (Math.random() * spawnWidth - spawnWidth / 2),
      playerPos.y + (Math.random() * spawnHeight - spawnHeight / 2),
      playerPos.z - spawnDistance
    );

    // Direction vector pointing toward the player's general area
    this.tempTargetPosition.set(
      playerPos.x + (Math.random() * 200 - 100), // Reduced randomness for better targeting
      playerPos.y + (Math.random() * 200 - 100), // Reduced randomness for better targeting
      playerPos.z + 100 // Aim closer to the player's position
    );

    this.tempDirection
      .subVectors(this.tempTargetPosition, this.tempSpawnPosition)
      .normalize();

    this.applyDriftPattern(this.tempDirection);

    const sizeRange = config?.asteroidSizeRange || [20, 50];
    const speedRange = config?.asteroidSpeedRange || [400, 620];
    const damageRange = config?.asteroidDamageRange || [20, 60];

    // Randomize asteroid properties based on zone config
    // Apply speed factor from upgrades (Chrono Brake slows asteroids)
    const baseSpeed = this.randomRange(speedRange[0], speedRange[1]);
    const speed = baseSpeed * this.runState.getAsteroidSpeedFactor();
    const size = overrideRadius ?? this.randomRange(sizeRange[0], sizeRange[1]);
    const damage = Math.round(this.randomRange(damageRange[0], damageRange[1]));

    // Create and add the asteroid (clone temp vectors since Asteroid stores them)
    const asteroid = new Asteroid(
      this.scene,
      this.tempSpawnPosition.clone(),
      this.tempDirection.clone(),
      speed,
      size,
      damage
    );

    // Pass the Game reference to the asteroid if available
    if (this.game) {
      asteroid.setGame(this.game);
    }

    this.asteroids.push(asteroid);
    this.logger.debug(
      `Spawned asteroid (${this.asteroids.length}/${this.maxAsteroids})`
    );
  }

  /**
   * Spawns an enemy at a random position ahead of the player.
   */
  private spawnEnemy(enemyType: import('../entities/enemies/EnemyTypes').EnemyType): void {
    if (!this.playerShip) return;

    const playerPos = this.playerShip.getPosition();
    const spawnPos = new THREE.Vector3(
      playerPos.x + (Math.random() * this.horizontalLimit - this.horizontalLimit / 2),
      playerPos.y + (Math.random() * this.verticalLimit * 0.5 - this.verticalLimit * 0.25),
      playerPos.z - 1200 - Math.random() * 400
    );

    const enemy = createEnemy(enemyType, this.scene, spawnPos);
    enemy.setPlayerPosition(playerPos);
    this.enemies.push(enemy);
    this.logger.debug(`Spawned enemy: ${enemyType} (${this.enemies.length} active)`);
  }

  /**
   * Updates all active enemies in the scene.
   */
  private updateEnemies(deltaTime: number): void {
    if (!this.playerShip) return;

    const playerPos = this.playerShip.getPosition();
    const prevCount = this.enemies.length;

    this.enemies = this.enemies.filter((enemy) => {
      enemy.setPlayerPosition(playerPos);

      // Check if CarrierPod wants to spawn a Raider
      if (enemy instanceof CarrierPod && enemy.shouldSpawnRaider()) {
        const raider = new Raider(this.scene, enemy.getPosition());
        raider.setPlayerPosition(playerPos);
        this.enemies.push(raider);
        // Don't count carrier-spawned raiders toward wave entity count
      }

      return enemy.update(deltaTime);
    });

    // Notify wave manager for enemies that left the field
    const removed = prevCount - this.enemies.length;
    for (let i = 0; i < removed; i++) {
      this.waveManager.onEntityDestroyed();
    }
  }

  /**
   * Spawns a boss enemy.
   */
  private spawnBoss(bossId: string): void {
    if (!this.playerShip) return;

    const playerPos = this.playerShip.getPosition();
    const spawnPos = new THREE.Vector3(0, 0, playerPos.z - 1500);

    const boss = createBoss(bossId, this.scene, spawnPos);
    boss.setPlayerPosition(playerPos);
    this.activeBoss = boss;
    // Also add to enemies array for collision/update tracking
    this.enemies.push(boss);

    const uiSystem = this.game ? this.game.getUISystem() : null;
    if (uiSystem) {
      uiSystem.addCombatLogMessage(
        `WARNING: ${boss.getBossName().toUpperCase()} DETECTED`,
        'boss-spawn'
      );
    }

    this.logger.info(`Boss spawned: ${boss.getBossName()} (${bossId})`);
  }

  /**
   * Spawns a pickup at a random position near the player.
   * Can be called by WaveManager (scheduled) or on enemy death (drop).
   */
  private spawnPickup(pickupType: PickupType, position?: THREE.Vector3): void {
    if (!this.playerShip) return;

    const playerPos = this.playerShip.getPosition();
    const spawnPos = position || new THREE.Vector3(
      playerPos.x + (Math.random() * this.horizontalLimit * 0.6 - this.horizontalLimit * 0.3),
      playerPos.y + (Math.random() * this.verticalLimit * 0.3 - this.verticalLimit * 0.15),
      playerPos.z - 600 - Math.random() * 300
    );

    const pickup = createPickup(pickupType, this.scene, spawnPos);
    pickup.setPlayerPosition(playerPos);
    this.pickups.push(pickup);
    this.logger.debug(`Spawned pickup: ${pickupType} (${this.pickups.length} active)`);
  }

  /**
   * Updates all active pickups in the scene.
   */
  private updatePickups(deltaTime: number): void {
    if (!this.playerShip) return;

    const playerPos = this.playerShip.getPosition();
    const prevCount = this.pickups.length;

    this.pickups = this.pickups.filter((pickup) => {
      pickup.setPlayerPosition(playerPos);
      return pickup.update(deltaTime);
    });

    // Pickups that expired or drifted off still count for wave
    const removed = prevCount - this.pickups.length;
    for (let i = 0; i < removed; i++) {
      this.waveManager.onEntityDestroyed();
    }
  }

  /**
   * Attempts to drop a random pickup at the given position.
   * Uses the zone's pickupDropRate to determine probability.
   */
  private tryDropPickup(position: THREE.Vector3): void {
    const dropRate = this.activeZoneConfig?.pickupDropRate ?? 0.15;
    const pickupPalette = this.activeZoneConfig?.pickupPalette ?? [];

    if (pickupPalette.length === 0 || Math.random() > dropRate) return;

    const type = pickupPalette[Math.floor(Math.random() * pickupPalette.length)];
    this.spawnPickup(type, position.clone());
  }

  /**
   * Spawns a hazard at a random position ahead of the player.
   */
  private spawnHazard(hazardType: import('../entities/hazards/HazardTypes').HazardType): void {
    if (!this.playerShip) return;

    const playerPos = this.playerShip.getPosition();
    const spawnPos = new THREE.Vector3(
      playerPos.x + (Math.random() * this.horizontalLimit - this.horizontalLimit / 2),
      playerPos.y + (Math.random() * this.verticalLimit * 0.4 - this.verticalLimit * 0.2),
      playerPos.z - 1400 - Math.random() * 300
    );

    const hazard = createHazard(hazardType, this.scene, spawnPos);
    this.hazards.push(hazard);
    this.logger.debug(`Spawned hazard: ${hazardType} (${this.hazards.length} active)`);
  }

  /**
   * Updates all active hazards in the scene.
   */
  private updateHazards(deltaTime: number): void {
    const prevCount = this.hazards.length;
    this.hazards = this.hazards.filter((hazard) => {
      return hazard.update(deltaTime);
    });
    const removed = prevCount - this.hazards.length;
    for (let i = 0; i < removed; i++) {
      this.waveManager.onEntityDestroyed();
    }
  }

  /**
   * Checks for collisions between game objects:
   *  - Player projectiles vs asteroids
   *  - Player projectiles vs enemies
   *  - Player projectiles vs destructible hazards
   *  - Enemy projectiles vs player ship
   *  - Player ship vs asteroids (contact)
   *  - Player ship vs enemies (contact)
   *  - Player ship vs hazards (effect application)
   */
  private checkCollisions(deltaTime: number = 0): void {
    if (!this.playerShip) return;

    // Ship.getHitbox() now returns THREE.Sphere directly
    const shipSphere = this.playerShip.getHitbox();

    // God mode damage multiplier
    const playerDmgMult = this.playerShip.getDamageMultiplier();

    // Collect player projectiles
    const weaponSystem = this.playerShip.getWeaponSystem();
    let playerProjectiles: Projectile[] = [];

    if (weaponSystem) {
      const primaryWeapon = weaponSystem.getPrimaryWeapon();
      const secondaryWeapon = weaponSystem.getSecondaryWeapon();

      if (primaryWeapon) {
        playerProjectiles = playerProjectiles.concat(primaryWeapon.getProjectiles());
      }
      if (secondaryWeapon) {
        playerProjectiles = playerProjectiles.concat(secondaryWeapon.getProjectiles());
      }
    }

    // Collect enemy projectiles
    let enemyProjectiles: Projectile[] = [];
    for (const enemy of this.enemies) {
      const ep = enemy.getProjectiles();
      if (ep.length > 0) {
        enemyProjectiles = enemyProjectiles.concat(ep);
      }
    }

    const uiSystem = this.game ? this.game.getUISystem() : null;

    // --- Player projectiles vs asteroids ---
    this.asteroids = this.asteroids.filter((asteroid) => {
      if (!asteroid.isActive()) return false;

      const asteroidHitbox = asteroid.getHitbox();
      let destroyed = false;

      for (const projectile of playerProjectiles) {
        if (!projectile.getIsActive()) continue;
        if (projectile.getHitbox().intersectsSphere(asteroidHitbox)) {
          projectile.handleCollision();
          asteroid.handleCollision();
          destroyed = true;

          const asteroidSize = asteroid.getSize();
          const scoreValue = Math.floor(30 + asteroidSize * 0.5);
          this.addScore(scoreValue);

          if (uiSystem) {
            const sizeDesc = asteroidSize > 40 ? 'LARGE' : asteroidSize > 25 ? 'MEDIUM' : 'SMALL';
            uiSystem.addCombatLogMessage(
              `${sizeDesc} ASTEROID DESTROYED (+${scoreValue} pts)`,
              'asteroid-destroyed'
            );
          }

          if (this.game) {
            try {
              this.game.getAudioManager().playAsteroidCollisionSound('small');
            } catch (_e) { /* ignore */ }
          }

          this.waveManager.onEntityDestroyed();
          break;
        }
      }

      if (destroyed) return false;

      // Ship vs asteroid contact
      if (shipSphere.intersectsSphere(asteroidHitbox)) {
        if (this.game) {
          try {
            this.game.getAudioManager().playAsteroidCollisionSound('medium');
          } catch (_e) { /* ignore */ }
        }

        if (this.runState.tryAbsorbHit(this.score)) {
          if (uiSystem) {
            uiSystem.addCombatLogMessage('POINT DEFENSE ABSORBED IMPACT!', 'point-defense');
          }
        } else {
          const damage = asteroid.getDamage();
          const isDestroyed = this.playerShip!.takeDamage(damage);

          if (uiSystem) {
            uiSystem.addCombatLogMessage(
              `SHIP TOOK ${damage} DAMAGE FROM ASTEROID IMPACT!`,
              'damage-taken'
            );
          }
          if (isDestroyed) {
            this.handleShipDestruction();
          }
        }

        asteroid.handleCollision();
        this.waveManager.onEntityDestroyed();
        return false;
      }

      return true;
    });

    // --- Player projectiles vs enemies ---
    this.enemies = this.enemies.filter((enemy) => {
      if (!enemy.isActive()) return false;

      const enemyHitbox = enemy.getHitbox();
      let destroyed = false;

      for (const projectile of playerProjectiles) {
        if (!projectile.getIsActive()) continue;
        if (projectile.getHitbox().intersectsSphere(enemyHitbox)) {
          const dmg = projectile.handleCollision() * playerDmgMult;
          const killed = enemy.takeDamage(dmg);

          if (killed) {
            destroyed = true;
            const sv = enemy.getScoreValue();
            this.addScore(sv);

            if (uiSystem) {
              const typeName = enemy.getEnemyType().toUpperCase().replace('_', ' ');
              uiSystem.addCombatLogMessage(
                `${typeName} DESTROYED (+${sv} pts)`,
                'enemy-destroyed'
              );
            }

            if (this.game) {
              try {
                this.game.getAudioManager().playAsteroidCollisionSound('medium');
              } catch (_e) { /* ignore */ }
            }

            // Try to drop a pickup
            this.tryDropPickup(enemy.getPosition());

            this.waveManager.onEntityDestroyed();
            break;
          }
        }
      }

      if (destroyed) return false;

      // Ship vs enemy contact
      if (shipSphere.intersectsSphere(enemyHitbox)) {
        const contactDmg = enemy.getContactDamage();

        if (this.runState.tryAbsorbHit(this.score)) {
          if (uiSystem) {
            uiSystem.addCombatLogMessage('POINT DEFENSE ABSORBED IMPACT!', 'point-defense');
          }
        } else {
          const isDestroyed = this.playerShip!.takeDamage(contactDmg);
          if (uiSystem) {
            uiSystem.addCombatLogMessage(
              `SHIP TOOK ${contactDmg} DAMAGE FROM ENEMY COLLISION!`,
              'damage-taken'
            );
          }
          if (isDestroyed) {
            this.handleShipDestruction();
          }
        }

        // Destroy the enemy on contact too
        enemy.destroy();
        this.waveManager.onEntityDestroyed();
        return false;
      }

      return true;
    });

    // --- Enemy projectiles vs player ship ---
    for (const projectile of enemyProjectiles) {
      if (!projectile.getIsActive()) continue;
      if (projectile.getHitbox().intersectsSphere(shipSphere)) {
        const dmg = projectile.handleCollision();

        if (this.runState.tryAbsorbHit(this.score)) {
          if (uiSystem) {
            uiSystem.addCombatLogMessage('POINT DEFENSE ABSORBED SHOT!', 'point-defense');
          }
        } else {
          const isDestroyed = this.playerShip!.takeDamage(dmg);
          if (uiSystem) {
            uiSystem.addCombatLogMessage(
              `SHIP TOOK ${dmg} DAMAGE FROM ENEMY FIRE!`,
              'damage-taken'
            );
          }
          if (isDestroyed) {
            this.handleShipDestruction();
            break;
          }
        }
      }
    }

    // --- Player projectiles vs destructible hazards ---
    this.hazards = this.hazards.filter((hazard) => {
      if (!hazard.isActive()) return false;

      if (hazard.isDestructible()) {
        const hazardHitbox = hazard.getHitbox();
        for (const projectile of playerProjectiles) {
          if (!projectile.getIsActive()) continue;
          if (projectile.getHitbox().intersectsSphere(hazardHitbox)) {
            const dmg = projectile.handleCollision() * playerDmgMult;
            const killed = hazard.takeDamage(dmg);
            if (killed) {
              if (uiSystem) {
                uiSystem.addCombatLogMessage('HAZARD DESTROYED', 'hazard-destroyed');
              }
              this.waveManager.onEntityDestroyed();
              return false;
            }
          }
        }
      }

      // --- Player ship vs hazard area (only if ship exists) ---
      if (this.playerShip && shipSphere.intersectsSphere(hazard.getHitbox())) {
        // ProximityMine detonates, others apply continuous effect
        if (hazard instanceof ProximityMine) {
          const mine = hazard as ProximityMine;
          const blastDmg = mine.getBlastDamage();

          if (this.runState.tryAbsorbHit(this.score)) {
            if (uiSystem) {
              uiSystem.addCombatLogMessage('POINT DEFENSE ABSORBED MINE!', 'point-defense');
            }
          } else {
            const isDestroyed = this.playerShip!.takeDamage(blastDmg);
            if (uiSystem) {
              uiSystem.addCombatLogMessage(
                `MINE DETONATION! ${blastDmg} DAMAGE!`,
                'damage-taken'
              );
            }
            if (isDestroyed) {
              this.handleShipDestruction();
            }
          }
          mine.detonate();
          this.waveManager.onEntityDestroyed();
          return false;
        } else {
          // Continuous effect hazards (radiation, gravity, debris)
          hazard.applyEffect(this.playerShip!, deltaTime);
        }
      }

      return true;
    });

    // --- Player ship vs pickups (collection) ---
    if (this.playerShip) {
      this.pickups = this.pickups.filter((pickup) => {
        if (!pickup.isActive()) return false;

        if (shipSphere.intersectsSphere(pickup.getHitbox())) {
          pickup.applyPickup(this.playerShip!);

          // ScoreCache adds points
          if (pickup instanceof ScoreCache) {
            const sv = (pickup as ScoreCache).getScoreValue();
            this.addScore(sv);
            if (uiSystem) {
              uiSystem.addCombatLogMessage(`SCORE CACHE (+${sv} pts)`, 'pickup-collected');
            }
          } else {
            if (uiSystem) {
              const name = pickup.getPickupType().toUpperCase().replace('_', ' ');
              uiSystem.addCombatLogMessage(`${name} COLLECTED`, 'pickup-collected');
            }
          }

          pickup.destroy();
          this.waveManager.onEntityDestroyed();
          return false;
        }

        return true;
      });
    }
  }

  /**
   * Handles the destruction of the player's ship (game over).
   */
  private handleShipDestruction(): void {
    this.logger.info("Player ship destroyed! Game over.");

    // Transition out of hyperspace
    this.backgroundManager.transitionHyperspace(false, 1.0);

    // Set shipDestroyed to true to allow entities to continue moving
    this.shipDestroyed = true;

    // Mark game as inactive for spawning but keep entities moving
    this.gameActive = false;

    if (this.playerShip) {
      // Disable ship control but keep references for projectile updates
      this.playerShip.setPlayerControlled(false, true);

      // Stop the ship from moving
      this.playerShip.stopMovement();
    }

    // Add dramatic pause before showing game over screen
    setTimeout(() => {
      // Show game over screen if UI system is available
      if (this.game) {
        this.game.getUISystem().showGameOver();
      }
    }, 3000); // Wait 3 seconds before showing game over screen
  }

  /**
   * Resets the game state to start a new game.
   * This is called when the player chooses to restart after game over.
   */
  resetGame(): void {
    this.logger.info("Resetting game state for a new game");

    // Reset game state
    this.setGameActive(false);
    this.shipDestroyed = false;

    // Reset game score and progression
    this.initializeRunState();

    // Reset player ship if it exists
    if (this.playerShip) {
      // Reset health and shields
      this.playerShip.setHealth(100);
      this.playerShip.setShield(100);

      // Force ship to entry start position and reset velocity
      this.playerShip.resetPosition();

      // Start entry animation with proper callback to restore game state
      this.startShipEntry(() => {
        this.logger.info("Ship entry complete after reset");
        this.setGameActive(true);
        // Use skipCallback to prevent recursion
        this.playerShip?.setPlayerControlled(true, true);
      });
    } else {
      // If ship doesn't exist, initialize it
      this.initPlayerShip()
        .then(() => {
          this.startShipEntry(() => {
            this.logger.info("Ship entry complete after init in reset");
            this.setGameActive(true);
            // Use skipCallback to prevent recursion
            this.playerShip?.setPlayerControlled(true, true);
          });
        })
        .catch((error) => {
          this.logger.error("Failed to initialize ship during reset:", error);
        });
    }
  }

  /**
   * Clears all entities (asteroids, enemies, hazards, pickups) from the scene.
   */
  private clearAllEntities(): void {
    this.logger.info(
      `Clearing all entities (asteroids: ${this.asteroids.length}, enemies: ${this.enemies.length})`
    );

    for (const asteroid of this.asteroids) {
      asteroid.dispose();
    }
    this.asteroids = [];

    for (const enemy of this.enemies) {
      enemy.dispose();
    }
    this.enemies = [];

    for (const hazard of this.hazards) {
      hazard.dispose();
    }
    this.hazards = [];

    for (const pickup of this.pickups) {
      pickup.dispose();
    }
    this.pickups = [];

    this.activeBoss = null;
  }

  /**
   * Legacy alias for clearAllEntities.
   */
  private clearAllAsteroids(): void {
    this.clearAllEntities();
  }

  /**
   * Completes the current zone and progresses to the next zone.
   * Called when the player reaches the zone score threshold.
   */
  completeCurrentZone(): void {
    this.logger.info(`Completing Zone ${this.currentZone}`);

    // Store the completed zone number
    const completedZone = this.currentZone;

    // Clear all asteroids
    this.clearAllAsteroids();

    // Reset asteroid spawn timer
    this.lastAsteroidSpawnTime = 0;

    // Play a sound effect if available
    if (this.game && this.game.getAudioManager()) {
      try {
        this.logger.info(
          "Zone completed - playing success sound would go here"
        );
        // this.game.getAudioManager().playMenuSound("select");
      } catch (error) {
        this.logger.warn("Failed to play zone completion sound:", error);
      }
    }

    const uiSystem = this.game ? this.game.getUISystem() : null;

    if (uiSystem) {
      uiSystem.addCombatLogMessage(
        `ZONE ${completedZone} CLEARED!`,
        "zone-cleared"
      );
    }

    // Get weapon system reference
    const weaponSystem = this.playerShip?.getWeaponSystem() || null;

    // Check if this was the final zone
    if (completedZone >= MAX_ZONE_ID) {
      this.setGameActive(false);
      if (this.playerShip) {
        this.playerShip.setPlayerControlled(false, true);
      }

      if (uiSystem && this.playerShip && weaponSystem) {
        uiSystem.showZoneComplete(
          this.runState,
          this.playerShip,
          weaponSystem,
          completedZone,
          null,
          () => {
            this.logger.info("Final zone complete - returning to menu");
          }
        );
      }
      return;
    }

    // Calculate next zone ID
    const nextZoneId = completedZone + 1;

    // Pause gameplay and show zone complete screen with upgrade selection
    this.setGameActive(false);
    if (this.playerShip) {
      this.playerShip.setPlayerControlled(false, true);
    }

    if (uiSystem && this.playerShip && weaponSystem) {
      // Reset per-zone flags before showing upgrade selection
      this.runState.onZoneStart();

      uiSystem.showZoneComplete(
        this.runState,
        this.playerShip,
        weaponSystem,
        completedZone,
        nextZoneId,
        () => {
          // This callback runs after upgrade selection
          this.logger.info(
            `Zone ${completedZone} upgrades complete, transitioning to Zone ${nextZoneId}`
          );

          // Apply next zone configuration
          this.applyZoneConfig(this.getZoneConfig(nextZoneId), true);

          // Resume gameplay
          this.resumeAfterZoneComplete();
        }
      );
    }
  }

  /**
   * Cleans up the player ship, disposing resources and removing it from the scene.
   * This should be called when returning to the main menu.
   */
  cleanupPlayerShip(): void {
    this.logger.info("Cleaning up player ship");

    if (this.playerShip) {
      // Dispose of the ship resources
      this.playerShip.dispose();

      // Clear the reference
      this.playerShip = null;
    }
  }

  /**
   * Gets the list of active asteroids in the scene.
   * @returns Array of active asteroids
   */
  getAsteroids(): Asteroid[] {
    return this.asteroids;
  }

  /**
   * Gets the currently active boss, if any.
   */
  getActiveBoss(): BossEntity | null {
    return this.activeBoss;
  }
}
