import * as THREE from "three";
import { Background } from "./Background";

/**
 * Background type identifiers for the different background modes.
 */
export enum BackgroundType {
  NONE = "none",
  STARFIELD = "starfield",
  HYPERSPACE = "hyperspace",
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
    // If this type is already active, do nothing
    if (type === this.currentBackgroundType && this.currentBackground) {
      return;
    }

    // Get the background implementation
    const background = this.backgroundRegistry.get(type);
    if (!background) {
      console.warn(`Background type '${type}' not registered`);
      return;
    }

    // Remove the current background from the scene
    if (this.currentBackground) {
      this.currentBackground.removeFromScene(this.scene);
    }

    // Set the new background as current
    this.currentBackgroundType = type;
    this.currentBackground = background;

    // Apply initialization parameters if provided
    if (initParams) {
      Object.entries(initParams).forEach(([key, value]) => {
        background.setParameter(key, value);
      });
    }

    // Initialize the background
    await background.init();

    // Add the background to the scene
    background.addToScene(this.scene);
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
    // Get the target background implementation
    const toBackground = this.backgroundRegistry.get(toType);
    if (!toBackground) {
      console.warn(
        `Cannot transition: Background type '${toType}' not registered`
      );
      return;
    }

    // Initialize target background but don't add to scene yet
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        toBackground.setParameter(key, value);
      });
    }
    await toBackground.init();

    // Set up transition
    this.transitionParams = {
      inProgress: true,
      duration,
      elapsed: 0,
      from: this.currentBackground,
      to: toBackground,
    };

    // Add new background to scene but it will be controlled by the transition
    toBackground.addToScene(this.scene);

    // Once transition is done, this will be the current background
    this.currentBackgroundType = toType;
    this.currentBackground = toBackground;
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
