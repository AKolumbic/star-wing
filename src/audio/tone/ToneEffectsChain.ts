/**
 * ToneEffectsChain - Manages advanced audio effects processing using Tone.js
 * This provides dynamic audio effects routing that wasn't possible with the Web Audio API
 */
import { Logger } from "../../utils/Logger";
import * as Tone from "tone";

// Define the different effect types we support
export type EffectType =
  | "reverb"
  | "delay"
  | "distortion"
  | "chorus"
  | "phaser"
  | "tremolo"
  | "vibrato"
  | "filter"
  | "eq3"
  | "compressor"
  | "limiter"
  | "pitchShift";

// Parameters for each effect type
export interface EffectParams {
  // Common parameters
  wet?: number;
  bypass?: boolean;

  // Reverb specific
  decay?: number;
  preDelay?: number;

  // Delay specific
  delayTime?: number;
  feedback?: number;

  // Distortion specific
  distortion?: number;
  oversample?: "none" | "2x" | "4x";

  // Modulation effects
  frequency?: number;
  depth?: number;
  spread?: number;

  // Filter specific
  filterType?: BiquadFilterType;
  filterFrequency?: number;
  Q?: number;
  gain?: number;

  // EQ3 specific
  low?: number;
  mid?: number;
  high?: number;
  lowFrequency?: number;
  highFrequency?: number;

  // Compressor specific
  threshold?: number;
  ratio?: number;
  attack?: number;
  release?: number;
  knee?: number;

  // PitchShift specific
  pitch?: number;
  windowSize?: number;
}

// Preset configuration
export interface EffectPreset {
  name: string;
  description: string;
  effects: {
    type: EffectType;
    params: EffectParams;
  }[];
}

export class ToneEffectsChain {
  /** Collection of active effects */
  private effects: Map<string, Tone.ToneAudioNode> = new Map();

  /** Input and output nodes */
  private inputNode: Tone.Gain;
  private outputNode: Tone.Gain;

  /** Current chain configuration */
  private activeEffects: string[] = [];

  /** Logger instance */
  private logger = Logger.getInstance();

  /**
   * Creates a new effects chain
   */
  constructor() {
    this.logger.info("ToneEffectsChain: Creating new effects chain");

    // Create the input and output nodes
    this.inputNode = new Tone.Gain();
    this.outputNode = new Tone.Gain();

    // Default connection (dry signal)
    this.inputNode.connect(this.outputNode);
  }

  /**
   * Adds an effect to the chain
   */
  public addEffect(
    id: string,
    type: EffectType,
    params: EffectParams = {}
  ): void {
    this.logger.info(`ToneEffectsChain: Adding ${type} effect with ID ${id}`);

    // Check if the effect already exists
    if (this.effects.has(id)) {
      this.logger.warn(
        `ToneEffectsChain: Effect ${id} already exists, replacing it`
      );
      this.removeEffect(id);
    }

    // Create the effect
    const effect = this.createEffect(type, params);
    if (!effect) {
      this.logger.error(
        `ToneEffectsChain: Failed to create effect of type ${type}`
      );
      return;
    }

    // Store the effect
    this.effects.set(id, effect);
    this.activeEffects.push(id);

    // Rebuild the chain
    this.rebuildChain();
  }

  /**
   * Removes an effect from the chain
   */
  public removeEffect(id: string): void {
    this.logger.info(`ToneEffectsChain: Removing effect ${id}`);

    // Check if the effect exists
    if (!this.effects.has(id)) {
      this.logger.warn(`ToneEffectsChain: Effect ${id} does not exist`);
      return;
    }

    // Get the effect
    const effect = this.effects.get(id);

    // Dispose of the effect
    if (effect) {
      effect.dispose();
    }

    // Remove from the collections
    this.effects.delete(id);
    this.activeEffects = this.activeEffects.filter(
      (effectId) => effectId !== id
    );

    // Rebuild the chain
    this.rebuildChain();
  }

  /**
   * Updates the parameters of an effect
   */
  public updateEffect(id: string, params: EffectParams): void {
    this.logger.info(`ToneEffectsChain: Updating effect ${id}`);

    // Check if the effect exists
    if (!this.effects.has(id)) {
      this.logger.warn(`ToneEffectsChain: Effect ${id} does not exist`);
      return;
    }

    // Get the effect
    const effect = this.effects.get(id);
    if (!effect) return;

    // Update the parameters
    this.applyEffectParams(effect, params);
  }

  /**
   * Gets the input node for connecting inputs
   */
  public getInputNode(): Tone.Gain {
    return this.inputNode;
  }

  /**
   * Gets the output node for connecting to destinations
   */
  public getOutputNode(): Tone.Gain {
    return this.outputNode;
  }

  /**
   * Connects a source to the effects chain
   */
  public connectSource(source: Tone.ToneAudioNode): void {
    source.connect(this.inputNode);
  }

  /**
   * Connects the effects chain to a destination
   */
  public connectToDestination(): void {
    this.outputNode.toDestination();
  }

