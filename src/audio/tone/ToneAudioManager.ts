/**
 * ToneAudioManager is responsible for all sound generation and audio playback in the game.
 * It's a Tone.js implementation of the AudioManager facade for better code organization.
 * This class will eventually replace the original AudioManager while maintaining the same API.
 * Enhanced with advanced Tone.js features in Phase 6.
 */
import { Logger } from "../../utils/Logger";
import { ToneContextManager } from "./ToneContextManager";
import { ToneBufferManager } from "./ToneBufferManager";
import { ToneMusicPlayer } from "./ToneMusicPlayer";
import { ToneSoundEffectPlayer } from "./ToneSoundEffectPlayer";
import { ToneProceduralGenerator } from "./ToneProceduralGenerator";
import {
  ToneSpatialAudio,
  Position3D,
  SpatialSoundConfig,
} from "./ToneSpatialAudio";
import { ToneEffectsChain, EffectPreset } from "./ToneEffectsChain";
import {
  getEnvironmentPreset,
  getGameplayPreset,
  blendPresets,
} from "./ToneEffectPresets";
import * as Tone from "tone";

export class ToneAudioManager {
  // Core audio infrastructure
  private contextManager: ToneContextManager;
  private bufferManager: ToneBufferManager;

  // Specialized players
  private musicPlayer: ToneMusicPlayer;
  private sfxPlayer: ToneSoundEffectPlayer;
  private proceduralMusic: ToneProceduralGenerator;
  private spatialAudio: ToneSpatialAudio;

  // Effects management
  private effectsChain: ToneEffectsChain;
  private activeEnvironment: string = "space";
  private activeGameplayEffects: Set<string> = new Set();
  private effectBlendAmount: number = 0.5;

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

    // Create the spatial audio manager
    this.spatialAudio = new ToneSpatialAudio(
      this.contextManager,
      this.bufferManager
    );

