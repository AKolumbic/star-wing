import { UISystem } from "../../../src/core/systems/UISystem";
import { Game } from "../../../src/core/Game";
import { Menu } from "../../../src/ui/Menu";
import { LoadingScreen } from "../../../src/ui/LoadingScreen";
import { TerminalBorder } from "../../../src/ui/TerminalBorder";
import { TextCrawl } from "../../../src/ui/TextCrawl";
import { GameHUD } from "../../../src/ui/GameHUD";
import { GameOverScreen } from "../../../src/ui/GameOverScreen";
import { ZoneComplete } from "../../../src/ui/ZoneComplete";
import { Logger } from "../../../src/utils/Logger";
import { Scene } from "../../../src/core/Scene";
import { AudioManager } from "../../../src/audio/AudioManager";
import { SceneSystem } from "../../../src/core/systems/SceneSystem";
import { RunState } from "../../../src/core/RunState";
import { Ship } from "../../../src/entities/Ship";
import { WeaponSystem } from "../../../src/weapons/WeaponSystem";

// Mock all dependencies
jest.mock("../../../src/core/Game");
jest.mock("../../../src/ui/Menu");
jest.mock("../../../src/ui/LoadingScreen");
jest.mock("../../../src/ui/TerminalBorder");
jest.mock("../../../src/ui/TextCrawl");
jest.mock("../../../src/ui/GameHUD");
jest.mock("../../../src/ui/GameOverScreen");
jest.mock("../../../src/ui/ZoneComplete");
jest.mock("../../../src/utils/Logger");

