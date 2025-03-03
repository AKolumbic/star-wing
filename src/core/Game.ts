import { Scene } from "./Scene";
import { Input } from "./Input";

export class Game {
  private scene: Scene;
  private input: Input;
  private isRunning: boolean = false;
  private lastTime: number = 0;

  constructor() {
    this.scene = new Scene();
    this.input = new Input();
  }

  async init(): Promise<void> {
    // Initialize game systems
    await this.scene.init();
    this.input.init();
  }

  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }

  private gameLoop = (): void => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
    this.lastTime = currentTime;

    // Update game state
    this.update(deltaTime);

    // Render frame
    this.render();

    // Request next frame
    requestAnimationFrame(this.gameLoop);
  };

  private update(deltaTime: number): void {
    // Update game systems
    this.input.update();
    this.scene.update(deltaTime);
  }

  private render(): void {
    this.scene.render();
  }

  stop(): void {
    this.isRunning = false;
  }
}
