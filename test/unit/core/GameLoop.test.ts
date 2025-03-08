import { GameLoop } from "../../../src/core/GameLoop";
import { GameSystem } from "../../../src/core/GameSystem";
import { PerformanceMonitor } from "../../../src/core/PerformanceMonitor";
import { Logger } from "../../../src/utils/Logger";

// Mock dependencies
jest.mock("../../../src/core/PerformanceMonitor");
jest.mock("../../../src/utils/Logger");

describe("GameLoop", () => {
  let gameLoop: GameLoop;
  let mockSystem1: jest.Mocked<GameSystem>;
  let mockSystem2: jest.Mocked<GameSystem>;
  let mockLogger: jest.Mocked<Logger>;
  let mockPerformanceMonitor: jest.Mocked<PerformanceMonitor>;
  let originalRequestAnimationFrame: typeof window.requestAnimationFrame;
  let originalCancelAnimationFrame: typeof window.cancelAnimationFrame;
  let originalPerformanceNow: typeof performance.now;

  beforeEach(() => {
    // Store original functions
    originalRequestAnimationFrame = window.requestAnimationFrame;
    originalCancelAnimationFrame = window.cancelAnimationFrame;
    originalPerformanceNow = performance.now;

    // Mock requestAnimationFrame
    window.requestAnimationFrame = jest.fn().mockReturnValue(1);
    window.cancelAnimationFrame = jest.fn();
    performance.now = jest.fn().mockReturnValue(0);

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

    // Setup performance monitor mock
    mockPerformanceMonitor = {
      reset: jest.fn(),
      update: jest.fn(),
      getMetrics: jest.fn().mockReturnValue({ fps: 60, frameTime: 16.67 }),
    } as unknown as jest.Mocked<PerformanceMonitor>;
    (PerformanceMonitor as jest.Mock).mockImplementation(
      () => mockPerformanceMonitor
    );

    // Setup mock systems
    mockSystem1 = {
      init: jest.fn().mockResolvedValue(undefined),
      update: jest.fn(),
      dispose: jest.fn(),
    } as unknown as jest.Mocked<GameSystem>;
    mockSystem2 = {
      init: jest.fn().mockResolvedValue(undefined),
      update: jest.fn(),
      dispose: jest.fn(),
    } as unknown as jest.Mocked<GameSystem>;

    // Create GameLoop instance
    gameLoop = new GameLoop([mockSystem1, mockSystem2]);
  });

  afterEach(() => {
    // Restore original functions
    window.requestAnimationFrame = originalRequestAnimationFrame;
    window.cancelAnimationFrame = originalCancelAnimationFrame;
    performance.now = originalPerformanceNow;

    // Stop the game loop if it's running
    gameLoop.stop();
  });

  describe("Initialization", () => {
    test("creates game loop with systems", () => {
      expect(gameLoop).toBeDefined();
      expect(PerformanceMonitor).toHaveBeenCalled();
    });
  });

  describe("System Management", () => {
    test("adds system correctly", () => {
      const newSystem = {
        init: jest.fn().mockResolvedValue(undefined),
        update: jest.fn(),
        dispose: jest.fn(),
      } as unknown as jest.Mocked<GameSystem>;
      gameLoop.addSystem(newSystem);
      gameLoop.start();
      expect(newSystem.update).toHaveBeenCalled();
    });

    test("removes system correctly", () => {
      gameLoop.removeSystem(mockSystem1);
      gameLoop.start();
      expect(mockSystem1.update).not.toHaveBeenCalled();
      expect(mockSystem2.update).toHaveBeenCalled();
    });
  });

  describe("Game Loop Control", () => {
    test("starts game loop correctly", () => {
      gameLoop.start();
      expect(mockLogger.info).toHaveBeenCalledWith("Game loop starting...");
      expect(mockPerformanceMonitor.reset).toHaveBeenCalled();
      expect(window.requestAnimationFrame).toHaveBeenCalled();
    });

    test("prevents multiple starts", () => {
      gameLoop.start();
      gameLoop.start();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Game loop is already running"
      );
      expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);
    });

    test("stops game loop correctly", () => {
      gameLoop.start();
      gameLoop.stop();
      expect(mockLogger.info).toHaveBeenCalledWith("Game loop stopping...");
      expect(window.cancelAnimationFrame).toHaveBeenCalledWith(1);
    });

    test("prevents stopping when not running", () => {
      gameLoop.stop();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Game loop is already stopped"
      );
      expect(window.cancelAnimationFrame).not.toHaveBeenCalled();
    });

    test("pauses and resumes correctly", () => {
      // Start with time at 0
      performance.now = jest.fn().mockReturnValue(0);
      gameLoop.start();

      // Store the animation frame callback
      const frameCallback = (window.requestAnimationFrame as jest.Mock).mock
        .calls[0][0];

      // Clear initial update calls
      jest.clearAllMocks();

      // Set paused state
      gameLoop.setPaused(true);
      expect(mockLogger.info).toHaveBeenCalledWith("Game loop paused");
      expect(gameLoop.isPausedState()).toBe(true);

      // Simulate a frame while paused (at 16.67ms)
      performance.now = jest.fn().mockReturnValue(16.67);
      frameCallback(16.67);
      expect(mockSystem1.update).not.toHaveBeenCalled();
      expect(mockSystem2.update).not.toHaveBeenCalled();

      // Resume game loop
      gameLoop.setPaused(false);
      expect(mockLogger.info).toHaveBeenCalledWith("Game loop resumed");
      expect(gameLoop.isPausedState()).toBe(false);

      // Simulate a frame while resumed (at 33.34ms)
      performance.now = jest.fn().mockReturnValue(33.34);
      frameCallback(33.34);
      expect(mockSystem1.update).toHaveBeenCalledWith(0.01667);
      expect(mockSystem2.update).toHaveBeenCalledWith(0.01667);
    });
  });

  describe("Frame Updates", () => {
    test("updates systems with correct delta time", () => {
      gameLoop.start();

      // Simulate first frame
      performance.now = jest.fn().mockReturnValue(16.67);
      (window.requestAnimationFrame as jest.Mock).mock.calls[0][0](16.67);

      expect(mockSystem1.update).toHaveBeenCalledWith(0.01667);
      expect(mockSystem2.update).toHaveBeenCalledWith(0.01667);
    });

    test("limits maximum delta time", () => {
      gameLoop.start();

      // Simulate a long frame (200ms)
      performance.now = jest.fn().mockReturnValue(200);
      (window.requestAnimationFrame as jest.Mock).mock.calls[0][0](200);

      // Should be limited to 0.1 seconds (100ms)
      expect(mockSystem1.update).toHaveBeenCalledWith(0.1);
      expect(mockSystem2.update).toHaveBeenCalledWith(0.1);
    });
  });

  describe("Callback Management", () => {
    test("executes pre-update callback", () => {
      const preUpdateCallback = jest.fn();
      gameLoop.setPreUpdateCallback(preUpdateCallback);
      gameLoop.start();

      // Simulate a frame
      (window.requestAnimationFrame as jest.Mock).mock.calls[0][0](16.67);
      expect(preUpdateCallback).toHaveBeenCalled();
    });

    test("executes post-update callback", () => {
      const postUpdateCallback = jest.fn();
      gameLoop.setPostUpdateCallback(postUpdateCallback);
      gameLoop.start();

      // Simulate a frame
      (window.requestAnimationFrame as jest.Mock).mock.calls[0][0](16.67);
      expect(postUpdateCallback).toHaveBeenCalled();
    });
  });

  describe("Performance Monitoring", () => {
    test("gets performance metrics", () => {
      const metrics = gameLoop.getPerformanceMetrics();
      expect(metrics).toEqual({ fps: 60, frameTime: 16.67 });
      expect(mockPerformanceMonitor.getMetrics).toHaveBeenCalled();
    });

    test("updates performance monitor each frame", () => {
      gameLoop.start();

      // Simulate a frame
      (window.requestAnimationFrame as jest.Mock).mock.calls[0][0](16.67);
      expect(mockPerformanceMonitor.update).toHaveBeenCalled();
    });
  });

  describe("State Queries", () => {
    test("reports active state correctly", () => {
      expect(gameLoop.isActive()).toBe(false);
      gameLoop.start();
      expect(gameLoop.isActive()).toBe(true);
      gameLoop.stop();
      expect(gameLoop.isActive()).toBe(false);
    });

    test("reports paused state correctly", () => {
      expect(gameLoop.isPausedState()).toBe(false);
      gameLoop.setPaused(true);
      expect(gameLoop.isPausedState()).toBe(true);
      gameLoop.setPaused(false);
      expect(gameLoop.isPausedState()).toBe(false);
    });
  });
});