describe("UISystem", () => {
  let uiSystem: UISystem;
  let mockGame: jest.Mocked<Game>;
  let mockMenu: jest.Mocked<Menu>;
  let mockLoadingScreen: jest.Mocked<LoadingScreen>;
  let mockTerminalBorder: jest.Mocked<TerminalBorder>;
  let mockTextCrawl: jest.Mocked<TextCrawl>;
  let mockGameHUD: jest.Mocked<GameHUD>;
  let mockGameOverScreen: jest.Mocked<GameOverScreen>;
  let mockZoneComplete: jest.Mocked<ZoneComplete>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    // Enable fake timers
    jest.useFakeTimers();

    // Clear all mocks
    jest.clearAllMocks();

    // Create mock game instance
    mockGame = new Game("gameCanvas") as jest.Mocked<Game>;

    // Setup mock logger
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      getInstance: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<Logger>;
    (Logger as jest.Mocked<typeof Logger>).getInstance.mockReturnValue(
      mockLogger
    );

    // Setup mock TerminalBorder singleton
    mockTerminalBorder = {
      initialize: jest.fn(),
      dispose: jest.fn(),
      getInstance: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<TerminalBorder>;
    (
      TerminalBorder as jest.Mocked<typeof TerminalBorder>
    ).getInstance.mockReturnValue(mockTerminalBorder);

    // Create UI system instance
    uiSystem = new UISystem(mockGame);

    // Get references to mocked UI components
    mockMenu = (uiSystem as any).menu;
    mockTextCrawl = (uiSystem as any).textCrawl;
    mockGameHUD = (uiSystem as any).gameHUD;
    mockGameOverScreen = (uiSystem as any).gameOverScreen;
    mockZoneComplete = (uiSystem as any).zoneCompleteScreen;
  });

  afterEach(() => {
    // Restore real timers
    jest.useRealTimers();
  });

  describe("Initialization", () => {
    test("initializes with game reference", () => {
      expect(Menu).toHaveBeenCalledWith(mockGame);
      expect(TextCrawl).toHaveBeenCalledWith(mockGame);
      expect(GameHUD).toHaveBeenCalledWith(mockGame);
      expect(GameOverScreen).toHaveBeenCalledWith(mockGame);
      expect(ZoneComplete).toHaveBeenCalledWith(mockGame);
    });

    test("initializes terminal border on init", async () => {
      await uiSystem.init();
      expect(mockTerminalBorder.initialize).toHaveBeenCalled();
    });

    test("sets up escape key handler", () => {
      const addEventListenerSpy = jest.spyOn(document, "addEventListener");
      new UISystem(mockGame);
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "keydown",
        expect.any(Function)
      );
      addEventListenerSpy.mockRestore();
    });
  });

  describe("Resource Management", () => {
    test("disposes all UI components", () => {
      // Create loading screen before disposal
      uiSystem.showLoadingScreen(() => {});
      mockLoadingScreen = (uiSystem as any).loadingScreen;

      uiSystem.dispose();

      expect(mockLoadingScreen?.dispose).toHaveBeenCalled();
      expect(mockMenu.dispose).toHaveBeenCalled();
      expect(mockTextCrawl.dispose).toHaveBeenCalled();
      expect(mockGameHUD.dispose).toHaveBeenCalled();
      expect(mockGameOverScreen.dispose).toHaveBeenCalled();
      expect(mockZoneComplete.dispose).toHaveBeenCalled();
      expect(mockTerminalBorder.dispose).toHaveBeenCalled();
    });

    test("removes escape key handler on dispose", () => {
      const removeEventListenerSpy = jest.spyOn(
        document,
        "removeEventListener"
      );
      uiSystem.dispose();
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "keydown",
        expect.any(Function)
      );
      removeEventListenerSpy.mockRestore();
    });
  });

  describe("Menu Management", () => {
    test("shows main menu and cleans up game state", () => {
      // Mock scene and audio manager with proper typing
      const mockScene = {
        transitionHyperspace: jest.fn(),
        cleanupPlayerShip: jest.fn(),
        scene: {},
        camera: {},
        renderer: {},
        width: 800,
        height: 600,
        init: jest.fn(),
        update: jest.fn(),
        render: jest.fn(),
        dispose: jest.fn(),
        setGame: jest.fn(),
      } as unknown as Scene;

      const mockAudioManager = {
        stopMusic: jest.fn(),
        playMenuThump: jest.fn(),
        contextManager: {},
        bufferManager: {},
        musicPlayer: {},
        sfxPlayer: {},
        initialize: jest.fn(),
        dispose: jest.fn(),
        setVolume: jest.fn(),
        getVolume: jest.fn(),
        toggleMute: jest.fn(),
      } as unknown as AudioManager;

      const mockSceneSystem = {
        scene: mockScene,
        game: mockGame,
        init: jest.fn(),
        update: jest.fn(),
        dispose: jest.fn(),
        getScene: () => mockScene,
      } as unknown as SceneSystem;

      mockGame.getSceneSystem.mockReturnValue(mockSceneSystem);
      mockGame.getAudioManager.mockReturnValue(mockAudioManager);
      mockGame.isDevMode.mockReturnValue(false);

      uiSystem.showMenu();

      expect(mockScene.transitionHyperspace).toHaveBeenCalledWith(false, 1.0);
      expect(mockScene.cleanupPlayerShip).toHaveBeenCalled();
      expect(mockAudioManager.stopMusic).toHaveBeenCalledWith(0.5);
      expect(mockMenu.showMainMenu).toHaveBeenCalled();
      expect(mockGameHUD.hide).toHaveBeenCalled();
    });

    test("shows in-game menu and pauses game", () => {
      uiSystem.showInGameMenu();
      expect(mockGame.pause).toHaveBeenCalled();
      expect(mockMenu.showInGameMenu).toHaveBeenCalled();
      expect(mockGameHUD.hide).toHaveBeenCalled();
    });

    test("resumes game from menu", () => {
      uiSystem.resumeGame();
      expect(mockMenu.hide).toHaveBeenCalled();
      expect(mockGameHUD.show).toHaveBeenCalled();
      expect(mockGame.resume).toHaveBeenCalled();
    });
  });

  describe("HUD Management", () => {
    test("updates HUD data correctly", () => {
      uiSystem.updateHUDData(80, 100, 50, 100, 1000, 1, 2, 3);
      expect(mockGameHUD.setHealth).toHaveBeenCalledWith(80, 100);
      expect(mockGameHUD.setShield).toHaveBeenCalledWith(50, 100);
      expect(mockGameHUD.setScore).toHaveBeenCalledWith(1000);
      expect(mockGameHUD.setZoneInfo).toHaveBeenCalledWith(1, 2, 3);
    });

    test("updates weapon cooldowns", () => {
      uiSystem.updateWeaponCooldowns(0.5, 0.75);
      expect(mockGameHUD.setWeaponCooldowns).toHaveBeenCalledWith(0.5, 0.75);
    });

    test("manages HUD warnings", () => {
      uiSystem.showHUDWarning("Low Health");
      expect(mockGameHUD.showWarning).toHaveBeenCalledWith("Low Health");

      uiSystem.hideHUDWarning();
      expect(mockGameHUD.hideWarning).toHaveBeenCalled();
    });
  });

  describe("Game State Transitions", () => {
    test("handles game over transition", () => {
      uiSystem.showGameOver();
      expect(mockGameHUD.hide).toHaveBeenCalled();
      expect(mockGameOverScreen.show).toHaveBeenCalled();
    });

    test("handles game restart", () => {
      // Mock scene with proper typing
      const mockScene = {
        transitionHyperspace: jest.fn(),
        resetGame: jest.fn(),
        scene: {},
        camera: {},
        renderer: {},
        width: 800,
        height: 600,
        init: jest.fn(),
        update: jest.fn(),
        render: jest.fn(),
        dispose: jest.fn(),
        setGame: jest.fn(),
      } as unknown as Scene;

      const mockSceneSystem = {
        scene: mockScene,
        game: mockGame,
        init: jest.fn(),
        update: jest.fn(),
        dispose: jest.fn(),
        getScene: () => mockScene,
      } as unknown as SceneSystem;

      mockGame.getSceneSystem.mockReturnValue(mockSceneSystem);

      uiSystem.restartGame();

      expect(mockGameOverScreen.hide).toHaveBeenCalled();
      expect(mockScene.transitionHyperspace).toHaveBeenCalledWith(true, 1.0);
      expect(mockScene.resetGame).toHaveBeenCalled();

      // Advance timers by 1000ms (the setTimeout delay)
      jest.advanceTimersByTime(1000);

      // Now the HUD should be shown
      expect(mockGameHUD.show).toHaveBeenCalled();
    });

    test("handles zone completion", () => {
      // Create mock objects for the new signature
      const mockRunState = {
        generateUpgradeChoices: jest.fn().mockReturnValue([]),
        canReroll: jest.fn().mockReturnValue(false),
        getCollectedUpgrades: jest.fn().mockReturnValue([]),
      } as unknown as RunState;

      const mockShip = {
        getHealth: jest.fn().mockReturnValue(100),
        getMaxHealth: jest.fn().mockReturnValue(100),
        getShield: jest.fn().mockReturnValue(100),
        getMaxShield: jest.fn().mockReturnValue(100),
      } as unknown as Ship;

      const mockWeaponSystem = {
        getPrimaryWeapon: jest.fn().mockReturnValue(null),
        getSecondaryWeapon: jest.fn().mockReturnValue(null),
      } as unknown as WeaponSystem;

      const mockCallback = jest.fn();

      uiSystem.showZoneComplete(
        mockRunState,
        mockShip,
        mockWeaponSystem,
        1,
        2,
        mockCallback
      );
      expect(mockZoneComplete.show).toHaveBeenCalledWith(
        mockRunState,
        mockShip,
        mockWeaponSystem,
        1,
        2,
        mockCallback
      );

      uiSystem.hideZoneComplete();
      expect(mockZoneComplete.hide).toHaveBeenCalled();
    });
  });

  describe("Combat Log", () => {
    test("adds combat log messages", () => {
      uiSystem.addCombatLogMessage("Enemy destroyed", "success");
      expect(mockGameHUD.addCombatLogMessage).toHaveBeenCalledWith(
        "Enemy destroyed",
        "success"
      );
    });

    test("handles special combat log messages", () => {
      uiSystem.addCombatLogMessage("ZONE CLEARED");
      expect(mockLogger.info).toHaveBeenCalledWith("UISystem: ZONE CLEARED");
      expect(mockGameHUD.addCombatLogMessage).toHaveBeenCalledWith(
        "ZONE CLEARED",
        undefined
      );
    });
  });

  describe("Event Handling", () => {
    test("handles escape key during gameplay", () => {
      // Simulate game being active
      (uiSystem as any).gameActive = true;

      // Simulate escape key press
      const escapeEvent = new KeyboardEvent("keydown", { key: "Escape" });
      document.dispatchEvent(escapeEvent);

      // Should show in-game menu if menu not visible
      expect(mockMenu.isMenuVisible).toHaveBeenCalled();
      expect(mockGame.pause).toHaveBeenCalled();
    });

    test("ignores escape key when game is not active", () => {
      // Simulate game being inactive
      (uiSystem as any).gameActive = false;

      // Simulate escape key press
      const escapeEvent = new KeyboardEvent("keydown", { key: "Escape" });
      document.dispatchEvent(escapeEvent);

      // Should not show menu or pause game
      expect(mockGame.pause).not.toHaveBeenCalled();
      expect(mockMenu.showInGameMenu).not.toHaveBeenCalled();
    });
  });
});
