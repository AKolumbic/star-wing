/**
 * ToneProceduralGenerator - Generates procedural music using Tone.js
 * This is a direct replacement for the Web Audio API's ProceduralMusicGenerator
 */
import { Logger } from "../../utils/Logger";
import * as Tone from "tone";
import { ToneContextManager } from "./ToneContextManager";
import { AudioConfig } from "../config";

export class ToneProceduralGenerator {
  /** Context manager reference */
  private contextManager: ToneContextManager;

  /** Flag indicating if music is currently playing */
  private isPlaying: boolean = false;

  /** Active synths and sequences */
  private synths: {
    bass?: Tone.MembraneSynth;
    arpeggio?: Tone.PolySynth;
    hihat?: Tone.NoiseSynth;
    bassArpeggio?: Tone.MonoSynth;
  } = {};

  /** Active patterns/sequences */
  private sequences: {
    bass?: Tone.Sequence;
    arpeggio?: Tone.Sequence;
    hihat?: Tone.Sequence;
    bassArpeggio?: Tone.Sequence;
  } = {};

  /** D minor scale frequencies for procedural generation */
  // D minor scale frequencies
  private bFrequency: number = 123.47; // B2
  private dFrequency: number = 146.83; // D3
  private eFrequency: number = 164.81; // E3
  private cFrequency: number = 130.81; // C3
  private fFrequency: number = 174.61; // F3
  private gFrequency: number = 196.0; // G3
  private aFrequency: number = 220.0; // A3

  /** Bass pattern for 8-bit inspired drum beat */
  private bassPattern = [1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0];

  /** Arpeggio pattern (index to frequency) */
  private arpeggioPattern = [
    0, -1, 1, 2, 1, -1, 0, 3, 0, -1, 1, 2, 1, -1, 0, 3, 0, -1, 1, 2, 1, -1, 0,
    3, 0, -1, 1, 2, 1, -1, 0, 3,
  ];

