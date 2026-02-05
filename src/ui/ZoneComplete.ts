import { Game } from "../core/Game";
import { Logger } from "../utils/Logger";

/**
 * Zone Complete screen displayed when the player completes a zone.
 * Shows a congratulatory message and allows returning to the main menu.
 */
export class ZoneComplete {
  /** Container element for the entire zone complete screen */
  private container: HTMLDivElement;

  /** Title element */
  private titleElement!: HTMLHeadingElement;

  /** Subtitle element */
  private subtitleElement!: HTMLDivElement;

  /** Detail element */
  private detailElement!: HTMLDivElement;

  /** Continue button */
  private continueButton!: HTMLButtonElement;

  /** Main menu button */
  private mainMenuButton!: HTMLButtonElement;

  /** Flag to track visibility */
  private isVisible: boolean = false;

  /** Game instance reference */
  private game: Game;

  /** Logger instance */
  private logger = Logger.getInstance();

  /**
   * Creates a new Zone Complete screen
   * @param game Reference to the game instance
   */
  constructor(game: Game) {
    this.game = game;
    this.container = document.createElement("div");
    this.setupStyles();
    this.setupContent();
  }

  /**
   * Sets up the styles for the zone complete screen
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
    this.container.style.backgroundColor = "rgba(0, 10, 30, 0.85)";
    this.container.style.color = "#00ffff";
    this.container.style.fontFamily = "monospace, 'Courier New', Courier";
    this.container.style.zIndex = "9999";
    this.container.style.opacity = "0";
    this.container.style.transition = "opacity 1s ease-in";
    this.container.style.backdropFilter = "blur(5px)";
    this.container.style.display = "none";
  }

  /**
   * Sets up the content of the zone complete screen
   */
  private setupContent(): void {
    // Zone Complete title
    this.titleElement = document.createElement("h1");
    this.titleElement.textContent = "ZONE CLEARED";
    this.titleElement.style.fontSize = "4rem";
    this.titleElement.style.textAlign = "center";
    this.titleElement.style.margin = "0 0 1.5rem 0";
    this.titleElement.style.fontWeight = "bold";
    this.titleElement.style.textShadow = "0 0 10px rgba(0, 255, 255, 0.7)";
    this.titleElement.style.animation = "pulsate 2s infinite";

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

    // Subtitle
    this.subtitleElement = document.createElement("div");
    this.subtitleElement.textContent = "PREPARE FOR THE NEXT ZONE";
    this.subtitleElement.style.fontSize = "2rem";
    this.subtitleElement.style.margin = "0 0 1rem 0";
    this.subtitleElement.style.opacity = "0.9";
    this.subtitleElement.style.textAlign = "center";

    // Detail line
    this.detailElement = document.createElement("div");
    this.detailElement.textContent = "DOCKING SYSTEMS ONLINE";
    this.detailElement.style.fontSize = "1.2rem";
    this.detailElement.style.margin = "0 0 3rem 0";
    this.detailElement.style.opacity = "0.8";
    this.detailElement.style.textAlign = "center";
    this.detailElement.style.color = "#00cccc";

    // Options container
    const options = document.createElement("div");
    options.style.display = "flex";
    options.style.flexDirection = "column";
    options.style.gap = "1.5rem";
    options.style.marginTop = "1rem";

    // Continue option
    this.continueButton = document.createElement("button");
    this.continueButton.textContent = "CONTINUE";
    this.styleButton(this.continueButton);
    this.continueButton.addEventListener("click", () => this.handleContinue());

    // Main Menu option
    this.mainMenuButton = document.createElement("button");
    this.mainMenuButton.textContent = "RETURN TO MAIN MENU";
    this.styleButton(this.mainMenuButton);
    this.mainMenuButton.addEventListener("click", () => this.handleMainMenu());

    // Append all elements
    options.appendChild(this.continueButton);
    options.appendChild(this.mainMenuButton);
    this.container.appendChild(this.titleElement);
    this.container.appendChild(this.subtitleElement);
    this.container.appendChild(this.detailElement);
    this.container.appendChild(options);

    // Add to document but hidden
    document.body.appendChild(this.container);
  }

