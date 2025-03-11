/**
 * AudioManagerFactory is responsible for creating the audio manager.
 * After the migration to Tone.js is complete, this now only returns the Tone.js implementation.
 */
import { ToneAudioManager } from "./tone/ToneAudioManager";
import { Logger } from "../utils/Logger";

export class AudioManagerFactory {
  private static logger = Logger.getInstance();
  private static toneInstance: ToneAudioManager;

  /**
   * Gets the Tone.js audio manager implementation
   */
  public static getAudioManager(): ToneAudioManager {
    this.logger.info("AudioManagerFactory: Using Tone.js implementation");

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
