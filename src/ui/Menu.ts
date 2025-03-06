import { Game } from "../core/Game";
import { Settings } from "./Settings";
import { HighScores } from "./HighScores";
import { Logger } from "../utils/Logger";
import { StyleManager } from "../styles/StyleManager";
import { menuStyles } from "../styles/MenuStyles";

export class Menu {
  private container: HTMLDivElement;
  private isVisible: boolean = true;
  private currentSelection: number = 0;
  private menuOptions: string[] = ["START GAME", "SETTINGS", "HIGH SCORES"];
  private inGameMode: boolean = false; // Flag to track if menu is shown during gameplay
  private settings: Settings;
  private highScores: HighScores;
  private game: Game;
  private invaders: HTMLDivElement[] = []; // To store references to invader elements
  private invaderAnimationInterval: number | null = null; // Store interval ID

  /** Logger instance */
  private logger = Logger.getInstance();

  constructor(game: Game) {
    this.game = game;
    this.container = document.createElement("div");
    this.container.className = "terminal-overlay";

    // Apply styles
    StyleManager.applyStyles("menu", menuStyles);

    this.settings = new Settings(game);
    this.highScores = new HighScores(game);

    this.setupMenu();

    // Add keyboard navigation
    document.addEventListener("keydown", this.handleKeyDown.bind(this));

    // Start synced invader animation with the menu music beat
    this.startInvaderBeatSync();

    // Add diagnostic key listener to help diagnose the issue
    document.addEventListener("keydown", (e) => {
      // Press 'D' key for diagnostics
      if (e.key === "d" && this.isVisible) {
        this.runDiagnostics();
      }
    });
  }

  private setupMenu(): void {
    // Create terminal elements
    const terminalViewport = document.createElement("div");
    terminalViewport.className = "terminal-viewport";

    // Content container
    const contentContainer = document.createElement("div");
    contentContainer.className = "content-container screen-flicker";

    // Title section
    const titleSection = document.createElement("div");
    titleSection.className = "title-section";

    const title = document.createElement("h1");
    title.className = "game-title";
    title.textContent = "STAR WING";

    const invadersRow = document.createElement("div");
    invadersRow.className = "title-invaders";

    // Add space invader style icons
    for (let i = 0; i < 5; i++) {
      const invader = document.createElement("div");
      invader.className = "invader invader-up"; // Default to "up" position
      invadersRow.appendChild(invader);
      this.invaders.push(invader); // Store reference to each invader
    }

    titleSection.appendChild(title);
    titleSection.appendChild(invadersRow);

    // Menu options section
    const menuSection = document.createElement("div");
    menuSection.className = "menu-section";

    this.menuOptions.forEach((option, index) => {
      const menuOption = document.createElement("div");
      menuOption.className = "menu-option";
      menuOption.textContent = option;
      if (index === this.currentSelection) {
        menuOption.classList.add("selected");
      }
      menuOption.dataset.index = index.toString();

      // Add mouseover event to highlight the option
      menuOption.addEventListener("mouseover", () => {
        this.selectOption(index);
      });

      menuOption.addEventListener("click", () => {
        if (option === "START GAME") {
          this.logger.info("[Menu] START GAME clicked");
          this.startGame();
        } else if (option === "SETTINGS") {
          this.showSettings();
        } else if (option === "HIGH SCORES") {
          this.showHighScores();
        }
      });
      menuSection.appendChild(menuOption);
    });

    // Copyright section
    const copyright = document.createElement("div");
    copyright.className = "copyright";

    // Create link instead of just text
    const copyrightLink = document.createElement("a");
    copyrightLink.href = "https://www.github.com/akolumbic";
    copyrightLink.textContent = "© 2025 DROSSHOLE";
    copyrightLink.style.color = "#fff"; // Keep same color as before
    copyrightLink.style.textDecoration = "none"; // No underline by default
    copyrightLink.style.transition = "color 0.2s, text-shadow 0.2s"; // Smooth transition for hover effect
    copyrightLink.target = "_blank"; // Open in new tab
    copyrightLink.rel = "noopener noreferrer"; // Security best practice for external links

    // Add hover effect
    copyrightLink.addEventListener("mouseover", () => {
      copyrightLink.style.color = "#0f0"; // Green on hover
      copyrightLink.style.textShadow = "0 0 5px rgba(0, 255, 0, 0.7)"; // Glow effect
    });

    copyrightLink.addEventListener("mouseout", () => {
      copyrightLink.style.color = "#fff"; // Back to white
      copyrightLink.style.textShadow = "none"; // Remove glow
    });

    copyright.appendChild(copyrightLink);

    // Append all elements
    contentContainer.appendChild(titleSection);
    contentContainer.appendChild(menuSection);
    contentContainer.appendChild(copyright);

    terminalViewport.appendChild(contentContainer);
    this.container.appendChild(terminalViewport);
    document.body.appendChild(this.container);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isVisible) return;

