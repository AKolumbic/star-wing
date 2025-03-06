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
   * @param forceRestart If true, will force restart even if already playing
   */
  public playMenuThump(
    useProceduralAudio: boolean = false,
    forceRestart: boolean = false
  ): void {
    if (!this.isInitialized) {
      this.initialize();
    }

    if (this.isPlaying && !forceRestart) {
      return;
    }

    this.isPlaying = true;

    if (useProceduralAudio) {
      this.proceduralMusic.startMenuMusic();
    } else {
      this.musicPlayer.playMenuMusic(forceRestart);
    }
  }

  /**
   * Stops all music playback.
   * @param fadeOutTime Optional fade-out time in seconds
   * @param preservePlayingFlag If true, don't reset the isPlaying flag (used for temporary stops before restarting)
   */
  public stopMusic(
    fadeOutTime: number = 0.1,
    preservePlayingFlag: boolean = false
  ): void {
    if (!preservePlayingFlag) {
      this.isPlaying = false;
    }
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
    const wasMuted = this.contextManager.getMuteState();
    this.contextManager.toggleMute();
    const isNowMuted = this.contextManager.getMuteState();

    // If we're unmuting and music should be playing
    if (wasMuted && !isNowMuted) {
      this.logger.info(
        `AudioManager: Unmuting - isPlaying flag is ${this.isPlaying}`
      );

      // If we don't currently have the playing flag set, set it now
      // This handles cases where the user toggles mute after the music stopped
      if (!this.isPlaying) {
        this.logger.info(
          "AudioManager: Music wasn't playing, setting flag to true"
        );
        this.isPlaying = true;
      }

      // First ensure any existing music is fully stopped, but preserve the isPlaying flag
      this.stopMusic(0.05, true);

      // Make sure volume is set to a non-zero value
      if (this.getVolume() <= 0.01) {
        this.logger.info(
          "AudioManager: Volume was near zero, setting to default"
        );
        this.setVolume(0.25);
      }

      this.logger.info(
        `AudioManager: Music flag is now ${
          this.isPlaying
        }, volume is ${this.getVolume()} - will restart after delay`
      );

      // Force clear the WebAudio nodes to avoid any lingering connections
      this.forceResetAudioNodes();

      // Then restart with a slightly longer delay to avoid race conditions
      setTimeout(() => {
        const currentMuteState = this.contextManager.getMuteState();
        this.logger.info(
          `AudioManager: After delay - muted=${currentMuteState}, isPlaying=${this.isPlaying}`
        );

        if (!currentMuteState && this.isPlaying) {
          this.logger.info("AudioManager: Restarting music after unmute");
          // Use playMenuThump with forceRestart to ensure clean restart
          this.playMenuThump(false, true);
        } else {
          this.logger.warn(
            `AudioManager: Not restarting music - conditions not met`
          );
        }
      }, 250); // Increased delay to 250ms to ensure clean transition
    }
  }

  /**
   * Forces a reset of audio nodes to ensure clean state
   * @private
   */
  private forceResetAudioNodes(): void {
    try {
      // Get the main gain node
      const mainGain = this.contextManager.getMainGainNode();

      // Disconnect and reconnect to ensure clean state
      try {
        mainGain.disconnect();
      } catch (err) {
        // Ignore - might not be connected
      }

      // Reset the gain value directly
      const storedVolume = this.getVolume();
      const isMuted = this.getMuteState();
      const volume = isMuted ? 0 : Math.max(0.25, storedVolume) * 0.6;

      // Apply volume immediately
      mainGain.gain.value = volume;

      // Reconnect to destination
      mainGain.connect(this.contextManager.getContext().destination);

      this.logger.info(
        `AudioManager: Force reset audio nodes and set volume to ${volume}`
      );
    } catch (err) {
      this.logger.error(
        "AudioManager: Error during force reset of audio nodes:",
        err
      );
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
