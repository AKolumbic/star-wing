import * as THREE from "three";

/**
 * Interface for background implementations.
 * All background types must implement this interface for compatibility with the BackgroundManager.
 */
export interface Background {
  /**
   * Initialize the background.
   * Called when the background is first loaded or reset.
   * @returns Promise that resolves when initialization is complete
   */
  init(): Promise<void>;

  /**
   * Add this background to the scene.
   * @param scene The THREE.Scene to add this background to
   */
  addToScene(scene: THREE.Scene): void;

  /**
   * Remove this background from the scene.
   * @param scene The THREE.Scene to remove this background from
   */
  removeFromScene(scene: THREE.Scene): void;

  /**
   * Update the background for animation.
   * @param deltaTime Time in seconds since the last update
   */
  update(deltaTime: number): void;

  /**
   * Clean up any resources used by this background.
   */
  dispose(): void;

  /**
   * Set a parameter value for this background.
   * Implementations should define their own parameter keys.
   * @param key The parameter key
   * @param value The parameter value
   */
  setParameter(key: string, value: any): void;

  /**
   * Get a parameter value for this background.
   * @param key The parameter key
   * @returns The parameter value or undefined if not set
   */
  getParameter(key: string): any;
}
