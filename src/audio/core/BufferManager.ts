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
    const duration = buffer.duration;

    this.logger.info(
      `BufferManager: Analyzing loop points for ${length} samples (${duration.toFixed(
        2
      )}s)`
    );

    // Try to calculate optimal loop points
    try {
      // Create a silent padding at the beginning and end (10ms)
      const paddingDuration = 0.01; // 10ms
      const paddingSamples = Math.floor(paddingDuration * sampleRate);

      // Create a small fade-in and fade-out for smoother looping
      // Especially useful for music tracks that may have abrupt endings
      const fadeLength = Math.min(paddingSamples, length / 50); // Use at most 2% of the buffer length

      this.logger.info(
        `BufferManager: Loop point optimization - using ${paddingSamples} samples (${paddingDuration.toFixed(
          4
        )}s) padding`
      );
      this.logger.info(
        `BufferManager: Recommended loop points: start=${paddingDuration.toFixed(
          3
        )}s, end=${(duration - paddingDuration).toFixed(3)}s`
      );

      // Look for zero crossings in the last 100ms
      const zeroSearchWindow = Math.min(0.1 * sampleRate, length / 10);

      // Check first channel only for efficiency
      const channelData = buffer.getChannelData(0);

      let bestEndZeroCrossing = length - paddingSamples;
      let smallestEndValue = Math.abs(channelData[length - paddingSamples]);

      // Find the point closest to zero in the last section
      for (
        let i = length - paddingSamples - zeroSearchWindow;
        i < length - paddingSamples;
        i++
      ) {
        const value = Math.abs(channelData[i]);
        if (value < smallestEndValue) {
          smallestEndValue = value;
          bestEndZeroCrossing = i;
        }
      }

      const bestEndTime = bestEndZeroCrossing / sampleRate;

      this.logger.info(
        `BufferManager: Found optimal end loop point at ${bestEndTime.toFixed(
          3
        )}s (amplitude: ${smallestEndValue.toFixed(6)})`
      );
    } catch (error) {
      this.logger.warn(`BufferManager: Error analyzing loop points: ${error}`);
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
    const essentialAudio = ["menuMusic"];

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

  /**
   * Loads an audio buffer from a URL
   * @param url URL of the audio file
   * @param id Optional identifier for the buffer
   * @returns Promise that resolves with the decoding buffer
   */
  public loadAudioBuffer(url: string, id?: string): Promise<AudioBuffer> {
    // If we already have this buffer, return it
    if (id && this.audioBufferCache.has(id)) {
      return Promise.resolve(this.audioBufferCache.get(id)!);
    }

    this.logger.info(`BufferManager: Loading audio buffer from ${url}`);

    return new Promise<AudioBuffer>((resolve, reject) => {
      fetch(url)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error, status = ${response.status}`);
          }
          return response.arrayBuffer();
        })
        .then((arrayBuffer) => {
          const audioContext = this.contextManager.getContext();
          return audioContext.decodeAudioData(arrayBuffer);
        })
        .then((audioBuffer) => {
          // Store the buffer if an ID was provided
          if (id) {
            this.audioBufferCache.set(id, audioBuffer);
            this.logger.info(
              `BufferManager: Stored audio buffer with ID "${id}"`
            );
          }
          resolve(audioBuffer);
        })
        .catch((error) => {
          this.logger.error(
            `BufferManager: Error loading audio from ${url}:`,
            error
          );
          reject(error);
        });
    });
  }
}
