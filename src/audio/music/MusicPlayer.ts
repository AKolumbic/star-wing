/**
 * Handles music playback and transitions
 */
import { Logger } from "../../utils/Logger";
import { AudioContextManager } from "../core/AudioContextManager";
import { BufferManager } from "../core/BufferManager";

/**
 * Interface for an active music layer
 */
interface MusicLayer {
  id: string;
  source: AudioBufferSourceNode;
  gainNode: GainNode;
  volume: number;
  startTime: number;
}

export class MusicPlayer {
  /** Context manager reference */
  private contextManager: AudioContextManager;

  /** Buffer manager reference */
  private bufferManager: BufferManager;

  /** Active music sources */
  private activeSources: Map<string, AudioBufferSourceNode> = new Map();

  /** Active music layers for layered playback */
  private activeLayers: Map<string, MusicLayer> = new Map();

  /** Start time for synchronized layers */
  private layeredMusicStartTime: number = 0;

  /** Logger instance */
  private logger = Logger.getInstance();

  constructor(
    contextManager: AudioContextManager,
    bufferManager: BufferManager
  ) {
    this.contextManager = contextManager;
    this.bufferManager = bufferManager;
    this.logger.info("MusicPlayer: Initialized");
  }

  /**
   * Gets all connected gain nodes for a source
   */
  private findConnectedGainNodes(source: AudioNode): GainNode[] {
    // This is a simplified approach since Web Audio API doesn't provide
    // a way to traverse the audio graph. We know our typical connection pattern.
    const gainNodes: GainNode[] = [];

    try {
      // Add the main gain node as a fallback
      gainNodes.push(this.contextManager.getMainGainNode());
    } catch (error) {
      this.logger.warn(
        "MusicPlayer: Error finding connected gain nodes:",
        error
      );
    }

    return gainNodes;
  }

  /**
   * Checks if menu music is loaded
   */
  public isMenuMusicLoaded(): boolean {
    return this.bufferManager.hasBuffer("menuMusic");
  }

  /**
   * Checks if a specific music track is loaded
   */
  public isMusicLoaded(id: string): boolean {
    return this.bufferManager.hasBuffer(id);
  }

