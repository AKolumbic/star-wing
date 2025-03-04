import { GameSystem } from "./GameSystem";
import { GameLoop } from "./GameLoop";
import { PerformanceMonitor } from "./PerformanceMonitor";
import { SceneSystem } from "./systems/SceneSystem";
import { InputSystem } from "./systems/InputSystem";
import { AudioSystem } from "./systems/AudioSystem";
import { UISystem } from "./systems/UISystem";
import { UIUtils } from "../utils/UIUtils";
import { AudioManager } from "../audio/AudioManager";

/**
 * Main Game class that serves as the core controller for the Star Wing game.
 * Manages the game loop, coordinates subsystems, and handles initialization and cleanup.
 */
export class Game {
  /** Canvas element where the game is rendered */
  private canvas: HTMLCanvasElement;

  /** Collection of game systems managed by this game instance */
  private systems: GameSystem[] = [];

  /** Scene system for 3D rendering */
  private sceneSystem: SceneSystem;

  /** Input system for user interaction */
  private inputSystem: InputSystem;

  /** Audio system for sound and music */
  private audioSystem: AudioSystem;

  /** UI system for menus and interface elements */
  private uiSystem: UISystem;

  /** Game loop that manages the update/render cycle */
  private gameLoop: GameLoop;

  /** Performance monitor for tracking FPS and frame timing */
  private perfMonitor: PerformanceMonitor;

  /** Flag indicating if the game is running */
  private isRunning: boolean = false;

  /**
   * Creates a new Game instance and initializes all subsystems.
   * @param canvasId The HTML ID of the canvas element to render the game on
   * @throws Error if the canvas element cannot be found
   */
  constructor(canvasId: string) {
    // Get the canvas element by ID
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;

    if (!this.canvas) {
      throw new Error(`Canvas with id ${canvasId} not found`);
    }

    // Create all systems
    this.sceneSystem = new SceneSystem(this.canvas);
    this.inputSystem = new InputSystem();
    this.audioSystem = new AudioSystem();
    this.uiSystem = new UISystem(this);

    // Add systems to the collection
    this.systems.push(
      this.sceneSystem,
      this.inputSystem,
      this.audioSystem,
      this.uiSystem
    );

    // Create the game loop with all systems
    this.gameLoop = new GameLoop(this.systems);

    // Create performance monitor
    this.perfMonitor = new PerformanceMonitor();

    // Display the loading screen
    this.showLoadingScreen();
  }

  /**
   * Creates and displays the loading screen.
   * The loading screen will call init() and start() when the user chooses to begin.
   * @private
   */
  private showLoadingScreen(): void {
    // Initialize the audio manager silently
    this.audioSystem.init().catch(console.error);

    // Create and show the loading screen
    this.uiSystem.showLoadingScreen(() => {
      // This is called when the user clicks "execute program"
      this.init().then(() => {
        this.start();
      });
    });
  }

  /**
   * Initializes all game systems asynchronously.
   * This is called after the loading screen when the user chooses to start.
   * @returns A promise that resolves when initialization is complete
   */
  async init(): Promise<void> {
    console.log("Game initializing...");

    try {
      // Initialize all systems in parallel
      await Promise.all(this.systems.map((system) => system.init()));

      // Start background music
      this.audioSystem.playMenuThump();

      console.log("Game initialization complete");
    } catch (error: unknown) {
      console.error("Error during game initialization:", error);

      // Show user-friendly error message
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      UIUtils.showErrorMessage(
        "System Initialization Error",
        `Unable to launch STAR WING: ${errorMessage}. Please reload the page.`
      );

      // Re-throw to allow caller to handle
      throw error;
    }
  }

  /**
   * Starts the game loop.
   * This begins the update-render cycle and activates all game systems.
   */
  start(): void {
    console.log("Game starting...");

    if (this.isRunning) {
      console.warn("Game is already running");
      return;
    }

    this.isRunning = true;
    this.gameLoop.start();
  }

  /**
   * Stops the game loop.
   * This pauses all game systems but does not dispose of resources.
   */
  stop(): void {
    console.log("Game stopping...");

    if (!this.isRunning) {
      console.warn("Game is already stopped");
      return;
    }

    this.isRunning = false;
    this.gameLoop.stop();
  }

  /**
   * Completely disposes of all game resources.
   * Call this when the game is being unloaded or destroyed.
   */
  public dispose(): void {
    console.log("Game disposing...");
    this.stop();

    // Dispose all systems
    for (const system of this.systems) {
      try {
        system.dispose();
      } catch (error) {
        console.error(`Error disposing system:`, error);
      }
    }

    // Clear references
    this.systems = [];
  }

  /**
   * Gets the audio system instance.
   * @returns The game's AudioSystem instance
   */
  getAudioSystem(): AudioSystem {
    return this.audioSystem;
  }

  /**
   * Gets the audio manager instance directly.
   * @returns The game's AudioManager instance
   * @deprecated Use getAudioSystem().getAudioManager() instead
   */
  getAudioManager(): AudioManager {
    return this.audioSystem.getAudioManager();
  }

  /**
   * Gets the current performance metrics.
   * @returns Object containing FPS and frame time information
   */
  getPerfMetrics(): { fps: number; frameTime: number } {
    return this.gameLoop.getPerformanceMetrics();
  }
}
