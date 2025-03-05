import * as THREE from "three";
import { Weapon, WeaponCategory } from "./Weapon";
import { LaserCannon } from "./types/LaserCannon";
import { RapidFireGun } from "./types/RapidFireGun";
import { MissileLauncher } from "./types/MissileLauncher";
import { GravityBeam } from "./types/GravityBeam";
import { GameSystem } from "../core/GameSystem";
import { UISystem } from "../core/systems/UISystem";
import { Game } from "../core/Game";
import { AudioManager } from "../audio/AudioManager";
import { Logger } from "../utils/Logger";

/**
 * WeaponSystem manages all weapons for the player's ship.
 * It handles weapon switching, firing, and upgrades.
 */
export class WeaponSystem implements GameSystem {
  // Weapon slots
  private primaryWeapon: Weapon | null = null;
  private secondaryWeapon: Weapon | null = null;

  // All available weapons (inventory)
  private availableWeapons: Map<string, Weapon> = new Map();

  // Weapon cooldowns
  private primaryCooldown: number = 0;
  private secondaryCooldown: number = 0;

  // References
  private scene: THREE.Scene;
  private uiSystem: UISystem | null = null;

  // Game reference for future integration with game state and events
  private game: Game | null = null;
  private audioManager: AudioManager | null = null;
  private logger = Logger.getInstance();

  /**
   * Creates a new WeaponSystem
   * @param scene The scene to add projectiles to
   */
  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /**
   * Initializes the weapon system with default weapons
   * @returns Promise that resolves when initialization is complete
   */
  async init(): Promise<void> {
    // Create default weapons
    this.createDefaultWeapons();

    // Set initial weapons
    this.setPrimaryWeapon("laser");
    // Secondary weapon is optional at start
  }

  /**
   * Sets the UI system reference for updating HUD
   * @param uiSystem The UI system
   */
  setUISystem(uiSystem: UISystem): void {
    this.uiSystem = uiSystem;
  }

  /**
   * Sets the game instance
   * @param game The game instance
   */
  setGame(game: Game): void {
    this.game = game;
    this.audioManager = game.getAudioManager();
    this.logger.info("WeaponSystem: Connected to Game and AudioManager");
  }

  /**
   * Creates the default starting weapons
   */
  private createDefaultWeapons(): void {
    // Create basic weapons
    const laser = new LaserCannon(this.scene);
    this.availableWeapons.set("laser", laser);

    const rapidFire = new RapidFireGun(this.scene);
    this.availableWeapons.set("rapidfire", rapidFire);

    const missiles = new MissileLauncher(this.scene);
    this.availableWeapons.set("missiles", missiles);

    const gravityBeam = new GravityBeam(this.scene);
    this.availableWeapons.set("gravitybeam", gravityBeam);
  }

  /**
   * Updates all weapons
   * @param deltaTime Time elapsed since last update
   */
  update(deltaTime: number): void {
    // Update primary weapon
    if (this.primaryWeapon) {
      this.primaryWeapon.update(deltaTime);
      this.primaryCooldown = this.primaryWeapon.getCooldownProgress();
    }

    // Update secondary weapon
    if (this.secondaryWeapon) {
      this.secondaryWeapon.update(deltaTime);
      this.secondaryCooldown = this.secondaryWeapon.getCooldownProgress();
    }

    // Update UI
    if (this.uiSystem) {
      this.uiSystem.updateWeaponCooldowns(
        this.primaryCooldown,
        this.secondaryCooldown
      );
    }
  }

  /**
   * Fires the primary weapon
   * @param position The position to fire from
   * @param direction The direction to fire in
   * @returns Whether the weapon fired successfully
   */
  firePrimary(position: THREE.Vector3, direction: THREE.Vector3): boolean {
    if (!this.primaryWeapon) return false;

    const result = this.primaryWeapon.fire(position, direction);

    // If the weapon fired successfully, play the appropriate sound
    if (result && this.audioManager) {
      try {
        // Play sound based on weapon category
        const weaponCategory = this.primaryWeapon.getCategory();
        this.playWeaponSound(weaponCategory);
      } catch (error) {
        this.logger.error("Error playing weapon sound:", error);
      }
    }

    return result;
  }

