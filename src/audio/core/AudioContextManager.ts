/**
 * Manages the Web Audio context and master volume control
 */
import { Logger } from "../../utils/Logger";

export class AudioContextManager {
  /** Main audio context for all sound generation */
  private audioContext: AudioContext;

  /** Main gain node for master volume control */
  private mainGainNode: GainNode;

  /** Flag indicating if audio is currently muted */
  private isMuted: boolean = false;

  /** Logger instance */
  private logger = Logger.getInstance();

  constructor() {
    this.logger.info("AudioContextManager: Creating new audio context");

    // Create audio context
    this.audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();

    // Create main gain node for volume control
    this.mainGainNode = this.audioContext.createGain();

    // Load mute state from localStorage
    const savedMuteState = localStorage.getItem("starWing_muted");
    this.isMuted = savedMuteState ? savedMuteState === "true" : false;

    // Set default volume to 25% if nothing is stored
    if (!localStorage.getItem("starWing_volume")) {
      localStorage.setItem("starWing_volume", "0.25");
    }

    // Set initial volume
    const volume = this.isMuted ? 0 : this.getVolume() * 0.6;
    this.mainGainNode.gain.value = volume;

    this.mainGainNode.connect(this.audioContext.destination);
  }

  /**
   * Initializes the audio context
   */
  public initialize(): void {
    if (!this.audioContext) {
      // Fix typing for webkitAudioContext
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();

      // Create main gain node (master volume) with lower volume
      this.mainGainNode = this.audioContext.createGain();
      this.mainGainNode.gain.value = 0.1;
      this.mainGainNode.connect(this.audioContext.destination);
    }

    if (this.audioContext.state === "suspended") {
      this.logger.info(
        "AudioContextManager: Audio context is suspended, will resume on user interaction"
      );

      // Add event listeners to resume AudioContext on user interaction
      const resumeAudioContext = () => {
        if (this.audioContext.state === "suspended") {
          this.audioContext
            .resume()
            .then(() => {
              this.logger.info(
                "AudioContextManager: AudioContext resumed successfully"
              );
            })
            .catch((error) => {
              this.logger.error(
                "AudioContextManager: Failed to resume AudioContext:",
                error
              );
            });
        }
      };

      // Add listeners for common user interactions
      ["click", "touchstart", "keydown"].forEach((event) => {
        document.addEventListener(event, resumeAudioContext, {
          once: true,
        });
      });
    }
  }

  /**
   * Creates an audio node of the specified type
   */
  public createNode<T extends AudioNode>(factory: (ctx: AudioContext) => T): T {
    return factory(this.audioContext);
  }

  /**
   * Creates a gain node
   */
  public createGainNode(): GainNode {
    return this.audioContext.createGain();
  }

  /**
   * Creates an oscillator node
   */
  public createOscillator(): OscillatorNode {
    return this.audioContext.createOscillator();
  }

  /**
   * Creates a biquad filter node
   */
  public createBiquadFilter(): BiquadFilterNode {
    return this.audioContext.createBiquadFilter();
  }

  /**
   * Gets the current audio time
   */
  public getCurrentTime(): number {
    return this.audioContext.currentTime;
  }

  /**
   * Gets the main gain node
   */
  public getMainGainNode(): GainNode {
    return this.mainGainNode;
  }

  /**
   * Gets the current mute state
   */
  public getMuteState(): boolean {
    return this.isMuted;
  }

  /**
   * Sets the main volume level and stores it in local storage
   */
  public setVolume(volume: number): void {
    // Clamp volume between 0 and 1
    const clampedVolume = Math.max(0, Math.min(1, volume));

    this.logger.info(
      `AudioContextManager: Setting volume to ${clampedVolume} (from input: ${volume})`
    );

    // If not muted, apply the volume directly
    if (!this.isMuted) {
      // Note the 0.6 scaling factor here
      const scaledVolume = clampedVolume * 0.6;
      this.logger.info(
        `AudioContextManager: Applying scaled volume of ${scaledVolume} (scale factor: 0.6)`
      );

      this.mainGainNode.gain.setTargetAtTime(
        scaledVolume,
        this.audioContext.currentTime,
        0.01
      ); // Smoother transition

      this.logger.info(
        `AudioContextManager: Main gain node value after setting: ${this.mainGainNode.gain.value}`
      );
    } else {
      this.logger.info(
        `AudioContextManager: Volume change not applied because audio is muted`
      );
    }

    // Store the volume setting for when unmuted
    localStorage.setItem("starWing_volume", clampedVolume.toString());
    this.logger.info(
      `AudioContextManager: Volume setting saved to localStorage: ${clampedVolume}`
    );
  }

