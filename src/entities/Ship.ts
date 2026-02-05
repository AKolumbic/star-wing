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

  /** Reusable Vector3 for fire position calculations to avoid allocations */
  private firePositionTemp: THREE.Vector3 = new THREE.Vector3();

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
   * Loads the ship model asynchronously - a detailed sci-fi starfighter.
   * @returns Promise that resolves when the model is loaded
   */
  async load(): Promise<void> {
    if (this.loaded) return Promise.resolve();

    // Create a group to hold the ship model
    this.model = new THREE.Group();
    this.model.scale.set(2.8, 2.8, 2.8);
    this.scene.add(this.model);

    // Position ship
    this.position.set(0, -30, -100);

    // === MATERIALS ===
    const hullPrimary = new THREE.MeshPhongMaterial({
      color: 0x2a2a3a,
      shininess: 80,
      specular: 0x444466,
    });

    const hullSecondary = new THREE.MeshPhongMaterial({
      color: 0x1a1a2a,
      shininess: 60,
      specular: 0x333344,
    });

    const accentOrange = new THREE.MeshPhongMaterial({
      color: 0xff6600,
      shininess: 100,
      specular: 0xffaa44,
      emissive: 0x331100,
    });

    const accentBlue = new THREE.MeshPhongMaterial({
      color: 0x0088ff,
      shininess: 120,
      specular: 0x44aaff,
      emissive: 0x001133,
    });

    const metallic = new THREE.MeshPhongMaterial({
      color: 0x666688,
      shininess: 150,
      specular: 0xaaaacc,
    });

    const cockpitGlass = new THREE.MeshPhongMaterial({
      color: 0x44ddff,
      transparent: true,
      opacity: 0.6,
      shininess: 200,
      specular: 0xffffff,
      emissive: 0x112233,
    });

    const engineGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ccff,
      transparent: true,
      opacity: 0.95,
    });

    // === MAIN FUSELAGE ===
    // Central fuselage - sleek elongated body
    const fuselageGeometry = new THREE.BufferGeometry();
    const fv = new Float32Array([
      // Nose tip
      0, 0, 25,
      // Front section
      -5, 3, 15, 5, 3, 15, -7, 0, 15, 7, 0, 15, -5, -2, 15, 5, -2, 15,
      // Mid section (wider)
      -10, 5, -5, 10, 5, -5, -14, 0, -5, 14, 0, -5, -10, -3, -5, 10, -3, -5,
      // Rear section
      -8, 6, -22, 8, 6, -22, -12, 0, -22, 12, 0, -22, -8, -2, -22, 8, -2, -22,
    ]);

    fuselageGeometry.setAttribute("position", new THREE.BufferAttribute(fv, 3));
    fuselageGeometry.setIndex([
      // Nose cone
      0, 1, 2, 0, 3, 1, 0, 2, 4, 0, 5, 3, 0, 4, 6, 0, 6, 5,
      // Front to mid - top
      1, 7, 8, 1, 8, 2,
      // Front to mid - sides
      1, 3, 9, 1, 9, 7,
      2, 8, 10, 2, 10, 4,
      // Front to mid - bottom
      5, 11, 12, 5, 12, 6,
      3, 5, 11, 3, 11, 9,
      4, 12, 10, 4, 6, 12,
      // Mid to rear - top
      7, 13, 14, 7, 14, 8,
      // Mid to rear - sides
      7, 9, 15, 7, 15, 13,
      8, 14, 16, 8, 16, 10,
      // Mid to rear - bottom
      11, 17, 18, 11, 18, 12,
      9, 11, 17, 9, 17, 15,
      10, 18, 16, 10, 12, 18,
      // Rear cap
      13, 15, 14, 14, 15, 16, 15, 17, 16, 16, 17, 18,
    ]);
    fuselageGeometry.computeVertexNormals();
    const fuselage = new THREE.Mesh(fuselageGeometry, hullPrimary);
    this.model.add(fuselage);

    // === COCKPIT ===
    const cockpitGeometry = new THREE.BufferGeometry();
    const cv = new Float32Array([
      0, 1, 22, // nose
      -6, 5, 5, 6, 5, 5, // back corners
      0, 10, 2, // peak
      -4, 4, 14, 4, 4, 14, // mid sides
    ]);
    cockpitGeometry.setAttribute("position", new THREE.BufferAttribute(cv, 3));
    cockpitGeometry.setIndex([
      0, 4, 5, // front
      4, 1, 3, // left
      5, 3, 2, // right
      4, 3, 5, // top rear
      0, 5, 2, 0, 2, 1, 0, 1, 4, // sides
      1, 2, 3, // back
    ]);
    cockpitGeometry.computeVertexNormals();
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitGlass);
    this.model.add(cockpit);

    // Cockpit frame
    const cockpitFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.8, 15),
      metallic
    );
    cockpitFrame.position.set(0, 7, 8);
    cockpitFrame.rotation.x = 0.25;
    this.model.add(cockpitFrame);

    // === WINGS ===
    const createWing = (side: number) => {
      const wingGroup = new THREE.Group();

      // Main wing - swept back design
      const wingGeometry = new THREE.BufferGeometry();
      const wv = new Float32Array([
        side * 12, 0, 8, // inner front
        side * 12, 0, -18, // inner back
        side * 12, -1.5, 8, // inner front bottom
        side * 12, -1.5, -18, // inner back bottom
        side * 42, 3, -8, // outer front
        side * 42, 3, -24, // outer back
        side * 40, 1.5, -6, // outer front bottom
        side * 44, 1, -26, // outer tip
      ]);
      wingGeometry.setAttribute("position", new THREE.BufferAttribute(wv, 3));
      wingGeometry.setIndex([
        0, 4, 1, 1, 4, 5, // top surface
        2, 1, 3, 1, 5, 3, 3, 5, 7, // bottom
        0, 2, 4, 2, 6, 4, // front edge
        1, 7, 5, 1, 3, 7, // back edge
        4, 6, 5, 5, 6, 7, // wingtip
      ]);
      wingGeometry.computeVertexNormals();
      const wing = new THREE.Mesh(wingGeometry, hullSecondary);
      wingGroup.add(wing);

      // Wing leading edge stripe
      const leadingEdge = new THREE.Mesh(
        new THREE.BoxGeometry(22, 1.2, 2.5),
        accentOrange
      );
      leadingEdge.position.set(side * 27, 1.5, 0);
      leadingEdge.rotation.z = side * -0.12;
      leadingEdge.rotation.y = side * 0.15;
      wingGroup.add(leadingEdge);

      // Wing strut/spar
      const strut = new THREE.Mesh(
        new THREE.BoxGeometry(18, 2.5, 4),
        metallic
      );
      strut.position.set(side * 24, 0, -6);
      wingGroup.add(strut);

      // Wingtip light
      const wingtip = new THREE.Mesh(
        new THREE.BoxGeometry(5, 1.5, 10),
        accentBlue
      );
      wingtip.position.set(side * 42, 2.5, -16);
      wingtip.rotation.z = side * 0.15;
      wingGroup.add(wingtip);

      return wingGroup;
    };

    this.model.add(createWing(1));
    this.model.add(createWing(-1));

    // === ENGINE NACELLES ===
    const createNacelle = (side: number) => {
      const nacelleGroup = new THREE.Group();

      // Main nacelle body
      const nacelleBody = new THREE.Mesh(
        new THREE.CylinderGeometry(4, 5, 22, 8),
        hullPrimary
      );
      nacelleBody.rotation.x = Math.PI / 2;
      nacelleBody.position.set(side * 20, 0, -14);
      nacelleGroup.add(nacelleBody);

      // Nacelle intake ring
      const intake = new THREE.Mesh(
        new THREE.TorusGeometry(4.5, 0.8, 8, 12),
        metallic
      );
      intake.position.set(side * 20, 0, -2);
      nacelleGroup.add(intake);

      // Engine exhaust housing
      const exhaustHousing = new THREE.Mesh(
        new THREE.CylinderGeometry(5, 4.5, 3, 8),
        metallic
      );
      exhaustHousing.rotation.x = Math.PI / 2;
      exhaustHousing.position.set(side * 20, 0, -26);
      nacelleGroup.add(exhaustHousing);

      // Engine glow core
      const exhaustGlow = new THREE.Mesh(
        new THREE.CylinderGeometry(3.5, 3, 4, 8),
        engineGlowMaterial.clone()
      );
      exhaustGlow.rotation.x = Math.PI / 2;
      exhaustGlow.position.set(side * 20, 0, -28);
      nacelleGroup.add(exhaustGlow);

      // Nacelle pylon connecting to fuselage
      const pylon = new THREE.Mesh(
        new THREE.BoxGeometry(3, 5, 8),
        hullSecondary
      );
      pylon.position.set(side * 14, 2, -12);
      nacelleGroup.add(pylon);

      // Nacelle detail lines
      for (let i = 0; i < 3; i++) {
        const angle = (i * Math.PI * 2) / 3;
        const line = new THREE.Mesh(
          new THREE.BoxGeometry(0.4, 0.4, 18),
          accentBlue
        );
        line.position.set(
          side * 20 + Math.cos(angle) * 4.5,
          Math.sin(angle) * 4.5,
          -12
        );
        nacelleGroup.add(line);
      }

      return nacelleGroup;
    };

    this.model.add(createNacelle(1));
    this.model.add(createNacelle(-1));

    // === TAIL SECTION ===
    // Main vertical stabilizer
    const tailFin = new THREE.Mesh(
      new THREE.BoxGeometry(2, 14, 12),
      hullSecondary
    );
    tailFin.position.set(0, 10, -20);
    this.model.add(tailFin);

    // Tail fin accent stripe
    const tailAccent = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 12, 3),
      accentOrange
    );
    tailAccent.position.set(0, 10, -15);
    this.model.add(tailAccent);

    // Horizontal stabilizers
    const createHStab = (side: number) => {
      const stab = new THREE.Mesh(
        new THREE.BoxGeometry(14, 1.5, 8),
        hullSecondary
      );
      stab.position.set(side * 10, 4, -24);
      stab.rotation.z = side * 0.08;
      return stab;
    };
    this.model.add(createHStab(1));
    this.model.add(createHStab(-1));

    // === WEAPON HARDPOINTS ===
    const createWeaponPod = (x: number, z: number) => {
      const pod = new THREE.Group();

      const mount = new THREE.Mesh(
        new THREE.CylinderGeometry(1.2, 1.5, 5, 6),
        metallic
      );
      mount.rotation.x = Math.PI / 2;
      pod.add(mount);

      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 10, 6),
        hullSecondary
      );
      barrel.rotation.x = Math.PI / 2;
      barrel.position.z = 6;
      pod.add(barrel);

      const muzzle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.5, 2, 6),
        accentOrange
      );
      muzzle.rotation.x = Math.PI / 2;
      muzzle.position.z = 11;
      pod.add(muzzle);

      pod.position.set(x, -3, z);
      return pod;
    };

    this.model.add(createWeaponPod(-10, 10));
    this.model.add(createWeaponPod(10, 10));

    // === NAVIGATION LIGHTS ===
    const navLightRed = new THREE.Mesh(
      new THREE.SphereGeometry(1, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    navLightRed.position.set(-42, 3, -16);
    this.model.add(navLightRed);

    const navLightGreen = new THREE.Mesh(
      new THREE.SphereGeometry(1, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    );
    navLightGreen.position.set(42, 3, -16);
    this.model.add(navLightGreen);

    // Strobe on tail
    const strobeLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    strobeLight.position.set(0, 17, -20);
    this.model.add(strobeLight);

    // === HULL PANEL DETAILS ===
    const addPanelLine = (x: number, y: number, z: number, w: number, h: number) => {
      const line = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, 0.3),
        new THREE.MeshBasicMaterial({ color: 0x111118 })
      );
      line.position.set(x, y, z);
      this.model!.add(line);
    };

    // Fuselage panel lines
    addPanelLine(-6, 4, 8, 0.3, 6);
    addPanelLine(6, 4, 8, 0.3, 6);
    addPanelLine(0, 5, 0, 12, 0.3);
    addPanelLine(0, 3, -10, 16, 0.3);

    // === ENGINE GLOW AND TRAILS ===
    const engines: THREE.Mesh[] = [];

    // Main engine glows (positioned at nacelle exhausts)
    const leftEngine = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 2.5, 3, 8),
      engineGlowMaterial.clone()
    );
    leftEngine.rotation.x = Math.PI / 2;
    leftEngine.position.set(-20, 0, -29);
    this.model.add(leftEngine);
    engines.push(leftEngine);

    const rightEngine = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 2.5, 3, 8),
      engineGlowMaterial.clone()
    );
    rightEngine.rotation.x = Math.PI / 2;
    rightEngine.position.set(20, 0, -29);
    this.model.add(rightEngine);
    engines.push(rightEngine);

    this.engineGlowMeshes = engines;

    // Create engine trails
    this.engineTrails = [];

    engines.forEach((engine, index) => {
      const direction = new THREE.Vector3(0, 0, 1);
      direction.x = index === 0 ? 0.08 : -0.08;

      const segments = 22;
      const trailLength = 90;
      const trailGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(segments * 3);
      const colors = new Float32Array(segments * 3);

      for (let i = 0; i < segments; i++) {
        const z = i * (trailLength / segments);
        const spread = i * 0.15;
        positions[i * 3] = direction.x * spread;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = z;

        const fade = 1 - i / segments;
        colors[i * 3] = 0.3 * fade;
        colors[i * 3 + 1] = 0.8 * fade;
        colors[i * 3 + 2] = 1.0 * fade;
      }

      trailGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      trailGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      const trailMaterial = new THREE.PointsMaterial({
        size: 3.0,
        vertexColors: true,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
      });

      const trail = new THREE.Points(trailGeometry, trailMaterial);
      trail.position.copy(engine.position);
      trail.visible = false;
      this.model?.add(trail);

      this.engineTrails.push({
        mesh: trail,
        positions: positions,
        parentEngine: engine,
      });
    });

    // Position the model
    this.model.position.copy(this.position);
    this.model.rotation.copy(this.rotation);

    // Create hitbox
    const hitboxGeometry = new THREE.BoxGeometry(90, 22, 55);
    const hitboxMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      wireframe: true,
      visible: false,
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

    const moveSpeed = 5;

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

    // Handle weapon firing
    if (this.weaponSystem) {
      // Get aim direction (make it match the direction the ship is facing)
      // Reuse the same Vector3 to avoid allocation
      this.aimDirection.set(0, 0, -1).applyQuaternion(this.model!.quaternion);

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
    // Reuse temp vector to avoid allocations every frame
    this.firePositionTemp
      .copy(this.aimDirection)
      .multiplyScalar(10)
      .add(this.position);

    // Fire the weapon
    this.weaponSystem.firePrimary(this.firePositionTemp, this.aimDirection);
  }

  /**
   * Fires the secondary weapon
   */
  fireSecondaryWeapon(): void {
    if (!this.weaponSystem || !this.model) return;

    // Get the position to fire from (slightly in front of the ship)
    // Reuse temp vector to avoid allocations every frame
    this.firePositionTemp
      .copy(this.aimDirection)
      .multiplyScalar(10)
      .add(this.position);

    // Fire the weapon
    this.weaponSystem.fireSecondary(this.firePositionTemp, this.aimDirection);
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
    // Only update if the state is actually changing
    if (this.playerControlled !== controlled) {
      this.playerControlled = controlled;

      if (controlled) {
        this.logger.info("🚀 SHIP: Player control enabled");

        // Only execute the callback if not explicitly skipped and we have one
        if (this.onEntryCompleteCallback && !skipCallback) {
          this.logger.info("🚀 SHIP: Executing entry complete callback");
          const callback = this.onEntryCompleteCallback;
          this.onEntryCompleteCallback = null; // Clear before executing to prevent recursion
          callback();
        } else {
          this.logger.info("🚀 SHIP: No completion callback was executed");
        }
      }
    }
  }

  /**
   * Gets the ship's current position.
   */
  getPosition(): THREE.Vector3 {
    return this.position;
  }

  /**
   * Resets the ship's position and velocity to initial state.
   * Used when restarting the game.
   */
  resetPosition(): void {
    // Reset position to entry start position
    this.position.copy(this.ENTRY_START_POSITION);

    // Reset velocity
    this.velocity.set(0, 0, 0);

    // Reset rotation
    this.rotation.set(0, 0, 0);

    // Reset animation state
    this.playingEntryAnimation = false;
    this.entryStartTime = 0;
    this.onEntryCompleteCallback = null;

    // Ensure player control is disabled during reset
    this.playerControlled = false;

    // Update model and hitbox
    this.updateModelPosition();
    this.updateModelRotation();

    // Reset engine effects
    if (this.engineGlowMeshes) {
      this.engineGlowMeshes.forEach((engine) => {
        if (engine) {
          engine.scale.set(1, 1, 1);
          if (engine.material) {
            (engine.material as THREE.MeshBasicMaterial).opacity = 0.9;
          }
        }
      });
    }

    this.logger.info(
      "Ship position, velocity, and animation state reset for game restart"
    );
  }

  /**
   * Gets the ship's current velocity.
   */
  getVelocity(): THREE.Vector3 {
    return this.velocity.clone();
  }

  /**
   * Stops all ship movement by zeroing out the velocity.
   * Used when the ship is destroyed but should remain visible.
   */
  stopMovement(): void {
    this.velocity.set(0, 0, 0);
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
