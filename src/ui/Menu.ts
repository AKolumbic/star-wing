import { Game } from "../core/Game";
import { Settings } from "./Settings";
import { HighScores } from "./HighScores";

export class Menu {
  private container: HTMLDivElement;
  private isVisible: boolean = true;
  private currentSelection: number = 0;
  private menuOptions: string[] = ["START GAME", "SETTINGS", "HIGH SCORES"];
  private settings: Settings;
  private highScores: HighScores;
  private game: Game;

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
        console.log("[DEBUG] Running UI diagnostics...");

        // Log all elements with high z-indexes
        const highZElements = Array.from(document.querySelectorAll("*")).filter(
          (el) => {
            const style = window.getComputedStyle(el);
            const zIndex = parseInt(style.zIndex);
            return !isNaN(zIndex) && zIndex > 100;
          }
        );

        console.log("[DEBUG] Elements with high z-index:", highZElements);

        // Toggle menu background to see if that's the issue
        if (this.container.style.backgroundColor) {
          console.log("[DEBUG] Setting menu background to transparent");
          this.container.style.backgroundColor = "transparent";
        } else {
          console.log("[DEBUG] Restoring menu background");
          this.container.style.backgroundColor = "rgba(0, 0, 0, 0.85)";
        }
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
          console.log("[Menu] START GAME clicked");
          this.showDevelopmentPlaceholder();
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

  private activateCurrentOption(): void {
    const selectedOption = this.menuOptions[this.currentSelection];
    if (selectedOption === "START GAME") {
      console.log("[Menu] START GAME activated via keyboard");
      this.showDevelopmentPlaceholder();
    } else if (selectedOption === "SETTINGS") {
      this.showSettings();
    } else if (selectedOption === "HIGH SCORES") {
      this.showHighScores();
    }
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
   * Shows a placeholder "In Development" message when START GAME is selected
   */
  private showDevelopmentPlaceholder(): void {
    // Hide the regular menu options
    const menuSection = document.querySelector(".menu-section") as HTMLElement;
    if (menuSection) {
      menuSection.style.display = "none";
    }

    // Get the content container
    const contentContainer = document.querySelector(
      ".content-container"
    ) as HTMLElement;
    if (!contentContainer) return;

    // Create the placeholder container
    const placeholderContainer = document.createElement("div");
    placeholderContainer.className = "development-placeholder";
    placeholderContainer.style.display = "flex";
    placeholderContainer.style.flexDirection = "column";
    placeholderContainer.style.alignItems = "center";
    placeholderContainer.style.justifyContent = "center";
    placeholderContainer.style.textAlign = "center";
    placeholderContainer.style.marginTop = "2rem";

    // Create main message
    const mainMessage = document.createElement("div");
    mainMessage.textContent = "IN DEVELOPMENT";
    mainMessage.style.color = "#ff0";
    mainMessage.style.fontSize = "2rem";
    mainMessage.style.fontWeight = "bold";
    mainMessage.style.marginBottom = "1rem";
    mainMessage.style.textShadow = "0 0 10px rgba(255, 255, 0, 0.7)";
    mainMessage.style.animation = "pulse 1.5s infinite alternate";

    // Create sub message
    const subMessage = document.createElement("div");
    subMessage.textContent = "COMING SOON";
    subMessage.style.color = "#0f0";
    subMessage.style.fontSize = "1.5rem";
    subMessage.style.marginBottom = "2rem";

    // Create back button
    const backButton = document.createElement("div");
    backButton.textContent = "BACK TO MENU";
    backButton.style.color = "#fff";
    backButton.style.fontSize = "1.2rem";
    backButton.style.padding = "10px 20px";
    backButton.style.border = "2px solid #fff";
    backButton.style.cursor = "pointer";
    backButton.style.marginTop = "3rem";
    backButton.style.transition = "all 0.2s";

    // Add hover effect
    backButton.addEventListener("mouseover", () => {
      backButton.style.color = "#0f0";
      backButton.style.borderColor = "#0f0";
      backButton.style.textShadow = "0 0 5px rgba(0, 255, 0, 0.7)";
      backButton.style.boxShadow = "0 0 15px rgba(0, 255, 0, 0.5)";
    });

    backButton.addEventListener("mouseout", () => {
      backButton.style.color = "#fff";
      backButton.style.borderColor = "#fff";
      backButton.style.textShadow = "none";
      backButton.style.boxShadow = "none";
    });

    // Add click handler
    backButton.addEventListener("click", () => {
      // Remove the placeholder
      contentContainer.removeChild(placeholderContainer);

      // Show the menu again
      if (menuSection) {
        menuSection.style.display = "flex";
      }
    });

    // Append elements
    placeholderContainer.appendChild(mainMessage);
    placeholderContainer.appendChild(subMessage);
    placeholderContainer.appendChild(backButton);
    contentContainer.appendChild(placeholderContainer);
  }

  show(): void {
    this.container.style.display = "flex";
    this.isVisible = true;
  }

  hide(): void {
    console.log("[Menu] Hiding menu");
    this.container.style.display = "none";
    this.isVisible = false;
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