  /**
   * Applies a preset to the chain
   */
  public applyPreset(preset: EffectPreset): void {
    this.logger.info(`ToneEffectsChain: Applying preset ${preset.name}`);

    // Clear existing effects
    this.clearEffects();

    // Add each effect from the preset
    preset.effects.forEach((effect, index) => {
      const id = `${preset.name}_${effect.type}_${index}`;
      this.addEffect(id, effect.type, effect.params);
    });
  }

  /**
   * Clears all effects from the chain
   */
  public clearEffects(): void {
    this.logger.info("ToneEffectsChain: Clearing all effects");

    // Dispose and clear all effects
    this.effects.forEach((effect) => {
      effect.dispose();
    });

    this.effects.clear();
    this.activeEffects = [];

    // Rebuild the chain (direct connection)
    this.rebuildChain();
  }

  /**
   * Creates an audio effect of the specified type
   */
  private createEffect(
    type: EffectType,
    params: EffectParams
  ): Tone.ToneAudioNode | null {
    let effect: Tone.ToneAudioNode | null = null;

    // Create the effect based on type
    try {
      switch (type) {
        case "reverb":
          effect = new Tone.Reverb({
            decay: params.decay ?? 1.5,
            preDelay: params.preDelay ?? 0.01,
            wet: params.wet ?? 0.5,
          });
          break;

        case "delay":
          effect = new Tone.FeedbackDelay({
            delayTime: params.delayTime ?? 0.25,
            feedback: params.feedback ?? 0.5,
            wet: params.wet ?? 0.5,
          });
          break;

        case "distortion":
          effect = new Tone.Distortion({
            distortion: params.distortion ?? 0.4,
            oversample: params.oversample ?? "4x",
            wet: params.wet ?? 0.5,
          });
          break;

        case "chorus":
          effect = new Tone.Chorus({
            frequency: params.frequency ?? 1.5,
            delayTime: params.delayTime ?? 3.5,
            depth: params.depth ?? 0.7,
            spread: params.spread ?? 180,
            wet: params.wet ?? 0.5,
          });
          (effect as Tone.Chorus).start();
          break;

        case "phaser":
          effect = new Tone.Phaser({
            frequency: params.frequency ?? 0.5,
            octaves: 3,
            baseFrequency: 1000,
            wet: params.wet ?? 0.5,
          });
          break;

        case "tremolo":
          effect = new Tone.Tremolo({
            frequency: params.frequency ?? 10,
            depth: params.depth ?? 0.5,
            spread: params.spread ?? 180,
            wet: params.wet ?? 0.5,
          });
          (effect as Tone.Tremolo).start();
          break;

        case "vibrato":
          effect = new Tone.Vibrato({
            frequency: params.frequency ?? 5,
            depth: params.depth ?? 0.1,
            wet: params.wet ?? 0.5,
          });
          break;

        case "filter":
          // Fix for Filter options
          effect = new Tone.Filter({
            type: params.filterType ?? "lowpass",
            frequency: params.filterFrequency ?? 1000,
            Q: params.Q ?? 1,
            gain: params.gain ?? 0,
          });

          // Set wet parameter separately
          if (params.wet !== undefined) {
            // In Filter, we can't set wet directly, so we're ignoring it
            this.logger.warn(
              "ToneEffectsChain: Filter doesn't support wet parameter"
            );
          }
          break;

        case "eq3":
          effect = new Tone.EQ3({
            low: params.low ?? 0,
            mid: params.mid ?? 0,
            high: params.high ?? 0,
            lowFrequency: params.lowFrequency ?? 400,
            highFrequency: params.highFrequency ?? 2500,
          });
          break;

        case "compressor":
          effect = new Tone.Compressor({
            threshold: params.threshold ?? -24,
            ratio: params.ratio ?? 4,
            attack: params.attack ?? 0.05,
            release: params.release ?? 0.1,
            knee: params.knee ?? 5,
          });
          break;

        case "limiter":
          effect = new Tone.Limiter({
            threshold: params.threshold ?? -6,
          });
          break;

        case "pitchShift":
          effect = new Tone.PitchShift({
            pitch: params.pitch ?? 0,
            windowSize: params.windowSize ?? 0.1,
            wet: params.wet ?? 1,
          });
          break;

        default:
          this.logger.error(`ToneEffectsChain: Unknown effect type ${type}`);
          return null;
      }

      // Set bypass if specified
      if (params.bypass) {
        if ("wet" in effect) {
          (effect as any).wet.value = 0;
        }
      }

      return effect;
    } catch (error) {
      this.logger.error(
        `ToneEffectsChain: Error creating effect of type ${type}`,
        error
      );
      return null;
    }
  }

