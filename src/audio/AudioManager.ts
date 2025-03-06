/**
 * AudioManager is responsible for all sound generation and audio playback in the game.
 * It acts as a facade to more specialized audio modules for better code organization.
 */
import { Logger } from "../utils/Logger";
import { AudioContextManager } from "./core/AudioContextManager";
import { BufferManager } from "./core/BufferManager";
import { MusicPlayer } from "./music/MusicPlayer";
import { SoundEffectPlayer } from "./effects/SoundEffectPlayer";
import { ProceduralMusicGenerator } from "./music/ProceduralMusicGenerator";

export class AudioManager {
  // Core audio infrastructure
  private contextManager: AudioContextManager;
  private bufferManager: BufferManager;

  // Specialized players
  private musicPlayer: MusicPlayer;
  private sfxPlayer: SoundEffectPlayer;
  private proceduralMusic: ProceduralMusicGenerator;

  // State tracking
  private isInitialized: boolean = false;
  private isPlaying: boolean = false;

  // Logging
  private logger = Logger.getInstance();

  constructor() {
    this.logger.info(
      "AudioManager: Constructing audio manager with modular architecture"
    );

    // Create the core audio infrastructure first
    this.contextManager = new AudioContextManager();
    this.bufferManager = new BufferManager(this.contextManager);

    // Then create specialized players
    this.musicPlayer = new MusicPlayer(this.contextManager, this.bufferManager);
    this.sfxPlayer = new SoundEffectPlayer(
      this.contextManager,
      this.bufferManager
    );
    this.proceduralMusic = new ProceduralMusicGenerator(this.contextManager);
  }

  /**
   * Initializes the audio system.
   * This should be called once before any audio playback.
   */
  public initialize(): void {
    if (this.isInitialized) {
      this.logger.info("AudioManager: Already initialized");
      return;
    }

    this.contextManager.initialize();
    this.isInitialized = true;
    this.logger.info("AudioManager: Initialization complete");
  }

  /**
   * Plays a simple test tone to verify audio is working.
   */
  public playTestTone(): void {
    this.sfxPlayer.playTestTone();
  }

  /**
   * Starts playing the menu music.
   * @param useProceduralAudio Force using procedural audio instead of MP3 (for devMode)
   */
  public playMenuThump(useProceduralAudio: boolean = false): void {
    if (!this.isInitialized) {
      this.initialize();
    }

    if (this.isPlaying) {
      return;
    }

    this.isPlaying = true;

    if (useProceduralAudio) {
      this.proceduralMusic.startMenuMusic();
    } else {
      this.musicPlayer.playMenuMusic();
    }
  }

  /**
   * Stops all music playback.
   * @param fadeOutTime Optional fade-out time in seconds
   */
  public stopMusic(fadeOutTime: number = 0.1): void {
    this.isPlaying = false;
    this.musicPlayer.stop(fadeOutTime);
    this.proceduralMusic.stop();
  }

  /**
   * Gets the current mute state.
   */
  public getMuteState(): boolean {
    return this.contextManager.getMuteState();
  }

  /**
   * Sets the master volume.
   * @param volume Volume level from 0.0 to 1.0
   */
  public setVolume(volume: number): void {
    this.contextManager.setVolume(volume);
  }

  /**
   * Gets the current volume setting.
   */
  public getVolume(): number {
    return this.contextManager.getVolume();
  }

  /**
   * Toggles audio mute state.
   */
  public toggleMute(): void {
    this.contextManager.toggleMute();

    // If we're now unmuted and music should be playing, restart it
    if (!this.contextManager.getMuteState() && this.isPlaying) {
      if (this.musicPlayer.isMenuMusicLoaded()) {
        this.musicPlayer.playMenuMusic();
      } else {
        this.proceduralMusic.startMenuMusic();
      }
    }
  }

  /**
   * Preloads all essential audio assets for better performance.
   */
  public async preloadEssentialAudio(): Promise<void> {
    try {
      await this.bufferManager.preloadEssentials();
    } catch (error) {
      this.logger.error(
        "AudioManager: Error preloading essential audio:",
        error
      );
    }
  }

  /**
   * Cleans up unused audio buffers to free memory.
   */
  public cleanupUnusedAudio(preserveEssential: boolean = true): void {
    this.bufferManager.cleanupUnused(preserveEssential);
  }

  /**
   * Plays a previously loaded audio sample.
   */
  public playAudioSample(
    id: string,
    volume: number = 0.5,
    loop: boolean = false
  ): AudioBufferSourceNode | null {
    return this.sfxPlayer.playAudioSample(id, volume, loop);
  }

  /**
   * Loads an audio sample from the specified URL and caches it.
   */
  public async loadAudioSample(
    url: string,
    id: string,
    optimizeForLooping: boolean = false
  ): Promise<void> {
    await this.bufferManager.loadAudioSample(url, id, optimizeForLooping);
  }

  /**
   * Checks if audio playback is currently allowed.
   */
  public canPlayAudio(): boolean {
    return this.contextManager.canPlayAudio();
  }

  /**
   * Attempts to resume the audio context if it's suspended
   */
  public async tryResumeAudioContext(): Promise<boolean> {
    return this.contextManager.tryResume();
  }

  /**
   * Plays a laser firing sound effect
   */
  public playLaserSound(weaponCategory: string = "energy"): void {
    this.sfxPlayer.playLaserSound(weaponCategory);
  }

  /**
   * Plays an asteroid collision sound effect
   */
  public playAsteroidCollisionSound(intensity: string = "medium"): void {
    this.sfxPlayer.playCollisionSound(intensity);
  }

  /**
   * Returns whether audio is currently playing.
   */
  public isAudioPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Gets the audio context for direct access if needed.
   */
  public getAudioContext(): AudioContext | null {
    return this.contextManager.getContext();
  }

  /**
   * Disposes of the audio manager and all its resources.
   */
  public dispose(): void {
    this.stopMusic();
    this.musicPlayer.dispose();
    this.sfxPlayer.dispose();
    this.proceduralMusic.dispose();
    this.bufferManager.dispose();
    this.contextManager.dispose();
  }
}
