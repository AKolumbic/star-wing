/**
 * ToneProceduralGenerator - Generates procedural music using Tone.js
 * This is a direct replacement for the Web Audio API's ProceduralMusicGenerator
 * Enhanced with advanced Tone.js features in Phase 6
 */
import { Logger } from "../../utils/Logger";
import * as Tone from "tone";
import { ToneContextManager } from "./ToneContextManager";
import { AudioConfig } from "../config";

// Define musical scales for procedural generation
type ScaleType =
  | "minor"
  | "major"
  | "pentatonic"
  | "blues"
  | "chromatic"
  | "dorian"
  | "phrygian"
  | "lydian"
  | "mixolydian";

// Define possible chord types
type ChordType =
  | "major"
  | "minor"
  | "diminished"
  | "augmented"
  | "sus2"
  | "sus4"
  | "major7"
  | "minor7"
  | "dominant7";

// Game state influence parameters
interface GameState {
  intensity: number; // 0-1 range, affects tempo and instrument selection
  danger: number; // 0-1 range, affects harmony (more dissonance when higher)
  environment: string; // Affects scale and instrument selection
  success: number; // 0-1 range, affects mode (major vs minor)
}

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
    lead?: Tone.MonoSynth;
    pad?: Tone.PolySynth;
    pluck?: Tone.PluckSynth;
    ambient?: Tone.FMSynth;
  } = {};

  /** Active patterns/sequences */
  private sequences: {
    bass?: Tone.Sequence;
    arpeggio?: Tone.Sequence;
    hihat?: Tone.Sequence;
    bassArpeggio?: Tone.Sequence;
    lead?: Tone.Sequence;
    pad?: Tone.Pattern<number>;
    pluck?: Tone.Sequence;
    ambient?: Tone.Sequence;
  } = {};

  /** Scale frequencies */
  private scaleNotes: Record<string, number[]> = {};
  private currentScale: string = "minor";
  private currentRoot: string = "D";

  /** Base note frequencies for different scales */
  // D minor scale frequencies
  private bFrequency: number = 123.47; // B2
  private dFrequency: number = 146.83; // D3
  private eFrequency: number = 164.81; // E3
  private cFrequency: number = 130.81; // C3
  private fFrequency: number = 174.61; // F3
  private gFrequency: number = 196.0; // G3
  private aFrequency: number = 220.0; // A3

  /** Patterns for different instruments */
  private bassPattern = [1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0];
  private arpeggioPattern = [
    0, -1, 1, 2, 1, -1, 0, 3, 0, -1, 1, 2, 1, -1, 0, 3, 0, -1, 1, 2, 1, -1, 0,
    3, 0, -1, 1, 2, 1, -1, 0, 3,
  ];
  private hihatPattern = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1];
  private bassArpeggioPattern = [
    0, 1, 2, 3, 2, 1, 0, -1, 0, 1, 2, 3, 0, -1, 1, 0,
  ];
  private leadPattern: number[] = [];
  private pluckPattern: number[] = [];

  /** Chord progression */
  private chordProgression: number[] = [0, 5, 3, 4]; // i, VI, iv, V in minor
  private currentChordIndex: number = 0;
  private chordDuration: string = "2n";

  /** Current game state */
  private gameState: GameState = {
    intensity: 0.5,
    danger: 0.2,
    environment: "space",
    success: 0.5,
  };

  /** Effects */
  private effects: {
    reverb?: Tone.Reverb;
    delay?: Tone.FeedbackDelay;
    filter?: Tone.Filter;
  } = {};

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

    // Initialize musical scales
    this.initializeScales();

    // Generate patterns for lead and pluck
    this.generatePatterns();

    // Set the tempo
    Tone.getTransport().bpm.value = AudioConfig.proceduralMusic.baseTempo;

    // Create effects
    this.createEffects();
  }

  /**
   * Initialize all musical scales used in procedural generation
   */
  private initializeScales(): void {
    // Minor scale (natural minor / Aeolian)
    this.scaleNotes["Dminor"] = [
      this.dFrequency, // D
      this.eFrequency, // E
      this.fFrequency, // F
      this.gFrequency, // G
      this.aFrequency, // A
      this.bFrequency, // Bb (represented as B here)
      this.cFrequency, // C
    ];

    // D Major scale
    this.scaleNotes["Dmajor"] = [
      this.dFrequency, // D
      this.eFrequency, // E
      this.fFrequency * 1.0595, // F# (F * semitone ratio)
      this.gFrequency, // G
      this.aFrequency, // A
      this.bFrequency * 1.0595, // B (Bb * semitone ratio)
      this.cFrequency * 1.1225, // C# (C * two semitone ratios)
    ];

    // D Pentatonic Minor
    this.scaleNotes["Dpentatonic"] = [
      this.dFrequency, // D
      this.fFrequency, // F
      this.gFrequency, // G
      this.aFrequency, // A
      this.cFrequency, // C
    ];

    // D Dorian
    this.scaleNotes["Ddorian"] = [
      this.dFrequency, // D
      this.eFrequency, // E
      this.fFrequency, // F
      this.gFrequency, // G
      this.aFrequency, // A
      this.bFrequency * 1.0595, // B (Bb * semitone ratio)
      this.cFrequency, // C
    ];
  }

  /**
   * Generates random patterns for lead and pluck instruments
   */
  private generatePatterns(): void {
    // Generate a random lead melody pattern
    this.leadPattern = [];
    for (let i = 0; i < 16; i++) {
      if (Math.random() > 0.6) {
        this.leadPattern.push(Math.floor(Math.random() * 5));
      } else {
        this.leadPattern.push(-1); // Rest
      }
    }

    // Generate a random pluck pattern (more sparse)
    this.pluckPattern = [];
    for (let i = 0; i < 32; i++) {
      if (Math.random() > 0.75) {
        this.pluckPattern.push(Math.floor(Math.random() * 7));
      } else {
        this.pluckPattern.push(-1); // Rest
      }
    }
  }

  /**
   * Create audio effects used in the procedural generator
   */
  private createEffects(): void {
    // Create reverb
    this.effects.reverb = new Tone.Reverb({
      decay: 5,
      wet: 0.3,
    }).toDestination();

    // Create delay
    this.effects.delay = new Tone.FeedbackDelay({
      delayTime: "8n.",
      feedback: 0.2,
      wet: 0.2,
    }).toDestination();

    // Create filter
    this.effects.filter = new Tone.Filter({
      frequency: 800,
      type: "lowpass",
      Q: 1,
    }).toDestination();
  }

  /**
   * Starts procedural menu music
   */
  public async startMenuMusic(): Promise<void> {
    if (this.isPlaying) {
      this.logger.info("ToneProceduralGenerator: Music already playing");
      return;
    }

    this.logger.info("ToneProceduralGenerator: Starting procedural menu music");

    try {
      // Ensure context is ready
      if (Tone.context.state !== "running") {
        await Tone.context.resume();
        await Tone.start();
      }

      // Create synths
      this.createSynths();

      // Create sequences
      this.createSequences();

      // Start the transport
      Tone.Transport.start();

      this.isPlaying = true;
    } catch (error) {
      this.logger.error("ToneProceduralGenerator: Error starting music", error);
    }
  }

  /**
   * Starts gameplay procedural music with specific parameters
   */
  public startGameplayMusic(intensity: number = 0.5): void {
    if (this.isPlaying) {
      this.stopMusic(0.5);
      // Wait for cleanup
      setTimeout(() => {
        this.updateGameState({ intensity });
        this.startMenuMusic();
      }, 600);
    } else {
      this.updateGameState({ intensity });
      this.startMenuMusic();
    }
  }

  /**
   * Updates the game state to influence procedural generation
   */
  public updateGameState(state: Partial<GameState>): void {
    // Update state
    this.gameState = { ...this.gameState, ...state };

    // Apply changes if music is playing
    if (this.isPlaying) {
      // Update tempo based on intensity
      const newTempo =
        AudioConfig.proceduralMusic.baseTempo + this.gameState.intensity * 40;
      this.setTempo(newTempo);

      // Change scale based on success factor
      if (this.gameState.success > 0.7) {
        this.changeScale("major");
      } else if (this.gameState.success < 0.3) {
        this.changeScale("minor");
      } else {
        this.changeScale("dorian");
      }

      // Update effects based on environment and danger
      if (this.effects.reverb) {
        this.effects.reverb.wet.value = 0.2 + this.gameState.danger * 0.4;
      }

      if (this.effects.filter) {
        const cutoff = 600 + (1 - this.gameState.danger) * 4000;
        this.effects.filter.frequency.rampTo(cutoff, 2);
      }
    }
  }

  /**
   * Change the musical scale being used
   */
  public changeScale(scaleType: ScaleType, root: string = "D"): void {
    // Construct scale name
    const scaleName = `${root}${scaleType}`;

    // Check if we have this scale
    if (this.scaleNotes[scaleName]) {
      this.currentScale = scaleType;
      this.currentRoot = root;
      this.logger.info(
        `ToneProceduralGenerator: Changed scale to ${scaleName}`
      );

      // Update arpeggios and patterns if music is playing
      if (this.isPlaying) {
        // Schedule the scale change on a musically appropriate boundary
        Tone.getTransport().scheduleOnce(() => {
          // Update arpeggio and bass notes based on scale
          this.updateArpeggioNotes();
        }, "+1m");
      } else {
        this.updateArpeggioNotes();
      }
    } else {
      this.logger.warn(
        `ToneProceduralGenerator: Scale ${scaleName} not defined`
      );
    }
  }

  /**
   * Update arpeggio notes based on current scale and chord
   */
  private updateArpeggioNotes(): void {
    const fullScale =
      this.scaleNotes[`${this.currentRoot}${this.currentScale}`];
    if (!fullScale || fullScale.length === 0) {
      this.logger.error("ToneProceduralGenerator: Scale not found or empty");
      return;
    }

    // Get current chord (based on progression)
    const chordRoot = this.chordProgression[this.currentChordIndex];
    const scaleLength = fullScale.length;

    // Safely get a note from the scale using modulo to stay within bounds
    const safeGetNote = (index: number) => {
      // Ensure the index is within bounds
      const safeIndex = ((index % scaleLength) + scaleLength) % scaleLength;
      return fullScale[safeIndex] || fullScale[0]; // Fallback to first note if still undefined
    };

    // Create arpeggio notes based on triad chord (1-3-5-octave)
    this.arpeggioNotes = [
      safeGetNote(chordRoot),
      safeGetNote(chordRoot + 2),
      safeGetNote(chordRoot + 4),
      safeGetNote(chordRoot) * 2 || this.dFrequency * 2, // Octave with fallback
    ];

    // Create bass arpeggio notes
    this.bassArpeggioNotes = [
      safeGetNote(chordRoot) / 2 || this.dFrequency / 2,
      safeGetNote(chordRoot + 2) / 2 || this.eFrequency / 2,
      safeGetNote(chordRoot + 4) / 2 || this.gFrequency / 2,
      safeGetNote(chordRoot + 6) / 2 || this.aFrequency / 2,
    ];
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

    // Lead synth
    this.synths.lead = new Tone.MonoSynth({
      oscillator: { type: "sawtooth" },
      envelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.4,
        release: 1.2,
      },
      filterEnvelope: {
        attack: 0.01,
        decay: 0.5,
        sustain: 0.2,
        release: 2,
        baseFrequency: 300,
        octaves: 2,
      },
      volume: -20,
    });

    if (this.effects.delay && this.effects.reverb) {
      this.synths.lead.connect(this.effects.delay);
      this.effects.delay.connect(this.effects.reverb);
    } else {
      this.synths.lead.toDestination();
    }

    // Ambient pad
    this.synths.pad = new Tone.PolySynth(Tone.Synth).set({
      oscillator: { type: "sine" },
      envelope: {
        attack: 2,
        decay: 1,
        sustain: 0.8,
        release: 4,
      },
      volume: -25,
    });

    if (this.effects.reverb) {
      this.synths.pad.connect(this.effects.reverb);
    } else {
      this.synths.pad.toDestination();
    }

    // Pluck synth
    this.synths.pluck = new Tone.PluckSynth({
      attackNoise: 1,
      dampening: 4000,
      resonance: 0.98,
      volume: -20,
    });

    if (this.effects.delay) {
      this.synths.pluck.connect(this.effects.delay);
    } else {
      this.synths.pluck.toDestination();
    }

    // Ambient texture
    this.synths.ambient = new Tone.FMSynth({
      harmonicity: 2,
      modulationIndex: 3.5,
      oscillator: { type: "sine" },
      envelope: {
        attack: 0.1,
        decay: 0.5,
        sustain: 0.5,
        release: 2,
      },
      modulation: { type: "square" },
      modulationEnvelope: {
        attack: 1,
        decay: 0.5,
        sustain: 0.2,
        release: 2,
      },
      volume: -30,
    });

    if (this.effects.reverb) {
      this.synths.ambient.connect(this.effects.reverb);
    } else {
      this.synths.ambient.toDestination();
    }
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

    // Chord progression for pad
    this.sequences.pad = new Tone.Pattern(
      (time, chordIndex) => {
        if (this.synths.pad) {
          // Get current chord based on progression
          this.currentChordIndex = chordIndex;

          // Update arpeggio notes based on current chord
          this.updateArpeggioNotes();

          // Create chord based on scale positions (triad - root, 3rd, 5th)
          const scale =
            this.scaleNotes[`${this.currentRoot}${this.currentScale}`];
          if (scale && scale.length > 0) {
            const scaleLength = scale.length;

            // Safely get a note from the scale using modulo to stay within bounds
            const safeGetNote = (index: number) => {
              // Ensure the index is within bounds
              const safeIndex =
                ((index % scaleLength) + scaleLength) % scaleLength;
              return scale[safeIndex] || scale[0]; // Fallback to first note if still undefined
            };

            const root = chordIndex;
            const third = root + 2;
            const fifth = root + 4;

            // Play chord with safely retrieved notes
            const chord = [
              safeGetNote(root),
              safeGetNote(third),
              safeGetNote(fifth),
            ].filter(Boolean); // Remove any null/undefined values

            // Limit the number of simultaneous notes to prevent polyphony issues
            const maxSimultaneousNotes = 2; // Only play root and third, or root and fifth
            const limitedChord = chord.slice(0, maxSimultaneousNotes);

            // Only play if we have at least one valid note
            if (limitedChord.length > 0) {
              this.synths.pad.triggerAttackRelease(
                limitedChord,
                this.chordDuration,
                time
              );
            }
          }
        }
      },
      this.chordProgression,
      "up" // Using "up" pattern type (valid PatternName)
    ).start(0);

    // Lead melody sequence
    this.sequences.lead = new Tone.Sequence(
      (time, index) => {
        if (index !== -1 && this.synths.lead) {
          // Get notes from current scale
          const scale =
            this.scaleNotes[`${this.currentRoot}${this.currentScale}`];
          if (scale && scale.length > 0) {
            // Use higher octave for lead, safely get index
            const scaleLength = scale.length;
            // Ensure index is within bounds
            const safeIndex =
              ((index % scaleLength) + scaleLength) % scaleLength;
            const note = scale[safeIndex];

            if (note) {
              const freq = note * 2;
              this.synths.lead.triggerAttackRelease(freq, "8n", time);
            } else {
              // Fallback to default note if needed
              this.synths.lead.triggerAttackRelease(
                this.dFrequency * 2,
                "8n",
                time
              );
            }
          }
        }
      },
      this.leadPattern,
      "8n"
    ).start("2m"); // Start after intro

    // Pluck sequence
    this.sequences.pluck = new Tone.Sequence(
      (time, index) => {
        if (index !== -1 && this.synths.pluck) {
          // Get notes from current scale
          const scale =
            this.scaleNotes[`${this.currentRoot}${this.currentScale}`];
          if (scale && scale.length > 0) {
            const scaleLength = scale.length;
            // Ensure index is within bounds
            const safeIndex =
              ((index % scaleLength) + scaleLength) % scaleLength;
            const note = scale[safeIndex];

            if (note) {
              // Use higher octave for pluck
              const freq = note * 4; // Two octaves up
              this.synths.pluck.triggerAttackRelease(freq, "16n", time);
            } else {
              // Fallback to default note if needed
              this.synths.pluck.triggerAttackRelease(
                this.aFrequency * 4,
                "16n",
                time
              );
            }
          }
        }
      },
      this.pluckPattern,
      "16n"
    ).start("4m"); // Start after intro

    // Ambient sound sequence - occasional textural sounds
    this.sequences.ambient = new Tone.Sequence(
      (time) => {
        if (this.synths.ambient && Math.random() > 0.7) {
          const scale =
            this.scaleNotes[`${this.currentRoot}${this.currentScale}`];
          if (scale) {
            // Random note from scale, random octave
            const noteIndex = Math.floor(Math.random() * scale.length);
            const octaveShift = Math.random() > 0.5 ? 2 : 1;
            const freq = scale[noteIndex] * octaveShift;

            // Random duration
            const duration = Math.random() > 0.5 ? "2n" : "4n";

            this.synths.ambient.triggerAttackRelease(freq, duration, time);
          }
        }
      },
      [1], // Just a trigger
      "2m"
    ).start("2m");
  }

  /**
   * Sets the tempo of the procedural music
   */
  public setTempo(bpm: number): void {
    this.logger.info(`ToneProceduralGenerator: Setting tempo to ${bpm} BPM`);
    Tone.getTransport().bpm.rampTo(bpm, 2);
  }

  /**
   * Sets the intensity of the procedural music
   * Intensity affects tempo, filter cutoffs, and pattern complexity
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
   * Check if the generator is currently active
   */
  public isActive(): boolean {
    return this.isPlaying;
  }

  /**
   * Dispose all resources
   */
  public dispose(): void {
    this.logger.info("ToneProceduralGenerator: Disposing resources");
    this.stopMusic(0.1);
  }
}