  /** Hi-hat pattern */
  private hihatPattern = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1];

  /** Bass arpeggio pattern */
  private bassArpeggioPattern = [
    0, 1, 2, 3, 2, 1, 0, -1, 0, 1, 2, 3, 0, -1, 1, 0,
  ];

  /** Arpeggios lookup table */
  private arpeggioNotes: number[];

  /** Bass arpeggio lookup table */
  private bassArpeggioNotes: number[];

  /** Logger instance */
  private logger = Logger.getInstance();

  constructor(contextManager: ToneContextManager) {
    this.contextManager = contextManager;
    this.logger.info("ToneProceduralGenerator: Initialized");

    // Initialize frequency tables
    this.arpeggioNotes = [
      this.bFrequency,
      this.dFrequency,
      this.eFrequency,
      this.cFrequency,
    ];

    // Lower octave for bass
    this.bassArpeggioNotes = [
      this.dFrequency / 2,
      this.fFrequency / 2,
      this.aFrequency / 2,
      this.gFrequency / 2,
    ];

    // Set the tempo
    Tone.getTransport().bpm.value = AudioConfig.proceduralMusic.baseTempo;
  }

  /**
   * Starts procedural menu music
   */
  public startMenuMusic(): void {
    if (this.isPlaying) {
      this.logger.info("ToneProceduralGenerator: Music already playing");
      return;
    }

    this.logger.info("ToneProceduralGenerator: Starting procedural menu music");

    try {
      // Create synths
      this.createSynths();

      // Create sequences
      this.createSequences();

      // Start the transport
      Tone.getTransport().start();

      this.isPlaying = true;
    } catch (error) {
      this.logger.error("ToneProceduralGenerator: Error starting music", error);
    }
  }

  /**
   * Stops procedural music
   */
  public stopMusic(fadeOutTime: number = 1): void {
    if (!this.isPlaying) {
      return;
    }

    this.logger.info("ToneProceduralGenerator: Stopping procedural music");

    // Fade out each synth
    Object.values(this.synths).forEach((synth) => {
      if (synth && synth.volume) {
        synth.volume.rampTo(-60, fadeOutTime);
      }
    });

    // Schedule cleanup after fade
    Tone.getTransport().scheduleOnce(() => {
      // Dispose sequences
      Object.values(this.sequences).forEach((seq) => {
        if (seq) {
          seq.dispose();
        }
      });

      // Dispose synths
      Object.values(this.synths).forEach((synth) => {
        if (synth) {
          synth.dispose();
        }
      });

      // Clear refs
      this.sequences = {};
      this.synths = {};

      // Stop transport
      Tone.getTransport().stop();

      this.isPlaying = false;
      this.logger.info("ToneProceduralGenerator: Procedural music stopped");
    }, `+${fadeOutTime}`);
  }

  /**
   * Creates all synths needed for procedural music
   */
  private createSynths(): void {
    // Bass drum
    this.synths.bass = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 4,
      oscillator: { type: "square8" },
      envelope: {
        attack: 0.001,
        decay: 0.2,
        sustain: 0,
        release: 0.4,
      },
      volume: -12,
    }).toDestination();

    // Arpeggio synth (polyphonic)
    this.synths.arpeggio = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "square" },
      envelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.2,
        release: 0.3,
      },
      volume: -18,
    }).toDestination();

    // Hi-hat
    this.synths.hihat = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: {
        attack: 0.001,
        decay: 0.1,
        sustain: 0,
        release: 0.05,
      },
      volume: -25,
    }).toDestination();

    // Bass arpeggio
    this.synths.bassArpeggio = new Tone.MonoSynth({
      oscillator: { type: "square" },
      envelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.5,
        release: 0.5,
      },
      filterEnvelope: {
        attack: 0.05,
        decay: 0.1,
        sustain: 0.4,
        release: 0.2,
        baseFrequency: 200,
        octaves: 3,
      },
      volume: -18,
    }).toDestination();
  }

  /**
   * Creates sequences for all patterns
   */
  private createSequences(): void {
    // Bass drum sequence
    this.sequences.bass = new Tone.Sequence(
      (time, value) => {
        if (value === 1 && this.synths.bass) {
          this.synths.bass.triggerAttackRelease("C1", "8n", time);
        }
      },
      this.bassPattern,
      "8n"
    ).start(0);

    // Arpeggio sequence
    this.sequences.arpeggio = new Tone.Sequence(
      (time, index) => {
        if (index !== -1 && this.synths.arpeggio) {
          const freq = this.arpeggioNotes[index];
          this.synths.arpeggio.triggerAttackRelease(freq, "16n", time);
        }
      },
      this.arpeggioPattern,
      "16n"
    ).start(0);

    // Hi-hat sequence
    this.sequences.hihat = new Tone.Sequence(
      (time, value) => {
        if (value === 1 && this.synths.hihat) {
          this.synths.hihat.triggerAttackRelease("16n", time);
        }
      },
      this.hihatPattern,
      "8n"
    ).start(0);

    // Bass arpeggio sequence
    this.sequences.bassArpeggio = new Tone.Sequence(
      (time, index) => {
        if (index !== -1 && this.synths.bassArpeggio) {
          const freq = this.bassArpeggioNotes[index];
          this.synths.bassArpeggio.triggerAttackRelease(freq, "8n", time);
        }
      },
      this.bassArpeggioPattern,
      "8n"
    ).start(0);
  }

  /**
   * Change the tempo of the procedural music
   */
  public setTempo(bpm: number): void {
    this.logger.info(`ToneProceduralGenerator: Setting tempo to ${bpm} BPM`);
    Tone.getTransport().bpm.rampTo(bpm, 2);
  }

  /**
   * Changes the intensity of the procedural music
   * 0 = minimal, 1 = full intensity
   */
  public setIntensity(intensity: number): void {
    intensity = Math.max(0, Math.min(1, intensity));
    this.logger.info(
      `ToneProceduralGenerator: Setting intensity to ${intensity}`
    );

    // Adjust hi-hat volume based on intensity
    if (this.synths.hihat) {
      const hihatVolume = intensity > 0.7 ? -20 : intensity > 0.4 ? -25 : -35;
      this.synths.hihat.volume.rampTo(hihatVolume, 0.5);
    }

    // Adjust bass drum volume based on intensity
    if (this.synths.bass) {
      const bassVolume = intensity > 0.8 ? -8 : intensity > 0.5 ? -12 : -15;
      this.synths.bass.volume.rampTo(bassVolume, 0.5);
    }

    // Adjust arpeggio volume and pattern density
    if (this.synths.arpeggio) {
      const arpeggioVolume =
        intensity > 0.7 ? -15 : intensity > 0.4 ? -18 : -25;
      this.synths.arpeggio.volume.rampTo(arpeggioVolume, 0.5);
    }

    // Adjust bass arpeggio volume
    if (this.synths.bassArpeggio) {
      const bassArpVolume = intensity > 0.6 ? -15 : intensity > 0.3 ? -18 : -22;
      this.synths.bassArpeggio.volume.rampTo(bassArpVolume, 0.5);
    }

    // Adjust tempo based on intensity
    const baseTempo = AudioConfig.proceduralMusic.baseTempo;
    const newTempo = baseTempo + intensity * 20; // Add up to 20 BPM
    this.setTempo(newTempo);
  }

  /**
   * Gets the current playing state
   */
  public isActive(): boolean {
    return this.isPlaying;
  }

  /**
   * Disposes of all resources
   */
  public dispose(): void {
    this.logger.info("ToneProceduralGenerator: Disposing resources");
    this.stopMusic(0.1);
  }
}
