import { GameSystem } from "./GameSystem";
import { GameLoop } from "./GameLoop";
import { SceneSystem } from "./systems/SceneSystem";
import { InputSystem } from "./systems/InputSystem";
import { AudioSystem } from "./systems/AudioSystem";
import { UISystem } from "./systems/UISystem";
import { UIUtils } from "../utils/UIUtils";
import { AudioManager } from "../audio/AudioManager";
import { Logger } from "../utils/Logger";

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

  /** Flag indicating if the game is running */
  private isRunning: boolean = false;

  /** Flag indicating if the game is running in dev mode */
  private devMode: boolean = false;

  /** Flag indicating if dev mode audio should be enabled */
  private enableDevAudio: boolean = false;

  /** Logger instance */
  private logger = Logger.getInstance();

  /**
   * Creates a new Game instance and initializes all subsystems.
   * @param canvasId The HTML ID of the canvas element to render the game on
   * @param devMode Whether to run in development mode (skips intro, mutes audio)
   * @param enableDevAudio Whether to enable audio in dev mode
   * @throws Error if the canvas element cannot be found
   */
  constructor(
    canvasId: string,
    devMode: boolean = false,
    enableDevAudio: boolean = false
  ) {
    // Store dev mode setting
    this.devMode = devMode;
    this.enableDevAudio = enableDevAudio;

    // Get the canvas element by ID
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;

    if (!this.canvas) {
      throw new Error(`Canvas with id ${canvasId} not found`);
    }

    // Create all systems
    this.inputSystem = new InputSystem();
    this.audioSystem = new AudioSystem();
    this.uiSystem = new UISystem(this);
    this.sceneSystem = new SceneSystem(this.canvas, this, this.devMode);

    // Add systems to the collection
    this.systems.push(
      this.sceneSystem,
      this.inputSystem,
      this.audioSystem,
      this.uiSystem
    );

    // Create the game loop with all systems
    this.gameLoop = new GameLoop(this.systems);

    if (this.devMode) {
      // In dev mode, skip loading screen and initialize directly
      this.logger.info("DEV MODE: Skipping intro loading screen and menu");

      // Initialize systems
      this.init()
        .then(() => {
          // Hide menu if it's visible
          if (this.uiSystem.isMenuVisible()) {
            this.uiSystem.hideMenu();
          }

          // Get required systems for ship initialization
          const scene = this.sceneSystem.getScene();
          const input = this.inputSystem.getInput();

          // Set input on scene
          scene.setInput(input);
          this.logger.info("DEV MODE: Input set on scene");

          // Initialize ship and start game directly
          scene
            .initPlayerShip()
            .then(() => {
              this.logger.info("DEV MODE: Ship initialized successfully");

              // Skip entry animation in dev mode - start game immediately
              scene.skipShipEntry();
              this.logger.info("DEV MODE: Ship entry animation skipped");

              // Start the game
              this.start();

              // Show the game HUD
              this.logger.info("DEV MODE: Showing game HUD");
              this.uiSystem.showGameHUD();

              // Enable hyperspace mode in dev environment for testing
              setTimeout(() => {
                this.logger.info(
                  "DEV MODE: Activating hyperspace mode for enhanced visuals"
                );
                scene.transitionHyperspace(true, 1.0);
              }, 1000); // Short delay to ensure everything is loaded
            })
            .catch((error) => {
              this.logger.error("DEV MODE: Failed to initialize ship:", error);
            });

          // Set audio to muted in dev mode
          // We do this after initialization to ensure the UI can properly reflect this state
          if (
            !this.enableDevAudio &&
            !this.audioSystem.getAudioManager().getMuteState()
          ) {
            // Force-mute audio but preserve the state in localStorage
            this.setDevModeMuted(true);
            this.logger.info(
              "DEV MODE: Audio muted by default (can be enabled in settings)"
            );
          } else if (this.enableDevAudio) {
            // Ensure audio is unmuted if enableDevAudio is true
            if (this.audioSystem.getAudioManager().getMuteState()) {
              this.setDevModeMuted(false);
            }

            // Play the procedural audio explicitly
            this.audioSystem.playMenuThump(true);

            this.logger.info(
              "DEV MODE: Audio enabled via enableDevAudio parameter"
            );
          }
        })
        .catch((error) => this.logger.error("Initialization error:", error));
    } else {
      // In normal mode, show the loading screen
      this.showLoadingScreen();
    }
  }

  /**
   * Creates and displays the loading screen.
   * The loading screen will call init() and start() when the user chooses to begin.
   * @private
   */
  private showLoadingScreen(): void {
    // We need to initialize audio first to prepare it for user interaction
    this.audioSystem
      .init()
      .catch((error) => this.logger.error("Audio init error:", error));

    // Initialize UI system so it can create loading screen
    this.uiSystem
      .init()
      .catch((error) => this.logger.error("UI init error:", error));

    // Show the loading screen through the UI system
    // This will manage the entire startup process
    this.uiSystem.showLoadingScreen(() => {
      // This is called when the user clicks "execute program"
      this.init()
        .then(() => {
          this.start();
        })
        .catch((error) =>
          this.logger.error("Init error in loading screen callback:", error)
        );
    });
  }

  /**
   * Initializes all game systems.
   * @returns A promise that resolves when all systems are initialized
   */
  async init(): Promise<void> {
    this.logger.info("Game initializing...");

    try {
      // Initialize all systems in parallel
      await Promise.all(this.systems.map((system) => system.init()));

      // Music will now be started in the UI System's showMenu method

      this.logger.info("Game initialization complete");
    } catch (error: unknown) {
      this.logger.error("Error during game initialization:", error);

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
   */
  start(): void {
    this.logger.info("Game starting...");

    if (this.isRunning) {
      this.logger.warn("Game is already running");
      return;
    }

    this.isRunning = true;
    this.gameLoop.start();

    // Only show main menu in non-development mode
    // In dev mode, we want to bypass the menu and go straight to gameplay
    if (!this.devMode) {
      this.logger.info("Normal mode: Showing main menu");
      this.uiSystem.showMenu();
    } else {
      this.logger.info("Dev mode: Bypassing main menu");
    }
  }

  /**
   * Stops the game loop and marks the game as not running.
   */
  stop(): void {
    if (!this.isRunning) {
      this.logger.warn("Game is already stopped");
      return;
    }

    this.logger.info("Stopping game");
    this.gameLoop.stop();
    this.isRunning = false;

    // Hide the HUD when game stops
    this.uiSystem.hideGameHUD();
  }

  /**
   * Completely disposes of all game resources.
   * Call this when the game is being unloaded or destroyed.
   */
  public dispose(): void {
    this.logger.info("Game disposing...");
    this.stop();

    // Dispose all systems
    for (const system of this.systems) {
      try {
        system.dispose();
      } catch (error) {
        this.logger.error(`Error disposing system:`, error);
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
   * Gets the UI system instance.
   * @returns The game's UISystem instance
   */
  getUISystem(): UISystem {
    return this.uiSystem;
  }

  /**
   * Gets the scene system instance.
   * @returns The game's SceneSystem instance
   */
  getSceneSystem(): SceneSystem {
    return this.sceneSystem;
  }

  /**
   * Gets the input system instance.
   * @returns The game's InputSystem instance
   */
  getInputSystem(): InputSystem {
    return this.inputSystem;
  }

  /**
   * Shows the terminal border UI element.
   */
  showTerminalBorder(): void {
    this.logger.info("[Game] Showing terminal border");
    this.uiSystem.showTerminalBorder();
  }

  /**
   * Hides the terminal border UI element.
   */
  hideTerminalBorder(): void {
    this.logger.info("[Game] Hiding terminal border");
    this.uiSystem.hideTerminalBorder();
  }

  /**
   * Returns whether the game is running in dev mode.
   * @returns True if the game is in dev mode
   */
  isDevMode(): boolean {
    return this.devMode;
  }

  /**
   * Sets the audio mute state in dev mode without affecting localStorage
   * This allows for temporary muting in dev mode while preserving user preferences
   * @param muted Whether audio should be muted
   * @private
   */
  private setDevModeMuted(muted: boolean): void {
    const audioManager = this.audioSystem.getAudioManager();

    // Save current localStorage mute value
    const savedMuteState = localStorage.getItem("starWing_muted");

    // Toggle mute state if needed (this will update localStorage)
    if (audioManager.getMuteState() !== muted) {
      audioManager.toggleMute();
    }

    // Restore the original localStorage value to preserve user preference
    if (savedMuteState !== null) {
      localStorage.setItem("starWing_muted", savedMuteState);
    }
  }

  /**
   * Toggles the audio in devMode for testing purposes.
   * This is useful when you want to hear the procedural audio in devMode.
   * Access this via the browser console with: game.toggleDevModeAudio()
   */
  public toggleDevModeAudio(): void {
    if (!this.devMode) {
      this.logger.info("Toggle dev mode audio: Not in dev mode, ignoring");
      return;
    }

    const audioManager = this.audioSystem.getAudioManager();

    // Toggle the actual mute state
    audioManager.toggleMute();

    // Log the new state
    const isMuted = audioManager.getMuteState();
    this.logger.info(`DEV MODE: Audio is now ${isMuted ? "muted" : "unmuted"}`);

    // If we just unmuted, make sure music is playing
    if (!isMuted && !audioManager.isAudioPlaying()) {
      this.logger.info("DEV MODE: Restarting procedural audio");
      this.audioSystem.playMenuThump(true);
    }
  }

  /**
   * Attempts to ensure audio can play in the game.
   * Automatically tries to resume the audio context if needed.
   */
  public ensureAudioCanPlay(): void {
    const audioManager = this.getAudioManager();

    if (!audioManager) {
      this.logger.warn(
        "Cannot ensure audio playback - AudioManager not available"
      );
      return;
    }

    // Check if audio can play already
    if (audioManager.canPlayAudio()) {
      this.logger.info("Audio context is already running");
      return;
    }

    // Try to resume the audio context automatically
    const audioContext = audioManager.getAudioContext();
    if (audioContext && audioContext.state === "suspended") {
      this.logger.info("Attempting to resume audio context automatically");
      audioManager.tryResumeAudioContext().then((success) => {
        if (success) {
          this.logger.info("Audio context resumed successfully");
        } else {
          this.logger.warn("Could not resume audio context automatically");
        }
      });
    }
  }
}