  /**
   * Apply parameters to an effect
   */
  private applyEffectParams(
    effect: Tone.ToneAudioNode,
    params: EffectParams
  ): void {
    // Apply common parameters
    if (params.wet !== undefined && "wet" in effect) {
      (effect as any).wet.value = params.wet;
    }

    // Apply effect-specific parameters
    try {
      Object.entries(params).forEach(([key, value]) => {
        if (key !== "wet" && key !== "bypass") {
          // Handle special cases for renamed parameters
          if (key === "filterType" && "type" in effect) {
            (effect as any).type = value;
          } else if (key === "filterFrequency" && "frequency" in effect) {
            // For parameters that are AudioParams, use .value
            (effect as any).frequency.value = value;
          } else if (key in effect) {
            // For direct properties
            if (
              key === "frequency" &&
              typeof (effect as any).frequency !== "number"
            ) {
              // For parameters that are AudioParams, use .value
              (effect as any).frequency.value = value;
            } else {
              (effect as any)[key] = value;
            }
          }
        }
      });
    } catch (error) {
      this.logger.error(
        "ToneEffectsChain: Error applying effect parameters",
        error
      );
    }
  }

  /**
   * Rebuilds the effects chain
   */
  private rebuildChain(): void {
    this.logger.info("ToneEffectsChain: Rebuilding effects chain");

    // Disconnect all nodes
    this.inputNode.disconnect();
    this.effects.forEach((effect) => {
      effect.disconnect();
    });

    // If no effects, connect input directly to output
    if (this.activeEffects.length === 0) {
      this.inputNode.connect(this.outputNode);
      return;
    }

    // Build the chain
    let previousNode: Tone.ToneAudioNode = this.inputNode;

    // Connect each effect in order
    for (const id of this.activeEffects) {
      const effect = this.effects.get(id);
      if (effect) {
        previousNode.connect(effect);
        previousNode = effect;
      }
    }

    // Connect the last effect to the output
    previousNode.connect(this.outputNode);
  }

  /**
   * Disposes of the effects chain
   */
  public dispose(): void {
    this.logger.info("ToneEffectsChain: Disposing effects chain");

    // Dispose all effects
    this.effects.forEach((effect) => {
      effect.dispose();
    });

    // Dispose input and output nodes
    this.inputNode.dispose();
    this.outputNode.dispose();

    // Clear collections
    this.effects.clear();
    this.activeEffects = [];
  }
}

/**
 * Built-in effect presets
 */
export const EFFECT_PRESETS: Record<string, EffectPreset> = {
  // Spacey ambient sound for background elements
  spaceAmbience: {
    name: "Space Ambience",
    description: "Deep space reverb with subtle modulation",
    effects: [
      {
        type: "reverb",
        params: {
          decay: 10,
          preDelay: 0.1,
          wet: 0.7,
        },
      },
      {
        type: "chorus",
        params: {
          frequency: 0.1,
          depth: 0.8,
          wet: 0.3,
        },
      },
      {
        type: "filter",
        params: {
          filterType: "lowpass",
          filterFrequency: 2000,
          Q: 1,
        },
      },
    ],
  },

  // 80s style sounds
  retroSynth: {
    name: "Retro Synth",
    description: "80s-inspired synth sound with chorus and delay",
    effects: [
      {
        type: "chorus",
        params: {
          frequency: 0.8,
          depth: 0.4,
          wet: 0.5,
        },
      },
      {
        type: "delay",
        params: {
          delayTime: 0.16,
          feedback: 0.25,
          wet: 0.4,
        },
      },
      {
        type: "eq3",
        params: {
          high: 3,
          mid: -2,
          low: 2,
        },
      },
    ],
  },

  // Alien/sci-fi sound
  alienTransmission: {
    name: "Alien Transmission",
    description: "Strange, otherworldly sound effect",
    effects: [
      {
        type: "pitchShift",
        params: {
          pitch: -2,
          wet: 0.6,
        },
      },
      {
        type: "tremolo",
        params: {
          frequency: 8,
          depth: 0.8,
          wet: 0.7,
        },
      },
      {
        type: "filter",
        params: {
          filterType: "bandpass",
          filterFrequency: 700,
          Q: 4,
        },
      },
    ],
  },

  // Explosion enhancement
  explosionEnhancer: {
    name: "Explosion Enhancer",
    description: "Makes explosions sound bigger and more impactful",
    effects: [
      {
        type: "distortion",
        params: {
          distortion: 0.3,
          wet: 0.4,
        },
      },
      {
        type: "compressor",
        params: {
          threshold: -30,
          ratio: 12,
          attack: 0.001,
          release: 0.1,
        },
      },
      {
        type: "reverb",
        params: {
          decay: 1.5,
          wet: 0.3,
        },
      },
    ],
  },

  // Crystal clear laser sounds
  crystalLaser: {
    name: "Crystal Laser",
    description: "Clean, sharp laser sounds",
    effects: [
      {
        type: "filter",
        params: {
          filterType: "highpass",
          filterFrequency: 1000,
          Q: 2,
        },
      },
      {
        type: "phaser",
        params: {
          frequency: 15,
          wet: 0.3,
        },
      },
      {
        type: "eq3",
        params: {
          high: 4,
          mid: 2,
          low: -5,
        },
      },
    ],
  },
};