  /**
   * Plays the menu music loop
   * @param forceRestart If true, will force restart even if already playing
   */
  public playMenuMusic(forceRestart: boolean = false): void {
    // Try to resume audio context if needed
    this.contextManager.tryResume().catch((err) => {
      this.logger.error("MusicPlayer: Error resuming audio context:", err);
    });

    // Check if the menuMusic buffer is already loaded
    if (!this.bufferManager.hasBuffer("menuMusic")) {
      this.logger.warn("MusicPlayer: Menu music not loaded, preloading now");
      this.bufferManager
        .preloadEssentials()
        .then(() => {
          this.playMenuMusic(forceRestart); // Try again after preloading
        })
        .catch((err) => {
          this.logger.error("MusicPlayer: Error preloading menu music:", err);
        });
      return;
    }

    // Stop any existing menu music first if it's playing, unless we're forcing a restart
    if (this.activeSources.has("menuMusic") && !forceRestart) {
      this.logger.info("MusicPlayer: Music already playing, stopping first");
      this.stop(0.1); // Short fade-out for transition
      setTimeout(() => this.playMenuMusic(true), 150); // Try again after fade-out with force flag
      return;
    }

    // If we're forcing a restart and there are active sources, stop them first
    if (forceRestart && this.activeSources.has("menuMusic")) {
      this.logger.info(
        "MusicPlayer: Force-restarting music, stopping existing sources first"
      );
      this.stop(0.05);
      // Clear out the map to ensure we don't think music is still playing
      this.activeSources.clear();
    }

    try {
      const buffer = this.bufferManager.getBuffer("menuMusic");
      if (!buffer) {
        this.logger.error("MusicPlayer: Menu music buffer not found");
        return;
      }

      // Create and configure the source node
      const source = this.contextManager.createNode((ctx) =>
        ctx.createBufferSource()
      );
      source.buffer = buffer;
      source.loop = true;

      // Configure a precise loopEnd point for better looping
      const bufferDuration = buffer.duration;
      const loopEndTime = bufferDuration - 0.005; // 5ms before end

      // Only set if we're not cutting off too much
      if (loopEndTime > bufferDuration * 0.98) {
        source.loopEnd = loopEndTime;
        this.logger.info(
          `MusicPlayer: Set loop end at ${loopEndTime.toFixed(
            4
          )}s (buffer: ${bufferDuration.toFixed(4)}s)`
        );
      }

      // Create a gain node for volume control with gentle ramping
      const gainNode = this.contextManager.createGainNode();

      // Get appropriate volume based on mute state and stored volume
      const isMuted = this.contextManager.getMuteState();
      const storedVolume = this.contextManager.getVolume();
      // Use a much higher base value to ensure it's audible
      const baseVolume = isMuted ? 0 : Math.max(0.5, storedVolume * 0.8);

      this.logger.info(
        `MusicPlayer: Setting initial gain to ${baseVolume} (muted=${isMuted}, storedVolume=${storedVolume})`
      );

      // Set the gain value directly first to ensure it's applied
      gainNode.gain.value = 0;

      // Then do the ramping for smooth transition
      const now = this.contextManager.getCurrentTime();
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(
        baseVolume,
        now + 0.1 // 100ms ramp
      );

      // Connect the nodes - ensure gain node is directly connected to destination
      source.connect(gainNode);

      // Force a disconnect/reconnect of the main gain node to ensure proper connection
      const mainGain = this.contextManager.getMainGainNode();
      try {
        // Try to disconnect (may throw if not connected)
        mainGain.disconnect();
      } catch (e) {
        // Ignore disconnect errors
      }

      // Set mainGain value directly to ensure it's applied
      if (!isMuted) {
        mainGain.gain.value = Math.max(0.4, storedVolume * 0.6);
        this.logger.info(
          `MusicPlayer: Force set main gain to ${mainGain.gain.value}`
        );
      }

      // Connect our source's gain node to the main gain node
      gainNode.connect(mainGain);

      // Connect main gain to destination
      mainGain.connect(this.contextManager.getContext().destination);
      this.logger.info("MusicPlayer: Established direct audio connection path");

      // Start playback
      source.start(0);

      // Store the source for later reference
      this.activeSources.set("menuMusic", source);

      // Set up cleanup when the sound stops
      source.onended = () => {
        this.activeSources.delete("menuMusic");
        this.logger.info("MusicPlayer: Menu music ended");
      };

      this.logger.info("MusicPlayer: Started menu music playback");
    } catch (error) {
      this.logger.error("MusicPlayer: Error playing menu music:", error);
    }
  }

