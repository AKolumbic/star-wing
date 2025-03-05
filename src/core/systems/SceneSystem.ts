import { GameSystem } from "../GameSystem";
import { Scene } from "../Scene";
import { Game } from "../Game";

/**
 * Adapter class that wraps the Scene class to implement the GameSystem interface.
 * Responsible for 3D rendering and visual effects.
 */
export class SceneSystem implements GameSystem {
  /** The underlying Scene instance */
  private scene: Scene;

  /** Reference to the Game instance */
  private game: Game;

  /**
   * Creates a new SceneSystem.
   * @param canvas The canvas element to render on
   * @param game The Game instance
   * @param devMode Whether to enable development mode features
   */
  constructor(canvas: HTMLCanvasElement, game: Game, devMode: boolean = false) {
    this.scene = new Scene(canvas, devMode);
    this.game = game;
    this.scene.setGame(game);
  }

  /**
   * Initializes the scene system.
   * @returns A promise that resolves when initialization is complete
   */
  async init(): Promise<void> {
    return this.scene.init();
  }

  /**
   * Updates the scene for the current frame.
   * @param deltaTime Time elapsed since the last frame in seconds
   */
  update(deltaTime: number): void {
    this.scene.update(deltaTime);
    this.scene.render();
  }

  /**
   * Cleans up scene resources.
   */
  dispose(): void {
    this.scene.dispose();
  }

  /**
   * Gets the underlying Scene instance.
   * @returns The Scene instance
   */
  getScene(): Scene {
    return this.scene;
  }
}
