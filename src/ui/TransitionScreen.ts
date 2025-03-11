import { Scene } from "../core/Scene";
import { BackgroundType } from "../core/backgrounds/BackgroundManager";
import { Logger } from "../utils/Logger";

export class TransitionScreen {
  private element: HTMLDivElement;
  private message: HTMLParagraphElement;
  private logger: Logger;
  private scene: Scene;
  private animationFrameId: number | null = null;
  private newScene: Scene | null = null;

  constructor(scene: Scene) {
    this.logger = Logger.getInstance();
    this.scene = scene;

    // Create transition screen element
    this.element = document.createElement("div");
    this.element.style.position = "fixed";
    this.element.style.top = "0";
    this.element.style.left = "0";
    this.element.style.width = "100%";
    this.element.style.height = "100%";
    this.element.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    this.element.style.display = "flex";
    this.element.style.justifyContent = "center";
    this.element.style.alignItems = "center";
    this.element.style.zIndex = "1000";

    // Create message element
    this.message = document.createElement("p");
    this.message.style.color = "#fff";
    this.message.style.fontSize = "24px";
    this.message.style.fontFamily = "'Press Start 2P', monospace";
    this.element.appendChild(this.message);
  }

  /**
   * Shows the transition screen and executes the transition sequence
   */
  async show(onComplete: () => void): Promise<void> {
    this.logger.info("Starting transition sequence");

    // Add to DOM
    document.body.appendChild(this.element);

    try {
      // Step 1: Initial message
      this.message.textContent = "Preparing transition...";
      await this.delay(500);

      // Step 2: Clean up current scene
      this.message.textContent = "Cleaning up game state...";
      this.logger.info("Cleaning up game state");

      // Clean up the scene
      if (this.scene) {
        this.scene.cleanupPlayerShip();
        this.scene.dispose();
      }
      await this.delay(500);

      // Step 3: Create new scene
      this.message.textContent = "Reinitializing scene...";
      this.logger.info("Creating new scene");

      // Create new scene (it will create its own canvas)
      this.newScene = new Scene();
      await this.delay(500);

      // Step 4: Initialize the new scene
      this.message.textContent = "Setting up background...";
      this.logger.info("Initializing new scene");
      await this.newScene.init();

      // Force multiple renders to ensure visibility
      this.newScene.render();
      await this.delay(100);
      this.newScene.render();

      // Step 5: Final message
      this.message.textContent = "Transition complete";
      this.logger.info("Transition sequence complete");

      // Short delay before completing
      await this.delay(500);

      // Remove transition screen
      document.body.removeChild(this.element);

      // Call completion callback
      onComplete();
    } catch (error) {
      this.logger.error("Error during transition:", error);
      this.message.textContent = "Error during transition";
      await this.delay(2000);
      document.body.removeChild(this.element);
      onComplete();
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Gets the new scene that was created during transition
   */
  getNewScene(): Scene | null {
    return this.newScene;
  }

  /**
   * Cleans up resources
   */
  dispose(): void {
    // Just clean up the DOM elements
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
