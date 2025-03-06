import * as THREE from "three";
import { Input } from "../core/Input";
import { Logger } from "../utils/Logger";
import { WeaponSystem } from "../weapons/WeaponSystem";
import { UISystem } from "../core/systems/UISystem";

/**
 * Represents the player's ship in the game.
 * Handles rendering, movement, and player input.
 */
export class Ship {
  /** The 3D model of the ship */
  private model: THREE.Object3D | null = null;

  /** The mesh representing the ship's hitbox */
  private hitbox: THREE.Mesh | null = null;

  /** Visible boundary box for debugging flight limits */
  private boundaryBox: THREE.LineSegments | null = null;

  /** Whether the ship has been loaded */
  private loaded: boolean = false;

  /** Whether the ship is currently controlled by the player */
  private playerControlled: boolean = false;

  /** Whether development mode is enabled */
  private devMode: boolean = false;

  /** The ship's current position */
  private position: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  /** The ship's current velocity */
  private velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  /** The ship's current rotation */
  private rotation: THREE.Euler = new THREE.Euler(0, 0, 0);

  /** The ship's movement speed */
  // private speed: number = 5;

  /** Maximum horizontal distance from center (full width = 2800) */
  private horizontalLimit: number = 1400;

  /** Maximum vertical distance from center (full height = 1400) */
  private verticalLimit: number = 700;

  /** The ship's health (hull integrity) */
  private health: number = 100;

  /** The ship's maximum health */
  private maxHealth: number = 100;

  /** The ship's shield strength */
  private shield: number = 100;

  /** The ship's maximum shield strength */
  private maxShield: number = 100;

  /** The ship's rotation speed */
  // private rotationSpeed: number = 0.05;

  /** Reference to the input system */
  private input: Input;

  /** Reference to the Three.js scene */
  private scene: THREE.Scene;

  /** Ship entry animation duration in seconds */
  private readonly ENTRY_DURATION = 3.0;

  /** Is the entry animation playing */
  private playingEntryAnimation: boolean = false;

  /** Start time of the entry animation */
  private entryStartTime: number = 0;

  /** Starting position for the entry animation (top-right, far back) */
  private readonly ENTRY_START_POSITION = new THREE.Vector3(500, 500, -800);

  /** Final position for the entry animation (center, forward) */
  private readonly ENTRY_END_POSITION = new THREE.Vector3(0, 0, -300);

  /** Callback to call when entry animation completes */
  private onEntryCompleteCallback: (() => void) | null = null;

  /** Array of engine glow mesh objects for animation */
  private engineGlowMeshes: THREE.Mesh[] = [];

  /** Logger instance */
  private logger = Logger.getInstance();

  /** Weapon system for the ship */
  private weaponSystem: WeaponSystem | null = null;

  /** Direction the ship is facing/aiming */
  private aimDirection: THREE.Vector3 = new THREE.Vector3(0, 0, -1);

  /** Array of engine trails */
  private engineTrails: {
    mesh: THREE.Points;
    positions: Float32Array;
    parentEngine: THREE.Mesh;
  }[] = [];

  /**
   * Creates a new Ship instance.
   * @param scene The THREE.Scene to add the ship to
   * @param input The Input instance for handling controls
   * @param devMode Whether development mode is enabled
   */
  constructor(scene: THREE.Scene, input: Input, devMode: boolean = false) {
    this.scene = scene;
    this.input = input;
    this.devMode = devMode;

    // Set initial position off-screen
    this.position.copy(this.ENTRY_START_POSITION);

    // Initialize the weapon system
    this.weaponSystem = new WeaponSystem(scene);
  }

