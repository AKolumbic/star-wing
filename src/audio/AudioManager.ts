/**
 * AudioManager is responsible for all sound generation and audio playback in the game.
 * It uses the Web Audio API to create a procedural synth soundtrack and handles all audio settings.
 */
import { Logger } from "../utils/Logger";

export class AudioManager {
  /** Main audio context for all sound generation */
  private audioContext: AudioContext;
  /** Flag indicating if the audio system has been initialized */
  private isInitialized: boolean = false;
  /** Flag indicating if audio is currently muted */
  private isMuted: boolean = false;
  /** Flag indicating if music is currently playing */
  private isPlaying: boolean = false;
  /** Main gain node for master volume control */
  private mainGainNode: GainNode;
  /** Time to schedule the next musical note */
  private nextNoteTime: number = 0;
  /** Reference to the audio scheduler setTimeout */
  private schedulerTimer: number | null = null;
  /** Audio buffer cache to prevent recreating common sounds */
  private audioBufferCache: Map<string, AudioBuffer> = new Map();
  /** Node cache to store and reuse AudioNodes */
  private nodeCache: Map<string, AudioNode> = new Map();

  /** Logger instance */
  private logger = Logger.getInstance();

  /** Base note frequencies for procedural music generation */
  // D minor scale frequencies
  private dFrequency: number = 73.42; // D2
  private fFrequency: number = 87.31; // F2
  private aFrequency: number = 110.0; // A2
  private cFrequency: number = 130.81; // C3

