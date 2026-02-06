import { ZoneConfig } from "./levels/ZoneConfig";
import { Logger } from "../utils/Logger";

/**
 * Size category for asteroids spawned by the wave system.
 */
export type AsteroidSize = "small" | "medium" | "large";

/**
 * Instruction for spawning a single asteroid.
 */
export interface SpawnInstruction {
  /** Size category of the asteroid to spawn */
  size: AsteroidSize;
  /** Actual radius value for the asteroid */
  radius: number;
}

/**
 * Definition of a single wave within a zone.
 */
interface WaveDefinition {
  /** Wave number (1-based) */
  waveNumber: number;
  /** Total difficulty budget for this wave */
  difficultyBudget: number;
  /** Asteroid spawn plan: list of sizes to spawn */
  spawnPlan: AsteroidSize[];
  /** Milliseconds between individual spawns within the wave */
  spawnDelay: number;
  /** Seconds of calm before this wave starts */
  lullDuration: number;
}

/**
 * State of the wave system within the WaveManager.
 */
type WaveState = "lull" | "spawning" | "clearing" | "complete";

/**
 * Manages wave-based progression within a zone.
 * Replaces the continuous timer-based asteroid spawning with structured waves.
 *
 * Flow per wave:
 * 1. Lull - brief calm period, announcement in combat log
 * 2. Spawning - asteroids spawn at intervals from the spawn plan
 * 3. Clearing - all asteroids spawned, waiting for player to clear them
 * 4. Complete (or next wave)
 */
export class WaveManager {
  /** Generated wave definitions for the current zone */
  private waves: WaveDefinition[] = [];

  /** Current wave index (0-based) */
  private currentWaveIndex: number = 0;

  /** Current state within the wave cycle */
  private state: WaveState = "lull";

  /** Timer for lull period (seconds remaining) */
  private lullTimer: number = 0;

  /** Timer for spawn delay (seconds remaining) */
  private spawnTimer: number = 0;

  /** Index into current wave's spawn plan */
  private spawnIndex: number = 0;

  /** Number of active asteroids from the current wave */
  private activeAsteroidCount: number = 0;

  /** Whether all waves have been completed */
  private zoneComplete: boolean = false;

  /** Callback to announce wave changes */
  private onWaveAnnounce: ((message: string) => void) | null = null;

  /** Logger instance */
  private logger = Logger.getInstance();

  /**
   * Generates waves for a zone based on its configuration.
   * Adapts festive-moser's ZoneConfig to a wave-based system.
   * @param zoneConfig The zone configuration to generate waves from
   * @param announceCallback Callback for wave announcements
   */
  initialize(
    zoneConfig: ZoneConfig,
    announceCallback?: (message: string) => void
  ): void {
    this.waves = [];
    this.currentWaveIndex = 0;
    this.state = "lull";
    this.spawnIndex = 0;
    this.activeAsteroidCount = 0;
    this.zoneComplete = false;
    this.onWaveAnnounce = announceCallback || null;

    // Derive wave parameters from festive-moser's ZoneConfig
    // Base difficulty: derived from scoreToClear and maxAsteroids
    const baseBudget = Math.floor(zoneConfig.scoreToClear / 100);
    const budgetPerWave = Math.floor(baseBudget / zoneConfig.waveCount);

    // Generate wave definitions
    for (let i = 0; i < zoneConfig.waveCount; i++) {
      const waveNumber = i + 1;
      // Ramp up difficulty across waves
      const budget = budgetPerWave + i * Math.floor(budgetPerWave * 0.3);

      const spawnPlan = this.budgetToSpawnPlan(
        budget,
        waveNumber,
        zoneConfig.waveCount,
        zoneConfig.asteroidSizeRange
      );

      this.waves.push({
        waveNumber,
        difficultyBudget: budget,
        spawnPlan,
        // Faster spawning within waves based on zone's spawn interval
        spawnDelay: Math.max(300, zoneConfig.spawnIntervalMs.min * 0.5),
        // Shorter lull for first wave
        lullDuration: waveNumber === 1 ? 1.0 : 3.0,
      });
    }

    // Start the first wave's lull
    this.lullTimer = this.waves[0].lullDuration;

    this.logger.info(
      `WaveManager: Generated ${this.waves.length} waves for "${zoneConfig.name}"`
    );
  }

  /**
   * Updates the wave manager. Returns a spawn instruction if an asteroid
   * should be spawned this frame, or null otherwise.
   * @param deltaTime Time elapsed since last frame in seconds
   * @returns SpawnInstruction if an asteroid should spawn, null otherwise
   */
  update(deltaTime: number): SpawnInstruction | null {
    if (this.zoneComplete) return null;

    switch (this.state) {
      case "lull":
        return this.updateLull(deltaTime);
      case "spawning":
        return this.updateSpawning(deltaTime);
      case "clearing":
        // Just waiting for asteroids to be destroyed
        return null;
      case "complete":
        return null;
    }
  }

