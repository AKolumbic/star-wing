import { GameSystem } from "../GameSystem";
import {
  getAudioManager,
  initializeAudioSystem,
} from "../../audio/initializeAudio";
import { ToneAudioManager } from "../../audio/tone/ToneAudioManager";
import { Logger } from "../../utils/Logger";

/**
 * Adapter class that wraps the ToneAudioManager class to implement the GameSystem interface.
 * Responsible for sound effects, music, and audio control.
 */
export class AudioSystem implements GameSystem {
  /** The underlying ToneAudioManager instance */
  private audioManager: ToneAudioManager;

  /** Flag to track if audio system has been initialized */
  private isInitialized = false;

  /** Logger instance */
  private logger = Logger.getInstance();

  /**
   * Creates a new AudioSystem.
   */
  constructor() {
    this.audioManager = getAudioManager();
  }

  /**
   * Initializes the audio system.
   * @returns A promise that resolves when initialization is complete
   */
  async init(): Promise<void> {
    // Skip if already initialized
    if (this.isInitialized) {
      this.logger.debug("AudioSystem already initialized, skipping");
      return Promise.resolve();
    }

    try {
      // Initialize the audio system using the helper
      // This will already handle preloading essential audio
      await initializeAudioSystem();

      // No need to call preloadEssentialAudio separately - it's already done in initializeAudioSystem

      // Mark as initialized
      this.isInitialized = true;

      return Promise.resolve();
    } catch (error) {
      console.error("Failed to initialize audio system:", error);
      // Continue even if initialization fails
      return Promise.resolve();
    }
  }

  /**
   * Updates the audio system for the current frame.
   * Currently a no-op as the ToneAudioManager handles its own timing.
   * @param deltaTime Time elapsed since the last frame in seconds
   */
  update(_deltaTime: number): void {
    // ToneAudioManager handles its own timing internally
  }

  /**
   * Cleans up audio resources.
   */
  dispose(): void {
    this.audioManager.dispose();
  }

  /**
   * Gets the underlying ToneAudioManager instance.
   * @returns The ToneAudioManager instance
   */
  getAudioManager(): ToneAudioManager {
    return this.audioManager;
  }

  /**
   * Plays the menu background music.
   * @param useProceduralAudio Force using procedural audio instead of MP3 (for devMode)
   * @param forceRestart If true, will force restart even if already playing
   */
  playMenuMusic(
    useProceduralAudio: boolean = false,
    forceRestart: boolean = false
  ): void {
    if (useProceduralAudio) {
      this.audioManager.playMenuMusic(true);
    } else {
      this.audioManager.playMenuMusic(false);
    }
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