  /**
   * Initializes layered music system with a base track
   * @param baseTrackId The ID of the already loaded base track to play
   * @param fadeInTime Optional fade-in time in seconds
   * @returns True if the base track was successfully started
   */
  public startLayeredMusic(
    baseTrackId: string,
    fadeInTime: number = 0.5
  ): boolean {
    this.logger.info(
      `MusicPlayer: Starting layered music with base track: ${baseTrackId}`
    );

    // Log initial audio state
    const isMuted = this.contextManager.getMuteState();
    const masterVolume = this.contextManager.getVolume();
    const audioContextState = this.contextManager.getContext().state;
    this.logger.info(
      `MusicPlayer: Initial audio state - master volume: ${masterVolume}, muted: ${isMuted}, context: ${audioContextState}`
    );

    // Use gentle cleanup for existing music to avoid abrupt transitions
    this.stopLayeredMusic(0.1);

    // Try to resume audio context if needed
    this.contextManager.tryResume().catch((err) => {
      this.logger.error("MusicPlayer: Error resuming audio context:", err);
      return false;
    });

    // Check if the base track is loaded
    if (!this.bufferManager.hasBuffer(baseTrackId)) {
      this.logger.error(`MusicPlayer: Base track ${baseTrackId} not loaded`);
      return false;
    }

    try {
      const buffer = this.bufferManager.getBuffer(baseTrackId);
      this.logger.debug(
        `MusicPlayer: Retrieved buffer for base track ${baseTrackId}: ${!!buffer}`
      );

      if (!buffer) {
        this.logger.error(
          `MusicPlayer: Base track buffer ${baseTrackId} not found`
        );
        return false;
      }

      // CRITICAL FIX: Check main gain node before proceeding
      const mainGain = this.contextManager.getMainGainNode();
      const mainGainValue = mainGain.gain.value;
      this.logger.info(
        `MusicPlayer: Main gain node value at start: ${mainGainValue}`
      );

      // Reset main gain if it's unexpectedly 0
      if (mainGainValue === 0 && !isMuted) {
        // Calculate a reasonable default volume
        const correctVolume = Math.max(0.09, masterVolume * 0.6);
        this.logger.warn(
          `MusicPlayer: Main gain was 0! Resetting to ${correctVolume}`
        );

        // Set the gain value
        mainGain.gain.setValueAtTime(
          correctVolume,
          this.contextManager.getCurrentTime()
        );

        // Ensure connection to destination
        try {
          mainGain.connect(this.contextManager.getContext().destination);
        } catch (e) {
          // Already connected, that's fine
        }
      }

      // Record the start time for synchronization
      this.layeredMusicStartTime = this.contextManager.getCurrentTime();
      this.logger.debug(
        `MusicPlayer: Set layeredMusicStartTime to ${this.layeredMusicStartTime}`
      );

      // Create source node
      const source = this.contextManager.createNode((ctx) =>
        ctx.createBufferSource()
      );
      source.buffer = buffer;
      source.loop = true;

      // Configure loop points
      const bufferDuration = buffer.duration;
      const loopEndTime = bufferDuration - 0.005; // 5ms before end

      if (loopEndTime > bufferDuration * 0.98) {
        source.loopEnd = loopEndTime;
        this.logger.info(
          `MusicPlayer: Set loop end for ${baseTrackId} at ${loopEndTime.toFixed(
            4
          )}s`
        );
      }

      // Create gain node
      const gainNode = this.contextManager.createGainNode();

      // Get volume based on mute state
      const storedVolume = this.contextManager.getVolume();
      const baseVolume = isMuted ? 0 : Math.max(0.5, storedVolume * 0.8);
      this.logger.info(
        `MusicPlayer: Calculated base track volume: ${baseVolume}`
      );
      this.logger.info(
        `MusicPlayer: Volume calculation - storedVolume: ${storedVolume}, multiplier: 0.8, minimum enforced: 0.5`
      );

      // Start with a small non-zero value for smoother fade-in
      const initialGain = 0.02;
      gainNode.gain.value = initialGain;

      // Fade in with a smoother curve
      const now = this.contextManager.getCurrentTime();

      // Use 3-stage fade for more musical transition:
      // 1. Quick attack (initial 10% of fade time)
      const attackTime = fadeInTime * 0.1;
      gainNode.gain.setValueAtTime(initialGain, now);
      gainNode.gain.linearRampToValueAtTime(baseVolume * 0.2, now + attackTime);

      // 2. Main fade in (next 70% of fade time)
      gainNode.gain.linearRampToValueAtTime(
        baseVolume * 0.9,
        now + fadeInTime * 0.8
      );

      // 3. Final polish (last 20% of fade time)
      gainNode.gain.linearRampToValueAtTime(baseVolume, now + fadeInTime);

      this.logger.debug(
        `MusicPlayer: Using enhanced 3-stage fade-in for base track over ${fadeInTime}s`
      );

      // Connect to audio graph - CRITICAL: Use the mainGain variable we verified earlier
      source.connect(gainNode);
      gainNode.connect(mainGain);
      this.logger.debug(
        `MusicPlayer: Connected audio nodes for base track ${baseTrackId}`
      );

      // Double-check connection to destination
      try {
        mainGain.connect(this.contextManager.getContext().destination);
      } catch (e) {
        // Already connected, that's fine
        this.logger.debug(
          "MusicPlayer: Main gain already connected to destination"
        );
      }

      // Start playback
      source.start(0);
      this.logger.debug(
        `MusicPlayer: Started playback of base track ${baseTrackId}`
      );

      // Store as a layer
      this.activeLayers.set(baseTrackId, {
        id: baseTrackId,
        source,
        gainNode,
        volume: baseVolume,
        startTime: this.layeredMusicStartTime,
      });

      this.logger.debug(
        `MusicPlayer: Stored base track as layer. Active layers: ${Array.from(
          this.activeLayers.keys()
        ).join(", ")}`
      );

      // Final verification - make sure main gain node is actually set
      setTimeout(() => {
        const finalMainGainValue = mainGain.gain.value;
        this.logger.info(
          `MusicPlayer: Main gain node value after setup: ${finalMainGainValue}`
        );

        if (finalMainGainValue === 0 && !isMuted) {
          this.logger.warn(
            "MusicPlayer: Main gain still 0 after setup! Applying emergency fix..."
          );
          mainGain.gain.setValueAtTime(
            0.09,
            this.contextManager.getCurrentTime()
          );
        }
      }, 100);

      this.logger.info(
        `MusicPlayer: Started layered music base track ${baseTrackId}`
      );
      this.logger.info(
        `MusicPlayer: Audio node connections - source ➔ layerGain (${gainNode.gain.value}) ➔ mainGain (${mainGain.gain.value}) ➔ destination`
      );

      return true;
    } catch (error) {
      this.logger.error(
        `MusicPlayer: Error starting layered music base track ${baseTrackId}:`,
        error
      );
      return false;
    }
  }

