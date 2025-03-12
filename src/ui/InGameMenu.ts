import { Game } from "../core/Game";
import { Logger } from "../utils/Logger";
import { Settings } from "./Settings";
import { BackgroundType } from "../core/backgrounds/BackgroundManager";
import { TransitionScreen } from "./TransitionScreen";

/**
 * Handles the in-game pause menu with options specific to gameplay.
 * Separate from the main menu for cleaner transitions and state management.
 */
export class InGameMenu {
  private container: HTMLDivElement;
  private isVisible: boolean = false;
  private currentSelection: number = 0;
  private menuOptions: string[] = [
    "RESUME GAME",
    "SETTINGS",
    "RETURN TO MAIN MENU",
  ];
  private game: Game;
  private confirmationVisible: boolean = false;
  private confirmationContainer: HTMLDivElement;
  private disposed: boolean = false;
  private settings: Settings;

  /** Logger instance */
  private logger = Logger.getInstance();

  constructor(game: Game) {
    this.game = game;
    this.container = document.createElement("div");
    this.container.className = "terminal-overlay in-game-menu";
    this.setupStyles();
    this.setupMenu();

    // Initialize Settings
    this.settings = new Settings(game);
    this.settings.setOnCloseCallback(() => {
      // When settings are closed, show the in-game menu again
      this.show();
    });

    // Create the confirmation dialog but don't add to DOM yet
    this.confirmationContainer = document.createElement("div");
    this.confirmationContainer.className = "confirmation-dialog";
    this.setupConfirmationDialog();

    // Set up key event handler - bound to the instance to avoid memory leaks
    this.handleKeyDown = this.handleKeyDown.bind(this);
    document.addEventListener("keydown", this.handleKeyDown);

    // Mark as initially hidden
    this.isVisible = false;
    this.disposed = false;
    this.confirmationVisible = false;
  }

  private setupStyles(): void {
    const style = document.createElement("style");
    style.textContent = `
      .in-game-menu {
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
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background-color: rgba(0, 0, 0, 0.85);
      }
      
      .in-game-menu .menu-title {
        font-size: 28px;
        margin-bottom: 40px;
        text-align: center;
        color: #0f0;
        text-shadow: 0 0 10px #0f0;
      }
      
      .in-game-menu .menu-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
      }
      
      .in-game-menu .menu-option {
        font-size: 18px;
        padding: 10px 20px;
        margin: 10px 0;
        cursor: pointer;
        text-align: center;
        min-width: 300px;
        transition: all 0.2s ease;
      }
      
      .in-game-menu .menu-option.selected {
        color: #ff0;
        text-shadow: 0 0 10px #ff0;
        transform: scale(1.05);
      }
      
      .confirmation-dialog {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 450px;
        background-color: rgba(0, 0, 0, 0.9);
        border: 2px solid #0f0;
        box-shadow: 0 0 20px #0f0;
        padding: 20px;
        z-index: 1100;
        display: flex;
        flex-direction: column;
        align-items: center;
        font-family: 'PressStart2P', monospace;
      }
      
      .confirmation-dialog .confirmation-message {
        font-size: 16px;
        margin-bottom: 30px;
        text-align: center;
        color: #fff;
        line-height: 1.6;
      }
      
      .confirmation-dialog .confirmation-options {
        display: flex;
        justify-content: space-around;
        width: 100%;
      }
      
      .confirmation-dialog .confirmation-option {
        padding: 10px 15px;
        margin: 0 10px;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.2s ease;
        color: #fff;
        border: 1px solid #0f0;
        background-color: rgba(0, 0, 0, 0.5);
      }
      
      .confirmation-dialog .confirmation-option:hover {
        background-color: rgba(0, 255, 0, 0.2);
        color: #fff;
      }
      
      .confirmation-dialog .confirmation-option.selected {
        color: #ff0;
        text-shadow: 0 0 10px #ff0;
        background-color: rgba(255, 255, 0, 0.1);
        border-color: #ff0;
      }
    `;
    document.head.appendChild(style);
  }

  private setupMenu(): void {
    // Title
    const title = document.createElement("div");
    title.className = "menu-title";
    title.textContent = "PAUSED";
    this.container.appendChild(title);

    // Menu options section
    const menuSection = document.createElement("div");
    menuSection.className = "menu-section";
    this.container.appendChild(menuSection);

    // Create menu options
    this.menuOptions.forEach((option, index) => {
      const menuOption = document.createElement("div");
      menuOption.className = "menu-option";
      menuOption.textContent = option;
      if (index === this.currentSelection) {
        menuOption.classList.add("selected");
      }

      // Add mouseover event to highlight the option
      menuOption.addEventListener("mouseover", () => {
        this.selectOption(index);
      });

      // Add click event listener to each menu option
      menuOption.addEventListener("click", () => {
        this.activateCurrentOption();
      });

      menuSection.appendChild(menuOption);
    });
  }