  private updateLull(deltaTime: number): SpawnInstruction | null {
    this.lullTimer -= deltaTime;

    if (this.lullTimer <= 0) {
      // Lull is over, start spawning
      const wave = this.waves[this.currentWaveIndex];
      this.state = "spawning";
      this.spawnIndex = 0;
      this.spawnTimer = 0; // Spawn first asteroid immediately

      // Announce the wave
      if (this.onWaveAnnounce) {
        this.onWaveAnnounce(
          `WAVE ${wave.waveNumber}/${this.waves.length} INCOMING`
        );
      }

      this.logger.info(
        `WaveManager: Starting Wave ${wave.waveNumber}/${this.waves.length} ` +
          `(${wave.spawnPlan.length} asteroids, budget ${wave.difficultyBudget})`
      );
    }

    return null;
  }

  private updateSpawning(deltaTime: number): SpawnInstruction | null {
    const wave = this.waves[this.currentWaveIndex];

    this.spawnTimer -= deltaTime * 1000; // Convert to ms

    if (this.spawnTimer <= 0 && this.spawnIndex < wave.spawnPlan.length) {
      // Time to spawn the next asteroid
      const size = wave.spawnPlan[this.spawnIndex];
      this.spawnIndex++;
      this.activeAsteroidCount++;
      this.spawnTimer = wave.spawnDelay;

      // If we've spawned everything, move to clearing state
      if (this.spawnIndex >= wave.spawnPlan.length) {
        this.state = "clearing";
        this.logger.info(
          `WaveManager: All asteroids spawned for Wave ${wave.waveNumber}, waiting for clear`
        );
      }

      return {
        size,
        radius: this.sizeToRadius(size),
      };
    }

    return null;
  }

  /**
   * Called when an asteroid from the current wave is destroyed.
   * Tracks how many remain and triggers wave completion when all are gone.
   */
  onAsteroidDestroyed(): void {
    this.activeAsteroidCount = Math.max(0, this.activeAsteroidCount - 1);

    if (this.state === "clearing" && this.activeAsteroidCount <= 0) {
      this.onWaveCleared();
    }
  }

  /**
   * Called when all asteroids in the current wave are destroyed.
   */
  private onWaveCleared(): void {
    const wave = this.waves[this.currentWaveIndex];
    this.logger.info(`WaveManager: Wave ${wave.waveNumber} cleared!`);

    // Move to next wave
    this.currentWaveIndex++;

    if (this.currentWaveIndex >= this.waves.length) {
      // All waves complete
      this.zoneComplete = true;
      this.state = "complete";
      this.logger.info("WaveManager: All waves complete! Zone cleared.");
    } else {
      // Start lull for next wave
      this.state = "lull";
      this.lullTimer = this.waves[this.currentWaveIndex].lullDuration;
      this.activeAsteroidCount = 0;
    }
  }

  /**
   * Whether all waves in the zone have been completed.
   */
  isZoneComplete(): boolean {
    return this.zoneComplete;
  }

  /**
   * Gets the current wave number (1-based).
   */
  getCurrentWave(): number {
    if (this.currentWaveIndex >= this.waves.length) {
      return this.waves.length;
    }
    return this.waves[this.currentWaveIndex].waveNumber;
  }

  /**
   * Gets the total number of waves.
   */
  getTotalWaves(): number {
    return this.waves.length;
  }

  /**
   * Gets the current wave state.
   */
  getState(): WaveState {
    return this.state;
  }

  /**
   * Converts a difficulty budget into a list of asteroid sizes to spawn.
   * Early waves favor small asteroids, later waves shift to larger ones.
   * Uses the zone's asteroid size range to map sizes appropriately.
   * @param budget The difficulty budget to spend
   * @param waveNumber Current wave number (for weighting)
   * @param totalWaves Total waves in the zone (for weighting)
   * @param sizeRange The zone's [min, max] asteroid size range
   * @returns Array of asteroid sizes
   */
  private budgetToSpawnPlan(
    budget: number,
    waveNumber: number,
    totalWaves: number,
    sizeRange: [number, number]
  ): AsteroidSize[] {
    const plan: AsteroidSize[] = [];
    let remaining = budget;

    // Calculate weights based on wave progression
    const progress = waveNumber / totalWaves; // 0.0 to 1.0
    // Early waves: mostly small; late waves: more large
    const largeWeight = progress * 0.4; // 0 to 0.4
    const mediumWeight = 0.3 + progress * 0.1; // 0.3 to 0.4
    // smallWeight is the remainder

    while (remaining > 0) {
      const roll = Math.random();

      if (roll < largeWeight && remaining >= 3) {
        plan.push("large");
        remaining -= 3;
      } else if (roll < largeWeight + mediumWeight && remaining >= 2) {
        plan.push("medium");
        remaining -= 2;
      } else if (remaining >= 1) {
        plan.push("small");
        remaining -= 1;
      } else {
        break;
      }
    }

    // Shuffle the plan so sizes are intermixed
    for (let i = plan.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [plan[i], plan[j]] = [plan[j], plan[i]];
    }

    return plan;
  }

  /**
   * Converts an asteroid size category to a radius value.
   * Small: 20-30, Medium: 30-40, Large: 40-50
   */
  private sizeToRadius(size: AsteroidSize): number {
    switch (size) {
      case "small":
        return 20 + Math.random() * 10; // 20-30
      case "medium":
        return 30 + Math.random() * 10; // 30-40
      case "large":
        return 40 + Math.random() * 10; // 40-50
    }
  }
}