  /**
   * Adds a music layer on top of the currently playing layered music
   * @param layerId The ID of the already loaded track to add as a layer
   * @param volume Initial volume for this layer (0.0 to 1.0)
   * @param fadeInTime Time in seconds to fade in the layer
   * @returns True if the layer was successfully added
   */
  public addMusicLayer(
    layerId: string,
    volume: number = 0.5,
    fadeInTime: number = 1.0
  ): boolean {
    this.logger.debug(
      `MusicPlayer: addMusicLayer called for ${layerId} with volume ${volume}`
    );
    this.logger.debug(
      `MusicPlayer: Active layers count: ${this.activeLayers.size}`
    );

    // Log volume settings
    const isMuted = this.contextManager.getMuteState();
    const masterVolume = this.contextManager.getVolume();
    this.logger.info(
      `MusicPlayer: Volume settings when adding layer - master: ${masterVolume}, muted: ${isMuted}`
    );

    // Check if we have active layered music
    if (this.activeLayers.size === 0) {
      this.logger.error(
        "MusicPlayer: Can't add layer - no base track is playing"
      );
      return false;
    }

    // Check if this layer is already active
    if (this.activeLayers.has(layerId)) {
      this.logger.warn(`MusicPlayer: Layer ${layerId} is already active`);
      return this.setLayerVolume(layerId, volume, fadeInTime);
    }

    // Check if the layer track is loaded
    if (!this.bufferManager.hasBuffer(layerId)) {
      this.logger.error(`MusicPlayer: Layer track ${layerId} not loaded`);
      return false;
    }

    try {
      const buffer = this.bufferManager.getBuffer(layerId);
      this.logger.debug(
        `MusicPlayer: Retrieved buffer for ${layerId}: ${!!buffer}`
      );

      if (!buffer) {
        this.logger.error(
          `MusicPlayer: Layer track buffer ${layerId} not found`
        );
        return false;
      }

      // Verify that the buffer duration matches the base track
      // This is crucial for proper synchronization
      const firstLayerEntry = this.activeLayers.values().next();
      if (firstLayerEntry.done) {
        this.logger.error(
          "MusicPlayer: Unable to find first layer for duration comparison"
        );
        return false;
      }

      const firstLayer = firstLayerEntry.value;
      const firstBuffer = this.bufferManager.getBuffer(firstLayer.id);

      if (
        firstBuffer &&
        Math.abs(buffer.duration - firstBuffer.duration) > 0.1
      ) {
        this.logger.warn(
          `MusicPlayer: Layer ${layerId} duration (${buffer.duration.toFixed(
            2
          )}s) differs from base track (${firstBuffer.duration.toFixed(
            2
          )}s). This may cause sync issues.`
        );
      }

      // Create source node
      const source = this.contextManager.createNode((ctx) =>
        ctx.createBufferSource()
      );
      source.buffer = buffer;
      source.loop = true;

      // Configure loop points
      const bufferDuration = buffer.duration;
      const loopEndTime = bufferDuration - 0.005; // 5ms before end

      if (loopEndTime > bufferDuration * 0.98) {
        source.loopEnd = loopEndTime;
      }

      // Create gain node
      const gainNode = this.contextManager.createGainNode();

      // Get the main gain node and verify its state
      const mainGain = this.contextManager.getMainGainNode();

      // CRITICAL FIX: Store the current main gain value before proceeding
      const mainGainValue = mainGain.gain.value;
      this.logger.info(
        `MusicPlayer: Main gain node value before connecting: ${mainGainValue}`
      );

      // If main gain is unexpectedly 0, restore it to a reasonable value
      if (mainGainValue === 0 && !isMuted) {
        const storedVolume = this.contextManager.getVolume();
        const correctGainValue = Math.max(0.09, storedVolume * 0.6);

        this.logger.warn(
          `MusicPlayer: Main gain was unexpectedly 0! Restoring to ${correctGainValue}`
        );

        // Reset main gain to proper value
        mainGain.gain.setValueAtTime(
          correctGainValue,
          this.contextManager.getCurrentTime()
        );

        // Make sure it's connected to destination
        try {
          // This may throw if already connected
          mainGain.connect(this.contextManager.getContext().destination);
        } catch (e) {
          this.logger.debug(
            `MusicPlayer: Main gain already connected to destination`
          );
        }
      }

      // Apply the mute state
      const finalVolume = isMuted ? 0 : volume;
      this.logger.info(
        `MusicPlayer: Calculated final volume for layer ${layerId}: ${finalVolume} (from volume parameter: ${volume})`
      );

      // Set initial gain - start at a small non-zero value for smoother crossfade
      const initialGain = 0.02; // Small initial value instead of 0
      gainNode.gain.value = initialGain;

      // Calculate time since layered music started
      const now = this.contextManager.getCurrentTime();
      const elapsedTime = now - this.layeredMusicStartTime;

      this.logger.debug(
        `MusicPlayer: Current time: ${now}, layeredMusicStartTime: ${this.layeredMusicStartTime}`
      );
      this.logger.debug(
        `MusicPlayer: Elapsed time: ${elapsedTime}, buffer duration: ${bufferDuration}`
      );

      // Calculate current position in the loop
      const loopDuration = buffer.duration;
      const positionInLoop = elapsedTime % loopDuration;

      this.logger.debug(
        `MusicPlayer: Position in loop: ${positionInLoop.toFixed(2)}s`
      );

      // Use 3-stage fade for more musical transition:
      // 1. Quick attack (initial 10% of fade time)
      const attackTime = fadeInTime * 0.1;
      gainNode.gain.setValueAtTime(initialGain, now);
      gainNode.gain.linearRampToValueAtTime(
        finalVolume * 0.2,
        now + attackTime
      );

      // 2. Main fade in (next 70% of fade time)
      gainNode.gain.linearRampToValueAtTime(
        finalVolume * 0.9,
        now + fadeInTime * 0.8
      );

      // 3. Final polish (last 20% of fade time)
      gainNode.gain.linearRampToValueAtTime(finalVolume, now + fadeInTime);

      this.logger.debug(
        `MusicPlayer: Using enhanced 3-stage fade-in for layer over ${fadeInTime}s`
      );

      // Connect nodes
      source.connect(gainNode);

      // CRITICAL FIX: Make sure we don't reset main gain node's connections
      gainNode.connect(mainGain);
      this.logger.debug(
        `MusicPlayer: Connected source -> gainNode -> mainGain`
      );

      // Start playback at the correct position for sync
      source.start(0, positionInLoop);
      this.logger.debug(
        `MusicPlayer: Started source node for ${layerId} at position ${positionInLoop.toFixed(
          2
        )}s`
      );
      this.logger.debug(
        `MusicPlayer: Gain node initial value: ${gainNode.gain.value}`
      );
      this.logger.debug(
        `MusicPlayer: Will ramp to volume ${finalVolume} over ${fadeInTime}s`
      );

      // Store as a layer
      this.activeLayers.set(layerId, {
        id: layerId,
        source,
        gainNode,
        volume: finalVolume,
        startTime: now,
      });

      this.logger.debug(
        `MusicPlayer: Layer ${layerId} added. Active layers: ${Array.from(
          this.activeLayers.keys()
        ).join(", ")}`
      );

      // VERIFY FINAL STATE
      setTimeout(() => {
        const currentMainGain = mainGain.gain.value;
        this.logger.info(
          `MusicPlayer: Main gain value after layer addition: ${currentMainGain}`
        );
        if (currentMainGain === 0 && !isMuted) {
          this.logger.warn(
            `MusicPlayer: Main gain is still 0 after fixes! Trying one more correction...`
          );
          const storedVolume = this.contextManager.getVolume();
          mainGain.gain.setValueAtTime(
            Math.max(0.09, storedVolume * 0.6),
            this.contextManager.getCurrentTime()
          );
        }
      }, 100);

      this.logger.info(
        `MusicPlayer: Added music layer ${layerId} at position ${positionInLoop.toFixed(
          2
        )}s with volume ${finalVolume}`
      );
      return true;
    } catch (error) {
      this.logger.error(
        `MusicPlayer: Error adding music layer ${layerId}:`,
        error
      );
      return false;
    }
  }

