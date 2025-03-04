import { GameSystem } from "../GameSystem";
import { Scene } from "../Scene";

/**
 * Adapter class that wraps the Scene class to implement the GameSystem interface.
 * Responsible for 3D rendering and visual effects.
 */
export class SceneSystem implements GameSystem {
  /** The underlying Scene instance */
  private scene: Scene;

  /**
   * Creates a new SceneSystem.
   * @param canvas The canvas element to render on
   */
  constructor(canvas: HTMLCanvasElement) {
    this.scene = new Scene(canvas);
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
