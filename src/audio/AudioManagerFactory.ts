/**
 * AudioManagerFactory is responsible for creating the audio manager.
 * After the migration to Tone.js is complete, this now only returns the Tone.js implementation.
 */
import { Logger } from "../utils/Logger";
import { ToneAudioManager } from "./tone/ToneAudioManager";

export class AudioManagerFactory {
  /** Logger instance */
  private static logger = Logger.getInstance();

  /** Singleton instance for ToneAudioManager */
  private static toneInstance: ToneAudioManager;

  /**
   * Gets the Tone.js audio manager implementation
   */
  public static getAudioManager(): ToneAudioManager {
    // Create ToneAudioManager instance if needed
    if (!this.toneInstance) {
      this.toneInstance = ToneAudioManager.getInstance();
    }

    return this.toneInstance;
  }

  /**
   * Resets the audio manager instance
   * Useful for testing or when needing to recreate the audio system
   */
  public static resetInstance(): void {
    if (this.toneInstance) {
      this.toneInstance.dispose();
      this.toneInstance = undefined as any;
    }
  }
}
