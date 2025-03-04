import * as THREE from "three";
import { Background } from "./Background";
import { StarfieldBackground } from "./StarfieldBackground";
import { Logger } from "../../utils/Logger";

/**
 * Background type identifiers for the different background modes.
 */
export enum BackgroundType {
  NONE = "none",
  STARFIELD = "starfield",
  GAME = "game",
}

/**
 * Manager class for handling different background modes.
 * Allows for switching between background types and handles updating the active background.
 */
export class BackgroundManager {
  /** The Three.js scene to add backgrounds to */
  private scene: THREE.Scene;

  /** Registry of available background implementations */
  private backgroundRegistry: Map<BackgroundType, Background> = new Map();

  /** The currently active background type */
  private currentBackgroundType: BackgroundType = BackgroundType.NONE;

  /** The currently active background implementation */
  private currentBackground: Background | null = null;

  /** Transition parameters for smooth transitions between backgrounds */
  private transitionParams: {
    inProgress: boolean;
    duration: number;
    elapsed: number;
    from: Background | null;
    to: Background | null;
  } = {
    inProgress: false,
    duration: 0,
    elapsed: 0,
    from: null,
    to: null,
  };

  /** Hyperspace mode transition parameters */
  private hyperspaceTransition: {
    inProgress: boolean;
    duration: number;
    elapsed: number;
    targetState: boolean;
  } = {
    inProgress: false,
    duration: 0,
    elapsed: 0,
    targetState: false,
  };

  /** Logger instance */
  private logger = Logger.getInstance();

  /**
   * Create a new BackgroundManager.
   * @param scene The Three.js scene to add backgrounds to
   */
  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /**
   * Register a background implementation for a specific type.
   * @param type The background type
   * @param implementation The background implementation
   */
  registerBackground(type: BackgroundType, implementation: Background): void {
    this.backgroundRegistry.set(type, implementation);
  }

  /**
   * Set the active background type.
   * @param type The background type to set as active
   * @param initParams Optional initialization parameters for the background
   * @returns Promise that resolves when the background is initialized
   */
  async setBackground(
    type: BackgroundType,
    initParams?: Record<string, any>
  ): Promise<void> {
    if (this.backgroundRegistry.has(type)) {
      if (this.currentBackground) {
        await this.currentBackground.dispose();
      }

      this.currentBackground = this.backgroundRegistry.get(type);
      this.currentBackgroundType = type;
      return this.currentBackground.init();
    } else {
      this.logger.warn(`Background type '${type}' not registered`);
      return Promise.resolve();
    }
  }

  /**
   * Start a transition between background types.
   * @param toType The background type to transition to
   * @param duration The duration of the transition in seconds
   * @param params Optional parameters for the new background
   * @returns Promise that resolves when the transition is complete
   */
  async transitionTo(
    toType: BackgroundType,
    duration: number,
    params?: Record<string, any>
  ): Promise<void> {
    if (!this.backgroundRegistry.has(toType)) {
      this.logger.warn(
        `Cannot transition to unregistered background type: ${toType}`
      );
      return Promise.resolve();
    }

    // Set up the transition
    const toBackground = this.backgroundRegistry.get(toType);

    // Dispose of previous and set up the new one
    if (this.currentBackground) {
      await this.currentBackground.dispose();
    }

    this.currentBackground = toBackground;
    this.currentBackgroundType = toType;
    return this.currentBackground.init();
  }

  /**
   * Start a transition to hyperspace mode using the starfield background.
   * @param enable Whether to enable or disable hyperspace mode
   * @param duration The duration of the transition in seconds
   * @returns True if the transition was started successfully, false otherwise
   */
  transitionHyperspace(enable: boolean, duration: number = 1.0): boolean {
    // Only works with starfield background
    if (
      this.currentBackgroundType !== BackgroundType.STARFIELD ||
      !this.currentBackground
    ) {
      this.logger.warn(
        "Hyperspace mode only works with the starfield background"
      );
      return false;
    }

    // Cast to StarfieldBackground
    const starfield = this.currentBackground as StarfieldBackground;

    // Configure the transition parameters
    this.hyperspaceTransition = {
      inProgress: true,
      duration,
      elapsed: 0,
      targetState: enable,
    };

    // Tell the starfield to start transitioning
    starfield.setHyperspaceMode(enable);

    return true;
  }

  /**
   * Check if currently in hyperspace mode.
   * @returns True if in hyperspace mode, false otherwise
   */
  isHyperspaceActive(): boolean {
    if (
      this.currentBackgroundType !== BackgroundType.STARFIELD ||
      !this.currentBackground
    ) {
      return false;
    }

    return (this.currentBackground as StarfieldBackground).getHyperspaceMode();
  }

  /**
   * Update the current background with the elapsed time.
   * @param deltaTime Time in seconds since the last update
   */
  update(deltaTime: number): void {
    // If no background is active, do nothing
    if (!this.currentBackground) {
      return;
    }

    // Handle transitions if in progress
    if (this.transitionParams.inProgress) {
      this.updateTransition(deltaTime);
    }

    // Handle hyperspace transition if in progress
    if (this.hyperspaceTransition.inProgress) {
      this.updateHyperspaceTransition(deltaTime);
    }

    // Update the current background
    this.currentBackground.update(deltaTime);
  }

  /**
   * Update an active transition between backgrounds.
   * @param deltaTime Time in seconds since the last update
   * @private
   */
  private updateTransition(deltaTime: number): void {
    // Update elapsed time
    this.transitionParams.elapsed += deltaTime;

    // Calculate transition progress (0 to 1)
    const progress = Math.min(
      this.transitionParams.elapsed / this.transitionParams.duration,
      1
    );

    // If transition is complete
    if (progress >= 1) {
      // Remove the old background if it exists
      if (this.transitionParams.from) {
        this.transitionParams.from.removeFromScene(this.scene);
      }

      // Reset transition state
      this.transitionParams.inProgress = false;
      this.transitionParams.elapsed = 0;
      this.transitionParams.from = null;
      this.transitionParams.to = null;
    }

    // Transition logic could be extended here with opacity adjustments, etc.
    // For now, we simply keep both backgrounds in the scene until the transition completes
  }

  /**
   * Update an active hyperspace transition.
   * @param deltaTime Time in seconds since the last update
   * @private
   */
  private updateHyperspaceTransition(deltaTime: number): void {
    if (!(this.currentBackground instanceof StarfieldBackground)) {
      this.hyperspaceTransition.inProgress = false;
      return;
    }

    // Update elapsed time
    this.hyperspaceTransition.elapsed += deltaTime;

    // Calculate transition progress (0 to 1)
    const progress = Math.min(
      this.hyperspaceTransition.elapsed / this.hyperspaceTransition.duration,
      1
    );

    // If transition is complete
    if (progress >= 1) {
      this.hyperspaceTransition.inProgress = false;
      this.hyperspaceTransition.elapsed = 0;
    }

    // The actual transition is handled by the StarfieldBackground itself
  }

  /**
   * Clean up all background resources.
   */
  dispose(): void {
    // Dispose of all registered backgrounds
    this.backgroundRegistry.forEach((background) => {
      background.dispose();
    });

    // Clear the registry
    this.backgroundRegistry.clear();
    this.currentBackground = null;
  }

  /**
   * Get the current background implementation.
   * @returns The current background or null if none is active
   */
  getCurrentBackground(): Background | null {
    return this.currentBackground;
  }

  /**
   * Get the current background type.
   * @returns The current background type
   */
  getCurrentBackgroundType(): BackgroundType {
    return this.currentBackgroundType;
  }
}