  /**
   * Gets the current volume level from local storage
   */
  public getVolume(): number {
    // Get volume from localStorage or use default (0.25 = 25%)
    const storedVolume = localStorage.getItem("starWing_volume");
    const volume = storedVolume ? parseFloat(storedVolume) : 0.25;
    this.logger.debug(
      `AudioContextManager: Retrieved volume from localStorage: ${volume}`
    );
    return volume;
  }

  /**
   * Toggles audio mute state
   */
  public toggleMute(): void {
    this.isMuted = !this.isMuted;

    // Get the stored volume - ensure it's not zero
    const storedVolume = Math.max(this.getVolume(), 0.25);
    const volume = this.isMuted ? 0 : storedVolume * 0.6;

    this.logger.info(
      `AudioContextManager: Setting volume to ${volume} (isMuted=${this.isMuted}, storedVolume=${storedVolume})`
    );

    // Use immediate value setting for more reliable volume change
    const now = this.audioContext.currentTime;

    // Cancel any scheduled values to ensure clean state
    try {
      this.mainGainNode.gain.cancelScheduledValues(now);
    } catch (err) {
      this.logger.warn("Error canceling scheduled values:", err);
    }

    // Set an immediate value then ramp quickly to target
    this.mainGainNode.gain.setValueAtTime(this.mainGainNode.gain.value, now);

    // Use exponentialRampToValueAtTime for more natural volume changes
    // But we need to avoid zero for exponential ramps
    if (volume > 0.001) {
      this.mainGainNode.gain.exponentialRampToValueAtTime(
        volume,
        now + 0.05 // 50ms ramp
      );
    } else {
      this.mainGainNode.gain.linearRampToValueAtTime(
        volume,
        now + 0.05 // 50ms ramp
      );
    }

    // Ensure connection to destination is established
    try {
      this.mainGainNode.disconnect();
    } catch (err) {
      // May not be connected, that's okay
    }
    this.mainGainNode.connect(this.audioContext.destination);

    // Store mute state in localStorage
    localStorage.setItem("starWing_muted", this.isMuted.toString());

    this.logger.info(
      `AudioContextManager: Audio ${this.isMuted ? "muted" : "unmuted"}`
    );
  }

  /**
   * Checks if audio playback is currently allowed
   */
  public canPlayAudio(): boolean {
    return this.audioContext && this.audioContext.state === "running";
  }

  /**
   * Attempts to resume the audio context if it's suspended
   */
  public async tryResume(): Promise<boolean> {
    if (!this.audioContext) return false;

    if (this.audioContext.state === "suspended") {
      try {
        await this.audioContext.resume();
        this.logger.info("AudioContextManager: AudioContext resumed manually");
        return true;
      } catch (error) {
        this.logger.error(
          "AudioContextManager: Failed to resume AudioContext:",
          error
        );
        return false;
      }
    }

    return this.audioContext.state === "running";
  }

  /**
   * Gets the sample rate of the audio context
   */
  public getSampleRate(): number {
    return this.audioContext.sampleRate;
  }

  /**
   * Gets the audio context
   */
  public getContext(): AudioContext {
    return this.audioContext;
  }

  /**
   * Disposes of the audio context manager
   */
  public dispose(): void {
    if (this.mainGainNode) {
      this.mainGainNode.disconnect();
    }

    if (this.audioContext && this.audioContext.state !== "closed") {
      try {
        this.audioContext.close();
      } catch (error) {
        this.logger.warn(
          "AudioContextManager: Error closing AudioContext:",
          error
        );
      }
    }
  }
}
