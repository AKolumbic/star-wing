import * as THREE from "three";
import { Projectile, ProjectileProps } from "../../../src/weapons/Projectile";
import { WeaponCategory } from "../../../src/weapons/Weapon";

// Mock three.js objects
jest.mock("three", () => {
  // Reuse the same mock classes we defined for Weapon tests
  class MockVector3 {
    x: number;
    y: number;
    z: number;

    constructor(x: number = 0, y: number = 0, z: number = 0) {
      this.x = x;
      this.y = y;
      this.z = z;
    }

    copy(v: MockVector3): MockVector3 {
      this.x = v.x;
      this.y = v.y;
      this.z = v.z;
      return this;
    }

    add(v: MockVector3): MockVector3 {
      this.x += v.x;
      this.y += v.y;
      this.z += v.z;
      return this;
    }

    multiplyScalar(scalar: number): MockVector3 {
      this.x *= scalar;
      this.y *= scalar;
      this.z *= scalar;
      return this;
    }

    normalize(): MockVector3 {
      // For simplicity, just return this instead of actually normalizing
      return this;
    }

    clone(): MockVector3 {
      return new MockVector3(this.x, this.y, this.z);
    }

    length(): number {
      return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    set(x: number, y: number, z: number): MockVector3 {
      this.x = x;
      this.y = y;
      this.z = z;
      return this;
    }
  }

  class MockColor {
    r: number;
    g: number;
    b: number;

    constructor(r?: number, g?: number, b?: number) {
      this.r = r || 1;
      this.g = g || 1;
      this.b = b || 1;
    }
  }

  class MockSphere {
    center: MockVector3;
    radius: number;

    constructor(center?: MockVector3, radius?: number) {
      this.center = center || new MockVector3();
      this.radius = radius || 1;
    }
  }

  class MockScene {
    add: jest.Mock;
    remove: jest.Mock;
    children: any[];

    constructor() {
      this.add = jest.fn();
      this.remove = jest.fn();
      this.children = [];
    }
  }

  class MockMesh {
    position: MockVector3;
    rotation: { x: number; y: number; z: number };
    scale: MockVector3;
    visible: boolean;
    geometry: any;
    material: any;
    parent: any;
    add: jest.Mock;
    children: any[];
    remove: jest.Mock;

    constructor() {
      this.position = new MockVector3();
      this.rotation = { x: 0, y: 0, z: 0 };
      this.scale = new MockVector3(1, 1, 1);
      this.visible = true;
      this.geometry = { dispose: jest.fn() };
      this.material = { dispose: jest.fn() };
      this.parent = null;
      this.add = jest.fn();
      this.children = [];
      this.remove = jest.fn();
    }
  }

  class MockPointLight {
    position: MockVector3;
    color: any;
    intensity: number;
    distance: number;

    constructor(color: any, intensity: number, distance: number) {
      this.color = color;
      this.intensity = intensity;
      this.distance = distance;
      this.position = new MockVector3();
    }
  }

  return {
    Vector3: MockVector3,
    Color: MockColor,
    Sphere: MockSphere,
    Scene: MockScene,
    Mesh: MockMesh,
    PointLight: MockPointLight,
    BoxGeometry: jest.fn().mockImplementation(() => ({
      dispose: jest.fn(),
      rotateX: jest.fn(),
      rotateY: jest.fn(),
      rotateZ: jest.fn(),
    })),
    SphereGeometry: jest.fn().mockImplementation(() => ({
      dispose: jest.fn(),
      rotateX: jest.fn(),
      rotateY: jest.fn(),
      rotateZ: jest.fn(),
    })),
    CylinderGeometry: jest.fn().mockImplementation(() => ({
      dispose: jest.fn(),
      rotateX: jest.fn(),
      rotateY: jest.fn(),
      rotateZ: jest.fn(),
    })),
    ConeGeometry: jest.fn().mockImplementation(() => ({
      dispose: jest.fn(),
      rotateX: jest.fn(),
      rotateY: jest.fn(),
      rotateZ: jest.fn(),
    })),
    IcosahedronGeometry: jest.fn().mockImplementation(() => ({
      dispose: jest.fn(),
      rotateX: jest.fn(),
      rotateY: jest.fn(),
      rotateZ: jest.fn(),
    })),
    MeshBasicMaterial: jest
      .fn()
      .mockImplementation(() => ({ dispose: jest.fn() })),
    MeshPhongMaterial: jest
      .fn()
      .mockImplementation(() => ({ dispose: jest.fn() })),
    MeshStandardMaterial: jest
      .fn()
      .mockImplementation(() => ({ dispose: jest.fn() })),
  };
});

describe("Projectile", () => {
  let projectile: Projectile;
  let scene: THREE.Scene;
  let defaultProps: ProjectileProps;
  let initialPosition: THREE.Vector3;
  let initialDirection: THREE.Vector3;

  beforeEach(() => {
    // Reset mocks and create a fresh scene
    jest.clearAllMocks();
    scene = new THREE.Scene();

    // Define default projectile properties
    defaultProps = {
      damage: 10,
      speed: 500,
      lifetime: 2, // 2 seconds lifetime
      color: new THREE.Color(1, 0, 0), // Red
      scale: 1,
      category: WeaponCategory.ENERGY,
    };

    // Create position and direction vectors
    initialPosition = new THREE.Vector3(0, 0, 0);
    initialDirection = new THREE.Vector3(0, 0, 1).normalize(); // Forward

    // Create a projectile
    projectile = new Projectile(
      initialPosition,
      initialDirection,
      defaultProps,
      scene
    );
  });

  describe("Initialization", () => {
    test("creates a projectile with correct properties", () => {
      expect(projectile).toBeDefined();
      expect(projectile.getIsActive()).toBe(true);

      // Position should match initial position
      const position = projectile.getPosition();
      expect(position.x).toEqual(initialPosition.x);
      expect(position.y).toEqual(initialPosition.y);
      expect(position.z).toEqual(initialPosition.z);

      // Scene should have the projectile mesh added
      expect(scene.add).toHaveBeenCalled();
    });

    test("initializes hitbox with correct size", () => {
      const hitbox = projectile.getHitbox();
      expect(hitbox).toBeDefined();
      expect(hitbox.radius).toBeGreaterThan(0);
    });

    test("uses default values for optional properties", () => {
      const minimalProps: ProjectileProps = {
        damage: 5,
        speed: 300,
        lifetime: 1,
        category: WeaponCategory.BALLISTIC,
      };

      const minimalProjectile = new Projectile(
        initialPosition,
        initialDirection,
        minimalProps,
        scene
      );

      expect(minimalProjectile).toBeDefined();
      expect(minimalProjectile.getIsActive()).toBe(true);

      // Should not have a blast radius
      expect(minimalProjectile.getBlastRadius()).toBeUndefined();
    });

    test("creates different visuals based on weapon category", () => {
      // Create projectiles with different categories
      const energyProjectile = new Projectile(
        initialPosition,
        initialDirection,
        { ...defaultProps, category: WeaponCategory.ENERGY },
        scene
      );

      const ballisticProjectile = new Projectile(
        initialPosition,
        initialDirection,
        { ...defaultProps, category: WeaponCategory.BALLISTIC },
        scene
      );

      const explosiveProjectile = new Projectile(
        initialPosition,
        initialDirection,
        {
          ...defaultProps,
          category: WeaponCategory.EXPLOSIVE,
          blastRadius: 10,
        },
        scene
      );

      expect(energyProjectile).toBeDefined();
      expect(ballisticProjectile).toBeDefined();
      expect(explosiveProjectile).toBeDefined();

      // Explosive projectile should have a blast radius
      expect(explosiveProjectile.getBlastRadius()).toBe(10);
    });
  });

  describe("Movement and Lifecycle", () => {
    test("updates position based on velocity and time", () => {
      const deltaTime = 0.1; // 100ms
      const expectedDistance = defaultProps.speed * deltaTime;

      // Update projectile
      const isActive = projectile.update(deltaTime);

      // Should still be active
      expect(isActive).toBe(true);
      expect(projectile.getIsActive()).toBe(true);

      // Position should have moved along the direction vector
      const position = projectile.getPosition();
      expect(position.z).toBeCloseTo(initialPosition.z + expectedDistance, 2);
    });

    test("deactivates when lifetime expires", () => {
      // Update just short of lifetime
      projectile.update(defaultProps.lifetime - 0.1);
      expect(projectile.getIsActive()).toBe(true);

      // Update past lifetime
      const isActive = projectile.update(0.2);

      // Should now be inactive
      expect(isActive).toBe(false);
      expect(projectile.getIsActive()).toBe(false);
    });

    test("deactivated projectiles return false from update", () => {
      // First deactivate by exceeding lifetime
      projectile.update(defaultProps.lifetime + 0.1);

      // Now try to update again
      const result = projectile.update(0.1);
      expect(result).toBe(false);
    });
  });

  describe("Collision Handling", () => {
    test("handleCollision returns damage value", () => {
      const damage = projectile.handleCollision();
      expect(damage).toBe(defaultProps.damage);

      // Projectile should be deactivated after collision
      expect(projectile.getIsActive()).toBe(false);
    });

    test("explosive projectiles return blast radius", () => {
      const explosiveProps: ProjectileProps = {
        ...defaultProps,
        category: WeaponCategory.EXPLOSIVE,
        blastRadius: 15,
      };

      const explosiveProjectile = new Projectile(
        initialPosition,
        initialDirection,
        explosiveProps,
        scene
      );

      expect(explosiveProjectile.getBlastRadius()).toBe(15);
    });
  });

  describe("Resource Management", () => {
    test("destroy method removes projectile from scene", () => {
      expect(projectile.getIsActive()).toBe(true);

      projectile.destroy();

      // Should be deactivated
      expect(projectile.getIsActive()).toBe(false);

      // Should be removed from scene
      expect(scene.remove).toHaveBeenCalled();
    });

    test("automatic cleanup on deactivation", () => {
      // Deactivate by exceeding lifetime
      projectile.update(defaultProps.lifetime + 0.1);

      // Should be removed from scene
      expect(scene.remove).toHaveBeenCalled();
    });
  });

  describe("Special Projectile Features", () => {
    test("homing projectiles adjust direction", () => {
      const homingProps: ProjectileProps = {
        ...defaultProps,
        isHoming: true,
      };

      const homingProjectile = new Projectile(
        initialPosition,
        initialDirection,
        homingProps,
        scene
      );

      // TODO: Test homing behavior when implemented
      expect(homingProjectile).toBeDefined();
    });

    test("pierce projectiles remain active after collision", () => {
      const pierceProps: ProjectileProps = {
        ...defaultProps,
        isPierce: true,
      };

      const pierceProjectile = new Projectile(
        initialPosition,
        initialDirection,
        pierceProps,
        scene
      );

      // TODO: Test pierce behavior when implemented
      expect(pierceProjectile).toBeDefined();
    });

    test("bounce projectiles change direction on collision", () => {
      const bounceProps: ProjectileProps = {
        ...defaultProps,
        isBounce: true,
      };

      const bounceProjectile = new Projectile(
        initialPosition,
        initialDirection,
        bounceProps,
        scene
      );

      // TODO: Test bounce behavior when implemented
      expect(bounceProjectile).toBeDefined();
    });
  });
});