  // Kavinsky-inspired patterns - simple and driving
  /** Bass drum pattern (1 = play, 0 = silent) */
  private bassPattern = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];

  /**
   * D minor arpeggio pattern: D, F, A, C, A, F
   * Values correspond to indexes in arpeggioNotes array
   * -1 means no note played
   */
  private arpeggioPattern = [
    0, -1, 1, -1, 2, -1, 3, -1, 2, -1, 1, -1, 0, -1, -1, -1, 0, -1, 1, -1, 2,
    -1, 3, -1, 2, -1, 1, -1, 0, 2, 3, 1,
  ];

  /** Frequency lookup for arpeggios */
  private arpeggioNotes = [
    this.dFrequency * 2, // D3
    this.fFrequency * 2, // F3
    this.aFrequency * 2, // A3
    this.cFrequency * 2, // C4
  ];

  /**
   * Pattern for synth chord arpeggiation
   * Each pair represents [D, A] note triggering
   */
  private synthArpPattern = [
    [0, 0],
    [0, 0],
    [1, 0],
    [0, 0],
    [0, 1],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [1, 0],
    [0, 0],
    [0, 1],
    [0, 0],
    [0, 0],
    [1, 1],
  ]; // [D, A] notes

  /** Current beat position in the pattern sequence */
  private currentBeat: number = 0;
  /** Music tempo in beats per minute */
  private tempo: number = 120;

  /**
   * Initializes the AudioManager with a suspended audio context.
   * Audio context will be resumed on first user interaction.
   */
  constructor() {
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

    this.logger.info(
      "AudioManager: Constructor completed, audio context created"
    );
  }

  /**
   * Plays a simple test tone to verify audio is working.
   * This is useful to check that the audio context is properly resumed.
   */
  playTestTone(): void {
    if (!this.audioContext) {
      this.logger.error(
        "AudioManager: Cannot play test tone - no audio context"
      );
      return;
    }

    if (this.audioContext.state === "suspended") {
      this.logger.info("AudioManager: Resuming audio context");
      this.audioContext.resume();
    }

    try {
      const oscillator = this.audioContext.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.value = 440; // A4

      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = 0.05; // Much lower gain - 5% volume

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      const now = this.audioContext.currentTime;
      oscillator.start(now);
      oscillator.stop(now + 0.3); // Shorter duration - just 0.3 seconds
    } catch (error) {
      this.logger.error("AudioManager: Error playing test tone:", error);
    }
  }

  /**
   * Initializes the audio system.
   * Creates and configures the audio context if it doesn't exist.
   * Safe to call multiple times; will only initialize once.
   */
  public initialize(): void {
    if (this.isInitialized) return;

    this.logger.info("AudioManager: Initializing");

    try {
      if (!this.audioContext) {
        // Fix typing for webkitAudioContext
        const AudioContextClass =
          window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioContextClass();

        // Create main gain node (master volume) with lower volume
        this.mainGainNode = this.audioContext.createGain();
        this.mainGainNode.gain.value = 0.1;
        this.mainGainNode.connect(this.audioContext.destination);

        if (this.audioContext.state === "suspended") {
          this.logger.info(
            "AudioManager: Audio context is suspended, will resume on user interaction"
          );
        }
      }

      // Pre-create and cache common nodes for better performance
      this.createFilterNode("lowpass1000", "lowpass", 1000, 5);
      this.createFilterNode("lowpass2000", "lowpass", 2000, 3);

      this.isInitialized = true;
    } catch (error) {
      this.logger.error(
        "AudioManager: Error initializing audio context:",
        error
      );
    }
  }

  /**
   * Creates and caches a filter node with the specified parameters.
   * @param id Unique identifier for this node in the cache
   * @param type The type of filter to create
   * @param frequency The filter cutoff frequency
   * @param Q The filter Q value (resonance)
   * @returns The created BiquadFilterNode
   */
  private createFilterNode(
    id: string,
    type: BiquadFilterType,
    frequency: number,
    Q: number
  ): BiquadFilterNode {
    if (this.nodeCache.has(id)) {
      return this.nodeCache.get(id) as BiquadFilterNode;
    }

    const filter = this.audioContext.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    filter.Q.value = Q;

    this.nodeCache.set(id, filter);
    return filter;
  }

  /**
   * Starts playing the menu music.
   * If the audio system is not initialized, it will be initialized first.
   * If music is already playing, this method does nothing.
   */
  public playMenuThump(): void {
    if (!this.isInitialized) {
      this.logger.info("AudioManager: Not initialized, initializing now");
      this.initialize();
    }

    // Resume audio context if suspended
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume().catch((err) => {
        this.logger.error("AudioManager: Error resuming AudioContext:", err);
      });
    }

    if (this.isPlaying) {
      return;
    }

    try {
      this.isPlaying = true;
      this.nextNoteTime = this.audioContext.currentTime;
      this.scheduleBeats();
    } catch (err) {
      this.logger.error("AudioManager: Error starting audio playback:", err);
    }
  }

  /**
   * Stops all music playback.
   * Clears the scheduler and stops any ongoing audio.
   */
  public stopMusic(): void {
    this.isPlaying = false;
    if (this.schedulerTimer !== null) {
      window.clearTimeout(this.schedulerTimer);
      this.schedulerTimer = null;
    }
  }

  /**
   * Returns the current mute state.
   * @returns True if audio is muted, false otherwise
   */
  public getMuteState(): boolean {
    return this.isMuted;
  }

  /**
   * Sets the master volume level.
   * @param volume Volume level between 0 and 1
   */
  public setVolume(volume: number): void {
    // Clamp volume between 0 and 1
    const clampedVolume = Math.max(0, Math.min(1, volume));

    // If not muted, apply the volume directly
    if (!this.isMuted) {
      this.mainGainNode.gain.setTargetAtTime(
        clampedVolume * 0.6,
        this.audioContext.currentTime,
        0.01
      ); // Smoother transition
    }

    // Store the volume setting for when unmuted
    localStorage.setItem("starWing_volume", clampedVolume.toString());
  }

  /**
   * Gets the current volume level from local storage.
   * @returns Volume level between 0 and 1
   */
  public getVolume(): number {
    // Get volume from localStorage or use default (0.25 = 25%)
    const storedVolume = localStorage.getItem("starWing_volume");
    return storedVolume ? parseFloat(storedVolume) : 0.25;
  }

  /**
   * Toggles audio mute state.
   * Updates local storage and applies the volume change.
   */
  public toggleMute(): void {
    this.isMuted = !this.isMuted;

    // When muted, set volume to 0, otherwise restore to saved volume
    const volume = this.isMuted ? 0 : this.getVolume() * 0.6;

    // Use setTargetAtTime for smoother transition
    this.mainGainNode.gain.setTargetAtTime(
      volume,
      this.audioContext.currentTime,
      0.01
    );

    // Store mute state in localStorage
    localStorage.setItem("starWing_muted", this.isMuted.toString());
  }

  /**
   * Schedules multiple beats ahead of time for smooth playback.
   * Implements a lookahead scheduler pattern for precise timing.
   * @private
   */
  private scheduleBeats(): void {
    // Schedule several beats ahead
    while (this.nextNoteTime < this.audioContext.currentTime + 0.2) {
      // Play bass
      if (this.bassPattern[this.currentBeat]) {
        this.playBass(this.nextNoteTime);
      }

      // Play arpeggio
      const arpeggioNote = this.arpeggioPattern[this.currentBeat];
      if (arpeggioNote >= 0) {
        this.playArpeggio(this.nextNoteTime, this.arpeggioNotes[arpeggioNote]);
      }

      // Advance to next beat
      const secondsPerBeat = 60.0 / this.tempo;
      this.nextNoteTime += secondsPerBeat / 4; // 16th notes for synth wave feel
      this.currentBeat = (this.currentBeat + 1) % this.arpeggioPattern.length;
    }

    // Schedule next batch of beats
    this.schedulerTimer = window.setTimeout(() => {
      if (this.isPlaying) {
        this.scheduleBeats();
      }
    }, 50); // Check more frequently
  }

  /**
   * Plays a bass note at the specified time.
   * @param time The audio context time to play the note
   * @private
   */
  private playBass(time: number): void {
    // Simplified bass - just use a sine wave at higher volume
    const bassOsc = this.audioContext.createOscillator();
    bassOsc.type = "sine";
    bassOsc.frequency.value = this.dFrequency;

    // Bass gain with lower volume
    const bassGain = this.audioContext.createGain();
    bassGain.gain.value = 0;

    // Connect through main gain node for volume control
    bassOsc.connect(bassGain);
    bassGain.connect(this.mainGainNode);

    // Start the oscillator
    bassOsc.start(time);

    // Simple envelope with reduced volume
    bassGain.gain.setValueAtTime(0, time);
    bassGain.gain.linearRampToValueAtTime(0.15, time + 0.01);
    bassGain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

    // Stop the oscillator
    bassOsc.stop(time + 0.6);
  }

  /**
   * Plays an arpeggio note at the specified time and frequency.
   * @param time The audio context time to play the note
   * @param frequency The frequency of the note to play
   * @private
   */
  private playArpeggio(time: number, frequency: number): void {
    // Simplified arpeggio - use square wave for more presence
    const arpeggioOsc = this.audioContext.createOscillator();
    arpeggioOsc.type = "square";
    arpeggioOsc.frequency.value = frequency;

    // Get cached filter or create a new one
    const filter = this.getOrCreateFilter("lowpass1000", "lowpass", 1000, 5);

    // Gain with lower volume
    const arpeggioGain = this.audioContext.createGain();
    arpeggioGain.gain.value = 0;

    // Connect through filter and main gain node
    arpeggioOsc.connect(arpeggioGain);
    arpeggioGain.connect(filter);
    filter.connect(this.mainGainNode);

    // Start oscillator
    arpeggioOsc.start(time);

    // Simple envelope with reduced volume
    arpeggioGain.gain.setValueAtTime(0, time);
    arpeggioGain.gain.linearRampToValueAtTime(0.1, time + 0.01);
    arpeggioGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

    // Stop oscillator
    arpeggioOsc.stop(time + 0.25);
  }

  /**
   * Gets a filter from cache or creates a new one if not found.
   * @param id Unique identifier for this filter
   * @param type The type of filter to create
   * @param frequency The filter cutoff frequency
   * @param Q The filter Q value (resonance)
   * @returns A BiquadFilterNode with the specified parameters
   * @private
   */
  private getOrCreateFilter(
    id: string,
    type: BiquadFilterType,
    frequency: number,
    Q: number
  ): BiquadFilterNode {
    if (!this.nodeCache.has(id)) {
      this.createFilterNode(id, type, frequency, Q);
    }
    return this.nodeCache.get(id) as BiquadFilterNode;
  }

  /**
   * Plays a synth chord at the specified time and frequency.
   * Creates a rich 80s-style synth sound with chorus effect.
   * @param time The audio context time to play the synth
   * @param frequency The base frequency for the synth
   * @private
   */
  private playSynth(time: number, frequency: number): void {
    // Classic 80s synth sound - PWM-like
    const synthOsc = this.audioContext.createOscillator();
    synthOsc.type = "square";
    synthOsc.frequency.value = frequency;

    // Create slight detune for thickness
    const detuneOsc = this.audioContext.createOscillator();
    detuneOsc.type = "square";
    detuneOsc.frequency.value = frequency * 1.003; // Slight detune

    // Create gain for envelope
    const synthGain = this.audioContext.createGain();
    synthGain.gain.value = 0;

    // Get cached filter
    const filter = this.getOrCreateFilter("lowpass2000", "lowpass", 2000, 3);

    // Create chorus effect with delay
    const delay = this.audioContext.createDelay();
    delay.delayTime.value = 0.03;
    const delayGain = this.audioContext.createGain();
    delayGain.gain.value = 0.2;

    // Connect everything
    synthOsc.connect(synthGain);
    detuneOsc.connect(synthGain);
    synthGain.connect(filter);
    filter.connect(this.mainGainNode);

    // Chorus effect connection
    filter.connect(delay);
    delay.connect(delayGain);
    delayGain.connect(this.mainGainNode);

    // Start oscillators
    synthOsc.start(time);
    detuneOsc.start(time);

    // Classic synth ADSR envelope (shortened for faster tempo)
    synthGain.gain.setValueAtTime(0, time);
    synthGain.gain.linearRampToValueAtTime(0.3, time + 0.05); // Attack
    synthGain.gain.linearRampToValueAtTime(0.2, time + 0.15); // Decay to sustain
    synthGain.gain.setValueAtTime(0.2, time + 0.2); // Sustain
    synthGain.gain.linearRampToValueAtTime(0, time + 0.4); // Release

    // Stop oscillators
    synthOsc.stop(time + 0.5);
    detuneOsc.stop(time + 0.5);
  }

  /**
   * Loads an audio sample from a URL and caches it for later use.
   * @param url The URL of the audio file to load
   * @param id A unique identifier to reference this sample later
   * @returns A promise that resolves when the sample is loaded
   */
  public async loadAudioSample(url: string, id: string): Promise<void> {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.audioBufferCache.set(id, audioBuffer);
    } catch (error) {
      this.logger.error(
        `AudioManager: Error loading audio sample ${id}:`,
        error
      );
    }
  }

  /**
   * Plays a previously loaded audio sample.
   * @param id The identifier of the sample to play
   * @param volume Volume level for playback (0.0 to 1.0)
   * @param loop Whether the sample should loop
   * @returns The AudioBufferSourceNode playing the sample, or null if the sample wasn't found
   */
  public playAudioSample(
    id: string,
    volume: number = 0.5,
    loop: boolean = false
  ): AudioBufferSourceNode | null {
    const buffer = this.audioBufferCache.get(id);
    if (!buffer) {
      this.logger.warn(`AudioManager: Audio sample ${id} not found in cache`);
      return null;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = loop;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = volume * (this.isMuted ? 0 : this.getVolume());

    source.connect(gainNode);
    gainNode.connect(this.mainGainNode);

    source.start();
    return source;
  }

  /**
   * Disposes of the audio manager, stopping all playback and releasing resources.
   */
  public dispose(): void {
    // Stop music if playing
    this.stopMusic();

    // Disconnect all nodes
    if (this.mainGainNode) {
      this.mainGainNode.disconnect();
    }

    // Close the audio context
    if (this.audioContext && this.audioContext.state !== "closed") {
      try {
        this.audioContext.close();
      } catch (error) {
        this.logger.warn("Error closing AudioContext:", error);
      }
    }

    // Clear caches
    this.audioBufferCache.clear();
    this.nodeCache.clear();
  }
}
