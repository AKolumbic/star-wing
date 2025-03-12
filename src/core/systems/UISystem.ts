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
import { InGameMenu } from "../../ui/InGameMenu";

/**
 * System that manages all UI components including menus, overlays, and HUD.
 * Implements the GameSystem interface for consistent lifecycle management.
 */
export class UISystem implements GameSystem {
  /** Main menu controller */
  private menu: Menu;

  /** In-game menu controller */
  private inGameMenu: InGameMenu;

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
    this.inGameMenu = new InGameMenu(this.game);
    this.terminalBorder = TerminalBorder.getInstance();
    this.textCrawl = new TextCrawl(this.game);
    this.gameHUD = new GameHUD(this.game);
    this.gameOverScreen = new GameOverScreen(this.game);
    this.zoneCompleteScreen = new ZoneComplete(this.game);

    // The loading screen is created later when needed

    // Hide the in-game menu initially (ensure it's not visible on start)
    this.hideInGameMenu();

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
    this.hideInGameMenu();
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
    this.inGameMenu.dispose();
    this.textCrawl.dispose();
    this.gameHUD.dispose();
    this.gameOverScreen.dispose();
    this.zoneCompleteScreen.dispose();
  }

  /**
   * Sets up the Escape key handler for toggling the in-game menu
   */
  private setupEscapeKeyHandler(): void {
    // Implementation removed as requested
    // The escape key no longer shows the in-game menu
    this.escapeKeyHandler = null;
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
   * This method performs cleanup operations.
   */
  showMenu(): void {
    this.gameActive = false;

    // Clean up the player ship when returning to main menu
    if (this.game) {
      const scene = this.game.getSceneSystem().getScene();

      // Ensure hyperspace effect is disabled when returning to main menu
      scene.transitionHyperspace(false, 1.0);

      // Clean up player ship
      scene.cleanupPlayerShip();

      // Transition back to menu music
      if (this.game.getAudioManager()) {
        // Stop ALL music before starting menu music to prevent overlapping tracks
        this.game.getAudioManager().stopMusic();

        // Play menu music immediately for better synchronization with menu display
        // Explicitly request non-procedural music (false) regardless of dev mode
        this.game.getAudioManager().playMenuMusic(false);
      }
    }

    this.menu.showMainMenu();

    // Hide the HUD when menu is shown
    this.gameHUD.hide();
  }

  /**
   * Shows the main menu without performing cleanup operations.
   * This is used by the InGameMenu when it has already handled cleanup.
   */
  showMainMenuWithoutCleanup(): void {
    this.gameActive = false;

    // Explicitly hide the in-game menu to prevent overlay issues
    this.hideInGameMenu();

    // Play menu music immediately
    if (this.game && this.game.getAudioManager()) {
      this.game.getAudioManager().playMenuMusic(this.game.isDevMode());
    }

    this.menu.showMainMenu();

    // Hide the HUD
    this.gameHUD.hide();
  }

  /**
   * Shows the in-game menu (pause menu during gameplay).
   */
  showInGameMenu(): void {
    // Implementation removed as requested
    // The in-game menu no longer affects the game state
    this.logger.info("In-game menu display disabled");
  }

  /**
   * Resumes the game by hiding the menu and showing the HUD
   */
  resumeGame(): void {
    // Implementation partially removed as requested
    // Keep the HUD-related functionality
    this.gameActive = true;
    this.menu.hide();
    this.inGameMenu.hide();
    this.gameHUD.show();

    this.logger.info("Game resumed from pause menu");
  }

  /**
   * Hides the currently active menu.
   */
  hideMenu(): void {
    this.menu.hide();
  }

  /**
   * Hides the in-game menu.
   */
  hideInGameMenu(): void {
    this.inGameMenu.hide();
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
   * @returns True if any menu is visible, false otherwise
   */
  isMenuVisible(): boolean {
    return this.menu.isMenuVisible();
  }

  /**
   * Checks if the in-game menu is visible.
   * @returns True if in-game menu is visible, false otherwise
   */
  isInGameMenuVisible(): boolean {
    return this.inGameMenu.isMenuVisible();
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

    // Ensure hyperspace effect is re-enabled for the ship entry animation
    scene.transitionHyperspace(true, 1.0);

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
