import * as THREE from "three";
import {
  HyperspaceBackground,
  HyperspaceParams,
} from "../../../../src/core/backgrounds/HyperspaceBackground";
import { Logger } from "../../../../src/utils/Logger";

// Mock THREE.js
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

describe("HyperspaceBackground", () => {
  let hyperspaceBackground: HyperspaceBackground;
  let mockScene: jest.Mocked<THREE.Scene>;
  let mockBufferGeometry: jest.Mocked<THREE.BufferGeometry>;
  let mockLineBasicMaterial: jest.Mocked<THREE.LineBasicMaterial>;
  let mockLineSegments: jest.Mocked<THREE.LineSegments>;
  let mockBufferAttribute: jest.Mocked<THREE.BufferAttribute>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create modifiable arrays
    const positionArray = new Float32Array(500 * 6);
    const colorArray = new Float32Array(500 * 6);

    // Mock THREE.js classes and methods
    mockBufferAttribute = {
      needsUpdate: false,
      array: positionArray,
      itemSize: 3,
      count: 500 * 2,
      updateRange: { offset: 0, count: -1 },
      set: function (
        this: { array: Float32Array },
        array: ArrayLike<number>,
        offset?: number
      ) {
        for (let i = 0; i < array.length; i++) {
          this.array[i + (offset || 0)] = array[i];
        }
      },
    } as unknown as jest.Mocked<THREE.BufferAttribute>;

    // Create a separate color attribute with the same capabilities
    const mockColorAttribute = {
      needsUpdate: false,
      array: colorArray,
      itemSize: 3,
      count: 500 * 2,
      updateRange: { offset: 0, count: -1 },
      set: function (
        this: { array: Float32Array },
        array: ArrayLike<number>,
        offset?: number
      ) {
        for (let i = 0; i < array.length; i++) {
          this.array[i + (offset || 0)] = array[i];
        }
      },
    } as unknown as jest.Mocked<THREE.BufferAttribute>;

    mockBufferGeometry = {
      setAttribute: jest.fn((name, attr) => {
        if (name === "position") {
          mockBufferGeometry.attributes.position = attr;
        } else if (name === "color") {
          mockBufferGeometry.attributes.color = attr;
        }
      }),
      dispose: jest.fn(),
      attributes: {
        position: mockBufferAttribute,
        color: mockColorAttribute,
      },
    } as unknown as jest.Mocked<THREE.BufferGeometry>;

    mockLineBasicMaterial = {
      dispose: jest.fn(),
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      linewidth: 1,
    } as unknown as jest.Mocked<THREE.LineBasicMaterial>;

    mockLineSegments = {
      geometry: mockBufferGeometry,
    } as unknown as jest.Mocked<THREE.LineSegments>;

    // Mock THREE.Color for streak colors
    (THREE.Color as unknown as jest.Mock) = jest
      .fn()
      .mockImplementation(() => ({
        r: 0,
        g: 0,
        b: 0,
      }));

    mockScene = {
      add: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<THREE.Scene>;

    // Mock constructors
    (THREE.BufferGeometry as unknown as jest.Mock).mockImplementation(
      () => mockBufferGeometry
    );
    (THREE.LineBasicMaterial as unknown as jest.Mock).mockImplementation(
      () => mockLineBasicMaterial
    );
    (THREE.LineSegments as unknown as jest.Mock).mockImplementation(
      () => mockLineSegments
    );
    (THREE.BufferAttribute as unknown as jest.Mock).mockImplementation(
      () => mockBufferAttribute
    );

    // Get mock logger instance
    mockLogger = Logger.getInstance() as jest.Mocked<Logger>;

    // Create HyperspaceBackground instance
    hyperspaceBackground = new HyperspaceBackground();
  });

  describe("Initialization", () => {
    test("creates instance with default parameters", () => {
      expect(hyperspaceBackground).toBeDefined();
      expect(hyperspaceBackground.getParameter("streakCount")).toBe(500);
      expect(hyperspaceBackground.getParameter("maxStreakLength")).toBe(100);
      expect(hyperspaceBackground.getParameter("coreColor")).toBe(0x00ffff);
      expect(hyperspaceBackground.getParameter("edgeColor")).toBe(0x0000ff);
      expect(hyperspaceBackground.getParameter("speed")).toBe(1.0);
    });

    test("creates instance with custom parameters", () => {
      const params: HyperspaceParams = {
        streakCount: 1000,
        maxStreakLength: 200,
        coreColor: 0xff0000,
        edgeColor: 0x00ff00,
        speed: 2.0,
      };

      const customBackground = new HyperspaceBackground(params);
      expect(customBackground.getParameter("streakCount")).toBe(1000);
      expect(customBackground.getParameter("maxStreakLength")).toBe(200);
      expect(customBackground.getParameter("coreColor")).toBe(0xff0000);
      expect(customBackground.getParameter("edgeColor")).toBe(0x00ff00);
      expect(customBackground.getParameter("speed")).toBe(2.0);
    });

    test("initializes geometry and materials", async () => {
      await hyperspaceBackground.init();

      // Verify material creation
      expect(THREE.LineBasicMaterial).toHaveBeenCalledWith({
        vertexColors: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        linewidth: 1,
      });

      // Verify buffer attributes were created with correct sizes
      const positionCall = mockBufferGeometry.setAttribute.mock.calls.find(
        (call) => call[0] === "position"
      )!;
      const colorCall = mockBufferGeometry.setAttribute.mock.calls.find(
        (call) => call[0] === "color"
      )!;

      expect(positionCall).toBeTruthy();
      expect(colorCall).toBeTruthy();

      const positionAttr = positionCall[1];
      const colorAttr = colorCall[1];

      expect(positionAttr.itemSize).toBe(3); // x, y, z
      expect(positionAttr.count).toBe(500 * 2); // streakCount * 2 (start and end points)
    });
  });

  describe("Scene Management", () => {
    test("adds to scene after initialization", async () => {
      await hyperspaceBackground.init();
      hyperspaceBackground.addToScene(mockScene);

      expect(mockScene.add).toHaveBeenCalledWith(mockLineSegments);
    });

    test("prevents adding to scene before initialization", () => {
      hyperspaceBackground.addToScene(mockScene);

      expect(mockScene.add).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("uninitialized")
      );
    });

    test("removes from scene", async () => {
      await hyperspaceBackground.init();
      hyperspaceBackground.removeFromScene(mockScene);

      expect(mockScene.remove).toHaveBeenCalledWith(mockLineSegments);
    });
  });

  describe("Animation and Updates", () => {
    beforeEach(async () => {
      await hyperspaceBackground.init();
    });

    test("handles update before initialization", () => {
      const uninitializedBackground = new HyperspaceBackground();
      uninitializedBackground.update(0.016);
      // Should not throw and should do nothing
    });

    test("scales streaks based on speed parameter", () => {
      const fastBackground = new HyperspaceBackground({ speed: 2.0 });
      const slowBackground = new HyperspaceBackground({ speed: 0.5 });

      fastBackground.update(0.016);
      slowBackground.update(0.016);

      // Visual verification would be needed for actual scaling effects
    });
  });

  describe("Resource Management", () => {
    test("disposes resources properly", async () => {
      await hyperspaceBackground.init();
      hyperspaceBackground.dispose();

      expect(mockBufferGeometry.dispose).toHaveBeenCalled();
      expect(mockLineBasicMaterial.dispose).toHaveBeenCalled();
    });

    test("handles multiple dispose calls safely", () => {
      hyperspaceBackground.dispose();
      hyperspaceBackground.dispose();
      // Should not throw
    });
  });

  describe("Parameter Management", () => {
    test("sets valid parameters", () => {
      hyperspaceBackground.setParameter("speed", 2.0);
      expect(hyperspaceBackground.getParameter("speed")).toBe(2.0);
    });

    test("ignores invalid parameters", () => {
      hyperspaceBackground.setParameter("invalidParam", 100);
      expect(hyperspaceBackground.getParameter("invalidParam")).toBeUndefined();
    });

    test("returns undefined for unknown parameters", () => {
      expect(hyperspaceBackground.getParameter("nonexistent")).toBeUndefined();
    });
  });
});
