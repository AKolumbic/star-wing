import { GameSystem } from "../GameSystem";
import { AudioManager } from "../../audio/AudioManager";
import { Logger } from "../../utils/Logger";

/**
 * Adapter class that wraps the AudioManager class to implement the GameSystem interface.
 * Responsible for sound effects, music, and audio control.
 */
export class AudioSystem implements GameSystem {
  /** The underlying AudioManager instance */
  private audioManager: AudioManager;

  /** Logger instance */
  private logger = Logger.getInstance();

  /**
   * Creates a new AudioSystem.
   */
  constructor() {
    this.audioManager = AudioManager.getInstance();
  }

  /**
   * Initializes the audio system.
   * @returns A promise that resolves when initialization is complete
   */
  async init(): Promise<void> {
    try {
      // Initialize the audio manager
      this.audioManager.initialize();

      // Use the new preloading function that handles optimization
      await this.audioManager.preloadEssentialAudio();
    } catch (error) {
      this.logger.error("Failed to initialize audio system", error);
      throw error;
    }
  }

  /**
   * Updates the audio system for the current frame.
   * Currently a no-op as the AudioManager handles its own timing.
   * @param deltaTime Time elapsed since the last frame in seconds
   */
  update(_deltaTime: number): void {
    // AudioManager handles its own timing internally
  }

  /**
   * Cleans up audio resources.
   */
  dispose(): void {
    this.audioManager.dispose();
  }

  /**
   * Gets the underlying AudioManager instance.
   * @returns The AudioManager instance
   */
  getAudioManager(): AudioManager {
    return this.audioManager;
  }

  /**
   * Plays the menu background music.
   * @param useProceduralAudio Force using procedural audio instead of MP3 (for devMode)
   * @param forceRestart If true, will force restart even if already playing
   */
  playMenuThump(
    useProceduralAudio: boolean = false,
    forceRestart: boolean = false
  ): void {
    this.audioManager.playMenuThump(useProceduralAudio, forceRestart);
  }

  /**
   * Sets the global volume.
   * @param volume Volume level from 0.0 to 1.0
   */
  setVolume(volume: number): void {
    this.audioManager.setVolume(volume);
  }

  /**
   * Gets the current volume level.
   * @returns Volume level from 0.0 to 1.0
   */
  getVolume(): number {
    return this.audioManager.getVolume();
  }

  /**
   * Toggles mute state.
   */
  toggleMute(): void {
    this.audioManager.toggleMute();
  }
}