    switch (event.key) {
      case "ArrowUp":
        this.selectOption(this.currentSelection - 1);
        break;
      case "ArrowDown":
        this.selectOption(this.currentSelection + 1);
        break;
      case "Enter":
        this.activateCurrentOption();
        break;
    }
  }

  private selectOption(index: number): void {
    if (index < 0) index = this.menuOptions.length - 1;
    if (index >= this.menuOptions.length) index = 0;

    // Remove previous selection
    const options = document.querySelectorAll(".menu-option");
    options.forEach((option) => option.classList.remove("selected"));

    // Add new selection
    options[index].classList.add("selected");
    this.currentSelection = index;
  }

  private updateMenuOptions(): void {
    // Update the first menu option based on in-game state
    const menuOptionElements = document.querySelectorAll(".menu-option");
    if (menuOptionElements.length > 0) {
      menuOptionElements[0].textContent = this.inGameMode
        ? "RESUME GAME"
        : "START GAME";
    }

    // Also update our internal array to keep things consistent
    this.menuOptions[0] = this.inGameMode ? "RESUME GAME" : "START GAME";
  }

  private activateCurrentOption(): void {
    const currentOption = this.menuOptions[this.currentSelection];
    this.logger.info(`Activating menu option: ${currentOption}`);

    switch (this.currentSelection) {
      case 0: // START GAME or RESUME GAME
        if (this.inGameMode) {
          this.logger.info("Resuming game from pause menu");
          this.resumeGame();
        } else {
          this.logger.info("Starting new game from main menu");
          this.startGame();
        }
        break;
      case 1: // SETTINGS
        this.showSettings();
        break;
      case 2: // HIGH SCORES
        this.showHighScores();
        break;
      default:
        this.logger.warn("Unknown menu option selected");
    }
  }

  /**
   * Run UI diagnostics to check for potential issues
   */
  private runDiagnostics(): void {
    this.logger.debug("[DEBUG] Running UI diagnostics...");

    // Check for elements with high z-index that might overlap
    const allElements = document.querySelectorAll("*");
    const highZElements: Element[] = [];

    allElements.forEach((el) => {
      const zIndex = window.getComputedStyle(el).zIndex;
      if (zIndex !== "auto" && parseInt(zIndex) > 900) {
        highZElements.push(el);
      }
    });

    if (highZElements.length > 0) {
      this.logger.debug("[DEBUG] Elements with high z-index:", highZElements);
    }

    // Test background transparency
    this.logger.debug("[DEBUG] Setting menu background to transparent");
    const originalBg = this.container.style.backgroundColor;
    this.container.style.backgroundColor = "transparent";
    setTimeout(() => {
      this.container.style.backgroundColor = originalBg;
      this.logger.debug("[DEBUG] Restoring menu background");
    }, 500);
  }

  /**
   * Start the game when the user clicks the start button
   */
  private startGame(): void {
    // If the menu is not visible, we can't start the game
    if (!this.isVisible) {
      this.logger.info("Menu is not visible, cannot start game");
      return;
    }

    this.logger.info("Menu: Starting game");

    // Play a test tone to verify audio is working
    try {
      this.logger.info("AUDIO-DEBUG: Playing test tone before game start");
      const audioManager = this.game.getAudioSystem().getAudioManager();
      audioManager.playTestTone();
    } catch (e) {
      this.logger.error("AUDIO-DEBUG: Error playing test tone:", e);
    }

    // Transition music immediately
    setTimeout(() => {
      this.logger.info("AUDIO-DEBUG: Transitioning to game music");
      this.game.getAudioSystem().playGameMusicImmediately();

      // Start the hyperspace effect
      const scene = this.game.getSceneSystem().getScene();
      scene.transitionHyperspace(true, 2.0);
      this.logger.info("AUDIO-DEBUG: Started hyperspace effect");

      // After music transition, show the text crawl
      setTimeout(() => {
        // Play another test tone to verify audio still works
        try {
          this.logger.info(
            "AUDIO-DEBUG: Playing test tone after music transition"
          );
          const audioManager = this.game.getAudioSystem().getAudioManager();
          audioManager.playTestTone();
        } catch (e) {
          this.logger.error("AUDIO-DEBUG: Error playing second test tone:", e);
        }

        // Play the text crawl
        this.logger.info("Showing text crawl");
        this.game.getUISystem().showTextCrawl(() => {
          this.logger.info("Text crawl complete, game ready to begin");
          // Try to start game music again after text crawl if needed
          try {
            this.logger.info("AUDIO-DEBUG: Final audio check after text crawl");
            const audioManager = this.game.getAudioSystem().getAudioManager();
            audioManager.playTestTone();
            // Re-trigger game music if it's not playing
            setTimeout(() => {
              this.game.getAudioSystem().playGameMusicImmediately();
            }, 500);
          } catch (e) {
            this.logger.error("AUDIO-DEBUG: Error in final audio check:", e);
          }

          // this.game.startGame();
        });
      }, 1000);
    }, 100);

    // Hide the menu
    this.hide();
  }

  /**
   * Resume the game by hiding the menu
   */
  private resumeGame(): void {
    this.logger.info("Resuming game...");

    // Make sure we don't trigger any game start logic - just hide the menu
    this.hide();

    // Show the game HUD through the UI system
    const uiSystem = this.game.getUISystem();
    uiSystem.resumeGame();
  }

  private showSettings(): void {
    // Hide the menu container but stay "active" logically
    this.container.style.display = "none";
    this.settings.show();

    // Set up a callback to restore the menu when settings are closed
    this.settings.setOnCloseCallback(() => {
      this.container.style.display = "flex";
    });
  }

  private showHighScores(): void {
    // Hide the menu container but stay "active" logically
    this.container.style.display = "none";
    this.highScores.show();

    // Set up a callback to restore the menu when high scores are closed
    this.highScores.setOnCloseCallback(() => {
      this.container.style.display = "flex";
    });
  }

  /**
   * Shows the menu for in-game pause
   */
  showInGameMenu(): void {
    this.inGameMode = true;
    this.updateMenuOptions();
    this.show();
  }

  /**
   * Shows the main menu (not in-game)
   */
  showMainMenu(): void {
    this.inGameMode = false;
    this.updateMenuOptions();
    this.show();
  }

  show(): void {
    this.container.style.display = "flex";
    this.isVisible = true;
    this.logger.info("Menu: Menu displayed");

    // Start syncing invaders with music beat
    this.startInvaderBeatSync();
  }

  hide(): void {
    if (!this.isVisible) return;

    this.isVisible = false;
    this.container.style.display = "none";
    this.logger.info("Menu: Menu hidden");

    // Stop syncing invaders with music beat
    this.stopInvaderBeatSync();
  }

  isMenuVisible(): boolean {
    return this.isVisible;
  }

  dispose(): void {
    // Remove the styles when component is disposed
    StyleManager.removeStyles("menu");

    if (this.invaderAnimationInterval) {
      clearInterval(this.invaderAnimationInterval);
      this.invaderAnimationInterval = null;
    }

    document.removeEventListener("keydown", this.handleKeyDown.bind(this));

    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }

    this.settings.dispose();
    this.highScores.dispose();
  }

  /**
   * Start syncing the invader animation with the music beat.
   * This uses the tempo of the music (130 BPM) to sync the animation.
   */
  private startInvaderBeatSync(): void {
    // Stop any existing animation
    this.stopInvaderBeatSync();

    // Define the beat interval based on music tempo (130 BPM)
    // 60000 ms / 130 BPM = ~461.5 ms per beat
    const beatInterval = 60000 / 130;

    // Flag to track current animation state
    let isUp = true;

    // Update all invaders immediately
    this.updateInvaderPositions(isUp);

    // Set interval to toggle positions on the beat
    this.invaderAnimationInterval = window.setInterval(() => {
      isUp = !isUp;
      this.updateInvaderPositions(isUp);
    }, beatInterval / 2); // Half the beat interval for 8th notes

    this.logger.info("Menu: Started invader beat sync animation");
  }

  /**
   * Stop the invader beat sync animation.
   */
  private stopInvaderBeatSync(): void {
    if (this.invaderAnimationInterval !== null) {
      window.clearInterval(this.invaderAnimationInterval);
      this.invaderAnimationInterval = null;
      this.logger.info("Menu: Stopped invader beat sync animation");
    }
  }

  /**
   * Update all invader positions based on the beat state.
   * @param isUp Whether invaders should be in the "up" position
   */
  private updateInvaderPositions(isUp: boolean): void {
    // Every other invader gets the opposite position for more interesting animation
    this.invaders.forEach((invader, index) => {
      const position = index % 2 === 0 ? isUp : !isUp;
      invader.className = `invader ${position ? "invader-up" : "invader-down"}`;
    });
  }
}
