import * as THREE from "three";
import { Asteroid } from "../../../src/entities/Asteroid";
import { Game } from "../../../src/core/Game";
import { Logger } from "../../../src/utils/Logger";

// Add at the top of the file, after the imports
declare global {
  namespace jest {
    interface Matchers<R> {
      toEqualVector3(expected: THREE.Vector3): R;
    }
  }
}

// Mock THREE.js
jest.mock("three");

// Mock Logger
jest.mock("../../../src/utils/Logger", () => ({
  Logger: {
    getInstance: jest.fn().mockReturnValue({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    }),
  },
}));

// Mock Game
jest.mock("../../../src/core/Game");

describe("Asteroid", () => {
  let asteroid: Asteroid;
  let mockScene: jest.Mocked<THREE.Scene>;
  let mockGroup: jest.Mocked<THREE.Group>;
  let mockMesh: jest.Mocked<THREE.Mesh>;
  let mockGeometry: jest.Mocked<THREE.IcosahedronGeometry>;
  let mockMaterial: jest.Mocked<THREE.MeshStandardMaterial>;
  let mockGame: jest.Mocked<Game>;
  let mockLogger: jest.Mocked<Logger>;
  let mockAudioManager: jest.Mocked<any>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock THREE.js objects
    const createMockVector3 = (x = 0, y = 0, z = 0) => ({
      x,
      y,
      z,
      clone: function () {
        return createMockVector3(this.x, this.y, this.z);
      },
      normalize: function () {
        return this;
      },
      multiplyScalar: function (scalar: number) {
        this.x *= scalar;
        this.y *= scalar;
        this.z += scalar; // Changed to += for z to simulate forward movement
        return this;
      },
      copy: function (v: { x: number; y: number; z: number }) {
        this.x = v.x;
        this.y = v.y;
        this.z = v.z;
        return this;
      },
      add: function (v: { x: number; y: number; z: number }) {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        return this;
      },
      [Symbol.toStringTag]: "Vector3",
    });

    // Mock THREE.Vector3 constructor
    (THREE.Vector3 as jest.Mock).mockImplementation(function (
      x = 0,
      y = 0,
      z = 0
    ) {
      return createMockVector3(x, y, z);
    });

    // Mock THREE.Sphere constructor with proper instanceof behavior
    class MockSphere {
      center: THREE.Vector3;
      radius: number;

      constructor(center?: THREE.Vector3, radius?: number) {
        this.center = center || new THREE.Vector3();
        this.radius = radius || 1;
      }
    }
    (THREE.Sphere as unknown as jest.Mock).mockImplementation(
      (center?: THREE.Vector3, radius?: number) =>
        new MockSphere(center, radius)
    );

    mockMaterial = {
      dispose: jest.fn(),
      color: new THREE.Color(),
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true,
    } as unknown as jest.Mocked<THREE.MeshStandardMaterial>;

    mockGeometry = {
      dispose: jest.fn(),
    } as unknown as jest.Mocked<THREE.IcosahedronGeometry>;

    mockMesh = {
      position: new THREE.Vector3(),
      rotation: new THREE.Euler(),
      geometry: mockGeometry,
      material: mockMaterial,
      lookAt: jest.fn(),
      [Symbol.toStringTag]: "Mesh",
    } as unknown as jest.Mocked<THREE.Mesh>;

    mockGroup = {
      position: new THREE.Vector3(),
      rotation: new THREE.Euler(),
      add: jest.fn(),
      traverse: jest.fn((callback) => {
        callback(mockMesh);
        // Also call dispose on geometry and material during traverse
        if (mockMesh.geometry) mockMesh.geometry.dispose();
        if (mockMesh.material && "dispose" in mockMesh.material) {
          mockMesh.material.dispose();
        }
      }),
      [Symbol.toStringTag]: "Group",
    } as unknown as jest.Mocked<THREE.Group>;

    mockScene = {
      add: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<THREE.Scene>;

    // Mock Audio Manager
    mockAudioManager = {
      playAsteroidCollisionSound: jest.fn(),
    };

    // Mock Game
    mockGame = {
      getAudioManager: jest.fn().mockReturnValue(mockAudioManager),
    } as unknown as jest.Mocked<Game>;

    // Mock THREE constructors and Vector3 methods
    (THREE.Group as unknown as jest.Mock).mockImplementation(() => mockGroup);
    (THREE.Mesh as unknown as jest.Mock).mockImplementation(() => mockMesh);
    (THREE.IcosahedronGeometry as unknown as jest.Mock).mockImplementation(
      () => mockGeometry
    );
    (THREE.MeshStandardMaterial as unknown as jest.Mock).mockImplementation(
      () => mockMaterial
    );
    (THREE.CircleGeometry as unknown as jest.Mock).mockImplementation(
      () => mockGeometry
    );

    // Get mock logger instance
    mockLogger = Logger.getInstance() as jest.Mocked<Logger>;

    // Helper function to check instance types
    const isInstanceOf = (obj: any, constructor: any) => {
      if (constructor === THREE.Vector3) {
        return obj && obj[Symbol.toStringTag] === "Vector3";
      }
      if (constructor === THREE.Sphere) {
        return obj instanceof MockSphere;
      }
      if (constructor === THREE.Group) {
        return obj && obj[Symbol.toStringTag] === "Group";
      }
      if (constructor === THREE.Mesh) {
        return obj && obj[Symbol.toStringTag] === "Mesh";
      }
      return (
        Object.prototype.toString.call(obj) === `[object ${constructor.name}]`
      );
    };

    // Helper function to compare Vector3 objects
    const compareVector3 = (a: any, b: any) => {
      if (!a || !b) return false;
      return a.x === b.x && a.y === b.y && a.z === b.z;
    };

    // Update expect matchers
    expect.extend({
      toBeInstanceOf(received: any, expected: any) {
        const pass = isInstanceOf(received, expected);
        return {
          pass,
          message: () => `expected ${received} to be instance of ${expected}`,
        };
      },
      toEqualVector3(received: any, expected: any) {
        const pass = compareVector3(received, expected);
        return {
          pass,
          message: () => `expected vectors to be equal`,
        };
      },
    });

    // Create asteroid instance with default parameters
    asteroid = new Asteroid(
      mockScene,
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 1),
      200,
      30,
      25
    );
  });

  describe("Initialization", () => {
    test("creates asteroid with default parameters", () => {
      expect(asteroid).toBeDefined();
      expect(mockScene.add).toHaveBeenCalledWith(
        expect.objectContaining({ [Symbol.toStringTag]: "Group" })
      );
      expect(mockLogger.debug).toHaveBeenCalled();
    });

    test("creates asteroid with custom parameters", () => {
      const customPosition = new THREE.Vector3(100, 200, 300);
      const customDirection = new THREE.Vector3(1, 0, 0);
      const customAsteroid = new Asteroid(
        mockScene,
        customPosition,
        customDirection,
        300,
        50,
        40
      );

      expect(customAsteroid.getSize()).toBe(50);
      expect(customAsteroid.getDamage()).toBe(40);
      expect(customAsteroid.getPosition()).toEqualVector3(customPosition);
    });

    test("creates asteroid model with proper components", () => {
      expect(THREE.Group).toHaveBeenCalled();
      expect(THREE.IcosahedronGeometry).toHaveBeenCalled();
      expect(THREE.MeshStandardMaterial).toHaveBeenCalled();
      expect(mockGroup.add).toHaveBeenCalled();
    });
  });

  describe("Movement and Updates", () => {
    test("updates position based on velocity and delta time", () => {
      const initialPosition = asteroid.getPosition();
      asteroid.update(1.0); // Update with 1 second delta time

      const newPosition = asteroid.getPosition();
      expect(newPosition.z).toBeGreaterThan(initialPosition.z);
    });

    test("returns false when asteroid moves too far", () => {
      // Move asteroid far away
      for (let i = 0; i < 10; i++) {
        asteroid.update(1.0);
      }

      // Should return false when z > 1000
      expect(asteroid.update(1.0)).toBe(false);
      expect(asteroid.isActive()).toBe(false);
    });

    test("updates rotation based on rotation speed", () => {
      const initialRotation = { ...mockGroup.rotation };
      asteroid.update(1.0);

      expect(mockGroup.rotation.x).not.toBe(initialRotation.x);
      expect(mockGroup.rotation.y).not.toBe(initialRotation.y);
      expect(mockGroup.rotation.z).not.toBe(initialRotation.z);
    });
  });

  describe("Collision Handling", () => {
    test("handles collision with player", () => {
      asteroid.setGame(mockGame);
      const damage = asteroid.handleCollision();

      expect(damage).toBe(25); // Default damage
      expect(asteroid.isActive()).toBe(false);
      expect(mockScene.remove).toHaveBeenCalledWith(mockGroup);
      expect(mockAudioManager.playAsteroidCollisionSound).toHaveBeenCalled();
    });

    test("plays different collision sounds based on size", () => {
      // Test large asteroid
      const largeAsteroid = new Asteroid(
        mockScene,
        new THREE.Vector3(),
        new THREE.Vector3(),
        200,
        45, // > 40 for heavy sound
        25
      );
      largeAsteroid.setGame(mockGame);
      largeAsteroid.handleCollision();
      expect(mockAudioManager.playAsteroidCollisionSound).toHaveBeenCalledWith(
        "heavy"
      );

      // Test small asteroid
      const smallAsteroid = new Asteroid(
        mockScene,
        new THREE.Vector3(),
        new THREE.Vector3(),
        200,
        15, // < 20 for light sound
        25
      );
      smallAsteroid.setGame(mockGame);
      smallAsteroid.handleCollision();
      expect(mockAudioManager.playAsteroidCollisionSound).toHaveBeenCalledWith(
        "light"
      );
    });

    test("handles collision without game reference", () => {
      const damage = asteroid.handleCollision();
      expect(damage).toBe(25);
      expect(asteroid.isActive()).toBe(false);
      expect(
        mockAudioManager.playAsteroidCollisionSound
      ).not.toHaveBeenCalled();
    });
  });

  describe("Resource Management", () => {
    test("disposes of all resources properly", () => {
      asteroid.dispose();

      expect(mockScene.remove).toHaveBeenCalledWith(mockGroup);
      expect(mockGeometry.dispose).toHaveBeenCalled();
      expect(mockMaterial.dispose).toHaveBeenCalled();
      expect(asteroid.isActive()).toBe(false);
    });

    test("handles multiple dispose calls safely", () => {
      asteroid.dispose();
      asteroid.dispose();
      // Should not throw and should only dispose once
      expect(mockScene.remove).toHaveBeenCalledTimes(1);
    });
  });

  describe("State and Properties", () => {
    test("returns correct hitbox", () => {
      const hitbox = asteroid.getHitbox();
      expect(hitbox).toBeInstanceOf(THREE.Sphere);
      expect(hitbox.radius).toBe(30 * 0.8); // 80% of size
    });

    test("returns correct position", () => {
      const position = asteroid.getPosition();
      expect(position).toBeInstanceOf(THREE.Vector3);
      expect(position).toEqualVector3(new THREE.Vector3(0, 0, 0));
    });

    test("returns correct damage amount", () => {
      expect(asteroid.getDamage()).toBe(25);
    });

    test("returns correct size", () => {
      expect(asteroid.getSize()).toBe(30);
    });

    test("returns correct active state", () => {
      expect(asteroid.isActive()).toBe(true);
      asteroid.destroy();
      expect(asteroid.isActive()).toBe(false);
    });
  });
});
