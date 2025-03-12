/**
 * ToneSoundEffectPlayer - Handles sound effect playback using Tone.js
 * This is a direct replacement for the Web Audio API's SoundEffectPlayer
 */
import { Logger } from "../../utils/Logger";
import * as Tone from "tone";
import { ToneContextManager } from "./ToneContextManager";
import { ToneBufferManager } from "./ToneBufferManager";

export class ToneSoundEffectPlayer {
  /** Context manager reference */
  private contextManager: ToneContextManager;

  /** Buffer manager reference */
  private bufferManager: ToneBufferManager;

  /** Track active sound effects for volume control and cleanup */
  private activePlayers: Map<string, Tone.Player> = new Map();

  /** Sound effect count for generating unique IDs */
  private effectCount: number = 0;

  /** Logger instance */
  private logger = Logger.getInstance();

  constructor(
    contextManager: ToneContextManager,
    bufferManager: ToneBufferManager
  ) {
    this.contextManager = contextManager;
    this.bufferManager = bufferManager;
    this.logger.info("ToneSoundEffectPlayer: Initialized");
  }

  /**
   * Plays a test tone to verify audio is working
   */
  public playTestTone(): void {
    try {
      this.logger.info("ToneSoundEffectPlayer: Playing test tone");

      // Create a simple sine oscillator
      const oscillator = new Tone.Oscillator({
        frequency: 440, // A4
        type: "sine",
        volume: -20, // -20 dB (quieter)
      }).toDestination();

      // Play for a short duration
      oscillator.start();
      oscillator.stop("+0.3"); // 300ms

      // Dispose when done
      oscillator.onstop = () => oscillator.dispose();
    } catch (error) {
      this.logger.error(
        "ToneSoundEffectPlayer: Error playing test tone",
        error
      );
    }
  }

  /**
   * Plays an audio sample with optional parameters
   */
  public playAudioSample(
    id: string,
    volume: number = 0.5,
    loop: boolean = false,
    pitch: number = 1.0
  ): Tone.Player | null {
    try {
      this.logger.info(`ToneSoundEffectPlayer: Playing audio sample ${id}`);

      // Check if the buffer exists
      if (!this.bufferManager.hasBuffer(id)) {
        this.logger.warn(`ToneSoundEffectPlayer: Buffer ${id} not found`);
        return null;
      }

      // Get the buffer
      const buffer = this.bufferManager.getBuffer(id);
      if (!buffer) {
        this.logger.warn(`ToneSoundEffectPlayer: Buffer ${id} is null`);
        return null;
      }

      // Generate a unique ID for this player instance
      const instanceId = `${id}_${++this.effectCount}`;

      // Create a player for this sample
      const player = new Tone.Player({
        url: buffer as any,
        loop: loop,
        playbackRate: pitch,
        volume: Tone.gainToDb(volume), // Convert linear volume to dB
        fadeIn: 0.01, // Small fade-in to avoid clicks
        fadeOut: 0.01, // Small fade-out to avoid clicks
      }).toDestination();

      // Start playback
      player.start();

      // Store for later cleanup
      this.activePlayers.set(instanceId, player);

      // Clean up after playback if not looping
      if (!loop) {
        player.onstop = () => {
          player.dispose();
          this.activePlayers.delete(instanceId);
        };
      }

      return player;
    } catch (error) {
      this.logger.error(
        `ToneSoundEffectPlayer: Error playing audio sample ${id}`,
        error
      );
      return null;
    }
  }

