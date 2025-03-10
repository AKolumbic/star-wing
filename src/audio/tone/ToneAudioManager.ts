/**
 * ToneAudioManager is responsible for all sound generation and audio playback in the game.
 * It's a Tone.js implementation of the AudioManager facade for better code organization.
 * This class will eventually replace the original AudioManager while maintaining the same API.
 */
import { Logger } from "../../utils/Logger";
import { ToneContextManager } from "./ToneContextManager";
import { ToneBufferManager } from "./ToneBufferManager";
import { ToneMusicPlayer } from "./ToneMusicPlayer";
import { ToneSoundEffectPlayer } from "./ToneSoundEffectPlayer";
import { ToneProceduralGenerator } from "./ToneProceduralGenerator";
import * as Tone from "tone";

export class ToneAudioManager {
  // Core audio infrastructure
  private contextManager: ToneContextManager;
  private bufferManager: ToneBufferManager;

  // Specialized players
  private musicPlayer: ToneMusicPlayer;
  private sfxPlayer: ToneSoundEffectPlayer;
  private proceduralMusic: ToneProceduralGenerator;

  // State tracking
  private isInitialized: boolean = false;
  private isPlaying: boolean = false;

  // Layered music state tracking
  private layeredMusicActive: boolean = false;

  // Logging
  private logger = Logger.getInstance();

  // Singleton instance - Important to maintain the same API as the original
  private static instance: ToneAudioManager;

  constructor() {
    this.logger.info(
      "ToneAudioManager: Constructing audio manager with Tone.js"
    );

    // Create the core audio infrastructure first
    this.contextManager = new ToneContextManager();
    this.bufferManager = new ToneBufferManager(this.contextManager);

    // Create specialized players
    this.musicPlayer = new ToneMusicPlayer(
      this.contextManager,
      this.bufferManager
    );
    this.sfxPlayer = new ToneSoundEffectPlayer(
      this.contextManager,
      this.bufferManager
    );
    this.proceduralMusic = new ToneProceduralGenerator(this.contextManager);
  }

  /**
   * Gets the singleton instance of the audio manager
   */
  public static getInstance(): ToneAudioManager {
    if (!ToneAudioManager.instance) {
      ToneAudioManager.instance = new ToneAudioManager();
    }
    return ToneAudioManager.instance;
  }

  /**
   * Initializes the audio system
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.info("ToneAudioManager: Already initialized");
      return;
    }

    this.logger.info("ToneAudioManager: Initializing");

    try {
      // Initialize the Tone.js context
      await this.contextManager.initialize();

      // Preload essential audio
      await this.bufferManager.preloadEssentials();

      this.isInitialized = true;
      this.logger.info("ToneAudioManager: Initialization complete");
    } catch (error) {
      this.logger.error("ToneAudioManager: Initialization failed", error);
    }
  }

  /**
   * Sets the master volume (0-1 range)
   */
  public setVolume(volume: number): void {
    this.contextManager.setVolume(volume);
  }

  /**
   * Gets the current volume (0-1 range)
   */
  public getVolume(): number {
    return this.contextManager.getVolume();
  }

  /**
   * Gets the current mute state
   */
  public getMuteState(): boolean {
    return this.contextManager.getMuteState();
  }

  /**
   * Toggles mute state
   */
  public toggleMute(): void {
    this.contextManager.toggleMute();
  }

  /**
   * Plays a test tone to verify audio is working
   */
  public playTestTone(): void {
    this.sfxPlayer.playTestTone();
  }

  /**
   * Loads an audio sample
   */
  public async loadAudioSample(
    url: string,
    id: string,
    isEssential: boolean = false
  ): Promise<void> {
    await this.bufferManager.loadAudioSample(url, id, isEssential);
  }

  /**
   * Plays an audio sample
   */
  public playAudioSample(
    id: string,
    volume: number = 0.5,
    loop: boolean = false
  ): Tone.Player | null {
    return this.sfxPlayer.playAudioSample(id, volume, loop);
  }

