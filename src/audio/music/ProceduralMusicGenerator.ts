/**
 * Generates procedural music using Web Audio API
 */
import { Logger } from "../../utils/Logger";
import { AudioContextManager } from "../core/AudioContextManager";

export class ProceduralMusicGenerator {
  /** Context manager reference */
  private contextManager: AudioContextManager;

  /** Logger instance */
  private logger = Logger.getInstance();

  /** Time to schedule the next musical note */
  private nextNoteTime: number = 0;

  /** Reference to the audio scheduler setTimeout */
  private schedulerTimer: number | null = null;

  /** Current beat position in the pattern sequence */
  private currentBeat: number = 0;

  /** Music tempo in beats per minute */
  private tempo: number = 130; // Updated to 130 BPM

  /** Flag indicating if music is currently playing */
  private isPlaying: boolean = false;

  /** Base note frequencies for procedural music generation */
  // D minor scale frequencies
  private bFrequency: number = 123.47; // B2
  private dFrequency: number = 146.83; // D3
  private eFrequency: number = 164.81; // E3
  private cFrequency: number = 130.81; // C3

  /** Updated bass pattern for 8-bit inspired drum beat */
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
  private arpeggioNotes: number[];

  constructor(contextManager: AudioContextManager) {
    this.contextManager = contextManager;
    this.arpeggioNotes = [
      this.bFrequency, // B2
      this.dFrequency, // D3
      this.eFrequency, // E3
      this.cFrequency, // C3
    ];
    this.logger.info("ProceduralMusicGenerator: Initialized");
  }

  /**
   * Starts the procedural menu music
   */
  public startMenuMusic(): void {
    // Already playing, no need to start again
    if (this.isPlaying) {
      return;
    }

    // Try to resume audio context if needed
    this.contextManager.tryResume().catch((err) => {
      this.logger.error(
        "ProceduralMusicGenerator: Error resuming audio context:",
        err
      );
    });

    // Set up next note time
    this.nextNoteTime = this.contextManager.getCurrentTime();
    this.isPlaying = true;

    // Start procedural audio
    this.scheduleBeats();

    this.logger.info("ProceduralMusicGenerator: Started menu music");
  }

  /**
   * Stops the procedural music
   */
  public stop(): void {
    if (!this.isPlaying) {
      return;
    }

    this.isPlaying = false;

    // Clear the scheduler timer
    if (this.schedulerTimer) {
      window.clearTimeout(this.schedulerTimer);
      this.schedulerTimer = null;
    }

    this.logger.info("ProceduralMusicGenerator: Stopped music");
  }

  /**
   * Schedules beats for playback and recursively sets up the next scheduling cycle.
   * This creates a lookahead scheduler for accurate timing.
   */
  private scheduleBeats(): void {
    if (!this.isPlaying) {
      return;
    }

    // Looking ahead by 0.2 seconds to schedule notes
    while (this.nextNoteTime < this.contextManager.getCurrentTime() + 0.2) {
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
   * Plays the bass drum on the specified beat
   */
  private playBass(time: number): void {
    // Skip if muted
    if (this.contextManager.getMuteState()) {
      return;
    }

    // 8-bit inspired bass drum
    const bassOsc = this.contextManager.createOscillator();
    bassOsc.type = "triangle"; // More 8-bit sounding
    bassOsc.frequency.value = 60; // Lower for bass drum

    const bassGain = this.contextManager.createGainNode();
    bassGain.gain.value = 0;

    bassOsc.connect(bassGain);
    bassGain.connect(this.contextManager.getMainGainNode());

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
   */
  private playNoiseHihat(time: number, volume: number): void {
    // Skip if muted
    if (this.contextManager.getMuteState()) {
      return;
    }

    // Create buffer for noise
    const bufferSize = 2 * this.contextManager.getSampleRate();
    const noiseBuffer = this.contextManager
      .getContext()
      .createBuffer(1, bufferSize, this.contextManager.getSampleRate());
    const output = noiseBuffer.getChannelData(0);

    // Fill with noise
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    // Create noise source
    const noise = this.contextManager.getContext().createBufferSource();
    noise.buffer = noiseBuffer;

    // Create bandpass filter to shape noise into hi-hat
    const filter = this.contextManager.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 7000;
    filter.Q.value = 1;

    // Create gain node
    const gainNode = this.contextManager.createGainNode();
    gainNode.gain.value = 0;

    // Connect nodes
    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.contextManager.getMainGainNode());

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
   * Plays an arpeggio note on the specified beat
   */
  private playArpeggio(time: number, frequency: number): void {
    // Skip if muted
    if (this.contextManager.getMuteState()) {
      return;
    }

    // 8-bit style lead synth
    const arpeggioOsc = this.contextManager.createOscillator();
    arpeggioOsc.type = "square"; // Classic 8-bit sound
    arpeggioOsc.frequency.value = frequency;

    // Create a lowpass filter
    const filter = this.contextManager.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 2000;
    filter.Q.value = 2;

    // Gain with 8-bit appropriate volume
    const arpeggioGain = this.contextManager.createGainNode();
    arpeggioGain.gain.value = 0;

    // Connect through filter and main gain node
    arpeggioOsc.connect(arpeggioGain);
    arpeggioGain.connect(filter);
    filter.connect(this.contextManager.getMainGainNode());

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
   */
  private playBassArpeggio(time: number, frequency: number): void {
    // Skip if muted
    if (this.contextManager.getMuteState()) {
      return;
    }

    const bassOsc = this.contextManager.createOscillator();
    bassOsc.type = "triangle"; // Smoother bass sound
    bassOsc.frequency.value = frequency;

    // Create a lowpass filter for the bass
    const filter = this.contextManager.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 600;
    filter.Q.value = 1;

    const bassGain = this.contextManager.createGainNode();
    bassGain.gain.value = 0;

    // Connect
    bassOsc.connect(bassGain);
    bassGain.connect(filter);
    filter.connect(this.contextManager.getMainGainNode());

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
   * Disposes of the procedural music generator
   */
  public dispose(): void {
    this.stop();
    this.logger.info("ProceduralMusicGenerator: Disposed");
  }
}
