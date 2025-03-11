/**
 * Audio system configuration
 * This file contains settings that control how the audio system behaves
 */

export const AudioConfig = {
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
   * Performance monitoring for audio
   */
  performance: {
    /**
     * Enable performance monitoring
     */
    enableMonitoring: true,

    /**
     * Log performance metrics to console
     */
    logMetrics: false,

    /**
     * Interval for logging metrics (in ms)
     */
    loggingInterval: 10000,

    /**
     * Maximum audio nodes before warning
     */
    maxAudioNodes: 100,
  },

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
