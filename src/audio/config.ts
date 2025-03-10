/**
 * Audio system configuration
 * This file contains settings that control how the audio system behaves
 */

export const AudioConfig = {
  /**
   * Use Tone.js implementation instead of the original Web Audio API implementation
   * This can be changed at runtime to switch implementations
   */
  useToneJs: false,

  /**
   * Default master volume (0-1 range)
   */
  defaultVolume: 0.25,

  /**
   * Default mute state
   */
  defaultMuted: false,

  /**
   * Enable audio debug logging
   */
  enableDebugLogging: true,

  /**
   * Paths to essential audio assets
   */
  essentialAudioPaths: {
    laser: "audio/laser.mp3",
    explosion: "audio/explosion.mp3",
    menuSelect: "audio/menu_select.mp3",
  },

  /**
   * Procedural music settings
   */
  proceduralMusic: {
    /**
     * Enable procedural music generation
     */
    enabled: true,

    /**
     * Base tempo for procedural music (BPM)
     */
    baseTempo: 130,
  },
};
