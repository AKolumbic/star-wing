import { Menu } from "../../../src/ui/Menu";
import { Game } from "../../../src/core/Game";
import { Logger } from "../../../src/utils/Logger";
import { Settings } from "../../../src/ui/Settings";
import { HighScores } from "../../../src/ui/HighScores";

// Mock dependencies
jest.mock("../../../src/utils/Logger");
jest.mock("../../../src/ui/Settings");
jest.mock("../../../src/ui/HighScores");
jest.mock("../../../src/core/Game");

describe("Menu", () => {
  let mockLogger: jest.Mocked<Logger>;
  let mockGame: jest.Mocked<Game>;
  let menu: Menu;

  beforeEach(() => {
    // Enable fake timers
    jest.useFakeTimers();

    // Setup logger mock
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      getInstance: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<Logger>;
    (Logger as jest.Mocked<typeof Logger>).getInstance.mockReturnValue(
      mockLogger
    );

    // Setup game mock with required systems
    mockGame = {
      getUISystem: jest.fn().mockReturnValue({
        showTextCrawl: jest.fn(),
        showGameHUD: jest.fn(),
        resumeGame: jest.fn(),
      }),
      getSceneSystem: jest.fn().mockReturnValue({
        getScene: jest.fn().mockReturnValue({
          setInput: jest.fn(),
          transitionHyperspace: jest.fn().mockResolvedValue(undefined),
          initPlayerShip: jest.fn().mockResolvedValue(undefined),
          startShipEntry: jest.fn(),
        }),
      }),
      getInputSystem: jest.fn().mockReturnValue({
        getInput: jest.fn(),
      }),
      getAudioManager: jest.fn().mockReturnValue({
        playLevelMusic: jest.fn(),
      }),
      start: jest.fn(),
    } as unknown as jest.Mocked<Game>;

    // Create Menu instance
    menu = new Menu(mockGame);
  });

  afterEach(() => {
    // Clean up the DOM
    document.body.innerHTML = "";
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe("Initialization", () => {
    test("creates menu with correct structure", () => {
      // Check for main container
      const container = document.querySelector(
        ".terminal-overlay"
      ) as HTMLDivElement;
      expect(container).toBeTruthy();
      expect(container.className).toBe("terminal-overlay");

      // Check for viewport
      const viewport = container.querySelector(".terminal-viewport");
      expect(viewport).toBeTruthy();

      // Check for content container
      const content = container.querySelector(".content-container");
      expect(content).toBeTruthy();
      if (!content) throw new Error("Content container not found");
      expect(content.classList.contains("screen-flicker")).toBe(true);

      // Check for title section
      const titleSection = content.querySelector(".title-section");
      expect(titleSection).toBeTruthy();
      if (!titleSection) throw new Error("Title section not found");
      const title = titleSection.querySelector(".game-title");
      expect(title?.textContent).toBe("STAR WING");

      // Check for invaders row
      const invadersRow = titleSection.querySelector(".title-invaders");
      expect(invadersRow).toBeTruthy();
      if (!invadersRow) throw new Error("Invaders row not found");
      const invaders = invadersRow.querySelectorAll(".invader");
      expect(invaders?.length).toBe(5);

      // Check for menu section
      const menuSection = content.querySelector(".menu-section");
      expect(menuSection).toBeTruthy();
      if (!menuSection) throw new Error("Menu section not found");
      const menuOptions = menuSection.querySelectorAll(".menu-option");
      expect(menuOptions?.length).toBe(2); // START GAME and SETTINGS
      expect(menuOptions?.[0].textContent).toBe("START GAME");
      expect(menuOptions?.[1].textContent).toBe("SETTINGS");

      // Check for copyright section
      const copyright = content.querySelector(".copyright");
      expect(copyright).toBeTruthy();
      const copyrightLink = copyright?.querySelector("a");
      expect(copyrightLink?.href).toBe(
        "https://www.github.com/akolumbic/star-wing"
      );
      expect(copyrightLink?.textContent).toBe("© 2025 DROSSHOLE");
    });

    test("initializes with first menu option selected", () => {
      const selectedOption = document.querySelector(".menu-option.selected");
      expect(selectedOption).toBeTruthy();
      expect(selectedOption?.textContent).toBe("START GAME");
    });
  });

  describe("Menu Navigation", () => {
    test("handles arrow key navigation", () => {
      // Get menu options
      const menuOptions = document.querySelectorAll(".menu-option");
      const firstOption = menuOptions[0];
      const secondOption = menuOptions[1];

      // Initially first option should be selected
      expect(firstOption.classList.contains("selected")).toBe(true);
      expect(secondOption.classList.contains("selected")).toBe(false);

      // Press down arrow
      const downEvent = new KeyboardEvent("keydown", { key: "ArrowDown" });
      document.dispatchEvent(downEvent);

      // Second option should now be selected
      expect(firstOption.classList.contains("selected")).toBe(false);
      expect(secondOption.classList.contains("selected")).toBe(true);

      // Press up arrow
      const upEvent = new KeyboardEvent("keydown", { key: "ArrowUp" });
      document.dispatchEvent(upEvent);

      // First option should be selected again
      expect(firstOption.classList.contains("selected")).toBe(true);
      expect(secondOption.classList.contains("selected")).toBe(false);
    });

    test("wraps around when navigating past edges", () => {
      const menuOptions = document.querySelectorAll(".menu-option");
      const firstOption = menuOptions[0];
      const lastOption = menuOptions[menuOptions.length - 1];

      // Press up arrow from first option
      const upEvent = new KeyboardEvent("keydown", { key: "ArrowUp" });
      document.dispatchEvent(upEvent);

      // Should wrap to last option
      expect(firstOption.classList.contains("selected")).toBe(false);
      expect(lastOption.classList.contains("selected")).toBe(true);

      // Press down arrow from last option
      const downEvent = new KeyboardEvent("keydown", { key: "ArrowDown" });
      document.dispatchEvent(downEvent);

      // Should wrap to first option
      expect(firstOption.classList.contains("selected")).toBe(true);
      expect(lastOption.classList.contains("selected")).toBe(false);
    });
  });

  describe("Menu Actions", () => {
    test("handles start game selection", () => {
      // Select START GAME and press Enter
      const enterEvent = new KeyboardEvent("keydown", { key: "Enter" });
      document.dispatchEvent(enterEvent);

      // Verify game start sequence
      const uiSystem = mockGame.getUISystem();
      expect(uiSystem.showTextCrawl).toHaveBeenCalled();

      // Menu should be hidden
      const container = document.querySelector(
        ".terminal-overlay"
      ) as HTMLDivElement;
      expect(container.style.display).toBe("none");
    });

    test("handles settings selection", () => {
      // Navigate to SETTINGS
      const downEvent = new KeyboardEvent("keydown", { key: "ArrowDown" });
      document.dispatchEvent(downEvent);

      // Press Enter
      const enterEvent = new KeyboardEvent("keydown", { key: "Enter" });
      document.dispatchEvent(enterEvent);

      // Menu should be hidden
      const container = document.querySelector(
        ".terminal-overlay"
      ) as HTMLDivElement;
      expect(container.style.display).toBe("none");

      // Settings mock should be called
      expect(Settings.prototype.show).toHaveBeenCalled();
    });
  });

  describe("Menu State", () => {
    test("toggles between main menu and in-game menu", () => {
      // Initially should be main menu
      const startOption = document.querySelector(".menu-option");
      expect(startOption?.textContent).toBe("START GAME");

      // Switch to in-game menu
      menu.showInGameMenu();
      expect(startOption?.textContent).toBe("RESUME GAME");

      // Switch back to main menu
      menu.showMainMenu();
      expect(startOption?.textContent).toBe("START GAME");
    });

    test("handles visibility state correctly", () => {
      expect(menu.isMenuVisible()).toBe(true);

      menu.hide();
      expect(menu.isMenuVisible()).toBe(false);

      menu.show();
      expect(menu.isMenuVisible()).toBe(true);
    });
  });

  describe("Resource Management", () => {
    test("cleans up resources on dispose", () => {
      const container = document.querySelector(".terminal-overlay");
      expect(container).toBeTruthy();

      menu.dispose();

      // Container should be removed from DOM
      expect(document.body.contains(container)).toBe(false);

      // Settings and HighScores should be disposed
      expect(Settings.prototype.dispose).toHaveBeenCalled();
      expect(HighScores.prototype.dispose).toHaveBeenCalled();
    });
  });
});
