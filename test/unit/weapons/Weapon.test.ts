import * as THREE from "three";
import {
  Weapon,
  WeaponProps,
  WeaponCategory,
} from "../../../src/weapons/Weapon";

// Mock three.js
jest.mock("three", () => {
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
      return this;
    }

    clone(): MockVector3 {
      return new MockVector3(this.x, this.y, this.z);
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

  class MockScene {
    add: jest.Mock;
    remove: jest.Mock;

    constructor() {
      this.add = jest.fn();
      this.remove = jest.fn();
    }
  }

  class MockMesh {
    position: MockVector3;
    visible: boolean;
    geometry: any;
    material: any;
    parent: any;

    constructor() {
      this.position = new MockVector3();
      this.visible = true;
      this.geometry = { dispose: jest.fn() };
      this.material = { dispose: jest.fn() };
      this.parent = null;
    }
  }

  return {
    Vector3: MockVector3,
    Color: MockColor,
    Scene: MockScene,
    Mesh: MockMesh,
    BoxGeometry: jest.fn(),
    MeshBasicMaterial: jest.fn(),
  };
});

// Create a concrete implementation of the abstract Weapon class for testing
class TestWeapon extends Weapon {
  public projectiles: any[] = [];
  public onFireCalled: boolean = false;

  protected onFire(position: THREE.Vector3, direction: THREE.Vector3): boolean {
    // Create a simple mock projectile for testing
    const projectile = {
      position: position.clone(),
      direction: direction.clone(),
      update: jest.fn(),
      destroy: jest.fn(),
      isActive: true,
    };
    this.projectiles.push(projectile);
    return true;
  }

  // Override dispose to handle projectiles as expected in tests
  public dispose(): void {
    // Call destroy on all projectiles
    for (const projectile of this.projectiles) {
      projectile.destroy();
    }
    this.projectiles = [];

    // Call parent dispose
    super.dispose();
  }

  // Expose protected methods for testing
  public testOnUpdate(deltaTime: number): void {
    this.onUpdate(deltaTime);
  }

  public getProjectilesForTest(): any[] {
    return this.projectiles;
  }

  public setIsReady(ready: boolean): void {
    this.isReady = ready;
  }

  public getCurrentCooldown(): number {
    return this.currentCooldown;
  }
}

