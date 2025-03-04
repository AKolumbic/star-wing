import { GameSystem } from "../GameSystem";
import { Menu } from "../../ui/Menu";
import { LoadingScreen } from "../../ui/LoadingScreen";
import { TerminalBorder } from "../../ui/TerminalBorder";

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

  /** Reference to the main game for accessing game state */
  private game: any; // Using 'any' to avoid circular dependency

  /**
   * Creates a new UISystem.
   * @param game Reference to the main game instance
   */
  constructor(game: any) {
    this.game = game;
    this.menu = new Menu(this.game);
    this.terminalBorder = TerminalBorder.getInstance();

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
    // UI components are largely event-driven, but we could update animations here
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
  }

  /**
   * Hides the currently active menu.
   */
  hideMenu(): void {
    this.menu.hide();
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