  /**
   * Loads the ship model asynchronously.
   * @returns Promise that resolves when the model is loaded
   */
  async load(): Promise<void> {
    if (this.loaded) return Promise.resolve();

    // Create a group to hold the ship model
    this.model = new THREE.Group();
    this.model.scale.set(3.2, 3.2, 3.2); // Larger scale for more prominence
    this.scene.add(this.model);

    // Position ship closer to camera
    this.position.set(0, -30, -100); // Moved forward (z) and down (y) for closer perspective

    // Cyberpunk color palette
    const primaryColor = new THREE.MeshPhongMaterial({
      color: 0x101020, // Dark blue-black
      shininess: 90,
      specular: 0x222244,
    });

    const secondaryColor = new THREE.MeshPhongMaterial({
      color: 0x7700ff, // Neon purple
      shininess: 100,
      specular: 0xffffff,
    });

    const accentColor = new THREE.MeshPhongMaterial({
      color: 0x00ffaa, // Neon teal
      shininess: 120,
      specular: 0xffffff,
    });

    const metallicColor = new THREE.MeshPhongMaterial({
      color: 0x333344, // Dark metallic
      shininess: 150,
      specular: 0x8888aa,
    });

    // Main body - stealth bomber style with more height
    const bodyGeometry = new THREE.BufferGeometry();
    // Define body shape vertices for a stealthy angular design with more height
    const bodyVertices = new Float32Array([
      // Top face (raised in the middle)
      -15,
      2,
      10, // front left
      15,
      2,
      10, // front right
      0,
      6,
      0, // top middle peak
      -30,
      2,
      -20, // back left
      30,
      2,
      -20, // back right

      // Bottom face
      -15,
      -2,
      10, // front left
      15,
      -2,
      10, // front right
      -30,
      -3,
      -20, // back left
      30,
      -3,
      -20, // back right
    ]);

    bodyGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(bodyVertices, 3)
    );
    bodyGeometry.setIndex([
      // Top faces - triangular design with central ridge
      0,
      1,
      2, // front left-right-peak
      0,
      2,
      3, // left-peak-back left
      1,
      4,
      2, // right-back right-peak
      2,
      4,
      3, // peak-back right-back left

      // Bottom face
      5,
      7,
      6, // front left-back left-front right
      6,
      7,
      8, // front right-back left-back right

      // Front face
      0,
      5,
      1, // top left-bottom left-top right
      1,
      5,
      6, // top right-bottom left-bottom right

      // Back face
      3,
      4,
      7, // top left-top right-bottom left
      4,
      8,
      7, // top right-bottom right-bottom left

      // Left side
      0,
      3,
      5, // top front-top back-bottom front
      3,
      7,
      5, // top back-bottom back-bottom front

      // Right side
      1,
      6,
      4, // top front-bottom front-top back
      4,
      6,
      8, // top back-bottom front-bottom back
    ]);

    bodyGeometry.computeVertexNormals();
    const shipBody = new THREE.Mesh(bodyGeometry, primaryColor);
    this.model.add(shipBody);

    // Add elevated central spine
    const centralSpine = new THREE.Mesh(
      new THREE.BoxGeometry(2, 4, 25),
      metallicColor
    );
    centralSpine.position.set(0, 4, -5);
    this.model.add(centralSpine);

    // Add angular cockpit - cyberpunk style
    const cockpitGeometry = new THREE.BufferGeometry();
    const cockpitVertices = new Float32Array([
      // Base points
      -8,
      2,
      5, // back left
      8,
      2,
      5, // back right
      0,
      2,
      15, // front center

      // Top point
      0,
      8,
      5, // peak - higher for more height
    ]);

    cockpitGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(cockpitVertices, 3)
    );
    cockpitGeometry.setIndex([
      0,
      1,
      3, // left-right-top
      1,
      2,
      3, // right-front-top
      2,
      0,
      3, // front-left-top
      0,
      2,
      1, // base
    ]);

    cockpitGeometry.computeVertexNormals();

    const cockpitMaterial = new THREE.MeshPhongMaterial({
      color: 0x00ddff, // Bright cyan
      transparent: true,
      opacity: 0.7,
      shininess: 120,
      specular: 0x88ffff,
    });

    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    this.model.add(cockpit);

    // Add wing details with height
    const wingAccent = (x: number, width: number) => {
      const accent = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.5, 5),
        accentColor
      );
      accent.position.set(x, 2.25, -5);
      return accent;
    };

    // Add neon edge highlights
    this.model.add(wingAccent(-20, 8)); // left wing
    this.model.add(wingAccent(20, 8)); // right wing

    // Add larger vertical stabilizers for more height
    const stabilizer = (x: number) => {
      const fin = new THREE.Mesh(
        new THREE.BoxGeometry(2, 8, 10), // Taller fins
        secondaryColor
      );
      fin.position.set(x, 6, -15); // Positioned higher
      return fin;
    };

    this.model.add(stabilizer(-20)); // left stabilizer
    this.model.add(stabilizer(20)); // right stabilizer

    // Add wing elevations - makes wings not completely flat
    const wingElevation = (x: number, y: number, z: number) => {
      const elevation = new THREE.Mesh(
        new THREE.BoxGeometry(10, 1, 6),
        metallicColor
      );
      elevation.position.set(x, y, z);
      return elevation;
    };

    this.model.add(wingElevation(-15, 3, -10)); // left wing elevation
    this.model.add(wingElevation(15, 3, -10)); // right wing elevation

    // Add engine exhausts - positioned at wing edges
    const engineGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00aaff, // Bright blue neon
      transparent: true,
      opacity: 0.9,
    });

    // Create engine meshes at wing edges
    const engines = [];

    // Wing edge engines - positioned to flow toward the camera
    const leftWingEngine = new THREE.Mesh(
      new THREE.BoxGeometry(3, 1, 2),
      engineGlowMaterial.clone()
    );
    leftWingEngine.position.set(-30, 2, -10); // At wing edge
    leftWingEngine.rotation.y = Math.PI / 4; // Angle toward camera
    this.model.add(leftWingEngine);
    engines.push(leftWingEngine);

    const rightWingEngine = new THREE.Mesh(
      new THREE.BoxGeometry(3, 1, 2),
      engineGlowMaterial.clone()
    );
    rightWingEngine.position.set(30, 2, -10); // At wing edge
    rightWingEngine.rotation.y = -Math.PI / 4; // Angle toward camera
    this.model.add(rightWingEngine);
    engines.push(rightWingEngine);

    // Additional engines at wing tips for more visual effects
    const leftTipEngine = new THREE.Mesh(
      new THREE.BoxGeometry(2, 1, 2),
      engineGlowMaterial.clone()
    );
    leftTipEngine.position.set(-28, 2, -18);
    leftTipEngine.rotation.y = Math.PI / 6;
    this.model.add(leftTipEngine);
    engines.push(leftTipEngine);

    const rightTipEngine = new THREE.Mesh(
      new THREE.BoxGeometry(2, 1, 2),
      engineGlowMaterial.clone()
    );
    rightTipEngine.position.set(28, 2, -18);
    rightTipEngine.rotation.y = -Math.PI / 6;
    this.model.add(rightTipEngine);
    engines.push(rightTipEngine);

    // Store engine references for glow effects
    this.engineGlowMeshes = engines;

    // Create engine trails flowing toward camera
    this.engineTrails = [];

    engines.forEach((engine, index) => {
      // Get the engine's world direction
      const direction = new THREE.Vector3(0, 0, 1); // Toward camera
      if (index % 2 === 0) {
        // Left engines
        direction.x = 0.3; // Slightly outward
      } else {
        direction.x = -0.3; // Slightly outward
      }

      // Create trail mesh with gradient opacity
      const segments = 15; // More segments for longer trails
      const trailLength = 60; // Longer trails toward camera
      const trailGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(segments * 3);
      const colors = new Float32Array(segments * 3);

      // Set initial positions - trailing toward camera (positive Z)
      for (let i = 0; i < segments; i++) {
        const z = i * (trailLength / segments); // Positive Z goes toward camera
        const offset = i * 0.3; // Increasing spread
        positions[i * 3] = direction.x * offset; // x
        positions[i * 3 + 1] = 0; // y
        positions[i * 3 + 2] = z; // z

        // Gradient color - intense blue neon
        colors[i * 3] = 0.0; // r (no red for bright blue)
        colors[i * 3 + 1] = 0.7; // g (some green for cyan tint)
        colors[i * 3 + 2] = 1.0; // b (full blue)
      }

      trailGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
      );
      trailGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      const trailMaterial = new THREE.PointsMaterial({
        size: 2.0, // Larger points
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
      });

      const trail = new THREE.Points(trailGeometry, trailMaterial);
      trail.position.copy(engine.position);
      trail.visible = false; // Initially invisible, shown only when moving
      this.model?.add(trail);

      this.engineTrails.push({
        mesh: trail,
        positions: positions,
        parentEngine: engine,
      });
    });

    // Add weapon mount points
    const weaponMount = new THREE.Mesh(
      new THREE.BoxGeometry(30, 1, 3),
      metallicColor
    );
    weaponMount.position.set(0, -1, 5);
    this.model.add(weaponMount);

    // Add cyberpunk design details
    for (let i = -1; i <= 1; i += 2) {
      // Side lights
      const sideLights = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 3),
        new THREE.MeshBasicMaterial({ color: i < 0 ? 0xff0000 : 0x00ff00 }) // Red and green nav lights
      );
      sideLights.position.set(i * 30, 2, -5);
      this.model.add(sideLights);
    }

    // Add pulsing tech details
    for (let i = 0; i < 5; i++) {
      const techDetail = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.5, 0.8),
        new THREE.MeshBasicMaterial({
          color: 0x00ffff,
          transparent: true,
          opacity: 0.8,
        })
      );
      techDetail.position.set(
        Math.random() * 40 - 20,
        2,
        Math.random() * 20 - 15
      );
      this.model.add(techDetail);
    }

    // Position the model
    this.model.position.copy(this.position);
    this.model.rotation.copy(this.rotation);

    // Create a hitbox based on the model
    const hitboxGeometry = new THREE.BoxGeometry(60, 15, 40);
    const hitboxMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      wireframe: true,
      visible: false, // Hide the hitbox in normal gameplay
    });

    this.hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
    this.hitbox.position.copy(this.position);
    this.scene.add(this.hitbox);

    // After loading the ship model, create the boundary visualization
    this.createBoundaryVisualization();

    this.loaded = true;
    return Promise.resolve();
  }

  /**
   * Creates a visible wireframe box showing the ship's navigable boundaries.
   * This is for debugging purposes only.
   */
  private createBoundaryVisualization(): void {
    // Only create the boundary visualization in dev mode
    if (!this.devMode) return;

    // Create a wireframe box geometry that covers the entire boundary
    const boxWidth = this.horizontalLimit * 2; // Total width (left to right)
    const boxHeight = this.verticalLimit * 2; // Total height (top to bottom)
    const boxDepth = Math.max(300, Math.min(boxWidth, boxHeight) * 0.2); // Depth scales with larger boundaries

    const boxGeometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

    // Create wireframe material - bright green to be visible
    const material = new THREE.LineBasicMaterial({
      color: 0x00ff00, // Bright green
      linewidth: 2, // Thicker lines
      opacity: 0.6, // Partially transparent
      transparent: true,
    });

    // Convert box geometry to line segments (wireframe)
    const wireframe = new THREE.WireframeGeometry(boxGeometry);
    this.boundaryBox = new THREE.LineSegments(wireframe, material);

    // Position the box to match the ship's movement area
    // The ship moves at Z = -300, so center the box there
    this.boundaryBox.position.set(0, 0, -300);

    // Add to scene
    this.scene.add(this.boundaryBox);

    this.logger.info(
      "Created 3D boundary visualization with limits: " +
        `${this.horizontalLimit}x${this.verticalLimit} (area: ${
          this.horizontalLimit * 2
        }x${this.verticalLimit * 2})`
    );
  }

  /**
   * Updates the boundary visualization to match current limits.
   * Call this if you change the horizontalLimit or verticalLimit.
   */
  public updateBoundaryVisualization(): void {
    // Skip if not in dev mode
    if (!this.devMode) return;

    // Remove existing boundary
    this.removeBoundaryVisualization();

    // Create a new one with updated dimensions
    this.createBoundaryVisualization();

    this.logger.info(
      `Updated boundary visualization: horizontal=${this.horizontalLimit}, vertical=${this.verticalLimit}`
    );
  }

  /**
   * Sets new boundary limits and updates the visualization.
   * @param horizontal New horizontal limit
   * @param vertical New vertical limit
   */
  public setBoundaryLimits(horizontal: number, vertical: number): void {
    this.horizontalLimit = horizontal;
    this.verticalLimit = vertical;

    // Update the visual representation
    this.updateBoundaryVisualization();

    this.logger.info(
      `Set new boundary limits: horizontal=${horizontal}, vertical=${vertical}`
    );
  }

  /**
   * Removes the boundary visualization from the scene.
   */
  private removeBoundaryVisualization(): void {
    if (this.boundaryBox) {
      this.scene.remove(this.boundaryBox);
      // Clean up geometry and material
      if (this.boundaryBox.geometry) {
        this.boundaryBox.geometry.dispose();
      }
      if (this.boundaryBox.material) {
        (this.boundaryBox.material as THREE.Material).dispose();
      }
      this.boundaryBox = null;
    }
  }

  /**
   * Starts the ship's entry animation sequence.
   * @param onComplete Optional callback to execute when animation completes
   */
  enterScene(onComplete?: () => void): void {
    if (this.playingEntryAnimation) {
      this.logger.warn("Ship is already playing entry animation");
      return;
    }

    this.logger.info("🚀 SHIP: Beginning entry animation");

    // Store the callback to execute when animation completes
    this.onEntryCompleteCallback = onComplete ?? null;

    // Set animation start time
    this.entryStartTime = performance.now();

    // Set entry animation to playing
    this.playingEntryAnimation = true;

    // Start from the defined entry start position
    this.position.copy(this.ENTRY_START_POSITION);

    // Player doesn't have control during the entry animation
    this.playerControlled = false;

    this.logger.info("🚀 SHIP: Entry animation set up complete");
  }

  /**
   * Updates the ship position, rotation, and applies physics.
   * @param deltaTime Time elapsed since the last frame in seconds
   */
  update(deltaTime: number): void {
    if (this.playingEntryAnimation) {
      // Update entry animation if playing
      this.updateEntryAnimation(deltaTime);
      return;
    }

    // Update weapons
    if (this.weaponSystem) {
      this.weaponSystem.update(deltaTime);
    }

    // Only handle input if player controlled
    if (this.playerControlled) {
      this.handleInput(deltaTime);

      // Add some drag/friction to make controls feel better
      this.velocity.x *= 0.95;
      this.velocity.y *= 0.95;

      // Animate engine glow
      this.updateEngineGlow(deltaTime);
    }

    // Update position based on velocity
    this.position.add(this.velocity);

    // Constrain ship within screen bounds
    this.constrainToBounds();

    // Update the 3D model position and rotation
    this.updateModelPosition();
    this.updateModelRotation();

    // Update hitbox position
    if (this.hitbox) {
      this.hitbox.position.copy(this.position);
    }

    // Debug ship position occasionally
    if (this.playerControlled && Math.random() < 0.01) {
      this.logger.debug(
        `SHIP POSITION: x=${this.position.x.toFixed(
          2
        )}, y=${this.position.y.toFixed(2)}, z=${this.position.z.toFixed(2)}`
      );
    }
  }

  /**
   * Updates the entry animation based on elapsed time.
   * Creates a retro arcade style entry with "steps" of movement.
   * @param deltaTime Time elapsed since the last frame in seconds
   */
  private updateEntryAnimation(deltaTime: number): void {
    const elapsed = (performance.now() - this.entryStartTime) / 1000;
    const progress = Math.min(elapsed / this.ENTRY_DURATION, 1.0);

    // Log animation progress at 10% intervals
    if (
      Math.floor(progress * 10) >
      Math.floor(((elapsed - deltaTime) / this.ENTRY_DURATION) * 10)
    ) {
      this.logger.debug(
        `🚀 SHIP: Animation progress: ${Math.floor(
          progress * 100
        )}%, position:`,
        this.position
      );
    }

    // Create a retro-style "step" movement instead of smooth interpolation
    // Divide the animation into discrete steps
    // const numberOfSteps = 8;
    // const stepIndex = Math.floor(progress * numberOfSteps);
    // const steppedProgress = stepIndex / numberOfSteps;

    // Phase 1: Enter from right side with "digital" steps (0-60%)
    if (progress < 0.6) {
      // Normalize progress for this phase (0-1)
      const phaseProgress = progress / 0.6;

      // Calculate the current step for this phase
      const phaseSteps = 5;
      const phaseStepIndex = Math.floor(phaseProgress * phaseSteps);
      const phaseStepProgress = phaseStepIndex / phaseSteps;

      // Start from right side, move left in steps
      const startX = 700;
      const endX = 0;

      // Apply step function for X position
      const x = startX - (startX - endX) * phaseStepProgress;
      // Y position oscillates like old arcade games
      const y = Math.sin(phaseProgress * Math.PI * 2) * 30;
      const z = this.ENTRY_END_POSITION.z;

      this.position.set(x, y, z);

      // Simple rotation that emphasizes the "steps"
      const tiltAmount = 0.3;
      // Tilt based on direction of movement
      this.rotation.z =
        -tiltAmount + ((y > 0 ? 0.1 : -0.1) * 2 * Math.abs(y)) / 30;
    }
    // Phase 2: Digital stop at center with slight bounce (60-100%)
    else {
      // Normalize progress for this phase
      const phaseProgress = (progress - 0.6) / 0.4;

      // Calculate current step for this phase
      const phaseSteps = 3;
      const phaseStepIndex = Math.floor(phaseProgress * phaseSteps);

      // Simple "bounce" effect at position steps
      const bouncePositions = [
        new THREE.Vector3(30, 20, this.ENTRY_END_POSITION.z),
        new THREE.Vector3(-20, -10, this.ENTRY_END_POSITION.z),
        new THREE.Vector3(0, 0, this.ENTRY_END_POSITION.z),
      ];

      // Set position to the current bounce step
      const targetPosition =
        bouncePositions[Math.min(phaseStepIndex, bouncePositions.length - 1)];
      this.position.copy(targetPosition);

      // Simple rotation effect with "digital" steps
      const rotationSteps = [-0.15, 0.1, 0];
      this.rotation.z =
        rotationSteps[Math.min(phaseStepIndex, rotationSteps.length - 1)];
    }

    // Force update model position
    this.updateModelPosition();
    this.updateModelRotation();

    // Add digital "teleport" effect for engines during entry
    if (this.engineGlowMeshes && this.engineGlowMeshes.length > 0) {
      const engineState = Math.floor(elapsed * 10) % 2; // Blink at 5Hz

      this.engineGlowMeshes.forEach((engine) => {
        if (engine && engine.material) {
          // Digital on/off for engines
          if (engineState === 0) {
            (engine.material as THREE.MeshBasicMaterial).opacity = 0.9;
            const scale = 1.2;
            engine.scale.set(scale, scale, scale * 1.5);
          } else {
            (engine.material as THREE.MeshBasicMaterial).opacity = 0.3;
            const scale = 0.8;
            engine.scale.set(scale, scale, scale);
          }
        }
      });
    }

    // Check if animation is complete
    if (progress >= 1.0) {
      this.logger.info(
        "🚀 SHIP: Entry animation complete, position:",
        this.position
      );
      this.playingEntryAnimation = false;
      this.position.copy(this.ENTRY_END_POSITION);
      this.rotation.set(0, 0, 0);

      // Update model position one last time
      this.updateModelPosition();
      this.updateModelRotation();

      // Reset engine effects
      if (this.engineGlowMeshes) {
        this.engineGlowMeshes.forEach((engine) => {
          if (engine) {
            engine.scale.set(1, 1, 1);
          }
        });
      }

      // Enable player control
      this.setPlayerControlled(true);
      this.logger.info("🚀 SHIP: Player control enabled");

      // Call completion callback if set
      if (this.onEntryCompleteCallback) {
        this.logger.info("🚀 SHIP: Executing entry complete callback");
        this.onEntryCompleteCallback();
        this.onEntryCompleteCallback = null;
      } else {
        this.logger.info("🚀 SHIP: No completion callback was provided");
      }
    }
  }

  /**
   * Animates the engine glow effect.
   * @param deltaTime Time elapsed since the last frame in seconds
   */
  private updateEngineGlow(_deltaTime: number): void {
    if (
      !this.engineGlowMeshes ||
      this.engineGlowMeshes.length === 0 ||
      !this.input
    )
      return;

    // Detect if ship is accelerating forward (moving toward camera)
    const isAccelerating = this.input.isKeyPressed("w");
    const pulseRate = 0.3; // Lower for slower pulsing

    // Get a more arcade-like pulsing effect with discrete pulse values
    const pulse = 0.8 + Math.sin(Date.now() * pulseRate) * 0.2;

    // Update engine glow brightness
    this.engineGlowMeshes.forEach((engine) => {
      // Make engines brighter when accelerating
      const brightness = isAccelerating ? 1.0 : 0.6;

      // Random flickering for retro effect
      const flicker = 0.8 + Math.random() * 0.4;

      // Update engine color - bright cyan-blue
      const material = engine.material as THREE.MeshBasicMaterial;
      material.color.setRGB(
        0,
        0.6 * pulse * brightness * flicker,
        1.0 * pulse * brightness * flicker
      );

      // Update engine visibility
      engine.visible = true;
    });

    // Animate engine trails
    this.engineTrails.forEach((trail) => {
      // Ensure trail mesh exists
      if (!trail.mesh || !trail.positions) return;

      // Ensure trail is visible when accelerating, fading in/out based on ship movement
      trail.mesh.visible = true;

      // Get the material to update opacity
      const material = trail.mesh.material as THREE.PointsMaterial;
      material.opacity = isAccelerating ? 0.9 : 0.3;

      // Access geometry and update trail positions for wave effect
      const geometry = trail.mesh.geometry;

      if (geometry && geometry.attributes.position) {
        const positions = geometry.attributes.position.array;
        const segments = positions.length / 3;

        // Create undulating effect on the trails
        const time = Date.now() * 0.001; // Slow time factor

        for (let i = 0; i < segments; i++) {
          const segmentPosition = i / segments;
          const waveAmplitude = segmentPosition * 0.5; // Larger amplitude toward the end

          // Lateral wave movement
          const xOffset = Math.sin(time * 2 + i * 0.5) * waveAmplitude;

          // Update X position with wave
          if (i > 0) {
            // Leave the base position fixed
            positions[i * 3] = trail.positions[i * 3] + xOffset;
          }
        }

        // Flag geometry for update
        geometry.attributes.position.needsUpdate = true;
      }
    });
  }

  /**
   * Handles player input for ship movement.
   * @param deltaTime Time elapsed since the last frame in seconds
   */
  private handleInput(deltaTime: number): void {
    // Skip input handling if not player controlled or during entry animation
    if (!this.playerControlled || this.playingEntryAnimation) {
      return;
    }

    const moveSpeed = 1.5; // Reduced by 15% from 8.0 for smoother handling

    // Digital-style input response (full speed or nothing)
    let moveX = 0;
    let moveY = 0;

    // Simple 8-way directional movement like classic arcade games
    if (this.input.isKeyPressed("w") || this.input.isKeyPressed("arrowup")) {
      moveY = 1;
      // Quick tilt up when moving up
      this.rotation.x = -0.2;
    } else if (
      this.input.isKeyPressed("s") ||
      this.input.isKeyPressed("arrowdown")
    ) {
      moveY = -1;
      // Quick tilt down when moving down
      this.rotation.x = 0.2;
    } else {
      // Reset X rotation when not moving vertically
      this.rotation.x = 0;
    }

    if (this.input.isKeyPressed("a") || this.input.isKeyPressed("arrowleft")) {
      moveX = -1;
      // Quick bank when moving left
      this.rotation.z = 0.4;
      // Add a slight yaw for more arcade feel
      this.rotation.y = -0.1;
    } else if (
      this.input.isKeyPressed("d") ||
      this.input.isKeyPressed("arrowright")
    ) {
      moveX = 1;
      // Quick bank when moving right
      this.rotation.z = -0.4;
      // Add a slight yaw for more arcade feel
      this.rotation.y = 0.1;
    } else {
      // Reset Z and Y rotation when not moving horizontally
      this.rotation.z = 0;
      this.rotation.y = 0;
    }

    // Normalize diagonal movement (maintains consistent speed in all directions)
    if (moveX !== 0 && moveY !== 0) {
      const normalizer = 1 / Math.sqrt(2);
      moveX *= normalizer;
      moveY *= normalizer;
    }

    // Apply movement with arcade-style instant acceleration
    this.velocity.x = moveX * moveSpeed;
    this.velocity.y = moveY * moveSpeed;

    // Make ship bob slightly when hovering in place
    if (moveX === 0 && moveY === 0) {
      // Small idle animation
      const idleTime = performance.now() / 1000;
      const idleBob = Math.sin(idleTime * 2) * 0.3;
      this.position.y += idleBob * deltaTime;
      this.rotation.z = Math.sin(idleTime * 1.5) * 0.05;
    }

    // Shooting (placeholder)
    if (this.input.isKeyPressed(" ")) {
      // Shoot functionality will be added later
      // For now, just add a slight "recoil" effect
      this.position.z += 1;
      setTimeout(() => {
        this.position.z -= 1;
      }, 50);
    }

    // Handle weapon firing
    if (this.weaponSystem) {
      // Get aim direction (make it match the direction the ship is facing)
      this.aimDirection
        .copy(new THREE.Vector3(0, 0, -1))
        .applyQuaternion(this.model!.quaternion);

      // Fire primary weapon on left mouse button
      if (this.input.isMouseButtonPressed(0)) {
        this.firePrimaryWeapon();
      }

      // Fire secondary weapon on right mouse button
      if (this.input.isMouseButtonPressed(2)) {
        this.fireSecondaryWeapon();
      }
    }
  }

  /**
   * Fires the primary weapon
   */
  firePrimaryWeapon(): void {
    if (!this.weaponSystem || !this.model) return;

    // Get the position to fire from (slightly in front of the ship)
    const firePosition = this.position
      .clone()
      .add(this.aimDirection.clone().multiplyScalar(10));

    // Fire the weapon
    this.weaponSystem.firePrimary(firePosition, this.aimDirection);
  }

  /**
   * Fires the secondary weapon
   */
  fireSecondaryWeapon(): void {
    if (!this.weaponSystem || !this.model) return;

    // Get the position to fire from (slightly in front of the ship)
    const firePosition = this.position
      .clone()
      .add(this.aimDirection.clone().multiplyScalar(10));

    // Fire the weapon
    this.weaponSystem.fireSecondary(firePosition, this.aimDirection);
  }

  /**
   * Updates the model's position to match the ship's internal position.
   */
  private updateModelPosition(): void {
    if (this.model) {
      this.model.position.copy(this.position);
    }
    if (this.hitbox) {
      this.hitbox.position.copy(this.position);
    }
  }

  /**
   * Updates the model's rotation to match the ship's internal rotation.
   */
  private updateModelRotation(): void {
    if (this.model) {
      this.model.rotation.copy(this.rotation);
    }
    if (this.hitbox) {
      this.hitbox.rotation.copy(this.rotation);
    }
  }

  /**
   * Constrains the ship's position to remain within the visible screen area.
   */
  private constrainToBounds(): void {
    if (this.position.x < -this.horizontalLimit) {
      this.position.x = -this.horizontalLimit;
      this.velocity.x = 0;
    }
    if (this.position.x > this.horizontalLimit) {
      this.position.x = this.horizontalLimit;
      this.velocity.x = 0;
    }
    if (this.position.y < -this.verticalLimit) {
      this.position.y = -this.verticalLimit;
      this.velocity.y = 0;
    }
    if (this.position.y > this.verticalLimit) {
      this.position.y = this.verticalLimit;
      this.velocity.y = 0;
    }
  }

  /**
   * Sets whether the ship is under player control.
   * @param controlled Whether the ship is controlled by the player
   * @param skipCallback Optional flag to skip executing the onEntryCompleteCallback
   */
  setPlayerControlled(
    controlled: boolean,
    skipCallback: boolean = false
  ): void {
    this.playerControlled = controlled;

    if (controlled) {
      this.logger.info("🚀 SHIP: Player control enabled");

      // Only execute the callback if not explicitly skipped
      // This prevents recursion when called from Scene.setGameActive
      if (this.onEntryCompleteCallback && !skipCallback) {
        this.logger.info("🚀 SHIP: Executing entry complete callback");
        this.onEntryCompleteCallback();
        this.onEntryCompleteCallback = null;
      } else {
        this.logger.info("🚀 SHIP: No completion callback was executed");
      }
    }
  }

  /**
   * Gets the ship's current position.
   * @returns The ship's position as a Vector3
   */
  getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  /**
   * Gets the ship's hitbox for collision detection.
   * @returns The ship's hitbox mesh
   */
  getHitbox(): THREE.Mesh | null {
    return this.hitbox;
  }

  /**
   * Clean up resources used by the ship.
   */
  dispose(): void {
    // Remove from scene
    if (this.model) {
      this.scene.remove(this.model);
    }

    if (this.hitbox) {
      this.scene.remove(this.hitbox);
    }

    // Remove boundary visualization
    this.removeBoundaryVisualization();

    // Dispose of any THREE.js resources
    if (this.hitbox) {
      if (this.hitbox.geometry) {
        this.hitbox.geometry.dispose();
      }
      if (this.hitbox.material) {
        (this.hitbox.material as THREE.Material).dispose();
      }
    }

    this.model = null;
    this.hitbox = null;
    this.engineGlowMeshes = [];
    this.loaded = false;

    // Dispose of weapon system
    if (this.weaponSystem) {
      this.weaponSystem.dispose();
      this.weaponSystem = null;
    }

    this.logger.info("Ship disposed");
  }

  /**
   * Gets the current health value.
   * @returns Current health value
   */
  getHealth(): number {
    return this.health;
  }

  /**
   * Gets the maximum health value.
   * @returns Maximum health value
   */
  getMaxHealth(): number {
    return this.maxHealth;
  }

  /**
   * Sets the current health value, clamped between 0 and max health.
   * @param value New health value
   */
  setHealth(value: number): void {
    this.health = Math.max(0, Math.min(this.maxHealth, value));
  }

  /**
   * Gets the current shield value.
   * @returns Current shield value
   */
  getShield(): number {
    return this.shield;
  }

  /**
   * Gets the maximum shield value.
   * @returns Maximum shield value
   */
  getMaxShield(): number {
    return this.maxShield;
  }

  /**
   * Sets the current shield value, clamped between 0 and max shield.
   * @param value New shield value
   */
  setShield(value: number): void {
    this.shield = Math.max(0, Math.min(this.maxShield, value));
  }

  /**
   * Apply damage to the ship, reducing shields first, then health.
   * @param amount Amount of damage to apply
   * @returns True if the ship was destroyed, false otherwise
   */
  takeDamage(amount: number): boolean {
    // First damage goes to shields
    if (this.shield > 0) {
      if (amount <= this.shield) {
        this.shield -= amount;
        amount = 0;
      } else {
        amount -= this.shield;
        this.shield = 0;
      }
    }

    // Remaining damage goes to health
    if (amount > 0) {
      this.health -= amount;
      if (this.health <= 0) {
        this.health = 0;
        return true; // Ship destroyed
      }
    }

    return false; // Ship still alive
  }

  /**
   * Repair the ship's health and/or shields.
   * @param healthAmount Amount of health to restore
   * @param shieldAmount Amount of shield to restore
   */
  repair(healthAmount: number = 0, shieldAmount: number = 0): void {
    if (healthAmount > 0) {
      this.health = Math.min(this.maxHealth, this.health + healthAmount);
    }

    if (shieldAmount > 0) {
      this.shield = Math.min(this.maxShield, this.shield + shieldAmount);
    }
  }

  /**
   * Gets the horizontal boundary limit.
   * @returns The current horizontal limit
   */
  getHorizontalLimit(): number {
    return this.horizontalLimit;
  }

  /**
   * Gets the vertical boundary limit.
   * @returns The current vertical limit
   */
  getVerticalLimit(): number {
    return this.verticalLimit;
  }

  /**
   * Initializes the ship's systems
   */
  async initialize(): Promise<void> {
    // Initialize weapon system
    if (this.weaponSystem) {
      await this.weaponSystem.init();
    }
  }

  /**
   * Sets the UI system for the weapon system
   * @param uiSystem The UI system to connect to
   */
  setUISystem(uiSystem: UISystem): void {
    if (this.weaponSystem) {
      this.weaponSystem.setUISystem(uiSystem);
    }
  }

  /**
   * Sets a specific primary weapon
   * @param weaponId The ID of the weapon to set
   * @returns Whether the weapon was set successfully
   */
  setPrimaryWeapon(weaponId: string): boolean {
    if (!this.weaponSystem) return false;
    return this.weaponSystem.setPrimaryWeapon(weaponId);
  }

  /**
   * Sets a specific secondary weapon
   * @param weaponId The ID of the weapon to set
   * @returns Whether the weapon was set successfully
   */
  setSecondaryWeapon(weaponId: string): boolean {
    if (!this.weaponSystem) return false;
    return this.weaponSystem.setSecondaryWeapon(weaponId);
  }

  /**
   * Gets the weapon system
   */
  getWeaponSystem(): WeaponSystem | null {
    return this.weaponSystem;
  }
}
