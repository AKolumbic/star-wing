import * as THREE from "three";
import { Input } from "../core/Input";
import { Logger } from "../utils/Logger";

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
  }

  /**
   * Loads the ship model asynchronously.
   * @returns Promise that resolves when the model is loaded
   */
  async load(): Promise<void> {
    if (this.loaded) return Promise.resolve();

    // Create a group to hold the ship model
    this.model = new THREE.Group();
    this.model.scale.set(2.5, 2.5, 2.5); // Scale up the entire ship by 2.5x
    this.scene.add(this.model);

    // Create retro color materials
    const primaryColor = new THREE.MeshPhongMaterial({
      color: 0xff3366, // Bright pink-red
      shininess: 70,
      specular: 0xffffff,
    });

    const secondaryColor = new THREE.MeshPhongMaterial({
      color: 0x33ffcc, // Bright teal
      shininess: 80,
      specular: 0xffffff,
    });

    const accentColor = new THREE.MeshPhongMaterial({
      color: 0xffdd00, // Bright yellow
      shininess: 90,
      specular: 0xffffff,
    });

    // Main body - classic triangular shape
    const shipBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0, 8, 25, 6, 1), // Hexagonal pyramid
      primaryColor
    );
    shipBody.rotation.x = Math.PI / 2; // Rotate to point forward
    this.model.add(shipBody);

    // Top fin
    const topFin = new THREE.Mesh(
      new THREE.BoxGeometry(2, 15, 5),
      secondaryColor
    );
    topFin.position.set(0, 12, -5);
    this.model.add(topFin);

    // Add side wings - more angular and geometric
    const wingGeometry = new THREE.BufferGeometry();
    // Define wing shape vertices for a triangular wing
    const wingVertices = new Float32Array([
      // Left wing
      -25,
      0,
      -5, // outer point
      -5,
      0,
      -10, // back inner
      -5,
      0,
      0, // front inner
    ]);
    wingGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(wingVertices, 3)
    );
    wingGeometry.setIndex([0, 1, 2]); // Create triangle face
    wingGeometry.computeVertexNormals();

    const leftWing = new THREE.Mesh(wingGeometry, secondaryColor);
    this.model.add(leftWing);

    // Right wing (mirror of left wing)
    const rightWingGeometry = new THREE.BufferGeometry();
    const rightWingVertices = new Float32Array([
      25,
      0,
      -5, // outer point
      5,
      0,
      -10, // back inner
      5,
      0,
      0, // front inner
    ]);
    rightWingGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(rightWingVertices, 3)
    );
    rightWingGeometry.setIndex([0, 2, 1]); // Note reversed order for correct facing
    rightWingGeometry.computeVertexNormals();

    const rightWing = new THREE.Mesh(rightWingGeometry, secondaryColor);
    this.model.add(rightWing);

    // Add wing decorations
    const leftWingAccent = new THREE.Mesh(
      new THREE.BoxGeometry(5, 1, 5),
      accentColor
    );
    leftWingAccent.position.set(-15, 0, -5);
    this.model.add(leftWingAccent);

    const rightWingAccent = new THREE.Mesh(
      new THREE.BoxGeometry(5, 1, 5),
      accentColor
    );
    rightWingAccent.position.set(15, 0, -5);
    this.model.add(rightWingAccent);

    // Add cockpit - more angular with bright color
    const cockpit = new THREE.Mesh(
      new THREE.IcosahedronGeometry(4, 0), // Low-poly geometric shape
      new THREE.MeshPhongMaterial({
        color: 0x66ffff, // Bright cyan
        transparent: true,
        opacity: 0.8,
        shininess: 100,
        specular: 0xffffff,
      })
    );
    cockpit.position.set(0, 2, 0);
    this.model.add(cockpit);

    // Engine glow effects - more visible and vibrant
    const engineGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0xff9900, // Orange glow
      transparent: true,
      opacity: 0.9,
    });

    // Center large thruster
    const mainEngine = new THREE.Mesh(
      new THREE.BoxGeometry(6, 3, 3), // Square exhaust
      engineGlowMaterial.clone()
    );
    mainEngine.position.set(0, 0, -15);
    this.model.add(mainEngine);

    // Additional smaller thrusters
    const leftEngine = new THREE.Mesh(
      new THREE.BoxGeometry(3, 2, 2),
      engineGlowMaterial.clone()
    );
    leftEngine.position.set(-5, 0, -12);
    this.model.add(leftEngine);

    const rightEngine = new THREE.Mesh(
      new THREE.BoxGeometry(3, 2, 2),
      engineGlowMaterial.clone()
    );
    rightEngine.position.set(5, 0, -12);
    this.model.add(rightEngine);

    // Add pixel-like details
    for (let i = -1; i <= 1; i += 2) {
      // Side lights
      const sideLights = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 2),
        new THREE.MeshBasicMaterial({ color: i < 0 ? 0xff0000 : 0x00ff00 }) // Red and green navigation lights
      );
      sideLights.position.set(i * 10, 0, -2);
      this.model.add(sideLights);

      // Wing tip lights
      const wingTipLight = new THREE.Mesh(
        new THREE.BoxGeometry(2, 2, 2),
        new THREE.MeshBasicMaterial({ color: 0xffff00 })
      );
      wingTipLight.position.set(i * 22, 0, -5);
      this.model.add(wingTipLight);
    }

    // Position the model
    this.model.position.copy(this.position);
    this.model.rotation.copy(this.rotation);

    // Create a hitbox based on the model
    const hitboxGeometry = new THREE.BoxGeometry(45, 15, 35);
    const hitboxMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      wireframe: true,
      visible: false, // Hide the hitbox in normal gameplay
    });

    this.hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
    this.hitbox.position.copy(this.position);
    this.scene.add(this.hitbox);

    // Store engine meshes for animation
    this.engineGlowMeshes = [mainEngine, leftEngine, rightEngine];

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
    } else if (this.playerControlled) {
      // Handle player input
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
    if (!this.engineGlowMeshes || this.engineGlowMeshes.length === 0) return;

    // Create retro-style "pulsing" effect - more digital looking
    // Use step function instead of sine for a more digital feel
    const time = performance.now() / 150;
    const pulseSteps = 4; // Number of pulse steps
    const pulseIndex = Math.floor(time % pulseSteps);
    const pulseValues = [0.6, 0.8, 1.0, 0.8]; // Discrete pulse values
    const pulse = pulseValues[pulseIndex];

    // Make the engines brighter when accelerating
    let intensity = 0.8;
    if (this.input.isKeyPressed("w") || this.input.isKeyPressed("arrowup")) {
      intensity = 1.5;
    }

    // Randomly flicker occasionally for retro effect
    const shouldFlicker = Math.random() < 0.05;
    const flickerIntensity = shouldFlicker ? 0.5 + Math.random() * 0.5 : 1.0;

    // Update each engine glow
    this.engineGlowMeshes.forEach((engine, index) => {
      if (engine && engine.material) {
        // Apply different colors to each engine for a more arcade-like look
        const engineColors = [
          new THREE.Color(0xff6600), // Orange for main
          new THREE.Color(0xffcc00), // Yellow for left
          new THREE.Color(0xffcc00), // Yellow for right
        ];

        // Adjust opacity for pulsing effect
        const finalIntensity = intensity * pulse * flickerIntensity;
        (engine.material as THREE.MeshBasicMaterial).opacity =
          0.7 + 0.3 * finalIntensity;

        // Set color
        const color = engineColors[index].clone();
        // Brighten based on intensity
        color.r = Math.min(1, color.r * finalIntensity);
        color.g = Math.min(1, color.g * finalIntensity);
        color.b = Math.min(1, color.b * finalIntensity);
        (engine.material as THREE.MeshBasicMaterial).color = color;

        // Update size - stretching engines when accelerating for a "thrust" effect
        let scaleZ = 1.0;
        if (
          this.input.isKeyPressed("w") ||
          this.input.isKeyPressed("arrowup")
        ) {
          scaleZ = 1.5 + Math.random() * 0.5; // Random variation for flame effect
        }
        engine.scale.set(1.0, 1.0, scaleZ);
      }
    });
  }

  /**
   * Handles player input for ship movement.
   * @param deltaTime Time elapsed since the last frame in seconds
   */
  private handleInput(deltaTime: number): void {
    // Arcade-style movement with instant response and digital feeling
    const moveSpeed = 8.0; // Faster movement for arcade feel
    // const maxSpeed = 8.0; // Higher max speed

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
}