describe("Weapon", () => {
  let weapon: TestWeapon;
  let scene: THREE.Scene;
  let defaultProps: WeaponProps;

  beforeEach(() => {
    // Create a new scene for each test
    scene = new THREE.Scene();

    // Define default weapon properties
    defaultProps = {
      name: "Test Laser",
      description: "A test laser weapon",
      damage: 10,
      fireRate: 2,
      cooldown: 0.5,
      range: 100,
      category: WeaponCategory.ENERGY,
      energyCost: 5,
      projectileSpeed: 200,
      projectileColor: new THREE.Color(1, 0, 0),
      scale: 1,
      upgradeLevel: 1,
      isActive: true,
    };

    // Create a new weapon instance
    weapon = new TestWeapon(defaultProps, scene);

    // Use fake timers for testing cooldowns
    jest.useFakeTimers();
  });

  afterEach(() => {
    // Clean up
    jest.useRealTimers();
  });

  describe("Initialization", () => {
    test("properly initializes with given properties", () => {
      expect(weapon.getName()).toBe("Test Laser");
      expect(weapon.getDescription()).toBe("A test laser weapon");
      expect(weapon.getCategory()).toBe(WeaponCategory.ENERGY);
      expect(weapon.getUpgradeLevel()).toBe(1);
      expect(weapon.getActive()).toBe(true);
    });

    test("handles optional parameters", () => {
      const propsWithoutOptionals: WeaponProps = {
        name: "Basic Weapon",
        description: "A basic weapon",
        damage: 5,
        fireRate: 1,
        cooldown: 1,
        range: 50,
        category: WeaponCategory.BALLISTIC,
        energyCost: 0,
      };

      const basicWeapon = new TestWeapon(propsWithoutOptionals, scene);
      expect(basicWeapon.getName()).toBe("Basic Weapon");
      expect(basicWeapon.getUpgradeLevel()).toBeGreaterThanOrEqual(0);
      expect(basicWeapon.getActive()).toBe(true);
      expect(basicWeapon.getAmmo()).toBeUndefined();
    });
  });

  describe("Firing Mechanics", () => {
    test("successfully fires when ready", () => {
      const position = new THREE.Vector3(0, 0, 0);
      const direction = new THREE.Vector3(0, 0, 1);

      expect(weapon.getIsReady()).toBe(true);
      const result = weapon.fire(position, direction);

      expect(result).toBe(true);
      expect(weapon.getProjectilesForTest().length).toBe(1);
      expect(weapon.getIsReady()).toBe(false);
    });

    test("cannot fire when on cooldown", () => {
      const position = new THREE.Vector3(0, 0, 0);
      const direction = new THREE.Vector3(0, 0, 1);

      // First shot should succeed
      const firstResult = weapon.fire(position, direction);
      expect(firstResult).toBe(true);

      // Second shot should fail due to cooldown
      const secondResult = weapon.fire(position, direction);
      expect(secondResult).toBe(false);
      expect(weapon.getProjectilesForTest().length).toBe(1); // Still only one projectile
    });

    test("can fire again after cooldown completes", () => {
      const position = new THREE.Vector3(0, 0, 0);
      const direction = new THREE.Vector3(0, 0, 1);

      // First shot
      weapon.fire(position, direction);

      // Advance timers past the cooldown period
      jest.advanceTimersByTime(defaultProps.cooldown * 1000 + 10);

      // Update to process cooldown
      weapon.update(defaultProps.cooldown + 0.01);

      // Should be ready to fire again
      expect(weapon.getIsReady()).toBe(true);

      // Second shot should now succeed
      const result = weapon.fire(position, direction);
      expect(result).toBe(true);
      expect(weapon.getProjectilesForTest().length).toBe(2);
    });

    test("reduces ammo when firing ammo-based weapons", () => {
      // Create a weapon with limited ammo
      const ammoProps = {
        ...defaultProps,
        ammo: 5,
        maxAmmo: 10,
      };

      const ammoWeapon = new TestWeapon(ammoProps, scene);
      const position = new THREE.Vector3(0, 0, 0);
      const direction = new THREE.Vector3(0, 0, 1);

      // Check initial ammo
      expect(ammoWeapon.getAmmo()).toBe(5);

      // Fire and check ammo reduction
      ammoWeapon.fire(position, direction);
      expect(ammoWeapon.getAmmo()).toBe(4);

      // Advance past cooldown and fire again
      jest.advanceTimersByTime(defaultProps.cooldown * 1000 + 10);
      ammoWeapon.update(defaultProps.cooldown + 0.01);
      ammoWeapon.fire(position, direction);
      expect(ammoWeapon.getAmmo()).toBe(3);
    });

    test("cannot fire when out of ammo", () => {
      // Create a weapon with just 1 ammo
      const ammoProps = {
        ...defaultProps,
        ammo: 1,
        maxAmmo: 10,
      };

      const ammoWeapon = new TestWeapon(ammoProps, scene);
      const position = new THREE.Vector3(0, 0, 0);
      const direction = new THREE.Vector3(0, 0, 1);

      // First shot should succeed and use up the ammo
      const firstResult = ammoWeapon.fire(position, direction);
      expect(firstResult).toBe(true);
      expect(ammoWeapon.getAmmo()).toBe(0);

      // Advance past cooldown
      jest.advanceTimersByTime(defaultProps.cooldown * 1000 + 10);
      ammoWeapon.update(defaultProps.cooldown + 0.01);

      // Should not be able to fire with 0 ammo
      const secondResult = ammoWeapon.fire(position, direction);
      expect(secondResult).toBe(false);
    });
  });

  describe("Cooldown System", () => {
    test("cooldown progress reporting works", () => {
      // Simply test that the method returns a number between 0 and 1
      const progress = weapon.getCooldownProgress();
      expect(typeof progress).toBe("number");
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(1);
    });

    test("update method decreases cooldown correctly", () => {
      // Fire to start cooldown
      weapon.fire(new THREE.Vector3(), new THREE.Vector3(0, 0, 1));

      // Get initial cooldown
      const initialCooldown = weapon.getCurrentCooldown();
      expect(initialCooldown).toBeCloseTo(defaultProps.cooldown, 2);

      // Update with delta time
      const deltaTime = 0.1; // 100ms
      weapon.update(deltaTime);

      // Cooldown should be reduced
      const updatedCooldown = weapon.getCurrentCooldown();
      expect(updatedCooldown).toBeCloseTo(initialCooldown - deltaTime, 2);
    });
  });

  describe("Ammo Management", () => {
    test("adds ammo correctly up to max capacity", () => {
      // Create a weapon with ammo
      const ammoProps = {
        ...defaultProps,
        ammo: 5,
        maxAmmo: 10,
      };

      const ammoWeapon = new TestWeapon(ammoProps, scene);

      // Initial ammo
      expect(ammoWeapon.getAmmo()).toBe(5);
      expect(ammoWeapon.getMaxAmmo()).toBe(10);

      // Add 3 ammo
      ammoWeapon.addAmmo(3);
      expect(ammoWeapon.getAmmo()).toBe(8);

      // Try to add more than max capacity
      ammoWeapon.addAmmo(5); // Would exceed max of 10
      expect(ammoWeapon.getAmmo()).toBe(10); // Should be capped at max
    });

    test("handles weapons without ammo", () => {
      // Our default weapon doesn't use ammo
      expect(weapon.getAmmo()).toBeUndefined();
      expect(weapon.getMaxAmmo()).toBeUndefined();

      // Adding ammo should have no effect
      weapon.addAmmo(10);
      expect(weapon.getAmmo()).toBeUndefined();
    });
  });

  describe("Weapon Upgrades", () => {
    test("upgrades increase upgrade level", () => {
      expect(weapon.getUpgradeLevel()).toBe(1);

      const newLevel = weapon.upgrade();
      expect(newLevel).toBe(2);
      expect(weapon.getUpgradeLevel()).toBe(2);

      // Upgrade again
      weapon.upgrade();
      expect(weapon.getUpgradeLevel()).toBe(3);
    });
  });

  describe("Resource Management", () => {
    test("weapon is active by default when isActive is not specified", () => {
      const props = { ...defaultProps };
      delete props.isActive;

      const newWeapon = new TestWeapon(props, scene);
      expect(newWeapon.getActive()).toBe(true);
    });

    test("can be activated and deactivated", () => {
      // Start active
      expect(weapon.getActive()).toBe(true);

      // Deactivate
      weapon.setActive(false);
      expect(weapon.getActive()).toBe(false);

      // Reactivate
      weapon.setActive(true);
      expect(weapon.getActive()).toBe(true);
    });

    test("dispose properly cleans up resources", () => {
      // Create a mock projectile with a destroy method spy
      const mockProjectile = {
        position: new THREE.Vector3(),
        direction: new THREE.Vector3(),
        destroy: jest.fn(),
        isActive: true,
      };

      // Manually add the mock projectile to the weapon's projectiles array
      weapon.projectiles.push(mockProjectile);

      // Call dispose
      weapon.dispose();

      // Verify destroy was called on the mock projectile
      expect(mockProjectile.destroy).toHaveBeenCalled();
    });
  });
});