  /**
   * Apply common styles to buttons
   * @param button Button element to style
   */
  private styleButton(button: HTMLButtonElement): void {
    button.style.backgroundColor = "rgba(0, 80, 80, 0.7)";
    button.style.color = "#ffffff";
    button.style.border = "2px solid #00ffff";
    button.style.borderRadius = "4px";
    button.style.padding = "1rem 2rem";
    button.style.fontSize = "1.2rem";
    button.style.fontFamily = "monospace, 'Courier New', Courier";
    button.style.cursor = "pointer";
    button.style.transition = "all 0.2s ease";
    button.style.width = "300px";
    button.style.outline = "none";
    button.style.textAlign = "center";
    button.style.background =
      "linear-gradient(to right, rgba(0, 50, 50, 0.7), rgba(0, 100, 100, 0.7))";
    button.style.backgroundSize = "200% 100%";

    // Hover effect
    button.addEventListener("mouseover", () => {
      button.style.backgroundColor = "rgba(0, 120, 120, 0.8)";
      button.style.transform = "scale(1.05)";
      button.style.animation = "shimmer 2s infinite linear";
      button.style.boxShadow = "0 0 15px rgba(0, 255, 255, 0.5)";
    });

    // Mouse out effect
    button.addEventListener("mouseout", () => {
      button.style.backgroundColor = "rgba(0, 80, 80, 0.7)";
      button.style.transform = "scale(1)";
      button.style.animation = "none";
      button.style.boxShadow = "none";
    });
  }

  /**
   * Shows the zone complete screen
   */
  show(completedZone: number, nextZoneId: number | null): void {
    if (this.isVisible) return;

    this.titleElement.textContent = `ZONE ${completedZone} CLEARED`;

    if (nextZoneId !== null) {
      this.subtitleElement.textContent = `PREPARE FOR ZONE ${nextZoneId}`;
      this.detailElement.textContent = "DOCKING SYSTEMS ONLINE";
      this.continueButton.style.display = "block";
    } else {
      this.subtitleElement.textContent = "MISSION COMPLETE";
      this.detailElement.textContent = "ALL SECTORS SECURED";
      this.continueButton.style.display = "none";
    }

    this.logger.info("Showing zone complete screen");
    this.isVisible = true;
    this.container.style.display = "flex";

    // Use requestAnimationFrame to ensure the display change takes effect before setting opacity
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.container.style.opacity = "1";
      });
    });

    // Play success sound if available
    if (this.game && this.game.getAudioManager()) {
      try {
        // Play appropriate sound for zone complete
        // Once implemented, call the appropriate method
        // this.game.getAudioManager().playEffectSound("success");
      } catch (error) {
        this.logger.warn("Failed to play zone complete sound:", error);
      }
    }
  }

  /**
   * Hides the zone complete screen
   */
  hide(): void {
    if (!this.isVisible) return;

    this.logger.info("Hiding zone complete screen");
    this.isVisible = false;
    this.container.style.opacity = "0";

    // Remove from DOM after fade out animation completes
    setTimeout(() => {
      this.container.style.display = "none";
    }, 1000);
  }

  /**
   * Cleans up resources when the component is no longer needed
   */
  dispose(): void {
    this.logger.info("Disposing zone complete screen");
    if (this.container && this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
    }
  }

  /**
   * Handles the main menu button click
   */
  private handleMainMenu(): void {
    this.logger.info("Zone complete: Player chose to return to main menu");

    // Hide this screen first
    this.hide();

    // Ensure hyperspace effect is disabled when returning to main menu
    if (this.game) {
      const scene = this.game.getSceneSystem().getScene();
      scene.transitionHyperspace(false, 1.0);

      // Transition to menu music
      if (this.game.getAudioManager()) {
        // Stop any game music first with a short fade out
        this.game.getAudioManager().stopMusic(0.5);
      }
    }

    // Play button sound if available
    if (this.game && this.game.getAudioManager()) {
      try {
        // this.game.getAudioManager().playMenuSound("select");
      } catch (error) {
        this.logger.warn("Failed to play button sound:", error);
      }
    }

    // Tell the game to return to the main menu
    setTimeout(() => {
      this.game.getUISystem().showMenu();
    }, 1000);
  }

  /**
   * Handles the continue button click
   */
  private handleContinue(): void {
    this.logger.info("Zone complete: Player chose to continue");

    // Hide this screen first
    this.hide();

    // Resume gameplay
    if (this.game) {
      const scene = this.game.getSceneSystem().getScene();
      scene.resumeAfterZoneComplete();
    }
  }
}
