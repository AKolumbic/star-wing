import { EnemyType } from '../../entities/enemies/EnemyTypes';
import { HazardType } from '../../entities/hazards/HazardTypes';
import { PickupType } from '../../entities/pickups/PickupTypes';

export type DriftPattern = 'none' | 'lateral' | 'spiral' | 'surge';

export interface ZoneConfig {
  id: number;
  name: string;
  scoreToClear: number;
  waveCount: number;
  spawnIntervalMs: {
    start: number;
    min: number;
  };
  maxAsteroids: number;
  asteroidSizeRange: [number, number];
  asteroidSpeedRange: [number, number];
  asteroidDamageRange: [number, number];
  playfield: {
    horizontalLimit: number;
    verticalLimit: number;
  };
  driftPattern: DriftPattern;
  background?: {
    starColor?: number;
    minSpeed?: number;
    maxSpeed?: number;
  };
  audioTrackId?: string;

  /** Enemy types available in this zone (empty = asteroids only) */
  enemyPalette?: EnemyType[];
  /** Hazard types available in this zone */
  hazardPalette?: HazardType[];
  /** Pickup types available in this zone */
  pickupPalette?: PickupType[];
  /** Boss identifier for this zone's final wave (null = no boss) */
  bossId?: string;
  /** Probability of a pickup drop on enemy kill (0.0-1.0) */
  pickupDropRate?: number;
}
