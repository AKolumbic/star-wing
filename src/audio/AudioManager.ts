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

// Music asset paths
const MENU_MUSIC_PATH = "/assets/audio/star-wing_menu-loop.mp3";
const GAME_MUSIC_PATH = "/assets/audio/star-wing_game-loop.mp3";

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
  private currentMusic: string = "";

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

    if (this.isPlaying && this.currentMusic === "menuMusic") {
      return;
    }

    this.isPlaying = true;
    this.currentMusic = "menuMusic";

    if (useProceduralAudio) {
      this.proceduralMusic.startMenuMusic();
    } else {
      this.musicPlayer.playMenuMusic();
    }
  }

  /**
   * Transitions from menu music to game music with a smooth crossfade.
   * This ensures a cohesive, never-ending soundtrack by timing the transition
   * to occur at natural loop points in the music.
   */
  public transitionToGameMusic(): void {
    if (!this.isInitialized) {
      this.initialize();
    }

    // If we're already playing the game music, don't do anything
    if (this.currentMusic === "gameMusic") {
      return;
    }

    this.logger.info(
      "AudioManager: Transitioning from menu music to game music"
    );

    // Preload the game music if it's not already loaded
    if (!this.bufferManager.hasBuffer("gameMusic")) {
      this.logger.info("AudioManager: Preloading game music");

      // Define the full URL for the game music
      const baseUrl = window.location.origin;
      const fullUrl = `${baseUrl}${GAME_MUSIC_PATH}`;

      this.bufferManager
        .loadAudioBuffer(fullUrl, "gameMusic")
        .then(() => {
          this.logger.info("AudioManager: Game music loaded successfully");
          this._executeGameMusicTransition();
        })
        .catch((error) => {
          this.logger.error("AudioManager: Failed to load game music:", error);
          // Fallback to procedural music if loading fails
          this.proceduralMusic.startGameMusic();
        });
    } else {
      // Game music is already loaded, proceed with transition
      this._executeGameMusicTransition();
    }
  }

  /**
   * Private method to handle the actual transition to game music
   * once the audio buffer is loaded.
   */
  private _executeGameMusicTransition(): void {
    // If using procedural music, switch to game pattern
    if (this.proceduralMusic.isActive()) {
      this.proceduralMusic.transitionToGameMusic();
      this.currentMusic = "gameMusic";
      return;
    }

    // For sampled music, schedule the transition
    const currentSourceInfo = this.musicPlayer.getCurrentSourceInfo();

    if (currentSourceInfo && currentSourceInfo.buffer) {
      // Get information about the current playback position
      const { source, startTime, buffer } = currentSourceInfo;
      const currentTime = this.contextManager.getCurrentTime();
      const playbackTime = currentTime - startTime;

      // Calculate time until the end of the current loop
      const duration = buffer.duration;
      const timeUntilEnd = duration - (playbackTime % duration);

      this.logger.info(
        `AudioManager: Current playback position: ${playbackTime.toFixed(
          2
        )}s, time until loop end: ${timeUntilEnd.toFixed(2)}s`
      );

      // Schedule the transition to occur at the end of the current loop
      // Subtract a small amount of time to ensure smooth transition
      const transitionBuffer = 0.1; // 100ms buffer for smoother transition

      setTimeout(() => {
        this.logger.info("AudioManager: Executing transition to game music");
        this.musicPlayer.stop(0.5); // Fade out over 0.5 seconds

        // Start game music after a short delay to allow the fade out
        setTimeout(() => {
          this.musicPlayer.playGameMusic();
          this.currentMusic = "gameMusic";
        }, 400); // Wait slightly less than the fade out time
      }, (timeUntilEnd - transitionBuffer) * 1000);
    } else {
      // If we can't determine the current playback position, do a simple crossfade
      this.logger.info(
        "AudioManager: No active music source, doing immediate transition"
      );
      this.musicPlayer.stop(0.5);

      setTimeout(() => {
        this.musicPlayer.playGameMusic();
        this.currentMusic = "gameMusic";
      }, 400);
    }
  }

  /**
   * Stops all music playback.
   * @param fadeOutTime Optional fade-out time in seconds
   */
  public stopMusic(fadeOutTime: number = 0.1): void {
    this.isPlaying = false;
    this.currentMusic = "";
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