    // Create the effects chain
    this.effectsChain = new ToneEffectsChain();
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
      return;
    }

    this.logger.info("ToneAudioManager: Initializing");

    try {
      // Initialize the Tone.js context
      await this.contextManager.initialize();

      // Preload essential audio
      await this.bufferManager.preloadEssentials();

      // Set up master effects chain
      this.setupMasterEffectsChain();

      this.isInitialized = true;
      this.logger.info("ToneAudioManager: Initialization complete");
    } catch (error) {
      this.logger.error("ToneAudioManager: Initialization failed", error);
    }
  }

  /**
   * Sets up the master effects chain for processing all audio
   */
  private setupMasterEffectsChain(): void {
    // Create a chain for master processing
    this.effectsChain = new ToneEffectsChain();

    // -- Original routing (commented out for debugging) --
    // Tone.getDestination().disconnect();
    // this.effectsChain.getInputNode().connect(Tone.getDestination());
    // Tone.Destination.chain(this.effectsChain.getInputNode());

    // For debugging, connect the effects chain output directly to the destination
    this.effectsChain.getOutputNode().connect(Tone.getDestination());

    // Apply default environment preset
    this.setEnvironmentEffects(this.activeEnvironment);
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
  public async playMenuMusic(procedural: boolean = false): Promise<void> {
    // Ensure we have a valid audio context
    await this.contextManager.startAudioContext();

    // Don't do anything if the menu music is already playing
    if (this.isPlaying && this.musicPlayer.hasLayer("menu_music")) {
      return;
    }

    // Try to play menu music sample if not in procedural mode
    if (!procedural) {
      const hasBuffer = this.bufferManager.hasBuffer("menu_music");
      const buffer = hasBuffer
        ? this.bufferManager.getBuffer("menu_music")
        : null;

      if (!buffer) {
        // Fall back to procedural music if sample not loaded
        this.proceduralMusic.startMenuMusic();
        return;
      }

      try {
        this.musicPlayer.playMenuMusic();
      } catch (error) {
        // Fall back to procedural if there's an error
        this.proceduralMusic.startMenuMusic();
      }
    } else {
      // Play procedural music if procedural was requested
      this.proceduralMusic.startMenuMusic();
    }

    this.isPlaying = true;
  }

  /**
   * Stops menu music playback
   */
  public stopMenuMusic(): void {
    this.musicPlayer.stopMenuMusic();
    this.proceduralMusic.stopMusic();
    this.logger.info("ToneAudioManager: Stopping menu music");
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
   * Plays the asteroid collision sound. Alias for playCollisionSound.
   */
  public playAsteroidCollisionSound(size: string = "medium"): void {
    this.logger.info("ToneAudioManager: Playing asteroid collision sound");
    this.playCollisionSound(size);
  }

  /**
   * Plays the game loop music using the 'game_loop' buffer.
   */
  public async playGameLoopMusic(): Promise<void> {
    this.logger.info("ToneAudioManager: Playing game loop music");

    // Check if the game loop music buffer is loaded, if not, attempt to load it
    if (!this.bufferManager.hasBuffer("game_loop")) {
      this.logger.info(
        "ToneAudioManager: Game loop music buffer not found. Attempting to load it."
      );
      try {
        await this.bufferManager.loadAudioSample(
          "assets/audio/star-wing_game-loop.mp3",
          "game_loop",
          true
        );
      } catch (error) {
        this.logger.error(
          "ToneAudioManager: Error loading game loop music",
          error
        );
        return;
      }
    }

    const player = this.musicPlayer.playGameMusic(true, 0.5);
    if (!player) {
      this.logger.warn("ToneAudioManager: Failed to play game loop music");
    }
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

    // Pre-create the menu music player to eliminate startup delay
    if (this.bufferManager.hasBuffer("menu_music")) {
      this.logger.info(
        "ToneAudioManager: Pre-creating menu music player to eliminate startup delay"
      );
      try {
        // Create the player but keep it paused
        const player = this.musicPlayer.createMenuMusicPlayer();
        if (player) {
          this.logger.info(
            "ToneAudioManager: Menu music player pre-created successfully"
          );
        }
      } catch (error) {
        this.logger.warn(
          "ToneAudioManager: Failed to pre-create menu music player",
          error
        );
      }
    }
  }

  /**
   * Cleans up unused audio buffers to free memory
   */
  public cleanupUnusedAudio(preserveEssential: boolean = true): void {
    this.bufferManager.cleanupUnused(preserveEssential);
  }

  /**
   * Starts gameplay procedural music with specific game state parameters
   */
  public startGameplayMusic(
    intensity: number = 0.5,
    danger: number = 0.2,
    success: number = 0.5,
    environment: string = "space"
  ): void {
    this.proceduralMusic.updateGameState({
      intensity,
      danger,
      success,
      environment,
    });

    this.proceduralMusic.startGameplayMusic(intensity);
  }

  /**
   * Updates the procedural music based on game state
   */
  public updateGameState(
    intensity?: number,
    danger?: number,
    success?: number,
    environment?: string
  ): void {
    const gameState: any = {};

    if (intensity !== undefined) gameState.intensity = intensity;
    if (danger !== undefined) gameState.danger = danger;
    if (success !== undefined) gameState.success = success;
    if (environment !== undefined) gameState.environment = environment;

    this.proceduralMusic.updateGameState(gameState);
  }

  /**
   * Creates a spatial sound source in 3D space
   */
  public createSpatialSound(config: SpatialSoundConfig): boolean {
    return this.spatialAudio.createSoundSource(config);
  }

  /**
   * Plays a spatial sound at a specific position
   */
  public playSpatialSound(id: string, position?: Position3D): void {
    // Update position if provided
    if (position) {
      this.spatialAudio.updateSoundPosition(id, position);
    }

    // Play the sound
    this.spatialAudio.playSoundSource(id);
  }

  /**
   * Updates the position of a spatial sound
   */
  public updateSpatialSoundPosition(id: string, position: Position3D): void {
    this.spatialAudio.updateSoundPosition(id, position);
  }

  /**
   * Stops a spatial sound
   */
  public stopSpatialSound(id: string, fadeOut: number = 0): void {
    this.spatialAudio.stopSoundSource(id, fadeOut);
  }

  /**
   * Removes a spatial sound
   */
  public removeSpatialSound(id: string): void {
    this.spatialAudio.removeSoundSource(id);
  }

  /**
   * Updates the listener position (usually the player/camera)
   */
  public updateListenerPosition(position: Position3D): void {
    this.spatialAudio.updateListenerPosition(position);
  }

  /**
   * Updates the listener orientation
   */
  public updateListenerOrientation(forward: Position3D, up: Position3D): void {
    this.spatialAudio.updateListenerOrientation(forward, up);
  }

  /**
   * Sets the environment size (reverb) for all spatial audio
   */
  public setEnvironmentSize(size: number): void {
    this.spatialAudio.setEnvironmentSize(size);
  }

  /**
   * Apply environmental audio effects based on the current game environment
   * @param environment The game environment (space, cave, underwater, etc.)
   */
  public setEnvironmentEffects(environment: string): void {
    this.logger.info(
      `ToneAudioManager: Setting environment effects for ${environment}`
    );

    // Store current environment
    this.activeEnvironment = environment;

    // Get the preset for this environment
    const preset = getEnvironmentPreset(environment);

    // Apply environment preset
    this.applyEffectPreset(preset);

    // Update spatial audio environment
    const reverbAmount =
      environment === "space"
        ? 0.5
        : environment === "cave"
        ? 0.8
        : environment === "underwater"
        ? 0.7
        : environment === "desert"
        ? 0.1
        : environment === "forest"
        ? 0.4
        : 0.3;

    this.spatialAudio.setEnvironmentSize(reverbAmount);

    // Update procedural music based on environment
    this.proceduralMusic.updateGameState({ environment });
  }

  /**
   * Apply a gameplay effect preset
   * @param effectName The name of the effect preset to apply
   * @param applyImmediately Whether to apply the effect immediately
   */
  public addGameplayEffect(
    effectName: string,
    applyImmediately: boolean = true
  ): void {
    this.logger.info(`ToneAudioManager: Adding gameplay effect ${effectName}`);

    // Add to active effects
    this.activeGameplayEffects.add(effectName);

    // Apply effects if requested
    if (applyImmediately) {
      this.applyActiveEffects();
    }
  }

  /**
   * Remove a gameplay effect preset
   * @param effectName The name of the effect to remove
   * @param applyImmediately Whether to apply the change immediately
   */
  public removeGameplayEffect(
    effectName: string,
    applyImmediately: boolean = true
  ): void {
    this.logger.info(
      `ToneAudioManager: Removing gameplay effect ${effectName}`
    );

    // Remove from active effects
    this.activeGameplayEffects.delete(effectName);

    // Apply effects if requested
    if (applyImmediately) {
      this.applyActiveEffects();
    }
  }

  /**
   * Clear all active gameplay effects
   */
  public clearGameplayEffects(): void {
    this.logger.info("ToneAudioManager: Clearing all gameplay effects");

    // Clear all gameplay effects
    this.activeGameplayEffects.clear();

    // Apply environment only
    this.applyActiveEffects();
  }

  /**
   * Apply all active effects (environment + gameplay)
   */
  private applyActiveEffects(): void {
    // Start with the environment preset
    let finalPreset = getEnvironmentPreset(this.activeEnvironment);

    // Add each active gameplay effect
    this.activeGameplayEffects.forEach((effectName) => {
      const gameplayPreset = getGameplayPreset(effectName);
      if (gameplayPreset) {
        // Blend with existing preset
        finalPreset = blendPresets(
          finalPreset,
          gameplayPreset,
          this.effectBlendAmount
        );
      }
    });

    // Apply the combined preset
    this.applyEffectPreset(finalPreset);
  }

  /**
   * Apply an effect preset to the master output
   */
  private applyEffectPreset(preset: EffectPreset): void {
    this.logger.info(
      `ToneAudioManager: Applying effect preset: ${preset.name}`
    );

    // Apply preset to effects chain
    this.effectsChain.clearEffects();
    this.effectsChain.applyPreset(preset);
  }

  /**
   * Set the blending amount for gameplay effects
   * @param amount Blend amount (0-1)
   */
  public setEffectBlendAmount(amount: number): void {
    this.effectBlendAmount = Math.max(0, Math.min(1, amount));
    this.applyActiveEffects();
  }

  /**
   * Disposes of all audio resources
   */
  public dispose(): void {
    this.logger.info("ToneAudioManager: Disposing");

    // Stop all music first
    this.stopMusic();

    // Then dispose of all underlying components
    this.musicPlayer.dispose();
    this.sfxPlayer.dispose();
    this.proceduralMusic.dispose();
    this.spatialAudio.dispose();
    this.effectsChain.dispose();
    this.contextManager.dispose();

    // Clear the buffer cache and release memory
    this.bufferManager.dispose();

    // Reset state
    this.isInitialized = false;
    this.isPlaying = false;
    this.layeredMusicActive = false;
  }

  /**
   * Plays level music by transitioning from menu music to game loop music.
   * This method stops the menu music with a fade-out and then starts the game loop music.
   * @param levelId The level ID (e.g., "level1")
   */
  public async playLevelMusic(levelId: string): Promise<void> {
    this.logger.info(
      `ToneAudioManager: Transitioning from menu music to game loop music for level ${levelId}`
    );

    // Stop the menu music with a fade-out of 0.5 seconds
    this.musicPlayer.stopMenuMusic(0.5);

    // Wait for 0.5 seconds to allow the fade-out to complete
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Now start the game loop music
    await this.playGameLoopMusic();
  }

  /**
   * Stops all music playback.
   */
  public stopMusic(): void {
    this.logger.info("ToneAudioManager: Stopping all music");
    this.musicPlayer.stopMenuMusic();
    this.musicPlayer.stopGameMusic();
    this.proceduralMusic.stopMusic();
    this.stopLayeredMusic();
    this.isPlaying = false;
  }
}
