/**
 * ToneContextManager - Manages the Tone.js audio context
 */
import { Logger } from "../../utils/Logger";
import * as Tone from "tone";

export class ToneContextManager {
  /** Logger instance */
  private logger = Logger.getInstance();

  /** Flag indicating if audio is currently muted */
  private isMuted: boolean = false;

  /** Is the context initialized */
  private isInitialized = false;

  constructor() {
    this.logger.info("ToneContextManager: Created");

    // Load mute state from localStorage
    this.loadMuteState();
  }

  /**
   * Initializes the Tone.js context
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.info("ToneContextManager: Already initialized");
      return;
    }

    this.logger.info("ToneContextManager: Initializing");

    try {
      // Attempt to resume the context if it's suspended
      await this.startContext();

      // Now that context is started, set maxPolyphony (moved from constructor)
      // Increase polyphony limit to prevent dropped notes
      // Default is 32, we'll increase it to 64
      if (Tone.context && (Tone.context as any).options) {
        (Tone.context as any).options.maxPolyphony = 64;
        this.logger.info("ToneContextManager: Set maxPolyphony to 64");
      } else {
        this.logger.warn(
          "ToneContextManager: Could not set maxPolyphony - context not fully initialized"
        );
      }

      this.isInitialized = true;
      this.logger.info("ToneContextManager: Initialization complete");
    } catch (error) {
      this.logger.error("ToneContextManager: Initialization failed", error);
    }
  }

  /**
   * Starts the Tone.js audio context
   */
  private async startContext(): Promise<void> {
    try {
      this.logger.info(
        `ToneContextManager: Starting context (current state: ${Tone.context.state})`
      );

      // First try to resume if suspended
      if (Tone.context.state === "suspended") {
        this.logger.info("ToneContextManager: Resuming suspended context");
        await Tone.context.resume();
      }

      // Then start Tone.js
      await Tone.start();

      // Wait a bit to ensure context is actually running
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Double-check the context state
      if (Tone.context.state !== "running") {
        this.logger.warn(
          `ToneContextManager: Context still not running (state: ${Tone.context.state})`
        );
        throw new Error("Context failed to start");
      }

      this.logger.info(
        "ToneContextManager: Tone.js context started successfully"
      );
    } catch (error) {
      this.logger.error(
        "ToneContextManager: Failed to start Tone.js context",
        error
      );
      throw error;
    }
  }

  /**
   * Explicitly start the audio context (call this after user interaction)
   */
  public async startAudioContext(): Promise<void> {
    try {
      await this.startContext();
    } catch (error) {
      this.logger.error(
        "ToneContextManager: Failed to start audio context",
        error
      );
      throw error;
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

  /**
   * Loads mute state from localStorage
   */
  private loadMuteState(): void {
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
}
