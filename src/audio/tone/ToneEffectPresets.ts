/**
 * ToneEffectPresets - A collection of predefined effect chains for different game environments and situations.
 * This is a new feature for Phase 6 to showcase Tone.js's advanced effects capabilities.
 */
import { EffectPreset, EffectType } from "./ToneEffectsChain";

/**
 * Environment-specific presets for different game locations
 */
export const EnvironmentPresets: Record<string, EffectPreset> = {
  // Space environment - spacious reverb with slight filtering
  space: {
    name: "Space",
    description: "Vast, empty space with subtle reverb and filtering",
    effects: [
      {
        type: "reverb",
        params: {
          decay: 3.5,
          preDelay: 0.02,
          wet: 0.35,
        },
      },
      {
        type: "filter",
        params: {
          filterType: "lowpass",
          filterFrequency: 10000,
          Q: 0.5,
        },
      },
    ],
  },

  // Cave environment - echoing, dark reverb
  cave: {
    name: "Cave",
    description: "Echoing cave with long reverb tail",
    effects: [
      {
        type: "delay",
        params: {
          delayTime: 0.3,
          feedback: 0.4,
          wet: 0.3,
        },
      },
      {
        type: "reverb",
        params: {
          decay: 5,
          preDelay: 0.01,
          wet: 0.5,
        },
      },
      {
        type: "filter",
        params: {
          filterType: "lowpass",
          filterFrequency: 5000,
          Q: 1,
        },
      },
    ],
  },

  // Underwater environment - filtered, muffled sound
  underwater: {
    name: "Underwater",
    description: "Muffled underwater sound with low frequencies emphasized",
    effects: [
      {
        type: "filter",
        params: {
          filterType: "lowpass",
          filterFrequency: 800,
          Q: 1.5,
        },
      },
      {
        type: "reverb",
        params: {
          decay: 2,
          preDelay: 0.05,
          wet: 0.7,
        },
      },
      {
        type: "phaser",
        params: {
          frequency: 0.1,
          depth: 0.8,
          wet: 0.3,
        },
      },
    ],
  },

  // Desert environment - dry with little reverb
  desert: {
    name: "Desert",
    description: "Dry sound with minimal reverb and slight filter",
    effects: [
      {
        type: "reverb",
        params: {
          decay: 0.8,
          preDelay: 0.01,
          wet: 0.1,
        },
      },
      {
        type: "filter",
        params: {
          filterType: "highpass",
          filterFrequency: 200,
          Q: 0.5,
        },
      },
    ],
  },

  // Forest environment - natural reverb, bird-like modulation
  forest: {
    name: "Forest",
    description: "Natural forest ambience with subtle modulation",
    effects: [
      {
        type: "reverb",
        params: {
          decay: 1.5,
          preDelay: 0.01,
          wet: 0.25,
        },
      },
      {
        type: "chorus",
        params: {
          frequency: 0.4,
          depth: 0.3,
          wet: 0.2,
        },
      },
    ],
  },
};

/**
 * Special effect presets for specific gameplay events
 */
export const GameplayPresets: Record<string, EffectPreset> = {
  // Time slow-motion effect
  slowMotion: {
    name: "Slow Motion",
    description: "Time dilation effect with pitch shifting and reverb",
    effects: [
      {
        type: "pitchShift",
        params: {
          pitch: -5,
          windowSize: 0.1,
          wet: 0.8,
        },
      },
      {
        type: "reverb",
        params: {
          decay: 4,
          preDelay: 0.1,
          wet: 0.6,
        },
      },
      {
        type: "filter",
        params: {
          filterType: "lowpass",
          filterFrequency: 1000,
          Q: 1,
        },
      },
    ],
  },

  // Damaged/low health effect
  damaged: {
    name: "Damaged",
    description: "Low health sound effect with filtering and distortion",
    effects: [
      {
        type: "filter",
        params: {
          filterType: "lowpass",
          filterFrequency: 800,
          Q: 1,
        },
      },
      {
        type: "distortion",
        params: {
          distortion: 0.3,
          wet: 0.5,
        },
      },
      {
        type: "tremolo",
        params: {
          frequency: 4,
          depth: 0.7,
          wet: 0.6,
        },
      },
    ],
  },

  // Power-up effect
  powerUp: {
    name: "Power Up",
    description: "Energetic sound enhancement with chorus and reverb",
    effects: [
      {
        type: "chorus",
        params: {
          frequency: 1.5,
          depth: 0.7,
          wet: 0.5,
        },
      },
      {
        type: "phaser",
        params: {
          frequency: 0.8,
          depth: 0.6,
          wet: 0.3,
        },
      },
      {
        type: "reverb",
        params: {
          decay: 1.5,
          preDelay: 0.02,
          wet: 0.4,
        },
      },
    ],
  },

  // Communication/radio effect
  radio: {
    name: "Radio",
    description: "Radio/communications filter effect",
    effects: [
      {
        type: "filter",
        params: {
          filterType: "bandpass",
          filterFrequency: 1800,
          Q: 1.5,
        },
      },
      {
        type: "distortion",
        params: {
          distortion: 0.1,
          wet: 0.3,
        },
      },
      {
        type: "tremolo",
        params: {
          frequency: 0.8,
          depth: 0.2,
          wet: 0.2,
        },
      },
    ],
  },

  // Boss battle effect - dramatic and intense
  bossBattle: {
    name: "Boss Battle",
    description: "Dramatic sound enhancement for boss battles",
    effects: [
      {
        type: "compressor",
        params: {
          threshold: -20,
          ratio: 4,
          attack: 0.005,
          release: 0.1,
        },
      },
      {
        type: "reverb",
        params: {
          decay: 3,
          preDelay: 0.01,
          wet: 0.3,
        },
      },
      {
        type: "distortion",
        params: {
          distortion: 0.1,
          wet: 0.2,
        },
      },
    ],
  },
};

