/**
 * Handles sound effect playback
 */
import { Logger } from "../../utils/Logger";
import { AudioContextManager } from "../core/AudioContextManager";
import { BufferManager } from "../core/BufferManager";

export class SoundEffectPlayer {
  /** Context manager reference */
  private contextManager: AudioContextManager;

  /** Buffer manager reference */
  private bufferManager: BufferManager;

  /** Track active sound effects */
  private activeSources: Map<string, AudioBufferSourceNode> = new Map();

  /** Logger instance */
  private logger = Logger.getInstance();

  /** Pre-generated noise buffers for collision sounds (keyed by duration) */
  private noiseBufferCache: Map<number, AudioBuffer> = new Map();

  /** Whether audio context has been resumed (to avoid redundant resume attempts) */
  private audioContextResumed: boolean = false;

  constructor(
    contextManager: AudioContextManager,
    bufferManager: BufferManager
  ) {
    this.contextManager = contextManager;
    this.bufferManager = bufferManager;
    this.logger.info("SoundEffectPlayer: Initialized");
  }

  /**
   * Gets or creates a cached noise buffer for the given duration.
   * Avoids creating new buffers on every collision sound.
   * @param durationSeconds Duration of the noise buffer in seconds
   * @returns Cached or newly created noise buffer
   */
  private getOrCreateNoiseBuffer(durationSeconds: number): AudioBuffer {
    // Round duration to avoid too many cache entries
    const durationKey = Math.round(durationSeconds * 10) / 10;
    
    let buffer = this.noiseBufferCache.get(durationKey);
    if (!buffer) {
      const bufferSize = Math.floor(this.contextManager.getSampleRate() * durationSeconds);
      buffer = this.contextManager
        .getContext()
        .createBuffer(1, bufferSize, this.contextManager.getSampleRate());
      
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      this.noiseBufferCache.set(durationKey, buffer);
      this.logger.debug(`SoundEffectPlayer: Created noise buffer cache for ${durationKey}s`);
    }
    
    return buffer;
  }

  /**
   * Attempts to resume audio context, caching the result to avoid redundant attempts.
   */
  private tryResumeIfNeeded(): void {
    if (this.audioContextResumed) return;
    
    this.contextManager.tryResume()
      .then(() => {
        this.audioContextResumed = true;
      })
      .catch((err) => {
        this.logger.error("SoundEffectPlayer: Error resuming audio context:", err);
      });
  }

  /**
   * Plays a test tone to verify audio is working
   */
  public playTestTone(): void {
    try {
      // Use cached resume check
      this.tryResumeIfNeeded();

      const oscillator = this.contextManager.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.value = 440; // A4

      const gainNode = this.contextManager.createGainNode();
      gainNode.gain.value = 0.05; // Low volume

      oscillator.connect(gainNode);
      gainNode.connect(this.contextManager.getMainGainNode());

      const now = this.contextManager.getCurrentTime();
      oscillator.start(now);
      oscillator.stop(now + 0.3); // Short duration

      this.logger.info("SoundEffectPlayer: Played test tone");
    } catch (error) {
      this.logger.error("SoundEffectPlayer: Error playing test tone:", error);
    }
  }

  /**
   * Plays a previously loaded audio sample
   */
  public playAudioSample(
    id: string,
    volume: number = 0.5,
    loop: boolean = false
  ): AudioBufferSourceNode | null {
    // Use cached resume check
    this.tryResumeIfNeeded();

    const buffer = this.bufferManager.getBuffer(id);
    if (!buffer) {
      this.logger.warn(`SoundEffectPlayer: Audio sample ${id} not found`);
      return null;
    }

    try {
      // Create and configure the source node
      const source = this.contextManager.getContext().createBufferSource();
      source.buffer = buffer;
      source.loop = loop;

      // For looping audio (menu music), configure a precise loopEnd point
      if (loop && id === "menuMusic") {
        // Set loop end precisely 5ms before the end to avoid boundary artifacts
        const bufferDuration = buffer.duration;
        const loopEndTime = bufferDuration - 0.005; // 5ms before end

        // Only set if we're not cutting off too much
        if (loopEndTime > bufferDuration * 0.98) {
          source.loopEnd = loopEndTime;
          this.logger.info(
            `SoundEffectPlayer: Set loop end at ${loopEndTime.toFixed(
              4
            )}s (buffer: ${bufferDuration.toFixed(4)}s)`
          );
        }
      }

      // Create a gain node for volume control with gentle ramping
      const gainNode = this.contextManager.createGainNode();

      // Start with zero gain and ramp up quickly to avoid clicks
      const now = this.contextManager.getCurrentTime();
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(
        volume * (this.contextManager.getMuteState() ? 0 : 1),
        now + 0.02 // 20ms ramp
      );

      // Connect the nodes
      source.connect(gainNode);
      gainNode.connect(this.contextManager.getMainGainNode());

      // Start playback
      source.start(0);

      // Only track important sounds to avoid memory leaks
      if (id === "menuMusic" || loop) {
        this.activeSources.set(id, source);

        // Set up cleanup when the sound stops
        source.onended = () => {
          this.activeSources.delete(id);
          this.logger.info(`SoundEffectPlayer: Audio source ended: ${id}`);
        };
      }

      this.logger.info(
        `SoundEffectPlayer: Playing audio sample ${id} (loop: ${loop}, volume: ${volume})`
      );

      return source;
    } catch (error) {
      this.logger.error(
        `SoundEffectPlayer: Error playing audio sample ${id}:`,
        error
      );
      return null;
    }
  }

