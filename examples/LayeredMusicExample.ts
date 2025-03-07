/**
 * LayeredMusicExample.ts
 *
 * This example demonstrates how to use the layered music system in Star Wing.
 * It shows how to preload tracks, start layered music, add layers, adjust volumes,
 * and remove layers.
 */
import { AudioManager } from "../src/audio/AudioManager";

/**
 * Example class that demonstrates the layered music system
 */
export class LayeredMusicExample {
  private audioManager: AudioManager;

  constructor() {
    // Get the AudioManager instance
    this.audioManager = AudioManager.getInstance();
  }

  /**
   * Initialize audio system and preload required tracks
   */
  public async init(): Promise<void> {
    console.log("Initializing layered music example...");

    try {
      // Initialize the audio manager
      await this.audioManager.initialize();

      // Preload level 1 music
      await this.audioManager.preloadLevelMusic("level1");

      console.log("Initialization complete. Music files loaded.");
    } catch (error) {
      console.error("Error initializing layered music example:", error);
    }
  }

  /**
   * Start the base game music
   */
  public startBaseMusic(): void {
    console.log("Starting base game music...");
    this.audioManager.playLevelMusic("level1");
  }

  /**
   * Manually add the menu music layer
   * (Note: In level 1, this happens automatically after 5 seconds)
   */
  public addMenuMusicLayer(): void {
    console.log("Adding menu music layer at reduced volume...");
    this.audioManager.addMusicLayer("menuMusic", 0.07, 2.0);

    // Ensure game music is at full volume
    setTimeout(() => {
      this.audioManager.setLayerVolume("gameMusic", 1.0, 0.5);
      console.log("Set game music to full volume");
    }, 200);
  }

  /**
   * Adjust the volume of a specific layer
   * @param trackId The ID of the layer to adjust
   * @param volume The new volume (0.0 to 1.0)
   */
  public adjustLayerVolume(trackId: string, volume: number): void {
    console.log(`Adjusting ${trackId} volume to ${volume}...`);
    this.audioManager.setLayerVolume(trackId, volume, 1.0);
  }

  /**
   * Remove a specific layer
   * @param trackId The ID of the layer to remove
   */
  public removeLayer(trackId: string): void {
    console.log(`Removing ${trackId} layer...`);
    this.audioManager.removeMusicLayer(trackId, 2.0);
  }

  /**
   * Stop all music
   */
  public stopAllMusic(): void {
    console.log("Stopping all music...");
    this.audioManager.stopMusic(2.0);
  }
}

/**
 * Example of how to use the LayeredMusicExample class
 */
async function example() {
  // Create the example
  const example = new LayeredMusicExample();

  // Initialize and preload music
  await example.init();

  // Start base game music
  example.startBaseMusic();

  // After 10 seconds, manually add the menu music layer at reduced volume
  // (This would normally happen automatically for level 1)
  setTimeout(() => {
    example.addMenuMusicLayer();
  }, 10000);

  // After 20 seconds, slightly increase the menu music layer volume (but still keep it low)
  setTimeout(() => {
    example.adjustLayerVolume("menuMusic", 0.1); // Increase slightly but keep below 10%
  }, 20000);

  // After 30 seconds, ensure game music stays at full volume
  setTimeout(() => {
    example.adjustLayerVolume("gameMusic", 1.0);
  }, 30000);

  // After 40 seconds, remove the menu music layer
  setTimeout(() => {
    example.removeLayer("menuMusic");
  }, 40000);

  // After 50 seconds, stop all music
  setTimeout(() => {
    example.stopAllMusic();
  }, 50000);
}

// Uncomment to run the example
// example().catch(console.error);