  /**
   * Plays a laser sound effect with varying types
   */
  public playLaserSound(type: string = "standard"): Tone.Synth | null {
    try {
      this.logger.info(
        `ToneSoundEffectPlayer: Playing laser sound of type ${type}`
      );

      let synth: Tone.Synth;
      let startFreq: number;
      let endFreq: number;
      let duration: number;

      // Configure based on type
      switch (type) {
        case "energy":
          // Energy laser: higher pitched, longer duration
          synth = new Tone.Synth({
            oscillator: { type: "sawtooth" },
            envelope: {
              attack: 0.005,
              decay: 0.1,
              sustain: 0.3,
              release: 0.2,
            },
          });
          startFreq = 2800;
          endFreq = 400;
          duration = 0.4;
          break;

        case "rapid":
          // Rapid fire: short, snappy
          synth = new Tone.Synth({
            oscillator: { type: "square" },
            envelope: {
              attack: 0.001,
              decay: 0.05,
              sustain: 0,
              release: 0.05,
            },
          });
          startFreq = 1800;
          endFreq = 1000;
          duration = 0.1;
          break;

        case "plasma":
          // Plasma: wider frequency sweep with noise
          synth = new Tone.Synth({
            oscillator: { type: "fmsine" },
            envelope: {
              attack: 0.001,
              decay: 0.2,
              sustain: 0.1,
              release: 0.3,
            },
          });
          startFreq = 3000;
          endFreq = 300;
          duration = 0.5;
          break;

        case "standard":
        default:
          // Standard laser: quick frequency sweep
          synth = new Tone.Synth({
            oscillator: { type: "sine" },
            envelope: {
              attack: 0.001,
              decay: 0.1,
              sustain: 0,
              release: 0.1,
            },
          });
          startFreq = 1400;
          endFreq = 600;
          duration = 0.2;
      }

      // Add processing: lower volume further (-18 dB) and shift pitch down (-5 semitones) for a deeper torpedo-like effect
      const pitchShift = new Tone.PitchShift({ pitch: -5 });
      const volumeNode = new Tone.Volume(-18);

      const filter = new Tone.Filter({
        frequency: 2000,
        type: "lowpass",
        rolloff: -12,
      });

      const distortion = new Tone.Distortion(0.3);

      // Connect the chain: synth -> pitchShift -> volume -> filter -> distortion -> destination
      synth.chain(
        pitchShift,
        volumeNode,
        filter,
        distortion,
        Tone.getDestination()
      );

      // Play the sound
      synth.triggerAttack(startFreq);
      synth.frequency.exponentialRampTo(endFreq, duration);
      synth.triggerRelease(Tone.now() + duration);

      // Cleanup
      setTimeout(() => {
        synth.dispose();
        pitchShift.dispose();
        volumeNode.dispose();
        filter.dispose();
        distortion.dispose();
      }, (duration + 0.5) * 1000);

      return synth;
    } catch (error) {
      this.logger.error(
        "ToneSoundEffectPlayer: Error playing laser sound",
        error
      );
      return null;
    }
  }

  /**
   * Plays a collision/explosion sound with different sizes
   */
  public playCollisionSound(size: string = "medium"): Tone.NoiseSynth | null {
    try {
      this.logger.info(
        `ToneSoundEffectPlayer: Playing collision sound of size ${size}`
      );

      let noise: Tone.NoiseSynth;
      let duration: number;

      // Configure based on size
      switch (size) {
        case "small":
          noise = new Tone.NoiseSynth({
            noise: { type: "white" },
            envelope: {
              attack: 0.001,
              decay: 0.15,
              sustain: 0,
              release: 0.1,
            },
          });
          duration = 0.2;
          break;

        case "large":
          noise = new Tone.NoiseSynth({
            noise: { type: "brown" },
            envelope: {
              attack: 0.01,
              decay: 0.5,
              sustain: 0.1,
              release: 0.5,
            },
          });
          duration = 0.8;
          break;

        case "medium":
        default:
          noise = new Tone.NoiseSynth({
            noise: { type: "pink" },
            envelope: {
              attack: 0.005,
              decay: 0.2,
              sustain: 0.05,
              release: 0.3,
            },
          });
          duration = 0.5;
      }

      // Add processing
      const filter = new Tone.Filter({
        frequency: size === "small" ? 2000 : size === "large" ? 800 : 1200,
        type: "lowpass",
      });

      // Add distortion for bigger explosions
      const distortion = new Tone.Distortion(size === "large" ? 0.5 : 0.2);

      // Connect the chain
      noise.chain(filter, distortion, Tone.getDestination());

      // Play the sound
      noise.triggerAttackRelease(duration);

      // Cleanup
      setTimeout(() => {
        noise.dispose();
        filter.dispose();
        distortion.dispose();
      }, (duration + 0.5) * 1000);

      return noise;
    } catch (error) {
      this.logger.error(
        "ToneSoundEffectPlayer: Error playing collision sound",
        error
      );
      return null;
    }
  }

