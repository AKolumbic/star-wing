/**
 * Re-export of the Game class from core with additional convenience methods for debug mode.
 */
import { Game as CoreGame } from "./core/Game";

// Store default canvas ID
const DEFAULT_CANVAS_ID = "game-canvas";

/**
 * Game interface options
 */
export interface GameOptions {
  canvasId?: string;
  devMode?: boolean;
  hideUI?: boolean;
}

/**
 * Game class wrapper to simplify creation and maintain backward compatibility
 */
export class Game {
  // Reference to the core game instance
  private coreGame: CoreGame;

  // Animation frame ID if using custom animation loop
  private animationFrameId?: number;

  /**
   * Creates a new Game instance with optional configuration
   * @param options Game configuration options
   */
  constructor(options: GameOptions = {}) {
    // Use default canvas ID if not provided
    const canvasId = options.canvasId || DEFAULT_CANVAS_ID;

    // Check if canvas exists, create it if it doesn't
    let canvas = document.getElementById(canvasId) as HTMLCanvasElement;

    if (!canvas) {
      console.log(`Canvas with ID '${canvasId}' not found, creating it`);
      canvas = document.createElement("canvas");
      canvas.id = canvasId;
      document.body.appendChild(canvas);
    }

    // Initialize the core game
    this.coreGame = new CoreGame(canvasId, options.devMode || false);

    // If hideUI option is true, hide the UI after initialization
    if (options.hideUI) {
      setTimeout(() => {
        if (this.coreGame && this.coreGame.getUISystem) {
          console.log("Hiding UI elements for debug mode");
          const uiSystem = this.coreGame.getUISystem();
          // Use specific hiding methods
          if (uiSystem.hideTerminalBorder) uiSystem.hideTerminalBorder();
          if (uiSystem.hideMenu) uiSystem.hideMenu();

          // Force hide any UI elements through DOM if needed
          document.querySelectorAll(".ui-element, .menu").forEach((el) => {
            if (el instanceof HTMLElement) el.style.display = "none";
          });
        }
      }, 500); // Small delay to ensure UI is initialized
    }
  }

  /**
   * Starts the game
   * @returns Promise that resolves when the game has started
   */
  async start(): Promise<void> {
    // If init has not been called yet (in dev mode), call it
    try {
      await this.coreGame.init();
      this.coreGame.start();
    } catch (error) {
      console.error("Failed to start game:", error);
    }

    return Promise.resolve();
  }

  /**
   * Disposes game resources and cleans up
   */
  dispose(): void {
    console.log("Disposing game resources");

    // Dispose the core game
    if (this.coreGame) {
      this.coreGame.dispose();
    }

    // Clear animation frame if it exists
    if (this.animationFrameId) {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }

    console.log("Game resources disposed");
  }

  /**
   * Gets the UI system instance.
   * @returns The game's UISystem instance or undefined
   */
  getUISystem() {
    return this.coreGame ? this.coreGame.getUISystem() : undefined;
  }
}
