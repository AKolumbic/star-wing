import * as THREE from "three";
import {
  BackgroundManager,
  BackgroundType,
} from "../../../../src/core/backgrounds/BackgroundManager";
import { Background } from "../../../../src/core/backgrounds/Background";
import { StarfieldBackground } from "../../../../src/core/backgrounds/StarfieldBackground";
import { Logger } from "../../../../src/utils/Logger";

// Mock THREE.js Scene
jest.mock("three");

// Mock Logger
jest.mock("../../../../src/utils/Logger", () => ({
  Logger: {
    getInstance: jest.fn().mockReturnValue({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }),
  },
}));

describe("BackgroundManager", () => {
  let backgroundManager: BackgroundManager;
  let mockScene: jest.Mocked<THREE.Scene>;
  let mockBackground: jest.Mocked<Background>;
  let mockStarfieldBackground: jest.Mocked<StarfieldBackground>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock Scene
    mockScene = new THREE.Scene() as jest.Mocked<THREE.Scene>;

    // Create mock Background
    mockBackground = {
      init: jest.fn().mockResolvedValue(undefined),
      update: jest.fn(),
      dispose: jest.fn().mockResolvedValue(undefined),
      addToScene: jest.fn(),
      removeFromScene: jest.fn(),
      setParameter: jest.fn(),
    } as unknown as jest.Mocked<Background>;

    // Create mock StarfieldBackground
    mockStarfieldBackground = {
      ...mockBackground,
      setHyperspaceMode: jest.fn(),
      getHyperspaceMode: jest.fn(),
    } as unknown as jest.Mocked<StarfieldBackground>;

    // Get mock logger instance
    mockLogger = Logger.getInstance() as jest.Mocked<Logger>;

    // Create BackgroundManager instance
    backgroundManager = new BackgroundManager(mockScene);
  });

  describe("Initialization and Registration", () => {
    test("creates instance with scene", () => {
      expect(backgroundManager).toBeDefined();
      expect(backgroundManager.getCurrentBackgroundType()).toBe(
        BackgroundType.NONE
      );
      expect(backgroundManager.getCurrentBackground()).toBeNull();
    });

    test("registers background implementation", () => {
      backgroundManager.registerBackground(BackgroundType.GAME, mockBackground);
      expect(backgroundManager.getCurrentBackgroundType()).toBe(
        BackgroundType.NONE
      );
    });
  });

  describe("Background Management", () => {
    beforeEach(() => {
      backgroundManager.registerBackground(BackgroundType.GAME, mockBackground);
      backgroundManager.registerBackground(
        BackgroundType.STARFIELD,
        mockStarfieldBackground
      );
    });

    test("sets background successfully", async () => {
      await backgroundManager.setBackground(BackgroundType.GAME);

      expect(mockBackground.init).toHaveBeenCalled();
      expect(mockBackground.addToScene).toHaveBeenCalledWith(mockScene);
      expect(backgroundManager.getCurrentBackgroundType()).toBe(
        BackgroundType.GAME
      );
      expect(backgroundManager.getCurrentBackground()).toBe(mockBackground);
    });

    test("handles unregistered background type", async () => {
      await backgroundManager.setBackground(BackgroundType.NONE);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("not registered")
      );
      expect(backgroundManager.getCurrentBackgroundType()).toBe(
        BackgroundType.NONE
      );
    });

    test("disposes current background when setting new one", async () => {
      await backgroundManager.setBackground(BackgroundType.GAME);
      await backgroundManager.setBackground(BackgroundType.STARFIELD);

      expect(mockBackground.dispose).toHaveBeenCalled();
      expect(mockBackground.removeFromScene).toHaveBeenCalledWith(mockScene);
      expect(backgroundManager.getCurrentBackgroundType()).toBe(
        BackgroundType.STARFIELD
      );
    });

    test("applies initialization parameters", async () => {
      const params = { speed: 2.0, density: 100 };
      await backgroundManager.setBackground(BackgroundType.GAME, params);

      expect(mockBackground.setParameter).toHaveBeenCalledWith("speed", 2.0);
      expect(mockBackground.setParameter).toHaveBeenCalledWith("density", 100);
    });
  });

  describe("Transitions", () => {
    beforeEach(() => {
      backgroundManager.registerBackground(BackgroundType.GAME, mockBackground);
      backgroundManager.registerBackground(
        BackgroundType.STARFIELD,
        mockStarfieldBackground
      );
    });

    test("transitions between backgrounds", async () => {
      await backgroundManager.setBackground(BackgroundType.GAME);
      await backgroundManager.transitionTo(BackgroundType.STARFIELD, 1.0);

      expect(mockBackground.dispose).toHaveBeenCalled();
      expect(mockStarfieldBackground.init).toHaveBeenCalled();
      expect(backgroundManager.getCurrentBackgroundType()).toBe(
        BackgroundType.STARFIELD
      );
    });

    test("handles transition to unregistered background", async () => {
      await backgroundManager.transitionTo(BackgroundType.NONE, 1.0);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("unregistered background type")
      );
    });
  });

  describe("Hyperspace Mode", () => {
    beforeEach(async () => {
      backgroundManager.registerBackground(
        BackgroundType.STARFIELD,
        mockStarfieldBackground
      );
      await backgroundManager.setBackground(BackgroundType.STARFIELD);
    });

    test("enables hyperspace mode with starfield background", () => {
      const result = backgroundManager.transitionHyperspace(true, 1.0);

      expect(result).toBe(true);
      expect(mockStarfieldBackground.setHyperspaceMode).toHaveBeenCalledWith(
        true
      );
    });

    test("disables hyperspace mode", () => {
      const result = backgroundManager.transitionHyperspace(false, 1.0);

      expect(result).toBe(true);
      expect(mockStarfieldBackground.setHyperspaceMode).toHaveBeenCalledWith(
        false
      );
    });

    test("prevents hyperspace mode with non-starfield background", async () => {
      // Create a regular background that is definitely not a StarfieldBackground
      const regularBackground = {
        init: jest.fn().mockResolvedValue(undefined),
        update: jest.fn(),
        dispose: jest.fn().mockResolvedValue(undefined),
        addToScene: jest.fn(),
        removeFromScene: jest.fn(),
        setParameter: jest.fn(),
      } as unknown as jest.Mocked<Background>;

      // Register and set the regular background
      backgroundManager.registerBackground(
        BackgroundType.GAME,
        regularBackground
      );
      await backgroundManager.setBackground(BackgroundType.GAME);

      // Try to enable hyperspace mode
      const result = backgroundManager.transitionHyperspace(true);

      expect(result).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Hyperspace mode only works with the starfield background"
      );
    });

    test("reports hyperspace state correctly", async () => {
      mockStarfieldBackground.getHyperspaceMode.mockReturnValue(true);
      expect(backgroundManager.isHyperspaceActive()).toBe(true);

      mockStarfieldBackground.getHyperspaceMode.mockReturnValue(false);
      expect(backgroundManager.isHyperspaceActive()).toBe(false);
    });
  });

  describe("Update and Animation", () => {
    beforeEach(async () => {
      backgroundManager.registerBackground(BackgroundType.GAME, mockBackground);
      await backgroundManager.setBackground(BackgroundType.GAME);
    });

    test("updates current background", () => {
      const deltaTime = 0.016;
      backgroundManager.update(deltaTime);

      expect(mockBackground.update).toHaveBeenCalledWith(deltaTime);
    });

    test("handles update with no active background", () => {
      backgroundManager.dispose();
      backgroundManager.update(0.016);

      expect(mockBackground.update).not.toHaveBeenCalled();
    });

    test("updates during transition", async () => {
      await backgroundManager.transitionTo(BackgroundType.STARFIELD, 1.0);

      const deltaTime = 0.016;
      backgroundManager.update(deltaTime);

      // Current background should still be updated during transition
      expect(mockStarfieldBackground.update).toHaveBeenCalledWith(deltaTime);
    });
  });

  describe("Resource Management", () => {
    test("disposes all backgrounds", async () => {
      backgroundManager.registerBackground(BackgroundType.GAME, mockBackground);
      backgroundManager.registerBackground(
        BackgroundType.STARFIELD,
        mockStarfieldBackground
      );

      await backgroundManager.setBackground(BackgroundType.GAME);
      backgroundManager.dispose();

      expect(mockBackground.dispose).toHaveBeenCalled();
      expect(mockStarfieldBackground.dispose).toHaveBeenCalled();
      expect(backgroundManager.getCurrentBackground()).toBeNull();
    });
  });
});