  /**
   * Plays a specialized sound for asteroids destroyed by laser hits
   * Uses a combination of noise and synth for a more sci-fi explosion
   */
  public playLaserAsteroidExplosion(size: string = "medium"): void {
    try {
      this.logger.info(
        `ToneSoundEffectPlayer: Playing laser-asteroid explosion of size ${size}`
      );

      // 1. Create a basic explosion noise component
      const noiseSettings = {
        small: {
          noiseType: "white",
          attack: 0.001,
          decay: 0.1,
          sustain: 0,
          release: 0.1,
          duration: 0.15,
          filter: 3000,
          volume: -15,
        },
        medium: {
          noiseType: "pink",
          attack: 0.001,
          decay: 0.15,
          sustain: 0.05,
          release: 0.2,
          duration: 0.25,
          filter: 2000,
          volume: -10,
        },
        large: {
          noiseType: "brown",
          attack: 0.005,
          decay: 0.2,
          sustain: 0.1,
          release: 0.3,
          duration: 0.4,
          filter: 1500,
          volume: -5,
        },
      };

      // Get appropriate settings based on size
      const settings =
        noiseSettings[size as keyof typeof noiseSettings] ||
        noiseSettings.medium;

      // Create noise component for the explosion body
      const noise = new Tone.NoiseSynth({
        noise: { type: settings.noiseType as any },
        envelope: {
          attack: settings.attack,
          decay: settings.decay,
          sustain: settings.sustain,
          release: settings.release,
        },
        volume: settings.volume,
      });

      // Add a filter
      const filter = new Tone.Filter({
        frequency: settings.filter,
        type: "lowpass",
        rolloff: -24,
      });

      // Add a bit of distortion for texture
      const distortion = new Tone.Distortion({
        distortion: 0.3,
        wet: 0.2,
      });

      // Add some reverb to make it sound more "space-like"
      const reverb = new Tone.Reverb({
        decay: 0.8,
        wet: 0.1,
      });

      // Connect the noise chain
      noise.chain(filter, distortion, reverb, Tone.getDestination());

      // 2. Add a synth component for a more "electronic/sci-fi" zap sound
      const synth = new Tone.Synth({
        oscillator: {
          type: "sawtooth",
        },
        envelope: {
          attack: 0.001,
          decay: 0.1,
          sustain: 0,
          release: 0.1,
        },
        volume: -5,
      });

      // Add some effects to the synth
      const synthFilter = new Tone.Filter({
        frequency: 3000,
        type: "bandpass",
      });

      // A bit of phaser for sci-fi feel
      const phaser = new Tone.Phaser({
        frequency: 15,
        octaves: 5,
        baseFrequency: 1000,
        wet: 0.3,
      });

      // Connect the synth chain
      synth.chain(synthFilter, phaser, Tone.getDestination());

      // Staggered playback for more interesting sound
      noise.triggerAttackRelease(settings.duration);

      // Random note based on size for variation
      const notes =
        size === "small"
          ? ["C6", "D6", "E6"]
          : size === "medium"
          ? ["G5", "A5", "B5"]
          : ["C5", "D5", "E5"];
      const randomNote = notes[Math.floor(Math.random() * notes.length)];

      // Slight delay for synth component
      setTimeout(() => {
        synth.triggerAttackRelease(randomNote, 0.05);
      }, 20);

      // Cleanup
      setTimeout(() => {
        noise.dispose();
        filter.dispose();
        distortion.dispose();
        reverb.dispose();
        synth.dispose();
        synthFilter.dispose();
        phaser.dispose();
      }, (settings.duration + 0.5) * 1000);
    } catch (error) {
      this.logger.error(
        "ToneSoundEffectPlayer: Error playing laser-asteroid explosion sound",
        error
      );
    }
  }

