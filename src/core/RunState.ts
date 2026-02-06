import { UpgradeDefinition, UPGRADE_POOL } from "./UpgradeDefinitions";
import { Ship } from "../entities/Ship";
import { WeaponSystem } from "../weapons/WeaponSystem";
import { Logger } from "../utils/Logger";

/**
 * Manages the state of a single game run, tracking collected upgrades
 * and computing effective stats based on those upgrades.
 *
 * Created when a new game starts, reset on game restart or return to menu.
 */
export class RunState {
  /** Upgrades collected during this run */
  private collectedUpgrades: UpgradeDefinition[] = [];

  /** Whether the point defense shield has been used this zone */
  private pointDefenseUsedThisZone: boolean = false;

  /** Whether the reroll has been used this zone */
  private rerollUsedThisZone: boolean = false;

  /** Logger instance */
  private logger = Logger.getInstance();

  /**
   * Adds an upgrade to the run state and applies its effect.
   * @param upgrade The upgrade definition to add
   * @param ship The player's ship (for stat modifications)
   * @param weaponSystem The weapon system (for weapon modifications)
   */
  addUpgrade(
    upgrade: UpgradeDefinition,
    ship: Ship,
    weaponSystem: WeaponSystem
  ): void {
    this.collectedUpgrades.push(upgrade);
    upgrade.applyEffect(ship, weaponSystem);
    this.logger.info(
      `RunState: Applied upgrade "${upgrade.name}" (${this.getUpgradeCount(upgrade.id)} stacks)`
    );
  }

  /**
   * Checks if a specific upgrade has been collected.
   * @param upgradeId The upgrade ID to check
   * @returns True if the upgrade has been collected at least once
   */
  hasUpgrade(upgradeId: string): boolean {
    return this.collectedUpgrades.some((u) => u.id === upgradeId);
  }

  /**
   * Gets the number of times a specific upgrade has been collected.
   * @param upgradeId The upgrade ID to count
   * @returns The number of times this upgrade has been collected
   */
  getUpgradeCount(upgradeId: string): number {
    return this.collectedUpgrades.filter((u) => u.id === upgradeId).length;
  }

  /**
   * Gets all collected upgrades.
   * @returns Array of collected upgrade definitions
   */
  getCollectedUpgrades(): UpgradeDefinition[] {
    return [...this.collectedUpgrades];
  }

  /**
   * Generates a set of random upgrade choices for the player, filtered by
   * zone requirements and stack limits.
   * @param currentZone The current zone number
   * @param count Number of upgrades to offer (default 3, 4 with Intel Package)
   * @returns Array of upgrade definitions to offer
   */
  generateUpgradeChoices(
    currentZone: number,
    count?: number
  ): UpgradeDefinition[] {
    // Determine how many choices to offer
    const choiceCount =
      count ?? (this.hasUpgrade("eco_extra_choice") ? 4 : 3);

    // Filter the pool to eligible upgrades
    const eligible = UPGRADE_POOL.filter((upgrade) => {
      // Check zone requirement
      if (upgrade.minZone > currentZone) return false;

      // Check stack limit
      const currentCount = this.getUpgradeCount(upgrade.id);
      if (currentCount >= upgrade.maxStacks) return false;

      return true;
    });

    // Shuffle and pick (weighted by rarity)
    const weighted = this.weightByRarity(eligible);
    const shuffled = this.shuffleArray(weighted);
    return shuffled.slice(0, Math.min(choiceCount, shuffled.length));
  }

  /**
   * Whether the player can reroll upgrade choices this zone.
   * @returns True if reroll is available
   */
  canReroll(): boolean {
    return this.hasUpgrade("eco_reroll") && !this.rerollUsedThisZone;
  }

  /**
   * Marks the reroll as used for this zone.
   */
  useReroll(): void {
    this.rerollUsedThisZone = true;
  }

  /**
   * Called when entering a new zone to reset per-zone flags.
   */
  onZoneStart(): void {
    this.pointDefenseUsedThisZone = false;
    this.rerollUsedThisZone = false;
  }

  /**
   * Checks and consumes the point defense shield if available.
   * @param currentScore The player's current score
   * @returns True if the hit should be absorbed
   */
  tryAbsorbHit(currentScore: number): boolean {
    if (
      this.hasUpgrade("spc_score_shield") &&
      !this.pointDefenseUsedThisZone &&
      currentScore > 100
    ) {
      this.pointDefenseUsedThisZone = true;
      this.logger.info("RunState: Point Defense absorbed a hit!");
      return true;
    }
    return false;
  }

  /**
   * Gets the effective score multiplier based on collected upgrades.
   * @returns The combined score multiplier
   */
  getEffectiveScoreMultiplier(): number {
    let mult = 1.0;
    for (const upgrade of this.collectedUpgrades) {
      if (upgrade.id === "eco_score_mult") mult += 0.25;
      if (upgrade.id === "spc_magnet") mult += 0.5;
      if (upgrade.id === "wpn_explosive") mult += 0.5;
    }
    return mult;
  }

  /**
   * Gets the asteroid speed factor based on collected upgrades.
   * @returns Speed multiplier for asteroids (1.0 = normal, <1.0 = slower)
   */
  getAsteroidSpeedFactor(): number {
    return this.hasUpgrade("spc_time_dilation") ? 0.85 : 1.0;
  }

  /**
   * Resets all run state for a new game.
   */
  reset(): void {
    this.collectedUpgrades = [];
    this.pointDefenseUsedThisZone = false;
    this.rerollUsedThisZone = false;
    this.logger.info("RunState: Reset for new run");
  }

  /**
   * Weights upgrades by rarity - common appear more often, rare less.
   * @param upgrades Array of upgrades to weight
   * @returns Weighted array with duplicates for common items
   */
  private weightByRarity(upgrades: UpgradeDefinition[]): UpgradeDefinition[] {
    const weighted: UpgradeDefinition[] = [];
    for (const upgrade of upgrades) {
      switch (upgrade.rarity) {
        case "common":
          weighted.push(upgrade, upgrade, upgrade);
          break;
        case "uncommon":
          weighted.push(upgrade, upgrade);
          break;
        case "rare":
          weighted.push(upgrade);
          break;
      }
    }
    return weighted;
  }

  /**
   * Shuffles an array using Fisher-Yates algorithm.
   * Deduplicates the result to avoid offering the same upgrade twice.
   * @param array Array to shuffle
   * @returns Shuffled and deduplicated array
   */
  private shuffleArray(array: UpgradeDefinition[]): UpgradeDefinition[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    // Deduplicate by id (keep first occurrence)
    const seen = new Set<string>();
    return shuffled.filter((upgrade) => {
      if (seen.has(upgrade.id)) return false;
      seen.add(upgrade.id);
      return true;
    });
  }
}
