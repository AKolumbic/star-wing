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
  private bFrequency: number = 123.47; // B2
  private dFrequency: number = 146.83; // D3
  private eFrequency: number = 164.81; // E3
  private cFrequency: number = 130.81; // C3

  // Updated bass pattern for 8-bit inspired drum beat
  private bassPattern = [1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0];

  /**
   * Updated arpeggio pattern: B2, -, D3, E3, D3, -, B2, C3
   * Values correspond to indexes in arpeggioNotes array
   * -1 means no note played
   */
  private arpeggioPattern = [
    0, -1, 1, 2, 1, -1, 0, 3, 0, -1, 1, 2, 1, -1, 0, 3, 0, -1, 1, 2, 1, -1, 0,
    3, 0, -1, 1, 2, 1, -1, 0, 3,
  ];

  /** Frequency lookup for arpeggios */
  private arpeggioNotes = [
    this.bFrequency, // B2
    this.dFrequency, // D3
    this.eFrequency, // E3
    this.cFrequency, // C3
  ];

  /**
   * Pattern for synth chord arpeggiation
   * Each pair represents [D, A] note triggering
   */
  // private synthArpPattern = [
  //   [0, 0],
  //   [0, 0],
  //   [1, 0],
  //   [0, 0],
  //   [0, 1],
  //   [0, 0],
  //   [0, 0],
  //   [0, 0],
  //   [0, 0],
  //   [0, 0],
  //   [1, 0],
  //   [0, 0],
  //   [0, 1],
  //   [0, 0],
  //   [0, 0],
  //   [1, 1],
  // ]; // [D, A] notes

  /** Current beat position in the pattern sequence */
  private currentBeat: number = 0;
  /** Music tempo in beats per minute */
  private tempo: number = 130; // Updated to 130 BPM

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
   * @param useProceduralAudio Force using procedural audio instead of MP3 (for devMode)
   */
  public playMenuThump(useProceduralAudio: boolean = false): void {
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

      // If useProceduralAudio is true, always use procedural audio
      if (useProceduralAudio) {
        this.logger.info("AudioManager: Using procedural audio (devMode)");

        // Set up next note time
        this.nextNoteTime = this.audioContext.currentTime;

        // Log the mute state for debugging
        this.logger.info(
          `AudioManager: Mute state is ${this.isMuted ? "muted" : "unmuted"}`
        );

        // Start procedural audio
        this.scheduleBeats();

        return;
      }

      // Path to the MP3 file
      const menuMusicFile = "/assets/audio/star-wing_menu-loop.mp3";
      const menuMusicId = "menuMusic";

      // Check if the audio is already loaded
      if (!this.audioBufferCache.has(menuMusicId)) {
        this.logger.info(
          `AudioManager: Loading menu music from ${menuMusicFile}`
        );
        // Load and then play the audio
        this.loadAudioSample(menuMusicFile, menuMusicId, true)
          .then(() => {
            this.logger.info("AudioManager: Menu music loaded successfully");
            // Play the music in a loop with reduced volume (15%)
            this.playAudioSample(menuMusicId, 0.15, true);
          })
          .catch((err) => {
            this.logger.error("AudioManager: Failed to load menu music:", err);
            // Fall back to procedural music if loading fails
            this.nextNoteTime = this.audioContext.currentTime;
            this.scheduleBeats();
          });
      } else {
        // Audio already loaded, just play it
        this.logger.info("AudioManager: Playing cached menu music");
        this.playAudioSample(menuMusicId, 0.15, true);
      }
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

    // Stop the scheduler if it's running
    if (this.schedulerTimer !== null) {
      window.clearTimeout(this.schedulerTimer);
      this.schedulerTimer = null;
    }

    // Stop any playing audio sources
    // This will disconnect and stop all playing sources
    // We're creating a new audio context when needed, so this is a clean approach
    if (this.audioContext) {
      this.audioContext.suspend().catch((err) => {
        this.logger.error("AudioManager: Error suspending audio context:", err);
      });
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
    const volume = this.isMuted ? 0 : this.getVolume();

    // Set gain on main gain node with smooth transition
    this.mainGainNode.gain.setTargetAtTime(
      volume,
      this.audioContext.currentTime,
      0.01
    );

    // Store mute state in localStorage
    localStorage.setItem("starWing_muted", this.isMuted.toString());

    // If we're now unmuted and music should be playing, restart it
    if (!this.isMuted && this.isPlaying) {
      // Check if we have the menu music loaded
      if (this.audioBufferCache.has("menuMusic")) {
        // If music was playing and we unmuted, make sure it's playing again
        this.playAudioSample("menuMusic", 0.15, true);
      } else {
        // Fallback to procedural music
        this.nextNoteTime = this.audioContext.currentTime;
        this.scheduleBeats();
      }
    }

    this.logger.info(
      `AudioManager: Audio ${this.isMuted ? "muted" : "unmuted"}`
    );
  }

  /**
   * Schedules beats for playback and recursively sets up the next scheduling cycle.
   * This creates a lookahead scheduler for accurate timing.
   * @private
   */
  private scheduleBeats(): void {
    // Ensure mainGainNode reflects mute state
    if (this.isMuted && this.mainGainNode.gain.value > 0) {
      this.mainGainNode.gain.value = 0;
      this.logger.info("AudioManager: Setting gain to 0 due to mute state");
    } else if (!this.isMuted && this.mainGainNode.gain.value === 0) {
      // If not muted but gain is 0, restore it
      const volume = this.getVolume();
      this.mainGainNode.gain.value = volume;
      this.logger.info(`AudioManager: Restoring gain to ${volume} as unmuted`);
    }

    // Looking ahead by 0.2 seconds to schedule notes
    while (this.nextNoteTime < this.audioContext.currentTime + 0.2) {
      const currentBeat = this.currentBeat;

      // Bass pattern - 8-bit style drum
      if (this.bassPattern[currentBeat % 16] === 1) {
        this.playBass(this.nextNoteTime);
      }

      // Arpeggio pattern - 8-bit melody notes
      const arpeggioIndex =
        this.arpeggioPattern[currentBeat % this.arpeggioPattern.length];
      if (arpeggioIndex !== -1) {
        this.playArpeggio(this.nextNoteTime, this.arpeggioNotes[arpeggioIndex]);
      }

      // Increment beat counter
      this.currentBeat = (this.currentBeat + 1) % 32;

      // Calculate time for next beat - 16th notes for more precise timing
      const secondsPerBeat = 60.0 / this.tempo;
      this.nextNoteTime += secondsPerBeat / 4; // 16th notes for 8-bit feel
    }

    // Reset scheduler timer if music is playing
    if (this.isPlaying) {
      this.schedulerTimer = window.setTimeout(() => {
        this.scheduleBeats();
      }, 50); // 50ms scheduler interval for smoother timing
    }
  }

  /**
   * Plays the bass drum on the specified beat.
   * @param time The audio context time to play the note
   * @private
   */
  private playBass(time: number): void {
    if (this.bassPattern[this.currentBeat % 16] === 0) return;

    // 8-bit inspired bass drum
    const bassOsc = this.audioContext.createOscillator();
    bassOsc.type = "triangle"; // More 8-bit sounding
    bassOsc.frequency.value = 60; // Lower for bass drum

    const bassGain = this.audioContext.createGain();
    bassGain.gain.value = 0;

    bassOsc.connect(bassGain);
    bassGain.connect(this.mainGainNode);

    // Start oscillator
    bassOsc.start(time);

    // 8-bit style quick decay
    bassGain.gain.setValueAtTime(0, time);
    bassGain.gain.linearRampToValueAtTime(0.3, time + 0.01); // Faster attack
    bassGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1); // Faster decay

    // Short duration for punchy 8-bit feel
    bassOsc.stop(time + 0.2);

    // Add a noise burst for more 8-bit drum character
    if (this.currentBeat % 4 === 0) {
      this.playNoiseHihat(time, 0.1); // Hi-hat on main beats
    }
  }

  /**
   * Plays a noise-based hi-hat sound for 8-bit style drums
   * @param time The audio context time to play the sound
   * @param volume Volume level for the hi-hat
   */
  private playNoiseHihat(time: number, volume: number): void {
    // Create buffer for noise
    const bufferSize = 2 * this.audioContext.sampleRate;
    const noiseBuffer = this.audioContext.createBuffer(
      1,
      bufferSize,
      this.audioContext.sampleRate
    );
    const output = noiseBuffer.getChannelData(0);

    // Fill with noise
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    // Create noise source
    const noise = this.audioContext.createBufferSource();
    noise.buffer = noiseBuffer;

    // Create bandpass filter to shape noise into hi-hat
    const filter = this.audioContext.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 7000;
    filter.Q.value = 1;

    // Create gain node
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = 0;

    // Connect nodes
    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.mainGainNode);

    // Start noise
    noise.start(time);

    // Very short envelope for hi-hat
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(volume, time + 0.002);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

    // Stop after short duration
    noise.stop(time + 0.05);
  }

  /**
   * Plays an arpeggio note on the specified beat.
   * @param time The audio context time to play the note
   * @param frequency The frequency of the note to play
   * @private
   */
  private playArpeggio(time: number, frequency: number): void {
    // 8-bit style lead synth
    const arpeggioOsc = this.audioContext.createOscillator();
    arpeggioOsc.type = "square"; // Classic 8-bit sound
    arpeggioOsc.frequency.value = frequency;

    // Get cached filter or create a new one
    const filter = this.getOrCreateFilter("lowpass2000", "lowpass", 2000, 2);

    // Gain with 8-bit appropriate volume
    const arpeggioGain = this.audioContext.createGain();
    arpeggioGain.gain.value = 0;

    // Connect through filter and main gain node
    arpeggioOsc.connect(arpeggioGain);
    arpeggioGain.connect(filter);
    filter.connect(this.mainGainNode);

    // Start oscillator
    arpeggioOsc.start(time);

    // 8-bit style envelope - sharper attack and decay
    arpeggioGain.gain.setValueAtTime(0, time);
    arpeggioGain.gain.linearRampToValueAtTime(0.12, time + 0.005); // Quick attack
    arpeggioGain.gain.exponentialRampToValueAtTime(0.05, time + 0.2); // Sustain a bit longer

    // Stop oscillator
    arpeggioOsc.stop(time + 0.25);

    // Add a bass track (one octave lower) for dual-track feel
    if (this.currentBeat % 2 === 0) {
      this.playBassArpeggio(time, frequency / 2);
    }
  }

  /**
   * Plays a bass arpeggio note for the dual-track feel
   * @param time The audio context time to play the note
   * @param frequency The frequency of the note (lower octave)
   */
  private playBassArpeggio(time: number, frequency: number): void {
    const bassOsc = this.audioContext.createOscillator();
    bassOsc.type = "triangle"; // Smoother bass sound
    bassOsc.frequency.value = frequency;

    // Use a different filter for the bass
    const filter = this.getOrCreateFilter("lowpass600", "lowpass", 600, 1);

    const bassGain = this.audioContext.createGain();
    bassGain.gain.value = 0;

    // Connect
    bassOsc.connect(bassGain);
    bassGain.connect(filter);
    filter.connect(this.mainGainNode);

    // Start
    bassOsc.start(time);

    // Slower attack and longer sustain for bass
    bassGain.gain.setValueAtTime(0, time);
    bassGain.gain.linearRampToValueAtTime(0.1, time + 0.01);
    bassGain.gain.exponentialRampToValueAtTime(0.05, time + 0.3);

    // Stop
    bassOsc.stop(time + 0.4);
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
   * Loads an audio sample from the specified URL and caches it for future use.
   * @param url The URL of the audio file to load
   * @param id The identifier to use for caching
   * @param optimizeForLooping Whether to optimize the buffer for seamless looping
   * @returns A promise that resolves when the sample is loaded
   */
  public async loadAudioSample(
    url: string,
    id: string,
    optimizeForLooping: boolean = false
  ): Promise<void> {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      let audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      // If this is meant to be looped, optimize the buffer
      if (optimizeForLooping && id === "menuMusic") {
        this.logger.info(`AudioManager: Optimizing buffer for looping: ${id}`);
        // Store the original buffer for reference
        this.audioBufferCache.set(`${id}_original`, audioBuffer);

        // For now, we'll keep using the original buffer
        // If looping issues persist, we can implement more advanced optimizations
      }

      this.audioBufferCache.set(id, audioBuffer);
      this.logger.info(`AudioManager: Successfully loaded audio sample: ${id}`);
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

    // For looped music, add loop points for smoother looping
    if (loop && id === "menuMusic") {
      // Set loop points for cleaner looping if needed
      // Precise loop points depend on the specific audio file
      const loopStartPosition = 0; // Start from beginning
      // Loop a tiny bit before the end to avoid the hiccup
      const loopEndPosition = buffer.duration - 0.05;

      // Set loop points if supported by the browser
      if (source.loopStart !== undefined && source.loopEnd !== undefined) {
        source.loopStart = loopStartPosition;
        source.loopEnd = loopEndPosition;
        this.logger.info(
          `AudioManager: Set custom loop points for ${id}: ${loopStartPosition} to ${loopEndPosition}`
        );
      }
    }

    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = volume * (this.isMuted ? 0 : this.getVolume());

    source.connect(gainNode);
    gainNode.connect(this.mainGainNode);

    source.start();
    return source;
  }

  /**
   * Creates a seamless playback experience for looped audio.
   * @param buffer The audio buffer to analyze
   * @private
   * @unused Currently not used but kept for future implementation
   */
  private optimizeBufferForLooping(buffer: AudioBuffer): AudioBuffer {
    // Sample rate and length info
    const sampleRate = buffer.sampleRate;
    const channels = buffer.numberOfChannels;

    // Find zero crossings near the end for cleaner loop points
    const findOptimalLoopPoint = (channelData: Float32Array): number => {
      // Look at last 0.1 seconds of audio
      const loopPointArea = Math.floor(sampleRate * 0.1);
      const startIndex = channelData.length - loopPointArea;

      let bestIndex = 0;
      let minimumValue = 1.0;

      // Find zero crossing point
      for (let i = startIndex; i < channelData.length - 1; i++) {
        const currentValue = Math.abs(channelData[i]);

        // Detect a zero crossing
        if (
          (currentValue < minimumValue &&
            channelData[i] > 0 &&
            channelData[i + 1] < 0) ||
          (channelData[i] < 0 && channelData[i + 1] > 0)
        ) {
          minimumValue = currentValue;
          bestIndex = i;
        }
      }

      return bestIndex > 0 ? bestIndex : channelData.length - 1;
    };

    // Get the loop point from the first channel
    const channelData = buffer.getChannelData(0);
    const loopPoint = findOptimalLoopPoint(channelData);

    // Create a new buffer trimmed to the loop point
    const newBuffer = this.audioContext.createBuffer(
      channels,
      loopPoint,
      sampleRate
    );

    // Copy the data with a short crossfade at the loop point
    for (let c = 0; c < channels; c++) {
      const newChannelData = newBuffer.getChannelData(c);
      const originalData = buffer.getChannelData(c);

      // Copy main content
      for (let i = 0; i < loopPoint; i++) {
        newChannelData[i] = originalData[i];
      }
    }

    return newBuffer;
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

  /**
   * Returns whether audio is currently playing.
   * @returns True if audio is playing
   */
  public isAudioPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Plays a laser firing sound effect
   * @param weaponCategory Type of weapon being fired (affects sound characteristics)
   */
  public playLaserSound(weaponCategory: string = "energy"): void {
    if (!this.isInitialized) {
      this.initialize();
    }

    // Resume audio context if suspended
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume().catch((err) => {
        this.logger.error("AudioManager: Error resuming AudioContext:", err);
      });
    }

    if (this.isMuted) {
      return;
    }

    try {
      // Create master gain node
      const masterGain = this.audioContext.createGain();
      masterGain.connect(this.mainGainNode);
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
      const osc = this.audioContext.createOscillator();
      osc.type = oscillatorType;
      osc.frequency.value = baseFrequency;

      // Create a filter for the laser sound
      const filter = this.audioContext.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = baseFrequency;
      filter.Q.value = 5;

      // Create gain node for envelope
      const gainNode = this.audioContext.createGain();

      // Connect nodes
      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(masterGain);

      // Create second oscillator for harmonic
      const osc2 = this.audioContext.createOscillator();
      osc2.type = "sine";
      osc2.frequency.value = baseFrequency * 1.5;

      const gainNode2 = this.audioContext.createGain();
      osc2.connect(gainNode2);
      gainNode2.connect(masterGain);
      gainNode2.gain.value = 0.1;

      // Schedule sound
      const now = this.audioContext.currentTime;

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
    } catch (error) {
      this.logger.error("AudioManager: Error playing laser sound:", error);
    }
  }

  /**
   * Plays an asteroid collision sound effect
   * @param intensity Intensity of the collision (affects sound characteristics)
   */
  public playAsteroidCollisionSound(intensity: string = "medium"): void {
    if (!this.isInitialized) {
      this.initialize();
    }

    // Resume audio context if suspended
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume().catch((err) => {
        this.logger.error("AudioManager: Error resuming AudioContext:", err);
      });
    }

    if (this.isMuted) {
      return;
    }

    try {
      // Create master gain node
      const masterGain = this.audioContext.createGain();
      masterGain.connect(this.mainGainNode);
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

      const now = this.audioContext.currentTime;

      // Create noise for the impact sound
      const bufferSize = this.audioContext.sampleRate * duration;
      const noiseBuffer = this.audioContext.createBuffer(
        1,
        bufferSize,
        this.audioContext.sampleRate
      );

      // Fill buffer with noise
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      // Create noise source
      const noise = this.audioContext.createBufferSource();
      noise.buffer = noiseBuffer;

      // Create filters to shape the noise into an impact sound
      const lowpass = this.audioContext.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.value = 400;
      lowpass.Q.value = 1;

      const highpass = this.audioContext.createBiquadFilter();
      highpass.type = "highpass";
      highpass.frequency.value = 100;
      highpass.Q.value = 1;

      // Create gain node for envelope
      const noiseGainNode = this.audioContext.createGain();

      // Connect nodes
      noise.connect(lowpass);
      lowpass.connect(highpass);
      highpass.connect(noiseGainNode);
      noiseGainNode.connect(masterGain);

      // Start noise
      noise.start(now);

      // Envelope for impact sound - quick attack, longer decay
      noiseGainNode.gain.setValueAtTime(0, now);
      noiseGainNode.gain.linearRampToValueAtTime(noiseGain, now + 0.01);
      noiseGainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

      // Add a low frequency oscillator for the "thud" component
      const thud = this.audioContext.createOscillator();
      thud.type = "sine";
      thud.frequency.value = 80;

      const thudGain = this.audioContext.createGain();
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

      this.logger.debug("AudioManager: Playing asteroid collision sound");
    } catch (error) {
      this.logger.error("AudioManager: Error playing collision sound:", error);
    }
  }

  /**
   * Creates a buffer of noise for use in sound effects.
   * @returns AudioBuffer containing noise
   * @unused Currently not used but kept for future implementation
   */
  private createNoiseBuffer(): AudioBuffer {
    const bufferSize = this.audioContext.sampleRate * 2; // 2 seconds of noise
    const buffer = this.audioContext.createBuffer(
      1,
      bufferSize,
      this.audioContext.sampleRate
    );
    const data = buffer.getChannelData(0);

    // Fill with random values for noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    return buffer;
  }
}
