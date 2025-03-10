/**
 * ToneBufferManager - Manages audio buffer loading and caching with Tone.js
 * This is a direct replacement for the Web Audio API's BufferManager
 */
import { Logger } from "../../utils/Logger";
import * as Tone from "tone";
import { ToneContextManager } from "./ToneContextManager";

export class ToneBufferManager {
  /** Context manager reference */
  private contextManager: ToneContextManager;

  /** Audio buffer cache using Tone.js ToneAudioBuffers */
  private bufferCache: Tone.ToneAudioBuffers;

  /** Track essential buffers that shouldn't be removed during cleanup */
  private essentialBuffers: Set<string> = new Set();

  /** Logger instance */
  private logger = Logger.getInstance();

  constructor(contextManager: ToneContextManager) {
    this.contextManager = contextManager;
    this.bufferCache = new Tone.ToneAudioBuffers();
    this.logger.info("ToneBufferManager: Initialized");
  }

  /**
   * Gets a cached audio buffer or returns null if not found
   */
  public getBuffer(id: string): Tone.ToneAudioBuffer | null {
    if (!this.hasBuffer(id)) {
      this.logger.warn(`ToneBufferManager: Buffer ${id} not found in cache`);
      return null;
    }
    return this.bufferCache.get(id) || null;
  }

  /**
   * Checks if a buffer exists in the cache
   */
  public hasBuffer(id: string): boolean {
    return this.bufferCache.has(id);
  }

  /**
   * Gets all buffer ids in the cache
   */
  public getBufferIds(): string[] {
    // Use type assertion to access internal properties safely
    return Object.keys((this.bufferCache as any)._buffers || {});
  }

  /**
   * Adds a buffer to the cache
   */
  public storeBuffer(id: string, buffer: Tone.ToneAudioBuffer): void {
    if (buffer) {
      // Need to manually add since we're not using the built-in loading
      (this.bufferCache as any)._buffers[id] = buffer;
      this.logger.info(
        `ToneBufferManager: Stored buffer ${id} (${buffer.duration.toFixed(
          2
        )}s)`
      );
    }
  }

  /**
   * Loads an audio sample from a URL and caches it
   */
  public async loadAudioSample(
    url: string,
    id: string,
    isEssential: boolean = false
  ): Promise<void> {
    try {
      this.logger.info(
        `ToneBufferManager: Loading audio sample ${id} from ${url}`
      );

      // Use ToneAudioBuffer to load the file
      const buffer = new Tone.ToneAudioBuffer(
        url,
        () => {
          this.logger.info(
            `ToneBufferManager: Loaded buffer ${id} (${buffer.duration.toFixed(
              2
            )}s)`
          );

          // Add to buffer cache
          this.storeBuffer(id, buffer);

          if (isEssential) {
            this.essentialBuffers.add(id);
          }
        },
        (error) => {
          this.logger.error(
            `ToneBufferManager: Failed to load buffer ${id}`,
            error
          );
        }
      );
    } catch (error) {
      this.logger.error(
        `ToneBufferManager: Error loading audio sample ${id}`,
        error
      );
    }
  }

  /**
   * Preloads essential audio assets
   */
  public async preloadEssentials(): Promise<void> {
    this.logger.info("ToneBufferManager: Preloading essential audio");

    // Define essential sounds - Update with your actual essential sounds
    const essentials = [
      { url: "audio/laser.mp3", id: "laser", essential: true },
      { url: "audio/explosion.mp3", id: "explosion", essential: true },
      { url: "audio/menu_select.mp3", id: "menu_select", essential: true },
    ];

    // Load all essential sounds
    const loadPromises = essentials.map((sound) =>
      this.loadAudioSample(sound.url, sound.id, sound.essential)
    );

    try {
      await Promise.all(loadPromises);
      this.logger.info(
        "ToneBufferManager: Essential audio preloaded successfully"
      );
    } catch (error) {
      this.logger.error(
        "ToneBufferManager: Failed to preload essential audio",
        error
      );
    }
  }

  /**
   * Cleans up unused audio buffers
   */
  public cleanupUnused(preserveEssential: boolean = true): void {
    this.logger.info("ToneBufferManager: Cleaning up unused audio buffers");

    const idsToRemove: string[] = [];

    // Identify buffers to remove
    this.getBufferIds().forEach((id) => {
      if (preserveEssential && this.essentialBuffers.has(id)) {
        this.logger.info(
          `ToneBufferManager: Preserving essential buffer ${id}`
        );
        return;
      }
      idsToRemove.push(id);
    });

    // Remove identified buffers
    idsToRemove.forEach((id) => {
      if (this.hasBuffer(id)) {
        const buffer = this.getBuffer(id);
        if (buffer) {
          buffer.dispose();
          delete (this.bufferCache as any)._buffers[id];
          this.logger.info(`ToneBufferManager: Removed buffer ${id}`);
        }
      }
    });

    this.logger.info(
      `ToneBufferManager: Removed ${idsToRemove.length} unused buffers`
    );
  }

  /**
   * Disposes of all resources
   */
  public dispose(): void {
    this.logger.info("ToneBufferManager: Disposing resources");
    this.bufferCache.dispose();
  }
}