  /**
   * Adjusts the volume of a specific music layer
   * @param layerId The ID of the layer to adjust
   * @param volume New volume level (0.0 to 1.0)
   * @param fadeTime Time in seconds to fade to the new volume
   * @returns True if the volume was successfully adjusted
   */
  public setLayerVolume(
    layerId: string,
    volume: number,
    fadeTime: number = 0.5
  ): boolean {
    const layer = this.activeLayers.get(layerId);
    if (!layer) {
      this.logger.warn(
        `MusicPlayer: Cannot set volume - layer ${layerId} not found`
      );
      return false;
    }

    try {
      // Apply the mute state
      const isMuted = this.contextManager.getMuteState();
      const finalVolume = isMuted ? 0 : Math.max(0, Math.min(1, volume));

      // Adjust volume with fade
      const now = this.contextManager.getCurrentTime();
      const currentVolume = layer.gainNode.gain.value;

      layer.gainNode.gain.setValueAtTime(currentVolume, now);
      layer.gainNode.gain.linearRampToValueAtTime(finalVolume, now + fadeTime);

      // Update stored volume
      layer.volume = finalVolume;

      this.logger.info(
        `MusicPlayer: Adjusted layer ${layerId} volume to ${finalVolume}`
      );
      return true;
    } catch (error) {
      this.logger.error(
        `MusicPlayer: Error setting layer volume for ${layerId}:`,
        error
      );
      return false;
    }
  }