  /**
   * Fires the secondary weapon
   * @param position The position to fire from
   * @param direction The direction to fire in
   * @returns Whether the weapon fired successfully
   */
  fireSecondary(position: THREE.Vector3, direction: THREE.Vector3): boolean {
    if (!this.secondaryWeapon) return false;

    const result = this.secondaryWeapon.fire(position, direction);

    // If the weapon fired successfully, play the appropriate sound
    if (result && this.audioManager) {
      try {
        // Play sound based on weapon category
        const weaponCategory = this.secondaryWeapon.getCategory();
        this.playWeaponSound(weaponCategory);
      } catch (error) {
        this.logger.error("Error playing weapon sound:", error);
      }
    }

    return result;
  }

  /**
   * Plays the appropriate weapon sound effect based on the weapon category
   * @param category The weapon category
   */
  private playWeaponSound(category: WeaponCategory): void {
    if (!this.audioManager) return;

    this.logger.debug(`WeaponSystem: Playing sound for ${category} weapon`);

    switch (category) {
      case WeaponCategory.ENERGY:
        this.audioManager.playLaserSound("energy");
        break;
      // case WeaponCategory.BALLISTIC:
      //   this.audioManager.playRapidFireSound("rapidfire");
      //   break;
      // case WeaponCategory.EXPLOSIVE:
      //   this.audioManager.playMissileLaunchSound("missiles");
      //   break;
      default:
        this.audioManager.playLaserSound("energy");
        break;
    }
  }

  /**
   * Sets the primary weapon by ID
   * @param weaponId The ID of the weapon to set
   * @returns Whether the weapon was set successfully
   */
  setPrimaryWeapon(weaponId: string): boolean {
    const weapon = this.availableWeapons.get(weaponId);
    if (!weapon) return false;

    this.primaryWeapon = weapon;
    this.primaryCooldown = 0;

    return true;
  }

  /**
   * Sets the secondary weapon by ID
   * @param weaponId The ID of the weapon to set
   * @returns Whether the weapon was set successfully
   */
  setSecondaryWeapon(weaponId: string): boolean {
    const weapon = this.availableWeapons.get(weaponId);
    if (!weapon) return false;

    this.secondaryWeapon = weapon;
    this.secondaryCooldown = 0;

    return true;
  }

  /**
   * Adds a new weapon to the available weapons
   * @param weaponId The ID to assign to the weapon
   * @param weapon The weapon to add
   */
  addWeapon(weaponId: string, weapon: Weapon): void {
    this.availableWeapons.set(weaponId, weapon);
  }

  /**
   * Gets whether a weapon is available
   * @param weaponId The ID of the weapon to check
   */
  hasWeapon(weaponId: string): boolean {
    return this.availableWeapons.has(weaponId);
  }

  /**
   * Gets the total number of available weapons
   */
  getWeaponCount(): number {
    return this.availableWeapons.size;
  }

  /**
   * Gets all available weapon IDs
   */
  getAvailableWeaponIds(): string[] {
    return Array.from(this.availableWeapons.keys());
  }

  /**
   * Gets the primary weapon
   */
  getPrimaryWeapon(): Weapon | null {
    return this.primaryWeapon;
  }

  /**
   * Gets the secondary weapon
   */
  getSecondaryWeapon(): Weapon | null {
    return this.secondaryWeapon;
  }

  /**
   * Gets the cooldown of the primary weapon (0-1)
   */
  getPrimaryCooldown(): number {
    return this.primaryCooldown;
  }

  /**
   * Gets the cooldown of the secondary weapon (0-1)
   */
  getSecondaryCooldown(): number {
    return this.secondaryCooldown;
  }

  /**
   * Adds ammo to a weapon
   * @param weaponId The ID of the weapon to add ammo to
   * @param amount The amount of ammo to add
   */
  addAmmo(weaponId: string, amount: number): void {
    const weapon = this.availableWeapons.get(weaponId);
    if (weapon) {
      weapon.addAmmo(amount);
    }
  }

  /**
   * Upgrades a weapon
   * @param weaponId The ID of the weapon to upgrade
   * @returns The new upgrade level, or -1 if the weapon doesn't exist
   */
  upgradeWeapon(weaponId: string): number {
    const weapon = this.availableWeapons.get(weaponId);
    if (!weapon) return -1;

    return weapon.upgrade();
  }

  /**
   * Cleans up all weapons when the system is disposed
   */
  dispose(): void {
    // Dispose of all weapons
    this.availableWeapons.forEach((weapon) => {
      weapon.dispose();
    });

    this.availableWeapons.clear();
    this.primaryWeapon = null;
    this.secondaryWeapon = null;
  }
}