  private setupConfirmationDialog(): void {
    // Clear any existing content
    while (this.confirmationContainer.firstChild) {
      this.confirmationContainer.removeChild(
        this.confirmationContainer.firstChild
      );
    }

    // Message
    const message = document.createElement("div");
    message.className = "confirmation-message";
    message.textContent =
      "Are you sure you want to end your game and return to the main menu?";
    this.confirmationContainer.appendChild(message);

    // Options container
    const optionsContainer = document.createElement("div");
    optionsContainer.className = "confirmation-options";
    this.confirmationContainer.appendChild(optionsContainer);

    // No option (selected by default)
    const noOption = document.createElement("div");
    noOption.className = "confirmation-option selected";
    noOption.textContent = "NO";
    noOption.dataset.action = "no";

    // Add mouseover/mouseout effects for better user experience
    noOption.addEventListener("mouseover", () => {
      // Remove selected class from all options
      document.querySelectorAll(".confirmation-option").forEach((option) => {
        option.classList.remove("selected");
      });
      // Add selected class to this option
      noOption.classList.add("selected");
    });

    // Add click handler for NO button
    noOption.addEventListener("click", () => {
      this.hideConfirmation();
    });
    optionsContainer.appendChild(noOption);

    // Yes option
    const yesOption = document.createElement("div");
    yesOption.className = "confirmation-option";
    yesOption.textContent = "YES";
    yesOption.dataset.action = "yes";

    // Add mouseover/mouseout effects for better user experience
    yesOption.addEventListener("mouseover", () => {
      // Remove selected class from all options
      document.querySelectorAll(".confirmation-option").forEach((option) => {
        option.classList.remove("selected");
      });
      // Add selected class to this option
      yesOption.classList.add("selected");
    });

    // Add click handler for YES button
    yesOption.addEventListener("click", () => {
      this.executeReturnToMainMenu();
    });
    optionsContainer.appendChild(yesOption);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    // Only handle key events when the menu is visible
    if (!this.isVisible) return;

    // Handle confirmation dialog navigation if it's visible
    if (this.confirmationVisible) {
      const options = document.querySelectorAll(".confirmation-option");
      const selected = document.querySelector(".confirmation-option.selected");
      let selectedIndex = Array.from(options).findIndex((option) =>
        option.classList.contains("selected")
      );

      switch (event.key) {
        case "ArrowLeft":
        case "ArrowRight":
          // Toggle between YES and NO
          options.forEach((option) => option.classList.remove("selected"));
          selectedIndex = selectedIndex === 0 ? 1 : 0;
          options[selectedIndex].classList.add("selected");
          break;
        case "Enter":
          // Process the selection
          if (selectedIndex === 0) {
            // NO selected - cancel and return to menu
            this.hideConfirmation();
          } else {
            // YES selected - return to main menu
            this.executeReturnToMainMenu();
          }
          break;
        case "Escape":
          // Cancel confirmation
          this.hideConfirmation();
          break;
      }
      return;
    }

    // Handle main menu navigation
    switch (event.key) {
      case "ArrowUp":
        this.selectOption(
          (this.currentSelection - 1 + this.menuOptions.length) %
            this.menuOptions.length
        );
        break;
      case "ArrowDown":
        this.selectOption(
          (this.currentSelection + 1) % this.menuOptions.length
        );
        break;
      case "Enter":
        this.activateCurrentOption();
        break;
      case "Escape":
        // Escape key resumes the game
        this.resumeGame();
        break;
    }
  }

  private selectOption(index: number): void {
    // Wrap around if index is out of bounds
    if (index < 0) index = this.menuOptions.length - 1;
    if (index >= this.menuOptions.length) index = 0;

    this.logger.debug(
      `Menu: Selecting option ${index}: ${this.menuOptions[index]}`
    );

    // Remove selected class from all options
    const menuOptions = document.querySelectorAll(".in-game-menu .menu-option");
    menuOptions.forEach((option) => option.classList.remove("selected"));

    // Update the current selection
    this.currentSelection = index;

    // Update the DOM to reflect the new selection
    menuOptions[this.currentSelection].classList.add("selected");
  }

  private activateCurrentOption(): void {
    const option = this.menuOptions[this.currentSelection];
    this.logger.info(`Activating menu option: ${option}`);

    switch (option) {
      case "RESUME GAME":
        this.resumeGame();
        break;
      case "SETTINGS":
        this.showSettings();
        break;
      case "RETURN TO MAIN MENU":
        this.showConfirmation();
        break;
    }
  }