  /**
   * Removes a music layer with a fade-out
   * @param layerId The ID of the layer to remove
   * @param fadeOutTime Time in seconds to fade out before removing
   * @returns True if the layer was found and removal was initiated
   */
  public removeMusicLayer(layerId: string, fadeOutTime: number = 1.0): boolean {
    const layer = this.activeLayers.get(layerId);
    if (!layer) {
      this.logger.warn(
        `MusicPlayer: Cannot remove - layer ${layerId} not found`
      );
      return false;
    }

    try {
      // Fade out
      const now = this.contextManager.getCurrentTime();
      const currentVolume = layer.gainNode.gain.value;

      layer.gainNode.gain.setValueAtTime(currentVolume, now);
      layer.gainNode.gain.linearRampToValueAtTime(0, now + fadeOutTime);

      // Schedule cleanup
      setTimeout(() => {
        try {
          if (layer.source) {
            layer.source.stop();
            layer.source.disconnect();
          }
          if (layer.gainNode) {
            layer.gainNode.disconnect();
          }
          this.activeLayers.delete(layerId);
          this.logger.info(
            `MusicPlayer: Removed layer ${layerId} after fade-out`
          );
        } catch (error) {
          // Ignore errors when stopping
          this.logger.warn(
            `MusicPlayer: Error during layer cleanup for ${layerId}:`,
            error
          );
        }
      }, fadeOutTime * 1000);

      this.logger.info(`MusicPlayer: Started fade-out for layer ${layerId}`);
      return true;
    } catch (error) {
      this.logger.error(
        `MusicPlayer: Error removing music layer ${layerId}:`,
        error
      );
      return false;
    }
  }

