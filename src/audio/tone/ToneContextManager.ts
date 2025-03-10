/**
 * ToneContextManager - Manages the Tone.js context and master volume control
 * This is a direct replacement for the Web Audio API's AudioContextManager
 */
import { Logger } from "../../utils/Logger";
import * as Tone from "tone";

export class ToneContextManager {
  /** Logger instance */
  private logger = Logger.getInstance();

  /** Flag indicating if audio is currently muted */
  private isMuted: boolean = false;

  constructor() {
    this.logger.info(
      "ToneContextManager: Creating new Tone.js context manager"
    );

    // Load mute state from localStorage
    const savedMuteState = localStorage.getItem("starWing_muted");
    this.isMuted = savedMuteState ? savedMuteState === "true" : false;

    // Set default volume to 25% if nothing is stored
    if (!localStorage.getItem("starWing_volume")) {
      localStorage.setItem("starWing_volume", "0.25");
    }

    // Set initial volume
    const volume = this.isMuted ? -Infinity : this.getVolumeInDb();
    Tone.getDestination().volume.value = volume;
  }

  /**
   * Initializes the Tone.js audio context
   */
  public async initialize(): Promise<void> {
    this.logger.info("ToneContextManager: Initializing Tone.js context");

    try {
      await Tone.start();
      this.logger.info(
        "ToneContextManager: Tone.js context started successfully"
      );
    } catch (error) {
      this.logger.error(
        "ToneContextManager: Failed to start Tone.js context",
        error
      );
    }
  }

  /**
   * Gets the current audio time in seconds
   */
  public getCurrentTime(): number {
    return Tone.now();
  }

  /**
   * Creates a Tone.js Gain node
   */
  public createGain(): Tone.Gain {
    return new Tone.Gain();
  }

  /**
   * Creates a Tone.js Oscillator
   */
  public createOscillator(): Tone.Oscillator {
    return new Tone.Oscillator();
  }

  /**
   * Creates a Tone.js Filter (equivalent to BiquadFilter)
   */
  public createFilter(): Tone.Filter {
    return new Tone.Filter();
  }

  /**
   * Gets mute state
   */
  public getMuteState(): boolean {
    return this.isMuted;
  }

  /**
   * Sets the master volume (0-1 range)
   */
  public setVolume(volume: number): void {
    if (volume < 0 || volume > 1) {
      this.logger.warn(
        `ToneContextManager: Volume out of range: ${volume}, clamping to 0-1`
      );
      volume = Math.max(0, Math.min(1, volume));
    }

    localStorage.setItem("starWing_volume", volume.toString());

    // Convert to dB for Tone.js (0-1 scale to dB scale)
    // Only change if not muted
    if (!this.isMuted) {
      const dbValue = this.linearToDb(volume);
      Tone.getDestination().volume.value = dbValue;
    }

    this.logger.info(`ToneContextManager: Volume set to ${volume}`);
  }

  /**
   * Gets the current volume (0-1 range)
   */
  public getVolume(): number {
    const volumeStr = localStorage.getItem("starWing_volume");
    return volumeStr ? parseFloat(volumeStr) : 0.25;
  }

  /**
   * Gets the current volume in dB for Tone.js
   */
  private getVolumeInDb(): number {
    return this.linearToDb(this.getVolume());
  }

  /**
   * Converts linear volume (0-1) to dB scale for Tone.js
   */
  private linearToDb(volume: number): number {
    if (volume <= 0) return -Infinity;
    // Convert 0-1 to reasonable dB range (e.g., -60dB to 0dB)
    return 20 * Math.log10(volume);
  }

  /**
   * Toggles mute state
   */
  public toggleMute(): void {
    this.isMuted = !this.isMuted;
    localStorage.setItem("starWing_muted", this.isMuted.toString());

    if (this.isMuted) {
      // Smoothly fade to silent
      Tone.getDestination().volume.rampTo(-Infinity, 0.1);
    } else {
      // Restore previous volume with a smooth fade
      const dbValue = this.getVolumeInDb();
      Tone.getDestination().volume.rampTo(dbValue, 0.1);
    }

    this.logger.info(`ToneContextManager: Mute toggled to ${this.isMuted}`);
  }

  /**
   * Checks if the audio context can play audio
   */
  public canPlayAudio(): boolean {
    return Tone.getContext().state === "running";
  }

  /**
   * Gets the sample rate of the audio context
   */
  public getSampleRate(): number {
    return Tone.getContext().sampleRate;
  }

  /**
   * Disposes of audio resources
   */
  public dispose(): void {
    this.logger.info("ToneContextManager: Disposing resources");
    // Tone.js will handle its own cleanup
  }
}