  /**
   * Plays menu/title screen music
   * If procedural is true, generates music instead of loading a file
   */
  public playMenuMusic(procedural: boolean = false): void {
    this.logger.info(
      `ToneAudioManager: Playing menu music (procedural: ${procedural})`
    );

    if (procedural) {
      // Use procedural generator
      this.proceduralMusic.startMenuMusic();
    } else {
      // Check if we have the menu music buffer
      if (this.bufferManager.hasBuffer("menu_music")) {
        this.musicPlayer.playMenuMusic();
      } else {
        // Fall back to procedural if buffer not available
        this.logger.info(
          "ToneAudioManager: Menu music not found, using procedural"
        );
        this.proceduralMusic.startMenuMusic();
      }
    }

    this.isPlaying = true;
  }

  /**
   * Stops menu music playback
   */
  public stopMenuMusic(): void {
    this.logger.info("ToneAudioManager: Stopping menu music");

    // Stop both regular and procedural music
    this.musicPlayer.stopMenuMusic();
    this.proceduralMusic.stopMusic();

    this.isPlaying = false;
  }

  /**
   * Plays a laser sound with the given type
   */
  public playLaserSound(type: string = "standard"): void {
    this.sfxPlayer.playLaserSound(type);
  }

  /**
   * Plays a collision/explosion sound with the given size
   */
  public playCollisionSound(size: string = "medium"): void {
    this.sfxPlayer.playCollisionSound(size);
  }

  /**
   * Starts layered music with the given base track
   */
  public startLayeredMusic(baseTrackId: string): void {
    this.logger.info(
      `ToneAudioManager: Starting layered music with ${baseTrackId}`
    );

    // Stop any other music first
    this.stopMenuMusic();

    // Start layered music
    this.musicPlayer.startLayeredMusic(baseTrackId);
    this.layeredMusicActive = true;
  }

  /**
   * Adds a music layer to the layered music
   */
  public addMusicLayer(id: string, volume: number = 0.7): void {
    if (!this.layeredMusicActive) {
      this.logger.warn(
        "ToneAudioManager: Cannot add layer, layered music not active"
      );
      return;
    }

    this.musicPlayer.addMusicLayer(id, volume);
  }

  /**
   * Sets the volume of a specific music layer
   */
  public setLayerVolume(id: string, volume: number): void {
    if (!this.layeredMusicActive) {
      return;
    }

    this.musicPlayer.setLayerVolume(id, volume);
  }

  /**
   * Removes a music layer
   */
  public removeMusicLayer(id: string): void {
    if (!this.layeredMusicActive) {
      return;
    }

    this.musicPlayer.removeMusicLayer(id);
  }

  /**
   * Stops all layered music
   */
  public stopLayeredMusic(): void {
    if (!this.layeredMusicActive) {
      return;
    }

    this.musicPlayer.stopLayeredMusic();
    this.layeredMusicActive = false;
  }

  /**
   * Preloads essential audio files
   */
  public async preloadEssentialAudio(): Promise<void> {
    await this.bufferManager.preloadEssentials();
  }

  /**
   * Cleans up unused audio buffers to free memory
   */
  public cleanupUnusedAudio(preserveEssential: boolean = true): void {
    this.bufferManager.cleanupUnused(preserveEssential);
  }

  /**
   * Disposes of all audio resources
   */
  public dispose(): void {
    this.logger.info("ToneAudioManager: Disposing resources");

    // Dispose all components
    this.proceduralMusic.dispose();
    this.musicPlayer.dispose();
    this.sfxPlayer.dispose();
    this.bufferManager.dispose();

    // Reset state
    this.isInitialized = false;
    this.isPlaying = false;
    this.layeredMusicActive = false;

    // Clear singleton instance
    ToneAudioManager.instance = undefined as any;
  }
}
