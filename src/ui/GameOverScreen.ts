import { Game } from "../core/Game";
import { Logger } from "../utils/Logger";

/**
 * Game Over screen displayed when the player's ship is destroyed.
 * Allows restarting the game or returning to the main menu.
 */
export class GameOverScreen {
  /** Container element for the entire game over screen */
  private container: HTMLDivElement;

  /** Flag to track visibility */
  private isVisible: boolean = false;

  /** Game instance reference */
  private game: Game;

  /** Logger instance */
  private logger = Logger.getInstance();

  /**
   * Creates a new Game Over screen
   * @param game Reference to the game instance
   */
  constructor(game: Game) {
    this.game = game;
    this.container = document.createElement("div");
    this.setupStyles();
    this.setupContent();
  }

  /**
   * Sets up the styles for the game over screen
   */
  private setupStyles(): void {
    this.container.style.position = "fixed";
    this.container.style.top = "0";
    this.container.style.left = "0";
    this.container.style.width = "100%";
    this.container.style.height = "100%";
    this.container.style.display = "flex";
    this.container.style.flexDirection = "column";
    this.container.style.justifyContent = "center";
    this.container.style.alignItems = "center";
    this.container.style.backgroundColor = "rgba(0, 0, 0, 0.85)";
    this.container.style.color = "#f00";
    this.container.style.fontFamily = "monospace, 'Courier New', Courier";
    this.container.style.zIndex = "9999";
    this.container.style.opacity = "0";
    this.container.style.transition = "opacity 1s ease-in";
    this.container.style.backdropFilter = "blur(5px)";
    this.container.style.display = "none";
  }

  /**
   * Sets up the content of the game over screen
   */
  private setupContent(): void {
    // Game Over title
    const title = document.createElement("h1");
    title.textContent = "SYSTEM FAILURE";
    title.style.fontSize = "4rem";
    title.style.textAlign = "center";
    title.style.margin = "0 0 2rem 0";
    title.style.fontWeight = "bold";
    title.style.textShadow = "0 0 10px rgba(255, 0, 0, 0.7)";
    title.style.animation = "pulsate 2s infinite";

    // Animated pulse effect
    const style = document.createElement("style");
    style.textContent = `
      @keyframes pulsate {
        0% { opacity: 0.7; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.05); }
        100% { opacity: 0.7; transform: scale(1); }
      }
      @keyframes shimmer {
        0% { background-position: -100% 0; }
        100% { background-position: 100% 0; }
      }
    `;
    document.head.appendChild(style);

    // Message
    const message = document.createElement("div");
    message.textContent = "SHIP DESTROYED";
    message.style.fontSize = "2rem";
    message.style.margin = "0 0 3rem 0";
    message.style.opacity = "0.9";
    message.style.textAlign = "center";

    // Options container
    const options = document.createElement("div");
    options.style.display = "flex";
    options.style.flexDirection = "column";
    options.style.gap = "1.5rem";
    options.style.marginTop = "1rem";

    // Restart option
    const restartOption = document.createElement("button");
    restartOption.textContent = "RESTART MISSION";
    this.styleButton(restartOption);
    restartOption.addEventListener("click", () => this.handleRestart());

    // Main menu option
    const menuOption = document.createElement("button");
    menuOption.textContent = "RETURN TO MAIN MENU";
    this.styleButton(menuOption);
    menuOption.addEventListener("click", () => this.handleMainMenu());

    // Append all elements
    options.appendChild(restartOption);
    options.appendChild(menuOption);
    this.container.appendChild(title);
    this.container.appendChild(message);
    this.container.appendChild(options);

    // Add to document
    document.body.appendChild(this.container);
  }

  /**
   * Apply consistent styling to buttons
   */
  private styleButton(button: HTMLButtonElement): void {
    button.style.backgroundColor = "transparent";
    button.style.border = "2px solid #f00";
    button.style.color = "#fff";
    button.style.padding = "1rem 2rem";
    button.style.fontSize = "1.5rem";
    button.style.fontFamily = "monospace, 'Courier New', Courier";
    button.style.cursor = "pointer";
    button.style.transition = "all 0.3s ease";
    button.style.width = "300px";
    button.style.textAlign = "center";
    button.style.position = "relative";
    button.style.overflow = "hidden";

    // Hover effects
    button.addEventListener("mouseover", () => {
      button.style.backgroundColor = "rgba(255, 0, 0, 0.2)";
      button.style.transform = "scale(1.05)";
      button.style.boxShadow = "0 0 15px rgba(255, 0, 0, 0.5)";
    });

    button.addEventListener("mouseout", () => {
      button.style.backgroundColor = "transparent";
      button.style.transform = "scale(1)";
      button.style.boxShadow = "none";
    });
  }

  /**
   * Shows the game over screen
   */
  show(): void {
    if (this.isVisible) return;

    this.logger.info("Showing Game Over screen");
    this.container.style.display = "flex";

    // Trigger reflow to ensure transition works
    void this.container.offsetWidth;

    this.container.style.opacity = "1";
    this.isVisible = true;

    // Add a blink effect to the entire screen briefly
    const flash = document.createElement("div");
    flash.style.position = "fixed";
    flash.style.top = "0";
    flash.style.left = "0";
    flash.style.width = "100%";
    flash.style.height = "100%";
    flash.style.backgroundColor = "#f00";
    flash.style.zIndex = "9998";
    flash.style.opacity = "0.8";
    document.body.appendChild(flash);

    // Remove flash after brief period
    setTimeout(() => {
      flash.style.opacity = "0";
      setTimeout(() => {
        document.body.removeChild(flash);
      }, 500);
    }, 100);
  }

  /**
   * Hides the game over screen
   */
  hide(): void {
    if (!this.isVisible) return;

    this.logger.info("Hiding Game Over screen");
    this.container.style.opacity = "0";

    // Wait for fade transition to complete
    setTimeout(() => {
      this.container.style.display = "none";
      this.isVisible = false;
    }, 1000);
  }

  /**
   * Disposes of the game over screen
   */
  dispose(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }

  /**
   * Handler for restart button
   */
  private handleRestart(): void {
    this.logger.info("Game Over: Restart game requested");

    // Use the centralized UISystem method to handle restarting
    setTimeout(() => {
      this.game.getUISystem().restartGame();
    }, 500);
  }

  /**
   * Handles the main menu button click
   */
  private handleMainMenu(): void {
    this.logger.info("Game Over: Return to main menu requested");
    this.hide();

    // Ensure hyperspace effect is disabled when returning to main menu
    const scene = this.game.getSceneSystem().getScene();
    scene.transitionHyperspace(false, 1.0);

    // Transition to menu music
    if (this.game.getAudioManager()) {
      // Stop any game music first with a short fade out
      this.game.getAudioManager().stopMusic(0.5);
    }

    // Clean up the player ship before transitioning to main menu
    scene.cleanupPlayerShip();

    // Wait for fade out before showing menu
    setTimeout(() => {
      this.game.getUISystem().showMenu();
    }, 1000);
  }
}