  /**
   * Shows the confirmation dialog for returning to main menu
   */
  private showConfirmation(): void {
    if (this.confirmationVisible || this.disposed) return;

    // Ensure the confirmation container is in the DOM
    if (!this.confirmationContainer.parentNode) {
      document.body.appendChild(this.confirmationContainer);
    }

    this.confirmationVisible = true;
    this.confirmationContainer.style.display = "flex";
  }

  /**
   * Hides the confirmation dialog
   */
  private hideConfirmation(): void {
    if (!this.confirmationVisible) return;

    this.confirmationVisible = false;

    // Hide the container
    this.confirmationContainer.style.display = "none";

    // Remove from DOM
    if (this.confirmationContainer.parentNode) {
      this.confirmationContainer.parentNode.removeChild(
        this.confirmationContainer
      );
    }

    // Log the action
    this.logger.info("Confirmation dialog closed, returning to in-game menu");
  }

  /**
   * Resumes the game
   */
  private resumeGame(): void {
    this.hide();
    // Implementation removed as requested
    // We no longer call game.getUISystem().resumeGame()
  }

  /**
   * Shows the settings screen
   */
  private showSettings(): void {
    // Hide the in-game menu while showing settings
    this.container.style.display = "none";

    // Show the settings screen
    this.settings.show();

    this.logger.info("In-game menu: Showing settings");
  }

  /**
   * Handles returning to the main menu.
   * This includes cleaning up the game state and showing a transition screen.
   */
  private async executeReturnToMainMenu(): Promise<void> {
    this.logger.info("Executing return to main menu sequence");

    // Hide the in-game menu and confirmation
    this.hide();
    this.hideConfirmation();

    // Get the current scene from the game
    const scene = this.game.getSceneSystem().getScene();

    // Create and show the transition screen
    const transitionScreen = new TransitionScreen(scene);

    // Show the transition screen and wait for completion
    await new Promise<void>((resolve) => {
      transitionScreen.show(() => {
        // After transition is complete:
        // 1. Stop any game audio
        if (this.game.getAudioManager()) {
          this.game.getAudioManager().stopMusic();
        }

        // 2. Get the new scene that has the animation loop running
        const newScene = transitionScreen.getNewScene();
        if (newScene) {
          // Update the scene reference in the game's scene system
          this.game.getSceneSystem().dispose();

          // Set up the new scene
          newScene.setGame(this.game);
          newScene.init().then(() => {
            // 3. Show the main menu
            this.game.getUISystem().showMenu();
          });
        }

        // 4. Clean up the transition screen
        transitionScreen.dispose();

        resolve();
      });
    });

    this.logger.info("Return to main menu sequence complete");
  }

  /**
   * Shows the in-game menu
   */
  show(): void {
    if (this.disposed) return;

    // Ensure the menu container is in the DOM before showing
    if (!this.container.parentNode) {
      document.body.appendChild(this.container);
    }

    // Note: We do NOT add the confirmation container here
    // It should only be added when showConfirmation() is called

    this.container.style.display = "flex";
    this.isVisible = true;
    this.currentSelection = 0; // Reset selection to first option

    // Update visual selection
    const menuOptions = document.querySelectorAll(".in-game-menu .menu-option");
    if (menuOptions.length > 0) {
      menuOptions.forEach((option) => option.classList.remove("selected"));
      menuOptions[0].classList.add("selected");
    }

    this.logger.info("In-game menu displayed (paused)");
  }

  /**
   * Hides the in-game menu
   */
  hide(): void {
    if (!this.isVisible || this.disposed) return;

    this.isVisible = false;
    this.container.style.display = "none";
    this.hideConfirmation(); // Also hide confirmation if it's visible

    // Remove from DOM when hidden to prevent interference with other UI elements
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    if (this.confirmationContainer.parentNode) {
      this.confirmationContainer.parentNode.removeChild(
        this.confirmationContainer
      );
    }

    this.logger.info("In-game menu hidden and removed from DOM");
  }

  /**
   * Checks if the menu is currently visible
   */
  isMenuVisible(): boolean {
    return this.isVisible && !this.disposed;
  }

  /**
   * Cleans up resources
   */
  dispose(): void {
    if (this.disposed) return;

    // First hide all UI elements
    this.hide();
    this.hideConfirmation();

    // Dispose of settings if it exists
    if (this.settings) {
      this.settings.dispose();
    }

    // Remove all event listeners - use the bound handler reference
    document.removeEventListener("keydown", this.handleKeyDown);

    // Remove elements from DOM
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }

    if (this.confirmationContainer.parentNode) {
      this.confirmationContainer.parentNode.removeChild(
        this.confirmationContainer
      );
    }

    // Mark as disposed
    this.disposed = true;

    this.logger.info("In-game menu disposed");
  }
}
