import { GameSystem } from "../GameSystem";
import { Menu } from "../../ui/Menu";
import { LoadingScreen } from "../../ui/LoadingScreen";
import { TerminalBorder } from "../../ui/TerminalBorder";
import { TextCrawl } from "../../ui/TextCrawl";
import { GameHUD } from "../../ui/GameHUD";
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

  /** Reference to the main game for accessing game state */
  private game: any; // Using 'any' to avoid circular dependency

  /** Logger instance */
  private logger = Logger.getInstance();

  /**
   * Creates a new UISystem.
   * @param game Reference to the main game instance
   */
  constructor(game: any) {
    this.game = game;
    this.menu = new Menu(this.game);
    this.terminalBorder = TerminalBorder.getInstance();
    this.textCrawl = new TextCrawl(this.game);
    this.gameHUD = new GameHUD(this.game);

    // The loading screen is created later when needed
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
    if (this.menu && typeof this.menu.dispose === "function") {
      this.menu.dispose();
    }

    if (
      this.loadingScreen &&
      typeof this.loadingScreen.dispose === "function"
    ) {
      this.loadingScreen.dispose();
    }

    if (
      this.terminalBorder &&
      typeof this.terminalBorder.dispose === "function"
    ) {
      this.terminalBorder.dispose();
    }

    if (this.textCrawl && typeof this.textCrawl.dispose === "function") {
      this.textCrawl.dispose();
    }

    if (this.gameHUD && typeof this.gameHUD.dispose === "function") {
      this.gameHUD.dispose();
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
   * Shows the menu.
   */
  showMenu(): void {
    this.menu.show();
    // Hide the HUD when menu is shown
    this.gameHUD.hide();
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
   * Shows the in-game HUD.
   */
  showGameHUD(): void {
    this.logger.info("[UISystem] Showing game HUD");
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
}
