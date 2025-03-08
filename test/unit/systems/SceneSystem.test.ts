import { SceneSystem } from "../../../src/core/systems/SceneSystem";
import { Scene } from "../../../src/core/Scene";
import { Game } from "../../../src/core/Game";

// Mock dependencies
jest.mock("../../../src/core/Scene");
jest.mock("../../../src/core/Game");

describe("SceneSystem", () => {
  let sceneSystem: SceneSystem;
  let mockScene: jest.Mocked<Scene>;
  let mockGame: jest.Mocked<Game>;
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create mock canvas with ID
    mockCanvas = document.createElement("canvas");
    mockCanvas.id = "gameCanvas";

    // Create mock game instance with canvas ID
    mockGame = new Game("gameCanvas") as jest.Mocked<Game>;

    // Create a fresh instance of SceneSystem for each test
    sceneSystem = new SceneSystem(mockCanvas, mockGame);

    // Get the mocked Scene instance
    mockScene = (sceneSystem as any).scene;
  });

  describe("Initialization", () => {
    test("initializes with default parameters", () => {
      const system = new SceneSystem(mockCanvas, mockGame);
      expect(Scene).toHaveBeenCalledWith(mockCanvas, false);
      expect(mockScene.setGame).toHaveBeenCalledWith(mockGame);
    });

    test("initializes with dev mode enabled", () => {
      const system = new SceneSystem(mockCanvas, mockGame, true);
      expect(Scene).toHaveBeenCalledWith(mockCanvas, true);
      expect(mockScene.setGame).toHaveBeenCalledWith(mockGame);
    });

    test("initializes scene successfully", async () => {
      mockScene.init.mockResolvedValue();
      await sceneSystem.init();
      expect(mockScene.init).toHaveBeenCalled();
    });

    test("handles scene initialization failure", async () => {
      const error = new Error("Scene initialization failed");
      mockScene.init.mockRejectedValue(error);

      await expect(sceneSystem.init()).rejects.toThrow(error);
    });
  });

  describe("Resource Management", () => {
    test("disposes resources correctly", () => {
      sceneSystem.dispose();
      expect(mockScene.dispose).toHaveBeenCalled();
    });

    test("provides access to Scene instance", () => {
      const scene = sceneSystem.getScene();
      expect(scene).toBe(mockScene);
    });
  });

  describe("Update Cycle", () => {
    test("updates and renders each frame", () => {
      const deltaTime = 0.016; // 16ms frame
      sceneSystem.update(deltaTime);

      expect(mockScene.update).toHaveBeenCalledWith(deltaTime);
      expect(mockScene.render).toHaveBeenCalled();
    });

    test("maintains update order", () => {
      const deltaTime = 0.016;
      sceneSystem.update(deltaTime);

      // Check that update is called before render
      const updateCallIndex = mockScene.update.mock.invocationCallOrder[0];
      const renderCallIndex = mockScene.render.mock.invocationCallOrder[0];
      expect(updateCallIndex).toBeLessThan(renderCallIndex);
    });

    test("handles multiple update calls", () => {
      // Simulate multiple frames
      sceneSystem.update(0.016);
      sceneSystem.update(0.016);
      sceneSystem.update(0.016);

      expect(mockScene.update).toHaveBeenCalledTimes(3);
      expect(mockScene.render).toHaveBeenCalledTimes(3);
    });

    test("passes correct delta time to scene", () => {
      const deltaTimes = [0.016, 0.032, 0.008];

      deltaTimes.forEach((dt) => {
        sceneSystem.update(dt);
        expect(mockScene.update).toHaveBeenLastCalledWith(dt);
      });
    });
  });

  describe("Game Integration", () => {
    test("sets game reference on scene during construction", () => {
      // Reset the mock Scene constructor to get a fresh mock instance
      (Scene as jest.Mock).mockClear();

      const newCanvas = document.createElement("canvas");
      newCanvas.id = "newGameCanvas";
      const newGame = new Game("newGameCanvas") as jest.Mocked<Game>;
      const system = new SceneSystem(newCanvas, newGame);

      // Get the Scene mock instance that was created
      const sceneInstance = (Scene as jest.Mock).mock.instances[0];
      expect(sceneInstance.setGame).toHaveBeenCalled();

      // Verify the game was set by checking the first argument of the first call
      const setGameCall = sceneInstance.setGame.mock.calls[0];
      expect(setGameCall[0]).toBe(newGame);
    });

    test("maintains game reference through lifecycle", async () => {
      // Test that game reference is maintained through init and update
      await sceneSystem.init();
      sceneSystem.update(0.016);
      sceneSystem.dispose();

      // Verify setGame was only called once during construction
      expect(mockScene.setGame).toHaveBeenCalledTimes(1);

      // Verify the game reference was the one we created
      const setGameCall = mockScene.setGame.mock.calls[0];
      expect(setGameCall[0]).toBe(mockGame);
    });
  });

  describe("Edge Cases", () => {
    test("handles zero delta time", () => {
      sceneSystem.update(0);
      expect(mockScene.update).toHaveBeenCalledWith(0);
      expect(mockScene.render).toHaveBeenCalled();
    });

    test("handles very large delta time", () => {
      const largeDeltaTime = 1.0; // 1 second
      sceneSystem.update(largeDeltaTime);
      expect(mockScene.update).toHaveBeenCalledWith(largeDeltaTime);
    });

    test("handles multiple init calls", async () => {
      await sceneSystem.init();
      await sceneSystem.init();
      expect(mockScene.init).toHaveBeenCalledTimes(2);
    });

    test("handles dispose without initialization", () => {
      sceneSystem.dispose();
      expect(mockScene.dispose).toHaveBeenCalled();
    });
  });

  describe("Canvas Integration", () => {
    test("handles canvas resize", () => {
      // Simulate canvas resize
      mockCanvas.width = 800;
      mockCanvas.height = 600;

      // Create new system with resized canvas
      const system = new SceneSystem(mockCanvas, mockGame);
      expect(Scene).toHaveBeenLastCalledWith(mockCanvas, false);
    });

    test("handles zero-sized canvas", () => {
      // Create canvas with zero dimensions
      const zeroCanvas = document.createElement("canvas");
      zeroCanvas.id = "zeroCanvas";
      zeroCanvas.width = 0;
      zeroCanvas.height = 0;

      // Should still create system without error
      const system = new SceneSystem(zeroCanvas, mockGame);
      expect(Scene).toHaveBeenLastCalledWith(zeroCanvas, false);
    });
  });
});
