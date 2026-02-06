/**
 * Enum of hazard types available in Star Wing.
 * Used by ZoneConfig palettes and WaveManager spawn instructions.
 */
export enum HazardType {
  /** Slow-moving hull fragments that block shots */
  DEBRIS_FIELD = 'debris_field',
  /** Detonates near player, clearable by shooting */
  PROXIMITY_MINE = 'proximity_mine',
  /** Drains shields while player is inside */
  RADIATION_CLOUD = 'radiation_cloud',
  /** Subtle lateral pull that constrains movement */
  GRAVITY_RIFT = 'gravity_rift',
}