  /**
   * Plays a laser firing sound effect
   */
  public playLaserSound(weaponCategory: string = "energy"): void {
    // Use cached resume check
    this.tryResumeIfNeeded();

    if (this.contextManager.getMuteState()) {
      return;
    }

    try {
      // Create master gain node
      const masterGain = this.contextManager.createGainNode();
      masterGain.connect(this.contextManager.getMainGainNode());
      masterGain.gain.value = 0.3; // Increased volume for better audibility

      // Different sound characteristics based on weapon type
      let oscillatorType: OscillatorType = "sine";
      let baseFrequency = 880; // A5
      let sweepEnd = 220; // A3
      let duration = 0.2;

      if (weaponCategory === "energy") {
        // High-pitched laser sound
        oscillatorType = "sawtooth";
        baseFrequency = 1200;
        sweepEnd = 400;
        duration = 0.15;
      } else if (weaponCategory === "ballistic") {
        // Lower, punchier sound for ballistic weapons
        oscillatorType = "square";
        baseFrequency = 220;
        sweepEnd = 110;
        duration = 0.1;
      } else if (weaponCategory === "explosive") {
        // Deeper sound for explosive weapons
        oscillatorType = "triangle";
        baseFrequency = 150;
        sweepEnd = 80;
        duration = 0.3;
      }

      // Create oscillator
      const osc = this.contextManager.createOscillator();
      osc.type = oscillatorType;
      osc.frequency.value = baseFrequency;

      // Create a filter for the laser sound
      const filter = this.contextManager.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = baseFrequency;
      filter.Q.value = 5;

      // Create gain node for envelope
      const gainNode = this.contextManager.createGainNode();

      // Connect nodes
      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(masterGain);

      // Create second oscillator for harmonic
      const osc2 = this.contextManager.createOscillator();
      osc2.type = "sine";
      osc2.frequency.value = baseFrequency * 1.5;

      const gainNode2 = this.contextManager.createGainNode();
      osc2.connect(gainNode2);
      gainNode2.connect(masterGain);
      gainNode2.gain.value = 0.1;

      // Schedule sound
      const now = this.contextManager.getCurrentTime();

      // Attack-decay envelope for primary oscillator
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.4, now + 0.01); // Faster attack
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

      // Frequency sweep for sci-fi effect
      osc.frequency.setValueAtTime(baseFrequency, now);
      osc.frequency.exponentialRampToValueAtTime(sweepEnd, now + duration);

      // Start and stop oscillators
      osc.start(now);
      osc.stop(now + duration);

      osc2.start(now);
      osc2.stop(now + duration);

      this.logger.debug("SoundEffectPlayer: Playing laser sound");
    } catch (error) {
      this.logger.error("SoundEffectPlayer: Error playing laser sound:", error);
    }
  }

  /**
   * Plays an asteroid collision sound effect.
   * Optimized to use cached noise buffers.
   */
  public playCollisionSound(intensity: string = "medium"): void {
    // Use cached resume check to avoid redundant resume attempts
    this.tryResumeIfNeeded();

    if (this.contextManager.getMuteState()) {
      return;
    }

    try {
      // Create master gain node
      const masterGain = this.contextManager.createGainNode();
      masterGain.connect(this.contextManager.getMainGainNode());
      masterGain.gain.value = 0.4; // Slightly louder than laser sounds

      // Different sound characteristics based on collision intensity
      let duration = 0.3;
      let noiseGain = 0.7;

      if (intensity === "light") {
        duration = 0.2;
        noiseGain = 0.5;
      } else if (intensity === "heavy") {
        duration = 0.5;
        noiseGain = 0.9;
      }

      // Use cached noise buffer instead of creating new one each time
      const noiseBuffer = this.getOrCreateNoiseBuffer(duration);

      // Create noise source
      const noise = this.contextManager.getContext().createBufferSource();
      noise.buffer = noiseBuffer;

      // Create filters to shape the noise into an impact sound
      const lowpass = this.contextManager.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.value = 400;
      lowpass.Q.value = 1;

      const highpass = this.contextManager.createBiquadFilter();
      highpass.type = "highpass";
      highpass.frequency.value = 100;
      highpass.Q.value = 1;

      // Create gain node for envelope
      const noiseGainNode = this.contextManager.createGainNode();

      // Connect nodes
      noise.connect(lowpass);
      lowpass.connect(highpass);
      highpass.connect(noiseGainNode);
      noiseGainNode.connect(masterGain);

      const now = this.contextManager.getCurrentTime();

      // Start noise
      noise.start(now);

      // Envelope for impact sound - quick attack, longer decay
      noiseGainNode.gain.setValueAtTime(0, now);
      noiseGainNode.gain.linearRampToValueAtTime(noiseGain, now + 0.01);
      noiseGainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

      // Add a low frequency oscillator for the "thud" component
      const thud = this.contextManager.createOscillator();
      thud.type = "sine";
      thud.frequency.value = 80;

      const thudGain = this.contextManager.createGainNode();
      thud.connect(thudGain);
      thudGain.connect(masterGain);

      // Envelope for thud - slightly delayed attack, quick decay
      thudGain.gain.setValueAtTime(0, now);
      thudGain.gain.linearRampToValueAtTime(0.6, now + 0.02);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      // Start and stop oscillator
      thud.start(now);
      thud.stop(now + 0.2);

      // Stop noise after duration
      noise.stop(now + duration);

      this.logger.debug("SoundEffectPlayer: Playing collision sound");
    } catch (error) {
      this.logger.error(
        "SoundEffectPlayer: Error playing collision sound:",
        error
      );
    }
  }

  /**
   * Disposes of the sound effect player
   */
  public dispose(): void {
    // Stop all active sources
    this.activeSources.forEach((source, id) => {
      try {
        source.stop();
        source.disconnect();
      } catch (error) {
        // Ignore errors when stopping
      }
    });

    this.activeSources.clear();
    this.logger.info("SoundEffectPlayer: Disposed");
  }
}
