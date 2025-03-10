/**
 * AudioManagerFactory is responsible for creating the appropriate AudioManager implementation
 * based on configuration settings. This allows easy switching between implementations.
 */
import { AudioConfig } from "./config";
import { AudioManager } from "./AudioManager";
import { ToneAudioManager } from "./tone/ToneAudioManager";
import { Logger } from "../utils/Logger";

export class AudioManagerFactory {
  private static logger = Logger.getInstance();
  private static originalInstance: AudioManager;
  private static toneInstance: ToneAudioManager;

  /**
   * Gets the appropriate audio manager implementation based on configuration
   */
  public static getAudioManager(): AudioManager | ToneAudioManager {
    if (AudioConfig.useToneJs) {
      this.logger.info("AudioManagerFactory: Using Tone.js implementation");

      // Create ToneAudioManager instance if needed
      if (!this.toneInstance) {
        this.toneInstance = ToneAudioManager.getInstance();
      }

      return this.toneInstance;
    } else {
      this.logger.info(
        "AudioManagerFactory: Using original Web Audio implementation"
      );

      // Create original AudioManager instance if needed
      if (!this.originalInstance) {
        this.originalInstance = AudioManager.getInstance();
      }

      return this.originalInstance;
    }
  }

  /**
   * Switches the audio implementation at runtime
   * This will dispose the current implementation and create a new one
   */
  public static switchImplementation(useToneJs: boolean): void {
    // Skip if already using the requested implementation
    if (useToneJs === AudioConfig.useToneJs) {
      return;
    }

    this.logger.info(
      `AudioManagerFactory: Switching to ${
        useToneJs ? "Tone.js" : "Web Audio API"
      } implementation`
    );

    // Get the current implementation before switching
    const current = this.getAudioManager();

    // Get current state
    const volume = current.getVolume();
    const isMuted = current.getMuteState();

    // Dispose current implementation
    current.dispose();

    // Update configuration
    AudioConfig.useToneJs = useToneJs;

    // Create new implementation
    const newManager = this.getAudioManager();

    // Initialize the new manager
    newManager.initialize();

    // Restore state
    newManager.setVolume(volume);
    if (isMuted) {
      newManager.toggleMute();
    }

    this.logger.info(
      "AudioManagerFactory: Implementation switched successfully"
    );
  }
}
