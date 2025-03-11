import { Game } from "../core/Game";
import { Settings } from "./Settings";
import { HighScores } from "./HighScores";
import { Logger } from "../utils/Logger";

export class Menu {
  private container: HTMLDivElement;
  private isVisible: boolean = true;
  private currentSelection: number = 0;
  private menuOptions: string[] = ["START GAME", "SETTINGS"];
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
      }

      /* We'll control the animation with JavaScript to sync with the music */
      .invader-up {
        transform: translateY(0);
      }

      .invader-down {
        transform: translateY(5px);
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
        this.activateCurrentOption();
      });
      menuSection.appendChild(menuOption);
    });

    // Copyright section
    const copyright = document.createElement("div");
    copyright.className = "copyright";

    // Create link instead of just text
    const copyrightLink = document.createElement("a");
    copyrightLink.href = "https://www.github.com/akolumbic/star-wing";
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

    // Setup keyboard navigation
    document.addEventListener("keydown", this.handleKeyDown.bind(this));
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isVisible) return;

    // Handle keyboard navigation
    switch (event.key) {
      case "ArrowUp":
        this.logger.info("Menu: Up arrow pressed");
        // Wrap around to bottom if at the top
        this.selectOption(
          this.currentSelection === 0
            ? this.menuOptions.length - 1
            : this.currentSelection - 1
        );
        event.preventDefault();
        break;
      case "ArrowDown":
        this.logger.info("Menu: Down arrow pressed");
        // Wrap around to top if at the bottom
        this.selectOption(
          (this.currentSelection + 1) % this.menuOptions.length
        );
        event.preventDefault();
        break;
      case "Enter":
      case " ":
        this.logger.info("Menu: Enter/Space pressed");
        this.activateCurrentOption();
        event.preventDefault();
        break;
    }
  }

  private selectOption(index: number): void {
    // Wrap around if index is out of bounds
    if (index < 0) index = this.menuOptions.length - 1;
    if (index >= this.menuOptions.length) index = 0;

    this.logger.info(
      `Menu: Selecting option ${index}: ${this.menuOptions[index]}`
    );

    // Remove selected class from all options
    const menuOptions = document.querySelectorAll(".menu-option");
    menuOptions.forEach((option) => option.classList.remove("selected"));

    // Add selected class to the new selection if it exists in the DOM
    if (index < menuOptions.length) {
      menuOptions[index].classList.add("selected");
    } else {
      this.logger.warn(`Menu: DOM element for option ${index} not found`);
      // If DOM doesn't match our options array, recreate the options
      this.recreateMenuOptions();
    }

    // Update the current selection
    this.currentSelection = index;
  }

  private updateMenuOptions(): void {
    // Main menu always has 2 options
    if (this.menuOptions.length !== 2) {
      this.menuOptions = ["START GAME", "SETTINGS"];
    }

    // Update the DOM elements if visible
    if (this.isVisible) {
      // Update the existing menu option elements text if they exist
      const menuOptionElements = document.querySelectorAll(".menu-option");
      if (menuOptionElements.length > 0) {
        menuOptionElements.forEach((element, index) => {
          if (index < this.menuOptions.length) {
            element.textContent = this.menuOptions[index];
          }
        });
      }
    }
  }

  /**
   * Recreates all menu options in the DOM based on the current menuOptions array
   */
  private recreateMenuOptions(): void {
    // Remove existing options
    const optionsContainer = document.querySelector(".menu-section");
    if (optionsContainer) {
      while (optionsContainer.firstChild) {
        optionsContainer.removeChild(optionsContainer.firstChild);
      }

      // Add updated options
      this.menuOptions.forEach((option, index) => {
        const menuOption = document.createElement("div");
        menuOption.className = "menu-option";
        menuOption.textContent = option;
        if (index === this.currentSelection) {
          menuOption.classList.add("selected");
        }

        // Add click event listener to each menu option
        menuOption.addEventListener("click", () => {
          this.activateCurrentOption();
        });

        // Add mouseover event to highlight the option
        menuOption.addEventListener("mouseover", () => {
          this.selectOption(index);
        });

        optionsContainer.appendChild(menuOption);
      });
    }
  }

  private activateCurrentOption(): void {
    const option = this.menuOptions[this.currentSelection];
    this.logger.info(`Activating menu option: ${option}`);

    switch (option) {
      case "START GAME":
        this.startGame();
        break;
      case "SETTINGS":
        this.showSettings();
        break;
      case "HIGH SCORES":
        this.highScores.show();
        this.hide();
        break;
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
   * Starts a new game.
   * Shows the text crawl, then hyperspace transition, then ship entry.
   */
  private startGame(): void {
    this.logger.info("Starting a new game sequence");
    this.hide();

    // Get important system references
    const uiSystem = this.game.getUISystem();
    const scene = this.game.getSceneSystem().getScene();
    const input = this.game.getInputSystem().getInput();

    // Ensure input is set on scene
    scene.setInput(input);
    this.logger.info("Setting input on scene for ship controls");

    // 1. Start with the text crawl
    uiSystem.showTextCrawl(() => {
      this.logger.info("Text crawl complete, initiating hyperspace transition");

      // 2. After text crawl completes, start hyperspace transition
      scene.transitionHyperspace(true, 2.0).then(() => {
        this.logger.info("Hyperspace transition complete, initializing ship");

        // 3. Initialize the player ship before starting entry animation
        scene
          .initPlayerShip()
          .then(() => {
            this.logger.info("Ship initialized, starting ship entry sequence");

            // 4. After ship is initialized, start ship entry
            scene.startShipEntry(() => {
              this.logger.info("Ship entry complete, game is now active");

              // Start layered music for level 1
              const audioManager = this.game.getAudioManager();
              this.logger.info("Starting layered music for level 1");
              audioManager.playLevelMusic("level1");

              // 5. Finally, start the game and show HUD
              this.game.start();
              uiSystem.showGameHUD();
            });
          })
          .catch((error) => {
            this.logger.error("Failed to initialize ship:", error);
          });
      });
    });
  }

  /**
   * Shows the development screen
   */
  private showDevelopmentScreen(): void {
    // Create overlay container
    const overlay = document.createElement("div");
    overlay.className = "dev-screen-overlay";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.display = "flex";
    overlay.style.flexDirection = "column";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.9)";
    overlay.style.zIndex = "1000";
    overlay.style.padding = "2rem";
    overlay.style.textAlign = "center";
    overlay.style.fontFamily = "'Press Start 2P', monospace";
    overlay.style.color = "#33ff99";

    // Create heading
    const heading = document.createElement("h1");
    heading.textContent = "IN DEVELOPMENT";
    heading.style.fontSize = "3rem";
    heading.style.marginBottom = "2rem";
    heading.style.textShadow = "0 0 10px #33ff99";
    heading.style.animation = "pulse 2s infinite";

    // Create message
    const message = document.createElement("p");
    message.textContent =
      "This portion of Star Wing is still under construction.";
    message.style.fontSize = "1.2rem";
    message.style.marginBottom = "1.5rem";
    message.style.maxWidth = "600px";

    // Create secondary message
    const subMessage = document.createElement("p");
    subMessage.textContent =
      "Check back soon for updates as development continues!";
    subMessage.style.fontSize = "1rem";
    subMessage.style.marginBottom = "3rem";
    subMessage.style.maxWidth = "600px";

    // Create back button
    const backButton = document.createElement("button");
    backButton.textContent = "RETURN TO MAIN MENU";
    backButton.style.padding = "1rem 2rem";
    backButton.style.backgroundColor = "transparent";
    backButton.style.border = "2px solid #33ff99";
    backButton.style.borderRadius = "4px";
    backButton.style.color = "#33ff99";
    backButton.style.fontSize = "1rem";
    backButton.style.fontFamily = "'Press Start 2P', monospace";
    backButton.style.cursor = "pointer";
    backButton.style.transition = "all 0.3s ease";
    backButton.style.outline = "none";

    // Hover effect
    backButton.addEventListener("mouseover", () => {
      backButton.style.backgroundColor = "#33ff99";
      backButton.style.color = "#000";
    });

    backButton.addEventListener("mouseout", () => {
      backButton.style.backgroundColor = "transparent";
      backButton.style.color = "#33ff99";
    });

    // Click handler
    backButton.addEventListener("click", () => {
      document.body.removeChild(overlay);
      this.show();
    });

    // Add pulse animation
    const style = document.createElement("style");
    style.textContent = `
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.7; }
        100% { opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    // Append elements to overlay
    overlay.appendChild(heading);
    overlay.appendChild(message);
    overlay.appendChild(subMessage);
    overlay.appendChild(backButton);

    // Add to document
    document.body.appendChild(overlay);
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

  /**
   * Shows the main menu (not in-game)
   */
  showMainMenu(): void {
    this.updateMenuOptions();
    // Force recreation of menu options
    this.recreateMenuOptions();
    this.show();
  }

  show(): void {
    // Update menu options before showing
    this.updateMenuOptions();

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
    // Stop invader animation
    this.stopInvaderBeatSync();

    document.body.removeChild(this.container);
    document.removeEventListener("keydown", this.handleKeyDown.bind(this));
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
