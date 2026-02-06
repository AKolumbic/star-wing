import { ZoneConfig } from './levels/ZoneConfig';
import { Logger } from '../utils/Logger';
import { EnemyType } from '../entities/enemies/EnemyTypes';
import { HazardType } from '../entities/hazards/HazardTypes';
import { PickupType } from '../entities/pickups/PickupTypes';

/**
 * Size category for asteroids spawned by the wave system.
 */
export type AsteroidSize = 'small' | 'medium' | 'large';

/**
 * The category of entity to spawn.
 */
export type SpawnType = 'asteroid' | 'enemy' | 'hazard' | 'pickup' | 'boss';

/**
 * Instruction for spawning a single entity.
 * Returned by WaveManager.update() when something should spawn this frame.
 */
export interface SpawnInstruction {
  /** What category of entity to spawn */
  type: SpawnType;
  /** Asteroid size category (when type === 'asteroid') */
  size?: AsteroidSize;
  /** Asteroid radius value (when type === 'asteroid') */
  radius?: number;
  /** Enemy type to spawn (when type === 'enemy') */
  enemyType?: EnemyType;
  /** Hazard type to spawn (when type === 'hazard') */
  hazardType?: HazardType;
  /** Pickup type to spawn (when type === 'pickup') */
  pickupType?: PickupType;
  /** Boss identifier (when type === 'boss') */
  bossId?: string;
}

/**
 * A single spawn entry in a wave's plan — can be any entity type.
 */
interface SpawnEntry {
  type: SpawnType;
  /** For asteroids */
  asteroidSize?: AsteroidSize;
  /** For enemies */
  enemyType?: EnemyType;
  /** For hazards */
  hazardType?: HazardType;
  /** For pickups */
  pickupType?: PickupType;
  /** For boss */
  bossId?: string;
}

/**
 * Definition of a single wave within a zone.
 */
interface WaveDefinition {
  /** Wave number (1-based) */
  waveNumber: number;
  /** Total difficulty budget for this wave */
  difficultyBudget: number;
  /** Spawn plan: list of entities to spawn in order */
  spawnPlan: SpawnEntry[];
  /** Milliseconds between individual spawns within the wave */
  spawnDelay: number;
  /** Seconds of calm before this wave starts */
  lullDuration: number;
  /** Whether this is a boss wave */
  isBossWave: boolean;
}

/**
 * State of the wave system within the WaveManager.
 */
type WaveState = 'lull' | 'spawning' | 'clearing' | 'complete';

/**
 * Manages wave-based progression within a zone.
 * Replaces the continuous timer-based asteroid spawning with structured waves.
 *
 * Flow per wave:
 * 1. Lull - brief calm period, announcement in combat log
 * 2. Spawning - entities spawn at intervals from the spawn plan
 * 3. Clearing - all entities spawned, waiting for player to clear them
 * 4. Complete (or next wave)
 */
export class WaveManager {
  /** Generated wave definitions for the current zone */
  private waves: WaveDefinition[] = [];

  /** Current wave index (0-based) */
  private currentWaveIndex: number = 0;

  /** Current state within the wave cycle */
  private state: WaveState = 'lull';

  /** Timer for lull period (seconds remaining) */
  private lullTimer: number = 0;

  /** Timer for spawn delay (seconds remaining) */
  private spawnTimer: number = 0;

  /** Index into current wave's spawn plan */
  private spawnIndex: number = 0;

  /** Number of active entities from the current wave that must be cleared */
  private activeEntityCount: number = 0;

  /** Whether all waves have been completed */
  private zoneComplete: boolean = false;

  /** Callback to announce wave changes */
  private onWaveAnnounce: ((message: string) => void) | null = null;

  /** Logger instance */
  private logger = Logger.getInstance();

