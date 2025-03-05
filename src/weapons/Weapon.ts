import * as THREE from "three";

/**
 * Enum defining the weapon categories according to the Game Design Document
 */
export enum WeaponCategory {
  BALLISTIC = "ballistic",
  ENERGY = "energy",
  EXPLOSIVE = "explosive",
  SPECIAL = "special",
}

/**
 * Interface defining the properties of a weapon
 */
export interface WeaponProps {
  name: string;
  description: string;
  damage: number;
  fireRate: number; // Shots per second
  cooldown: number; // Time between shots in seconds
  range: number; // Max distance the projectile can travel
  category: WeaponCategory;
  energyCost: number; // Energy cost per shot (if applicable)
  ammo?: number; // Optional limited ammo for some weapons
  maxAmmo?: number; // Maximum ammo capacity
  projectileSpeed?: number; // Speed of projectile if applicable
  projectileColor?: THREE.Color; // Color of the projectile
  scale?: number; // Scale factor for projectile size
  upgradeLevel?: number; // Current upgrade level of the weapon
  isActive?: boolean; // Whether the weapon is currently active
}

/**
 * Abstract base class for all weapons in the game
 */
export abstract class Weapon {
  protected props: WeaponProps;
  protected lastFired: number = 0;
  protected currentCooldown: number = 0;
  protected scene: THREE.Scene;
  protected isReady: boolean = true;

  /**
   * Creates a new weapon
   * @param props The weapon properties
   * @param scene The scene to add projectiles to
   */
  constructor(props: WeaponProps, scene: THREE.Scene) {
    this.props = {
      ...props,
      upgradeLevel: props.upgradeLevel || 0,
      isActive: props.isActive !== undefined ? props.isActive : true,
    };
    this.scene = scene;
    this.currentCooldown = 0;
  }

  /**
   * Fires the weapon if it's ready
   * @param position The position to fire from
   * @param direction The direction to fire in
   * @returns True if the weapon fired, false if on cooldown or out of ammo
   */
  fire(position: THREE.Vector3, direction: THREE.Vector3): boolean {
    // Check if weapon is active and ready to fire
    if (!this.props.isActive || !this.isReady) {
      return false;
    }

    // Check ammo if this weapon has limited ammo
    if (this.props.ammo !== undefined && this.props.ammo <= 0) {
      return false;
    }

    // Fire the weapon
    this.lastFired = Date.now();
    this.isReady = false;
    this.currentCooldown = this.props.cooldown;

    // Reduce ammo if applicable
    if (this.props.ammo !== undefined) {
      this.props.ammo--;
    }

    // The actual firing behavior is implemented by subclasses
    return this.onFire(position, direction);
  }

  /**
   * Updates the weapon state (cooldowns, etc.)
   * @param deltaTime Time elapsed since last update in seconds
   */
  update(deltaTime: number): void {
    // Update cooldown
    if (!this.isReady) {
      this.currentCooldown -= deltaTime;
      if (this.currentCooldown <= 0) {
        this.isReady = true;
        this.currentCooldown = 0;
      }
    }

    // Additional update logic can be implemented by subclasses
    this.onUpdate(deltaTime);
  }

  /**
   * Implemented by subclasses to define specific firing behavior
   * @param position The position to fire from
   * @param direction The direction to fire in
   */
  protected abstract onFire(
    position: THREE.Vector3,
    direction: THREE.Vector3
  ): boolean;

  /**
   * Implemented by subclasses for additional update logic
   * @param deltaTime Time elapsed since last update
   */
  protected onUpdate(_deltaTime: number): void {
    // Default implementation does nothing
  }

  /**
   * Adds ammo to the weapon
   * @param amount Amount of ammo to add
   */
  addAmmo(amount: number): void {
    if (this.props.ammo === undefined || this.props.maxAmmo === undefined) {
      return;
    }

    this.props.ammo = Math.min(this.props.ammo + amount, this.props.maxAmmo);
  }

  /**
   * Gets the cooldown progress (0 = ready, 1 = fully on cooldown)
   */
  getCooldownProgress(): number {
    if (this.isReady) return 0;
    return this.currentCooldown / this.props.cooldown;
  }

  /**
   * Gets the current ammo count
   */
  getAmmo(): number | undefined {
    return this.props.ammo;
  }

  /**
   * Gets the maximum ammo capacity
   */
  getMaxAmmo(): number | undefined {
    return this.props.maxAmmo;
  }

  /**
   * Gets the name of the weapon
   */
  getName(): string {
    return this.props.name;
  }

  /**
   * Gets the description of the weapon
   */
  getDescription(): string {
    return this.props.description;
  }

  /**
   * Gets the category of the weapon
   */
  getCategory(): WeaponCategory {
    return this.props.category;
  }

  /**
   * Gets whether the weapon is ready to fire
   */
  getIsReady(): boolean {
    return this.isReady;
  }

  /**
   * Sets whether the weapon is active
   */
  setActive(active: boolean): void {
    this.props.isActive = active;
  }

  /**
   * Gets whether the weapon is active
   */
  getActive(): boolean {
    return this.props.isActive || false;
  }

  /**
   * Upgrades the weapon with more power
   * @returns The new upgrade level
   */
  upgrade(): number {
    this.props.upgradeLevel = (this.props.upgradeLevel || 0) + 1;
    this.props.damage *= 1.2; // 20% damage increase per upgrade
    return this.props.upgradeLevel;
  }

  /**
   * Gets the current upgrade level
   */
  getUpgradeLevel(): number {
    return this.props.upgradeLevel || 0;
  }

  /**
   * Disposes of any resources created by the weapon
   */
  dispose(): void {
    // To be implemented by subclasses if they create persistent objects
  }
}
