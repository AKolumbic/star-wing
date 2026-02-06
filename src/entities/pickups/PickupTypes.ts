/**
 * Enum of pickup types available in Star Wing.
 * Used by ZoneConfig palettes and WaveManager spawn instructions.
 */
export enum PickupType {
  /** Restores 15-25 shield */
  SHIELD_CELL = 'shield_cell',
  /** Restores 10-20 health */
  HULL_PATCH = 'hull_patch',
  /** 8s fire-rate boost (0.5x cooldown) */
  OVERCLOCK = 'overclock',
  /** Restores limited-ammo weapons */
  AMMO_CACHE = 'ammo_cache',
  /** Bonus points, no combat impact */
  SCORE_CACHE = 'score_cache',
}
