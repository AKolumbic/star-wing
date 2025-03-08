/**
 * Manages audio buffer loading and caching
 */
import { Logger } from "../../utils/Logger";
import { AudioContextManager } from "./AudioContextManager";

export class BufferManager {
  /** Context manager reference */
  private contextManager: AudioContextManager;

  /** Audio buffer cache to prevent recreating common sounds */
  private audioBufferCache: Map<string, AudioBuffer> = new Map();

  /** Logger instance */
  private logger = Logger.getInstance();

  constructor(contextManager: AudioContextManager) {
    this.contextManager = contextManager;
    this.logger.info("BufferManager: Initialized");
  }

  /**
   * Gets a cached audio buffer or returns null if not found
   */
  public getBuffer(id: string): AudioBuffer | null {
    return this.audioBufferCache.get(id) || null;
  }

  /**
   * Checks if a buffer exists in the cache
   */
  public hasBuffer(id: string): boolean {
    return this.audioBufferCache.has(id);
  }

  /**
   * Gets all buffer ids in the cache
   */
  public getBufferIds(): string[] {
    return Array.from(this.audioBufferCache.keys());
  }

  /**
   * Stores a buffer in the cache
   */
  public storeBuffer(id: string, buffer: AudioBuffer): void {
    this.audioBufferCache.set(id, buffer);
    this.logger.info(
      `BufferManager: Stored buffer ${id} (${buffer.duration.toFixed(2)}s)`
    );
  }

  /**
   * Analyzes an audio buffer to find optimal loop points.
   * This doesn't modify the buffer but logs information about potential loop points.
   */
  private analyzeLoopPoints(buffer: AudioBuffer): void {
    const sampleRate = buffer.sampleRate;
    const length = buffer.length;

    // Analysis window sizes in seconds
    const startWindow = 0.05; // 50ms
    const endWindow = 0.05; // 50ms

    // Convert to samples
    const startSamples = Math.floor(startWindow * sampleRate);
    const endSamples = Math.floor(endWindow * sampleRate);

    this.logger.info(
      `BufferManager: Analyzing loop points for ${length} samples (${(
        length / sampleRate
      ).toFixed(2)}s)`
    );

    let bestCorrelation = -1;
    let bestOffset = 0;

    // Analyze only first channel for efficiency
    const channelData = buffer.getChannelData(0);

    // Analyze correlation between beginning and end of the buffer
    for (let offset = 0; offset < endSamples; offset++) {
      let correlation = 0;
      let maxCorrelation = 0;

      // Calculate correlation between end and beginning with current offset
      for (let i = 0; i < startSamples; i++) {
        if (length - endSamples + offset + i < length && i < length) {
          const endSample = channelData[length - endSamples + offset + i];
          const startSample = channelData[i];
          correlation += Math.abs(endSample - startSample);
          maxCorrelation += 1.0;
        }
      }

      // Normalize correlation
      correlation = 1.0 - correlation / maxCorrelation;

      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestOffset = offset;
      }
    }

    const timeOffset = bestOffset / sampleRate;
    this.logger.info(
      `BufferManager: Best loop point correlation: ${bestCorrelation.toFixed(
        4
      )} at offset ${bestOffset} samples (${(timeOffset * 1000).toFixed(2)}ms)`
    );

    // Check for loud transients near the loop point
    let maxAmplitude = 0;
    for (let i = length - endSamples; i < length; i++) {
      maxAmplitude = Math.max(maxAmplitude, Math.abs(channelData[i]));
    }
    for (let i = 0; i < startSamples; i++) {
      maxAmplitude = Math.max(maxAmplitude, Math.abs(channelData[i]));
    }

    this.logger.info(
      `BufferManager: Maximum amplitude near loop points: ${maxAmplitude.toFixed(
        4
      )}`
    );

