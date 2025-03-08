import { GameOverScreen } from "../../../src/ui/GameOverScreen";
import { Game } from "../../../src/core/Game";
import { Scene } from "../../../src/core/Scene";
import { Logger } from "../../../src/utils/Logger";
import { AudioManager } from "../../../src/audio/AudioManager";

// Mock dependencies
jest.mock("../../../src/core/Game");
jest.mock("../../../src/core/Scene");
jest.mock("../../../src/utils/Logger");
jest.mock("../../../src/audio/AudioManager");

describe("GameOverScreen", () => {
  let mockGame: jest.Mocked<Game>;
  let mockScene: jest.Mocked<Scene>;
  let mockLogger: jest.Mocked<Logger>;
  let mockAudioManager: jest.Mocked<AudioManager>;
  let gameOverScreen: GameOverScreen;

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

    // Setup scene mock
    mockScene = {
      transitionHyperspace: jest.fn(),
      cleanupPlayerShip: jest.fn(),
    } as unknown as jest.Mocked<Scene>;

    // Setup audio manager mock
    mockAudioManager = {
      stopMusic: jest.fn(),
    } as unknown as jest.Mocked<AudioManager>;

    // Setup game mock with UISystem
    const mockUISystem = {
      restartGame: jest.fn(),
      showMenu: jest.fn(),
    };

    mockGame = {
      getSceneSystem: jest.fn().mockReturnValue({
        getScene: jest.fn().mockReturnValue(mockScene),
      }),
      getAudioManager: jest.fn().mockReturnValue(mockAudioManager),
      getUISystem: jest.fn().mockReturnValue(mockUISystem),
    } as unknown as jest.Mocked<Game>;

    // Create GameOverScreen instance
    gameOverScreen = new GameOverScreen(mockGame);
  });

  afterEach(() => {
    // Clean up the DOM
    document.body.innerHTML = "";
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe("Initialization", () => {
    test("creates game over screen with correct structure", () => {
      const container = document.querySelector("div");
      expect(container).toBeTruthy();
      expect(container?.style.position).toBe("fixed");
      expect(container?.style.display).toBe("none");

      // Check for main elements
      expect(document.querySelector("h1")?.textContent).toBe("SYSTEM FAILURE");
      expect(document.querySelectorAll("button").length).toBe(2);
      expect(document.querySelector("button")?.textContent).toBe(
        "RESTART MISSION"
      );
      expect(document.querySelectorAll("button")[1]?.textContent).toBe(
        "RETURN TO MAIN MENU"
      );
    });

    test("initializes with correct styles", () => {
      const container = document.querySelector("div");
      expect(container?.style.backgroundColor).toBe("rgba(0, 0, 0, 0.85)");
      expect(container?.style.color).toBe("rgb(255, 0, 0)");
      expect(container?.style.zIndex).toBe("9999");
    });
  });

  describe("Visibility Control", () => {
    test("shows game over screen", () => {
      gameOverScreen.show();

      const container = document.querySelector("div");
      expect(container?.style.display).toBe("flex");
      expect(container?.style.opacity).toBe("1");
      expect(mockLogger.info).toHaveBeenCalledWith("Showing Game Over screen");

      // Verify flash effect was created
      const flash = document.querySelector(
        "div[style*='background-color: rgb(255, 0, 0)']"
      );
      expect(flash).toBeTruthy();

      // Verify flash is removed after animation
      jest.advanceTimersByTime(600);
      expect(
        document.querySelector("div[style*='background-color: rgb(255, 0, 0)']")
      ).toBeFalsy();
    });

    test("hides game over screen", () => {
      // Show first
      gameOverScreen.show();
      jest.advanceTimersByTime(100); // Wait for show animation

      // Then hide
      gameOverScreen.hide();

      const container = document.querySelector("div");
      expect(container?.style.opacity).toBe("0");
      expect(mockLogger.info).toHaveBeenCalledWith("Hiding Game Over screen");

      // Advance timers to verify display none
      jest.advanceTimersByTime(1000);
      expect(container?.style.display).toBe("none");
    });

    test("prevents multiple show calls", () => {
      gameOverScreen.show();
      const initialCallCount = mockLogger.info.mock.calls.length;

      gameOverScreen.show();
      expect(mockLogger.info).toHaveBeenCalledTimes(initialCallCount);
    });

    test("prevents multiple hide calls", () => {
      gameOverScreen.hide();
      const initialCallCount = mockLogger.info.mock.calls.length;

      gameOverScreen.hide();
      expect(mockLogger.info).toHaveBeenCalledTimes(initialCallCount);
    });
  });

  describe("Button Interactions", () => {
    test("handles restart button click", () => {
      const restartButton = document.querySelector("button");
      restartButton?.click();

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Game Over: Restart game requested"
      );

      // Advance timer to verify restart call
      jest.advanceTimersByTime(500);
      expect(mockGame.getUISystem().restartGame).toHaveBeenCalled();
    });

    test("handles main menu button click", () => {
      const menuButton = document.querySelectorAll("button")[1];
      menuButton?.click();

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Game Over: Return to main menu requested"
      );
      expect(mockScene.transitionHyperspace).toHaveBeenCalledWith(false, 1.0);
      expect(mockAudioManager.stopMusic).toHaveBeenCalledWith(0.5);
      expect(mockScene.cleanupPlayerShip).toHaveBeenCalled();

      // Advance timer to verify menu shown
      jest.advanceTimersByTime(1000);
      expect(mockGame.getUISystem().showMenu).toHaveBeenCalled();
    });

    test("handles button hover effects", () => {
      const button = document.querySelector("button");

      // Trigger mouseover
      button?.dispatchEvent(new MouseEvent("mouseover"));
      expect(button?.style.backgroundColor).toBe("rgba(255, 0, 0, 0.2)");
      expect(button?.style.transform).toBe("scale(1.05)");

      // Trigger mouseout
      button?.dispatchEvent(new MouseEvent("mouseout"));
      expect(button?.style.backgroundColor).toBe("transparent");
      expect(button?.style.transform).toBe("scale(1)");
    });
  });

  describe("Resource Management", () => {
    test("disposes resources properly", () => {
      const container = document.querySelector("div");
      gameOverScreen.dispose();
      expect(document.body.contains(container)).toBe(false);
    });

    test("handles dispose when container is already removed", () => {
      const container = document.querySelector("div");
      container?.parentNode?.removeChild(container);

      // Should not throw error
      expect(() => gameOverScreen.dispose()).not.toThrow();
    });
  });
});