  /**
   * Generates waves for a zone based on its configuration.
   * @param zoneConfig The zone configuration to generate waves from
   * @param announceCallback Callback for wave announcements
   */
  initialize(
    zoneConfig: ZoneConfig,
    announceCallback?: (message: string) => void
  ): void {
    this.waves = [];
    this.currentWaveIndex = 0;
    this.state = 'lull';
    this.spawnIndex = 0;
    this.activeEntityCount = 0;
    this.zoneComplete = false;
    this.onWaveAnnounce = announceCallback || null;

    const baseBudget = Math.floor(zoneConfig.scoreToClear / 100);
    const budgetPerWave = Math.max(1, Math.floor(baseBudget / zoneConfig.waveCount));

    const enemyPalette = zoneConfig.enemyPalette || [];
    const hazardPalette = zoneConfig.hazardPalette || [];
    const pickupPalette = zoneConfig.pickupPalette || [];
    const bossId = zoneConfig.bossId || null;

    for (let i = 0; i < zoneConfig.waveCount; i++) {
      const waveNumber = i + 1;
      const isBossWave = bossId !== null && waveNumber === zoneConfig.waveCount;
      const budget = budgetPerWave + i * Math.floor(budgetPerWave * 0.3);

      const spawnPlan = isBossWave
        ? this.buildBossWavePlan(bossId)
        : this.buildMixedSpawnPlan(
            budget,
            waveNumber,
            zoneConfig.waveCount,
            zoneConfig.asteroidSizeRange,
            enemyPalette,
            hazardPalette,
            pickupPalette
          );

      this.waves.push({
        waveNumber,
        difficultyBudget: budget,
        spawnPlan,
        spawnDelay: Math.max(300, zoneConfig.spawnIntervalMs.min * 0.5),
        lullDuration: waveNumber === 1 ? 1.0 : 3.0,
        isBossWave,
      });
    }

    this.lullTimer = this.waves[0].lullDuration;

    this.logger.info(
      `WaveManager: Generated ${this.waves.length} waves for "${zoneConfig.name}"`
    );
  }

  /**
   * Updates the wave manager. Returns a spawn instruction if an entity
   * should be spawned this frame, or null otherwise.
   */
  update(deltaTime: number): SpawnInstruction | null {
    if (this.zoneComplete) return null;

    switch (this.state) {
      case 'lull':
        return this.updateLull(deltaTime);
      case 'spawning':
        return this.updateSpawning(deltaTime);
      case 'clearing':
        return null;
      case 'complete':
        return null;
    }
  }

  private updateLull(deltaTime: number): SpawnInstruction | null {
    this.lullTimer -= deltaTime;

    if (this.lullTimer <= 0) {
      const wave = this.waves[this.currentWaveIndex];
      this.state = 'spawning';
      this.spawnIndex = 0;
      this.spawnTimer = 0;

      if (this.onWaveAnnounce) {
        if (wave.isBossWave) {
          this.onWaveAnnounce('WARNING: BOSS INCOMING');
        } else {
          this.onWaveAnnounce(
            `WAVE ${wave.waveNumber}/${this.waves.length} INCOMING`
          );
        }
      }

      this.logger.info(
        `WaveManager: Starting Wave ${wave.waveNumber}/${this.waves.length} ` +
          `(${wave.spawnPlan.length} entities, budget ${wave.difficultyBudget})`
      );
    }

    return null;
  }

  private updateSpawning(deltaTime: number): SpawnInstruction | null {
    const wave = this.waves[this.currentWaveIndex];

    this.spawnTimer -= deltaTime * 1000;

    if (this.spawnTimer <= 0 && this.spawnIndex < wave.spawnPlan.length) {
      const entry = wave.spawnPlan[this.spawnIndex];
      this.spawnIndex++;
      this.activeEntityCount++;
      this.spawnTimer = wave.spawnDelay;

      if (this.spawnIndex >= wave.spawnPlan.length) {
        this.state = 'clearing';
        this.logger.info(
          `WaveManager: All entities spawned for Wave ${wave.waveNumber}, waiting for clear`
        );
      }

      return this.entryToInstruction(entry);
    }

    return null;
  }

  /**
   * Converts a SpawnEntry to a SpawnInstruction for the scene.
   */
  private entryToInstruction(entry: SpawnEntry): SpawnInstruction {
    switch (entry.type) {
      case 'asteroid':
        return {
          type: 'asteroid',
          size: entry.asteroidSize,
          radius: this.sizeToRadius(entry.asteroidSize || 'medium'),
        };
      case 'enemy':
        return {
          type: 'enemy',
          enemyType: entry.enemyType,
        };
      case 'hazard':
        return {
          type: 'hazard',
          hazardType: entry.hazardType,
        };
      case 'pickup':
        return {
          type: 'pickup',
          pickupType: entry.pickupType,
        };
      case 'boss':
        return {
          type: 'boss',
          bossId: entry.bossId,
        };
    }
  }

  /**
   * Called when an entity from the current wave is destroyed or removed.
   * Tracks how many remain and triggers wave completion when all are gone.
   */
  onEntityDestroyed(): void {
    this.activeEntityCount = Math.max(0, this.activeEntityCount - 1);

    if (this.state === 'clearing' && this.activeEntityCount <= 0) {
      this.onWaveCleared();
    }
  }

  /**
   * Legacy alias — call onEntityDestroyed() instead.
   */
  onAsteroidDestroyed(): void {
    this.onEntityDestroyed();
  }

  private onWaveCleared(): void {
    const wave = this.waves[this.currentWaveIndex];
    this.logger.info(`WaveManager: Wave ${wave.waveNumber} cleared!`);

    this.currentWaveIndex++;

    if (this.currentWaveIndex >= this.waves.length) {
      this.zoneComplete = true;
      this.state = 'complete';
      this.logger.info('WaveManager: All waves complete! Zone cleared.');
    } else {
      this.state = 'lull';
      this.lullTimer = this.waves[this.currentWaveIndex].lullDuration;
      this.activeEntityCount = 0;
    }
  }

