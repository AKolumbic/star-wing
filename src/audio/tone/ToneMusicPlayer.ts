/**
 * ToneMusicPlayer - Handles music playback and transitions using Tone.js
 * This is a direct replacement for the Web Audio API's MusicPlayer
 */
import { Logger } from "../../utils/Logger";
import * as Tone from "tone";
import { ToneContextManager } from "./ToneContextManager";
import { ToneBufferManager } from "./ToneBufferManager";

/**
 * Interface for an active music layer
 */
interface MusicLayer {
  id: string;
  player: Tone.Player;
  gain: Tone.Gain;
  volume: number;
  startTime: number;
}

export class ToneMusicPlayer {
  /** Context manager reference */
  private contextManager: ToneContextManager;

  /** Buffer manager reference */
  private bufferManager: ToneBufferManager;

  /** Active music players */
  private activePlayers: Map<string, Tone.Player> = new Map();

  /** Active music layers for layered playback */
  private activeLayers: Map<string, MusicLayer> = new Map();

  /** Logger instance */
  private logger = Logger.getInstance();

  constructor(
    contextManager: ToneContextManager,
    bufferManager: ToneBufferManager
  ) {
    this.contextManager = contextManager;
    this.bufferManager = bufferManager;
    this.logger.info("ToneMusicPlayer: Initialized");
  }

  /**
   * Plays menu music (either file-based or procedural)
   */
  public playMenuMusic(
    loop: boolean = true,
    fadeInTime: number = 1
  ): Tone.Player | null {
    this.logger.info("ToneMusicPlayer: Playing menu music");

    try {
      // Check if the buffer exists
      if (!this.bufferManager.hasBuffer("menu_music")) {
        this.logger.warn("ToneMusicPlayer: Menu music buffer not found");
        return null;
      }

      // Stop any existing menu music
      this.stopMenuMusic();

      // Get the buffer
      const buffer = this.bufferManager.getBuffer("menu_music");
      if (!buffer) {
        this.logger.warn("ToneMusicPlayer: Menu music buffer is null");
        return null;
      }

      this.logger.info(
        `ToneMusicPlayer: Creating player with buffer duration: ${buffer.duration}s`
      );

      // Ensure Tone.js context is running
      if (Tone.context.state !== "running") {
        this.logger.info("ToneMusicPlayer: Starting audio context");
        Tone.context.resume();
        Tone.start();
      }

      // Create a new player with the loaded AudioBuffer by passing the underlying AudioBuffer
      const audioBuffer = buffer.get() as AudioBuffer;
      const player = new Tone.Player(audioBuffer, () => {
        this.logger.info("ToneMusicPlayer: Player loaded");
      });
      player.loop = loop;
      player.autostart = false;
      player.volume.value = -10; // initially set lower
      player.toDestination();

      // Store the player
      this.activePlayers.set("menu_music", player);

      // For testing, set volume to 0 dB immediately
      player.volume.value = 0;
      player.start();

      this.logger.info("ToneMusicPlayer: Menu music playing");
      return player;
    } catch (error) {
      this.logger.error("ToneMusicPlayer: Error playing menu music", error);
      return null;
    }
  }

  /**
   * Stops menu music with an optional fade-out
   */
  public stopMenuMusic(fadeOutTime: number = 1): void {
    this.logger.info("ToneMusicPlayer: Stopping menu music");

    const player = this.activePlayers.get("menu_music");
    if (player) {
      // Fade out gracefully
      player.volume.rampTo(-60, fadeOutTime);

      // Stop and dispose after fade out
      Tone.getTransport().scheduleOnce(() => {
        player.stop();
        player.dispose();
        this.activePlayers.delete("menu_music");
      }, `+${fadeOutTime}`);
    }
  }

  /**
   * Starts layered music playback
   */
  public startLayeredMusic(baseMusicId: string): void {
    this.logger.info(
      `ToneMusicPlayer: Starting layered music with base ${baseMusicId}`
    );

    // Stop any existing layered music
    this.stopLayeredMusic();

    // Reset the Transport
    Tone.getTransport().stop();
    Tone.getTransport().position = 0;

    // Add the base layer
    this.addMusicLayer(baseMusicId, 1.0);

    // Start the Transport
    Tone.getTransport().start();
  }

