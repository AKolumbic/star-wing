/**
 * Handles music playback and transitions
 */
import { Logger } from "../../utils/Logger";
import { AudioContextManager } from "../core/AudioContextManager";
import { BufferManager } from "../core/BufferManager";

export class MusicPlayer {
  /** Context manager reference */
  private contextManager: AudioContextManager;

  /** Buffer manager reference */
  private bufferManager: BufferManager;

  /** Active music sources */
  private activeSources: Map<string, AudioBufferSourceNode> = new Map();

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
   * Stops all music playback with a smooth fade-out
   */
  public stop(fadeOutTime: number = 0.1): void {
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
   * Disposes of the music player
   */
  public dispose(): void {
    this.stop(0);
    this.activeSources.clear();
  }
}
