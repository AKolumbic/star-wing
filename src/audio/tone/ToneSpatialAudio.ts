/**
 * ToneSpatialAudio - Provides 3D spatial audio capabilities using Tone.js
 * This is a new feature added in Phase 6 to leverage Tone.js strengths
 */
import { Logger } from "../../utils/Logger";
import * as Tone from "tone";
import { ToneContextManager } from "./ToneContextManager";
import { ToneBufferManager } from "./ToneBufferManager";

// 3D position interface
export interface Position3D {
  x: number;
  y: number;
  z: number;
}

// Sound source configuration
export interface SpatialSoundConfig {
  id: string; // Unique identifier
  bufferId: string; // Audio buffer identifier
  loop?: boolean; // Whether to loop the sound
  autoplay?: boolean; // Whether to start playing immediately
  volume?: number; // Initial volume (0-1)
  position?: Position3D; // Initial position
  rolloffFactor?: number; // How quickly the sound attenuates with distance
  refDistance?: number; // Reference distance for reducing volume
  maxDistance?: number; // Maximum distance at which the sound is audible
  playbackRate?: number; // Playback rate (pitch/speed)
  fadeIn?: number; // Fade in time in seconds
}

export class ToneSpatialAudio {
  /** Context manager reference */
  private contextManager: ToneContextManager;

  /** Buffer manager reference */
  private bufferManager: ToneBufferManager;

  /** Active spatial sound sources */
  private soundSources: Map<string, Tone.Player> = new Map();

  /** Panner nodes for each sound source */
  private panners: Map<string, Tone.Panner3D> = new Map();

  /** Listener position and orientation */
  private listenerPosition: Position3D = { x: 0, y: 0, z: 0 };
  private listenerOrientation: {
    forward: Position3D;
    up: Position3D;
  } = {
    forward: { x: 0, y: 0, z: -1 }, // Default looking forward (negative z)
    up: { x: 0, y: 1, z: 0 }, // Default up direction
  };

  /** Master effects for all spatial audio */
  private masterReverb?: Tone.Reverb;
  private masterFilter?: Tone.Filter;

  /** Logger instance */
  private logger = Logger.getInstance();

  /**
   * Creates a new spatial audio manager
   */
  constructor(
    contextManager: ToneContextManager,
    bufferManager: ToneBufferManager
  ) {
    this.contextManager = contextManager;
    this.bufferManager = bufferManager;
    this.logger.info("ToneSpatialAudio: Initialized");

    // Set up master effects
    this.initializeEffects();
  }

  /**
   * Initialize effects processing chain for spatial audio
   */
  private initializeEffects(): void {
    // Create a subtle reverb for adding space to the spatial audio
    this.masterReverb = new Tone.Reverb({
      decay: 1.5,
      wet: 0.2,
      preDelay: 0.01,
    }).toDestination();

    // Create a filter for distance simulation
    this.masterFilter = new Tone.Filter({
      frequency: 20000,
      type: "lowpass",
      Q: 1,
    }).connect(this.masterReverb);
  }

  /**
   * Create a new spatial sound source
   */
  public createSoundSource(config: SpatialSoundConfig): boolean {
    try {
      this.logger.info(
        `ToneSpatialAudio: Creating spatial sound source ${config.id}`
      );

      // Check if sound source already exists
      if (this.soundSources.has(config.id)) {
        this.logger.warn(
          `ToneSpatialAudio: Sound source ${config.id} already exists, replacing it`
        );
        this.removeSoundSource(config.id);
      }

      // Check if buffer exists
      const buffer = this.bufferManager.getBuffer(config.bufferId);
      if (!buffer) {
        this.logger.error(
          `ToneSpatialAudio: Buffer ${config.bufferId} not found`
        );
        return false;
      }

      // Create a player with the buffer
      const player = new Tone.Player({
        url: buffer,
        loop: config.loop || false,
        autostart: false,
        volume: config.volume !== undefined ? Tone.gainToDb(config.volume) : 0,
        playbackRate: config.playbackRate || 1,
        fadeIn: config.fadeIn || 0,
      });

      // Create a 3D panner node
      const panner = new Tone.Panner3D({
        positionX: config.position?.x || 0,
        positionY: config.position?.y || 0,
        positionZ: config.position?.z || 0,
        rolloffFactor: config.rolloffFactor || 1,
        refDistance: config.refDistance || 1,
        maxDistance: config.maxDistance || 10000,
        distanceModel: "inverse",
        panningModel: "HRTF", // More realistic 3D panning
      });

      // Connect the player to the panner and then to the master effects
      player.connect(panner);

      if (this.masterFilter) {
        panner.connect(this.masterFilter);
      } else {
        panner.toDestination();
      }

      // Store references
      this.soundSources.set(config.id, player);
      this.panners.set(config.id, panner);

      // Start playing if autoplay is enabled
      if (config.autoplay) {
        player.start();
      }

      return true;
    } catch (error) {
      this.logger.error(
        `ToneSpatialAudio: Error creating sound source ${config.id}`,
        error
      );
      return false;
    }
  }