  /**
   * Adds a music layer to the layered music
   */
  public addMusicLayer(
    id: string,
    volume: number = 0.7,
    fadeInTime: number = 1
  ): void {
    this.logger.info(`ToneMusicPlayer: Adding music layer ${id}`);

    try {
      // Check if the buffer exists
      if (!this.bufferManager.hasBuffer(id)) {
        this.logger.warn(`ToneMusicPlayer: Layer ${id} buffer not found`);
        return;
      }

      // Get the buffer
      const buffer = this.bufferManager.getBuffer(id);
      if (!buffer) {
        this.logger.warn(`ToneMusicPlayer: Layer ${id} buffer is null`);
        return;
      }

      // Create a gain node for volume control
      const gain = new Tone.Gain(0).toDestination();

      // Create a player
      const player = new Tone.Player({
        url: buffer as any,
        loop: true,
        fadeIn: 0, // We'll handle the fade manually through the gain
      }).connect(gain);

      // Start the player
      player.sync().start(0);

      // Fade in the gain
      gain.gain.rampTo(volume, fadeInTime);

      // Store the layer
      this.activeLayers.set(id, {
        id,
        player,
        gain,
        volume,
        startTime: Tone.now(),
      });

      this.logger.info(`ToneMusicPlayer: Added layer ${id}`);
    } catch (error) {
      this.logger.error(`ToneMusicPlayer: Error adding layer ${id}`, error);
    }
  }

  /**
   * Sets the volume of a specific music layer
   */
  public setLayerVolume(
    id: string,
    volume: number,
    rampTime: number = 0.5
  ): void {
    this.logger.info(
      `ToneMusicPlayer: Setting layer ${id} volume to ${volume}`
    );

    const layer = this.activeLayers.get(id);
    if (layer) {
      layer.volume = volume;
      layer.gain.gain.rampTo(volume, rampTime);
    } else {
      this.logger.warn(`ToneMusicPlayer: Layer ${id} not found`);
    }
  }

  /**
   * Removes a music layer
   */
  public removeMusicLayer(id: string, fadeOutTime: number = 1): void {
    this.logger.info(`ToneMusicPlayer: Removing layer ${id}`);

    const layer = this.activeLayers.get(id);
    if (layer) {
      // Fade out
      layer.gain.gain.rampTo(0, fadeOutTime);

      // Stop and dispose after fade out
      Tone.getTransport().scheduleOnce(() => {
        layer.player.stop();
        layer.player.dispose();
        layer.gain.dispose();
        this.activeLayers.delete(id);
      }, `+${fadeOutTime}`);
    }
  }

  /**
   * Stops all layered music
   */
  public stopLayeredMusic(fadeOutTime: number = 1): void {
    this.logger.info("ToneMusicPlayer: Stopping all layered music");

    // Fade out all layers
    this.activeLayers.forEach((layer) => {
      layer.gain.gain.rampTo(0, fadeOutTime);
    });

    // Stop and dispose after fade out
    Tone.getTransport().scheduleOnce(() => {
      // Stop the transport
      Tone.getTransport().stop();

      // Dispose of all layers
      this.activeLayers.forEach((layer) => {
        layer.player.stop();
        layer.player.dispose();
        layer.gain.dispose();
      });

      // Clear the layers
      this.activeLayers.clear();
    }, `+${fadeOutTime}`);
  }

  /**
   * Check if a specific music layer is active
   */
  public hasLayer(id: string): boolean {
    return this.activeLayers.has(id);
  }

  /**
   * Get IDs of all active layers
   */
  public getActiveLayers(): string[] {
    return Array.from(this.activeLayers.keys());
  }

  /**
   * Disposes of all resources
   */
  public dispose(): void {
    this.logger.info("ToneMusicPlayer: Disposing resources");

    // Stop and dispose all active players
    this.activePlayers.forEach((player) => {
      player.stop();
      player.dispose();
    });
    this.activePlayers.clear();

    // Stop and dispose all layers
    this.activeLayers.forEach((layer) => {
      layer.player.stop();
      layer.player.dispose();
      layer.gain.dispose();
    });
    this.activeLayers.clear();
  }
}
