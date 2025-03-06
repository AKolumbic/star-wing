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
   * Plays a short test tone to verify that audio is working
   * This is useful for debugging audio context issues
   */
  public playTestTone(): void {
    this.logger.info("AUDIO-DEBUG: Playing test tone to verify audio system");

    try {
      if (!this.contextManager) {
        this.logger.error(
          "AUDIO-DEBUG: Cannot play test tone - context manager not initialized"
        );
        return;
      }

      // Get current context state
      const context = this.contextManager.getContext();
      const contextState = context.state;
      this.logger.info(
        `AUDIO-DEBUG: Audio context state before test tone: ${contextState}`
      );

      // Try to resume the context if needed
      if (contextState !== "running") {
        this.logger.info(
          "AUDIO-DEBUG: Attempting to resume context for test tone"
        );
        context.resume().then(() => {
          this.logger.info(
            `AUDIO-DEBUG: Context resumed result: ${context.state}`
          );
        });
      }

      // Create oscillator
      const oscillator = context.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(440, context.currentTime); // 440 Hz = A4

      // Create gain node for volume control
      const gainNode = context.createGain();
      gainNode.gain.setValueAtTime(0, context.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, context.currentTime + 0.01); // Quick fade in
      gainNode.gain.linearRampToValueAtTime(0, context.currentTime + 0.3); // Fade out

      // Connect to the main gain node
      const mainGain = this.contextManager.getMainGainNode();
      this.logger.info(
        `AUDIO-DEBUG: Main gain value before test tone: ${mainGain.gain.value}`
      );

      // Connect the nodes
      oscillator.connect(gainNode);
      gainNode.connect(mainGain);

      // Play the tone
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.3); // 300ms duration

      this.logger.info("AUDIO-DEBUG: Test tone started");

      // Check again after tone plays
      setTimeout(() => {
        this.logger.info(
          `AUDIO-DEBUG: Context state after test tone: ${context.state}`
        );
        this.logger.info(
          `AUDIO-DEBUG: Main gain value after test tone: ${mainGain.gain.value}`
        );
      }, 400);
    } catch (error) {
      this.logger.error("AUDIO-DEBUG: Error playing test tone:", error);
    }
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
   * Transitions from menu music to game music.
   * This preloads the game music track and allows the current
   * loop to finish before starting the new track for a seamless sound.
   */
  public transitionToGameMusic(): void {
    if (!this.isInitialized) {
      this.logger.warn(
        "AudioManager: Cannot transition to game music - not initialized"
      );
      return;
    }

    // If we're already playing the game music, don't transition again
    if (this.currentMusic === "gameMusic") {
      this.logger.info(
        "AudioManager: Already playing game music, no transition needed"
      );

      // But ensure game music is actually playing
      if (!this.isPlaying) {
        this.logger.info("AudioManager: Restarting game music");
        this.musicPlayer.playGameMusic();
        this.isPlaying = true;
      }
      return;
    }

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
    this.isInitialized = false;
    this.currentMusic = "";
  }

  /**
   * Gets the current type of music being played.
   * @returns The current music type (e.g., "menuMusic", "gameMusic", or "")
   */
  public getCurrentMusic(): string {
    return this.currentMusic;
  }

  /**
   * Plays the game music immediately without waiting for any existing music to finish
   */
  public playGameMusicImmediately(): void {
    this.logger.info(
      "AUDIO-DEBUG: AudioManager.playGameMusicImmediately() called"
    );

    // Initialize if necessary
    if (!this.isInitialized) {
      this.logger.info(
        "AUDIO-DEBUG: Audio manager not initialized, initializing now"
      );
      this.initialize();
    }

    // Try to resume the audio context
    this.tryResumeAudioContext().then((resumed) => {
      this.logger.info(
        `AUDIO-DEBUG: Audio context resume result: ${
          resumed ? "success" : "failure"
        }`
      );

      // Get current context state
      const contextState = this.contextManager.getContext().state;
      this.logger.info(
        `AUDIO-DEBUG: Audio context state after resume attempt: ${contextState}`
      );

      // Check if we can play audio
      if (contextState !== "running") {
        this.logger.error(
          "AUDIO-DEBUG: Audio context is not running after resume attempt"
        );
      }
    });

    // Stop any currently playing music with a short fade-out
    this.stopMusic(0.1);

    // Ensure main gain node is connected
    try {
      const mainGain = this.contextManager.getMainGainNode();
      if (mainGain) {
        this.logger.info(
          `AUDIO-DEBUG: Main gain node value: ${mainGain.gain.value}`
        );

        // Force reconnection
        mainGain.disconnect();
        mainGain.connect(this.contextManager.getContext().destination);
        this.logger.info(
          "AUDIO-DEBUG: Reconnected main gain node to destination"
        );
      } else {
        this.logger.error("AUDIO-DEBUG: Main gain node is null");
      }
    } catch (e) {
      this.logger.error("AUDIO-DEBUG: Error with main gain node:", e);
    }

    // Check if procedural music is enabled
    if (this.proceduralMusic) {
      this.logger.info("AUDIO-DEBUG: Procedural music is enabled");
      if (this.proceduralMusic) {
        try {
          this.logger.info("AUDIO-DEBUG: Starting procedural generator");
          this.proceduralMusic.startGameMusic();
        } catch (e) {
          this.logger.error(
            "AUDIO-DEBUG: Error starting procedural generator:",
            e
          );
        }
      }
    } else {
      this.logger.info(
        "AUDIO-DEBUG: Procedural music is disabled, loading game music"
      );

      // Make sure game music is loaded
      if (!this.bufferManager.hasBuffer("gameMusic")) {
        this.logger.info("AUDIO-DEBUG: Game music not loaded, loading now");

        // Construct full URL
        const baseUrl = window.location.origin;
        const fullUrl = `${baseUrl}${GAME_MUSIC_PATH}`;
        this.logger.info(`AUDIO-DEBUG: Loading game music from: ${fullUrl}`);

        // Load the game music
        this.bufferManager
          .loadAudioBuffer(fullUrl, "gameMusic")
          .then(() => {
            this.logger.info("AUDIO-DEBUG: Game music loaded successfully");

            // Short timeout to ensure context is in good state
            setTimeout(() => {
              this.logger.info("AUDIO-DEBUG: Playing game music after loading");

              // Reconnect nodes one more time for safety
              try {
                const mainGain = this.contextManager.getMainGainNode();
                if (mainGain) {
                  mainGain.disconnect();
                  mainGain.connect(
                    this.contextManager.getContext().destination
                  );
                  this.logger.info(
                    "AUDIO-DEBUG: Reconnected main gain node before playing"
                  );
                }
              } catch (e) {
                this.logger.error(
                  "AUDIO-DEBUG: Error reconnecting before play:",
                  e
                );
              }

              // Now play the music
              if (this.musicPlayer) {
                this.musicPlayer.playGameMusic();
                this.isPlaying = true;
                this.currentMusic = "gameMusic";
              }
            }, 150);
          })
          .catch((error) => {
            this.logger.error("AUDIO-DEBUG: Error loading game music:", error);

            // Fall back to procedural if available
            if (this.proceduralMusic) {
              this.logger.info("AUDIO-DEBUG: Falling back to procedural music");
              this.proceduralMusic.startGameMusic();
              this.isPlaying = true;
              this.currentMusic = "gameMusic";
            }
          });
      } else {
        // Game music is already loaded
        this.logger.info("AUDIO-DEBUG: Game music already loaded, playing now");

        // Short timeout to ensure context is in good state
        setTimeout(() => {
          if (this.musicPlayer) {
            this.logger.info("AUDIO-DEBUG: Playing game music immediately");
            this.musicPlayer.playGameMusic();
            this.isPlaying = true;
            this.currentMusic = "gameMusic";
          } else {
            this.logger.error("AUDIO-DEBUG: Music player not initialized");
          }
        }, 150);
      }
    }
  }
}