  /**
   * Stops all layered music with a smooth fade-out
   * @param fadeOutTime Time in seconds for the fade-out
   */
  public stopLayeredMusic(fadeOutTime: number = 0.5): void {
    if (this.activeLayers.size === 0) {
      return;
    }

    this.logger.info(
      `MusicPlayer: Stopping all layered music with ${fadeOutTime}s fade-out`
    );

    // Fade out and remove all layers
    for (const [layerId, layer] of this.activeLayers.entries()) {
      try {
        // Fade out
        const now = this.contextManager.getCurrentTime();
        const currentVolume = layer.gainNode.gain.value;

        layer.gainNode.gain.setValueAtTime(currentVolume, now);
        layer.gainNode.gain.linearRampToValueAtTime(0, now + fadeOutTime);

        // Schedule cleanup
        setTimeout(() => {
          try {
            if (layer.source) {
              layer.source.stop();
              layer.source.disconnect();
            }
            if (layer.gainNode) {
              layer.gainNode.disconnect();
            }
          } catch (error) {
            // Ignore errors when stopping
          }
        }, fadeOutTime * 1000);
      } catch (error) {
        this.logger.warn(
          `MusicPlayer: Error stopping layer ${layerId}:`,
          error
        );
      }
    }

    // Clear the layers map after the fade-out
    setTimeout(() => {
      this.activeLayers.clear();
      this.logger.info("MusicPlayer: All layered music stopped");
    }, fadeOutTime * 1000);
  }

  /**
   * Stops all music playback with a smooth fade-out
   */
  public stop(fadeOutTime: number = 0.1): void {
    // Add a smoother transition when stopping before starting layered music
    const isTransitioningToLayered = fadeOutTime <= 0.3; // Detection based on fade time

    if (isTransitioningToLayered) {
      this.logger.debug(
        "MusicPlayer: Using smoother transition for layered music"
      );
      fadeOutTime = Math.max(fadeOutTime, 0.2); // Ensure minimum fade out time
    }

    // Stop layered music if any is playing
    this.stopLayeredMusic(fadeOutTime);

    // Stop all active music sources with fade-out
    this.activeSources.forEach((source, id) => {
      try {
        // Find any connected gain nodes
        const gainNodes = this.findConnectedGainNodes(source);
        const now = this.contextManager.getCurrentTime();

        if (gainNodes.length > 0) {
          // Apply a quick fade-out to all gain nodes to avoid clicks
          for (const gainNode of gainNodes) {
            // Get the current gain value
            const currentGain = gainNode.gain.value;

            // Schedule an immediate ramp down to zero
            gainNode.gain.setValueAtTime(currentGain, now);
            gainNode.gain.linearRampToValueAtTime(0, now + fadeOutTime);
          }

          // Schedule the source to stop after the fade completes
          setTimeout(() => {
            try {
              source.stop();
              source.disconnect();
              this.activeSources.delete(id);
              this.logger.info(`MusicPlayer: ${id} stopped after fade-out`);
            } catch (error) {
              // Ignore errors when stopping
            }
          }, fadeOutTime * 1000);
        } else {
          // No gain nodes found, stop immediately
          source.stop();
          source.disconnect();
          this.activeSources.delete(id);
          this.logger.info(
            `MusicPlayer: ${id} stopped immediately (no gain nodes found)`
          );
        }
      } catch (error) {
        this.logger.warn(`MusicPlayer: Error stopping ${id}:`, error);

        // Fallback to immediate stop if error occurs
        try {
          source.stop();
          source.disconnect();
        } catch {
          // Ignore any errors during fallback stop
        }
        this.activeSources.delete(id);
      }
    });
  }

  /**
   * Cleans up all resources used by the music player
   */
  public dispose(): void {
    this.stop(0);
    this.stopLayeredMusic(0);
    this.activeSources.clear();
    this.activeLayers.clear();
  }
}
