import { Scene } from "./Scene";
import { Input } from "./Input";
import { Menu } from "../ui/Menu";
import { AudioManager } from "../audio/AudioManager";
import { LoadingScreen } from "../ui/LoadingScreen";
import { TerminalBorder } from "../ui/TerminalBorder";

export class Game {
  private scene: Scene;
  private input: Input;
  private menu: Menu;
  private lastFrameTime: number = 0;
  private deltaTime: number = 0;
  private isRunning: boolean = false;
  private frameCount: number = 0;
  private audioManager: AudioManager;
  private animationFrameId: number = 0;
  private loadingScreen?: LoadingScreen;
  private canvas: HTMLCanvasElement;
  private terminalBorder: TerminalBorder;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;

    if (!this.canvas) {
      throw new Error(`Canvas with id ${canvasId} not found`);
    }

    this.audioManager = new AudioManager();
    this.scene = new Scene(this.canvas);
    this.input = new Input();
    this.menu = new Menu(this);

    // Initialize the loading screen
    this.showLoadingScreen();

    // Initialize the terminal border last so it appears on top
    this.terminalBorder = TerminalBorder.getInstance();
    this.terminalBorder.initialize();
  }

  private showLoadingScreen(): void {
    // Initialize the audio manager silently
    this.audioManager.initialize();

    // Create and show the loading screen
    this.loadingScreen = new LoadingScreen(() => {
      // This is called when the user clicks "execute program"
      this.init().then(() => {
        this.start();
      });
    }, this.audioManager);
  }

  async init(): Promise<void> {
    // Initialize game systems
    await this.scene.init();
    this.input.init();
    this.audioManager.initialize();
    this.audioManager.playMenuThump(); // Start the menu music
  }

  start(): void {
    console.log("Game starting...");
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.gameLoop();
  }

  private gameLoop = (): void => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    this.deltaTime = (currentTime - this.lastFrameTime) / 1000; // Convert to seconds
    this.lastFrameTime = currentTime;
    this.frameCount++;

    // Update game state
    this.update(this.deltaTime);

    // Render frame
    this.render();

    // Request next frame
    this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
  };

  private update(deltaTime: number): void {
    // Always update the scene for background effects
    this.scene.update(deltaTime);

    // Only update game systems if menu is not visible
    if (!this.menu.isMenuVisible()) {
      this.input.update();
    }
  }

  private render(): void {
    this.scene.render();
  }

  stop(): void {
    console.log("Game stopping...");
    this.isRunning = false;
    cancelAnimationFrame(this.animationFrameId);
  }

  public dispose(): void {
    console.log("Game disposing...");
    this.stop();

    // Dispose all systems
    if (this.terminalBorder) {
      this.terminalBorder.dispose();
    }

    if (this.scene) {
      this.scene.dispose();
    }

    if (this.input) {
      this.input.dispose();
    }

    if (this.menu) {
      this.menu.dispose();
    }

    if (this.audioManager) {
      this.audioManager.dispose();
    }
  }

  getAudioManager(): AudioManager {
    return this.audioManager;
  }
}
