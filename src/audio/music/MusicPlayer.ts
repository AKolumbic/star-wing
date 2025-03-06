/**
 * Handles music playback and transitions
 */
import { Logger } from "../../utils/Logger";
import { AudioContextManager } from "../core/AudioContextManager";
import { BufferManager } from "../core/BufferManager";

/**
 * Interface for current audio source information
 */
export interface SourceInfo {
  source: AudioBufferSourceNode;
  startTime: number;
  buffer: AudioBuffer;
  id: string;
}

export class MusicPlayer {
  /** Context manager reference */
  private contextManager: AudioContextManager;

  /** Buffer manager reference */
  private bufferManager: BufferManager;

  /** Active music sources */
  private activeSources: Map<string, AudioBufferSourceNode> = new Map();

  /** Track start times for active sources */
  private sourceStartTimes: Map<string, number> = new Map();

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
   * Returns information about the currently playing audio source
   */
  public getCurrentSourceInfo(): SourceInfo | null {
    // Check if menu music is playing
    if (this.activeSources.has("menuMusic")) {
      const source = this.activeSources.get("menuMusic")!;
      const startTime = this.sourceStartTimes.get("menuMusic") || 0;
      const buffer = source.buffer;

      if (buffer) {
        return {
          source,
          startTime,
          buffer,
          id: "menuMusic",
        };
      }
    }

    // Check if game music is playing
    if (this.activeSources.has("gameMusic")) {
      const source = this.activeSources.get("gameMusic")!;
      const startTime = this.sourceStartTimes.get("gameMusic") || 0;
      const buffer = source.buffer;

      if (buffer) {
        return {
          source,
          startTime,
          buffer,
          id: "gameMusic",
        };
      }
    }

    return null;
  }

  /**
   * Checks if menu music is loaded
   */
  public isMenuMusicLoaded(): boolean {
    return this.bufferManager.hasBuffer("menuMusic");
  }

  /**
   * Checks if game music is loaded
   */
  public isGameMusicLoaded(): boolean {
    return this.bufferManager.hasBuffer("gameMusic");
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

      // Store the start time for tracking playback position
      const startTime = this.contextManager.getCurrentTime();
      this.sourceStartTimes.set("menuMusic", startTime);

      // Connect to audio graph and start
      source.connect(this.contextManager.getMainGainNode());
      source.start(0);

      // Store the source for later reference
      this.activeSources.set("menuMusic", source);

      this.logger.info("MusicPlayer: Menu music started");
    } catch (error) {
      this.logger.error("MusicPlayer: Error playing menu music:", error);
    }
  }

  /**
   * Plays the game music
   */
  public playGameMusic(): void {
    // Try to resume audio context if needed
    this.contextManager.tryResume().catch((err) => {
      this.logger.error("MusicPlayer: Error resuming audio context:", err);
    });

    // Check if the gameMusic buffer is already loaded
    if (!this.bufferManager.hasBuffer("gameMusic")) {
      this.logger.warn("MusicPlayer: Game music not loaded, cannot play yet");
      return;
    }

    // Stop any existing game music first
    if (this.activeSources.has("gameMusic")) {
      // Only stop the game music, not all music
      try {
        const source = this.activeSources.get("gameMusic");
        if (source) {
          source.stop();
          source.disconnect();
          this.activeSources.delete("gameMusic");
        }
      } catch (error) {
        // Ignore errors when stopping
      }
      setTimeout(() => this.playGameMusic(), 50); // Try again after cleanup
      return;
    }

    try {
      const buffer = this.bufferManager.getBuffer("gameMusic");
      if (!buffer) {
        this.logger.error("MusicPlayer: Game music buffer not found");
        return;
      }

      // Create and configure the source node
      const source = this.contextManager.createNode((ctx) =>
        ctx.createBufferSource()
      );
      source.buffer = buffer;
      source.loop = true;

      // Store the start time for tracking playback position
      const startTime = this.contextManager.getCurrentTime();
      this.sourceStartTimes.set("gameMusic", startTime);

      // Apply a gentle fade-in
      const gainNode = this.contextManager.createNode((ctx) =>
        ctx.createGain()
      );
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(
        this.contextManager.getMuteState() ? 0 : 1,
        startTime + 0.5
      );

      // Connect through the gain node
      source.connect(gainNode);
      gainNode.connect(this.contextManager.getMainGainNode());

      // Start playback
      source.start(0);

      // Store the source for later reference
      this.activeSources.set("gameMusic", source);

      this.logger.info("MusicPlayer: Game music started");
    } catch (error) {
      this.logger.error("MusicPlayer: Error playing game music:", error);
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
              this.sourceStartTimes.delete(id);
              this.logger.info(`MusicPlayer: ${id} stopped after fade-out`);
            } catch (error) {
              // Ignore errors when stopping
            }
          }, fadeOutTime * 1000 + 50);
        } else {
          // No gain nodes found, stop immediately
          source.stop();
          source.disconnect();
          this.activeSources.delete(id);
          this.sourceStartTimes.delete(id);
          this.logger.info(`MusicPlayer: ${id} stopped immediately`);
        }
      } catch (error) {
        this.logger.warn(`MusicPlayer: Error stopping ${id}:`, error);
        // Try to clean up anyway
        try {
          source.disconnect();
        } catch (e) {
          // Ignore additional errors
        }
        this.activeSources.delete(id);
        this.sourceStartTimes.delete(id);
      }
    });
  }

  /**
   * Cleans up all resources used by the music player.
   */
  public dispose(): void {
    this.logger.info("MusicPlayer: Disposing resources");

    // Stop all active sources
    this.stop(0);

    // Clear all collections
    this.activeSources.clear();
    this.sourceStartTimes.clear();
  }
}
