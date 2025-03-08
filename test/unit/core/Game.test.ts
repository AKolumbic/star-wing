import { Game } from "../../../src/core/Game";
import { GameSystem } from "../../../src/core/GameSystem";
import { GameLoop } from "../../../src/core/GameLoop";
import { SceneSystem } from "../../../src/core/systems/SceneSystem";
import { InputSystem } from "../../../src/core/systems/InputSystem";
import { AudioSystem } from "../../../src/core/systems/AudioSystem";
import { UISystem } from "../../../src/core/systems/UISystem";
import { Logger } from "../../../src/utils/Logger";
import { AudioManager } from "../../../src/audio/AudioManager";

// Mock all dependencies
jest.mock("../../../src/core/GameLoop");
jest.mock("../../../src/core/systems/SceneSystem");
jest.mock("../../../src/core/systems/InputSystem");
jest.mock("../../../src/core/systems/AudioSystem");
jest.mock("../../../src/core/systems/UISystem");
jest.mock("../../../src/utils/Logger");
jest.mock("../../../src/audio/AudioManager");

describe("Game", () => {
  let game: Game;
  let mockCanvas: HTMLCanvasElement;
  let mockLogger: jest.Mocked<Logger>;
  let mockAudioManager: jest.Mocked<AudioManager>;
  let mockUISystem: jest.Mocked<UISystem>;
  let mockAudioSystem: jest.Mocked<AudioSystem>;
  let mockSceneSystem: jest.Mocked<SceneSystem>;
  let mockGameLoop: jest.Mocked<GameLoop>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock canvas
    mockCanvas = document.createElement("canvas");
    mockCanvas.id = "gameCanvas";
    document.body.appendChild(mockCanvas);

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

    // Setup AudioManager mock
    mockAudioManager = {
      getMuteState: jest.fn().mockReturnValue(false),
      toggleMute: jest.fn(),
      canPlayAudio: jest.fn().mockReturnValue(true),
      getAudioContext: jest.fn().mockReturnValue({ state: "running" }),
      tryResumeAudioContext: jest.fn().mockResolvedValue(true),
      isAudioPlaying: jest.fn().mockReturnValue(false),
    } as unknown as jest.Mocked<AudioManager>;

    // Setup UISystem mock
    mockUISystem = {
      init: jest.fn().mockResolvedValue(undefined),
      showLoadingScreen: jest.fn(),
      hideGameHUD: jest.fn(),
      showTerminalBorder: jest.fn(),
      hideTerminalBorder: jest.fn(),
      dispose: jest.fn(),
      showMenu: jest.fn(),
      isMenuVisible: jest.fn().mockReturnValue(false),
    } as unknown as jest.Mocked<UISystem>;
    (UISystem as unknown as jest.Mock).mockImplementation(() => mockUISystem);

    // Setup AudioSystem mock
    mockAudioSystem = {
      init: jest.fn().mockResolvedValue(undefined),
      getAudioManager: jest.fn().mockReturnValue(mockAudioManager),
      dispose: jest.fn(),
      playMenuThump: jest.fn(),
    } as unknown as jest.Mocked<AudioSystem>;
    (AudioSystem as unknown as jest.Mock).mockImplementation(
      () => mockAudioSystem
    );

    // Setup SceneSystem mock
    mockSceneSystem = {
      init: jest.fn().mockResolvedValue(undefined),
      dispose: jest.fn(),
      getScene: jest.fn().mockReturnValue({
        setInput: jest.fn(),
        initPlayerShip: jest.fn().mockResolvedValue(undefined),
        skipShipEntry: jest.fn(),
        transitionHyperspace: jest.fn(),
      }),
    } as unknown as jest.Mocked<SceneSystem>;
    (SceneSystem as unknown as jest.Mock).mockImplementation(
      () => mockSceneSystem
    );

    // Setup GameLoop mock
    mockGameLoop = {
      start: jest.fn(),
      stop: jest.fn(),
      setPaused: jest.fn(),
    } as unknown as jest.Mocked<GameLoop>;
    (GameLoop as jest.Mock).mockImplementation(() => mockGameLoop);
  });

  afterEach(() => {
    // Clean up DOM
    document.body.removeChild(mockCanvas);
    if (game) {
      game.dispose();
    }
  });

  describe("Initialization", () => {
    test("creates game instance with valid canvas ID", () => {
      game = new Game("gameCanvas");
      expect(game).toBeDefined();
      expect(SceneSystem).toHaveBeenCalled();
      expect(InputSystem).toHaveBeenCalled();
      expect(AudioSystem).toHaveBeenCalled();
      expect(UISystem).toHaveBeenCalled();
    });

    test("throws error with invalid canvas ID", () => {
      expect(() => new Game("invalidCanvas")).toThrow(
        "Canvas with id invalidCanvas not found"
      );
    });

    test("initializes in dev mode correctly", async () => {
      game = new Game("gameCanvas", true);
      expect(game.isDevMode()).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(
        "DEV MODE: Skipping intro loading screen and menu"
      );
    });

    test("initializes with dev audio enabled", async () => {
      game = new Game("gameCanvas", true, true);

      // Wait for all promises to resolve
      await Promise.resolve();
      await new Promise(process.nextTick);

      // The scene's initPlayerShip is called during dev mode initialization
      await mockSceneSystem.getScene().initPlayerShip();

      expect(mockLogger.info).toHaveBeenCalledWith(
        "DEV MODE: Audio enabled via enableDevAudio parameter"
      );
    });
  });

  describe("System Management", () => {
    beforeEach(() => {
      game = new Game("gameCanvas", true); // Use dev mode to skip loading screen
    });

    test("gets audio system instance", () => {
      const audioSystem = game.getAudioSystem();
      expect(audioSystem).toBe(mockAudioSystem);
    });

    test("gets UI system instance", () => {
      const uiSystem = game.getUISystem();
      expect(uiSystem).toBe(mockUISystem);
    });

    test("gets scene system instance", () => {
      const sceneSystem = game.getSceneSystem();
      expect(sceneSystem).toBe(mockSceneSystem);
    });

    test("gets input system instance", () => {
      const inputSystem = game.getInputSystem();
      expect(inputSystem).toBeInstanceOf(InputSystem);
    });
  });

  describe("Game State Management", () => {
    beforeEach(() => {
      game = new Game("gameCanvas", true);
    });

    test("starts game correctly", () => {
      game.start();
      expect(mockLogger.info).toHaveBeenCalledWith("Game starting...");
      expect(mockGameLoop.start).toHaveBeenCalled();
    });

    test("prevents multiple starts", () => {
      game.start();
      game.start();
      expect(mockLogger.warn).toHaveBeenCalledWith("Game is already running");
      expect(mockGameLoop.start).toHaveBeenCalledTimes(1);
    });

    test("pauses game correctly", () => {
      game.start();
      game.pause();
      expect(mockGameLoop.setPaused).toHaveBeenCalledWith(true);
    });

    test("resumes game correctly", () => {
      game.start();
      game.pause();
      game.resume();
      expect(mockGameLoop.setPaused).toHaveBeenCalledWith(false);
    });

    test("stops game correctly", () => {
      game.start();
      game.stop();
      expect(mockGameLoop.stop).toHaveBeenCalled();
      expect(mockUISystem.hideGameHUD).toHaveBeenCalled();
    });
  });

  describe("Audio Management", () => {
    beforeEach(() => {
      game = new Game("gameCanvas", true); // Use dev mode to skip loading screen
    });

    test("ensures audio can play when context is running", () => {
      game.ensureAudioCanPlay();
      expect(mockAudioManager.canPlayAudio).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Audio context is already running"
      );
    });

    test("attempts to resume suspended audio context", async () => {
      mockAudioManager.canPlayAudio.mockReturnValue(false);
      mockAudioManager.getAudioContext.mockReturnValue({
        state: "suspended",
        baseLatency: 0,
        outputLatency: 0,
        close: jest.fn(),
        createMediaElementSource: jest.fn(),
        createBuffer: jest.fn(),
        createBufferSource: jest.fn(),
        createGain: jest.fn(),
        createOscillator: jest.fn(),
        destination: {} as AudioDestinationNode,
        listener: {} as AudioListener,
        sampleRate: 44100,
        currentTime: 0,
      } as unknown as AudioContext);

      game.ensureAudioCanPlay();
      expect(mockAudioManager.tryResumeAudioContext).toHaveBeenCalled();
    });

    test("toggles dev mode audio correctly", () => {
      game = new Game("gameCanvas", true);
      game.toggleDevModeAudio();
      expect(mockAudioManager.toggleMute).toHaveBeenCalled();
    });

    test("ignores dev mode audio toggle in normal mode", async () => {
      // Reset mocks to ensure clean state
      jest.clearAllMocks();

      // Create game in non-dev mode
      game = new Game("gameCanvas", false);

      // Wait for initialization to complete
      await Promise.resolve();
      await new Promise(process.nextTick);

      // Reset the mock calls that happened during initialization
      mockAudioManager.toggleMute.mockClear();

      // Now test the toggle
      game.toggleDevModeAudio();
      expect(mockAudioManager.toggleMute).not.toHaveBeenCalled();
    });
  });

  describe("UI Management", () => {
    beforeEach(() => {
      game = new Game("gameCanvas", true); // Use dev mode to skip loading screen
    });

    test("shows terminal border", () => {
      game.showTerminalBorder();
      expect(mockUISystem.showTerminalBorder).toHaveBeenCalled();
    });

    test("hides terminal border", () => {
      game.hideTerminalBorder();
      expect(mockUISystem.hideTerminalBorder).toHaveBeenCalled();
    });
  });

  describe("Resource Management", () => {
    beforeEach(() => {
      game = new Game("gameCanvas", true); // Use dev mode to skip loading screen
    });

    test("disposes resources correctly", () => {
      game.dispose();
      expect(mockSceneSystem.dispose).toHaveBeenCalled();
      expect(mockAudioSystem.dispose).toHaveBeenCalled();
      expect(mockUISystem.dispose).toHaveBeenCalled();
    });

    test("handles dispose errors gracefully", () => {
      const error = new Error("Dispose error");
      mockSceneSystem.dispose.mockImplementation(() => {
        throw error;
      });

      game.dispose();
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Error disposing system:",
        error
      );
    });
  });

  describe("Error Handling", () => {
    beforeEach(() => {
      game = new Game("gameCanvas", true); // Use dev mode to skip loading screen
    });

    test("handles initialization errors", async () => {
      const mockError = new Error("Init error");
      mockSceneSystem.init.mockRejectedValue(mockError);

      await expect(game.init()).rejects.toThrow("Init error");
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Error during game initialization:",
        mockError
      );
    });

    test("handles unknown initialization errors", async () => {
      const mockError = "Unknown error";
      mockSceneSystem.init.mockRejectedValue(mockError);

      await expect(game.init()).rejects.toBe(mockError);
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Error during game initialization:",
        mockError
      );
    });
  });
});
