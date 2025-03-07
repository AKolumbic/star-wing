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

  // Layered music state tracking
  private layeredMusicActive: boolean = false;

  // Logging
  private logger = Logger.getInstance();

  // Singleton instance
  private static instance: AudioManager;

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
   * Gets the singleton instance of the AudioManager
   */
  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
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
   * Preloads the music track for the specified level
   * @param levelId The level identifier
   * @returns A promise that resolves when loading is complete
   */
  public async preloadLevelMusic(levelId: string): Promise<void> {
    try {
      this.logger.info(`AudioManager: Preloading music for level ${levelId}`);

      // Load the base game track
      if (!this.bufferManager.hasBuffer("gameMusic")) {
        await this.bufferManager.loadAudioSample(
          "assets/audio/star-wing_game-loop.mp3",
          "gameMusic",
          true
        );
      }

      // Load additional layered tracks
      if (
        levelId === "level1" &&
        !this.bufferManager.hasBuffer("level1Layer")
      ) {
        // This is the same as the menu music - reuse it for layering in level 1
        if (!this.bufferManager.hasBuffer("menuMusic")) {
          await this.bufferManager.loadAudioSample(
            "assets/audio/star-wing_menu-loop.mp3",
            "menuMusic",
            true
          );
        }
      }

      // Additional level-specific tracks could be loaded here based on levelId

      this.logger.info(
        `AudioManager: Successfully preloaded music for level ${levelId}`
      );
    } catch (error) {
      this.logger.error(
        `AudioManager: Error preloading level music for ${levelId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Starts playing layered music for a level
   * @param levelId The level identifier
   */
  public playLevelMusic(levelId: string): void {
    this.logger.info(`AudioManager: Starting level music for ${levelId}`);
    this.logger.debug(
      `AudioManager: Game music loaded: ${this.bufferManager.hasBuffer(
        "gameMusic"
      )}`
    );
    this.logger.debug(
      `AudioManager: Menu music loaded: ${this.bufferManager.hasBuffer(
        "menuMusic"
      )}`
    );

    // Log volume settings before starting
    this.logger.info(
      `AudioManager: Current volume settings - master: ${this.contextManager.getVolume()}, muted: ${this.contextManager.getMuteState()}`
    );

    // Use an ultra-short fade-out for near-seamless transition
    this.stopMusic(0.1, true); // Use true to preserve isPlaying flag for seamless transition

    // Start the base game track
    if (!this.bufferManager.hasBuffer("gameMusic")) {
      this.logger.warn("AudioManager: Game music not loaded, preloading now");
      this.bufferManager
        .loadAudioSample(
          "assets/audio/star-wing_game-loop.mp3",
          "gameMusic",
          true
        )
        .then(() => {
          this.playLevelMusic(levelId); // Try again after loading
        })
        .catch((err) => {
          this.logger.error("AudioManager: Error loading game music:", err);
        });
      return;
    }

    // Start the base music layer immediately
    const success = this.musicPlayer.startLayeredMusic("gameMusic", 2.0); // Sync with 2.0s hyperspace transition
    this.logger.debug(
      `AudioManager: Started game music base layer, success: ${success}`
    );

    if (success) {
      this.layeredMusicActive = true;

      // Add level-specific layers
      if (levelId === "level1") {
        // For level 1, add the menu music as a layer after an ULTRA-SHORT delay (0.3 seconds)
        setTimeout(() => {
          this.logger.debug(
            "AudioManager: 0.3-second timer fired for adding menu layer"
          );
          this.logger.info(
            `AudioManager: Volume before adding layer - master: ${this.contextManager.getVolume()}, muted: ${this.contextManager.getMuteState()}`
          );

          // Force an audio context resume
          this.contextManager
            .tryResume()
            .then(() => {
              this.logger.info(
                `AudioManager: Audio context resumed, state: ${
                  this.contextManager.getContext().state
                }`
              );
            })
            .catch((err) => {
              this.logger.error(
                `AudioManager: Error resuming audio context: ${err}`
              );
            });

          if (this.bufferManager.hasBuffer("menuMusic")) {
            this.logger.debug(
              "AudioManager: About to add menu music layer at volume 0.8"
            );

            // Use high volume and fast fade-in for second layer
            const layerVolume = 0.8;
            const success = this.musicPlayer.addMusicLayer(
              "menuMusic",
              layerVolume,
              0.5
            ); // Ultra-fast fade-in (0.5s)
            this.logger.debug(`AudioManager: Add layer result: ${success}`);

            // Force another volume verification after adding the layer
            setTimeout(() => {
              this.logger.info(
                `AudioManager: Volume after adding layer - master: ${this.contextManager.getVolume()}, muted: ${this.contextManager.getMuteState()}`
              );
              this.logger.info(
                `AudioManager: Audio context state after adding layer: ${
                  this.contextManager.getContext().state
                }`
              );

              // Log the main gain node value
              this.logger.info(
                `AudioManager: Main gain node value: ${
                  this.contextManager.getMainGainNode().gain.value
                }`
              );
            }, 300);
          } else {
            this.logger.error(
              "AudioManager: Menu music not found in buffer manager!"
            );
          }
        }, 300); // Ultra-short 0.3 second delay (was 1 second)
      }
    }
  }

  /**
   * Adds an additional music layer to the currently playing layered music
   * @param trackId The ID of the track to add as a layer
   * @param volume Initial volume for the layer (0.0 to 1.0)
   * @param fadeTime Time in seconds to fade in the layer
   * @returns True if the layer was successfully added
   */
  public addMusicLayer(
    trackId: string,
    volume: number = 0.5,
    fadeTime: number = 1.0
  ): boolean {
    if (!this.layeredMusicActive) {
      this.logger.warn(
        "AudioManager: Cannot add layer - layered music is not active"
      );
      return false;
    }

    return this.musicPlayer.addMusicLayer(trackId, volume, fadeTime);
  }

  /**
   * Adjusts the volume of a specific music layer
   * @param trackId The ID of the layer to adjust
   * @param volume New volume (0.0 to 1.0)
   * @param fadeTime Time in seconds to fade to the new volume
   * @returns True if the adjustment was successful
   */
  public setLayerVolume(
    trackId: string,
    volume: number,
    fadeTime: number = 0.5
  ): boolean {
    if (!this.layeredMusicActive) {
      this.logger.warn(
        "AudioManager: Cannot adjust layer - layered music is not active"
      );
      return false;
    }

    return this.musicPlayer.setLayerVolume(trackId, volume, fadeTime);
  }

  /**
   * Removes a music layer with a fade-out
   * @param trackId The ID of the layer to remove
   * @param fadeTime Time in seconds to fade out
   * @returns True if the layer was successfully removed
   */
  public removeMusicLayer(trackId: string, fadeTime: number = 1.0): boolean {
    if (!this.layeredMusicActive) {
      this.logger.warn(
        "AudioManager: Cannot remove layer - layered music is not active"
      );
      return false;
    }

    return this.musicPlayer.removeMusicLayer(trackId, fadeTime);
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
    this.layeredMusicActive = false;
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
    this.layeredMusicActive = false;
    this.musicPlayer.dispose();
    this.sfxPlayer.dispose();
    this.proceduralMusic.dispose();
    this.bufferManager.dispose();
    this.contextManager.dispose();
  }

  /**
   * Test function to diagnose layered music issues
   * @param menuLayerVolume Volume to use for the menu music layer (0.0 to 1.0)
   */
  public testLayeredMusic(menuLayerVolume: number = 0.8): void {
    this.logger.info("=== LAYERED MUSIC TEST ===");
    this.logger.info(
      `Audio context state: ${this.contextManager.getContext().state}`
    );
    this.logger.info(`Mute state: ${this.contextManager.getMuteState()}`);
    this.logger.info(`Master volume: ${this.contextManager.getVolume()}`);
    this.logger.info(
      `Loaded buffers: ${this.bufferManager.getBufferIds().join(", ")}`
    );

    // Stop any current music
    this.stopMusic(0.1);
    this.logger.info("Stopped all music");

    // Start with just the game music
    setTimeout(() => {
      this.logger.info("Starting game music layer");
      const success = this.musicPlayer.startLayeredMusic("gameMusic", 0.5);
      this.logger.info(`Game music start result: ${success}`);

      // After 3 seconds, add the menu music layer at higher volume
      setTimeout(() => {
        this.logger.info(
          `Adding menu music layer at volume ${menuLayerVolume}`
        );
        const layerSuccess = this.musicPlayer.addMusicLayer(
          "menuMusic",
          menuLayerVolume,
          1.0
        );
        this.logger.info(`Add layer result: ${layerSuccess}`);
      }, 3000);
    }, 1000);
  }
}