    if (maxAmplitude > 0.8) {
      this.logger.warn(
        "BufferManager: High amplitude detected near loop points. This may cause audible clicks."
      );
    } else {
      this.logger.info(
        "BufferManager: Loop point amplitudes look good for clean looping."
      );
    }
  }

  /**
   * Loads an audio sample from the specified URL and caches it for future use.
   */
  public async loadAudioSample(
    url: string,
    id: string,
    optimizeForLooping: boolean = false
  ): Promise<void> {
    try {
      this.logger.info(
        `BufferManager: Attempting to load audio sample from ${url}`
      );

      // Log the full URL for debugging
      const fullUrl = new URL(url, window.location.origin).href;
      this.logger.info(`BufferManager: Full URL: ${fullUrl}`);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch audio file: ${response.status} ${response.statusText}`
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioContext = this.contextManager.getContext();
      let audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // For menu music, apply gentle loop-point optimization
      if (optimizeForLooping && id === "menuMusic") {
        this.logger.info(
          `BufferManager: Applying loop-point detection for: ${id}`
        );
        this.analyzeLoopPoints(audioBuffer);
      }

      // Store the audio buffer
      this.storeBuffer(id, audioBuffer);
    } catch (error) {
      this.logger.error(
        `BufferManager: Error loading audio sample ${id} from ${url}:`,
        error
      );
      throw error; // Re-throw to allow callers to handle the error
    }
  }

  /**
   * Preloads all essential audio assets for better performance.
   * This should be called during game initialization.
   */
  public async preloadEssentials(): Promise<void> {
    this.logger.info("BufferManager: Preloading essential audio...");

    try {
      // Menu music is the most critical audio to preload
      const menuMusicFile = "assets/audio/star-wing_menu-loop.mp3";
      const menuMusicId = "menuMusic";

      // Only load if not already in cache
      if (!this.hasBuffer(menuMusicId)) {
        await this.loadAudioSample(menuMusicFile, menuMusicId, true);
      }

      // Game music is also essential
      const gameMusicFile = "assets/audio/star-wing_game-loop.mp3";
      const gameMusicId = "gameMusic";

      // Only load if not already in cache
      if (!this.hasBuffer(gameMusicId)) {
        await this.loadAudioSample(gameMusicFile, gameMusicId, true);
      }

      // You can add more essential sounds here if needed

      this.logger.info("BufferManager: Essential audio preloading complete");
    } catch (error) {
      this.logger.error(
        "BufferManager: Error preloading essential audio:",
        error
      );
      throw error;
    }
  }

  /**
   * Cleans up unused audio buffers to free memory.
   * @param preserveEssential Whether to preserve essential audio buffers
   */
  public cleanupUnused(preserveEssential: boolean = true): void {
    // List of essential audio IDs that should be preserved
    const essentialAudio = ["menuMusic", "gameMusic"];

    // Get all buffer IDs
    const bufferIds = this.getBufferIds();

    // Count of removed buffers
    let removedCount = 0;

    // Identify buffers to remove
    for (const id of bufferIds) {
      // Skip essential audio if preserveEssential is true
      if (preserveEssential && essentialAudio.includes(id)) {
        continue;
      }

      this.audioBufferCache.delete(id);
      removedCount++;
      this.logger.info(`BufferManager: Removed unused audio buffer: ${id}`);
    }

    // Force garbage collection with memory status info
    const memoryInfo = (performance as any).memory;
    if (memoryInfo) {
      this.logger.info(
        `BufferManager: Memory usage: ${(
          memoryInfo.usedJSHeapSize / 1048576
        ).toFixed(2)}MB / ${(memoryInfo.jsHeapSizeLimit / 1048576).toFixed(
          2
        )}MB, removed ${removedCount} buffers`
      );
    }
  }

  /**
   * Disposes of the buffer manager and clears all cached buffers
   */
  public dispose(): void {
    this.audioBufferCache.clear();
    this.logger.info("BufferManager: Disposed all audio buffers");
  }
}