  /**
   * Remove a spatial sound source
   */
  public removeSoundSource(id: string): void {
    this.logger.info(`ToneSpatialAudio: Removing sound source ${id}`);

    const player = this.soundSources.get(id);
    const panner = this.panners.get(id);

    if (player) {
      player.stop();
      player.dispose();
      this.soundSources.delete(id);
    }

    if (panner) {
      panner.dispose();
      this.panners.delete(id);
    }
  }

  /**
   * Play a spatial sound
   */
  public playSoundSource(id: string): void {
    const player = this.soundSources.get(id);
    if (player) {
      player.start();
    } else {
      this.logger.warn(`ToneSpatialAudio: Sound source ${id} not found`);
    }
  }

  /**
   * Stop a spatial sound
   */
  public stopSoundSource(id: string, fadeOut: number = 0): void {
    const player = this.soundSources.get(id);
    if (player) {
      if (fadeOut > 0) {
        player.volume.rampTo(-80, fadeOut);
        setTimeout(() => player.stop(), fadeOut * 1000);
      } else {
        player.stop();
      }
    } else {
      this.logger.warn(`ToneSpatialAudio: Sound source ${id} not found`);
    }
  }

  /**
   * Update the position of a sound source
   */
  public updateSoundPosition(id: string, position: Position3D): void {
    const panner = this.panners.get(id);
    if (panner) {
      panner.positionX.value = position.x;
      panner.positionY.value = position.y;
      panner.positionZ.value = position.z;

      // Update filter based on distance from listener
      this.updateSoundFiltering(id);
    } else {
      this.logger.warn(`ToneSpatialAudio: Panner for ${id} not found`);
    }
  }

  /**
   * Update the listener position (usually the player/camera)
   */
  public updateListenerPosition(position: Position3D): void {
    this.listenerPosition = position;

    // Update the Tone.js listener position
    Tone.Listener.positionX.value = position.x;
    Tone.Listener.positionY.value = position.y;
    Tone.Listener.positionZ.value = position.z;

    // Update all sound sources filtering based on new distances
    this.panners.forEach((_, id) => {
      this.updateSoundFiltering(id);
    });
  }

  /**
   * Update the listener orientation
   */
  public updateListenerOrientation(forward: Position3D, up: Position3D): void {
    this.listenerOrientation = { forward, up };

    // Update the Tone.js listener orientation
    // Forward vector
    Tone.Listener.forwardX.value = forward.x;
    Tone.Listener.forwardY.value = forward.y;
    Tone.Listener.forwardZ.value = forward.z;

    // Up vector
    Tone.Listener.upX.value = up.x;
    Tone.Listener.upY.value = up.y;
    Tone.Listener.upZ.value = up.z;
  }

  /**
   * Update sound filtering based on distance from listener
   * This simulates air absorption of high frequencies over distance
   */
  private updateSoundFiltering(id: string): void {
    if (!this.masterFilter) return;

    const panner = this.panners.get(id);
    if (!panner) return;

    // Calculate distance
    const dx = panner.positionX.value - this.listenerPosition.x;
    const dy = panner.positionY.value - this.listenerPosition.y;
    const dz = panner.positionZ.value - this.listenerPosition.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Attenuate high frequencies based on distance
    // Closer sounds have more high frequency content
    const maxFreq = 20000;
    const minFreq = 200;
    const maxDist = 100; // Maximum distance for filter scaling

    let cutoffFreq =
      maxFreq - ((maxFreq - minFreq) * Math.min(distance, maxDist)) / maxDist;
    this.masterFilter.frequency.value = cutoffFreq;
  }

  /**
   * Set the volume of a spatial sound
   */
  public setSoundVolume(id: string, volume: number): void {
    const player = this.soundSources.get(id);
    if (player) {
      player.volume.value = Tone.gainToDb(volume);
    } else {
      this.logger.warn(`ToneSpatialAudio: Sound source ${id} not found`);
    }
  }

  /**
   * Set the overall reverb wetness (environment size)
   */
  public setEnvironmentSize(size: number): void {
    if (this.masterReverb) {
      // Clamp size between 0 and 1
      const wetness = Math.max(0, Math.min(1, size));
      this.masterReverb.wet.value = wetness;

      // Adjust decay time based on size
      const decay = 0.5 + size * 5; // 0.5 to 5.5 seconds
      this.masterReverb.decay = decay;
    }
  }

  /**
   * Check if a sound source is currently playing
   */
  public isPlaying(id: string): boolean {
    const player = this.soundSources.get(id);
    return player ? player.state === "started" : false;
  }

  /**
   * Dispose all resources
   */
  public dispose(): void {
    this.logger.info("ToneSpatialAudio: Disposing resources");

    // Dispose all sound sources and panners
    this.soundSources.forEach((player) => {
      player.stop();
      player.dispose();
    });

    this.panners.forEach((panner) => {
      panner.dispose();
    });

    // Clear collections
    this.soundSources.clear();
    this.panners.clear();

    // Dispose master effects
    if (this.masterReverb) {
      this.masterReverb.dispose();
    }

    if (this.masterFilter) {
      this.masterFilter.dispose();
    }
  }
}
