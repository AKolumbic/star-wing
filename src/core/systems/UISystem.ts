import { GameSystem } from "../GameSystem";
import { Game } from "../Game";
import { Menu } from "../../ui/Menu";
import { LoadingScreen } from "../../ui/LoadingScreen";
import { TerminalBorder } from "../../ui/TerminalBorder";
import { TextCrawl } from "../../ui/TextCrawl";
import { GameHUD } from "../../ui/GameHUD";
import { GameOverScreen } from "../../ui/GameOverScreen";
import { ZoneComplete } from "../../ui/ZoneComplete";
import { Logger } from "../../utils/Logger";

/**
 * System that manages all UI components including menus, overlays, and HUD.
 * Implements the GameSystem interface for consistent lifecycle management.
 */
export class UISystem implements GameSystem {
  /** Main menu controller */
  private menu: Menu;

  /** Loading screen shown at startup */
  private loadingScreen?: LoadingScreen;

  /** Terminal-style border UI element */
  private terminalBorder: TerminalBorder;

  /** Text crawl intro component */
  private textCrawl: TextCrawl;

  /** In-game HUD component */
  private gameHUD: GameHUD;

  /** Game over screen component */
  private gameOverScreen: GameOverScreen;

  /** Zone complete screen component */
  private zoneCompleteScreen: ZoneComplete;

  /** Reference to the main game for accessing game state */
  private game: Game;

  /** Logger instance */
  private logger = Logger.getInstance();

  /** Whether the game is currently active (used to determine menu context) */
  private gameActive: boolean = false;

  /** Escape key handler for in-game menu toggle */
  private escapeKeyHandler: ((e: KeyboardEvent) => void) | null = null;

  /**
   * Creates a new UISystem.
   * @param game Reference to the main game instance
   */
  constructor(game: Game) {
    this.game = game;
    this.menu = new Menu(this.game);
    this.terminalBorder = TerminalBorder.getInstance();
    this.textCrawl = new TextCrawl(this.game);
    this.gameHUD = new GameHUD(this.game);
    this.gameOverScreen = new GameOverScreen(this.game);
    this.zoneCompleteScreen = new ZoneComplete(this.game);

    // The loading screen is created later when needed

    // Set up Escape key handler for in-game menu
    this.setupEscapeKeyHandler();
  }

  /**
   * Initializes the UI system.
   * @returns A promise that resolves when initialization is complete
   */
  async init(): Promise<void> {
    this.terminalBorder.initialize();
    return Promise.resolve();
  }

  /**
   * Updates the UI components for the current frame.
   * @param deltaTime Time elapsed since the last frame in seconds
   */
  update(deltaTime: number): void {
    // Update the HUD with latest game data
    if (this.gameHUD) {
      this.gameHUD.update(deltaTime);
    }
  }

  /**
   * Cleans up UI resources.
   */
  dispose(): void {
    this.logger.info("UISystem: Disposing UI components");

    // Hide all UI components
    this.hideMenu();
    this.hideTextCrawl();
    this.hideTerminalBorder();
    this.hideGameHUD();
    this.hideGameOver();
    this.hideZoneComplete();

    // Remove escape key handler
    this.removeEscapeKeyHandler();

    // Dispose of components that need cleanup
    if (this.loadingScreen) {
      this.loadingScreen.dispose();
      this.loadingScreen = undefined;
    }

    this.menu.dispose();
    this.textCrawl.dispose();
    this.gameHUD.dispose();
    this.gameOverScreen.dispose();
    this.zoneCompleteScreen.dispose();
  }

