import { Game } from "../core/Game";
import { Settings } from "./Settings";
import { HighScores } from "./HighScores";
import { Logger } from "../utils/Logger";

export class Menu {
  private container: HTMLDivElement;
  private isVisible: boolean = true;
  private currentSelection: number = 0;
  private menuOptions: string[] = ["START GAME", "SETTINGS", "HIGH SCORES"];
  private inGameMode: boolean = false; // Flag to track if menu is shown during gameplay
  private settings: Settings;
  private highScores: HighScores;
  private game: Game;

  /** Logger instance */
  private logger = Logger.getInstance();

  constructor(game: Game) {
    this.game = game;
    this.container = document.createElement("div");
    this.container.className = "terminal-overlay";
    this.settings = new Settings(game);
    this.highScores = new HighScores(game);
    this.setupStyles();
    this.setupMenu();

    // Add diagnostic key listener to help diagnose the issue
    document.addEventListener("keydown", (e) => {
      // Press 'D' key for diagnostics
      if (e.key === "d" && this.isVisible) {
        this.runDiagnostics();
      }
    });
  }

  private setupStyles(): void {
    const style = document.createElement("style");
    style.textContent = `
      @font-face {
        font-family: 'PressStart2P';
        src: url('https://fonts.gstatic.com/s/pressstart2p/v14/e3t4euO8T-267oIAQAu6jDQyK3nVivNm4I81.woff2') format('woff2');
        font-weight: normal;
        font-style: normal;
      }

      .terminal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        font-family: 'PressStart2P', monospace;
        overflow: hidden;
        z-index: 1000;
        color: #fff;
        box-sizing: border-box;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      /* CRT Screen Effect with Viewport */
      .terminal-viewport {
        position: relative;
        width: calc(100% - 56px);
        height: calc(100% - 56px);
        overflow: hidden;
        background: transparent;
        z-index: 1002;
        border: none;
      }

      .content-container {
        position: relative;
        z-index: 1001;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        width: 100%;
        border: none;
      }

      /* Remove any potential dividing lines */
      .title-section, .menu-section, .development-placeholder {
        border: none;
        border-bottom: none;
        border-top: none;
        outline: none;
        box-shadow: none;
      }

      .title-section {
        text-align: center;
        margin-bottom: 2rem;
      }

      .game-title {
        font-size: 3.5rem;
        color: #ff0;
        text-shadow: 3px 3px 0 #f00;
        margin: 0;
        animation: pulse 1.5s infinite alternate;
        letter-spacing: -2px;
      }

      .title-invaders {
        display: flex;
        justify-content: center;
        margin: 20px 0;
      }

      .invader {
        width: 30px;
        height: 30px;
        margin: 0 10px;
        background-color: #0f0;
        clip-path: polygon(
          0% 25%, 35% 25%, 35% 0%, 65% 0%, 65% 25%, 100% 25%, 
          100% 60%, 85% 60%, 85% 75%, 70% 75%, 70% 60%, 30% 60%, 
          30% 75%, 15% 75%, 15% 60%, 0% 60%
        );
        animation: invader-dance 1s infinite step-end;
      }

      .invader:nth-child(odd) {
        animation-delay: 0.5s;
      }

      .copyright {
        color: #fff;
        font-size: 0.8rem;
        text-align: center;
        position: absolute;
        bottom: 20px;
        width: 100%;
        z-index: 1006;
      }

      .menu-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin: 0;
      }

      .menu-option {
        color: #fff;
        font-size: 1.4rem;
        margin: 15px 0;
        padding: 5px 20px;
        position: relative;
        transition: all 0.1s;
        cursor: pointer;
      }

      .menu-option.selected {
        color: #0f0;
      }

      .menu-option:hover {
        color: #0f0;
        text-shadow: 0 0 5px rgba(0, 255, 0, 0.7);
      }

      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.7; }
        100% { opacity: 1; }
      }

      @keyframes invader-dance {
        0%, 50% { transform: translateY(0); }
        50.01%, 100% { transform: translateY(5px); }
      }

      /* Fix for the screen-flicker animation to prevent line artifacts */
      @keyframes screen-flicker {
        0%, 95% { opacity: 1; background: transparent; }
        96%, 100% { opacity: 0.8; background: transparent; }
      }

      .screen-flicker {
        animation: screen-flicker 10s infinite;
        background: transparent;
      }
    `;
    document.head.appendChild(style);
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
      invader.className = "invader";
      invadersRow.appendChild(invader);
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
    copyrightLink.href = "https://www.drosshole.com";
    copyrightLink.textContent = "© 2025 DROSSHOLE";
    copyrightLink.style.color = "#fff"; // Keep same color as before
    copyrightLink.style.textDecoration = "none"; // No underline by default
    copyrightLink.style.transition = "color 0.2s, text-shadow 0.2s"; // Smooth transition for hover effect

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

    // Setup keyboard navigation
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
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
   * Start the game
   */
  private startGame(): void {
    // Safety check - if we're in game mode, we should be resuming, not starting a new game
    if (this.inGameMode) {
      this.logger.warn(
        "Attempted to start a new game while already in-game. Resuming instead."
      );
      this.resumeGame();
      return;
    }

    if (!this.isVisible) {
      this.logger.info("Menu is not visible, cannot start game");
      return;
    }

    this.logger.info("Starting game sequence...");
    this.hide();
    this.logger.info("Menu hidden");

    // Get required systems
    const scene = this.game.getSceneSystem().getScene();
    const input = this.game.getInputSystem().getInput();
    const uiSystem = this.game.getUISystem();

    // Initialize required systems before showing text crawl
    scene.setInput(input);
    this.logger.info("Input set on scene");

    // Show text crawl as first step in sequence
    this.logger.info("Showing text crawl");
    uiSystem.showTextCrawl(() => {
      // After text crawl completes, immediately start hyperspace
      this.logger.info("Text crawl complete, starting hyperspace transition");

      // Transition to hyperspace
      scene
        .transitionHyperspace(true, 2.0)
        .then(() => {
          // Wait for a moment to enjoy the hyperspace effect
          this.logger.info(
            "Hyperspace transition begun, setting up ship entry"
          );
          setTimeout(() => {
            // Initialize player ship
            scene
              .initPlayerShip()
              .then(() => {
                this.logger.info("Ship initialized successfully");

                // Once the game is starting, show the HUD
                uiSystem.showGameHUD();

                // Begin the ship entry animation
                this.logger.info("Starting ship entry animation");
                scene.startShipEntry();
              })
              .catch((error) => {
                this.logger.error("Failed to initialize ship:", error);
              });
          }, 500);
        })
        .catch((error) => {
          this.logger.error("Failed to transition to hyperspace:", error);
        });
    });
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
  }

  hide(): void {
    if (!this.isVisible) return;

    this.isVisible = false;
    this.container.style.display = "none";
    this.logger.info("[Menu] Hiding menu");
  }

  isMenuVisible(): boolean {
    return this.isVisible;
  }

  dispose(): void {
    document.body.removeChild(this.container);
    document.removeEventListener("keydown", this.handleKeyDown.bind(this));
    this.settings.dispose();
    this.highScores.dispose();
  }
}