  /**
   * Plays a specialized sound for asteroids colliding with the ship
   * Creates a heavier, more impactful sound to emphasize the collision
   */
  public playShipAsteroidCollision(size: string = "medium"): void {
    try {
      this.logger.info(
        `ToneSoundEffectPlayer: Playing ship-asteroid collision of size ${size}`
      );

      // Define settings based on collision size
      const collisionSettings = {
        small: {
          volume: -10,
          lowFreq: 100,
          highFreq: 2000,
          duration: 0.3,
          distortion: 0.3,
        },
        medium: {
          volume: -5,
          lowFreq: 80,
          highFreq: 1500,
          duration: 0.5,
          distortion: 0.4,
        },
        large: {
          volume: 0,
          lowFreq: 60,
          highFreq: 1000,
          duration: 0.8,
          distortion: 0.5,
        },
      };

      // Get appropriate settings
      const settings =
        collisionSettings[size as keyof typeof collisionSettings] ||
        collisionSettings.medium;

      // 1. Create a primary impact noise - deeper and more rumbly than laser explosion
      const impactNoise = new Tone.NoiseSynth({
        noise: { type: "brown" },
        envelope: {
          attack: 0.001, // Very quick attack for impact
          decay: 0.1,
          sustain: 0.2,
          release: 0.4,
        },
        volume: settings.volume,
      });

      // Create a metallic crash component with white noise
      const crashNoise = new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: {
          attack: 0.001,
          decay: 0.2,
          sustain: 0,
          release: 0.1,
        },
        volume: settings.volume - 10, // Slightly quieter than main impact
      });

      // Set up a dual-filter setup for more complex sound shaping
      const lowFilter = new Tone.Filter({
        frequency: settings.lowFreq,
        type: "lowpass",
        Q: 1.5,
      });

      const highFilter = new Tone.Filter({
        frequency: settings.highFreq,
        type: "highpass",
        Q: 0.5,
      });

      // Compressor to make it punch more
      const compressor = new Tone.Compressor({
        threshold: -20,
        ratio: 6,
        attack: 0.003,
        release: 0.1,
      });

      // Distortion for impact harshness
      const distortion = new Tone.Distortion({
        distortion: settings.distortion,
        wet: 0.3,
      });

      // Slight reverb
      const reverb = new Tone.Reverb({
        decay: 1.0,
        wet: 0.2,
      });

      // Connect the processing chains
      impactNoise.chain(
        lowFilter,
        compressor,
        distortion,
        reverb,
        Tone.getDestination()
      );
      crashNoise.chain(highFilter, compressor, Tone.getDestination());

      // Metal impact synth for ship hull sound
      const metalSynth = new Tone.MetalSynth({
        envelope: {
          attack: 0.001,
          decay: 0.1,
          release: 0.2,
        },
        harmonicity: 3.1,
        modulationIndex: 16,
        resonance: 4000,
        octaves: 1.5,
        volume: settings.volume - 15,
      });

      // Connect the metal synth
      metalSynth.chain(distortion, Tone.getDestination());

      // Staggered playback for more realistic collision sound
      impactNoise.triggerAttackRelease(settings.duration);

      // Slight delay for metal and crash components
      setTimeout(() => {
        metalSynth.triggerAttackRelease("C3", 0.05);
      }, 10);

      setTimeout(() => {
        crashNoise.triggerAttackRelease(settings.duration * 0.5);
      }, 20);

      // Cleanup
      setTimeout(() => {
        impactNoise.dispose();
        crashNoise.dispose();
        metalSynth.dispose();
        lowFilter.dispose();
        highFilter.dispose();
        compressor.dispose();
        distortion.dispose();
        reverb.dispose();
      }, (settings.duration + 0.5) * 1000);
    } catch (error) {
      this.logger.error(
        "ToneSoundEffectPlayer: Error playing ship-asteroid collision sound",
        error
      );
    }
  }

  /**
   * Stops all currently playing sound effects
   */
  public stopAllEffects(fadeOutTime: number = 0.1): void {
    this.logger.info("ToneSoundEffectPlayer: Stopping all effects");

    // Fade out all active players
    this.activePlayers.forEach((player) => {
      player.volume.rampTo(-60, fadeOutTime);

      // Stop and dispose after fade out
      setTimeout(() => {
        player.stop();
        player.dispose();
      }, fadeOutTime * 1000);
    });

    // Clear the map
    this.activePlayers.clear();
  }

  /**
   * Disposes of resources
   */
  public dispose(): void {
    this.logger.info("ToneSoundEffectPlayer: Disposing resources");

    // Stop and dispose all active players
    this.activePlayers.forEach((player) => {
      player.stop();
      player.dispose();
    });

    // Clear the map
    this.activePlayers.clear();
  }
}
