import { GameSystem } from "../GameSystem";
import { AudioManager } from "../../audio/AudioManager";

/**
 * Adapter class that wraps the AudioManager class to implement the GameSystem interface.
 * Responsible for sound effects, music, and audio control.
 */
export class AudioSystem implements GameSystem {
  /** The underlying AudioManager instance */
  private audioManager: AudioManager;

  /**
   * Creates a new AudioSystem.
   */
  constructor() {
    this.audioManager = new AudioManager();
  }

  /**
   * Initializes the audio system.
   * @returns A promise that resolves when initialization is complete
   */
  async init(): Promise<void> {
    this.audioManager.initialize();
    return Promise.resolve();
  }

  /**
   * Updates the audio system for the current frame.
   * Currently a no-op as the AudioManager handles its own timing.
   * @param deltaTime Time elapsed since the last frame in seconds
   */
  update(deltaTime: number): void {
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
   */
  playMenuThump(): void {
    this.audioManager.playMenuThump();
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
