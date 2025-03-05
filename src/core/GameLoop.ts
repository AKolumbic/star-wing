import { GameSystem } from "./GameSystem";
import { PerformanceMonitor } from "./PerformanceMonitor";
import { Logger } from "../utils/Logger";

/**
 * Manages the game's main update and render loop.
 * Handles frame timing, system updates, and performance monitoring.
 */
export class GameLoop {
  /** Collection of game systems to update each frame */
  private systems: GameSystem[];

  /** Time elapsed since the last frame in seconds */
  private deltaTime: number = 0;

  /** Timestamp of the previous frame for delta time calculation */
  private lastFrameTime: number = 0;

  /** Flag indicating if the game loop is active */
  private isRunning: boolean = false;

  /** ID returned by requestAnimationFrame for cancellation */
  private animationFrameId: number = 0;

  /** Performance monitor for tracking FPS and frame timing */
  private performanceMonitor: PerformanceMonitor;

  /** Pre-render callback function, called before updating systems */
  private preUpdateCallback?: (deltaTime: number) => void;

  /** Post-render callback function, called after all systems are updated */
  private postUpdateCallback?: (deltaTime: number) => void;

  /** Logger instance */
  private logger = Logger.getInstance();

  /**
   * Creates a new GameLoop instance.
   * @param systems Array of game systems to update each frame
   */
  constructor(systems: GameSystem[]) {
    this.systems = systems;
    this.performanceMonitor = new PerformanceMonitor();

    // Bind the loop method to this instance
    this.loop = this.loop.bind(this);
  }

  /**
   * Sets a callback to be called at the start of each frame.
   * @param callback Function to call before updating systems
   */
  setPreUpdateCallback(callback: (deltaTime: number) => void): void {
    this.preUpdateCallback = callback;
  }

  /**
   * Sets a callback to be called at the end of each frame.
   * @param callback Function to call after updating systems
   */
  setPostUpdateCallback(callback: (deltaTime: number) => void): void {
    this.postUpdateCallback = callback;
  }

  /**
   * Starts the game loop.
   * Begins the update-render cycle and activates all game systems.
   */
  start(): void {
    if (this.isRunning) {
      this.logger.warn("Game loop is already running");
      return;
    }

    this.logger.info("Game loop starting...");
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.performanceMonitor.reset();

    // Start the loop
    this.loop();
  }

  /**
   * The main game loop function.
   * @private
   */
  private loop(): void {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    this.deltaTime = (currentTime - this.lastFrameTime) / 1000; // Convert to seconds

    // Limit delta time to prevent large jumps after tab focus, etc.
    const maxDeltaTime = 0.1; // 100ms maximum
    if (this.deltaTime > maxDeltaTime) {
      this.deltaTime = maxDeltaTime;
    }

    this.lastFrameTime = currentTime;

    // Update performance monitor
    this.performanceMonitor.update(currentTime, this.deltaTime);

    // Call pre-update callback if set
    if (this.preUpdateCallback) {
      this.preUpdateCallback(this.deltaTime);
    }

    // Update all systems
    for (const system of this.systems) {
      system.update(this.deltaTime);
    }

    // Call post-update callback if set
    if (this.postUpdateCallback) {
      this.postUpdateCallback(this.deltaTime);
    }

    // Request next frame
    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  /**
   * Stops the game loop.
   * This pauses all game systems but does not dispose of resources.
   */
  stop(): void {
    if (!this.isRunning) {
      this.logger.warn("Game loop is already stopped");
      return;
    }

    this.logger.info("Game loop stopping...");
    this.isRunning = false;

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = 0;
    }
  }

  /**
   * Adds a system to the game loop.
   * @param system The game system to add
   */
  addSystem(system: GameSystem): void {
    this.systems.push(system);
  }

  /**
   * Removes a system from the game loop.
   * Note: This does not dispose the system.
   * @param system The game system to remove
   */
  removeSystem(system: GameSystem): void {
    const index = this.systems.indexOf(system);
    if (index !== -1) {
      this.systems.splice(index, 1);
    }
  }

  /**
   * Gets the current performance metrics.
   * @returns Object containing FPS and frame time information
   */
  getPerformanceMetrics(): { fps: number; frameTime: number } {
    return this.performanceMonitor.getMetrics();
  }

  /**
   * Checks if the game loop is currently running.
   * @returns True if the game loop is active
   */
  isActive(): boolean {
    return this.isRunning;
  }
}
