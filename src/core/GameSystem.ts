/**
 * Interface that all game systems must implement.
 * This ensures consistent lifecycle methods across different systems.
 */
export interface GameSystem {
  /**
   * Initialize the system. This is called once during game startup.
   * @returns A promise that resolves when initialization is complete
   */
  init(): Promise<void>;

  /**
   * Update the system state based on elapsed time.
   * Called once per frame during the game loop.
   * @param deltaTime Time elapsed since the last frame in seconds
   */
  update(deltaTime: number): void;

  /**
   * Clean up all resources used by this system.
   * Called when the game is being unloaded or destroyed.
   */
  dispose(): void;
}
