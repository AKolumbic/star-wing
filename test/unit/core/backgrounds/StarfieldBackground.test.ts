import * as THREE from "three";
import {
  StarfieldBackground,
  StarfieldParams,
} from "../../../../src/core/backgrounds/StarfieldBackground";
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

describe("StarfieldBackground", () => {
  let starfieldBackground: StarfieldBackground;
  let mockScene: jest.Mocked<THREE.Scene>;
  let mockBufferGeometry: jest.Mocked<THREE.BufferGeometry>;
  let mockShaderMaterial: jest.Mocked<THREE.ShaderMaterial>;
  let mockPoints: jest.Mocked<THREE.Points>;
  let mockBufferAttribute: jest.Mocked<THREE.BufferAttribute>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create modifiable arrays for positions and other attributes
    const positionArray = new Float32Array(1500 * 3); // starCount * 3 (x,y,z)
    const opacityArray = new Float32Array(1500); // starCount

    // Mock buffer attributes
    mockBufferAttribute = {
      needsUpdate: false,
      array: positionArray,
      itemSize: 3,
      count: 1500,
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

    // Mock opacity attribute with correct itemSize
    const mockOpacityAttribute = {
      ...mockBufferAttribute,
      array: opacityArray,
      itemSize: 1,
      count: 1500,
    } as unknown as jest.Mocked<THREE.BufferAttribute>;

    // Mock shader material with uniforms
    mockShaderMaterial = {
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color() },
        baseSize: { value: 2.5 },
        hyperspaceMode: { value: 0.0 },
        hyperspaceColor: { value: new THREE.Color() },
        hyperspaceTrailColor: { value: new THREE.Color() },
      },
      vertexShader: "",
      fragmentShader: "",
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      dispose: jest.fn(),
    } as unknown as jest.Mocked<THREE.ShaderMaterial>;

    // Mock buffer geometry with separate position and opacity attributes
    mockBufferGeometry = {
      setAttribute: jest.fn((name, attr) => {
        if (name === "position") {
          mockBufferGeometry.attributes.position = mockBufferAttribute;
        } else if (name === "opacity") {
          mockBufferGeometry.attributes.opacity = mockOpacityAttribute;
        }
      }),
      dispose: jest.fn(),
      attributes: {
        position: mockBufferAttribute,
        opacity: mockOpacityAttribute,
      },
    } as unknown as jest.Mocked<THREE.BufferGeometry>;

    // Mock Points object
    mockPoints = {
      geometry: mockBufferGeometry,
      material: mockShaderMaterial,
    } as unknown as jest.Mocked<THREE.Points>;

    // Mock scene
    mockScene = {
      add: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<THREE.Scene>;

    // Mock THREE.js constructors
    (THREE.BufferGeometry as unknown as jest.Mock).mockImplementation(
      () => mockBufferGeometry
    );
    (THREE.ShaderMaterial as unknown as jest.Mock).mockImplementation(
      () => mockShaderMaterial
    );
    (THREE.Points as unknown as jest.Mock).mockImplementation(() => mockPoints);
    (THREE.BufferAttribute as unknown as jest.Mock).mockImplementation(
      () => mockBufferAttribute
    );
    (THREE.Vector3 as unknown as jest.Mock).mockImplementation(() => ({
      x: 0,
      y: 0,
      z: 1,
      normalize: jest.fn(),
    }));
    (THREE.Color as unknown as jest.Mock).mockImplementation(() => ({
      r: 0,
      g: 0,
      b: 0,
    }));

    // Get mock logger instance
    mockLogger = Logger.getInstance() as jest.Mocked<Logger>;

    // Create StarfieldBackground instance
    starfieldBackground = new StarfieldBackground();
  });

  describe("Initialization", () => {
    test("creates instance with default parameters", () => {
      expect(starfieldBackground).toBeDefined();
      expect(starfieldBackground.getParameter("starCount")).toBe(1500);
      expect(starfieldBackground.getParameter("fieldSize")).toBe(2000);
      expect(starfieldBackground.getParameter("starColor")).toBe(0xffffff);
      expect(starfieldBackground.getParameter("baseStarSize")).toBe(2.5);
      expect(starfieldBackground.getParameter("minSpeed")).toBe(50);
      expect(starfieldBackground.getParameter("maxSpeed")).toBe(200);
      expect(
        starfieldBackground.getParameter("hyperspaceSpeedMultiplier")
      ).toBe(5.0);
      expect(
        starfieldBackground.getParameter("hyperspaceStreakMultiplier")
      ).toBe(8.0);
      expect(starfieldBackground.getParameter("hyperspaceTransitionTime")).toBe(
        1.0
      );
      expect(starfieldBackground.getParameter("starFadeInTime")).toBe(0.7);
    });

    test("creates instance with custom parameters", () => {
      const params: StarfieldParams = {
        starCount: 2000,
        fieldSize: 3000,
        starColor: 0xff0000,
        baseStarSize: 3.0,
        minSpeed: 75,
        maxSpeed: 300,
        hyperspaceSpeedMultiplier: 6.0,
        hyperspaceStreakMultiplier: 10.0,
        hyperspaceTransitionTime: 1.5,
        starFadeInTime: 1.0,
      };

      const customBackground = new StarfieldBackground(params);
      expect(customBackground.getParameter("starCount")).toBe(2000);
      expect(customBackground.getParameter("fieldSize")).toBe(3000);
      expect(customBackground.getParameter("starColor")).toBe(0xff0000);
      expect(customBackground.getParameter("baseStarSize")).toBe(3.0);
      expect(customBackground.getParameter("minSpeed")).toBe(75);
      expect(customBackground.getParameter("maxSpeed")).toBe(300);
      expect(customBackground.getParameter("hyperspaceSpeedMultiplier")).toBe(
        6.0
      );
      expect(customBackground.getParameter("hyperspaceStreakMultiplier")).toBe(
        10.0
      );
      expect(customBackground.getParameter("hyperspaceTransitionTime")).toBe(
        1.5
      );
      expect(customBackground.getParameter("starFadeInTime")).toBe(1.0);
    });

    test("initializes geometry and shader material", async () => {
      await starfieldBackground.init();

      // Verify geometry creation
      expect(THREE.BufferGeometry).toHaveBeenCalled();

      // Verify shader material creation
      expect(THREE.ShaderMaterial).toHaveBeenCalledWith(
        expect.objectContaining({
          uniforms: expect.objectContaining({
            time: { value: 0 },
            baseSize: { value: 2.5 },
            hyperspaceMode: { value: 0.0 },
          }),
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );

      // Verify buffer attributes were created with correct sizes
      const positionAttr = mockBufferGeometry.attributes.position;
      const opacityAttr = mockBufferGeometry.attributes.opacity;

      expect(positionAttr.itemSize).toBe(3); // x, y, z
      expect(positionAttr.count).toBe(1500); // starCount
      expect(opacityAttr.itemSize).toBe(1); // single opacity value
      expect(opacityAttr.count).toBe(1500); // starCount
    });
  });

  describe("Scene Management", () => {
    test("adds to scene after initialization", async () => {
      await starfieldBackground.init();
      starfieldBackground.addToScene(mockScene);

      expect(mockScene.add).toHaveBeenCalledWith(mockPoints);
    });

    test("prevents adding to scene before initialization", () => {
      starfieldBackground.addToScene(mockScene);

      expect(mockScene.add).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("uninitialized")
      );
    });

    test("removes from scene", async () => {
      await starfieldBackground.init();
      starfieldBackground.removeFromScene(mockScene);

      expect(mockScene.remove).toHaveBeenCalledWith(mockPoints);
    });
  });

  describe("Hyperspace Mode", () => {
    beforeEach(async () => {
      await starfieldBackground.init();
    });

    test("transitions to hyperspace mode", async () => {
      // Set a very short transition time for immediate effect
      starfieldBackground.setParameter("hyperspaceTransitionTime", 0.001);
      starfieldBackground.setHyperspaceMode(true);

      // Simulate a time update to complete the transition
      starfieldBackground.update(0.002); // Update with time > transition time

      expect(starfieldBackground.getHyperspaceMode()).toBe(true);
      expect(starfieldBackground.getHyperspaceTransition()).toBe(1.0);
    });

    test("transitions from hyperspace mode", () => {
      starfieldBackground.setHyperspaceMode(true);
      starfieldBackground.setHyperspaceMode(false);
      expect(starfieldBackground.getHyperspaceMode()).toBe(false);
      expect(starfieldBackground.getHyperspaceTransition()).toBeLessThan(1);
    });

    test("instant hyperspace mode change with zero transition time", () => {
      starfieldBackground.setParameter("hyperspaceTransitionTime", 0);
      starfieldBackground.setHyperspaceMode(true);
      expect(starfieldBackground.getHyperspaceMode()).toBe(true);
      expect(starfieldBackground.getHyperspaceTransition()).toBe(1.0);
    });
  });

  describe("Resource Management", () => {
    test("disposes resources properly", async () => {
      await starfieldBackground.init();
      starfieldBackground.dispose();

      expect(mockBufferGeometry.dispose).toHaveBeenCalled();
      expect(mockShaderMaterial.dispose).toHaveBeenCalled();
    });

    test("handles multiple dispose calls safely", () => {
      starfieldBackground.dispose();
      starfieldBackground.dispose();
      // Should not throw
    });
  });

  describe("Parameter Management", () => {
    test("sets valid parameters", () => {
      starfieldBackground.setParameter("starCount", 2000);
      expect(starfieldBackground.getParameter("starCount")).toBe(2000);
    });

    test("ignores invalid parameters", () => {
      starfieldBackground.setParameter("invalidParam", 100);
      expect(starfieldBackground.getParameter("invalidParam")).toBeUndefined();
    });

    test("returns undefined for unknown parameters", () => {
      expect(starfieldBackground.getParameter("nonexistent")).toBeUndefined();
    });
  });
});
