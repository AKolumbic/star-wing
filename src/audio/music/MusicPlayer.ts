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
   * Plays the menu music
   */
  public playMenuMusic(): void {
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
          this.playMenuMusic(); // Try again after preloading
        })
        .catch((err) => {
          this.logger.error("MusicPlayer: Error preloading menu music:", err);
        });
      return;
    }

    // Stop any existing menu music first
    if (this.activeSources.has("menuMusic")) {
      this.stop(0.1); // Short fade-out for transition
      setTimeout(() => this.playMenuMusic(), 150); // Try again after fade-out
      return;
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

      // Start with zero gain and ramp up quickly to avoid clicks
      const now = this.contextManager.getCurrentTime();
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(
        this.contextManager.getMuteState() ? 0 : 0.15,
        now + 0.1 // 100ms ramp
      );

      // Connect the nodes
      source.connect(gainNode);
      gainNode.connect(this.contextManager.getMainGainNode());

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
