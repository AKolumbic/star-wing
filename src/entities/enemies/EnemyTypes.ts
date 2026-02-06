/**
 * Enum of enemy types available in Star Wing.
 * Used by ZoneConfig palettes and WaveManager spawn instructions.
 */
export enum EnemyType {
  /** Fast, low HP, swarm behavior */
  RAIDER = 'raider',
  /** Very fast, short bursts, high accuracy, low HP */
  STRIKER = 'striker',
  /** Slow, launches missiles, weak-point crit */
  BOMBER = 'bomber',
  /** Stationary area denial, slow rotation, medium HP */
  TURRET_DRONE = 'turret_drone',
  /** Slow, high HP, shield regen unless flanked */
  SENTINEL = 'sentinel',
  /** Miniboss: spawns 2-3 Raiders over time until destroyed */
  CARRIER_POD = 'carrier_pod',
}
