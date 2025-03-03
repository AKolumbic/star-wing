import { Scene } from "./Scene";
import { Input } from "./Input";
import { Menu } from "../ui/Menu";

export class Game {
  private scene: Scene;
  private input: Input;
  private menu: Menu;
  private isRunning: boolean = false;
  private lastTime: number = 0;
  private frameCount: number = 0;

  constructor() {
    this.scene = new Scene();
    this.input = new Input();
    this.menu = new Menu();
  }

  async init(): Promise<void> {
    // Initialize game systems
    await this.scene.init();
    this.input.init();
  }

  start(): void {
    if (this.isRunning) return;

    console.log("Game starting...");
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }

  private gameLoop = (): void => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
    this.lastTime = currentTime;
    this.frameCount++;

    // Log every 60 frames (roughly once per second)
    if (this.frameCount % 60 === 0) {
      console.log(`Frame ${this.frameCount}, Delta: ${deltaTime.toFixed(3)}s`);
    }

    // Update game state
    this.update(deltaTime);

    // Render frame
    this.render();

    // Request next frame
    requestAnimationFrame(this.gameLoop);
  };

  private update(deltaTime: number): void {
    // Always update the scene for background effects
    this.scene.update(deltaTime);

    // Only update game systems if menu is not visible
    if (!this.menu.isMenuVisible()) {
      console.log("Menu hidden, updating game state");
      this.input.update();
    } else {
      console.log("Menu visible, skipping game state update");
    }
  }

  private render(): void {
    this.scene.render();
  }

  stop(): void {
    console.log("Game stopping...");
    this.isRunning = false;
  }

  dispose(): void {
    this.menu.dispose();
    this.scene.dispose();
    this.input.dispose();
  }
}