  /**
   * Sets up the Escape key handler for toggling the in-game menu
   */
  private setupEscapeKeyHandler(): void {
    this.escapeKeyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && this.gameActive) {
        // Toggle menu visibility
        if (this.isMenuVisible()) {
          this.resumeGame();
        } else {
          this.showInGameMenu();
        }

        // Prevent default action (browser escape)
        e.preventDefault();
      }
    };

    // Add the event listener
    document.addEventListener("keydown", this.escapeKeyHandler);
  }

  /**
   * Removes the escape key handler
   */
  private removeEscapeKeyHandler(): void {
    if (this.escapeKeyHandler) {
      document.removeEventListener("keydown", this.escapeKeyHandler);
      this.escapeKeyHandler = null;
    }
  }

  /**
   * Shows the loading screen and sets up the callback for when the user is ready to start.
   * @param onReadyCallback Function to call when the user clicks start
   */
  showLoadingScreen(onReadyCallback: () => void): void {
    this.loadingScreen = new LoadingScreen(onReadyCallback);
  }

  /**
   * Shows the main menu (not during gameplay).
   */
  showMenu(): void {
    this.gameActive = false;

    // Clean up the player ship when returning to main menu
    if (this.game) {
      const scene = this.game.getSceneSystem().getScene();
      scene.cleanupPlayerShip();
    }

    this.menu.showMainMenu();

    // Hide the HUD when menu is shown
    this.gameHUD.hide();

    // Start menu music when the menu is shown
    const audioSystem = this.game.getAudioSystem();
    if (audioSystem) {
      // Pass devMode flag to use procedural audio if in dev mode
      audioSystem.playMenuThump(this.game.isDevMode());
    }
  }

  /**
   * Shows the in-game menu (pause menu during gameplay).
   */
  showInGameMenu(): void {
    // Don't change the gameActive flag here - we just need to pause temporarily

    // Show the in-game menu through the Menu class
    this.menu.showInGameMenu();

    // Hide the HUD when menu is shown
    this.gameHUD.hide();

    // Log the action
    this.logger.info("In-game menu displayed (paused)");
  }

  /**
   * Resumes the game by hiding the menu and showing the HUD
   */
  resumeGame(): void {
    // Set flag to indicate game is active
    this.gameActive = true;

    // Hide the menu
    this.menu.hide();

    // Show the game HUD
    this.showGameHUD();

    // Log the resume action
    this.logger.info("Game resumed from pause menu");
  }

  /**
   * Hides the currently active menu.
   */
  hideMenu(): void {
    this.menu.hide();
    // We now handle this explicitly from the Menu class when needed
  }

  /**
   * Shows the text crawl intro sequence.
   * @param onComplete Function to call when the text crawl completes
   */
  showTextCrawl(onComplete: () => void): void {
    this.textCrawl.show(onComplete);
  }

  /**
   * Hides the text crawl.
   */
  hideTextCrawl(): void {
    this.textCrawl.hide();
  }

  /**
   * Shows the terminal border UI element.
   */
  showTerminalBorder(): void {
    this.logger.info("[UISystem] Showing terminal border");
    this.terminalBorder.initialize();
  }

  /**
   * Hides the terminal border UI element.
   */
  hideTerminalBorder(): void {
    this.logger.info("[UISystem] Hiding terminal border");
    this.terminalBorder.dispose();
  }

  /**
   * Shows the game HUD
   */
  showGameHUD(): void {
    this.logger.info("[UISystem] Showing game HUD");
    // Set gameActive flag to true when HUD is shown
    this.gameActive = true;
    this.gameHUD.show();
  }

  /**
   * Hides the in-game HUD.
   */
  hideGameHUD(): void {
    this.logger.info("[UISystem] Hiding game HUD");
    this.gameHUD.hide();
  }

  /**
   * Updates the HUD with current game data.
   * @param health Current health value
   * @param maxHealth Maximum health value
   * @param shield Current shield value
   * @param maxShield Maximum shield value
   * @param score Current score
   * @param zone Current zone number
   * @param wave Current wave number
   * @param totalWaves Total waves in current zone
   */
  updateHUDData(
    health: number,
    maxHealth: number,
    shield: number,
    maxShield: number,
    score: number,
    zone: number,
    wave: number,
    totalWaves: number
  ): void {
    this.gameHUD.setHealth(health, maxHealth);
    this.gameHUD.setShield(shield, maxShield);
    this.gameHUD.setScore(score);
    this.gameHUD.setZoneInfo(zone, wave, totalWaves);
  }

  /**
   * Updates the HUD weapon cooldowns.
   * @param primary Primary weapon cooldown (0-1)
   * @param special Special weapon cooldown (0-1)
   */
  updateWeaponCooldowns(primary: number, special: number): void {
    this.gameHUD.setWeaponCooldowns(primary, special);
  }

  /**
   * Show a warning message on the HUD.
   * @param message The warning message to display
   */
  showHUDWarning(message: string): void {
    this.gameHUD.showWarning(message);
  }

  /**
   * Hide the warning message on the HUD.
   */
  hideHUDWarning(): void {
    this.gameHUD.hideWarning();
  }

  /**
   * Checks if any menu is currently visible.
   * @returns True if a menu is visible
   */
  isMenuVisible(): boolean {
    return this.menu.isMenuVisible();
  }

  /**
   * Gets the underlying Menu instance.
   * @returns The Menu instance
   */
  getMenu(): Menu {
    return this.menu;
  }

  /**
   * Shows the game over screen.
   */
  showGameOver(): void {
    this.hideGameHUD();
    this.gameOverScreen.show();
  }

  /**
   * Hides the game over screen.
   */
  hideGameOver(): void {
    this.gameOverScreen.hide();
  }

  /**
   * Restarts the game after game over.
   * Handles all the UI changes needed when restarting a game.
   */
  restartGame(): void {
    this.logger.info("Restarting game from game over screen");

    // Hide the game over screen
    this.hideGameOver();

    // Get the scene and reset it
    const scene = this.game.getSceneSystem().getScene();
    scene.resetGame();

    // Show the game HUD
    setTimeout(() => {
      this.showGameHUD();
      this.logger.info("Game HUD shown after restart");
    }, 1000); // Give time for ship entry animation
  }

  /**
   * Adds a combat log message to the game HUD.
   * @param message The message to display in the combat log
   * @param className Optional CSS class to apply to the message
   */
  addCombatLogMessage(message: string, className?: string): void {
    // Simplified logging
    if (message.includes("CLEARED") || message.includes("SYSTEMS ONLINE")) {
      this.logger.info(`UISystem: ${message}`);
    }

    if (!this.gameHUD) {
      this.logger.error(
        "UISystem: Cannot add combat log message - gameHUD is null"
      );
      return;
    }

    this.gameHUD.addCombatLogMessage(message, className);
  }

  /**
   * Shows the zone complete screen.
   */
  showZoneComplete(): void {
    this.logger.info("UISystem: Showing zone complete screen");
    this.zoneCompleteScreen.show();
  }

  /**
   * Hides the zone complete screen.
   */
  hideZoneComplete(): void {
    this.logger.info("UISystem: Hiding zone complete screen");
    this.zoneCompleteScreen.hide();
  }
}
