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

  /** Track active fadeout timers to cancel them when restarting tracks */
  private fadeoutTimers: Map<string, number> = new Map();

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
   * Creates a menu music player without starting it,
   * used for preloading to eliminate startup delay.
   */
  public createMenuMusicPlayer(): Tone.Player | null {
    try {
      // Check if the buffer exists
      if (!this.bufferManager.hasBuffer("menu_music")) {
        this.logger.warn("ToneMusicPlayer: Menu music buffer not found");
        return null;
      }

      // Check if we already have a player
      if (this.activePlayers.has("menu_music")) {
        return this.activePlayers.get("menu_music") || null;
      }

      // Get the buffer
      const buffer = this.bufferManager.getBuffer("menu_music");
      if (!buffer) {
        this.logger.warn("ToneMusicPlayer: Menu music buffer is null");
        return null;
      }

      this.logger.info(
        `ToneMusicPlayer: Pre-creating player with buffer duration: ${buffer.duration}s`
      );

      // Ensure Tone.js context is running
      if (Tone.context.state !== "running") {
        this.logger.info("ToneMusicPlayer: Starting audio context");
        Tone.context.resume();
        Tone.start();
      }

      // Create a new player with the loaded AudioBuffer
      const audioBuffer = buffer.get() as AudioBuffer;
      const player = new Tone.Player(audioBuffer, () => {
        this.logger.info("ToneMusicPlayer: Player preloaded and ready");
      });
      player.loop = true;
      player.autostart = false;
      player.volume.value = -60; // Start silent
      player.toDestination();

      // Store the player
      this.activePlayers.set("menu_music", player);
      return player;
    } catch (error) {
      this.logger.error(
        "ToneMusicPlayer: Error creating menu music player",
        error
      );
      return null;
    }
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
      // Cancel any pending fadeout timers to prevent race conditions
      if (this.fadeoutTimers.has("menu_music")) {
        this.logger.info("ToneMusicPlayer: Cancelling pending fadeout timer");
        clearTimeout(this.fadeoutTimers.get("menu_music"));
        this.fadeoutTimers.delete("menu_music");
      }

      // Check if we already have a menu music player
      const existingPlayer = this.activePlayers.get("menu_music");
      if (existingPlayer) {
        this.logger.info(
          "ToneMusicPlayer: Using pre-created menu music player for instant playback"
        );

        // Reset the player to start from the beginning
        try {
          existingPlayer.stop();
          existingPlayer.seek(0);
          existingPlayer.volume.value = 0; // Set to full volume immediately
          existingPlayer.start();
          this.logger.info(
            "ToneMusicPlayer: Menu music playing (instant start)"
          );
          return existingPlayer;
        } catch (error) {
          this.logger.warn(
            "ToneMusicPlayer: Error restarting existing player",
            error
          );
          // Continue to create a new one if restarting failed
        }
      }

      // If we don't have a player or restarting failed, create a new one
      // Check if the buffer exists
      if (!this.bufferManager.hasBuffer("menu_music")) {
        this.logger.warn("ToneMusicPlayer: Menu music buffer not found");
        return null;
      }

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
      player.volume.value = 0; // set to normal volume
      player.toDestination();

      // Store the player
      this.activePlayers.set("menu_music", player);

      // Start playback
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

      // Clear any existing fadeout timer
      if (this.fadeoutTimers.has("menu_music")) {
        clearTimeout(this.fadeoutTimers.get("menu_music"));
        this.fadeoutTimers.delete("menu_music");
      }

      // Just stop after fade out but keep the player for reuse
      const timerId = setTimeout(() => {
        player.stop();
        // Keep player in activePlayers for instant reuse
        this.logger.info(
          "ToneMusicPlayer: Menu music stopped but player preserved for instant restart"
        );
        this.fadeoutTimers.delete("menu_music");
      }, fadeOutTime * 1000);

      // Store the timer ID so we can cancel it if needed
      this.fadeoutTimers.set("menu_music", timerId as unknown as number);
    }
  }

  /**
   * Starts layered music playback
   * Returns true if the base layer was successfully added, false otherwise.
   */
  public startLayeredMusic(baseMusicId: string): boolean {
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

    // Check if the base layer was added successfully
    if (!this.activeLayers.has(baseMusicId)) {
      this.logger.warn(
        `ToneMusicPlayer: Failed to add layered music for id ${baseMusicId}`
      );
      return false;
    }

    // Start the Transport
    Tone.getTransport().start();
    return true;
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
   * Disposes all active players and resources
   */
  public dispose(): void {
    this.logger.info("ToneMusicPlayer: Disposing resources");

    // Stop any active fadeout timers
    this.fadeoutTimers.forEach((timerId) => {
      clearTimeout(timerId);
    });
    this.fadeoutTimers.clear();

    // Stop and dispose all active players
    this.activePlayers.forEach((player) => {
      try {
        player.stop();
        player.dispose();
      } catch (error) {
        this.logger.warn("Error disposing player:", error);
      }
    });
    this.activePlayers.clear();

    // Stop and dispose all active layers
    this.activeLayers.forEach((layer) => {
      try {
        layer.player.stop();
        layer.player.dispose();
        layer.gain.dispose();
      } catch (error) {
        this.logger.warn("Error disposing layer:", error);
      }
    });
    this.activeLayers.clear();

    this.logger.info("ToneMusicPlayer: All resources disposed");
  }

  /**
   * Plays game loop music using the 'game_loop' buffer.
   */
  public playGameMusic(
    loop: boolean = true,
    fadeInTime: number = 1
  ): Tone.Player | null {
    this.logger.info("ToneMusicPlayer: Playing game loop music");
    try {
      // Check if the buffer exists
      if (!this.bufferManager.hasBuffer("game_loop")) {
        this.logger.warn("ToneMusicPlayer: Game loop music buffer not found");
        return null;
      }
      // Stop any existing game loop music if playing
      const existingPlayer = this.activePlayers.get("game_loop");
      if (existingPlayer) {
        existingPlayer.stop();
        existingPlayer.dispose();
        this.activePlayers.delete("game_loop");
      }
      // Get the buffer
      const buffer = this.bufferManager.getBuffer("game_loop");
      if (!buffer) {
        this.logger.warn("ToneMusicPlayer: Game loop music buffer is null");
        return null;
      }
      this.logger.info(
        `ToneMusicPlayer: Creating player with game loop buffer duration: ${buffer.duration}s`
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
        this.logger.info("ToneMusicPlayer: Game loop player loaded");
      });
      player.loop = loop;
      player.autostart = false;
      player.volume.value = -10; // initially set lower
      player.toDestination();

      // Store the player
      this.activePlayers.set("game_loop", player);

      // Start the player and perform a fade-in over fadeInTime seconds
      player.start();
      player.volume.rampTo(0, fadeInTime);

      this.logger.info("ToneMusicPlayer: Game loop music playing");
      return player;
    } catch (error) {
      this.logger.error(
        "ToneMusicPlayer: Error playing game loop music",
        error
      );
      return null;
    }
  }
}