  /** Whether all waves in the zone have been completed. */
  isZoneComplete(): boolean {
    return this.zoneComplete;
  }

  /** Gets the current wave number (1-based). */
  getCurrentWave(): number {
    if (this.currentWaveIndex >= this.waves.length) {
      return this.waves.length;
    }
    return this.waves[this.currentWaveIndex].waveNumber;
  }

  /** Gets the total number of waves. */
  getTotalWaves(): number {
    return this.waves.length;
  }

  /** Gets the current wave state. */
  getState(): WaveState {
    return this.state;
  }

  // ----------------------------------------------------------------
  //  Spawn plan builders
  // ----------------------------------------------------------------

  /**
   * Builds a mixed spawn plan from asteroid + enemy + hazard budgets.
   * Enemies and hazards are woven into the asteroid plan based on wave
   * progression within the zone.
   */
  private buildMixedSpawnPlan(
    budget: number,
    waveNumber: number,
    totalWaves: number,
    sizeRange: [number, number],
    enemyPalette: EnemyType[],
    hazardPalette: HazardType[],
    pickupPalette: PickupType[]
  ): SpawnEntry[] {
    const plan: SpawnEntry[] = [];
    let remaining = budget;

    const progress = waveNumber / totalWaves;
    const hasEnemies = enemyPalette.length > 0;
    const hasHazards = hazardPalette.length > 0;
    const hasPickups = pickupPalette.length > 0;

    // Enemy spawn chance ramps from 0.1 to 0.5 across waves
    const enemyChance = hasEnemies ? 0.1 + progress * 0.4 : 0;
    // Hazard chance ramps from 0 to 0.2 across waves (introduced wave 3+)
    const hazardChance =
      hasHazards && waveNumber >= 3 ? 0.05 + progress * 0.15 : 0;
    // Pickup chance is low and peaks mid-zone (recovery wave)
    const isRecoveryWave = waveNumber === totalWaves - 1;
    const pickupChance = hasPickups
      ? isRecoveryWave
        ? 0.3
        : 0.05
      : 0;

    while (remaining > 0) {
      const roll = Math.random();

      if (roll < pickupChance && remaining >= 1) {
        const pickup =
          pickupPalette[Math.floor(Math.random() * pickupPalette.length)];
        plan.push({ type: 'pickup', pickupType: pickup });
        remaining -= 1;
      } else if (roll < pickupChance + hazardChance && remaining >= 2) {
        const hazard =
          hazardPalette[Math.floor(Math.random() * hazardPalette.length)];
        plan.push({ type: 'hazard', hazardType: hazard });
        remaining -= 2;
      } else if (roll < pickupChance + hazardChance + enemyChance && remaining >= 2) {
        const enemy =
          enemyPalette[Math.floor(Math.random() * enemyPalette.length)];
        plan.push({ type: 'enemy', enemyType: enemy });
        remaining -= 2;
      } else {
        // Default: asteroid
        const asteroidSize = this.rollAsteroidSize(progress);
        const cost = asteroidSize === 'large' ? 3 : asteroidSize === 'medium' ? 2 : 1;
        if (remaining >= cost) {
          plan.push({ type: 'asteroid', asteroidSize });
          remaining -= cost;
        } else if (remaining >= 1) {
          plan.push({ type: 'asteroid', asteroidSize: 'small' });
          remaining -= 1;
        } else {
          break;
        }
      }
    }

    // Shuffle so the plan isn't clustered by type
    for (let i = plan.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [plan[i], plan[j]] = [plan[j], plan[i]];
    }

    return plan;
  }

  /**
   * Builds a boss wave plan — just the boss entity.
   */
  private buildBossWavePlan(bossId: string): SpawnEntry[] {
    return [{ type: 'boss', bossId }];
  }

  /**
   * Rolls an asteroid size weighted by wave progression.
   */
  private rollAsteroidSize(progress: number): AsteroidSize {
    const largeWeight = progress * 0.4;
    const mediumWeight = 0.3 + progress * 0.1;
    const roll = Math.random();

    if (roll < largeWeight) return 'large';
    if (roll < largeWeight + mediumWeight) return 'medium';
    return 'small';
  }

  /**
   * Converts an asteroid size category to a radius value.
   */
  private sizeToRadius(size: AsteroidSize): number {
    switch (size) {
      case 'small':
        return 20 + Math.random() * 10;
      case 'medium':
        return 30 + Math.random() * 10;
      case 'large':
        return 40 + Math.random() * 10;
    }
  }
}