/**
 * Get the appropriate environment preset based on the environment name
 * Falls back to 'space' preset if not found
 */
export function getEnvironmentPreset(environment: string): EffectPreset {
  return EnvironmentPresets[environment] || EnvironmentPresets["space"];
}

/**
 * Get a gameplay preset by name
 * Returns null if the preset doesn't exist
 */
export function getGameplayPreset(name: string): EffectPreset | null {
  return GameplayPresets[name] || null;
}

/**
 * Create a custom blend of two presets with a given blend ratio
 * @param preset1 The first preset
 * @param preset2 The second preset
 * @param blendRatio The blend ratio (0 = all preset1, 1 = all preset2)
 */
export function blendPresets(
  preset1: EffectPreset,
  preset2: EffectPreset,
  blendRatio: number = 0.5
): EffectPreset {
  // Ensure blend ratio is between 0 and 1
  const ratio = Math.max(0, Math.min(1, blendRatio));

  // Create a map of all effect types from both presets
  const effectTypes = new Set<EffectType>();
  preset1.effects.forEach((effect) => effectTypes.add(effect.type));
  preset2.effects.forEach((effect) => effectTypes.add(effect.type));

  // Create the blended preset
  const blendedPreset: EffectPreset = {
    name: `Blend: ${preset1.name} + ${preset2.name}`,
    description: `Blended preset (${Math.round((1 - ratio) * 100)}% ${
      preset1.name
    }, ${Math.round(ratio * 100)}% ${preset2.name})`,
    effects: [],
  };

  // Helper to find an effect by type in a preset
  const findEffect = (preset: EffectPreset, type: EffectType) => {
    return preset.effects.find((effect) => effect.type === type);
  };

  // For each effect type, blend the parameters
  effectTypes.forEach((type) => {
    const effect1 = findEffect(preset1, type);
    const effect2 = findEffect(preset2, type);

    if (effect1 && effect2) {
      // Both presets have this effect, blend them
      const blendedEffect = {
        type,
        params: {} as Record<string, any>,
      };

      // Combine all possible parameters
      const allParams = new Set<string>();
      Object.keys(effect1.params || {}).forEach((param) =>
        allParams.add(param)
      );
      Object.keys(effect2.params || {}).forEach((param) =>
        allParams.add(param)
      );

      // Blend numeric parameters
      allParams.forEach((param) => {
        const param1 =
          effect1.params && param in effect1.params
            ? (effect1.params as Record<string, any>)[param]
            : undefined;
        const param2 =
          effect2.params && param in effect2.params
            ? (effect2.params as Record<string, any>)[param]
            : undefined;

        if (param1 !== undefined && param2 !== undefined) {
          // Both presets have this parameter
          if (typeof param1 === "number" && typeof param2 === "number") {
            // Numeric parameters can be interpolated
            blendedEffect.params[param] = param1 * (1 - ratio) + param2 * ratio;
          } else {
            // Non-numeric parameters use the one from the dominant preset
            blendedEffect.params[param] = ratio < 0.5 ? param1 : param2;
          }
        } else if (param1 !== undefined) {
          // Only preset1 has this parameter
          blendedEffect.params[param] = param1;
        } else if (param2 !== undefined) {
          // Only preset2 has this parameter
          blendedEffect.params[param] = param2;
        }
      });

      blendedPreset.effects.push(blendedEffect);
    } else if (effect1) {
      // Only preset1 has this effect
      // Scale the wet parameter based on the blend ratio
      const scaledEffect = { ...effect1 };
      if (scaledEffect.params?.wet !== undefined) {
        scaledEffect.params = { ...scaledEffect.params };
        // Use type assertion for safety
        const wetValue = (scaledEffect.params as Record<string, any>)
          .wet as number;
        (scaledEffect.params as Record<string, any>).wet =
          wetValue * (1 - ratio);
      }
      if ((scaledEffect.params as Record<string, any>)?.wet !== 0) {
        blendedPreset.effects.push(scaledEffect);
      }
    } else if (effect2) {
      // Only preset2 has this effect
      // Scale the wet parameter based on the blend ratio
      const scaledEffect = { ...effect2 };
      if (scaledEffect.params?.wet !== undefined) {
        scaledEffect.params = { ...scaledEffect.params };
        // Use type assertion for safety
        const wetValue = (scaledEffect.params as Record<string, any>)
          .wet as number;
        (scaledEffect.params as Record<string, any>).wet = wetValue * ratio;
      }
      if ((scaledEffect.params as Record<string, any>)?.wet !== 0) {
        blendedPreset.effects.push(scaledEffect);
      }
    }
  });

  return blendedPreset;
}
