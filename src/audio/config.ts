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
   * Use Tone.js implementation (this is now always true in production)
   */
  useToneJs: true,

  /**
   * Feature toggles for gradual migration
   * These are now deprecated but kept for backward compatibility
   */
  featureToggles: {
    // Empty but provided for interface compatibility
  },

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
    laser: "assets/audio/sfx/laser.wav",
    explosion: "assets/audio/sfx/explosion.wav",
    menuSelect: "assets/audio/sfx/menu_select.wav",
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
