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
  /** Audio context manager */
  private contextManager: AudioContextManager;

  /** Buffer manager */
  private bufferManager: BufferManager;

  /** Map of active audio sources */
  private activeSources = new Map<string, AudioBufferSourceNode>();

  /** Map of source start times */
  private sourceStartTimes = new Map<string, number>();

  /** Map of gain nodes for each source */
  private gainNodes = new Map<string, GainNode>();

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
   * Creates a perfectly looping AudioBufferSourceNode
   * @param bufferId The buffer ID to use
   * @param sourceId The source ID to use for tracking in activeSources
   * @param fadeIn Should we fade in?
   * @returns true if successful, false if failed
   */
  private createLoopingMusicSource(
    bufferId: string,
    sourceId: string,
    fadeIn = false
  ): boolean {
    this.logger.info(
      `AUDIO-DEBUG: createLoopingMusicSource - bufferId: ${bufferId}, sourceId: ${sourceId}, fadeIn: ${fadeIn}`
    );

    try {
      // Try to resume the audio context first
      const contextState = this.contextManager.getContext().state;
      this.logger.info(
        `AUDIO-DEBUG: Audio context state before resume: ${contextState}`
      );

      if (contextState !== "running") {
        this.logger.info(
          "AUDIO-DEBUG: Audio context not running, attempting to resume..."
        );
        // Try to resume synchronously first
        this.contextManager.getContext().resume();
      }

      const buffer = this.bufferManager.getBuffer(bufferId);
      if (!buffer) {
        this.logger.error(`AUDIO-DEBUG: Buffer "${bufferId}" not found`);
        return false;
      }

      this.logger.info(
        `AUDIO-DEBUG: Buffer found for "${bufferId}", duration: ${buffer.duration.toFixed(
          2
        )}s`
      );

      // Create a new source
      const source = this.contextManager.getContext().createBufferSource();
      source.buffer = buffer;

      // Get the main gain node
      const mainGainNode = this.contextManager.getMainGainNode();
      if (!mainGainNode) {
        this.logger.error(
          "AUDIO-DEBUG: Main gain node is null from context manager"
        );
        return false;
      }

      this.logger.info(
        `AUDIO-DEBUG: Main gain node value: ${mainGainNode.gain.value}`
      );

      // Create a gain node for this source
      const gainNode = this.contextManager.getContext().createGain();
      gainNode.gain.value = fadeIn ? 0 : 1;

      // Set loop points (skip first and last 10ms to avoid clicks)
      const loopStartTime = 0.01; // 10ms from start
      const loopEndTime = buffer.duration - 0.01; // 10ms from end

      source.loop = true;
      source.loopStart = loopStartTime;
      source.loopEnd = loopEndTime;

      this.logger.info(
        `AUDIO-DEBUG: Setting loop points - start: ${loopStartTime.toFixed(
          3
        )}s, end: ${loopEndTime.toFixed(3)}s`
      );

      // Connect nodes
      try {
        source.connect(gainNode);
        this.logger.info("AUDIO-DEBUG: Connected source to gain node");
      } catch (e) {
        this.logger.error(
          "AUDIO-DEBUG: Error connecting source to gain node:",
          e
        );
        return false;
      }

      try {
        gainNode.connect(mainGainNode);
        this.logger.info("AUDIO-DEBUG: Connected gain node to main gain node");
      } catch (e) {
        this.logger.error(
          "AUDIO-DEBUG: Error connecting gain node to main gain node:",
          e
        );
        return false;
      }

      // Check if main gain node is connected to destination
      try {
        // Verify the main gain node is connected to the destination
        const destination = this.contextManager.getContext().destination;

        // Force reconnection to ensure it's connected
        mainGainNode.disconnect();
        mainGainNode.connect(destination);
        this.logger.info(
          "AUDIO-DEBUG: Reconnected main gain node to destination"
        );
      } catch (e) {
        this.logger.error(
          "AUDIO-DEBUG: Error with main gain node connection:",
          e
        );
      }

      // Start playback
      source.start();
      this.logger.info(`AUDIO-DEBUG: Source started playing for "${sourceId}"`);

      // Fade in if needed
      if (fadeIn) {
        const now = this.contextManager.getContext().currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(1, now + 1.0);
        this.logger.info("AUDIO-DEBUG: Fade-in applied over 1 second");
      }

      // Store in active sources
      this.activeSources.set(sourceId, source);
      this.gainNodes.set(sourceId, gainNode);

      // Check context state after everything
      this.logger.info(
        `AUDIO-DEBUG: Audio context state after setup: ${
          this.contextManager.getContext().state
        }`
      );

      return true;
    } catch (error) {
      this.logger.error(
        `AUDIO-DEBUG: Error in createLoopingMusicSource:`,
        error
      );
      return false;
    }
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

    // Create a perfectly looping source
    this.createLoopingMusicSource("menuMusic", "menuMusic");
  }

  /**
   * Plays the game music
   */
  public playGameMusic(): void {
    // Log diagnostic information
    this.logger.info("AUDIO-DEBUG: playGameMusic called");

    // Try to resume audio context if needed
    this.contextManager
      .tryResume()
      .then((resumed) => {
        this.logger.info(
          `AUDIO-DEBUG: Audio context resume attempt: ${
            resumed ? "successful" : "failed"
          }`
        );
        this.logger.info(
          `AUDIO-DEBUG: Audio context state: ${
            this.contextManager.getContext().state
          }`
        );
      })
      .catch((err) => {
        this.logger.error("MusicPlayer: Error resuming audio context:", err);
      });

    // Check if the gameMusic buffer is already loaded
    const hasGameMusic = this.bufferManager.hasBuffer("gameMusic");
    this.logger.info(`AUDIO-DEBUG: Game music buffer loaded: ${hasGameMusic}`);

    if (!hasGameMusic) {
      this.logger.warn("MusicPlayer: Game music not loaded, cannot play yet");
      return;
    }

    // Stop any existing game music first
    if (this.activeSources.has("gameMusic")) {
      this.logger.info("AUDIO-DEBUG: Stopping existing game music source");
      // Only stop the game music, not all music
      try {
        const source = this.activeSources.get("gameMusic");
        if (source) {
          source.stop();
          source.disconnect();
          this.activeSources.delete("gameMusic");
          this.logger.info(
            "AUDIO-DEBUG: Successfully stopped and disconnected existing game music source"
          );
        }
      } catch (error) {
        // Ignore errors when stopping
        this.logger.error(
          "AUDIO-DEBUG: Error stopping existing game music:",
          error
        );
      }
      setTimeout(() => {
        this.logger.info(
          "AUDIO-DEBUG: Retrying game music playback after cleanup"
        );
        this.playGameMusic();
      }, 50); // Try again after cleanup
      return;
    }

    // Create a perfectly looping source with fade-in
    const success = this.createLoopingMusicSource(
      "gameMusic",
      "gameMusic",
      true
    );
    this.logger.info(
      `AUDIO-DEBUG: createLoopingMusicSource result: ${
        success ? "success" : "failure"
      }`
    );
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
